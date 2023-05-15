import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { Navigate, NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import TableGenerator from '../Shared/TableGenerator';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from '@microsoft/sp-webpart-base';


export interface ApprovalMasterProps {
  match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ApprovalMasterState {
}

class ApprovalMaster extends React.Component<ApprovalMasterProps, ApprovalMasterState> {
  private siteURL: string;
  private userContext: any = {};
  private rootweb;

  constructor(props: ApprovalMasterProps) {
    super(props);
    this.siteURL = this.props.spContext.webAbsoluteUrl;
    this.userContext = this.props.spContext;
    sp.setup({
        spfxContext: this.props.context
    });
}

  public state = { redirect: false, AprovalData: [], columns: [], tableData: {}, loading: true, modalText: '', modalTitle: '', isSuccess: false, showHideModal: false, formEdit: false };
  public componentDidMount() {
    highlightCurrentNav("approvalmaster");
    this.GetOnloadData();
  }


  private GetOnloadData = () => {
    let ApprovalmasterList = 'ApprovalsMatrix';

   // let query = "?$expand=Approval1,Approval2,Approval3,Reviewer&$select=Approval1/Title,Approval2/Title,Approval3/Title,Reviewer/Title,*&$orderby=Id%20desc";
   // var Query = this.props.spContext.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + ApprovalmasterList + "')/items" + query;
    //this.props.spHttpClient.get(Query, SPHttpClient.configurations.v1).then((res: SPHttpClientResponse) => {
    // convert rest full api call to pnp.js
    sp.web.lists.getByTitle(ApprovalmasterList).items.expand('Approval1','Approval2','Approval3','Approval4','Reviewer','Escalation','PurchasingTeam','InformTo').select('Approval1/Title','Approval2/Title','Approval3/Title','Approval4/Title','Reviewer/Title','Escalation/Title','PurchasingTeam/Title','InformTo/Title','*').orderBy('Id',false).getAll().then((res: any) => {
    
      if (res && res.length > 0) { 
       // res.json().then((response: any) => {
          let data = [];
          res.sort((a,b)=>b.Id -a.Id);  //orderby is not working on fetching, this line of code is workaround.

          res.forEach((Item) => {
            data.push({
              Id: Item.Id,
              Company: Item.Company,
              Plant: Item.Plant,
              Department:Item.Department,
              FromBudget: Item.FromBudget,
              ToBudget: Item.ToBudget,
              Approval1: Item.Approval1 != undefined ? Item.Approval1.Title : '',
              Approval2: Item.Approval2 != undefined ? Item.Approval2.Title : '',
              Approval3: Item.Approval3 != undefined ? Item.Approval3.Title : '',
              Approval4: Item.Approval4 != undefined ? Item.Approval4.Title : '',
              Escalation: Item.Escalation != undefined ? Item.Escalation.Title : '',
              Reviewer: Item.Reviewer != undefined ? Item.Reviewer.Title : '',
              PurchasingTeam: Item.PurchasingTeam != undefined ? Item.PurchasingTeam.Title : '',
              InformTo: Item.InformTo != undefined ? Item.InformTo.Title : '',
              Status:Item.IsActive == true ? 'Active' : 'In-Active',
            });
          });

          this.setState({ AprovalData: data, loading: false });
        //});
      }
      else {
        this.setState({
          loading: false,
          modalTitle: 'Error',
          modalText: 'Sorry! something went wrong',
          showHideModal: true,
          isSuccess: false
        });
      }
    });
  }
  private addNew = () => {
    this.setState({ redirect: true});
    
  }
  private handleClose = () => {
    this.setState({ redirect: false });
  }

  public render() {
    let ExportExcelreportColumns = [
     
      {
        name: "Company",
        selector: 'Company',

      },
      {
        name: "Plant",
        selector: 'Plant',

      },
      {
        name: "Department",
        selector: 'Department',
      },
      {
        name: "From Budget",
        selector: 'FromBudget',
      },
      {
        name: "To Budget",
        selector: 'ToBudget',

      },
      {
        name: "Approver 1",
        selector: 'Approval1',
      },
      {
        name: "Approver 2",
        selector: 'Approval2',
      },
      {
        name: "Approver 3",
       selector: 'Approval3',
      },
      {
        name: "Approver 4",
        selector: 'Approval4',
      },
      {
        name: "Escalation",
        selector: 'Escalation',
      },
      {
        name: "Purchasing Manager",
        selector: 'Reviewer',
      },
      {
        name: "Purchasing Team",
        selector: 'PurchasingTeam',
      },
      {
        name: "Inform To",
        selector: 'InformTo',
      },
      {
        name: "Status",
        selector: 'Status',
      },
    ];
    let columns = [
      {
        name: "Edit",
        //selector: "Id",
        selector: (row, i) => row.Id,
        export: false,
        cell: record => {
          return (
            <React.Fragment>
              <div style={{ paddingLeft: '10px' }}>
                <NavLink title="Edit" className="csrLink ms-draggable" to={`/approvalmasterForm/${record.Id}`} >
                  <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                </NavLink>
              </div>
            </React.Fragment>
          );
        }
      },
      {
        name: "Company",
        //selector: 'Company',
        selector: (row, i) => row.Company,
        sortable: true

      },
      {
        name: "Plant",
        //selector: 'Plant',
        selector: (row, i) => row.Plant,
        sortable: true

      },
      {
        name: "Department",
        //selector: 'Department',
        selector: (row, i) => row.Department,
        sortable: true

      },
      {
        name: "From Budget",
        //selector: 'FromBudget',
        selector: (row, i) => row.FromBudget,
        sortable: true

      },
      {
        name: "To Budget",
        //selector: 'ToBudget',
        selector: (row, i) => row.ToBudget,
        sortable: true

      },
      {
        name: "Approver 1",
        //selector: 'Approval1',
        selector: (row, i) => row.Approval1,
        sortable: true
      },
      {
        name: "Approver 2",
        //selector: 'Approval2',
        selector: (row, i) => row.Approval2,
        sortable: true
      },
      {
        name: "Approver 3",
       // selector: 'Approval3',
        selector: (row, i) => row.Approval3,
        sortable: true
      },
      {
        name: "Approver 4",
       // selector: 'Approval4',
        selector: (row, i) => row.Approval4,
        sortable: true
      },
      {
        name: "Escalation",
        //selector: 'Escalation',
        selector: (row, i) => row.Escalation,
        sortable: true
      },
      {
        name: "Purchasing Manager",
        //selector: 'Reviewer',
        selector: (row, i) => row.Reviewer,
        sortable: true
      },
      {
        name: "Purchasing Team",
       // selector: 'PurchasingTeam',
        selector: (row, i) => row.PurchasingTeam,
        sortable: true
      },
      {
        name: "Inform To",
        //selector: 'InformTo',
        selector: (row, i) => row.InformTo,
        sortable: true
      },
      {
        name: "Status",
        //selector: 'Status',
        selector: (row, i) => row.Status,
        sortable: true
      },
    ];
    if (this.state.redirect) {
      let url='/approvalmasterForm' 
      return <Navigate to={url} />;
      
    }
    else {
      return (
        <React.Fragment>
          {this.state.loading && <Loader />}
          <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
          <div className='container-fluid'>
            <div className='FormContent'>
              <div className="title">Approvals
                {/* <div className='mandatory-note'>
                  <span className='mandatoryhastrick'>*</span> indicates a required field
                </div> */}
              </div>
              <div className="after-title"></div>


              <div className="">
                <div className="mx-2" id="">
                  <div className="text-right pt-2" id="">
                    <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNew}>Add</button>
                  </div>
                </div>

                <div className="c-v-table table-head-1st-td">
                <TableGenerator columns={columns} data={this.state.AprovalData} fileName={'Approvals'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
</div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }
  }
}

export default ApprovalMaster;