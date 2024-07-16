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
import { Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import * as XLSX from 'xlsx-js-style';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
export interface WeeklyTimesheetReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface WeeklyTimesheetReportState {
}

class WeeklyTimesheetReport extends React.Component<WeeklyTimesheetReportProps, WeeklyTimesheetReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    private startDate;
    private endDate;
    constructor(props: WeeklyTimesheetReportProps) {
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
        EmployeeId: null,
        ClientName: '',
        ClientsObject: [],
        EmployeesObj: [],
        AllEmployees: [],
        startDate: null,
        endDate: null,
        loading: false,
        EmployeeEmail: '',
        Homeredirect: false,
        isPageAccessable: true,
        showToaster: false,
        InitiatorId: '0',
        isHavingClients: true,
        isHavingEmployees: true,
        ColumnsHeaders: [],
        ExportExcelData: [],
        weekStartDay: 'Monday',
        WeeklyData: [],
    }

    public componentDidMount() {
        highlightCurrentNav("WeeklyTimesheetReport");
        this.setState({ loading: true });
        this.getOnLoadData()
    }

    private async getOnLoadData() {
        let selectQuery = "Employee/ID,Employee/Title"
        let [groups, Clients, Employees] = await Promise.all([
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get(),
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
        if (Clients.length > 0)
            this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: true, showToaster: true })
        else
            this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: false, showToaster: true })
    }
    private handleClientChange = (event) => {
        this.setState({ loading: true });
        let { name } = event.target;
        let value = event.target.value;
        this.setState({ [name]: value });
        this.setState({ WeeklyData: [] });
        this.getClientEmployees(value)
    }
    private async getClientEmployees(value) {
        if (value != "All") {
            let selectQuery = "Employee/ID,Employee/Title,WeekStartDay"
            let filterQuery = "ClientName eq '" + value + "'"
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
            if (EmpObj.length > 0)
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true, InitiatorId: '0', weekStartDay: clientEmployees[0].WeekStartDay })
            else {
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false, InitiatorId: '-1', weekStartDay: weekDay })
                customToaster('toster-error', ToasterTypes.Error, 'There are no employees associated with this client', 4000);
            }
        }
        else {
            this.setState({ EmployeesObj: this.state.AllEmployees, loading: false, isHavingEmployees: true, InitiatorId: '0' })
        }
    }
    private handleChangeEvents = (event) => {
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        let { name } = event.target;
        this.setState({ [name]: value });
        this.setState({ WeeklyData: [] });
    }
    private handleStartDate = (dateprops) => {
        if (dateprops != null) {
            let date = new Date(dateprops)
            this.setState({ startDate: date, WeeklyData: [] });
        }
        else {
            this.setState({ startDate: null, WeeklyData: [] });
        }
    }
    private handleCancel = async (e) => {
        this.setState({ Homeredirect: true });
    }
    private handleSubmit = () => {
        let data = {
            Client: { val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.client },
            Employee: { val: parseInt(this.state.InitiatorId), required: true, Name: 'Employee', Type: ControlType.number, Focusid: this.EmployeeDropdown },
            WeeklyStartDate: { val: this.state.startDate, required: true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid: "divWeekStartDate" }
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            return false
        }
        let date = new Date(this.state.startDate)
        let selectedStartDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        date = date = addDays(new Date(date), 6);
        let selectedEndDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

        let postObject = {
            Client: this.state.ClientName,
            Employee: parseInt(this.state.InitiatorId),
            StartDate: selectedStartDate,
            EndDate: selectedEndDate
        }
        this.getReportData(postObject)
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
    private getReportData = async (postObject) => {
        let client = postObject.Client
        let Employee = postObject.Employee
        let date = postObject.StartDate
        let EndDate = postObject.EndDate
        let prevDate = addDays(new Date(date), -1);
        let nextDate = addDays(new Date(date), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`
        let filterQuery = ''
        if (client == "All") {
            if (Employee == 0) {
                filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
            }
            else {
                filterQuery = "InitiatorId eq '" + Employee + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
            }
        }
        else {
            if (Employee == 0) {
                filterQuery = "ClientName eq'" + client + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
            }
            else {
                filterQuery = "ClientName eq'" + client + "' and InitiatorId eq '" + Employee + "' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
            }
        }
        filterQuery += "and Status eq '" + StatusType.Approved + "'"
        let reportData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterQuery).expand('Initiator').select('Initiator/Title,TotalHrs,BillableSubtotalHrs,NonBillableSubTotalHrs,ClientName,WeekStartDate,Status,*').orderBy('WeekStartDate,ClientName,Initiator/Title', true).getAll()
        if (reportData.length > 0) {
            let weeklyData = []
            let row = 1;
            reportData.forEach(report => {
                let date = new Date(report.WeekStartDate.split('-')[1] + '/' + report.WeekStartDate.split('-')[2].split('T')[0] + '/' + report.WeekStartDate.split('-')[0])
                let isBillable = true;
                if (report.ClientName.toLowerCase().includes('synergy')) {
                    isBillable = false
                }
                weeklyData.push({
                    //properties required to show in Data Table 
                    Id: report.Id,
                    Date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                    EmployeName: report.Name,
                    Status: this.getStatus(report.Status),
                    Client: report.ClientName,
                    BillableHours: isBillable ? parseFloat(parseFloat(report.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(report.SynergyOfficeHrs)[0].Total).toFixed(2)),
                    OTTotalHrs: parseFloat(parseFloat(report.OTTotalHrs).toFixed(2)),
                    TotalBillableHrs: parseFloat(parseFloat(report.BillableTotalHrs).toFixed(2)),
                    HolidayHrs: parseFloat(parseFloat(JSON.parse(report.ClientHolidayHrs)[0].Total).toFixed(2)),
                    PTOHrs: parseFloat(parseFloat(JSON.parse(report.PTOHrs)[0].Total).toFixed(2)),
                    TotalHours: parseFloat(parseFloat(report.GrandTotal).toFixed(2)),
                    //properties required for PDF download
                    WeeklyHrs: JSON.parse(report.WeeklyHrs),
                    OverTimeHrs: JSON.parse(report.OverTimeHrs),
                    SynergyOfficeHrs: JSON.parse(report.SynergyOfficeHrs),
                    ClientHolidayHrs: JSON.parse(report.ClientHolidayHrs),
                    TimeOffHrs: JSON.parse(report.PTOHrs),
                    BillableSubtotalHrs: JSON.parse(report.BillableSubtotalHrs),
                    TotalHrs: JSON.parse(report.TotalHrs),
                    CommentsHistory: JSON.parse(report.CommentsHistory),
                })
                row++;
            });
            this.setState({ WeeklyData: weeklyData })
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, 'No approved timesheets found!', 4000);
        }
    }
    public render() {

        const columns = [
            {
                name: "Date",
                selector: (row, i) => row.Date,
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
               width: '250px',
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                sortable: true
            },
            {
                name: "Hours",
                selector: (row, i) => row.BillableHours,
                width: '100px',
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
                selector: (row, i) => row.HolidayHrs,
                width: '130px',
                sortable: true,
            },
            {
                name: "Time Off",
                selector: (row, i) => row.PTOHrs,
                width: '110px',
                sortable: true,
            },
            {
                name: "Grand Total",
                selector: (row, i) => row.TotalHours,
                sortable: true
            }
        ];
        if (!this.state.isPageAccessable) {
            let url = this.siteURL + "/SitePages/AccessDenied.aspx"
            window.location.href = url
        }
        if (this.state.Homeredirect) {
            let url = `/Dashboard/`
            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className="title">Timesheet Weekly Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="light-box border-box-shadow mx-auto dataTables_wrapper-overflow mb-2">
                                <div className="my-2">
                                    <div className="row pt-2 px-2">
                                        <div className="col-md-4">
                                            <div className="light-text">
                                                <label>Client<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleClientChange}>
                                                    <option value=''>None</option>
                                                    {this.state.ClientsObject.map((option) => (
                                                        <option value={option.Title} selected={option.Title == this.state.ClientName}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="light-text ">
                                                <label>Employee<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="InitiatorId" title="Employee" onChange={this.handleChangeEvents} ref={this.EmployeeDropdown}>
                                                    {this.state.isHavingEmployees ? <option value='0'>All Employees</option> : <option value='-1'>None</option>}
                                                    {this.state.EmployeesObj.map((option) => (
                                                        <option value={option.ID} selected={this.state.InitiatorId == option.ID}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="light-text div-readonly">
                                                <div className="custom-datepicker" id="divWeekStartDate">
                                                    <CustomDatePicker
                                                        handleChange={this.handleStartDate}
                                                        selectedDate={this.state.startDate}
                                                        className='txtstartDate form-control'
                                                        labelName='Week Start Date'
                                                        ref={this.startDate}
                                                        Day={this.state.weekStartDay}
                                                        isDisabled={false}
                                                        isDateRange={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row mx-1" id="">
                                        <div className="col-sm-12 text-center my-4" id="">
                                            <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
                                            <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {this.state.WeeklyData.length > 0 ? <div className='border-box-shadow light-box table-responsive mb-3 dataTables_wrapper-overflow p-2'><div className='c-v-table table-head-1st-td'>
                            <TableGenerator columns={columns} data={this.state.WeeklyData} fileName={'All Timesheets'} showExportExcel={false} showExportPDF={true} searchBoxLeft={true} logoUrlToPDF={this.siteURL+'/PublishingImages/SynergyLogo.png'}></TableGenerator>
                        </div></div> : ''}
                    </div>
                </div>
                    {this.state.showToaster && <Toaster />}
                    {this.state.loading && <Loader />}
                </React.Fragment >
            );
        }
    }
}
export default WeeklyTimesheetReport