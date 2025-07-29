import { NextRequest, NextResponse } from 'next/server';
import { mediaQueries } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { emitMediaUploaded } from '@/lib/events';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'uploads');
    
    // Crear directorio si no existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (file.size === 0) continue;

      // Generar nombre único para el archivo
      const id = uuidv4();
      const extension = file.name.split('.').pop() || '';
      const filename = `${id}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Convertir archivo a buffer y guardarlo
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Determinar tipo de archivo
      const type = file.type.startsWith('image/') ? 'image' : 'video';

      // Guardar en base de datos
      mediaQueries.insert(id, filename, file.name, type, file.size);

      const uploadedFile = {
        id,
        filename,
        original_name: file.name,
        type,
        size: file.size,
        timestamp: new Date().toISOString(),
        url: `/api/media/serve/${id}`
      };

      uploadedFiles.push(uploadedFile);
      
      // Emitir evento para tiempo real (individual para cada archivo)
      emitMediaUploaded(uploadedFile);
    }

    return NextResponse.json(uploadedFiles, { status: 201 });
  } catch (error) {
    console.error('Error al subir archivos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Configurar límites de tamaño
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 