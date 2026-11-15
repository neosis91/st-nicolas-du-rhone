import { BadRequestException } from '@nestjs/common';

export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
  return slug || 'element';
}

export function phoneHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const compact = phone.replace(/[^\d+]/g, '');
  if (compact.startsWith('0')) return `tel:+33${compact.slice(1)}`;
  if (compact.startsWith('+')) return `tel:${compact}`;
  return `tel:+${compact}`;
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

const SAFE_URL = /^(https?:\/\/|mailto:|\/)/i;

export function assertSafeUrl(value: string, label: string): void {
  if (!SAFE_URL.test(value.trim())) {
    throw new BadRequestException(
      `${label} doit commencer par http://, https://, mailto: ou /.`,
    );
  }
}
