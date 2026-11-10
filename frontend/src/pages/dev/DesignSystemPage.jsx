import { useEffect, useState } from 'react';
import { Button, Input, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Scissors, Truck } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import apiClient from '@/services/api/apiClient';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { BRAND, FABRIC_CATEGORIES } from '@/utils/constants';

const PALETTE = [
  { name: 'Primary', hex: '#142B3B', className: 'bg-primary text-white' },
  { name: 'Secondary', hex: '#F8F6F1', className: 'bg-secondary text-ink border border-line' },
  { name: 'Accent', hex: '#B89A65', className: 'bg-accent text-primary' },
  { name: 'Text', hex: '#252525', className: 'bg-ink text-white' },
  { name: 'White', hex: '#FFFFFF', className: 'bg-white text-ink border border-line' },
];

/** Dev-only reference page at /design-system. Remove from AppRoutes.jsx before launch if not wanted. */
export default function DesignSystemPage() {
  const [api, setApi] = useState({ state: 'loading' });

  useEffect(() => {
    apiClient.get('/health').then((r) => setApi({ state: 'ok', data: r.data })).catch((e) => setApi({ state: 'error', message: e.message }));
  }, []);

  return (
    <main>
      <section className="weave text-white">
        <div className="container-page py-16 md:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="!text-white text-4xl md:text-6xl max-w-3xl"
          >
            {BRAND.name}
          </motion.h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">{BRAND.tagline}. Design system and platform check.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn-accent"><Scissors size={18} /> Request a quote</button>
            <button className="btn bg-transparent text-white border-white/60 hover:bg-white hover:text-primary"><Truck size={18} /> Wholesale terms</button>
          </div>
        </div>
      </section>

      <div className="container-page py-12 space-y-12">
        <section>
          <h2 className="text-2xl mb-4">Colour</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PALETTE.map((c) => (
              <div key={c.name} className={`${c.className} rounded-fabric p-4 h-28 flex flex-col justify-end`}>
                <strong>{c.name}</strong><span className="text-sm opacity-80">{c.hex}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl mb-4">Type</h2>
            <p className="font-display text-4xl text-primary">Fraunces for headings</p>
            <p className="mt-2 text-lg">Hanken Grotesk for body text, tables and forms. Prices like {formatCurrency(1234567.5)} and dates like {formatDate('2026-11-03')} use shared formatters.</p>
          </div>
          <div>
            <h2 className="text-2xl mb-4">Controls</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <button className="btn-primary">Add to cart</button>
              <button className="btn-outline">View details</button>
              <Button type="primary">Ant Design primary</Button>
            </div>
            <Input placeholder="Search fabrics" />
            <div className="mt-4 flex flex-wrap gap-2">{FABRIC_CATEGORIES.map((c) => <Tag key={c}>{c}</Tag>)}</div>
          </div>
        </section>

        <section className="surface p-6">
          <h2 className="text-2xl mb-4">Backend connection</h2>
          {api.state === 'loading' && <LoadingSpinner />}
          {api.state === 'error' && <ErrorMessage title="Cannot reach the API" message={api.message} onRetry={() => window.location.reload()} />}
          {api.state === 'ok' && (
            <p>API status: <strong>{api.data.status}</strong>. Database: <strong>{api.data.database}</strong>.</p>
          )}
        </section>
      </div>
    </main>
  );
}
