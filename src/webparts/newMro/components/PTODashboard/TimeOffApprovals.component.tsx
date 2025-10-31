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
import DateUtilities from '../../Utilities/DateUtilities';
import CommonUtilities from '../../Utilities/CommonUtilities';


export interface TimeOffApprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface TimeOffApprovalsState {
    // SynergyManager: Array<Object>;
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

class TimeOffApprovals extends React.Component<TimeOffApprovalsProps, TimeOffApprovalsState> {
    constructor(props: TimeOffApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        // this.state = {SynergyManager: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,SelectedRows:[],SelectedValue:'',AssignedToId:'',DelegateToId:''};
    }
    public state = {
        SynergyManager: [],
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
        // DelegateToUsers: [],
        TimeOffID:'',
        redirect: false,
        //  AssignedToId:'',
        //  DelegateToId:'',
    };

    public componentDidMount() {
        this.SynergyManagerApproval();
    }
    // this function is used to get 1 month records of weeklytime data of the employees who's manager is current logged in user from weeklytimesheet list
    private SynergyManagerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        // let dateFilter = new Date()
        // dateFilter.setDate(new Date().getDate() - 60);
        // let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        // var filterQuery = "and From ge '" + date + "'"
        // var filterString = "SynergyManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"
       
        var filterString = "(SynergyManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and IsActive eq 1 and IsSubmittedFromTimesheetForm ne 1)";
         //If current logged in user is manager and as well as HR, filter Pending with HR requests also
        let groups= await sp.web.currentUser.groups();
        if(groups.some(grp=>grp.Title=="Timesheet HR"))
        {
            filterString+= " or (PendingWith eq 'HR' and IsSubmittedFromTimesheetForm ne 1)";
        }
        sp.web.lists.getByTitle('TimeOffEmployees').items.top(5000).filter(filterString).expand("SynergyManager,Employee").select('SynergyManager/Title,SynergyManager/EMail,Employee/Title,Employee/EMail,*').orderBy('Modified', false).getAll()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let fromDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.From));
                    let toDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.To));
                    //let timeOffTypeStr = "<div>"+JSON.parse(d.TimeOffType).join("</div><div>")+"</div>"
                    
                    Data.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        // TimeOffType: timeOffTypeStr,
                        // TimeOffType: d.TimeOffType,
                        FromDate : DateUtilities.getDateMMDDYYYY(fromDate),
                        FromDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(fromDate)}</span>${DateUtilities.getDateMMDDYYYY(fromDate)}`,
                        ToDate : DateUtilities.getDateMMDDYYYY(toDate),
                        ToDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(toDate)}</span>${DateUtilities.getDateMMDDYYYY(toDate)}`,
                        PTOAvailableBalance:[null,undefined,''].includes(d.PTOAvailableBalance)?0:parseFloat(d.PTOAvailableBalance),
                        PTOTotal: [null,undefined,''].includes(d.PTOTotal)?0:parseFloat(d.PTOTotal),
                        TOTotal: [null,undefined,''].includes(d.TOTotal)?0:parseFloat(d.TOTotal),
                        TotalHrs:parseFloat(d.TotalHours),
                        // PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Synergy Manager":d.PendingWith,
                        Status : CommonUtilities.getTOStatus(d.Status),
                        StatusForGrid:`<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTOStatus(d.Status)}'>${CommonUtilities.getTOStatusInShortForm(d.Status)}</span>`
                    })
                    
                }
                this.setState({SynergyManager:Data,loading:false});
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    private  handleRowClicked = (row,Id?) => {
        let ID = row.Id?row.Id:Id;
        this.setState({TimeOffID:ID,redirect:true})
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/TimeOffRequestForm/${record.Id}`}>
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
                // width: '250px',
                sortable: true
            },
            // {
            //     name: "Time Off Type",
            //     selector: (row, i) => row.TimeOffType,
            //     cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.TimeOffType }} onClick={(event)=>this.handleRowClicked(row)}/>,
            //     // width: '200px',
            //     sortable: true
            // },
            // {
            //     name: "Time Off Type",
            //     selector: (row, i) => row.TimeOffType,
            //     sortable: true
            // },
            {
                name: "From",
                selector: (row, i) => row.FromDateForGrid ,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.FromDateForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                // width: '120px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDateForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.ToDateForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                // width: '120px',
                sortable: true
            },
            {
                name: "PTO Balance",
                selector: (row, i) => row.PTOAvailableBalance,
                sortable: true,
                // width: '130px'
            },
            {
                name: "Paid Time Off",
                selector: (row, i) => row.PTOTotal,
                // width: '130px',
                sortable: true
            },
            {
                name: "Time Off",
                selector: (row, i) => row.TOTotal,
                // width: '110px',
                sortable: true
            },
            {
                name: "Total",
                selector: (row, i) => row.TotalHrs,
                // width: '100px',
                sortable: true
            },
            // {
            //     name: "Pending With",
            //     selector: (row, i) => row.PendingWith,
            //     width: '180px',
            //     sortable: true
            // },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.StatusForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                width: '220px',
                sortable: true,
            },
        ];
        const searchKeys=['EmployeName','FromDate','ToDate','PTOAvailableBalance','PTOTotal','TOTotal','TotalHrs','Status'];

        if(this.state.redirect){
            let url = `/TimeOffRequestForm/${this.state.TimeOffID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
                <div>
                    <div className=''>
                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.SynergyManager} fileName={''} showExportExcel={false}
                            showAddButton={false} searchBoxLeft={true} onRowClick={this.handleRowClicked} ></TableGenerator>
                    </div>
                </div>
                <Toaster />
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default TimeOffApprovals;