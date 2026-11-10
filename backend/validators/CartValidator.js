const isWholeNumber = (v) => Number.isInteger(v) && v >= 1 && v <= 1000000;

/** POST /api/cart/items. Only a product id and a quantity are accepted: prices are never taken from the client. */
export function validateAddToCart({ productId, quantity }) {
  const errors = [];
  if (typeof productId !== 'string' || !/^[a-f\d]{24}$/i.test(productId)) errors.push({ field: 'productId', message: 'Invalid product' });
  if (!isWholeNumber(quantity)) errors.push({ field: 'quantity', message: 'Quantity must be a whole number of metres, 1 or more' });
  return errors;
}

/** PUT /api/cart/items/:productId */
export function validateUpdateCartItem({ quantity }) {
  return isWholeNumber(quantity) ? [] : [{ field: 'quantity', message: 'Quantity must be a whole number of metres, 1 or more' }];
}
