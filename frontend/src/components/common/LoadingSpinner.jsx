import { Spin } from 'antd';

/** Centered spinner. Use `fullPage` for route-level loading. */
export default function LoadingSpinner({ fullPage = false, label = 'Loading' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${fullPage ? 'min-h-[60vh]' : 'py-10'}`}
    >
      <Spin size="large" />
    </div>
  );
}
