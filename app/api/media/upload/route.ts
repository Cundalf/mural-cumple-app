import { NextRequest, NextResponse } from 'next/server';
import { mediaQueries } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { emitMediaUploaded } from '@/lib/events';

// Configurar límite de tamaño para archivos grandes
export const maxDuration = 300; // 5 minutos para procesar archivos grandes

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos' }, { status: 400 });
    }

    // Validar tamaño de archivos (100MB máximo)
    const maxSize = 100 * 1024 * 1024; // 100MB (límite Cloudflare)
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `El archivo ${file.name} es demasiado grande. Tamaño máximo: 100MB` 
        }, { status: 413 });
      }
      
      // Validar tipo de archivo
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!isValidType) {
        return NextResponse.json({ 
          error: `El archivo ${file.name} no es válido. Solo se permiten imágenes y videos.` 
        }, { status: 400 });
      }
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