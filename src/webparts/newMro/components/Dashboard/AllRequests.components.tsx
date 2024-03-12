import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck, faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';

export interface AllRequestsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface AllRequestsState {
    // Approvers: Array<Object>;
    AllRequests: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number
    // pageNumber:number;
    // sortBy:number;
    // sortOrder:boolean;
}

class AllRequests extends React.Component<AllRequestsProps,AllRequestsState> {
    constructor(props: AllRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {AllRequests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.AllRequests();
    }

    private AllRequests = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-21);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        // var filterString = "Approvers/Id eq '"+userId+"' and PendingWith eq 'Approver' and Status eq '"+StatusType.Submit+"'"
        var filterString = "WeekStartDate ge '"+date+"' and Status ne 'In-Draft'"


        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("ReportingManager").select('ReportingManager/Title','*').orderBy('WeekStartDate,DateSubmitted', false).getAll()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let Rm = ''
                    if(d.ReportingManager.length>0)
                    {
                        for(let r of d.ReportingManager){
                            Rm += r.Title+","
                        }
                        Rm = Rm.substring(0, Rm.lastIndexOf(","));
                    }
                    let date = new Date(d.WeekStartDate)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        Status : d.Status == StatusType.Submit?'Pending With Reporting Manager':d.Status== StatusType.InProgress?'Pending With Reviewer':d.Status,
                        Client: d.ClientName,
                        PendingWith: d.PendingWith,
                        BillableHours: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHrs: d.BillableTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        TotalHours: d.GrandTotal,
                        RM : Rm
                    })

                }
                console.log(Data);
                this.setState({ AllRequests: Data,loading:false });
                this.setState({ loading: false });
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }


    public render() {
        const columns = [
            {
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
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
                width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                width: '120px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.RM,
                width: '250px',
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                width: '250px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                width: '140px',
                sortable: true
            },
            {
                name: "Billable Hours",
                selector: (row, i) => row.BillableHours,
                sortable: true,
                width: '140px'
            },
            {
                name: "OT Hours",
                selector: (row, i) => row.OTTotalHrs,
                width: '120px',
                sortable: true,
            },
            {
                name: "Total Billable Hours",
                selector: (row, i) => row.TotalBillableHrs,
                sortable: true,
                width: '170px'
            },
            {
                name: "Non-Billable Hours",
                selector: (row, i) => row.NonBillableTotalHrs,
                sortable: true,
                width: '170px'
            },
            {
                name: "Total Hours",
                selector: (row, i) => row.TotalHours,
                sortable: true
            }
        ];
        return (
            <React.Fragment>
            {/* <h1>Approver Screen</h1> */}
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.AllRequests} fileName={'All Requests'} showExportExcel={false}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default AllRequests