import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';

export interface ApproversProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ApproversState {
    ReportingManager: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number
}

class ApproversApprovals extends React.Component<ApproversProps, ApproversState> {
    constructor(props: ApproversProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {ReportingManager: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        this.ReportingManagerApproval();
    }
// this function is used to get 1 month records of weeklytime data of the employees who's manager is current logged in user from weeklytimesheet list
    private ReportingManagerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '"+date+"'"
        var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString+filterQuery).expand("ReportingManager").select('ReportingManager/Title','*').orderBy('WeekStartDate,DateSubmitted', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.WeekStartDate)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : d.Status==StatusType.ReviewerReject?'Rejected by Synergy':d.Status==StatusType.ManagerReject?'Rejected by Reporting Manager':d.Status,
                        BillableTotalHrs: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillable:d.BillableTotalHrs,
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs:JSON.parse(d.ClientHolidayHrs)[0].Total,
                        PTOHrs:JSON.parse(d.PTOHrs)[0].Total,
                        GrandTotal: d.GrandTotal
                    })
                }
                console.log(Data);
                this.setState({ ReportingManager: Data,loading: false });
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
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
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Date",
                selector: (row, i) => row.Date,
                width: '100px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                width: '300px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                sortable: true
            },
            {
                name: "Billable",
                selector: (row, i) => row.WeeklyTotalHrs,
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                width: '110px',
                sortable: true,
            },
            {
                name: "Holiday",
                selector: (row, i) => row.HolidayHrs,
                sortable: true,
            },
            {
                name: "PTO",
                selector: (row, i) => row.PTOHrs,
                sortable: true,
            },
            {
                name: "Grand Total",
                selector: (row, i) => row.GrandTotal,
                sortable: true
            }
        ];
        return (
            <React.Fragment>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.ReportingManager} fileName={'My Approvals'} showExportExcel={false}
                    showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='newEmployeeMasterForm' btnCaption='' btnTitle='' searchBoxLeft={true}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default ApproversApprovals