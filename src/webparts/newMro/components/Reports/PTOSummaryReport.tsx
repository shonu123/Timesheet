import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
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
import CustomDatePicker from "../Shared/DatePicker";
import SearchableDropdown from '../Shared/SearchableDropdown';
import { NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import ExportToPDF from '../Shared/ExportPDF';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import * as XLSX from 'xlsx-js-style';
import { faEye, faFileExcel, faHistory } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import PTOTransactionHistoryPopup from './PTOTransactionHistoryPopup';
import Loading from '../Shared/Loader';
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
        Year: new Date().getFullYear(),
        Status:'',
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
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        let isAdmin = false;
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
                this.setState({ isAdmin: true, EmployeeId: '0',isPageAccessable: true })
                document.getElementById("Employee").getElementsByTagName('input')[0].focus();
                isAdmin = true;
            }
            else if(userGroups.includes('Synergycom Timesheet Members')) // for provide access to employee who is Active and eligible for PTO
            {
                let filteredPTOEligibleEmp=Employees.find(Emp=>Emp.Employee.ID ==this.props.spContext.userId && Emp.EligibleforPTO == true && Emp.IsActive == true );
                if(filteredPTOEligibleEmp!=undefined)
                this.setState({ isPageAccessable: true })
                else
                this.setState({ isPageAccessable: false })
            }
            else {
                this.setState({ isPageAccessable: false })
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
            this.setState({ EmployeeId: this.props.spContext.userId });
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
        filterQuery="Employee/Id eq '"+EmployeeId+"' and Year eq "+Year;
        
        let [EmployeesPTO] = await Promise.all([
            sp.web.lists.getByTitle('EmployeePTO').items.top(5000).expand('Employee').select('Employee/Title,Employee/Id,*').filter(filterQuery).orderBy('Employee/Title', true).getAll(),
        ]);
        let Data = [];
        let ExcelData = [];
        EmployeesPTO.forEach(d => {
            let joiningDate = new Date(d.DateOfJoining.split('-')[1] + '/' + d.DateOfJoining.split('-')[2].split('T')[0] + '/' + d.DateOfJoining.split('-')[0])
                    Data.push({
                        Id: d.Employee.Id,
                        Employee: d.Employee.Title,
                        EmployeeClassification: d.EmployeeClassification,
                        Policy: d.Policy == 'None' ? 'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? 'Yes' : 'No',
                        DateOfJoining: `${joiningDate.getMonth() + 1}/${joiningDate.getDate()}/${joiningDate.getFullYear()}`,
                        PTOApplied: [null, undefined, ''].includes(d.PTOApplied) ? 0.00 : parseFloat(parseFloat(d.PTOApplied).toFixed(4)),
                        PTOBalance: [null, undefined, ''].includes(d.PTOBalance) ? 0.00 : parseFloat(parseFloat(d.PTOBalance).toFixed(4)),
                        PTOBalanceAfterDeduction: [null, undefined, ''].includes(d.PTOBalanceAfterDeduction) ? 0.00 : parseFloat(parseFloat(d.PTOBalanceAfterDeduction).toFixed(4)),
                        PTOAvailed: [null, undefined, ''].includes(d.PTOAvailed) ? 0.00 : parseFloat(parseFloat(d.PTOAvailed).toFixed(4)),
                        PTOGranted: [null, undefined, ''].includes(d.PTOGranted) ? 0.00 : parseFloat(parseFloat(d.PTOGranted).toFixed(4)),
                        IsActive: d.IsActive ? 'Active' : 'In-Active',
                        Year:d.Year
                    })
                    ExcelData.push({
                        Id: d.Employee.Id,
                        Employee: d.Employee.Title,
                        EmployeeClassification: d.EmployeeClassification,
                        Policy: d.Policy == 'None' ? 'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? 'Yes' : 'No',
                        DateOfJoining: `${joiningDate.getMonth() + 1}/${joiningDate.getDate()}/${joiningDate.getFullYear()}`,
                        PTOApplied: [null, undefined, ''].includes(d.PTOApplied) ? '0.00' : parseFloat(d.PTOApplied).toFixed(4),
                        PTOBalance: [null, undefined, ''].includes(d.PTOBalance) ? '0.00' : parseFloat(d.PTOBalance).toFixed(4),
                        PTOBalanceAfterDeduction: [null, undefined, ''].includes(d.PTOBalanceAfterDeduction) ? '0.00' : parseFloat(d.PTOBalanceAfterDeduction).toFixed(4),
                        PTOAvailed: [null, undefined, ''].includes(d.PTOAvailed) ? '0.00' : parseFloat(d.PTOAvailed).toFixed(4),
                        PTOGranted: [null, undefined, ''].includes(d.PTOGranted) ? '0.00' : parseFloat(d.PTOGranted).toFixed(4),
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
    private handleRowClicked = (row) => {
        let EmployeeId;
        let EmployeeTitle;
        let Year;
        if (row.Id)   //for handle history icon click
        {
            EmployeeId = row.Id;
            EmployeeTitle = row.Employee;
            Year=row.Year;
        }
        else {
            EmployeeId = row.currentTarget.id;
            EmployeeTitle = row.currentTarget.getAttribute('name');
            Year=this.state.Year

        }

        var Data = [];
        var ExcelData = [];
        this.setState({ loading: true });
        let selectQuery = "Employee/Id,Employee/Title,*"
        let filterQuery= "Employee/Id eq " + EmployeeId+" and Year eq "+Year+" and IsActive eq 1"
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
        sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter(filterQuery).select(selectQuery).orderBy('PostedOn', false).getAll().then((PTOTansactions) => {
             //Sorted to get latest modified records first
             PTOTansactions.sort((a, b) => {
                const dateA = new Date(a.PostedOn).getTime();
                const dateB = new Date(b.PostedOn).getTime();
                return dateB-dateA;
            });
            Data = [];
            ExcelData = [];
            PTOTansactions.forEach(item => {
                let PostedOn = new Date(item.PostedOn.split('-')[1] + '/' + item.PostedOn.split('-')[2].split('T')[0] + '/' + item.PostedOn.split('-')[0]);
                let From =[null,undefined,''].includes(item.From)? new Date():new Date(item.From.split('-')[1] + '/' + item.From.split('-')[2].split('T')[0] + '/' + item.From.split('-')[0]);
                let To =[null,undefined,''].includes(item.To)? new Date(): new Date(item.To.split('-')[1] + '/' + item.To.split('-')[2].split('T')[0] + '/' + item.To.split('-')[0]);
                
                Data.push({
                    Id: item.Id,
                    Employee: item.Employee.Title,
                    TransactionType: this.getStatus(item.TransactionType),
                    PostedOn: `${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`,
                    // From: [null,undefined,''].includes(item.From)? '-':`${From.getMonth() + 1}/${From.getDate()}/${From.getFullYear()}`,
                    // To: [null,undefined,''].includes(item.To)? '-':`${To.getMonth() + 1}/${To.getDate()}/${To.getFullYear()}`,
                    Hours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(item.Hours),
                    Reason: item.Reason,
                    Year:item.Year
                })
                ExcelData.push({
                    Id: item.Id,
                    Employee: item.Employee.Title,
                    TransactionType: this.getStatus(item.TransactionType),
                    PostedOn: `${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`,
                    // From: `${From.getMonth() + 1}/${From.getDate()}/${From.getFullYear()}`,
                    // To: `${To.getMonth() + 1}/${To.getDate()}/${To.getFullYear()}`,
                    Hours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(item.Hours),
                    Reason: [null, undefined, ''].includes(item.Reason) ? '' :item.Reason,
                    Year:item.Year
                })
            }
            )

            // Data.sort((a, b) => b.Id - a.Id);//acending order
            // ExcelData.sort((a, b) => b.Id - a.Id);//acending order

            this.setState({ RowClickedEmployeeTitle: EmployeeTitle, PTOHistoryData: Data, PTOHistoryExcelData: ExcelData, showPTOTransactionPopup: true, loading: false })
        }, (error) => {
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
            console.log(error);
        });
    }
    private getStatus(value){
        let Status=value;
        if(value == "rejected by Manager"){
                Status = "Rejected by Reporting Manager"
            }
        else if(value =="rejected by Synergy")
            {
                Status = "Rejected by Synergy"
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
                                <FontAwesomeIcon icon={faHistory} id={record.Id} name={record.Employee} title={'View History'} onClick={this.handleRowClicked}></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Employee",
                selector: (row, i) => row.Employee,
                width: '230px',
                sortable: true
            },
            {
                name: "Employee Classification",
                selector: (row, i) => row.EmployeeClassification,
                width: '230px',
                sortable: true
            },
            {
                name: "Policy",
                selector: (row, i) => row.Policy,
                sortable: true
            },
            // {
            //     name: "Eligible for PTO",
            //     selector: (row, i) => row.EligibleforPTO,
            //     width: '130px',
            //     sortable: true
            // },
            {
                name: "Date Of Joining",
                selector: (row, i) => row.DateOfJoining,
                width: '200px',
                sortable: true
            },
            {
                name: "PTO Granted (YTD)",
                selector: (row, i) => row.PTOGranted,
                width: '180px',
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
            {
                name: "Year",
                selector: 'Year',
                sortable: true,
            }
        ];
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
        }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL + "/SitePages/AccessDenied.aspx"
            window.location.href = url
        }
        if (this.state.Homeredirect) {
            let url = `/Dashboard/`
            return (<Navigate to={url} />);
        }
        // if (this.state.redirect) {
        //     let url = `/PTOTransactionHistory/${this.state.RowClickedEmployeeId}/${this.state.RowClickedEmployeeTitle}/`;
        //     return (<Navigate to={url} />);
        // }
        else {
            return (
                <React.Fragment>
                    <PTOTransactionHistoryPopup isVisible={this.state.showPTOTransactionPopup} isSuccess={false} onCancel={this.closePTOTransactionPopup} EmployeeTitle={this.state.RowClickedEmployeeTitle} Year={this.state.Year} Data={this.state.PTOHistoryData} ExcelData={this.state.PTOHistoryExcelData}></PTOTransactionHistoryPopup>
                    <div className='container-fluid'>
                        <div className='FormContent-2'>
                            <div className="title">PTO Summary Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="media-m-2 media-p-1">
                                <div className="my-2">
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
                                </div>
                                {/* <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-4" id="">
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
                                        <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div> */}
                                <div className='c-v-table dataTables_wrapper-overflow'>
                                    <TableGenerator columns={columns} data={this.state.PTOData} fileName={'Employee(s) PTO Summary Report'} showExportExcel={this.state.PTOData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.PTOExcelData} wrapColumns={['Employee', 'EmployeeClassification']} LargeWidthColumns={['Employee', 'EmployeeClassification']} onRowClick={this.handleRowClicked}></TableGenerator>
                                </div>
                            </div>
                        </div>
                    </div>
                    {this.state.showToaster && <Toaster />}
                    {this.state.loading && <Loader />}
                </React.Fragment >
            );
        }
    }
}
export default PTOSummaryReport;