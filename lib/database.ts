import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Interfaces TypeScript
export interface Message {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  color: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  type: 'image' | 'video';
  size: number;
  timestamp: string;
}

// Singleton para la conexión de base de datos
class DatabaseConnection {
  private db: Database.Database | null = null;
  private initialized = false;

  private getDb(): Database.Database {
    if (!this.db) {
      // Crear carpeta db si no existe
      const dbDir = join(process.cwd(), 'db');
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
      
      const dbPath = join(dbDir, 'database.sqlite');
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.initializeTables();
    }
    return this.db;
  }

  private initializeTables(): void {
    if (this.initialized) return;

    const db = this.getDb();
    
    // Crear tablas
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        color TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.initialized = true;
  }

  // Funciones para mensajes
  getAllMessages(): Message[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC');
    return stmt.all() as Message[];
  }

  insertMessage(id: string, text: string, author: string, color: string): void {
    const db = this.getDb();
    const stmt = db.prepare('INSERT INTO messages (id, text, author, color) VALUES (?, ?, ?, ?)');
    stmt.run(id, text, author, color);
  }

  deleteMessage(id: string): void {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    stmt.run(id);
  }

  // Funciones para archivos multimedia
  getAllMedia(): MediaFile[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM media_files ORDER BY timestamp DESC');
    return stmt.all() as MediaFile[];
  }

  insertMedia(id: string, filename: string, originalName: string, type: string, size: number): void {
    const db = this.getDb();
    const stmt = db.prepare('INSERT INTO media_files (id, filename, original_name, type, size) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, filename, originalName, type, size);
  }

  deleteMedia(id: string): void {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM media_files WHERE id = ?');
    stmt.run(id);
  }

  getMediaById(id: string): MediaFile | undefined {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM media_files WHERE id = ?');
    return stmt.get(id) as MediaFile | undefined;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Exportar instancia singleton
const dbConnection = new DatabaseConnection();

// Funciones de conveniencia para mantener compatibilidad con el código existente
export const messageQueries = {
  getAll: () => dbConnection.getAllMessages(),
  insert: (id: string, text: string, author: string, color: string) => dbConnection.insertMessage(id, text, author, color),
  delete: (id: string) => dbConnection.deleteMessage(id),
};

export const mediaQueries = {
  getAll: () => dbConnection.getAllMedia(),
  insert: (id: string, filename: string, originalName: string, type: string, size: number) => 
    dbConnection.insertMedia(id, filename, originalName, type, size),
  delete: (id: string) => dbConnection.deleteMedia(id),
  getById: (id: string) => dbConnection.getMediaById(id),
};

export default dbConnection; 