import { NextRequest, NextResponse } from 'next/server';
import { mediaQueries, MediaFile } from '@/lib/database';
import { emitMediaDeleted } from '@/lib/events';

// GET - Obtener todos los archivos multimedia
export async function GET() {
  try {
    const mediaFiles = mediaQueries.getAll();
    
    // Agregar la URL completa para cada archivo
    const mediaWithUrls = mediaFiles.map(file => ({
      ...file,
      url: `/api/media/serve/${file.id}`
    }));

    return NextResponse.json(mediaWithUrls);
  } catch (error) {
    console.error('Error al obtener archivos multimedia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un archivo multimedia
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Obtener información del archivo antes de eliminarlo
    const file = mediaQueries.getById(id);
    
    // Eliminar registro de la base de datos PRIMERO
    mediaQueries.delete(id);
    
    // Emitir evento para tiempo real INMEDIATAMENTE después de eliminar de BD
    emitMediaDeleted(id);
    
    // Intentar eliminar archivo físico (sin bloquear el tiempo real)
    if (file) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'uploads', file.filename);
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error);
        // No lanzamos error aquí porque ya eliminamos de BD y emitimos evento
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 