import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE = 10;

export function usePagination(totalItems, resetKey = '') {
  const [requestedPage, setRequestedPage] = useState(1);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  useEffect(() => {
    setRequestedPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (requestedPage > Math.max(totalPages, 1)) {
      setRequestedPage(Math.max(totalPages, 1));
    }
  }, [requestedPage, totalPages]);

  return {
    currentPage,
    setCurrentPage: setRequestedPage,
    startIndex,
    endIndex: Math.min(startIndex + PAGE_SIZE, totalItems),
    totalPages,
  };
}

export default function Pagination({ totalItems, currentPage, onPageChange, startIndex, endIndex, totalPages }) {
  if (totalItems === 0) return null;

  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index
  );

  return (
    <div className="pagination-footer">
      <span className="pagination-summary">
        Menampilkan <strong>{startIndex + 1}-{endIndex}</strong> dari <strong>{totalItems}</strong> data
      </span>
      {totalPages > 1 && (
        <nav className="pagination-controls" aria-label="Navigasi halaman">
          <button
            type="button"
            className="pagination-button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              className={`pagination-button${page === currentPage ? ' is-active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Halaman ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="pagination-button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
