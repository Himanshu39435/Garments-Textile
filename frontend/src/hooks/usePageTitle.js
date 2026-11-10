import { useEffect } from 'react';
import { BRAND } from '@/utils/constants';

/** Sets the browser tab title: "Page | NARANG TEXTILE". */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND.name}` : `${BRAND.name} | Wholesale Fabrics`;
  }, [title]);
}
