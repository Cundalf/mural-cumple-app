import { EventEmitter } from 'events';

// Crear emisor de eventos global que persista a través de hot reloads
const getEventEmitter = () => {
  // En desarrollo, usar globalThis para persistir a través de hot reloads
  if (process.env.NODE_ENV === 'development') {
    if (!(globalThis as any).__eventEmitter) {
      (globalThis as any).__eventEmitter = new EventEmitter();
      (globalThis as any).__eventEmitter.setMaxListeners(50);
    }
    return (globalThis as any).__eventEmitter;
  }
  
  // En producción, crear una instancia normal
  if (!(globalThis as any).__eventEmitter) {
    (globalThis as any).__eventEmitter = new EventEmitter();
    (globalThis as any).__eventEmitter.setMaxListeners(50);
  }
  return (globalThis as any).__eventEmitter;
};

const eventEmitter = getEventEmitter();

// Tipos de eventos
export const EVENT_TYPES = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_DELETED: 'message:deleted',
  MEDIA_UPLOADED: 'media:uploaded', 
  MEDIA_DELETED: 'media:deleted',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Funciones para emitir eventos
export const emitMessageCreated = (message: any) => {
  eventEmitter.emit(EVENT_TYPES.MESSAGE_CREATED, message);
};

export const emitMessageDeleted = (messageId: string) => {
  const data = { id: messageId };
  eventEmitter.emit(EVENT_TYPES.MESSAGE_DELETED, data);
};

export const emitMediaUploaded = (media: any) => {
  eventEmitter.emit(EVENT_TYPES.MEDIA_UPLOADED, media);
};

export const emitMediaDeleted = (mediaId: string) => {
  const data = { id: mediaId };
  eventEmitter.emit(EVENT_TYPES.MEDIA_DELETED, data);
};

export default eventEmitter; 