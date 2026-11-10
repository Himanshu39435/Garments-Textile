import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

/** Public storefront shell: header, page content, footer. */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-3">Skip to content</a>
      <Header />
      <main id="main-content" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
