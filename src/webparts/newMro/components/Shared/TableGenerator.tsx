import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import ExportExcel from './ExportExcel';
import Search from './Search';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus,faArrowTurnRight } from '@fortawesome/free-solid-svg-icons';
import ExportExcelwithStyles from './ExportExcelwithStyles';
import ExportToPDF from './ExportPDF';
const customStyles = {
  rows: {
    style: {
      minHeight: '70px', // override the row height
    }
  },
  headCells: {
    style: {
      paddingLeft: '11px', // override the cell padding for head cells
      // paddingRight: '3px',
      color: '#572ba7',
      fontSize: '.9rem',
      background: 'linear-gradient(rgb(228 228 228),rgb(191 191 191))',
      borderTop: '0!important',
      borderBottom: '2px solid #dee2e6;',
      verticalAlign: 'bottom'
    },
  },
  cells: {
    style: {
      paddingLeft: '3px', // override the cell padding for data cells
      paddingRight: '3px',

    },
  },
};
interface TableGeneratorProps {
  columns: any;
  data: any;
  fileName: string;
  showExportExcel?: boolean;
  showExportPDF?:boolean;
  logoUrlToPDF?:string;
  showMultiApproveOrReject?:boolean;
  onClickApproveOrReject?:any;
  ExportExcelCustomisedColumns?:any;
  ExportExcelCustomisedData?:any;
  prvPageNumber?: number;
  prvSort?:any;
  prvDirection?:boolean;
  onChange?:any;
  onSortChange?:any;
  onSortDirection?:any;
  showAddButton?:boolean;
  btnSpanID?:string;
  btnDivID?:string
  btnTitle?:string;
  navigateOnBtnClick?:string;
  btnCaption?:string;
  customBtnClass?:string;
  searchBoxLeft?:boolean;
  wrapColumns?:any;
  selectableRows?:boolean;
  handleSelectedRows?:any;
  customButton?:boolean;
  customButtonClick?:any;
  clearSelectedRows?:boolean;
  onRowClick?:any;
}

const TableGenerator = ({ columns, data, fileName,showExportExcel,showExportPDF=false,logoUrlToPDF,showMultiApproveOrReject=false,onClickApproveOrReject, ExportExcelCustomisedColumns,ExportExcelCustomisedData, prvPageNumber,prvSort,prvDirection,onChange,onSortChange,onSortDirection,showAddButton,btnSpanID,btnTitle,navigateOnBtnClick,btnCaption,customBtnClass,btnDivID,searchBoxLeft,wrapColumns,selectableRows,handleSelectedRows,customButton=false,customButtonClick,onRowClick,clearSelectedRows=true}: TableGeneratorProps) => {
  //let lsMyrequests = localStorage.getItem('PrvData');
 // const tableData = { columns, data };
  const [totalData, setData] = useState([]);
  const [search, setSearchText] = useState('');
 //search= lsMyrequests != null? JSON.parse(localStorage.getItem('PrvData')).SearchKey:null
 prvPageNumber = prvPageNumber!= undefined && prvPageNumber!= null?prvPageNumber:1;
 prvSort = (prvSort!= undefined && prvSort!= null)?prvSort:"";
 prvDirection = (prvDirection!= undefined && prvDirection!= null)?prvDirection:false;
 // localStorage.setItem('PrvData',null);
  
  useEffect(() => {
    ExportExcelCustomisedData =(ExportExcelCustomisedData== undefined && ExportExcelCustomisedData!= null)? ExportExcelCustomisedData : data;
    ExportExcelCustomisedColumns=(ExportExcelCustomisedColumns== undefined && ExportExcelCustomisedColumns!= null)? ExportExcelCustomisedColumns : columns;

    let totaldata = data;
    if (search) {
      var allKeys = Object.keys(data[0]);
      totaldata = totaldata.filter(l => allKeys.some(field => {
        return (l[field] && l[field].toString().toLowerCase().includes(search.toLowerCase()));
      }));
      setData(totaldata);
    } else {
      setData(data);
    }
  }, [data, search]);

  return (
    <div className="py-2 m-2 border">
      <div className={showExportExcel||showAddButton || searchBoxLeft ? 'row' : 'row justify-content-end-sp'}>
        <div className="col-6 text-right-col-6">
          <Search onSearch={value => {
            setSearchText(value);
          }} ></Search>
        </div>
        {
          customButton&&
          <div className="col-6 text-right">
          <div style={{ paddingLeft: '10px' }} className={customBtnClass} id={""+btnDivID}>
            <button type="button" id="" className={"SubmitButtons-2 btn"}  onClick={customButtonClick} title={btnTitle}><span className='position-static' id={""+btnSpanID}><FontAwesomeIcon icon={faArrowTurnRight}></FontAwesomeIcon></span></button>
            </div> 
          </div>
        }
        {showAddButton&&
              <div className="col-6 text-right">
                  <div style={{ paddingLeft: '10px' }} className={customBtnClass} id={""+btnDivID}>
                    <NavLink title={btnTitle}  className="csrLink ms-draggable" to={navigateOnBtnClick}>
                    <button type="button" id="" className="SubmitButtons btn"><span className='position-static' id={""+btnSpanID}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>{btnCaption}</span></button>
                    </NavLink>
                    </div> 
        </div>}
       {
       <div className="col-6 text-right pr-4">
         {/* <ExportExcel tableData={ExportExcelCustomisedData ? ExportExcelCustomisedData : data} filename={fileName} columns={ExportExcelCustomisedColumns ? ExportExcelCustomisedColumns : columns}></ExportExcel> */}
          { showExportExcel && <ExportExcelwithStyles tableData={ExportExcelCustomisedData ? ExportExcelCustomisedData : data} filename={fileName} columns={ExportExcelCustomisedColumns ? ExportExcelCustomisedColumns : columns} wrapColumnsArray={wrapColumns}></ExportExcelwithStyles>}
          { showExportPDF && <ExportToPDF AllTimesheetsData={data} filename={fileName}  LogoImgUrl={logoUrlToPDF}></ExportToPDF>}
          { showMultiApproveOrReject && <><button type="button" id="btnApprove" name={"Approve"} onClick={onClickApproveOrReject} className="SubmitButtons btn" title="Approve">Approve</button><button type="button" id="btnReject" name={"Reject"} onClick={onClickApproveOrReject} className="RejectButtons btn" title="Reject">Reject</button></>}
            </div> }
      </div>

      {/* <div>
        <ExportListItemsToPDF listName={fileName} columns={columns} data={data}></ExportListItemsToPDF>
      </div> */}

      <div className="mt-2" id="tablePDF">
        <DataTable
          noHeader
          columns={columns}
          data={totalData}
          striped={true}
          pagination
          actions
          customStyles={customStyles}
          paginationDefaultPage={1}
          persistTableHead={true}
          onChangePage={onChange}
          onSort={onSortChange}
          defaultSortFieldId={prvSort}
          defaultSortAsc={prvDirection}
          selectableRows={selectableRows}
          onSelectedRowsChange={handleSelectedRows}
          // clearSelectedRows={clearSelectedRows}
          onRowClicked={onRowClick}
        />
      </div>
    </div>
  );
};

export default TableGenerator;