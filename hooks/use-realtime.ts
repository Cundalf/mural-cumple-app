import { useEffect, useRef, useCallback } from 'react';

interface RealtimeEventHandlers {
  onMessageCreated?: (message: any) => void;
  onMessageDeleted?: (data: { id: string }) => void;
  onMediaUploaded?: (media: any) => void;
  onMediaDeleted?: (data: { id: string }) => void;
  onConnected?: () => void;
}

export const useRealtime = (handlers: RealtimeEventHandlers) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const handlersRef = useRef(handlers);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Actualizar handlers ref cuando cambien
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    // Verificar si EventSource está disponible
    if (typeof EventSource === 'undefined') {
      console.warn('EventSource no está disponible en este navegador');
      return;
    }

    // Limpiar conexión anterior si existe
    disconnect();

    try {
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      // Manejar conexión exitosa
      eventSource.addEventListener('connected', (event) => {
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0; // Reset intentos al conectar exitosamente
        handlersRef.current.onConnected?.();
      });

      // Manejar evento ready (listeners completamente registrados)
      eventSource.addEventListener('ready', (event) => {
        // Listeners registrados - todo listo
      });

      // Manejar heartbeat para mantener conexión viva
      eventSource.addEventListener('heartbeat', (event) => {
        // Conexión activa
      });

      // Manejar eventos de mensajes
      eventSource.addEventListener('message:created', (event) => {
        try {
          const message = JSON.parse(event.data);
          handlersRef.current.onMessageCreated?.(message);
        } catch (error) {
          console.error('Error procesando mensaje creado:', error);
        }
      });

      eventSource.addEventListener('message:deleted', (event) => {
        try {
          const data = JSON.parse(event.data);
          handlersRef.current.onMessageDeleted?.(data);
        } catch (error) {
          console.error('Error procesando mensaje eliminado:', error);
        }
      });

      // Manejar eventos de media
      eventSource.addEventListener('media:uploaded', (event) => {
        try {
          const media = JSON.parse(event.data);
          handlersRef.current.onMediaUploaded?.(media);
        } catch (error) {
          console.error('Error procesando media subida:', error);
        }
      });

      eventSource.addEventListener('media:deleted', (event) => {
        try {
          const data = JSON.parse(event.data);
          handlersRef.current.onMediaDeleted?.(data);
        } catch (error) {
          console.error('Error procesando media eliminada:', error);
        }
      });

      // Manejar errores y reconexión
      eventSource.onerror = (error) => {
        console.error('Error en EventSource:', error);
        isConnectedRef.current = false;
        
        // Reconexión automática con backoff exponencial
        if (eventSource.readyState === EventSource.CLOSED) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('Máximo número de intentos de reconexión alcanzado');
          }
        }
      };

      // Manejar cierre de la pestaña/navegador
      const handleBeforeUnload = () => {
        disconnect();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };

    } catch (error) {
      console.error('Error creando EventSource:', error);
    }
  }, [disconnect]);

  useEffect(() => {
    connect();

    // Cleanup al desmontar el componente
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    disconnect,
    reconnect: connect,
    isConnected: () => isConnectedRef.current
  };
}; 