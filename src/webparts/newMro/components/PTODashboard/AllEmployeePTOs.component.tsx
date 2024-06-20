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
export interface AllPTOsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface AllPTOsState {
    AllPTO: Array<Object>;
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
    PTOID:string;
    redirect: boolean;
}

class AllPTOs extends React.Component<AllPTOsProps,AllPTOsState> {
    constructor(props: AllPTOsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {AllPTO: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,ExportExcelData:[],PTOID:'',redirect: false};
    }

    public componentDidMount() {
        this.setState({ loading: true });
        this.AllPTO();
    }
// this function is used to get 1 month records of weeklytime data of all employees from weeklytimesheet list
    private AllPTO = async () => {
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterString = "From ge '"+date+"'"
        sp.web.lists.getByTitle('PTO').items.top(5000).filter(filterString).expand("Employee,ReportingManager").select('ReportingManager/Title,Employee/Title','*').orderBy('From', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                let ExcelData  =[]
                for (const d of response) {
                    let Rm = '';
                    let ExcelRm = ''
                    if(d.ReportingManager.length>0)
                    {
                        for(let r of d.ReportingManager){
                            Rm += "<div>"+r.Title+"</div>"
                            ExcelRm += r.Title+"\n"
                        }
                        // ExcelRm = ExcelRm.substring(0, ExcelRm.lastIndexOf("\n"));
                    }
                    let fromDate = new Date(d.From)
                    let toDate = new Date(d.To)
                    // let isBillable = true;
                    // if(d.ClientName.toLowerCase().includes('synergy')){
                    //     isBillable = false
                    // }
                    Data.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        Client: d.Client,
                        EmployeeType: d.EmployeeType,
                        PTOType: d.PTOType,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                        TotalHrs: parseFloat(d.TotalHours),
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : this.getStatus(d.Status),
                        RM : Rm
                    })
                    ExcelData.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        Client: d.Client,
                        EmployeeType: d.EmployeeType,
                        PTOType: d.PTOType,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                        TotalHrs: parseFloat(d.TotalHours),
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : this.getStatus(d.Status),
                        RM : ExcelRm
                    })
                }
                // console.log(Data);
                this.setState({ AllPTO: Data,ExportExcelData:ExcelData,loading: false });
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
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View"  className="csrLink ms-draggable" to={`/PTOForm/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
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
                name: "Employee Type",
                selector: (row, i) => row.EmployeeType,
                width: '220px',
                sortable: true
            },
            {
                name: "PTO Type",
                selector: (row, i) => row.PTOType,
                width: '220px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate ,
                width: '220px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                width: '220px',
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
                name: "Total Hours",
                selector: (row, i) => row.TotalHrs,
                width: '220px',
                sortable: true
            },
        ];
        const Exportcolumns = [  
            {
                name: "Employee Name",
                selector: "EmployeName",
                width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector:  "Client",
                width: '130px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: "RM",
                width: '230px',
                sortable: true
            },
            {
                name: "Employee Type",
                selector: "EmployeeType",
                width: '220px',
                sortable: true
            },
            {
                name: "PTO Type",
                selector:  "PTOType",
                width: '220px',
                sortable: true
            },
            {
                name: "From",
                selector:  "FromDate" ,
                width: '220px',
                sortable: true
            },
            {
                name: "To",
                selector: "ToDate",
                width: '220px',
                sortable: true
            },
            {
                name: "Status",
                selector:  "Status",
                width: '220px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: "PendingWith",
                width: '180px',
                sortable: true
            },
            {
                name: "Total Hours",
                selector: "TotalHrs",
                width: '220px',
                sortable: true
            },
        ];
        if(this.state.redirect){
            let url = `/PTOForm/${this.state.PTOID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div className="">
                {/* <div className="mx-2"><div className="text-right pt-2">
                    <NavLink title="New Weekly Timesheet"  className="csrLink ms-draggable" to={`/PTOForm`}>
                    <button type="button" id="btnSubmit" className="SubmitButtons btn">
                        <span className='' id='WeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                        </button></NavLink>
                </div></div> */}
                <div className='c-v-table table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.AllPTO} fileName={'All PTOs'} showExportExcel={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={["RM","Client"]} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default AllPTOs