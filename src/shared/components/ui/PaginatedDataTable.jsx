import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';

export default function PaginatedDataTable({
  rows,
  columns,
  pagination,
  children,
  ...tableProps
}) {
  const pageRows = rows.slice(pagination.startIndex, pagination.endIndex);

  return (
    <>
      <DataTable {...tableProps} columns={columns} rows={pageRows} />
      {children}
      <Pagination
        totalItems={rows.length}
        currentPage={pagination.currentPage}
        onPageChange={pagination.setCurrentPage}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        totalPages={pagination.totalPages}
      />
    </>
  );
}
