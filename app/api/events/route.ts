import { NextRequest } from 'next/server';
import eventEmitter, { EVENT_TYPES } from '@/lib/events';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const types = searchParams.get('types')?.split(',') || Object.values(EVENT_TYPES);

  // Crear stream de respuesta
  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;

      // Función para enviar eventos
      const sendEvent = (event: string, data: any) => {
        if (!isActive) return;
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          console.error('Error enviando evento SSE:', error);
        }
      };

      // Enviar evento inicial de conexión
      sendEvent('connected', { timestamp: new Date().toISOString() });

      // Registrar listeners para los tipos de eventos solicitados
      const listeners: Array<() => void> = [];

      if (types.includes(EVENT_TYPES.MESSAGE_CREATED)) {
        const listener = (message: any) => {
          if (!isActive) return;
          sendEvent('message:created', message);
        };
        eventEmitter.on(EVENT_TYPES.MESSAGE_CREATED, listener);
        listeners.push(() => eventEmitter.off(EVENT_TYPES.MESSAGE_CREATED, listener));
      }

      if (types.includes(EVENT_TYPES.MESSAGE_DELETED)) {
        const listener = (data: any) => {
          if (!isActive) return;
          sendEvent('message:deleted', data);
        };
        eventEmitter.on(EVENT_TYPES.MESSAGE_DELETED, listener);
        listeners.push(() => eventEmitter.off(EVENT_TYPES.MESSAGE_DELETED, listener));
      }

      if (types.includes(EVENT_TYPES.MEDIA_UPLOADED)) {
        const listener = (media: any) => {
          if (!isActive) return;
          sendEvent('media:uploaded', media);
        };
        eventEmitter.on(EVENT_TYPES.MEDIA_UPLOADED, listener);
        listeners.push(() => eventEmitter.off(EVENT_TYPES.MEDIA_UPLOADED, listener));
      }

      if (types.includes(EVENT_TYPES.MEDIA_DELETED)) {
        const listener = (data: any) => {
          if (!isActive) return;
          sendEvent('media:deleted', data);
        };
        eventEmitter.on(EVENT_TYPES.MEDIA_DELETED, listener);
        listeners.push(() => eventEmitter.off(EVENT_TYPES.MEDIA_DELETED, listener));
      }

      // Confirmar que los listeners están registrados
      setTimeout(() => {
        if (isActive) {
          sendEvent('ready', { status: 'listeners_registered' });
        }
      }, 100);

      // Heartbeat para mantener la conexión viva
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 30000); // Cada 30 segundos

      // Cleanup cuando se cierra la conexión
      const cleanup = () => {
        if (!isActive) return;
        isActive = false;
        clearInterval(heartbeatInterval);
        listeners.forEach(cleanup => cleanup());
        try {
          controller.close();
        } catch (error) {
          // Ignorar errores al cerrar
        }
      };

      // Escuchar señal de abort
      request.signal.addEventListener('abort', cleanup);

      // También limpiar después de un tiempo si la conexión se cuelga
      setTimeout(() => {
        if (isActive && request.signal.aborted) {
          cleanup();
        }
      }, 300000); // 5 minutos

    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Content-Encoding': 'identity',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 