import { useContext } from 'react';
import { CategoryContext } from '@/context/CategoryContext';

/** Active categories for navigation: { slug, name, description, image?, swatch? }[] */
export default function useCategoryList() {
  return useContext(CategoryContext).categories;
}
