import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';

const PDF_HEADER = '%PDF-';

export function sheetDirectory(): string {
  return resolve(process.cwd(), 'uploads', 'sheets');
}

export function assertPdf(file: { originalname: string; buffer: Buffer; size: number } | undefined): asserts file is {
  originalname: string;
  buffer: Buffer;
  size: number;
} {
  if (!file || file.size === 0) {
    throw new Error('Choisissez un fichier PDF.');
  }
  const name = file.originalname.toLowerCase();
  const header = file.buffer.subarray(0, PDF_HEADER.length).toString('latin1');
  if (!name.endsWith('.pdf') || header !== PDF_HEADER) {
    throw new Error('Seuls les fichiers PDF sont acceptés.');
  }
}

export async function storeSheet(buffer: Buffer): Promise<string> {
  const directory = sheetDirectory();
  await mkdir(directory, { recursive: true });
  const storedName = `${randomUUID()}.pdf`;
  await writeFile(join(directory, storedName), buffer);
  return storedName;
}

export async function removeSheetFile(storedName: string): Promise<void> {
  const path = sheetPath(storedName);
  if (!path) return;
  await unlink(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

export function openSheetFile(storedName: string) {
  const path = sheetPath(storedName);
  if (!path) return null;
  return createReadStream(path);
}

export function downloadName(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() ?? 'feuille.pdf';
  const cleaned = base.replace(/[^\w.\- ()\u00C0-\u024F]+/g, '_').slice(0, 120);
  const named = cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
  return named.replace(/^\.+/, '') || 'feuille.pdf';
}

export function contentDisposition(name: string): string {
  const safe = downloadName(name);
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function sheetPath(storedName: string): string | null {
  if (!/^[0-9a-f-]{36}\.pdf$/i.test(storedName)) return null;
  const directory = sheetDirectory();
  const path = resolve(directory, storedName);
  if (!path.startsWith(directory + sep)) return null;
  return path;
}
