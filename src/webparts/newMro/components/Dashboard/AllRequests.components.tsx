import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
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
    // AllRequests: Array<Object>;
    // loading:boolean;
    // message : string;
    // title : string;
    // showHideModal : boolean;
    // isSuccess : boolean;
    // comments :  string;
    // Action : string;
    // errorMessage: string;
    // ItemID : Number;
    // ExportExcelData:any;
}

class AllRequests extends React.Component<AllRequestsProps,AllRequestsState> {
    constructor(props: AllRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
    }
   public state = {AllRequests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,ExportExcelData:[],TimesheetID:'',redirect:false,};

    public componentDidMount() {
        this.setState({ loading: true });
        this.AllRequests();
    }
// this function is used to get 1 month records of weeklytime data of all employees from weeklytimesheet list
    private AllRequests = async () => {
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterString = "WeekStartDate ge '"+date+"'"
        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterString).expand("ReportingManager").select('ReportingManager/Title','*').orderBy('WeekStartDate', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                let ExcelData  =[]
                for (const d of response) {
                    let Rm = '';
                    let ExcelRm = ''
                    d.ReportingManager.sort((a, b) => a.Title.localeCompare(b.Title));
                    if(d.ReportingManager.length>0)
                    {
                        for(let r of d.ReportingManager){
                            Rm += "<div>"+r.Title+"</div>"
                            ExcelRm += r.Title+"\n"
                        }
                        // ExcelRm = ExcelRm.substring(0, ExcelRm.lastIndexOf("\n"));
                    }
                    let date = new Date(d.WeekStartDate.split('-')[1]+'/'+d.WeekStartDate.split('-')[2].split('T')[0]+'/'+d.WeekStartDate.split('-')[0]);
                    let isBillable = true;
                    if(d.ClientName.toLowerCase().includes('synergy')){
                        isBillable = false
                    }
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        // Status : d.Status == StatusType.Submit?'Pending With Reporting Manager':d.Status== StatusType.InProgress?'Pending With Reviewer':d.Status,
                        Status : this.getStatus(d.Status),
                        Client: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        BillableHours: isBillable?parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)):parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                        OTTotalHrs : parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                        TotalBillableHrs: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs:parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                        PTOHrs:parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(2)),
                        TotalHours: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                        RM : Rm
                    })
                    ExcelData.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        // Status : d.Status == StatusType.Submit?'Pending With Reporting Manager':d.Status== StatusType.InProgress?'Pending With Reviewer':d.Status,
                        Status : this.getStatus(d.Status),
                        Client: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        BillableHours: isBillable?d.WeeklyTotalHrs:JSON.parse(d.SynergyOfficeHrs)[0].Total,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHrs: d.BillableTotalHrs,
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs:JSON.parse(d.ClientHolidayHrs)[0].Total,
                        PTOHrs:JSON.parse(d.PTOHrs)[0].Total,
                        TotalHours: d.GrandTotal,
                        RM : ExcelRm
                    })
                }
                // console.log(Data);
                this.setState({ AllRequests: Data,ExportExcelData:ExcelData,loading: false });
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
        this.setState({TimesheetID:ID,redirect:true})
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
                                <NavLink title="View"  className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
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
                width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                width: '130px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.RM,
                cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.RM }} />,
                width: '230px',
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                width: '220px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                width: '180px',
                sortable: true
            },
            {
                name: "Hours",
                selector: (row, i) => row.BillableHours,
                width: '110px',
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                width: '100px',
                sortable: true,
            },
            {
                name: "Total Billable",
                selector: (row, i) => row.TotalBillableHrs,
                width: '150px',
                sortable: true,
            },
            {
                name: "Holiday",
                selector: (row, i) =>row.HolidayHrs,
                width: '130px',
                sortable: true,
            },
            {
                name: "Time Off",
                selector: (row, i) =>row.PTOHrs,
                width: '110px',
                sortable: true,
            },
            // {
            //     name: "Non-Billable",
            //     selector: (row, i) => row.NonBillableTotalHrs,
            //     sortable: true,
            // },
            {
                name: "Grand Total",
                selector: (row, i) => row.TotalHours,
                // width:'140px',
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
                sortable: true
            },
            {
                name: "Client",
                selector: "Client",
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
                name: "Hours",
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
            // {
            //     name: "Non-Billable Hours",
            //     selector: "NonBillableTotalHrs",
            //     sortable: true,
            // },
            {
                name: "Holiday Hours",
                selector: "HolidayHrs",
                sortable: true,
            },
            {
                name: "Time Off Hours",
                selector: "PTOHrs",
                sortable: true,
            },
            {
                name: "Grand Total Hours",
                selector: "TotalHours",
                width:'140px',
                sortable: true
            }
        ];
        if(this.state.redirect){
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div className="">
                <div className="mx-2"><div className="text-right pt-2">
                    <NavLink title="New Weekly Timesheet"  className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                    <button type="button" id="btnSubmit" className="SubmitButtons btn">
                        <span className='' id='WeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                        </button></NavLink>
                </div></div>
                <div className='c-v-table table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.AllRequests} fileName={'All Timesheets'} showExportExcel={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={["RM","Client"]} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default AllRequests