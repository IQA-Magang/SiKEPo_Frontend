import React from 'react';

export default function DataTable({
  columns,
  rows,
  rowKey,
  rowProps,
  className = '',
  wrapperClassName = '',
  emptyMessage = 'Tidak ada data.',
}) {
  return (
    <div className={`table-wrapper ${wrapperClassName}`.trim()}>
      <table className={`data-table ${className}`.trim()}>
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
                colSpan={columns.length}
                style={{
                  padding: 'var(--sp-6)',
                  textAlign: 'center',
                  color: 'var(--clr-dark-500)',
                }}
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
                    {column.render
                      ? column.render(row, index)
                      : row[column.key]}
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
