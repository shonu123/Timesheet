import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck,faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
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
    ItemID : Number;
    ExportExcelData:any;
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
        this.state = {AllRequests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,ExportExcelData:[]};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.setState({ loading: true });
        this.AllRequests();
    }

    private AllRequests = async () => {
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        // var filterString = "Approvers/Id eq '"+userId+"' and PendingWith eq 'Approver' and Status eq '"+StatusType.Submit+"'"
        var filterString = "WeekStartDate ge '"+date+"'"


        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterString).expand("ReportingManager").select('ReportingManager/Title','*').orderBy('WeekStartDate,DateSubmitted', false).getAll()
            .then((response) => {
                console.log(response)
                let Data = [];
                let ExcelData  =[]
                for (const d of response) {
                    let Rm = '';
                    let ExcelRm = ''
                    if(d.ReportingManager.length>0)
                    {
                        for(let r of d.ReportingManager){
                            Rm += "<div>"+r.Title+"</div>"
                            ExcelRm += r.Title+","
                        }
                        ExcelRm = ExcelRm.substring(0, ExcelRm.lastIndexOf(","));
                    }
                    let date = new Date(d.WeekStartDate)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        // Status : d.Status == StatusType.Submit?'Pending With Reporting Manager':d.Status== StatusType.InProgress?'Pending With Reviewer':d.Status,
                        Status : d.Status=='rejected by Synergy'?'Rejected by Synergy':d.Status=='rejected by Manager'?'Rejected by Manager':d.Status,
                        Client: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        BillableHours: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHrs: d.BillableTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        TotalHours: d.GrandTotal,
                        RM : Rm
                    })
                    ExcelData.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        // Status : d.Status == StatusType.Submit?'Pending With Reporting Manager':d.Status== StatusType.InProgress?'Pending With Reviewer':d.Status,
                        Status : d.Status=='rejected by Synergy'?'Rejected by Synergy':d.Status=='rejected by Manager'?'Rejected by Manager':d.Status,
                        Client: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        BillableHours: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHrs: d.BillableTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        TotalHours: d.GrandTotal,
                        RM : ExcelRm
                    })

                }
                console.log(Data);
                this.setState({ AllRequests: Data,ExportExcelData:ExcelData,loading: false });
                // setTimeout(() => {
                //     this.setState({ loading: false });
                //       }, 1000);
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
                width: '120px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                // width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                // width: '120px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.RM,
                // width: '250px',
                cell: row => <div dangerouslySetInnerHTML={{ __html: row.RM }} />,
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                // width: '250px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                // width: '140px',
                sortable: true
            },
            {
                name: "Billable",
                selector: (row, i) => row.BillableHours,
                sortable: true,
                // width: '160px'
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                width: '120px',
                sortable: true,
            },
            {
                name: "Total Billable",
                selector: (row, i) => row.TotalBillableHrs,
                sortable: true,
                // width: '170px'
            },
            {
                name: "Non-Billable",
                selector: (row, i) => row.NonBillableTotalHrs,
                sortable: true,
                // width: '185px'
            },
            {
                name: "Total",
                selector: (row, i) => row.TotalHours,
                width:'140px',
                sortable: true
            }
        ];
        const Exportcolumns = [   
            {
                name: "Date",
                selector: "Date",
                width: '120px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: "EmployeName",
                // width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector: "Client",
                // width: '120px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: "RM",
                sortable: true
            },
            {
                name: "Status",
                selector: "Status",
                sortable: true
            },
            {
                name: "Pending With",
                selector: "PendingWith",
                sortable: true
            },
            {
                name: "Billable Hours",
                selector: "BillableHours",
                sortable: true,
            },
            {
                name: "OT Hours",
                selector: "OTTotalHrs",
                width: '120px',
                sortable: true,
            },
            {
                name: "Total Billable Hours",
                selector: "TotalBillableHrs",
                sortable: true,
            },
            {
                name: "Non-Billable Hours",
                selector: "NonBillableTotalHrs",
                sortable: true,
            },
            {
                name: "Total Hours",
                selector: "TotalHours",
                width:'140px',
                sortable: true
            }
        ];
        return (
            <React.Fragment>
            {/* <h1>Approver Screen</h1> */}
            <div className="">
                {/* <div style={{ paddingLeft: '10px' }} className="px-1 text-right" id='divNewWeeklyTimeSheet'>
                    <NavLink title="New Weekly Timesheet"  className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                        <span className='SubmitButtons' id='newWeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </div> */}
                <div className="mx-2"><div className="text-right pt-2"><button type="button" id="btnSubmit" className="SubmitButtons btn"><NavLink title="New Weekly Timesheet"  className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                        <span className='' id='WeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </button></div></div>
                <div className='c-v-table table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.AllRequests} fileName={'All Requests'} showExportExcel={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.ExportExcelData} ></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}

export default AllRequests