// import React, { useEffect } from 'react';
// import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter } from 'react-table';
// import { faFileExcel, faArrowDownLong, faArrowUpLong } from '@fortawesome/free-solid-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import * as XLSX from 'xlsx-js-style';

// const MyDataTable = ({ columns, data, ExcelData }) => {
//   useEffect(() => {
//     const headerCell = document.querySelector('.header-cell');
//     if (headerCell) {
//       const firstColumnWidth = (headerCell as HTMLElement).offsetWidth;
//       document.documentElement.style.setProperty('--width-of-first-column', `${firstColumnWidth}px`);
//     }
//   }, []);

//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     rows,
//     prepareRow,
//     state,
//     setGlobalFilter,
//   } = useTable(
//     {
//       columns,
//       data,
//     },
//     useFilters,
//     useGlobalFilter,
//     useSortBy,
//     useBlockLayout // Enables block layout to support column freezing
//   );

//   const exportToExcel = (data) => {
//     let workSheetRows = data[0];
//     let filename = data[1];
//     let startDate = data[2];
//     let endDate = data[3];
//     let lastColumn = data[4];
//     const wb = XLSX.utils.book_new();
//     const finalWorkshetData = XLSX.utils.aoa_to_sheet(workSheetRows);
//     finalWorkshetData['!autofilter'] = { ref: 'A7:B7' };
//     // mention the range of merge for individual row/item according
//     const merge = [
//       { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumn > 7 ? lastColumn : 7 } },
//       { s: { r: 4, c: 0 }, e: { r: 4, c: lastColumn > 7 ? lastColumn : 7 } }
//     ];

//     finalWorkshetData["!merges"] = merge;
//     finalWorkshetData['!images'] = [
//       {
//         name: 'logo.jpg',
//         data: require('../Images/logo.jpg'),
//         opts: { base64: true },
//         position: {
//           type: 'twoCellAnchor',
//           attrs: { editAs: 'oneCell' },
//           from: { col: 2, row: 18 },
//           to: { col: 8, row: 22 }
//         }
//       }
//     ];
//     XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);
//     // STEP 4: Write Excel file to browser
//     XLSX.writeFile(wb, `${filename}(${startDate} to ${endDate}).xlsx`);

//   }

//   const { globalFilter } = state;

//   return (
//     <>
//       {data.length > 0 && (
//         <>
//           <div className="table-toolbar">
//             <input
//               type="text"
//               value={globalFilter || ''}
//               onChange={(e) => setGlobalFilter(e.target.value)}
//               placeholder="Search..."
//             />
//             <div className='div-indiactor'>
//               <span className='RIndiactor'><span className='R-LYellow'></span>Submitted</span>
//               <span className='RIndiactor'><span className='R-LBlue'></span>Approved by Manager</span>
//               <span className='RIndiactor'><span className='R-LPurple'></span>Approved</span>
//               <span className='RIndiactor'><span className='R-LRed'></span>Rejected</span>
//             </div>
//             <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => exportToExcel(ExcelData)}>
//               <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
//             </a>
//           </div>
//           <div className="table-container">
//             <div {...getTableProps()} className="ReportTable">
//               <div className="header">
//                 {headerGroups.map(headerGroup => (
//                   <div {...headerGroup.getHeaderGroupProps()} className="Reportheader-row">
//                     {headerGroup.headers.map((column, columnIndex) => (
//                       <div
//                         {...column.getHeaderProps(column.getSortByToggleProps())}
//                         className={`header-cell ${columnIndex < 2 ? 'frozen' : ''}`}
//                       >
//                         {column.render('Header')}
//                         {/* Render sort icons based on sort state */}
//                         <span className='iconArrow'>
//                           {state.sortBy && state.sortBy[0]?.id === column.id ? (
//                             column.isSorted && column.isSortedDesc ? (
//                               <FontAwesomeIcon
//                                 className=''
//                                 icon={faArrowDownLong}
//                                 size="lg"
//                                 style={{ color: 'black' }} // Dark color for descending sort
//                               ></FontAwesomeIcon>
//                             ) : (
//                               <FontAwesomeIcon
//                                 className=''
//                                 icon={faArrowUpLong}
//                                 size="lg"
//                                 style={{ color: 'black' }} // Dark color for ascending sort
//                               ></FontAwesomeIcon>
//                             )
//                           ) : (
//                             <>
//                               <FontAwesomeIcon
//                                 className=''
//                                 icon={faArrowUpLong}
//                                 size="lg"
//                                 style={{ color: 'lightgray' }} // Light color for ascending sort
//                               ></FontAwesomeIcon>
//                               <FontAwesomeIcon
//                                 className=''
//                                 icon={faArrowDownLong}
//                                 size="lg"
//                                 style={{ color: 'lightgray' }} // Light color for descending sort
//                               ></FontAwesomeIcon>
//                             </>
//                           )}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//               <div {...getTableBodyProps()} className="body">
//                 {rows.map((row, rowIndex) => {
//                   prepareRow(row);
//                   return (
//                     <div {...row.getRowProps()} className="body-row">
//                       {row.cells.map((cell, cellIndex) => (
//                         <div
//                           {...cell.getCellProps()}
//                           className={`body-cell ${cellIndex < 2 ? 'frozen' : ''} ${row.original[`colorClass${cellIndex + 1}`] || ''}`}
//                         >
//                           {cell.render('Cell')}
//                         </div>
//                       ))}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
          
//         </>
//       )}
//     </>
//   );
// };

