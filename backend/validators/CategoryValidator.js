const text = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

/** Create or update a category (admin). */
export function validateCategoryInput(b) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  if (!text(b.name, 2, 80)) add('name', 'Enter the category name (2 to 80 characters)');
  if (b.slug !== undefined && b.slug !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug)) add('slug', 'Slug can use lowercase letters, numbers and single hyphens');
  if (b.description !== undefined && (typeof b.description !== 'string' || b.description.length > 300)) add('description', 'Description must be 300 characters or fewer');
  if (b.sortOrder !== undefined && !Number.isInteger(b.sortOrder)) add('sortOrder', 'Sort order must be a whole number');
  if (b.isActive !== undefined && typeof b.isActive !== 'boolean') add('isActive', 'isActive must be true or false');
  if (b.image !== undefined && b.image !== null && (typeof b.image.url !== 'string' || !/^https?:\/\//.test(b.image.url))) add('image', 'Image needs a web address');
  return errors;
}
