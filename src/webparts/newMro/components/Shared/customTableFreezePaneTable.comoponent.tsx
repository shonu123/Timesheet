import React, { useEffect } from 'react';
import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter } from 'react-table';
import { faArrowUp, faArrowDown,faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as XLSX from 'xlsx-js-style';

const MyDataTable = ({ columns, data,ExcelData }) => {
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

  const exportToexcel =(data)=>{
    let workSheetRows = data[0]
    let filename = data[1]
    let startDate = data[2]
    let endDate = data[3]
    let lastColumn = data[4]
    const wb = XLSX.utils.book_new();
    const finalWorkshetData = XLSX.utils.aoa_to_sheet(workSheetRows)
    finalWorkshetData['!autofilter'] = { ref: 'A7:B7' };
    // mention the range of merge for individual row/item according
    const merge = [
            { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumn>7?lastColumn:7 } },{ s: { r: 4, c: 0 }, e: { r: 4, c: lastColumn>7?lastColumn:7 } }
          ];

      finalWorkshetData["!merges"] = merge;
      finalWorkshetData['!images'] = [
        {
            name: 'logo.jpg',
            data: require('../Images/logo.jpg'),
            opts: { base64: true },
            position: {
                type: 'twoCellAnchor',
                attrs: { editAs: 'oneCell' },
                from: { col: 2, row : 18 },
                to: { col: 8, row: 22 }
            }
        }
      ]
    XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);
    // STEP 4: Write Excel file to browser
    XLSX.writeFile(wb, `${filename}(${startDate} to ${endDate}).xlsx`);

  }
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
        <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => exportToexcel(ExcelData)}>
        <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
    </a>
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
                  <span className='iconArrow'>
                    {column.isSorted ? (column.isSortedDesc ? <FontAwesomeIcon className='' icon={faArrowUp}  size="lg" ></FontAwesomeIcon> : <FontAwesomeIcon className='' icon={faArrowDown}  size="lg" ></FontAwesomeIcon>) : ''}
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