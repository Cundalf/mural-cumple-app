import { NextRequest, NextResponse } from 'next/server';
import { mediaQueries, MediaFile } from '@/lib/database';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar archivo en la base de datos
    const file = mediaQueries.getById(id);

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    // Ruta del archivo
    const filepath = join(process.cwd(), 'uploads', file.filename);

    // Verificar si el archivo existe
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Archivo físico no encontrado' }, { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = await readFile(filepath);

    // Determinar tipo MIME
    const mimeType = file.type === 'image' 
      ? `image/${file.filename.split('.').pop()}` 
      : `video/${file.filename.split('.').pop()}`;

    // Retornar el archivo con headers apropiados
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': file.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error al servir archivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 