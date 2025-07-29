import { NextRequest, NextResponse } from 'next/server';
import { messageQueries, Message } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { emitMessageCreated, emitMessageDeleted } from '@/lib/events';

// GET - Obtener todos los mensajes
export async function GET() {
  try {
    const messages = messageQueries.getAll();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear un nuevo mensaje
export async function POST(request: NextRequest) {
  try {
    const { text, author, color } = await request.json();

    if (!text || !author || !color) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const id = uuidv4();
    messageQueries.insert(id, text.trim(), author.trim(), color);

    const newMessage = {
      id,
      text: text.trim(),
      author: author.trim(),
      color,
      timestamp: new Date().toISOString()
    };

    // Emitir evento para tiempo real
    emitMessageCreated(newMessage);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un mensaje
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    messageQueries.delete(id);
    
    // Emitir evento para tiempo real
    emitMessageDeleted(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 