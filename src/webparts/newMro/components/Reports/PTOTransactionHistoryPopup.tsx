import React, { useState } from "react";
import { sp } from '@pnp/sp';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';

interface modalProps {
  isVisible: boolean;
  isSuccess: boolean;
  onCancel: () => void;
  EmployeeTitle: any;
  Year:any;
  Data: any;
  ExcelData: any;
  isTimeOffEmployee
}

const PTOTransactionHistoryPopup = ({ isVisible, EmployeeTitle,Year, Data, ExcelData,isTimeOffEmployee=false, onCancel }: modalProps) => {
  const columns = [
    // {
    //     name: "",
    //     export: false,
    //     cell: '',
    //     width: '5px'
    // },
    {
      name: "Transaction Status",
      selector: (row, i) => row.TransactionType,
      width: '280px',
      sortable: true
    },
    {
      name: "Time Off Type",
      selector: (row, i) => row.TimeOffTypesForGrid,
      cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.TimeOffTypesForGrid }}/>,
      width: '200px',
      sortable: true
    },
    {
      name: "Time Off Date",
      selector: (row, i) => row.PostedOnForGrid,
      cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.PostedOnForGrid }}/>,
      width: '200px',
      sortable: true
    },
    {
    name: "Submitted Date",
    selector: (row, i) => row.SubmittedDateForGrid,
    cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.SubmittedDateForGrid }}/>,
    width: '200px',
    sortable: true
    },
    // {
    //   name: "From",
    //   selector: (row, i) => row.From,
    //   width: '150px',
    //   sortable: true
    // },
    // {
    //   name: "To",
    //   selector: (row, i) => row.To,
    //   width: '150px',
    //   sortable: true
    // },
    {
      name: "Hours",
      selector: (row, i) => row.Hours,
      width: '70px',
      sortable: true
    },
    {
      name: "Reason",
      selector: (row, i) => row.Reason,
      sortable: true,
    },
  ];
  const Exportcolumns = [
    {
      name: "Employee",
      selector: "Employee",
      width: '200px',
      sortable: true
    },
    {
      name: "Transaction Status",
      selector: "TransactionType",
      width: '200px',
      sortable: true
    },
    {
      name: "Time Off Type",
      selector: "TimeOffTypes",
      width: '200px',
      sortable: true
    },
    {
      name: "Time Off Date",
      selector: "PostedOn",
      width: '230px',
      sortable: true
    },
     {
      name: "Submitted Date",
      selector: "SubmittedDate",
      width: '230px',
      sortable: true
    },
    // {
    //   name: "From",
    //   selector: "From",
    //   sortable: true
    // },
    // {
    //   name: "To",
    //   selector: "To",
    //   sortable: true
    // },
    {
      name: "Hours",
      selector: "Hours",
      sortable: true
    },
    {
      name: "Reason",
      selector: "Reason",
      width: '220px',
      sortable: true,
    },
  ];
  const searchKeys=['TransactionType','TimeOffTypes','PostedOn','SubmittedDate','Hours','Reason'];
  if(isTimeOffEmployee)  //if Employee is member of 'Time Off Members' hide date and shows From date and To date
  {
    columns.splice(1,1);
    searchKeys.splice(1,1);
    Exportcolumns.splice(2,1)
    columns.splice(1,0, {
         name: "From",
         selector: (row, i) => row.FromForGrid,
         cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.FromForGrid }}/>,
         width: '150px',
        sortable: true
       },
       {
           name: "To",
           selector: (row, i) => row.ToForGrid,
           cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.ToForGrid }}/>,
          width: '150px',
           sortable: true
    })
    searchKeys.splice(1,0,'From','To');

    Exportcolumns.splice(2,0, {
        name: "From",
        selector: "From",
        sortable: true
    },
    {
      name: "To",
      selector: "To",
      sortable: true
    })
  }
  return isVisible ? (
    <div className="modal" tabIndex={-1} style={{ display: 'block' }} >
      <div className="py-4">
        <div className="modal-content">
          <div className={'text-right pr-4 pt-2'}>
            <button type="button" className='btn-fa-close' onClick={onCancel} id={'btnClose'}><span title='Close' ><FontAwesomeIcon icon={faClose} id={'iconClose'}></FontAwesomeIcon></span></button>
          </div>
          <div className="light-box border-box-shadow m-1 p-2">
            <div className='FormContent-2'>
              <div className="title">{`PTO Transaction History : ${EmployeeTitle} - ${Year}`}
              </div>
              <div className="after-title"></div>
              <div className="media-m-2 media-p-1">
                <div className='c-v-table table-head-1st-td dataTables_wrapper-overflow'>
                  <TableGenerator columns={columns} searchKeys={searchKeys} data={Data} fileName={`PTO Transaction History`} showExportExcel={Data.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} wrapColumns={["Reason","TimeOffTypes"]} LargeWidthColumns={["Reason","Employee"]} ExportExcelCustomisedData={ExcelData}></TableGenerator>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default PTOTransactionHistoryPopup;