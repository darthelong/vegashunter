/**
 * Author registry — loads data/authors/*.yaml at build time, validates with
 * Zod (AuthorSchema), exposes lookup helpers + the full Person JSON-LD.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { AuthorSchema, type Author } from './schemas';
import { SITE_URL } from './locales';

const DIR = resolve(process.cwd(), 'data/authors');

const AUTHORS = new Map<string, Author>();
{
  for (const file of readdirSync(DIR)) {
    if (!file.endsWith('.yaml')) continue;
    const raw = readFileSync(resolve(DIR, file), 'utf-8');
    const parsed = parseYaml(raw);
    const result = AuthorSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid author in ${file}:\n${result.error.issues
          .map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
      );
    }
    if (AUTHORS.has(result.data.slug)) {
      throw new Error(`Duplicate author slug "${result.data.slug}" in ${file}`);
    }
    AUTHORS.set(result.data.slug, result.data);
  }
}

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.get(slug);
}
export function requireAuthor(slug: string): Author {
  const a = AUTHORS.get(slug);
  if (!a) throw new Error(`Author "${slug}" not found in data/authors/`);
  return a;
}
export function allAuthors(): Author[] {
  return Array.from(AUTHORS.values());
}

export function authorJsonLd(author: Author) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio,
    image: `${SITE_URL}${author.avatar}`,
    jobTitle: author.role,
    url: `${SITE_URL}/en/authors/${author.slug}/`,
    sameAs: author.same_as,
  };
}
