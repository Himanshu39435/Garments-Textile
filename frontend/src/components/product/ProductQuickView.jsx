import { Link } from 'react-router-dom';
import { Modal } from 'antd';
import FabricSwatch from '@/components/common/FabricSwatch';
import ProductPrice from '@/components/product/ProductPrice';
import BulkPricingTable from '@/components/product/BulkPricingTable';
import { getLowestBulkPrice } from '@/utils/pricing';

/** Modal preview opened from a product card. */
export default function ProductQuickView({ product, onClose }) {
  return (
    <Modal open={Boolean(product)} onCancel={onClose} footer={null} width={820} destroyOnHidden title={product?.name}>
      {product && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-[4/5] bg-secondary p-5">
            {product.images?.[0] ? <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" /> : <FabricSwatch swatch={product.swatch} className="h-full w-full" />}
          </div>
          <div className="flex flex-col gap-4">
            <p className="m-0 text-sm text-ink/60">{product.category?.name} · SKU {product.sku}</p>
            <p className="m-0">{product.composition}, {product.gsm} GSM, {product.width} in wide</p>
            <ProductPrice price={product.price} moq={product.moq} bulkPrice={getLowestBulkPrice(product)} />
            <BulkPricingTable product={product} />
            <div className="mt-auto flex flex-wrap gap-3">
              <Link to={`/products/${product.slug}`} className="btn-primary no-underline" onClick={onClose}>View full details</Link>
              <Link to={`/quote?product=${product.slug}`} className="btn-outline no-underline" onClick={onClose}>Request quote</Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
