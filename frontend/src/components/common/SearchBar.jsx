import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

/** Sends the visitor to the catalogue with ?search=term. */
export default function SearchBar({ className = '', onSearched, placeholder = 'Search fabrics, GSM, colour' }) {
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    onSearched?.();
  };

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">Search fabrics</label>
      <input
        id="site-search"
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-4 pr-11 bg-secondary border border-line rounded-fabric text-sm focus:border-primary outline-none"
      />
      <button type="submit" aria-label="Search" className="absolute right-0 top-0 h-11 w-11 grid place-items-center text-primary cursor-pointer bg-transparent border-0">
        <Search size={18} />
      </button>
    </form>
  );
}
