import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

export interface MasterRequisitionListProps {
  MasterRequisitions: any;
  onEditHandler: any;
}

export interface MasterRequisitionListState {

}
class MasterRequisitionList extends React.Component<MasterRequisitionListProps, MasterRequisitionListState> {

  public render() {
    let ExportExcelreportColumns = [
      {
        name: "Edit",
        selector: "Id",       
      },
      {
        name: "Id",
        selector: "Id",        
      },
      {
        name: "Plant",
        selector: "Plant",        
      },
      {
        name: "Company",
        selector: "Company",
      },
      {
        name: "Requisitioner",
        selector: "Requisitioner",
      },
      {
        name: "Buyer",
        selector: "BuyerCode",
      },
      {
        name: "Commodity Category",
        selector: "CommodityCategoryCode",
      },
      {
        name: "Project Code",
        selector: "ProjectCode",
      }
    ];
    const columns = [
      {
        name: "Edit",
        //selector: "Id",
        selector: (row, i) => row.Id,
        cell: record => {
          return (
            <React.Fragment>
              <div style={{ paddingLeft: '10px' }}>
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/MasterRequisition/${record.Id}`}>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { this.props.onEditHandler(record.Id); }}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        },
        header: 'Action',
        dataKey: 'Id',
        width: '80px'
      },
      {
        name: "Id",
        //selector: "Id",
        selector: (row, i) => row.Id,
        sortable: true,
        header: 'Id',
        dataKey: 'Id',
        width: '80px'
      },
      {
        name: "Plant",
       // selector: "Plant",
        selector: (row, i) => row.Plant,
        sortable: true,
        header: 'Plant',
        dataKey: 'Plant',
        width: '80px'
      },
      {
        name: "Company",
        //selector: "Company",
        selector: (row, i) => row.Company,
        sortable: true,
        header: 'Company',
        dataKey: 'Company',
        width: '80px'
      },
      {
        name: "Requisitioner",
        //selector: "Requisitioner",
        selector: (row, i) => row.Requisitioner,
        sortable: true,
        header: 'Requisitioner',
        dataKey: 'Requisitioner'
      },
      {
        name: "Buyer",
        //selector: "BuyerCode",
        selector: (row, i) => row.BuyerCode,
        sortable: true,
        header: 'Buyer Code',
        dataKey: 'BuyerCode'
      },
      {
        name: "Commodity Category",
        //selector: "CommodityCategoryCode",
        selector: (row, i) => row.CommodityCategoryCode,
        sortable: true,
        header: 'Commodity Category Code',
        dataKey: 'CommodityCategoryCode'
      },
      {
        name: "Project Code",
        //selector: "ProjectCode",
        selector: (row, i) => row.ProjectCode,
        sortable: true,
        header: 'Project Code',
        dataKey: 'ProjectCode',
        width: '80px'
      }
    ];

    return (
      <div className="light-box border-box-shadow mx-2 table-head-1st-td">
        {/* <div className="p-2 text-right button-area"><button type="button" id="" className="btn btn-add"><i className="fa fa-plus"></i> Add</button></div> */}
        {/* <DataTable
            title="Master Requisition"
            columns={columns}
            data={this.props.MasterRequisitions}
            pagination
            actions
          /> */}
        <TableGenerator columns={columns} data={this.props.MasterRequisitions} fileName={'Master Requisition'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
      </div>
    );
  }
}

export default MasterRequisitionList;