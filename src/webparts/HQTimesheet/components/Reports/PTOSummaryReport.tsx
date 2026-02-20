import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
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
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import SearchableDropdown from '../Shared/SearchableDropdown';
import { NavLink, Navigate } from 'react-router-dom';
import { faEye, faFileExcel, faHistory } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import PTOTransactionHistoryPopup from './PTOTransactionHistoryPopup';
import DateUtilities from '../../Utilities/DateUtilities';

export interface PTOSummaryReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface PTOSummaryReportState {
}

class PTOSummaryReport extends React.Component<PTOSummaryReportProps,PTOSummaryReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    private fromDate;
    private toDate;
    constructor(props: PTOSummaryReportProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        this.EmployeeDropdown = React.createRef();
        this.fromDate = React.createRef();
        this.toDate = React.createRef();
    }
    public state = {
        EmployeeId: -1,
        EmpMatrixID:0,
        Year: new Date().getFullYear(),
        Status:'1',
        RowClickedEmployeeTitle: '',
        EmployeesObj: [], //for Employee dropdown
        AllPTOData: [],
        PTOData: [],
        PTOExcelData: [],
        PTOHistoryData: [],
        PTOHistoryExcelData: [],
        YearsList: [],  //for Year dropdown
        AllEmployees: [],
        loading: false,
        Homeredirect: false,
        redirect: false,
        isPageAccessable: true,
        showToaster: false,
        showPTOTransactionPopup: false,
        fileName: '',
        isAdmin: false,
        isTimeOffEmployee:false,
        fromDate: null,
        toDate: null,
        minDate: new Date('01/01'+new Date().getFullYear()),
        maxDate: new Date('12/31/'+new Date().getFullYear())
    }
    public componentDidMount() {
        highlightCurrentNav("PTOSummaryReport");
        this.setState({ loading: true });
        this.getOnLoadData()
    }
    private async getOnLoadData() {
        let selectQuery = "Employee/ID,Employee/Title,*";
        let [groups, Employees] = await Promise.all([
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('Employees').items.top(5000).expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll(),
        ]);
        let userGroups = [];
        for (const grp of groups) {
            userGroups.push(grp.Title);
        }
        let isAdmin = false;
        let filteredPTOEligibleEmp;
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
                this.setState({ isAdmin: true, EmployeeId: '0',isPageAccessable: true })
                document.getElementById("Employee").getElementsByTagName('input')[0].focus();
                isAdmin = true;
            }
            else if(userGroups.includes('Synergycom Timesheet Members') || userGroups.includes('Time Off Members')) // for provide access to employee who is Active and eligible for PTO
            {
                 filteredPTOEligibleEmp=Employees.find(Emp=>Emp.Employee.ID ==this.props.spContext.userId && Emp.EligibleforPTO == true && Emp.IsActive == true );
                if(filteredPTOEligibleEmp!=undefined)
                this.setState({ isPageAccessable: true });
                else
                {
                    this.setState({ isPageAccessable: false });
                    return false;
                }
            }
            else {
                this.setState({ isPageAccessable: false });
                return false;
            }
        let EmpIds = []
        let EmpObj = []
        if (isAdmin) {
            for (const name of Employees) {
                if (!EmpIds.includes(name.Employee.ID)) {
                    EmpIds.push(name.Employee.ID)
                    EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title })
                }
            }
        }
        else {
            EmpObj.push({ ID: this.props.spContext.userId, Title: this.props.spContext.userDisplayName });
            let EmpMatrixID=filteredPTOEligibleEmp!=undefined?filteredPTOEligibleEmp.Id:0;
            this.setState({ EmployeeId: this.props.spContext.userId,EmpMatrixID:EmpMatrixID,Status:'1'});
            this.handleRowClicked(undefined,this.props.spContext.userId,EmpMatrixID,this.props.spContext.userDisplayName);
        }
        //Year dropdown from 2024(Released Year of PTO) to currYear 
        let currYear=new Date().getFullYear();
        let YearsList=[];
        for(let Year=currYear+1;Year>=2024;Year--)
        {
            YearsList.push(Year);
        }
        EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
        let latestData = await this.getLatestPTOData(isAdmin,this.state.EmployeeId,this.state.Year,this.state.Status);
        EmpObj.unshift({ID:"0",Title:"All Employees"});
        this.setState({ AllEmployees: EmpObj, AllPTOData: latestData['PTOData'], PTOData: latestData['PTOData'], PTOExcelData: latestData['PTOExcelData'], EmployeesObj: EmpObj,YearsList:YearsList, loading: false, showToaster: true })
    }
    //to handle latest data showing at every onchange of employee and year 
    private async getLatestPTOData(isAdmin,EmployeeId,Year,Status) {
        let filterQuery='';
        if(isAdmin)
        {
            if (EmployeeId == 0 && Status =='')
            filterQuery=`Year eq '${Year}'`;
            else if(EmployeeId == 0 && Status !='')
            filterQuery=`Year eq '${Year}' and IsActive eq ${Status}`;
            else if(EmployeeId != 0 && Status =='')
            filterQuery=`Employee/Id eq ${EmployeeId} and Year eq '${Year}'`;
            else if(EmployeeId != 0 && Status !='')
            filterQuery=`Employee/Id eq ${EmployeeId} and Year eq '${Year}' and IsActive eq ${Status}`;

        }
        else
        filterQuery=`Employee/Id eq '${EmployeeId}' and Year eq '${Year}' and IsActive eq ${Status}`;
        
        let [EmployeesPTO] = await Promise.all([
            sp.web.lists.getByTitle('EmployeePTO').items.top(5000).expand('Employee').select('Employee/Title,Employee/Id,*').filter(filterQuery).orderBy('Employee/Title', true).getAll(),
        ]);
        let Data = [];
        let ExcelData = [];
        EmployeesPTO.sort((a,b)=>a.Employee.Title.localeCompare(b.Employee.Title));
        EmployeesPTO.forEach(d => {
            let joiningDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.DateOfJoining));
                    Data.push({
                        Id: d.Employee.Id,
                        Employee: d.Employee.Title,
                        EmployeeClassification: d.EmployeeClassification,
                        Policy: d.Policy == 'None' ? 'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? 'Yes' : 'No',
                        DateOfJoining : DateUtilities.getDateMMDDYYYY(joiningDate),
                        DateOfJoiningForGrid : `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(joiningDate)}</span>${DateUtilities.getDateMMDDYYYY(joiningDate)}`,
                        PTOApplied: [null, undefined, ''].includes(d.PTOApplied) ? 0 : parseFloat(parseFloat(d.PTOApplied).toFixed(4)),
                        PTOBalance: [null, undefined, ''].includes(d.PTOBalance) ? 0 : parseFloat(parseFloat(d.PTOBalance).toFixed(4)),
                        PTOBalanceAfterDeduction: [null, undefined, ''].includes(d.PTOBalanceAfterDeduction) ? 0 : parseFloat(parseFloat(d.PTOBalanceAfterDeduction).toFixed(4)),
                        PTOAvailed: [null, undefined, ''].includes(d.PTOAvailed) ? 0 : parseFloat(parseFloat(d.PTOAvailed).toFixed(4)),
                        PTOGranted: [null, undefined, ''].includes(d.PTOGranted) ? 0 : parseFloat(parseFloat(d.PTOGranted).toFixed(4)),
                        IsActive: d.IsActive ? 'Active' : 'In-Active',
                        Year:d.Year,
                        EmpMatrixID:d.EmpMatrixID
                    })
                    ExcelData.push({
                        Id: d.Employee.Id,
                        Employee: d.Employee.Title,
                        EmployeeClassification: d.EmployeeClassification,
                        Policy: d.Policy == 'None' ? 'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? 'Yes' : 'No',
                        DateOfJoining : DateUtilities.getDateMMDDYYYY(joiningDate),
                        PTOApplied: [null, undefined, ''].includes(d.PTOApplied) ? '0' : parseFloat(parseFloat(d.PTOApplied).toFixed(4)),
                        PTOBalance: [null, undefined, ''].includes(d.PTOBalance) ? '0' : parseFloat(parseFloat(d.PTOBalance).toFixed(4)),
                        PTOBalanceAfterDeduction: [null, undefined, ''].includes(d.PTOBalanceAfterDeduction) ? '0' : parseFloat(parseFloat(d.PTOBalanceAfterDeduction).toFixed(4)),
                        PTOAvailed: [null, undefined, ''].includes(d.PTOAvailed) ? '0' : parseFloat(parseFloat(d.PTOAvailed).toFixed(4)),
                        PTOGranted: [null, undefined, ''].includes(d.PTOGranted) ? '0' : parseFloat(parseFloat(d.PTOGranted).toFixed(4)),
                        IsActive: d.IsActive ? 'Active' : 'In-Active',
                        Year:d.Year
                    })
                //}

            //}
        })
        return { PTOData: Data, PTOExcelData: ExcelData };
    }
    private handleChangeEvents = async (event,actionMeta?) => {
        let  name,inputvalue,value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if(![null, undefined].includes(event) && event.target != undefined)
        {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        }
        else if(actionMeta!= undefined)
        {
            name = actionMeta.name;
            value =actionMeta.action =='clear'?name =='InitiatorId'?-1:'': event.value; 
        }
        this.setState({ [name]: value, loading: true });
        let latestData;
        if (name == 'EmployeeId') {
            latestData = await this.getLatestPTOData(this.state.isAdmin,value,this.state.Year,this.state.Status);
        }
        else if (name == 'Year') {
            latestData = await this.getLatestPTOData(this.state.isAdmin,this.state.EmployeeId,value,this.state.Status);
            if(!this.state.isAdmin)
            this.handleRowClicked(undefined,this.props.spContext.userId,this.state.EmpMatrixID,this.props.spContext.userDisplayName);
        }
        else if(name == 'Status')
        {
            latestData = await this.getLatestPTOData(this.state.isAdmin,this.state.EmployeeId,this.state.Year,value);
        }
        this.setState({ PTOData: latestData['PTOData'], PTOExcelData: latestData['PTOData'], loading: false });
    }
    private handleFromDate = (dateprops)=>{
        let date = null
        if (dateprops != null) {
            date = new Date(dateprops)
        }
        this.setState({ fromDate: date});
    }
    private handleToDate = (dateprops)=>{
        let date = null
        if (dateprops != null) {
            date = new Date(dateprops)
        }
        this.setState({ toDate: date});
    }
    private  handleRowClicked = async (row,Id?,EmpMatID?,EmpName?,isAdmin?) => {
        let EmployeeId,EmpMatrixID,EmployeeTitle,Year;
        if (row)   //for handle history icon click and DOJ click
        {
            if(row.Id) // to handle on row click
            {
                EmployeeId = row.Id?row.Id:Id;
                EmpMatrixID = row.EmpMatrixID?row.EmpMatrixID:EmpMatID;
                EmployeeTitle = row.Employee?row.Employee:EmpName;
                Year=row.Year;
            }
            else{ // to handle history icon click and DOJ click
                EmployeeId = row.currentTarget.id?row.currentTarget.id:Id;
                EmpMatrixID = row.currentTarget.getAttribute('name')?row.currentTarget.getAttribute('name').split('_')[1]:EmpMatID;
                EmployeeTitle = row.currentTarget.getAttribute('name')?row.currentTarget.getAttribute('name').split('_')[0]:EmpName;
                Year=this.state.Year;
            }
        }
        else { // to handle for employee view PTO transactions history
            EmployeeId = Id;
            EmpMatrixID = EmpMatID;
            EmployeeTitle = EmpName;
            Year=this.state.Year;
        }

        var Data = [];
        var ExcelData = [];
        this.setState({ loading: true });
        let selectQuery = "Employee/Id,Employee/Title,*";
        let filterQuery= `Employee/Id eq '${EmployeeId}' and Year eq '${Year}' and IsActive eq 1 and EmpMatrixID eq '${EmpMatrixID}'`;
        try{
        let [EmpGroups,PTOTansactions] =await Promise.all([
            sp.web.getUserById(EmployeeId).groups(),
            sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter(filterQuery).select(selectQuery).orderBy('PostedOn', false).getAll()
        ])
        let isTimeOffEmployee = EmpGroups.some(Grp=>Grp.Title=='Time Off Members');
        // if(!["",null,undefined].includes(this.state.fromDate) && ["",null,undefined].includes(this.state.toDate)){
        //     let date = this.state.fromDate
        //     let previous = addDays(new Date(date), -1)
        //     let prevDate = new Date(this.addBrowserwrtServer(new Date(previous.getMonth() + 1 + "/" + previous.getDate() + "/" + previous.getFullYear())))
        //     // addDays(new Date(date), -1);
        //     let nextDay = addDays(new Date('12/31/'+this.state.Year), 1)
        //     let nextDate = new Date(this.addBrowserwrtServer(new Date(nextDay.getMonth() + 1 + "/" + nextDay.getDate() + "/" + nextDay.getFullYear())))
        //     //  addDays(new Date(date), 1);
        //     let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        //     let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`

        //     filterQuery += " and PostedOn gt '" + prev+"' and PostedOn lt '"+next+"'"
        //     // filterQuery += " and PostedOn ge '2025-02-05T00:00:00'"
        //        }
        // if(!["",null,undefined].includes(this.state.toDate) && ["",null,undefined].includes(this.state.fromDate)){
        //     let date = this.state.toDate
        //     let previous = addDays(new Date('01/01/'+this.state.Year), -1)
        //     let prevDate = new Date(this.addBrowserwrtServer(new Date(previous.getMonth() + 1 + "/" + previous.getDate() + "/" + previous.getFullYear())))
        //     //  addDays(new Date(date), -1);
        //     let nextDay = addDays(new Date(date), 1)
        //     let nextDate = new Date(this.addBrowserwrtServer(new Date(nextDay.getMonth() + 1 + "/" + nextDay.getDate() + "/" + nextDay.getFullYear())))
        //     // addDays(new Date(date), 1);
        //     let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        //     let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`

        //     // filterQuery += "and PostedOn lt '" + next + "'"  
        //     filterQuery += " and PostedOn gt '" + prev+"' and PostedOn lt '"+next+"'"      
        // }
        // if(!["",null,undefined].includes(this.state.fromDate) && !["",null,undefined].includes(this.state.toDate)){
        //     let fromDate =this.state.fromDate,toDate = this.state.toDate
        //     let prevDate = new Date(this.addBrowserwrtServer(new Date(new Date(fromDate).getMonth() + 1 + "/" + new Date(fromDate).getDate() + "/" + new Date(fromDate).getFullYear())))
        //     // addDays(new Date(fromDate), -1);
        //     let nextDate = new Date(this.addBrowserwrtServer(new Date(new Date(toDate).getMonth() + 1 + "/" + new Date(toDate).getDate() + "/" + new Date(toDate).getFullYear())))
        //     // addDays(new Date(toDate), 1);
        //     let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        //     let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`


        //     filterQuery += " and PostedOn gt '" + prev + "' and PostedOn lt '" + next + "'"
        // }
        //sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter(filterQuery).select(selectQuery).orderBy('PostedOn', false).getAll().then((PTOTansactions) => {
             //Sorted to get latest modified records first
             PTOTansactions.sort((a, b) => {
                const dateA = new Date(a.Modified).getTime();
                const dateB = new Date(b.Modified).getTime();
                return dateB-dateA;
            });
            Data = [];
            ExcelData = [];
            PTOTansactions.forEach(item => {
                let PostedOn = new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.PostedOn));
                let SubmittedDate =[null,undefined,''].includes(item.SubmittedDate)? new Date():new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.SubmittedDate));
                let From =[null,undefined,''].includes(item.From)? new Date():new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.From));
                let To =[null,undefined,''].includes(item.To)? new Date(): new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.To));
                let TimeOffTypesFromList=[null,undefined,''].includes(item.TimeOffTypes)?[]:JSON.parse(item.TimeOffTypes),TimeOffTypes = '',ExcelTimeOffTypes = '';
                TimeOffTypesFromList.forEach(type => {
                    TimeOffTypes+=`<div>${type}</div>`;
                    ExcelTimeOffTypes+=type+'\n';
                });

                
                Data.push({
                    Id: item.Id,
                    Employee: item.Employee.Title,
                    TransactionType: this.getStatus(item.TransactionType,isTimeOffEmployee),
                    TimeOffTypesForGrid:TimeOffTypes,
                    TimeOffTypes:ExcelTimeOffTypes,
                    PostedOn : ['granted','deducted'].includes(item.TransactionType.toLowerCase())?'':DateUtilities.getDateMMDDYYYY(PostedOn),
                    PostedOnForGrid : ['granted','deducted'].includes(item.TransactionType.toLowerCase())?'':`<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(PostedOn)}</span>${DateUtilities.getDateMMDDYYYY(PostedOn)}`,
                    SubmittedDate : ['granted','deducted'].includes(item.TransactionType.toLowerCase())?DateUtilities.getDateMMDDYYYY(PostedOn):[null,undefined,''].includes(item.SubmittedDate)?'':DateUtilities.getDateMMDDYYYY(SubmittedDate),
                    SubmittedDateForGrid :['granted','deducted'].includes(item.TransactionType.toLowerCase())?`<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(PostedOn)}</span>${DateUtilities.getDateMMDDYYYY(PostedOn)}`:[null,undefined,''].includes(item.SubmittedDate)?'':`<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(SubmittedDate)}</span>${DateUtilities.getDateMMDDYYYY(SubmittedDate)}`,
                    From : [null,undefined,''].includes(item.From)? '-':DateUtilities.getDateMMDDYYYY(From),
                    FromForGrid : [null,undefined,''].includes(item.From)? '-':`<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(From)}</span>${DateUtilities.getDateMMDDYYYY(From)}`,
                    To : [null,undefined,''].includes(item.To)? '-':DateUtilities.getDateMMDDYYYY(To),
                    ToForGrid : [null,undefined,''].includes(item.To)? '-':`<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(To)}</span>${DateUtilities.getDateMMDDYYYY(To)}`,
                    Hours: [null, undefined, ''].includes(item.Hours) ? 0 : parseFloat(item.Hours),
                    Reason: item.Reason,
                    Year:item.Year
                })
                ExcelData.push({
                    Id: item.Id,
                    Employee: item.Employee.Title,
                    TransactionType: this.getStatus(item.TransactionType,isTimeOffEmployee),
                    TimeOffTypes:ExcelTimeOffTypes,
                    PostedOn : ['granted','deducted'].includes(item.TransactionType.toLowerCase())?'':DateUtilities.getDateMMDDYYYY(PostedOn),
                    SubmittedDate :['granted','deducted'].includes(item.TransactionType.toLowerCase())?DateUtilities.getDateMMDDYYYY(PostedOn):[null,undefined,''].includes(item.SubmittedDate)?'':DateUtilities.getDateMMDDYYYY(SubmittedDate),
                    From : [null,undefined,''].includes(item.From)? '-':DateUtilities.getDateMMDDYYYY(From),
                    To : [null,undefined,''].includes(item.To)? '-':DateUtilities.getDateMMDDYYYY(To),
                    Hours: [null, undefined, ''].includes(item.Hours) ? 0 : parseFloat(item.Hours),
                    Reason: [null, undefined, ''].includes(item.Reason) ? '' :item.Reason,
                    Year:item.Year
                })
            }
            )

            // Data.sort((a, b) => b.Id - a.Id);//acending order
            // ExcelData.sort((a, b) => b.Id - a.Id);//acending order

            this.setState({ RowClickedEmployeeTitle: EmployeeTitle, PTOHistoryData: Data, PTOHistoryExcelData: ExcelData, showPTOTransactionPopup: row?true:false,isTimeOffEmployee:isTimeOffEmployee, loading: false })
        // }, (error) => {
        //     this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
        //     console.log(error);
        // });
    }
    catch(error)
    {
        this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
        console.log(error);
    }
    }
    private getStatus(value,isTimeOffEmployee){
        let Status=value;
        // if(value =="approved by Manager")
        //     {
        //         Status = "Approved by Synergy Manager";
        //     }
        // else if(value == "rejected by Manager"){
        //         if(isTimeOffEmployee)
        //         Status = "Rejected by Synergy Manager";
        //        else
        //        Status = "Rejected by Reporting Manager";

        //     }
        // else if(value =="rejected by Synergy")
        //     {
        //         Status = "Rejected by Synergy";
        //     }
        // else if(value =="rejected by HR")
        //     {
        //         Status = "Rejected by HR";
        //     }
        if([StatusType.Submit,StatusType.ManagerApprove,StatusType.ReviewerApprove].includes(value))
        {
            Status = StatusType.InProgress;
        }
        else if([StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.HRReject].includes(value))
        {
            Status = StatusType.Reject;
        }
        return Status;
    }
    private closePTOTransactionPopup = () => {
        this.setState({ showPTOTransactionPopup: false });
    }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    public render() {
        let columns = [
            {
                name: "History",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <FontAwesomeIcon icon={faHistory} id={record.Id} name={record.Employee+'_'+record.EmpMatrixID}  title={'View History'} onClick={this.handleRowClicked}></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '85px'
            },
            {
                name: "Employee",
                selector: (row, i) => row.Employee,
                // width: '230px',
                sortable: true
            },
            // {
            //     name: "Employee Classification",
            //     selector: (row, i) => row.EmployeeClassification,
            //     width: '230px',
            //     sortable: true
            // },
            // {
            //     name: "Policy",
            //     selector: (row, i) => row.Policy,
            //     sortable: true
            // },
            // {
            //     name: "Eligible for PTO",
            //     selector: (row, i) => row.EligibleforPTO,
            //     width: '130px',
            //     sortable: true
            // },
            {
                name: "Date Of Joining",
                selector: (row, i) => row.DateOfJoiningForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.DateOfJoiningForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id,row.EmpMatrixID,row.Employee)}/>,
                // width: '200px',
                sortable: true
            },
            {
                name: "PTO Granted (YTD)",
                selector: (row, i) => row.PTOGranted,
                // width: '180px',
                sortable: true,
            },
            {
                // name: "PTO Availed",
                 name: "PTO Taken",
                selector: (row, i) => row.PTOAvailed,
                sortable: true,
            },
            // {
            //     name: "PTO Balance",
            //     selector: (row, i) => row.PTOBalance,
            //     sortable: true
            // },
            {
                name: "PTO Applied",
                selector: (row, i) => row.PTOApplied,
                sortable: true
            },
            {
                // name: "PTO After Deduction",
                name: "PTO Balance",
                selector: (row, i) => row.PTOBalanceAfterDeduction,
                // width: '220px',
                sortable: true,
            },
            // {
            //     name: "Status",
            //     selector: (row, i) => row.IsActive,
            //     sortable: true,
            // }
        ];
        let Exportcolumns = [
            {
                name: "Employee",
                selector: 'Employee',
                width: '350px',
                sortable: true
            },
            {
                name: "Employee Classification",
                selector: 'EmployeeClassification',
                width: '300px',
                sortable: true
            },
            {
                name: "Policy",
                selector: "Policy",
                sortable: true
            },
            // {
            //     name: "Eligible for PTO",
            //     selector: 'EligibleforPTO',
            //     sortable: true
            // },
            {
                name: "Date Of Joining",
                selector: 'DateOfJoining',
                sortable: true
            },
            {
                name: "PTO Granted (YTD)",
                selector: 'PTOGranted',
                sortable: true,
            },
            {
                //name: "PTO Availed",
                name: "PTO Taken",
                selector: 'PTOAvailed',
                sortable: true,
            },
            // {
            //     name: "PTO Balance",
            //     selector: 'PTOBalance',
            //     sortable: true
            // },
            {
                name: "PTO Applied",
                selector: 'PTOApplied',
                sortable: true
            },
            {
                // name: "PTO After Deduction",
                name: "PTO Balance",
                selector: 'PTOBalanceAfterDeduction',
                width: '250px',
                sortable: true,
            },
            // {
            //     name: "Status",
            //     selector: 'IsActive',
            //     sortable: true,
            // },
            // {
            //     name: "Year",
            //     selector: 'Year',
            //     sortable: true,
            // }
        ];
        // const searchKeys=['Employee','EmployeeClassification','Policy','DateOfJoining','PTOGranted','PTOAvailed','PTOApplied','PTOBalanceAfterDeduction'];
        const searchKeys=['Employee','DateOfJoining','PTOGranted','PTOAvailed','PTOApplied','PTOBalanceAfterDeduction'];

        const historyColumns = [
            {
              name: "Transaction Status",
              selector: (row, i) => row.TransactionType,
            //   width: '280px',
              sortable: true
            },
            {
              name: "Time Off Type",
              selector: (row, i) => row.TimeOffTypesForGrid,
              cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.TimeOffTypesForGrid }}/>,
            //   width: '200px',
              sortable: true
            },
            {
              name: "Time Off Date",
              selector: (row, i) => row.PostedOnForGrid,
              cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.PostedOnForGrid }}/>,
            //   width: '200px',
              sortable: true
            },
            {
              name: "Submitted Date",
              selector: (row, i) => row.SubmittedDateForGrid,
              cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.SubmittedDateForGrid }}/>,
            //   width: '200px',
              sortable: true
            },
            // {
            //   name: "From",
            //   selector: (row, i) => row.From,
            //   width: '150px',
            //   sortable: true
            // },
            // {
            //   name: "To",
            //   selector: (row, i) => row.To,
            //   width: '150px',
            //   sortable: true
            // },
            {
              name: "Hours",
              selector: (row, i) => row.Hours,
            //   width: '70px',
              sortable: true
            },
            {
              name: "Reason",
              selector: (row, i) => row.Reason,
              sortable: true,
            },
          ];
          const historyExportColumns = [
            {
              name: "Employee",
              selector: "Employee",
              width: '200px',
              sortable: true
            },
            {
              name: "Transaction Status",
              selector: "TransactionType",
              width: '200px',
              sortable: true
            },
            {
              name: "Time Off Type",
              selector: "TimeOffTypes",
              width: '200px',
              sortable: true
            },
            {
              name: "Time Off Date",
              selector: "PostedOn",
              width: '230px',
              sortable: true
            },
            {
              name: "Submitted Date",
              selector: "SubmittedDate",
              width: '230px',
              sortable: true
            },
            // {
            //   name: "From",
            //   selector: "From",
            //   sortable: true
            // },
            // {
            //   name: "To",
            //   selector: "To",
            //   sortable: true
            // },
            {
              name: "Hours",
              selector: "Hours",
              sortable: true
            },
            {
              name: "Reason",
              selector: "Reason",
              width: '220px',
              sortable: true,
            },
          ];
          const historySearchKeys=['TransactionType','TimeOffTypes','PostedOn','SubmittedDate','Hours','Reason'];

        if(this.state.isAdmin){
            columns.push(
                {
                    name: "Status",
                    selector: (row, i) => row.IsActive,
                    sortable: true,
                });
            Exportcolumns.push(
                {
                    name: "Status",
                    selector: 'IsActive',
                    sortable: true,
                });
                searchKeys.push('IsActive');
        }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL + "/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        if (this.state.Homeredirect) {
            let url = `/Dashboard/`;
            return (<Navigate to={url} />);
        }
        // if (this.state.redirect) {
        //     let url = `/PTOTransactionHistory/${this.state.RowClickedEmployeeId}/${this.state.RowClickedEmployeeTitle}/`;
        //     return (<Navigate to={url} />);
        // }
        else {
            return (
                <React.Fragment>
                    {/* <PTOTransactionHistoryPopup isVisible={this.state.showPTOTransactionPopup} isSuccess={false} onCancel={this.closePTOTransactionPopup} EmployeeTitle={this.state.RowClickedEmployeeTitle} Year={this.state.Year} Data={this.state.PTOHistoryData} ExcelData={this.state.PTOHistoryExcelData} isTimeOffEmployee={this.state.isTimeOffEmployee}></PTOTransactionHistoryPopup> */}
                    <PTOTransactionHistoryPopup isVisible={this.state.showPTOTransactionPopup} isSuccess={false} onCancel={this.closePTOTransactionPopup} EmployeeTitle={this.state.RowClickedEmployeeTitle} Year={this.state.Year} Data={this.state.PTOHistoryData} ExcelData={this.state.PTOHistoryExcelData} isTimeOffEmployee={false}></PTOTransactionHistoryPopup>
                    <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className="title">PTO Summary Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="media-m-2 media-p-1">
                                <div className="my-2">
                                    {/* Admin view */}
                                    {this.state.isAdmin &&  
                                    <div className="row pt-2 px-4 mx-1 py-2">
                                        {/* <div className="col-md-4">
                                            <div className="light-text ">
                                                <label>Employee<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="EmployeeId" title="Employee" onChange={this.handleChangeEvents} ref={this.EmployeeDropdown} disabled={!this.state.isAdmin}>
                                                    {this.state.isAdmin ? <option value='0'>All Employees</option> : ''}
                                                    {this.state.EmployeesObj.map((option) => (
                                                        <option value={option.ID} selected={this.state.EmployeeId == option.ID}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div> */}
                                          <div className="col-md-4">
                                            <div className="custom-dropdown">
                                                <SearchableDropdown label="Employee" Title="Employee" name="EmployeeId" id="Employee" placeholderText="Select Employee" className="" selectedValue={this.state.EmployeeId} optionLabel={'Title'} optionValue={'ID'} OptionsList={this.state.EmployeesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} isRequired={true} refElement={this.EmployeeDropdown} disabled={!this.state.isAdmin} noOptionsMessage="No Employee"></SearchableDropdown>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="light-text">
                                                <label>Year</label>
                                                <select className="form-control" name="Year" title="Year" id='Year' onChange={this.handleChangeEvents}>
                                                    {this.state.YearsList.map((option) => (
                                                        <option value={option} selected={option == this.state.Year}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {/* <div className="col-md-4">
                                            <div className="light-text div-readonly">
                                                <div className="custom-datepicker" id="divWeekStartDate">
                                                    <CustomDatePicker
                                                        handleChange={this.handleFromDate}
                                                        selectedDate={this.state.fromDate}
                                                        className='txtstartDate form-control'
                                                        labelName='From'
                                                        ref={this.fromDate}
                                                        Day={this.state.fromDate}
                                                        isDisabled={false}
                                                        isDateRange={false}
                                                        isCustomeDateRange={true}
                                                        minDate={new Date('01/01/'+this.state.Year)}
                                                        maxDate={new Date('12/31/'+this.state.Year)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="light-text div-readonly">
                                                <div className="custom-datepicker" id="divWeekStartDate">
                                                    <CustomDatePicker
                                                        handleChange={this.handleToDate}
                                                        selectedDate={this.state.toDate}
                                                        className='txtstartDate form-control'
                                                        labelName='To'
                                                        ref={this.fromDate}
                                                        Day={this.state.toDate}
                                                        isDisabled={false}
                                                        isDateRange={false}
                                                        isCustomeDateRange={true}
                                                        minDate={new Date('01/01/'+this.state.Year)}
                                                        maxDate={new Date('12/31/'+this.state.Year)}
                                                    />
                                                </div>
                                            </div>
                                        </div> */}
                                        {this.state.isAdmin && <div className="col-md-4">
                                            <div className="light-text">
                                                <label>Status</label>
                                                <select className="form-control" name="Status" title="Status" id='Status' onChange={this.handleChangeEvents} value={this.state.Status}>
                                                        <option value={''} >All</option>
                                                        <option value={'1'} >Active</option>
                                                        <option value={'0'} >In-Active</option>
                                                </select>
                                            </div>
                                        </div>}
                                    </div>
                                    }
                                    {/* Employee view */}
                                    {!this.state.isAdmin &&
                                    <>
                                     <div className="row pt-2 px-4 mx-1 py-2">
                                       <div className="col-md-4 ml-auto">
                                            <div className="light-text">
                                                <label>Year</label>
                                                <select className="form-control" name="Year" title="Year" id='Year' onChange={this.handleChangeEvents}>
                                                    {this.state.YearsList.map((option) => (
                                                        <option value={option} selected={option == this.state.Year}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        </div>
                                    <div className="row pt-2 px-4 mx-1 py-2">
                                        <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>Employee Name</label>
                                                    <input className="txtEmployeeName form-control" required={true} name="EmployeeName" title="Employee Name" value={this.state.PTOData.length?this.state.PTOData[0].Employee:this.props.spContext.userDisplayName} disabled />
                                                </div>
                                            </div>
                                        <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>Employee Classification</label>
                                                    <input className="txtEmployeeClassification form-control" required={true} name="EmployeeClassification" title="Employee Classification" value={this.state.PTOData.length?this.state.PTOData[0].EmployeeClassification:''} disabled />
                                                </div>
                                            </div>
                                        <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>Policy</label>
                                                    <input className="txtPolicy form-control" required={true} name="Policy" title="Policy" value={this.state.PTOData.length?this.state.PTOData[0].Policy:''} disabled />
                                                </div>
                                            </div>
                                        <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>Date Of Joining</label>
                                                    <input className="txtDateOfJoining form-control" required={true} name="DateOfJoining" title="Date Of Joining" value={this.state.PTOData.length?this.state.PTOData[0].DateOfJoining:''} disabled />
                                                </div>
                                            </div>
                                    </div>
                                     <div className="row pt-2 px-4 mx-1 py-2">
                                     <div className={"col-md-3"}>
                                             <div className="light-text-readonly">
                                                 <label>PTO Granted (YTD)</label>
                                                 <input className="txtPTOGranted form-control" required={true} name="PTOGranted" title="PTO Granted (YTD)" value={this.state.PTOData.length?this.state.PTOData[0].PTOGranted:''} disabled />
                                             </div>
                                         </div>
                                     <div className={"col-md-3"}>
                                             <div className="light-text-readonly">
                                                 <label>PTO Taken</label>
                                                 <input className="txtPTOTaken form-control" required={true} name="PTOTaken" title="PTO Taken" value={this.state.PTOData.length?this.state.PTOData[0].PTOAvailed:''} disabled />
                                             </div>
                                         </div>
                                     <div className={"col-md-3"}>
                                             <div className="light-text-readonly">
                                                 <label>PTO Applied</label>
                                                 <input className="txtPTOApplied form-control" required={true} name="PTOApplied" title="PTO Applied" value={this.state.PTOData.length?this.state.PTOData[0].PTOApplied:''} disabled />
                                             </div>
                                         </div>
                                     <div className={"col-md-3"}>
                                             <div className="light-text-readonly">
                                                 <label>PTO Balance</label>
                                                 <input className="txtPTOBalance form-control" required={true} name="PTOBalance" title="PTO Balance" value={this.state.PTOData.length?this.state.PTOData[0].PTOBalanceAfterDeduction:''} disabled />
                                             </div>
                                         </div>
                                 </div>
                                 </>
                                   }
                                </div>
                                {/* <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-4" id="">
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
                                        <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div> */}
                               
                                   {this.state.isAdmin ?  <div className='c-v-table dataTables_wrapper-overflow'><TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.PTOData} fileName={'Employee(s) PTO Summary Report'} showExportExcel={this.state.PTOData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.PTOExcelData} ExcelHeader={`PTO Summary Report - ${this.state.Year}`} wrapColumns={['Employee', 'EmployeeClassification']} LargeWidthColumns={['Employee', 'EmployeeClassification']} onRowClick={this.handleRowClicked} paginationPerPage={25}></TableGenerator></div>:

                                    <div className='c-v-table table-head-1st-td dataTables_wrapper-overflow'>
                                     <div className="fw-bold px-2">PTO Transaction History</div> 
                                    <TableGenerator columns={historyColumns} searchKeys={historySearchKeys} data={this.state.PTOHistoryData} fileName={'PTO Transaction History'} showExportExcel={this.state.PTOHistoryData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={historyExportColumns} ExportExcelCustomisedData={this.state.PTOHistoryExcelData} wrapColumns={["Reason","TimeOffTypes"]} LargeWidthColumns={["Reason","Employee"]} paginationPerPage={25}></TableGenerator></div>
                                   }
                                
                            </div>
                        </div>
                    </div>
                    </div>
                    {this.state.loading && <Loader />}
                </React.Fragment >
            );
        }
    }
}
export default PTOSummaryReport;