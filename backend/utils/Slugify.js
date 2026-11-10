/** "Cotton Poplin (Plain)" -> "cotton-poplin-plain" */
export const slugify = (text) => text.toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';

/** Returns `base`, or `base-2`, `base-3`... until `exists(slug)` is false. */
export async function uniqueSlug(base, exists) {
  let slug = base;
  for (let n = 2; await exists(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}
