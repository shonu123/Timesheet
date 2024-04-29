import React, { useEffect } from 'react';
import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter } from 'react-table';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    <>
    {data.length>0 &&(
    <div className="table-container">
      <div className="table-toolbar">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
        <span className='RIndiactor R-LYellow'>Submitted</span>
        <span className='RIndiactor R-LBlue'>Approved by Reporting Manager</span>
        <span className='RIndiactor R-LPurple'>Approved</span>
        <span className='RIndiactor R-LRed'>Rejected</span>
      </div>
      <div {...getTableProps()} className="ReportTable">
        <div className="header">
          {headerGroups.map(headerGroup => (
            <div {...headerGroup.getHeaderGroupProps()} className="Reportheader-row">
              {headerGroup.headers.map((column, columnIndex) => (
                <div
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={`header-cell ${columnIndex < 2 ? 'frozen' : ''}`}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? <FontAwesomeIcon className='iconArrow' icon={faArrowUp}  size="lg" ></FontAwesomeIcon> : <FontAwesomeIcon className='iconArrow' icon={faArrowDown}  size="lg" ></FontAwesomeIcon>) : ''}
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
                    className={`body-cell ${cellIndex < 2 ? 'frozen' : ''} ${row.original[`colorClass${cellIndex + 1}`] || ''}`}
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
    )}
    </>
  );
};


export default MyDataTable;
//