// export default MyDataTable;

import React, { useEffect,useMemo } from 'react';
//import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter,usePagination} from 'react-table';
import { useTable, useBlockLayout, useSortBy, useFilters, useGlobalFilter} from 'react-table';
import { faFileExcel, faArrowDownLong, faArrowUpLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as XLSX from 'xlsx-js-style';

const MyDataTable = ({ columns, data, ExcelData }) => {
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
    //page, // Instead of 'rows', we use 'page'
    prepareRow,
    state,
    //state: { pageIndex, pageSize,globalFilter}, // Destructure pagination state
    // nextPage,
    // previousPage,
    // canNextPage,
    // canPreviousPage,
    // gotoPage,
    // pageCount,
    // setPageSize,
    setGlobalFilter,
    rows
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 }, // Initial page index and page size
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useBlockLayout, // Enables block layout to support column freezing
    //usePagination // Pagination functionality
  );

  const exportToExcel = (data) => {
    let workSheetRows = data[0];
    let filename = data[1];
    let startDate = data[2];
    let endDate = data[3];
    let lastColumn = data[4];
    const wb = XLSX.utils.book_new();
    const finalWorkshetData = XLSX.utils.aoa_to_sheet(workSheetRows);
    finalWorkshetData['!autofilter'] = { ref: 'A7:B7' };
    // mention the range of merge for individual row/item according
    const merge = [
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumn > 7 ? lastColumn : 7 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: lastColumn > 7 ? lastColumn : 7 } }
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
          from: { col: 2, row: 18 },
          to: { col: 8, row: 22 }
        }
      }
    ];
    XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);
    // STEP 4: Write Excel file to browser
    XLSX.writeFile(wb, `${filename}(${startDate} to ${endDate}).xlsx`);

  }
//  // Function for extreme previous page
//  const extremePreviousPage = () => {
//   gotoPage(0);
//   previousPage();
// };

// // Function for extreme next page
// const extremeNextPage = () => {
//   gotoPage(pageCount - 1);
//   nextPage();
// };
// // Dropdown options for rows per page
// const pageSizeOptions = useMemo(
//   () => [10,15,20,25,30].map((size) => ({ value: size, label: size.toString() })),
//   []
// );
// // Filtered rows based on global filter
// const filteredRows = useMemo(() => {
//   if (globalFilter) {
//     return rows.filter((row) =>
//       row.cells.some((cell) => String(cell.value).toLowerCase().includes(globalFilter.toLowerCase()))
//     );
//   }
//   return rows;
// }, [globalFilter, rows]);
// // Calculate start and end record index of current page
// const startRecordIndex = pageIndex * pageSize + 1;
// const endRecordIndex = Math.min((pageIndex + 1) * pageSize,filteredRows.length);
const { globalFilter } = state;
  return (
    <>
      {data.length > 0 && (
        <>
          <div className="table-toolbar">
            <input
              type="text"
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
            />
            <div className='div-indiactor'>
              <span className='RIndiactor'><span className='R-LYellow'></span>Submitted</span>
              <span className='RIndiactor'><span className='R-LBlue'></span>Approved by Manager</span>
              <span className='RIndiactor'><span className='R-LPurple'></span>Approved</span>
              <span className='RIndiactor'><span className='R-LRed'></span>Rejected</span>
            </div>
            <a type="button" id="btnDownloadFile" className="icon-export-b" onClick={(e) => exportToExcel(ExcelData)}>
              <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
            </a>
          </div>
          <div className="table-container">
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
                        {/* Render sort icons based on sort state */}
                        <span className='iconArrow'>
                          <FontAwesomeIcon
                            className=''
                            icon={faArrowUpLong}
                            size="lg"
                            style={{ color: state.sortBy && state.sortBy[0]?.id === column.id && !column.isSortedDesc ? 'black' : 'lightgray' }} // Dark color if ascending sorted, otherwise light
                          ></FontAwesomeIcon>
                          <FontAwesomeIcon
                            className=''
                            icon={faArrowDownLong}
                            size="lg"
                            style={{ color: state.sortBy && state.sortBy[0]?.id === column.id && column.isSortedDesc ? 'black' : 'lightgray' }} // Dark color if descending sorted, otherwise light
                          ></FontAwesomeIcon>
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
           {/* Pagination */}
           {/* {filteredRows.length>0?
            <div id='divPagination' className='div-pagination'>
              <label className='px-2'>Rows per page:</label>
              <select id='ddlRowsPerPage' className='px-2'
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {pageSizeOptions.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className='px-2'> {startRecordIndex + '-' + endRecordIndex + ' of ' + filteredRows.length} </span>
              <button className='btn-pagination' onClick={() => extremePreviousPage()} disabled={!canPreviousPage}>
                {<svg className='svg-icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path><path fill="none" d="M24 24H0V0h24v24z"></path></svg>}
              </button>
              <button className='btn-pagination' onClick={() => previousPage()} disabled={!canPreviousPage}>
              {<svg className='svg-icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>}
              </button>
              <button className='btn-pagination' onClick={() => nextPage()} disabled={!canNextPage}>
              {<svg className='svg-icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>}
              </button>
              <button className='btn-pagination' onClick={() => extremeNextPage()} disabled={!canNextPage}>
              {<svg className='svg-icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path><path fill="none" d="M0 0h24v24H0V0z"></path></svg>}
              </button>
            </div> : <div className='text-center'>There are no records to display</div>
          } */}
        </>
      )}
    </>
  );
};

export default MyDataTable;

