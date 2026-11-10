import { Pagination as AntPagination } from 'antd';

/** Page switcher. Scrolls to the top of the results when the page changes. */
export default function Pagination({ page, pageSize, total, onChange }) {
  if (!total || total <= pageSize) return null;
  return (
    <div className="flex justify-center mt-10">
      <AntPagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger={false}
        responsive
        onChange={(next) => { onChange(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />
    </div>
  );
}
