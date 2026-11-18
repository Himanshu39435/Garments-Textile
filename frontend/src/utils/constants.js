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
  { slug: 'pnt', name: 'PNT', description: 'Wholesale PNT manufactured with in-house cutting, stitching and finishing.', swatch: { type: 'cotton', color: '#CBBFA3', accent: '#8F7647' } },
  { slug: 'kurti', name: 'Kurti', description: 'Wholesale Kurtis developed for repeat collections and retail-ready size mixes.', swatch: { type: 'printed', color: '#E7C9C0', accent: '#8F7647' } },
  { slug: 'kp-kurti-pant', name: 'KP (Kurti Pant)', description: 'Coordinated two-piece wholesale set with one Kurti and matching Pant.', swatch: { type: 'printed', color: '#D7C6B4', accent: '#8F7647' } },
  { slug: 'kurti-set', name: 'Kurti Set (3 Pcs)', description: 'Complete 3-piece set: Kurti, PNT and Dupatta, packed for wholesale dispatch.', swatch: { type: 'embroidered', color: '#F3E8D0', accent: '#B89A65' } },
  { slug: 'co-ord-set', name: 'Co-ord Set', description: 'Coordinated wholesale sets with matching tops and bottoms for everyday and occasion collections.', swatch: { type: 'printed', color: '#D7C6B4', accent: '#8F7647' } },
  { slug: 'frock', name: 'Frock', description: 'Comfortable and retail-ready frocks for seasonal and everyday wholesale collections.', swatch: { type: 'printed', color: '#E7C9C0', accent: '#8F7647' } },
  { slug: 'cotton-collection', name: 'Cotton Collection', description: 'Breathable cotton wholesale styles for everyday collections.', swatch: { type: 'cotton', color: '#EFE9DA', accent: '#B89A65' } },
  { slug: 'festive-collection', name: 'Festive Collection', description: 'Embroidered and occasion-ready styles for seasonal wholesale buying.', swatch: { type: 'embroidered', color: '#E7C9C0', accent: '#B89A65' } },
];

export const FABRIC_CATEGORIES = FABRIC_CATEGORY_DETAILS.map((c) => c.name);

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const QUOTATION_STATUSES = ['requested', 'approved', 'rejected', 'cancelled', 'converted', 'expired'];

export const GST_RATE_PERCENT = 5; // default for fabrics; overridable in admin settings (Phase 7+)
