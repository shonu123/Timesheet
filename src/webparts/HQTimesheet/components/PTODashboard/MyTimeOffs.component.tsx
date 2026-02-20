import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import DateUtilities from '../../Utilities/DateUtilities';
import { StatusType } from '../../Constants/Constants';
import CommonUtilities from '../../Utilities/CommonUtilities';

export interface MyTimeOffsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MyTimeOffsState {
    Requests: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number;
    TimeOffID:string;
    redirect: boolean;
}

class MyTimeOffs extends React.Component<MyTimeOffsProps,MyTimeOffsState> {
    constructor(props: MyTimeOffsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Requests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,TimeOffID:'',redirect: false};
    }

    public componentDidMount() {
        this.MyTimeOffs();
    }
// this function is used to get 1 month records of weeklytime data of the current logged in user from weeklytimesheet list
    private MyTimeOffs = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        //let dateFilter = new Date()
        //dateFilter.setDate(new Date().getDate()-60);
        //let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        let YearStart = `06/01/${new Date().getFullYear()-1}`;
        let YearEnd = `05/31/${new Date().getFullYear()+1}`;
       // var filterString = "From ge '"+YearStart+"' and From le '"+YearEnd+"'";
       try{
        let EmpFilterQuery=`Employee/Id eq '${userId}' and IsActive eq 1`;
        let Employees = await sp.web.lists.getByTitle('Employees').items.top(5000).filter(EmpFilterQuery).expand("Employee").select('Employee/Title','*').getAll();
        let EmpMatrixID=Employees.length?Employees[0].Id:0;

        let filterQuery=`Employee/Id eq '${userId}' and EmpMatrixID eq '${EmpMatrixID}' and IsActive eq 1 and ( (From ge '${YearStart}' and From le '${YearEnd}') or Status eq '${StatusType.ManagerReject}' or Status eq '${StatusType.HRReject}' )`;

        sp.web.lists.getByTitle('TimeOffEmployees').items.top(5000).filter(filterQuery).expand("Employee").select('Employee/Title','*').orderBy('Modified', false).getAll()
            .then((response) => {
                // console.log(response)
                let Data = [];
                response.sort((a,b)=>b.Id-a.Id);
                for (const d of response) {
                    let fromDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.From));
                    let toDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.To));
                    // let TimeOffTypeHtmlString='';
                    // let TimeOffTypes=[null,undefined,''].includes(d.TimeOffType)?[]:JSON.parse(d.TimeOffType);
                    // for(let type of TimeOffTypes){
                    //     TimeOffTypeHtmlString+= "<div>"+type+"</div>";
                    // }
                    Data.push({
                        Id : d.Id,
                        Client: d.Client,
                        EmployeeType: d.EmployeeType,
                        // TimeOffTypeHtmlString:TimeOffTypeHtmlString,
                        // TimeOffType:d.TimeOffType,
                        FromDate : DateUtilities.getDateMMDDYYYY(fromDate),
                        FromDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(fromDate)}</span>${DateUtilities.getDateMMDDYYYY(fromDate)}`,
                        ToDate : DateUtilities.getDateMMDDYYYY(toDate),
                        ToDateForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(toDate)}</span>${DateUtilities.getDateMMDDYYYY(toDate)}`,
                        PTOAvailableBalance:[null,undefined,''].includes(d.PTOAvailableBalance)?0:parseFloat(d.PTOAvailableBalance),
                        PTOTotal: [null,undefined,''].includes(d.PTOTotal)?0:parseFloat(d.PTOTotal),
                        TOTotal: [null,undefined,''].includes(d.TOTotal)?0:parseFloat(d.TOTotal),
                        TotalHrs: parseFloat(d.TotalHours),
                        // PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ?"Synergy Manager":d.PendingWith,
                        Status : CommonUtilities.getTOStatus(d.Status),
                        StatusForGrid:`<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTOStatus(d.Status)}'>${CommonUtilities.getTOStatusInShortForm(d.Status)}</span>`,
                    })
                }
                // console.log(Data);
                this.setState({ Requests: Data,loading: false });
                // document.getElementById('txtTableSearch').style.display = 'none';
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
        }
        catch(err)
        {
             console.log('Failed to load My Time Offs' ,err);
        }
    }
    private  handleRowClicked = (row,Id?) => {
        let ID = row.Id?row.Id:Id;
        this.setState({TimeOffID:ID,redirect:true});
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
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/TimeOffRequestForm/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            // {
            //     name: "Time Off Type",
            //     selector: (row, i) => row.TimeOffTypeHtmlString,
            //     cell: row => <div className='divTimeOffTypes' dangerouslySetInnerHTML={{ __html: row.TimeOffTypeHtmlString }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
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
                sortable: true,
                // width: '120px'
            },
            {
                name: "To",
                selector: (row, i) => row.ToDateForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.ToDateForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                sortable: true,
                // width: '120px'
            },
            {
                name: "PTO Balance",
                selector: (row, i) => row.PTOAvailableBalance,
                sortable: true,
                // width: '220px'
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
                width: '100px',
                sortable: true
            },
             {
                name: "Status",
                selector: (row, i) => row.Status,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.StatusForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                width: '220px',
                sortable: true,
            },
            // {
            //     name: "Pending With",
            //     selector: (row, i) => row.PendingWith,
            //     sortable: true,
            //     // width: '180px'
            // }
        ];
        // const searchKeys=[,'FromDate','ToDate','PTOAvailableBalance','PTOTotal','TOTotal','TotalHrs','PendingWith','Status'];
        const searchKeys=[,'FromDate','ToDate','PTOAvailableBalance','PTOTotal','TOTotal','TotalHrs','Status'];
        if(this.state.redirect){
            let url = `/TimeOffRequestForm/${this.state.TimeOffID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div>
                <div className=''>
                    <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.Requests} fileName={'My TimeOffs'} showExportExcel={false} showAddButton={true} customBtnClass='px-1 text-right' navigateOnBtnClick={`/TimeOffRequestForm`} btnDivID='divAddNewTimeOff' btnSpanID='newTimeOff' btnCaption=' New' btnTitle='New Time Off' searchBoxLeft={false} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default MyTimeOffs;