import React, { useState } from "react";
import { sp } from '@pnp/sp';
import TableGenerator from '../Shared/TableGenerator';

interface modalProps {
  isVisible: boolean;
  isSuccess: boolean;
  onCancel: () => void;
  EmployeeTitle: any;
  Year:any;
  Data: any;
  ExcelData: any;
}

const PTOTransactionHistoryPopup = ({ isVisible, EmployeeTitle,Year, Data, ExcelData, onCancel }: modalProps) => {
  const columns = [
    // {
    //     name: "",
    //     export: false,
    //     cell: '',
    //     width: '5px'
    // },
    {
      name: "Transaction Type",
      selector: (row, i) => row.TransactionType,
      width: '250px',
      sortable: true
    },
    {
      name: "Date",
      selector: (row, i) => row.PostedOn,
      width: '150px',
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
      name: "Transaction Type",
      selector: "TransactionType",
      width: '200px',
      sortable: true
    },
    {
      name: "Date",
      selector: "PostedOn",
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
  return isVisible ? (
    <div className="modal" tabIndex={-1} style={{ display: 'block' }} >
      <div className="py-4">
        <div className="modal-content">
          <div className={'text-right'}>
            <button type="button" onClick={onCancel} className={`bg-danger text-white`} data-dismiss="modal" title='Close'>X</button>
          </div>
          <div className="light-box border-box-shadow m-1 p-2">
            <div className='FormContent-2'>
              <div className="title">{`PTO Transaction History : ${EmployeeTitle} - ${Year}`}
              </div>
              <div className="after-title"></div>
              <div className="media-m-2 media-p-1">
                <div className='c-v-table table-head-1st-td dataTables_wrapper-overflow'>
                  <TableGenerator columns={columns} data={Data} fileName={`PTO Transaction History`} showExportExcel={Data.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} wrapColumns={["Reason"]} LargeWidthColumns={["Reason","Employee"]} ExportExcelCustomisedData={ExcelData}></TableGenerator>
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