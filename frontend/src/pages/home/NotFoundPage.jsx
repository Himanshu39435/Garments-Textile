import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl md:text-5xl">This page is not available yet</h1>
      <p className="mt-4 text-ink/75 max-w-md mx-auto">The address may be wrong, or the page is still being built. Try the fabric catalogue or head back home.</p>
      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        <Link to="/" className="btn-primary no-underline">Back to home</Link>
        <Link to="/contact" className="btn-outline no-underline">Contact us</Link>
      </div>
    </div>
  );
}
