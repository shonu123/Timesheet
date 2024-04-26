import React, { useEffect } from 'react';
import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter } from 'react-table';

const MyDataTable = ({ columns, data }) => {
  useEffect(() => {
    const headerCell = document.querySelector('.header-cell');
    if (headerCell) {
      const firstColumnWidth = (headerCell as HTMLElement).offsetWidth;
      document.documentElement.style.setProperty('--width-of-first-column', `${firstColumnWidth}px`);
    }
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useBlockLayout // Enables block layout to support column freezing
  );

  const { globalFilter } = state;

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <div {...getTableProps()} className="table">
        <div className="header">
          {headerGroups.map(headerGroup => (
            <div {...headerGroup.getHeaderGroupProps()} className="header-row">
              {headerGroup.headers.map((column, columnIndex) => (
                <div
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={`header-cell ${columnIndex < 2 ? 'frozen' : ''}`}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div {...getTableBodyProps()} className="body">
          {rows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <div {...row.getRowProps()} className="body-row">
                {row.cells.map((cell, cellIndex) => (
                  <div
                    {...cell.getCellProps()}
                    className={`body-cell ${cellIndex < 2 ? 'frozen' : ''} ${row.original.colorClass||''}`}
                  >
                    {cell.render('Cell')}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyDataTable;
