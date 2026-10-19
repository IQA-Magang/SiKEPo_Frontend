import React from 'react';

export default function DataTable({
  columns = [],
  rows = [],
  rowKey,
  rowProps,
  className = '',
  wrapperClassName = '',
  emptyMessage = 'Tidak ada data.',
  ariaLabel,
  dense = false,
}) {
  const tableClassName = ['ui-table', 'data-table', dense ? 'ui-table--dense' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['table-wrapper', 'ui-table-wrapper', wrapperClassName].filter(Boolean).join(' ')}>
      <table className={tableClassName} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.headerClassName}
                style={column.headerStyle}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                className="ui-table__empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : row.id ?? index}
                {...(rowProps ? rowProps(row, index) : {})}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName}
                    style={column.cellStyle}
                    {...(column.cellProps ? column.cellProps(row, index) : {})}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
