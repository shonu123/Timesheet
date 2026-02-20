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
import DatePicker from "../Shared/DatePickerField";
import SearchableDropdown from '../Shared/SearchableDropdown';
import MultiSelectDropdown from '../Shared/MultiSelectDropdown';
import { Navigate } from 'react-router-dom';
import customToaster from '../Shared/Toaster.component';
import ExportPDFMonthlyReport from '../Shared/ExportPDFMonthlyReport';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import * as XLSX from 'xlsx-js-style';
import { StatusType } from '../../Constants/Constants';
import InputCheckBox from '../Shared/InputCheckBox';
import DateUtilities from '../../Utilities/DateUtilities';

export interface MonthlyTimesheetReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MonthlyTimesheetReportState {
}

class MonthlyTimesheetReport extends React.Component<MonthlyTimesheetReportProps, MonthlyTimesheetReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    private startDate;
    private endDate;
    constructor(props: MonthlyTimesheetReportProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        this.EmployeeDropdown = React.createRef();
        this.startDate = React.createRef();
        this.endDate = React.createRef();
    }

    public state = {
        // EmployeeId: null,
        // EmployeeEmail: '',
        ClientName: '',
        IsThisReportForInternal: false,
        InitiatorId: [],
        startDate: null,
        endDate: null,
        ClientsObject: [],
        EmployeesObj: [],
        AllEmployees: [],

        loading: false,
        Homeredirect: false,
        isPageAccessable: true,
        showToaster: false,
        isHavingClients: true,
        isHavingEmployees: true,
        ColumnsHeaders: [],
        ExportExcelData: [],
        weekStartDay: 'Monday',
        ReportData: [],
        PDFData: [],
        fileName: ''

    }
    public componentDidMount() {
        highlightCurrentNav("MonthlyTimesheetReport");
        document.getElementById("Client").getElementsByTagName('input')[0].focus();
        this.setState({ loading: true });
        this.getOnLoadData()
    }
    private async getOnLoadData() {
        let selectQuery = "Employee/ID,Employee/Title"
        let [groups, Clients, Employees] = await Promise.all([
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('Client').items.select('*').orderBy('Title').get(),
            sp.web.lists.getByTitle('EmployeeMaster').items.expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
        ]);
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
            this.setState({ isPageAccessable: true })
        }
        else {
            this.setState({ isPageAccessable: false })
            return false
        }

        let EmpNames = []
        let EmpObj = []
        for (const name of Employees) {
            if (!EmpNames.includes(name.Employee.Title)) {
                EmpNames.push(name.Employee.Title)
                EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title })
            }
        }
        EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
        if (Clients.length > 0) {
            //Clients.unshift({Title:"All Clients"});
            // EmpObj.unshift({ID:"0",Title:"All Employees"});
            this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: true, showToaster: true })
        }
        else
            this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: false, showToaster: true })
    }
    private handleClientChange = (event, actionMeta?) => {
        this.setState({ loading: true });
        // let { name } = event.target;
        // let value = event.target.value;
        let name, inputvalue, value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if (![null, undefined].includes(event) && event.target != undefined) {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        }
        else if (actionMeta != undefined) {
            name = actionMeta.name;
            value = actionMeta.action == 'clear' ? '' : event.value;
        }
        this.setState({ [name]: value, ReportData: [] });
        this.getClientEmployees(value)
    }
    private async getClientEmployees(value) {
        if (value != "All") {
            let selectQuery = "Employee/ID,Employee/Title,WeekStartDay";
            let filterQuery = "ClientName eq '" + value.replace(/'/g, "''") + "'";
            let clientEmployees = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterQuery).expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
            let EmpNames = []
            let EmpObj = []
            let weekDay = 'Monday'
            for (const name of clientEmployees) {
                if (!EmpNames.includes(name.Employee.Title)) {
                    EmpNames.push(name.Employee.Title)
                    EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title })
                }
            }
            EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
            if (EmpObj.length > 0) {
                // EmpObj.unshift({ID:"0",Title:"All Employees"});
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true, InitiatorId: [], weekStartDay: clientEmployees[0].WeekStartDay })
            }
            else {
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false, InitiatorId: [], weekStartDay: weekDay })
                customToaster('toster-error', ToasterTypes.Error, 'There are no employees associated with this client', 4000);
            }
        }
        else {
            this.setState({ EmployeesObj: this.state.AllEmployees, loading: false, isHavingEmployees: true, InitiatorId: [] })
        }
    }
    private handleChangeEvents = (event, actionMeta?) => {
        let name, inputvalue, value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if (![null, undefined].includes(event) && event.target != undefined) {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
            // for Employee multi select dropdown
            if (name == 'InitiatorId' && inputvalue[inputvalue.length - 1] === "all") {
                value = this.state.InitiatorId.length === this.state.EmployeesObj.length ? [] : this.state.EmployeesObj.map(emp => emp.ID);
            }
        }
        else if (actionMeta != undefined) {
            name = actionMeta.name;
            value = actionMeta.action == 'clear' ? name == 'InitiatorId' ? [] : '' : event.value;
        }
        this.setState({ [name]: value, ReportData: [] });
    }
    private handleStartorEndDate = (dateprops) => {
        let date = new Date();
        let DateField = dateprops[1] == "txtStartDate" ? 'startDate' : dateprops[1] == "txtEndDate" ? 'endDate' : '';
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
            this.setState({ [DateField]: date, ReportData: [] });
        }
        else {
            this.setState({ [DateField]: null, ReportData: [] });
        }
    }
    private checkIsvalid = (data, selectedStartDate, selectedEndDate) => {
        let isvalid = {
            status: true,
            message: ''
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            isvalid.status = false;
            isvalid.message = isValid.message
        }
        else if (this.state.startDate == null) {
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be blank'
            // let prpel =  this.startDate
            let element = document.getElementById('txtStartDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');
            setTimeout(function () {
                // prpel.current.input.classList.add('mandatory-FormContent-focus');
                element.classList.add('mandatory-FormContent-focus');
            }, 0)
        }
        else if (this.state.endDate == null) {
            isvalid.status = false;
            isvalid.message = 'End Date cannot be blank'
            // let prpel =  this.endDate
            let element = document.getElementById('txtEndDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');

            // prpel.current.input.focus();
            setTimeout(function () {
                element.classList.add('mandatory-FormContent-focus');
            }, 0)
        }
        else if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be greater than End Date'
            let element = document.getElementById('txtStartDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');
            // let prpel =  this.startDate
            // prpel.current.input.focus();
            setTimeout(function () {
                element.classList.add('mandatory-FormContent-focus');
            }, 0)
        }
        return isvalid;
    }
    private handleCancel = async (e) => {
        // this.setState({ Homeredirect: true,showToaster:false });
        // document.getElementById('divNavReportItems').classList.remove('show');
        // document.getElementById('Reports').classList.remove('heighlightMasters');
        this.setState({ ClientName: '', IsThisReportForInternal: false, InitiatorId: [], startDate: null, endDate: null, EmployeesObj: this.state.AllEmployees, ExportExcelData: [], weekStartDay: 'Monday', ReportData: [], PDFData: [] });
    }
    private handleSubmit = () => {
        this.setState({ loading: true })
        let data = {
            Client: { val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.reactSelect, Focusid: 'Client' },
            Employee: { val: this.state.InitiatorId, required: true, Name: 'Employee', Type: ControlType.MUIMultiSelect, Focusid: 'Employee' },
            // WeeklyStartDate: { val: this.state.startDate, required: true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid: "divWeekStartDate" }
        }
        let isValid = this.checkIsvalid(data, this.state.startDate, this.state.endDate);
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            this.setState({ loading: false })
            return false
        }
        let Sdate = new Date(this.state.startDate)
        let selectedStartDate = DateUtilities.getDateMMDDYYYY(Sdate);
        let Edate = new Date(this.state.endDate)
        let selectedEndDate = DateUtilities.getDateMMDDYYYY(Edate);

        let postObject = {
            Client: this.state.ClientName,
            IsThisReportForInternal: this.state.IsThisReportForInternal,
            Employee: this.state.InitiatorId,
            StartDate: selectedStartDate,
            EndDate: selectedEndDate
        }
        this.getReportData(postObject);
    }
    private getReportData = async (postObject) => {
        let client = postObject.Client;
        let Employee = postObject.Employee;
        let SelStartDate = postObject.StartDate;
        let SelEndDate = postObject.EndDate;
        let prevDate = addDays(new Date(SelStartDate), -7);
        let nextDate = addDays(new Date(SelEndDate), 1);
        let prev = DateUtilities.getDateMMDDYYYY(prevDate);
        let next = DateUtilities.getDateMMDDYYYY(nextDate);
        let filterQuery = ''
        if (client == "All") {
            //if (Employee.length == this.state.EmployeesObj.length) {
            filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'";
            // }
            // else {
            //     filterQuery = "InitiatorId eq '" + Employee + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'";
            // }
        }
        else {
            //if (Employee == 0) {
            filterQuery = "ClientName eq '" + client.replace(/'/g, "''") + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'";
            // }
            // else {
            //     filterQuery = "ClientName eq '" + client.replace(/'/g,"''") + "' and InitiatorId eq '" + Employee + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'";
            // }
        }
        filterQuery += "and Status ne '" + StatusType.Save + "' and Status ne '" + StatusType.Revoke + "'";
        try {
            let Response = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterQuery).expand('Initiator').select('Initiator/Title,Initiator/Id,TotalHrs,BillableSubtotalHrs,NonBillableSubTotalHrs,ClientName,WeekStartDate,Status,*').orderBy('WeekStartDate,ClientName,Initiator/Title', true).getAll()
            if (Employee.length != this.state.EmployeesObj.length) {
                Response = Response.filter(report => Employee.includes(report.Initiator.Id));
            }
            if (Response.length > 0) {
                var PDFData = [];
                //PDFData = reportData.filter(report => [StatusType.Approved, StatusType.ManagerApprove].includes(report.Status));
                PDFData = Response;
                let ReportData = [];
                let row = 1;
                Response.sort((a, b) => { return new Date(a.WeekStartDate).getTime() - new Date(b.WeekStartDate).getTime() }); //to sort based on WeekStartDate
                Response.forEach(report => {
                    let { Initiator, WeekStartDate, TotalHrs, ClientName, Status } = report;
                    const startDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(report.WeekStartDate));
                    let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    TotalHrs = JSON.parse(TotalHrs);
                    let dates = [];
                    const currentDate = new Date(startDate);
                    for (let i = 0; i < 7; i++) {
                        let date = new Date(currentDate)
                        dates.push(DateUtilities.getDateMMDDYYYY(date));
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    const arrangedWeekDays = [];

                    weekDays.forEach(day => {
                        arrangedWeekDays.push(TotalHrs[0][day]);
                    });

                    let BillHrs = JSON.parse(report.BillableSubtotalHrs)[0], SynergyOfficeHrs = JSON.parse(report.SynergyOfficeHrs)[0], NonBillhrs = JSON.parse(report.NonBillableSubTotalHrs)[0], Totalhrs = JSON.parse(report.TotalHrs)[0], blanksHrs = [{ Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00' }];
                    let PTOSubTotal = [null, undefined, ''].includes(report.PTOSubTotal) ? [] : JSON.parse(report.PTOSubTotal);
                    let TOSubTotal = [null, undefined, ''].includes(report.TOSubTotal) ? [] : JSON.parse(report.TOSubTotal);
                    let HolidayTotal = [null, undefined, ''].includes(report.ClientHolidayHrs) ? [] : JSON.parse(report.ClientHolidayHrs);
                    let b = {}, PTOHours = JSON.parse(report.PTOHrs), ClientHolidayHrs = JSON.parse(report.ClientHolidayHrs);
                    // Code for PTO Hours to be included in Billable hours :start
                    //  if(report.EligibleforPTO && !report.ClientName.toLowerCase().includes('synergy'))
                    //  {
                    //      let WeekDays=['Mon','Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    //      let PTOHrs=PTOHours[0].Total;
                    //      if(parseFloat(PTOHours[0].PTOAfterDeduction)<0)
                    //      PTOHrs=parseFloat(PTOHours[0].Total)+parseFloat(PTOHours[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs 
                    //      let PTOBalance=PTOHours[0].PTOBalance;
                    //      if(parseFloat(PTOHours[0].Total)!=0 && parseFloat(PTOHrs)>0)
                    //      {
                    //         WeekDays.forEach(day=>{
                    //             if(PTOHours[0][day]!='' && parseFloat(PTOBalance)>0)
                    //             {
                    //                 let DayTimeOffHrs=parseFloat(PTOHours[0][day])>PTOBalance?PTOBalance:PTOHours[0][day];
                    //                 NonBillhrs[day]=Number(parseFloat(NonBillhrs[day])-parseFloat(DayTimeOffHrs)).toFixed(4);//reduce from NonBillable day
                    //                 PTOHours[0][day]=Number(parseFloat(DayTimeOffHrs)-parseFloat(DayTimeOffHrs)).toFixed(4);//reduce from TimeOff day
                    //                 NonBillhrs['Total']=Number(parseFloat(NonBillhrs['Total'])-parseFloat(DayTimeOffHrs)).toFixed(4);//reduce from NonBillable Total
                    //                 BillHrs[day]=Number(parseFloat(BillHrs[day])+parseFloat(DayTimeOffHrs)).toFixed(4);// increase Billable day
                    //                 BillHrs['Total']=Number(parseFloat(BillHrs['Total'])+parseFloat(DayTimeOffHrs)).toFixed(4);//increase Billable Total
                    //                 PTOBalance=parseFloat(PTOBalance)-parseFloat(DayTimeOffHrs)// reduced from PTOBalance
                    //             }
                    //         })
                    //      }
                    //  }
                    // Code for PTO Hours to be included in Billable hours :end
                    // report.ClientName.toLowerCase().includes('synergy') ? BillHrs = blanksHrs : '';
                    report.ClientName.toLowerCase().includes('synergy') ? BillHrs = SynergyOfficeHrs : '';
                    // NonBillhrs = {
                    //     Mon: NonBillhrs.Mon =="0.00"?PTOHours[0].Mon ==""?ClientHolidayHrs[0].Mon==""?'':ClientHolidayHrs[0].Mon:ClientHolidayHrs[0].Mon==""?PTOHours[0].Mon:Number(parseFloat(PTOHours[0].Mon)+parseFloat(ClientHolidayHrs[0].Mon)).toFixed(4)
                    //     :NonBillhrs.Mon,
                    //     Tue: NonBillhrs.Tue =="0.00"?PTOHours[0].Tue ==""?ClientHolidayHrs[0].Tue==""?'':ClientHolidayHrs[0].Tue:ClientHolidayHrs[0].Tue==""?PTOHours[0].Tue:Number(parseFloat(PTOHours[0].Tue)+parseFloat(ClientHolidayHrs[0].Tue)).toFixed(4)
                    //     :NonBillhrs.Tue,
                    //     Wed: NonBillhrs.Wed =="0.00"?PTOHours[0].Wed ==""?ClientHolidayHrs[0].Wed==""?'':ClientHolidayHrs[0].Wed:ClientHolidayHrs[0].Wed==""?PTOHours[0].Wed:Number(parseFloat(PTOHours[0].Wed)+parseFloat(ClientHolidayHrs[0].Wed)).toFixed(4)
                    //     :NonBillhrs.Wed,
                    //     Thu: NonBillhrs.Thu =="0.00"?PTOHours[0].Thu ==""?ClientHolidayHrs[0].Thu==""?'':ClientHolidayHrs[0].Thu:ClientHolidayHrs[0].Thu==""?PTOHours[0].Thu:Number(parseFloat(PTOHours[0].Thu)+parseFloat(ClientHolidayHrs[0].Thu)).toFixed(4)
                    //     :NonBillhrs.Thu,
                    //     Fri: NonBillhrs.Fri =="0.00"?PTOHours[0].Fri ==""?ClientHolidayHrs[0].Fri==""?'':ClientHolidayHrs[0].Fri:ClientHolidayHrs[0].Fri==""?PTOHours[0].Fri:Number(parseFloat(PTOHours[0].Fri)+parseFloat(ClientHolidayHrs[0].Fri)).toFixed(4)
                    //     :NonBillhrs.Fri,
                    //     Sat: NonBillhrs.Sat =="0.00"?PTOHours[0].Sat ==""?ClientHolidayHrs[0].Sat==""?'':ClientHolidayHrs[0].Sat:ClientHolidayHrs[0].Sat==""?PTOHours[0].Sat:Number(parseFloat(PTOHours[0].Sat)+parseFloat(ClientHolidayHrs[0].Sat)).toFixed(4)
                    //     :NonBillhrs.Sat,
                    //     Sun: NonBillhrs.Sun =="0.00"?PTOHours[0].Sun ==""?ClientHolidayHrs[0].Sun==""?'':ClientHolidayHrs[0].Sun:ClientHolidayHrs[0].Sun==""?PTOHours[0].Sun:Number(parseFloat(PTOHours[0].Sun)+parseFloat(ClientHolidayHrs[0].Sun)).toFixed(4)
                    //     :NonBillhrs.Sun,
                    //     Total: NonBillhrs.Total
                    // }
                    // ReportData.push({
                    //     SNo: row,
                    //     Employee: report.Initiator.Title,
                    //     MNB: NonBillhrs.Mon,
                    //     MB: BillHrs.Mon,
                    //     TNB: NonBillhrs.Tue,
                    //     TB: BillHrs.Tue,
                    //     WNB: NonBillhrs.Wed,
                    //     WB: BillHrs.Wed,
                    //     ThNB: NonBillhrs.Thu,
                    //     ThB: BillHrs.Thu,
                    //     FB: BillHrs.Fri,
                    //     FNB: NonBillhrs.Fri,
                    //     // commented on 25 july 2024
                    //     // SB: BillHrs.Sat == "" ? "0" : BillHrs.Sat,
                    //     // SNB: NonBillhrs.Sat == "" ? "0" : NonBillhrs.Sat,
                    //     // SuB: BillHrs.Sun == "" ? "0" : BillHrs.Sun,
                    //     // SuNB: NonBillhrs.Sun == "" ? "0" : NonBillhrs.Sun,
                    //     SB: BillHrs.Sat,
                    //     SNB: NonBillhrs.Sat,
                    //     SuB: BillHrs.Sun,
                    //     SuNB: NonBillhrs.Sun,
                    //     Status: this.getStatus(report.Status),
                    //     TotalNB: NonBillhrs.Total,
                    //     TotalB: BillHrs.Total,
                    //     TotalH: Totalhrs.Total,
                    // })

                    //Below code for Monthly Report
                    let Start = new Date(DateUtilities.GetDateMMDDYYYYAsInList(report.WeekStartDate));
                    let End = addDays(Start, 6);
                    let Hours = BillHrs.Total;
                    //IsThisReportForInternal check box related data
                    let [PaidTimeOff, TimeOff, Holiday] = ['0', PTOHours.length ? PTOHours[0].Total : '0', HolidayTotal.length ? parseFloat(HolidayTotal[0].Total) : '0'];// if employee not eligible for PTO, consider total time off hours, PTO hours as 0
                    if (report.EligibleforPTO)// if employee eligible for PTO, consider time off hours, PTO hours individually
                    {
                        [PaidTimeOff, TimeOff] = [PTOSubTotal.length ? PTOSubTotal[0].Total : '0', TOSubTotal.length ? TOSubTotal[0].Total : '0'];
                    }
                    let GrandTotal = (parseFloat(Hours) + parseFloat(PaidTimeOff) + parseFloat(TimeOff) + parseFloat(Holiday.toString())).toFixed(4); //which excludes the Holiday hours from timesheet
                    let [StartDate, EndDate] = [DateUtilities.getDateMMDDYYYY(Start), DateUtilities.getDateMMDDYYYY(End)];
                    //Below condition is for Handle , scenarios where:
                    // 1.the selected start date falls within the previous month week's timesheet.
                    // 1.the selected end date falls within the next month week's timesheet.
                    if (Start < new Date(SelStartDate) || End > new Date(SelEndDate)) {
                        let Response = this.GetExceedWeekData(BillHrs, blanksHrs, PTOHours, HolidayTotal, StartDate, EndDate, SelStartDate, SelEndDate); // if employee not eligible for PTO, consider total time off hours, PTO hours as 0
                        if (report.EligibleforPTO) {
                            Response = this.GetExceedWeekData(BillHrs, PTOSubTotal, TOSubTotal, HolidayTotal, StartDate, EndDate, SelStartDate, SelEndDate);// if employee eligible for PTO, consider time off hours, PTO hours individually
                        }
                        Hours = Response.Hours;
                        PaidTimeOff = Response.PaidTimeOff;
                        TimeOff = Response.TimeOff;
                        Holiday = Response.Holiday;
                        GrandTotal = Response.GrandTotal;
                        StartDate = Response.StartDate;
                        EndDate = Response.EndDate;
                    }
                    let CommentsHistory = [null, undefined, ''].includes(report.CommentsHistory) ? [] : JSON.parse(report.CommentsHistory);
                    let [ApprovedBy, ApprovedOn] = ['', ''];
                    for (let i = CommentsHistory.length - 1; i >= 0; i--) {
                        if (CommentsHistory[i].Role.toLowerCase() == "manager" && CommentsHistory[i].Action == StatusType.Approved) {
                            let ApprDate = new Date(CommentsHistory[i]["Date"]);
                            ApprovedBy = CommentsHistory[i].User;
                            ApprovedOn = DateUtilities.getDateMMDDYYYY(ApprDate) + "  " + ApprDate.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1];
                            break;
                        }
                    }
                    if (new Date(StartDate) >= new Date(SelStartDate) && new Date(StartDate) <= new Date(SelEndDate)) {
                        ReportData.push(
                            {
                                SNo: row,
                                EmployeeId: report.Initiator.Id,
                                EmployeeName: report.Initiator.Title,
                                DateRange: `${StartDate} - ${EndDate}`,
                                BillableHours: parseFloat(Hours),
                                PaidTimeOff: parseFloat(PaidTimeOff),
                                TimeOff: parseFloat(TimeOff),
                                Holiday: parseFloat(Holiday.toString()),
                                GrandTotal: parseFloat(GrandTotal),
                                ApprovedBy: ApprovedBy,
                                ApprovedOn: ApprovedOn,
                                //Status : this.getStatus(report.Status)
                            }
                        );
                    }
                    row++;
                });
                // To Group the data
                let GroupedData = ReportData.reduce((acc, item) => {
                    const EmployeeName = item.EmployeeName;
                    if (!acc[EmployeeName]) {
                        acc[EmployeeName] = [];
                    }
                    acc[EmployeeName].push(item);
                    return acc;
                }, {});
                // To sort the Data
                let SortedReportData = Object.keys(GroupedData)
                    .sort()  // Sort EmployeeName alphabetically
                    .reduce((acc, EmployeeName) => {
                        acc[EmployeeName] = Object.keys(GroupedData[EmployeeName]);
                        acc[EmployeeName] = GroupedData[EmployeeName];
                        return acc;
                    }, {});

                // Sort the final array based on client and initiator
                PDFData.sort((a, b) => {
                    if (a.ClientName !== b.ClientName) {
                        return a.ClientName.localeCompare(b.ClientName);
                    } else {
                        return a.Name.localeCompare(b.Name);
                    }
                });
                this.setState({ ReportData: SortedReportData, PDFData: PDFData, loading: false, fileName: `Timesheet Report (${SelStartDate.replaceAll("/", "-")} To ${SelEndDate.replaceAll("/", "-")}) -  ${client}` });
            }
            else {
                customToaster('toster-error', ToasterTypes.Error, 'No timesheets found!', 4000);
                this.setState({ ReportData: [], PDFData: [], loading: false });
            }
        }
        catch (Error) {
            console.log('Failed to get Reort Data' + Error);
            this.setState({ loading: false });
        }
    }
    private GetExceedWeekData = (BillHrs, PTOSubTotal, TOSubTotal, HolidayTotal, StartDate, EndDate, SelStartDate, SelEndDate) => {
        let Obj = { Hours: '0', PaidTimeOff: '0', TimeOff: '0', Holiday: '0', GrandTotal: '0', StartDate: '', EndDate: '' };
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let currDate = new Date(StartDate);
        let [Hours, PaidTimeOff, TimeOff, Holiday, GrandTotal, Start, End] = [0, 0, 0, 0, 0, null, null];
        for (let i = 0; i < 7; i++) {
            let date = new Date(currDate);
            if (date >= new Date(SelStartDate) && date <= new Date(SelEndDate)) {
                Hours += parseFloat(['', null, undefined].includes(BillHrs[days[date.getDay()]]) ? 0 : BillHrs[days[date.getDay()]]); //null handling for case of Synergy Office hours includes may be empty
                if (PTOSubTotal.length && !["Sat", "Sun"].includes(days[date.getDay()]))
                    PaidTimeOff += parseFloat(PTOSubTotal[0][days[date.getDay()]]); //for calculating Paid time off
                if (TOSubTotal.length && !["Sat", "Sun"].includes(days[date.getDay()]))
                    TimeOff += parseFloat(['', null, undefined].includes(TOSubTotal[0][days[date.getDay()]]) ? 0 : TOSubTotal[0][days[date.getDay()]]); //for calculating  time off ,null handling for case of time off hours for PTO not eligible employees includes may be empty
                Holiday += parseFloat(['', null, undefined].includes(HolidayTotal[0][days[date.getDay()]]) ? 0 : HolidayTotal[0][days[date.getDay()]]); //for calculating Holiday ,null handling for case of holiday hours includes may be empty
                GrandTotal += (parseFloat(['', null, undefined].includes(BillHrs[days[date.getDay()]]) ? 0 : BillHrs[days[date.getDay()]]) + ((PTOSubTotal.length && !["Sat", "Sun"].includes(days[date.getDay()])) ? parseFloat(PTOSubTotal[0][days[date.getDay()]]) : 0) + ((TOSubTotal.length && !["Sat", "Sun"].includes(days[date.getDay()])) ? parseFloat(['', null, undefined].includes(TOSubTotal[0][days[date.getDay()]]) ? 0 : TOSubTotal[0][days[date.getDay()]]) : 0) + parseFloat(['', null, undefined].includes(HolidayTotal[0][days[date.getDay()]]) ? 0 : HolidayTotal[0][days[date.getDay()]])); // for calculating Grand total = Biil hours + paid time off + time off
                if (Start == null) {
                    Start = date;
                }
                End = date;
            }
            currDate.setDate(currDate.getDate() + 1);
        }
        Obj['Hours'] = Hours.toFixed(4);
        Obj['PaidTimeOff'] = PaidTimeOff.toFixed(4);
        Obj['TimeOff'] = TimeOff.toFixed(4);
        Obj['Holiday'] = Holiday.toFixed(4);
        Obj['GrandTotal'] = GrandTotal.toFixed(4);
        Obj['StartDate'] = DateUtilities.getDateMMDDYYYY(Start);
        Obj['EndDate'] = DateUtilities.getDateMMDDYYYY(End);

        return Obj;
    }
    private downloadExcel(startDate) {
        this.setState({ loading: true })
        const wb = XLSX.utils.book_new();
        let Excelheaders = this.constructExcelHeader()
        let finalData = this.generateExcelData(this.state.ReportData, Excelheaders)

        const finalWorkshetData = XLSX.utils.aoa_to_sheet(finalData)
        // finalWorkshetData['!autofilter'] = { ref: 'A7:B7' };
        // mention the range of merge for individual row/item accordingly
        const merge = [
            { s: { r: 1, c: 1 }, e: { r: 1, c: 20 } },
            // { s: { r: 2, c: 2 }, e: { r: 2, c: 16 } },
            //======= new-start
            // { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
            { s: { r: 2, c: 2 }, e: { r: 2, c: 19 } },
            //======== end
            // 3rd row days merge
            { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } },
            { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
            { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } },
            { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } },
            { s: { r: 3, c: 10 }, e: { r: 3, c: 11 } },
            { s: { r: 3, c: 12 }, e: { r: 3, c: 13 } },
            { s: { r: 3, c: 14 }, e: { r: 3, c: 15 } },
            // 4th row dates merge
            { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
            { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
            { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
            { s: { r: 4, c: 8 }, e: { r: 4, c: 9 } },
            { s: { r: 4, c: 10 }, e: { r: 4, c: 11 } },
            { s: { r: 4, c: 12 }, e: { r: 4, c: 13 } },
            { s: { r: 4, c: 14 }, e: { r: 4, c: 15 } },
            // 4th row column merge
            { s: { r: 4, c: 16 }, e: { r: 5, c: 16 } },
            { s: { r: 4, c: 17 }, e: { r: 5, c: 17 } },
            { s: { r: 4, c: 18 }, e: { r: 5, c: 18 } },
            { s: { r: 4, c: 19 }, e: { r: 5, c: 19 } },
            { s: { r: 4, c: 20 }, e: { r: 5, c: 20 } },
        ];

        finalWorkshetData["!merges"] = merge;
        let SD = startDate.replaceAll("/", "-")
        XLSX.utils.book_append_sheet(wb, finalWorkshetData, `WE ${SD}`);
        // STEP 4: Write Excel file to browser
        XLSX.writeFile(wb, this.state.fileName + '.xlsx');
        this.setState({ loading: false })
    }
    private constructTable(ReportData) {
        let [StartDate, EndDate] = [new Date(this.state.startDate), new Date(this.state.endDate)];
        let [Start, End] = [DateUtilities.getDateMMDDYYYY(StartDate), DateUtilities.getDateMMDDYYYY(EndDate)];
        let TableHeaders = ['S.NO', 'Employee Name', 'Date Range', 'Billable Hours', 'Approved By', 'Approved On (EST)'];
        if (this.state.IsThisReportForInternal)
            TableHeaders = ['S.NO', 'Employee Name', 'Date Range', 'Billable Hours', 'Paid Time Off', 'Time off', 'Holiday', 'Grand Total', 'Approved By', 'Approved On (EST)'];
        // let date = new Date(this.state.startDate);
        // let dateArray = []
        // let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        // dateArray.push("Mon " + `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)
        // for (let i = 0; i < 6; i++) {
        //     date.setDate(date.getDate() + 1)
        //     dateArray.push(days[i + 1] + " " + `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)
        // }
        return (
            <div className='border-box-shadow light-box p-2'>
                <div className='t-div txt-center dataTables_wrapper-overflow'>
                    {/* <div id='pdfMessage'>Note: The PDF button generates only individual timesheets that have been approved by the manager or reviewer.</div> btnTitle='Export manager/reviewer approved individual timesheets in PDF'*/}
                    {/* <a type="button" id="btnDownloadFile" title='Export all timesheets to excel' className="a-export-excel txt-center" onClick={(e) => this.downloadExcel(`${this.state.startDate.getMonth() + 1}/${this.state.startDate.getDate()}/${this.state.startDate.getFullYear()}`)}> Export to Excel
                    <FontAwesomeIcon icon={faFileExcel} className=''></FontAwesomeIcon>
                    </a> */}
                    <ExportPDFMonthlyReport ReportData={this.state.ReportData} ReportHeaders={TableHeaders} IsThisReportForInternal={this.state.IsThisReportForInternal} ReportFields={{ 'ClientName': this.state.ClientName, 'StartDate': Start, 'EndDate': End }} ClientName={this.state.ClientName} DateRange={`${Start} - ${End}`} LogoImgUrl={this.siteURL + '/PublishingImages/SynergyLogo.png'} filename={this.state.fileName} btnTitle='Export Bi-Weekly report to PDF' className='a-export-pdf-button'></ExportPDFMonthlyReport>
                </div>
                <div id="WeeklyTableResponsive" className='table-responsive dataTables_wrapper-overflow mt-2'>
                    <table className="tblMonthlyTimesheetReport" width="100%">
                        <thead id="theadMonthlyTimesheetReport">
                            <tr className='tr-brd'>
                                <th colSpan={2}><div className='Wr-fz-16 text-center'>{this.state.ClientName}</div></th>
                                <th colSpan={this.state.IsThisReportForInternal ? 8 : 4}><div className='Wr-fz-16 text-center'>{Start} - {End}</div></th>
                            </tr>
                            <tr className='tr-brd-2'>
                                {this.getTableHeadings(TableHeaders)}
                            </tr>
                        </thead>
                        <tbody className="tbodyMonthlyTimesheetReport">
                            {/*dynamic data */}
                            {this.generateTableRows(ReportData)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    private generateTableRows(ReportData) {
        let EmpRows = [];
        let count = 1;
        for (let Emp in ReportData) {
            EmpRows.push(this.getEmpWeekStartDateRows(ReportData[Emp], count));
            count++;
        }
        return EmpRows;
    }
    private getEmpWeekStartDateRows(EmpData, count) {
        let WSRows = [];
        let rowCount = 1;
        for (let i in EmpData) {
            if (rowCount == 1) {
                if (this.state.IsThisReportForInternal) {
                    WSRows.push(<tr className='' key={count}>
                        <td className={`txt-center ${count % 2 == 1 ? 'OddSlNo' : 'EvenSlNo'}`} rowSpan={EmpData.length}>{count}</td>
                        <td className={`text-dark ${count % 2 == 1 ? 'OddSlNo' : 'EvenSlNo'}`} rowSpan={EmpData.length}>{EmpData[i].EmployeeName}</td>
                        <td className=''>{EmpData[i].DateRange}</td>
                        <td className=''>{EmpData[i].BillableHours}</td>
                        <td className=''>{EmpData[i].PaidTimeOff}</td>
                        <td className=''>{EmpData[i].TimeOff}</td>
                        <td className=''>{EmpData[i].Holiday}</td>
                        <td className=''>{EmpData[i].GrandTotal}</td>
                        <td className=''>{EmpData[i].ApprovedBy}</td>
                        <td className=''>{EmpData[i].ApprovedOn}</td>
                        {/* <td className='text-center' title={EmpData[i].Status}><span className={`${this.getStatusClass(EmpData[i].Status)}`}>{this.showRMStatus(EmpData[i].Status)}</span></td> */}
                    </tr>)
                }
                else {
                    WSRows.push(<tr className='' key={count}>
                        <td className={`txt-center ${count % 2 == 1 ? 'OddSlNo' : 'EvenSlNo'}`} rowSpan={EmpData.length}>{count}</td>
                        <td className={`text-dark ${count % 2 == 1 ? 'OddSlNo' : 'EvenSlNo'}`} rowSpan={EmpData.length}>{EmpData[i].EmployeeName}</td>
                        <td className=''>{EmpData[i].DateRange}</td>
                        <td className=''>{EmpData[i].BillableHours}</td>
                        <td className=''>{EmpData[i].ApprovedBy}</td>
                        <td className=''>{EmpData[i].ApprovedOn}</td>
                        {/* <td className='text-center' title={EmpData[i].Status}><span className={`${this.getStatusClass(EmpData[i].Status)}`}>{this.showRMStatus(EmpData[i].Status)}</span></td> */}
                    </tr>)
                }
            }
            else {
                if (this.state.IsThisReportForInternal) {
                    WSRows.push(<tr className='' key={count}>
                        <td className=''>{EmpData[i].DateRange}</td>
                        <td className=''>{EmpData[i].BillableHours}</td>
                        <td className=''>{EmpData[i].PaidTimeOff}</td>
                        <td className=''>{EmpData[i].TimeOff}</td>
                        <td className=''>{EmpData[i].Holiday}</td>
                        <td className=''>{EmpData[i].GrandTotal}</td>
                        <td className=''>{EmpData[i].ApprovedBy}</td>
                        <td className=''>{EmpData[i].ApprovedOn}</td>
                        {/* <td className='text-center' title={EmpData[i].Status}><span className={`${this.getStatusClass(EmpData[i].Status)}`}>{this.showRMStatus(EmpData[i].Status)}</span></td> */}
                    </tr>)
                }
                else {
                    WSRows.push(<tr className='' key={count}>
                        <td className=''>{EmpData[i].DateRange}</td>
                        <td className=''>{EmpData[i].BillableHours}</td>
                        <td className=''>{EmpData[i].ApprovedBy}</td>
                        <td className=''>{EmpData[i].ApprovedOn}</td>
                        {/* <td className='text-center' title={EmpData[i].Status}><span className={`${this.getStatusClass(EmpData[i].Status)}`}>{this.showRMStatus(EmpData[i].Status)}</span></td> */}
                    </tr>)
                }
            }
            rowCount++;
        }
        // return ReportData.map((item, index) => (
        //     <tr className='table-data' key={index}>
        //         <td className='txt-center'>{item.SNo}</td>
        //         <td className='text-dark'>{item.EmployeeName}</td>
        //         <td className=''>{item.DateRange}</td>
        //         <td className=''>{item.BillableHours}</td>
        //         <td className=''>{item.ApprovedBy}</td>
        //         <td className=''>{item.ApprovedOn}</td>
        //     </tr>
        // ));
        return WSRows;
    }
    private getTableHeadings = (TableHeaders) => {
        let headings = [];
        for (let index in TableHeaders) {
            if (Number(index) == 0)
                headings.push(<th ><div className='text-center'>{TableHeaders[index]}</div></th>);
            else if (Number(index) == 1)
                headings.push(<th ><div className='WR-w-155'>{TableHeaders[index]}</div></th>);
            else
                headings.push(<th ><div className=''>{TableHeaders[index]}</div></th>);
        }
        return headings;
    }
    private getStatus(value) {
        let Status = value
        if (value == "approved by Manager") {
            Status = "Approved by Reporting Manager"
        }
        else if (value == "rejected by Manager") {
            Status = "Rejected by Reporting Manager"
        }
        else if (value == "rejected by Synergy") {
            Status = "Rejected by Synergy"
        }
        return Status
    }
    private showRMStatus(status) {
        if (status == 'Approved by Reporting Manager') {
            return 'RM Approved'
        }
        else if (status == 'Rejected by Reporting Manager') {
            return "RM Rejected"
        }
        else if (status == "Rejected by Synergy") {
            return "Reviewer Rejected"
        }
        return status
    }
    private getStatusClass(Status) {
        if (Status == "Submitted") {
            return "span-blue"
        }
        else if (Status == "Approved") {
            return "span-green"
        }
        else if (Status == "Approved by Reporting Manager") {
            return "span-manager-approve"
        }
        else if (Status == "Rejected by Reporting Manager") {
            return "span-rejected"
        }
        else if (Status == "Rejected by Synergy") {
            return "span-rejected"
        }
    }
    private generateCellStyle(fillColor, isLastRow = false, CellBorders, color = '000000', isbold = false) {

        const defaultStyle = { font: { bold: isbold, color: { rgb: color } }, fill: { fgColor: { rgb: fillColor } }, border: CellBorders };
        if (isLastRow) {
            return { ...defaultStyle, border: { bottom: { style: 'thin', color: { rgb: "000000" } } } };
        }
        return defaultStyle;
    }
    private generateExcelData(reportData, WorksheetData) {
        const sheetData = WorksheetData;
        const allBorders = {
            top: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } },
        };

        for (let i = 0; i < reportData.length; i++) {
            const d = reportData[i];
            const isLastRow = i === reportData.length - 1;
            const rowData = [
                { v: i + 1, t: "s", s: this.generateCellStyle('dbf6ff', false, allBorders) },
                { v: d.Employee, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.MNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow, {}) },
                { v: d.MB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.TNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow, {}) },
                { v: d.TB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.WNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow, {}) },
                { v: d.WB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.ThNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow, {}) },
                { v: d.ThB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.FNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow, {}) },
                { v: d.FB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.SNB, t: "s", s: this.generateCellStyle('FCE4D6', isLastRow, {}) },
                { v: d.SB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, {}) },
                { v: d.SuNB, t: "s", s: this.generateCellStyle('FCE4D6', isLastRow, {}) },
                { v: d.SuB, t: "s", s: this.generateCellStyle('ffffff', isLastRow, { right: { style: 'thin', color: { rgb: "000000" } } }) },
                { v: d.TotalNB, t: "s", s: isLastRow ? { font: { color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'ffffff' } }, border: allBorders } : this.generateCellStyle('ffffff', isLastRow, { bottom: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } } }, 'FF0000') },
                { v: d.TotalB, t: "s", s: isLastRow ? { font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' } }, border: allBorders } : this.generateCellStyle('ffffff', isLastRow, { bottom: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } } }) },
                { v: d.TotalH, t: "s", s: { font: { bold: true }, fill: { fgColor: { rgb: 'D9E1F2' } }, border: allBorders } },
                { v: d.Status, t: "s", s: isLastRow ? { font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' } }, border: allBorders } : this.generateCellStyle('ffffff', isLastRow, { bottom: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } } }) },
                { v: '', t: "s", s: isLastRow ? { font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' } }, border: allBorders } : this.generateCellStyle('ffffff', isLastRow, { bottom: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } } }) }
            ];
            sheetData.push(rowData);
        }

        return sheetData;
    }
    private constructExcelHeader() {

        let worksheetRows = []
        worksheetRows.push([])
        let row1 = [{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row1.push({
            v: 'Synergy Computer Solutions, Inc.', t: "s", s: {
                alignment: { vertical: "center", horizontal: "center" }, font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        for (let i = 0; i < 19; i++) {
            row1.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "center" }, font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row1)
        let row2 = [];
        row2 = [{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: this.state.ClientName, t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        row2.push({
            v: 'Weekly Time sheet', t: "s", s: {
                alignment: { vertical: "center", horizontal: "center" }, font: { bold: true, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        for (let i = 0; i < 18; i++) {
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row2)
        //same formate required form here on so using row2 structure
        row2 = [];
        row2 = [{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: 'Week Start Date - Week End Date ', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'BEBABA' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        let startDate = this.state.startDate;
        let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        let dates = [];
        dates.push(DateUtilities.getDateMMDDYYYY(startDate));
        let date = new Date(startDate)
        for (let i = 0; i < 6; i++) {
            date.setDate(date.getDate() + 1);
            dates.push(DateUtilities.getDateMMDDYYYY(date));
        }
        for (const day of days) {
            let bgColor = "BEBABA";
            ["Saturday", "Sunday"].includes(day) ? bgColor = "FCE4D6" : bgColor//f7ead7
            row2.push({
                v: day, t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        for (let i = 0; i < 5; i++) {// d4cfcf ~ BEBABA
            let bgColor = "BEBABA";
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row2)
        row2 = []
        row2 = [{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: dates[0] + " - " + dates[dates.length - 1], t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'ffffff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        //push dates f5f2f2
        for (let i = 0; i < 7; i++) {
            row2.push({
                v: dates[i], t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
            row2.push({
                v: "", t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        row2.push(
            {
                v: 'Total Non Billable', t: "s", s: {
                    alignment: { wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        row2.push(
            {
                v: 'Total Billable', t: "s", s: {
                    alignment: { wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        row2.push(
            {
                v: 'Total Hours', t: "s", s: {
                    alignment: { wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'D9E1F2' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        row2.push(
            {
                v: 'Approval Status', t: "s", s: {
                    alignment: { wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: '609c75' } }, border: {// 2a7042
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        row2.push(
            {
                v: 'Notes & Remarks', t: "s", s: {
                    alignment: { wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        worksheetRows.push(row2)
        row2 = []
        row2 = [{
            v: 'S.No', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: 'Employee Name', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'ffffff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        let data = {
            value: "Non Billable",
            isBold: false,
            bgColor: 'E7E6E6',
            wrapText: true
        }
        for (let i = 1; i <= 14; i++) {
            if (i % 2 != 0) {
                data.value = "Non Billable"
                data.isBold = false
                data.wrapText = true
                if ([11, 13].includes(i))
                    data.bgColor = 'FCE4D6'
                else
                    data.bgColor = 'E7E6E6'
            }
            else {
                data.value = "Billable"
                data.isBold = false
                data.bgColor = 'ffffff'
                data.wrapText = false
            }
            row2.push({
                v: data.value, t: "s", s: {
                    alignment: { wrapText: data.wrapText, vertical: "center", horizontal: "left" }, font: { bold: data.isBold, sz: 10, color: { rgb: "00000" } }, fill: { fgColor: { rgb: data.bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })

        }
        for (let i = 0; i < 5; i++) {
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: data.isBold, sz: 12, color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row2)
        row2 = []
        row2 = [{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        if (!this.state.ClientName.toLowerCase().includes('synergy'))
            row2.push({
                v: 'Billable Hourly', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {}
                }
            })
        else {
            row2.push({
                v: 'Billable Salary', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {}
                }
            })
        }

        for (let i = 1; i < 20; i++) {
            let bgColor = "E7E6E6"
            if (i == 17) {
                bgColor = "D9E1F2"// dbf6ff
            }
            else if ([11, 13].includes(i))
                bgColor = 'FCE4D6'

            if (![15, 16, 17, 18].includes(i)) {
                i != 19 ?
                    row2.push({
                        v: '', t: "s", s: {
                            alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {}
                        }
                    }) :
                    row2.push({
                        v: '', t: "s", s: {
                            alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                                // top: { style: 'thin', color: { rgb: "000000" } },
                                // left: { style: 'thin', color: { rgb: "000000" } },
                                bottom: { style: 'thin', color: { rgb: "000000" } },
                                right: { style: 'thin', color: { rgb: "000000" } },
                            }
                        }
                    })
            }
            else
                row2.push({
                    v: '', t: "s", s: {
                        alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                            // top: { style: 'thin', color: { rgb: "000000" } },
                            // left: { style: 'thin', color: { rgb: "000000" } },
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            // right: { style: 'thin', color: { rgb: "000000" } },
                        }
                    }
                })
        }
        worksheetRows.push(row2)
        return worksheetRows
    }
    private getcurrWeekSunDay = () => {
        let date = new Date();
        if (new Date(date).getDay() === 0) {
            return new Date(date)
        }
        else {
            return addDays(new Date(), 7 - (new Date().getDay()));
        }
    }

    public render() {
        if (!this.state.isPageAccessable) {
            let url = this.siteURL + "/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        if (this.state.Homeredirect) {
            let url = `/Dashboard/`;
            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title"> Bi-Weekly Report
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>
                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-3">
                                                <div className="custom-dropdown">
                                                    <SearchableDropdown label="Client" Title="Client" name="ClientName" id="Client" placeholderText="Select Client" className="" selectedValue={this.state.ClientName} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.ClientsObject} onChange={(selectedOption, actionMeta) => { this.handleClientChange(selectedOption, actionMeta) }} isRequired={true} refElement={this.client} noOptionsMessage="No Client"></SearchableDropdown>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="custom-dropdown">
                                                    {/* <SearchableDropdown label="Employee" Title="Employee" name="InitiatorId" id="Employee" placeholderText="Select Employee" className="" selectedValue={this.state.InitiatorId} optionLabel={'Title'} optionValue={'ID'} OptionsList={this.state.EmployeesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} isRequired={true} refElement={this.EmployeeDropdown} noOptionsMessage="No Employee"></SearchableDropdown> */}
                                                    <MultiSelectDropdown label="Employee" Title="Employee" name="InitiatorId" id="Employee" placeholderText="Select Employee" className="" selectedValue={this.state.InitiatorId} optionLabel={'Title'} optionValue={'ID'} OptionsList={this.state.EmployeesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} isRequired={true} refElement={this.EmployeeDropdown} noOptionsMessage="No Employee"></MultiSelectDropdown>

                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">Start Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divStartDate">
                                                        <DatePicker onDatechange={this.handleStartorEndDate} selectedDate={this.state.startDate} ref={this.startDate} endDate={new Date()} placeholderText='MM/DD/YYYY' id={'txtStartDate'} title={"Start Date"} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">End Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divEndDate">
                                                        <DatePicker onDatechange={this.handleStartorEndDate} ref={this.endDate} endDate={this.getcurrWeekSunDay()} selectedDate={this.state.endDate} id={'txtEndDate'} title={"End Date"} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <InputCheckBox
                                                        label={"Is This Report for Internal?"}
                                                        name={"IsThisReportForInternal"}
                                                        checked={this.state.IsThisReportForInternal}
                                                        onChange={this.handleChangeEvents}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        id='chkIsThisReportForInternal'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row mx-1" id="">
                                        <div className="col-sm-12 text-center my-4" id="">
                                            <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit} title={'Search'}>Search</button>
                                            <button type="button" className="CancelButtons btn" onClick={this.handleCancel} title={'Clear'}>Clear</button>
                                        </div>
                                    </div>
                                    {Object.keys(this.state.ReportData).length > 0 ? this.constructTable(this.state.ReportData) : ''}
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
export default MonthlyTimesheetReport;