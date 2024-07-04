import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import Loader from '../Shared/Loader';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/webs";
import "@pnp/sp/sputilities";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups";
import { NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ModalForwardApprovals from '../Shared/ModalForwardApprovals.component';
import TableGenerator from '../Shared/TableGenerator';
import { faEdit, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DatePicker from "../Shared/DatePickerField";
import { highlightCurrentNav2 } from '../../Utilities/HighlightCurrentComponent';
export interface ManagerDelegationsViewProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface ManagerDelegationsViewState {
}

class ManagerDelegationsView extends React.Component<ManagerDelegationsViewProps, ManagerDelegationsViewState> {
    private siteURL;
    constructor(props: ManagerDelegationsViewProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
    }

    public state = {
        ManagerDelegates: [],
        From: null,
        showToaster: false,
        loading: false,
        isRecordAcessable: true,
        isAdmin:false,
        redirect:false,
        message:'',
        userGroups:[],
        ExcelData:[],
        RecordID:''
    }

    public componentDidMount() {
        highlightCurrentNav2("liDashboard")
        this.setState({ loading: true });
        this.getOnLoadData();
    }

    private async getOnLoadData() {
        let userID = this.props.spContext.userId;
        let [DelegationData,groups] = await Promise.all([
            sp.web.lists.getByTitle('Delegations').items.expand('ReportingManager,DelegateTo').select('ReportingManager/Title,ReportingManager/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('ReportingManager/Title', true).getAll(),
            sp.web.currentUser.groups(),
        ])
        let isAdmin = false,userGroups = [],filterDelegates = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if(userGroups.includes('Timesheet Administrators')){
            isAdmin = true
            // filterDelegates = DelegationData
            filterDelegates = DelegationData.filter(item=>{
                return item.ReportingManagerId != null
            })
        }
        else{
            let data  = DelegationData.filter(item=>{
                return item.ReportingManagerId != null
            })
            for (const d of data) {
                if(d.ReportingManager.ID == userID){
                    filterDelegates.push(d)
                }
            }
        }
        let tableDataObj = []
        let excelData = []
        for (const d of filterDelegates) {
            let fromDate = new Date(d.From)
                    let toDate = new Date(d.To)
                    tableDataObj.push({
                        Id : d.Id,
                        Client: d.Client==null?'':d.Client,
                        ReportingManager: d.ReportingManager.Title,
                        DelegateTo:d.DelegateTo.Title,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                    })
                    excelData.push({
                        Id : d.Id,
                        Client: d.Client,
                        ReportingManager: d.ReportingManager.Title,
                        DelegateTo:d.DelegateTo.Title,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                    })
        }
        this.setState({isAdmin:isAdmin,ManagerDelegates:tableDataObj,ExcelData:excelData,loading:false})
    }

    private  handleRowClicked = (row) => {
        let ID = row.Id
        this.setState({RecordID:ID,redirect:true})
      }

    public render() {
        const columns = [
            {
                name: "Edit",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/DelegateApprovalTimesheets/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                // width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate,
                // width: '250px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                // width: '250px',
                sortable: true
            }
           
        ];
        const AdminColumns = [
            {
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View"  className="csrLink ms-draggable" to={`/DelegateApprovalTimesheets/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                // width: '250px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.ReportingManager,
                // width: '250px',
                sortable: true
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                // width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate,
                width: '250px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                // width: '250px',
                sortable: true
            }
           
        ];
        const ExcelColumns = [
            {
                name: "Client",
                selector: "Client",
               
            },
            {
                name: "Reporting Manager",
                selector:"ReportingManager",
            },
            {
                name: "Delegate To",
                selector: "DelegateTo",
                width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: "FromDate",
            },
            {
                name: "To",
                selector: "ToDate",
            }
           
        ];
        if (!this.state.isRecordAcessable) {
            // let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            let url = this.siteURL + "/SitePages/AccessDenied.aspx"
            window.location.href = url
        }
        if(this.state.redirect){
            let url = `/DelegateApprovalTimesheets/${this.state.RecordID}`;
        return (<Navigate to={url}/>);
        }
        else {
            return (
                <React.Fragment>
                   <div className="">
                <div className="mx-2"><div className="text-right pt-2">
                    <NavLink title="Apply new delegation"  className="csrLink ms-draggable" to={`/DelegateApprovalTimesheets`}>
                    <button type="button" id="btnSubmit" className="SubmitButtons btn">
                        <span className='' id='AutoManagerDelegation'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                        </button></NavLink>
                </div></div>
                <div className='c-v-table table-head-1st-td'>
                    <TableGenerator columns={this.state.isAdmin?AdminColumns:columns} data={this.state.ManagerDelegates} fileName={'Manager Delegations'} showExportExcel={this.state.isAdmin} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExcelData} wrapColumns={[]} onRowClick={this.handleRowClicked} searchBoxLeft={!this.state.isAdmin}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
                </React.Fragment >
            );
        }
    }

}

export default ManagerDelegationsView