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
import DateUtilities from '../../Utilities/DateUtilities';
import CommonUtilities from '../../Utilities/CommonUtilities';


export interface AllTimeOffsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface AllTimeOffsState {
    AllTimeOffs: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    erroSynMngressage: string;
    ItemID : Number;
    ExportExcelData:any;
    TimeOffID:string;
    redirect: boolean;
}

class AllTimeOffs extends React.Component<AllTimeOffsProps,AllTimeOffsState> {
    constructor(props: AllTimeOffsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {AllTimeOffs: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',erroSynMngressage:'',ItemID:0,ExportExcelData:[],TimeOffID:'',redirect: false};
    }

    public componentDidMount() {
        this.setState({ loading: true });
        this.GetCurrYearAllTimeOffs();
    }
// this function is used to get 1 month records of weeklytime data of all employees from weeklytimesheet list
    private GetCurrYearAllTimeOffs = async () => {
        const userId = this.props.spContext.userId;
        let YearStart = `01/01/${new Date().getFullYear()}`;
        let YearEnd = `12/31/${new Date().getFullYear()}`;
        var filterString = "From ge '"+YearStart+"' and From le '"+YearEnd+"' and IsActive eq 1";
        sp.web.lists.getByTitle('TimeOffEmployees').items.top(5000).filter(filterString).expand("Employee,SynergyManager").select('SynergyManager/Title,Employee/Title','*').orderBy('From', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                let ExcelData  =[]
                for (const d of response) {
                    let SynMngr = '';
                    let ExcelSynMngr = '';
                    if(d.SynergyManager.length>0)
                    {
                        for(let r of d.SynergyManager){
                            SynMngr += "<div>"+r.Title+"</div>";
                            ExcelSynMngr += r.Title+"\n";
                        }
                        // ExcelSynMngr = ExcelSynMngr.substring(0, ExcelSynMngr.lastIndexOf("\n"));
                    }
                    let fromDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.From));
                    let toDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.To));
                    // let isBillable = true;
                    // if(d.ClientName.toLowerCase().includes('synergy')){
                    //     isBillable = false
                    // }
                    Data.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        // TimeOffType: d.TimeOffType,
                        FromDate : DateUtilities.getDateMMDDYYYY(fromDate),
                        FromDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(fromDate)}</span>${DateUtilities.getDateMMDDYYYY(fromDate)}`,
                        ToDate : DateUtilities.getDateMMDDYYYY(toDate),
                        ToDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(toDate)}</span>${DateUtilities.getDateMMDDYYYY(toDate)}`,
                        PTOAvailableBalance:[null,undefined,''].includes(d.PTOAvailableBalance)?0:parseFloat(d.PTOAvailableBalance),
                        PTOTotal: [null,undefined,''].includes(d.PTOTotal)?0:parseFloat(d.PTOTotal),
                        TOTotal: [null,undefined,''].includes(d.TOTotal)?0:parseFloat(d.TOTotal),
                        TotalHrs: parseFloat(d.TotalHours),
                        PendingWith: d.PendingWith == "Manager" ?"Synergy Manager":d.PendingWith,
                        Status : CommonUtilities.getTOStatus(d.Status),
                        StatusForGrid:`<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTOStatus(d.Status)}'>${CommonUtilities.getTOStatusInShortForm(d.Status)}</span>`,
                        SynMngr : ExcelSynMngr,
                        SynMngrForGrid : SynMngr
                    })
                    ExcelData.push({
                        Id : d.Id,
                        EmployeName: d.Employee.Title,
                        TimeOffType: d.TimeOffType,
                        FromDate : DateUtilities.getDateMMDDYYYY(fromDate),
                        ToDate : DateUtilities.getDateMMDDYYYY(toDate),
                        PTOAvailableBalance:[null,undefined,''].includes(d.PTOAvailableBalance)?0:parseFloat(d.PTOAvailableBalance),
                        PTOTotal: [null,undefined,''].includes(d.PTOTotal)?0:parseFloat(d.PTOTotal),
                        TOTotal: [null,undefined,''].includes(d.TOTotal)?0:parseFloat(d.TOTotal),
                        TotalHrs: parseFloat(d.TotalHours),
                        PendingWith: d.PendingWith == "Manager" ?"Synergy Manager":d.PendingWith,
                        Status : CommonUtilities.getTOStatus(d.Status),
                        SynMngr : ExcelSynMngr
                    })
                }
                this.setState({ AllTimeOffs: Data,ExportExcelData:ExcelData,loading: false });
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
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View"  className="csrLink ms-draggable" to={`/TimeOffRequestForm/${record.Id}`}>
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
                // width: '250px',
                sortable: true
            },
            {
                name: "Synergy Manager",
                selector: (row, i) => row.SynMngrForGrid,
                cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.SynMngrForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)} />,
                // width: '230px',
                sortable: true
            },
            // {
            //     name: "Time Off Type",
            //     selector: (row, i) => row.TimeOffType,
            //     //width: '220px',
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
                // width: '120px'
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
             {
                name: "Status",
                selector: (row, i) => row.Status,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.StatusForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                width: '220px',
                sortable: true
            },
            // {
            //     name: "Pending With",
            //     selector: (row, i) => row.PendingWith,
            //     // width: '160px',
            //     sortable: true
            // }
        ];
        const Exportcolumns = [  
            {
                name: "Employee Name",
                selector: "EmployeName",
                width: '250px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: "SynMngr",
                width: '230px',
                sortable: true
            },
            // {
            //     name: "Time Off Type",
            //     selector:  "TimeOffType",
            //     width: '220px',
            //     sortable: true
            // },
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
                name: "PTO Balance",
                selector:'PTOAvailableBalance',
                sortable: true,
                width: '210px'
            },
            {
                name: "Paid Time Off",
                selector: "PTOTotal",
                width: '110px',
                sortable: true
            },
            {
                name: "Time Off",
                selector: "TOTotal",
                width: '100px',
                sortable: true
            },
            {
                name: "Total",
                selector: "TotalHrs",
                width: '100px',
                sortable: true
            },
            {
                name: "Status",
                selector:  "Status",
                width: '220px',
                sortable: true
            },
            // {
            //     name: "Pending With",
            //     selector: "PendingWith",
            //     width: '180px',
            //     sortable: true
            // }
        ];
        // const searchKeys=['EmployeName','SynMngr','FromDate','ToDate','PTOAvailableBalance','PTOTotal','TOTotal','TotalHrs','PendingWith','Status'];
        const searchKeys=['EmployeName','SynMngr','FromDate','ToDate','PTOAvailableBalance','PTOTotal','TOTotal','TotalHrs','Status'];
        if(this.state.redirect){
            let url = `/TimeOffRequestForm/${this.state.TimeOffID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div className="">
                <div className='c-v-table'>
                    <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.AllTimeOffs} fileName={'All TimeOffs - '+new Date().getFullYear()} showExportExcel={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={["SynMngr"]} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default AllTimeOffs;