import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'shop.db');
const BACKUP_DIR = path.join(__dirname, '..', '..', 'storage', 'backups');

export function createDatabaseBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  fs.copyFileSync(DB_PATH, backupPath);

  return {
    filename: backupFileName,
    path: backupPath,
    createdAt: new Date().toISOString(),
    size: fs.statSync(backupPath).size,
  };
}

export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR);
  return files
    .filter(f => f.endsWith('.db'))
    .map(filename => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        createdAt: stat.mtime.toISOString(),
        size: stat.size,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
