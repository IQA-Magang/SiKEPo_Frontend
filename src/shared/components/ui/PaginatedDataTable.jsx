import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';

export default function PaginatedDataTable({
  rows = [],
  columns = [],
  pagination = {},
  children,
  ...tableProps
}) {
  const safePagination = {
    currentPage: 1,
    setCurrentPage: () => {},
    startIndex: 0,
    endIndex: rows.length,
    totalPages: 1,
    ...pagination,
  };

  const pageRows = rows.slice(safePagination.startIndex, safePagination.endIndex);

  return (
    <>
      <DataTable {...tableProps} columns={columns} rows={pageRows} />
      {children}
      <Pagination
        totalItems={rows.length}
        currentPage={safePagination.currentPage}
        onPageChange={safePagination.setCurrentPage}
        startIndex={safePagination.startIndex}
        endIndex={safePagination.endIndex}
        totalPages={safePagination.totalPages}
      />
    </>
  );
}
