import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';
import ModalForwardApprovals from '../Shared/ModalForwardApprovals.component';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
export interface HRApprovalProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface HRApprovalState {
    // ReportingManager: Array<Object>;
    // loading:boolean;
    // message : string;
    // title : string;
    // showHideModal : boolean;
    // isSuccess : boolean;
    // comments :  string;
    // Action : string;
    // errorMessage: string;
    // ItemID : Number;
    // SelectedRows:any;
    // SelectedValue:String;
    // DelegateToId:String;
    // // IsDelegated:boolean;
    // AssignedToId:String;
}

class HRApproval extends React.Component<HRApprovalProps, HRApprovalState> {
    constructor(props: HRApprovalProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        // this.state = {ReportingManager: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,SelectedRows:[],SelectedValue:'',AssignedToId:'',DelegateToId:''};
    }
    public state = {
        HRApprovals: [],
        loading: false, message: '',
        title: '',
        showHideModal: false,
        isSuccess: true,
        comments: '',
        Action: '',
        errorMessage: '',
        ItemID: 0,
        SelectedRows: [],
        SelectedValue: '',
        DelegateToUsers: [],
        PTOID:'',
        redirect: false,
        //  AssignedToId:'',
        //  DelegateToId:'',
    };

    public componentDidMount() {
        this.getHRApprovals();
    }
    private getHRApprovals = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "From ge '" + date + "'"
        // var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"
        var filterString = "and PendingWith eq 'HR'";
        sp.web.lists.getByTitle('PTO').items.top(2000).filter(filterQuery + filterString).expand("ReportingManager,Employee").select('ReportingManager/Title,ReportingManager/EMail,Employee/Title,Employee/EMail,*').orderBy('From', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let fromDate = new Date(d.From.split('-')[1]+'/'+d.From.split('-')[2].split('T')[0]+'/'+d.From.split('-')[0]);
                    let toDate = new Date(d.To.split('-')[1]+'/'+d.To.split('-')[2].split('T')[0]+'/'+d.To.split('-')[0]);

                    Data.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        EmployeeType: d.EmployeeType,
                        PTOType: d.PTOType,
                        FromDate : `${fromDate.getMonth() + 1}/${fromDate.getDate()}/${fromDate.getFullYear()}`,
                        ToDate: `${toDate.getMonth() + 1}/${toDate.getDate()}/${toDate.getFullYear()}`,
                        TotalHrs:parseFloat(d.TotalHours),
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : this.getStatus(d.Status),
                    })
                }
                this.setState({ReportingManager:Data,loading:false})
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    private getStatus(value){
        let Status=value
        if(value =="approved by Manager")
        {
            Status = "Approved by Reporting Manager"
        }
        else if(value == "rejected by Manager"){
                Status = "Rejected by Reporting Manager"
            }
        else if(value =="rejected by Synergy")
            {
                Status = "Rejected by Synergy"
            }
        return Status
    }

    private  handleRowClicked = (row) => {
        let ID = row.Id
        this.setState({PTOID:ID,redirect:true})
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/PTOForm/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                width: '250px',
                sortable: true
            },
            {
                name: "Employee Type",
                selector: (row, i) => row.EmployeeType,
                width: '250px',
                sortable: true
            },
            {
                name: "PTO Type",
                selector: (row, i) => row.PTOType,
                width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate ,
                width: '250px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                width: '250px',
                sortable: true
            },
            {
                name: "Total Hours",
                selector: (row, i) => row.TotalHrs,
                width: '250px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                width: '180px',
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                sortable: true
            },
        ];
        if(this.state.redirect){
            let url = `/PTOForm/${this.state.PTOID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.HRApprovals} fileName={''} showExportExcel={false}
                            showAddButton={false} searchBoxLeft={true} onRowClick={this.handleRowClicked} ></TableGenerator>
                    </div>
                </div>
                <Toaster />
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default HRApproval