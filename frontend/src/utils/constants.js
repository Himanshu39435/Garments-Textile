export const BRAND = { name: 'NARANG TEXTILE', tagline: 'Manufactured wholesale wear for growing brands' };

/** PLACEHOLDER contact details. Replace with real company details before launch. */
export const CONTACT = {
  phone: '+91 9525206883',
  phoneHref: 'tel:+919525206883',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '916205138009',
  whatsappHref: `https://wa.me/${(import.meta.env.VITE_WHATSAPP_NUMBER || '916205138009').replace(/\D/g, '')}`,
  email: 'sales@himanshutextile.com',
  address: 'Plot No. 7, Mahaveer Nagar C, Sanganer, Jaipur, Rajasthan 302029',
  hours: 'Mon to Sat, 10:00 to 19:00 IST',
  gstin: '076AABCN1234C1Z5',
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const TOKEN_STORAGE_KEY = 'narang_token';

export const ROLES = { CUSTOMER: 'customer', STAFF: 'staff', ADMIN: 'admin' };

/** Each role has its own dashboard. The server enforces the same split on every API route. */
export const ROLE_HOME = { admin: '/admin', staff: '/staff', customer: '/account' };
export const roleHome = (role) => ROLE_HOME[role] ?? '/';
export const ROLE_LABEL = { admin: 'Admin', staff: 'Staff', customer: 'Customer' };

/**
 * Single source of truth for fabric categories (header, mega menu, footer, home page).
 * `swatch` drives the generated fabric texture until real photography is added.
 */
export const FABRIC_CATEGORY_DETAILS = [
  { slug: 'cotton', name: 'Cotton Fabrics', description: 'Voile, poplin and mulmul for everyday garments.', swatch: { type: 'cotton', color: '#E9E3D3', accent: '#B89A65' } },
  { slug: 'printed', name: 'Printed Fabrics', description: 'Block, screen and digital prints in repeat lengths.', swatch: { type: 'printed', color: '#F3E8D0', accent: '#142B3B' } },
  { slug: 'embroidered', name: 'Embroidered Fabrics', description: 'Schiffli and thread work on cotton and georgette.', swatch: { type: 'embroidered', color: '#F4F0E6', accent: '#B89A65' } },
  { slug: 'linen', name: 'Linen Fabrics', description: 'Pure and washed linen with a natural slub.', swatch: { type: 'linen', color: '#CBBFA3', accent: '#8F7647' } },
  { slug: 'blended', name: 'Blended Fabrics', description: 'Cotton-poly, linen-cotton and viscose blends.', swatch: { type: 'blended', color: '#8A9BA6', accent: '#142B3B' } },
];

export const FABRIC_CATEGORIES = FABRIC_CATEGORY_DETAILS.map((c) => c.name);

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const QUOTATION_STATUSES = ['requested', 'approved', 'rejected', 'cancelled', 'converted', 'expired'];

export const GST_RATE_PERCENT = 5; // default for fabrics; overridable in admin settings (Phase 7+)
