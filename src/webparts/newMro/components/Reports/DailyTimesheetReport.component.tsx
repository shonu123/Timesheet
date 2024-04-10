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
import { Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import * as XLSX from 'xlsx-js-style';
import { faCloudDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusType } from '../../Constants/Constants';
export interface DailyTimesheetReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface DailyTimesheetReportState {
}

class DailyTimesheetReport extends React.Component<DailyTimesheetReportProps, DailyTimesheetReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    constructor(props: DailyTimesheetReportProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        this.EmployeeDropdown = React.createRef();
    }

    public state = {
        EmployeeId: null,
        ClientName: 'All',
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
        ResultExcelData : []
    }

    public componentDidMount() {
        highlightCurrentNav("DailyTimesheetReport");
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
        if (userGroups.includes('Timesheet Administrators')) {
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
        this.getClientEmployees(value)
    }

    private async getClientEmployees(value) {
        if (value != "All") {
            let selectQuery = "Employee/ID,Employee/Title"
            let filterQuery = "ClientName eq '" + value + "'"
            let clientEmployees = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterQuery).expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
            let EmpNames = []
            let EmpObj = []
            for (const name of clientEmployees) {
                if (!EmpNames.includes(name.Employee.Title)) {
                    EmpNames.push(name.Employee.Title)
                    EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title })
                }
            }
            if (EmpObj.length > 0)
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true, InitiatorId: '0' })
            else {
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false, InitiatorId: '-1' })
                customToaster('toster-error', ToasterTypes.Error, 'There are no employees associated with this client', 4000);
            }
        }
        else {
            this.setState({ EmployeesObj: this.state.AllEmployees, loading: false, isHavingEmployees: true, InitiatorId: '0' })
        }
    }
    private handleChangeEvents = (event) => {
        console.log(this.state);
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        console.log(value);
        let { name } = event.target;
        this.setState({ [name]: value });
    }
    private handleStartDate = (dateprops) => {
        console.log(dateprops)
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
            this.setState({ startDate: date });
        }
    }
    private handleEndDate = (dateprops) => {
        console.log(dateprops)
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
            this.setState({ endDate: date });
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
        }
        else if (this.state.endDate == null) {
            isvalid.status = false;
            isvalid.message = 'End Date cannot be blank'
        }
        else if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be greater than End Date'
        }
        return isvalid;
    }
    private handleSubmit = () => {
        let data = {
            Client: { val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.client },
            Employee: { val: parseInt(this.state.InitiatorId), required: true, Name: 'Employee', Type: ControlType.number, Focusid: this.EmployeeDropdown },
        }
        let isValid = this.checkIsvalid(data, this.state.startDate, this.state.endDate)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            return false
        }
        let date = new Date(this.state.startDate)
        let selectedStartDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        date = new Date(this.state.endDate)
        let selectedEndDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

        let postObject = {
            Client: this.state.ClientName,
            Employee: parseInt(this.state.InitiatorId),
            StartDate: selectedStartDate,
            EndDate: selectedEndDate
        }
        console.log(postObject)
        this.generateExcelData(postObject)
    }
    private generateDateRange = (startDate,endDate) => {
        const dateRangeArray: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
            dateRangeArray.push(formattedDate);
        }

        return dateRangeArray;
    };
    private generateExcelData = async (postObject) => {
        let client = postObject.Client
        let Employee = postObject.Employee
        let startDate = postObject.StartDate
        let EndDate = postObject.EndDate
        let prevDate = addDays(new Date(startDate), -7);
        let nextDate = addDays(new Date(EndDate), 1);
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
        filterQuery+="and Status ne '"+StatusType.Save+"'"
        let reportData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).expand('Initiator').select('Initiator/Title,TotalHrs,ClientName,WeekStartDate,Status').orderBy('WeekStartDate,ClientName,Initiator/Title', true).getAll()
        if (reportData.length > 0) {
            console.log(reportData)
            let ExcelData = []
            let headerDates = []
            reportData.forEach(report => {
                let { Initiator, WeekStartDate, TotalHrs, ClientName, Status } = report;
                const startDate = new Date(WeekStartDate);
                let startDay = startDate.getDay()

                let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                TotalHrs = JSON.parse(TotalHrs)
                let dates = []
                const currentDate = new Date(startDate);
                for (let i = 0; i < 7; i++) {
                    let date = new Date(currentDate)
                    dates.push(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                const arrangedWeekDays = [];

                weekDays.forEach(day => {
                    arrangedWeekDays.push(TotalHrs[0][day]);
                });
                console.log(arrangedWeekDays)

                for (const d of dates) {
                    let obj = {
                        Initiator: '',
                        Client: '',
                        Date: '',
                        Hours: '',
                        Status:''
                    };
                    obj.Initiator = Initiator.Title,
                        obj.Client = ClientName,
                         obj.Date= d,
                        obj.Hours = arrangedWeekDays[new Date(d).getDay()],
                        obj.Status = Status
                        // obj[""+d] = arrangedWeekDays[new Date(d).getDay()]
                    ExcelData.push(obj);
                    // if (!headerDates.includes(d))//in a single if user submits timesheet for two clients
                    //     headerDates.push(d)
                }
            });
            console.log(ExcelData)
            headerDates = this.generateDateRange(startDate,EndDate)
            console.log(headerDates)
            ExcelData.sort((a, b) => {
                const dateA = new Date(a.Date).getTime();
                const dateB = new Date(b.Date).getTime();
                return dateA - dateB;
            });
            headerDates.sort((a, b) => {
                const dateA = new Date(a.Date).getTime();
                const dateB = new Date(b.Date).getTime();
                return dateA - dateB;
            });
            console.log("After sorting")
            console.log(ExcelData)
            console.log(headerDates)
            // this.generateExcel(ExcelData, headerDates);
            this.state.ResultExcelData = ExcelData;
            let finalArray = [];

// Process the original array
for (const item of ExcelData) {
    // Ensure that the Date and Hours properties are present and valid
    if (item.Date && item.Hours) {
        // Find if there is an existing entry in finalArray for the same client and initiator
        const existingEntryIndex = finalArray.findIndex(entry => entry.Client === item.Client && entry.Initiator === item.Initiator);
        
        // If there is no existing entry, create a new one
        if (existingEntryIndex === -1) {
            const newObj = { Client: item.Client, Initiator: item.Initiator };
            // Initialize all dates with empty string
            for (const date of headerDates) {
                newObj[date] = '';
            }
            newObj[item.Date] = item.Hours;
            finalArray.push(newObj);
        } else {
            // If there is an existing entry, update the working hours for the corresponding date
            finalArray[existingEntryIndex][item.Date] = item.Hours;
        }
    } else {
        console.log(`Invalid item encountered: ${JSON.stringify(item)}`);
    }
}

// Sort the final array based on client and initiator
finalArray.sort((a, b) => {
    if (a.Client !== b.Client) {
        return a.Client.localeCompare(b.Client);
    } else {
        return a.Initiator.localeCompare(b.Initiator);
    }
});

// Output the final array
console.log(finalArray);
 this.generateExcel(finalArray, headerDates,startDate,EndDate);
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, 'No data found!', 4000);
        }


    }

    private getStatusFromExcelData(client, initiator, date) {
        let ExcelData = this.state.ResultExcelData
        const item = ExcelData.find(entry => entry.Client === client && entry.Initiator === initiator && entry.Date === date);
        if(item){
            if([StatusType.ManagerReject.toString().toLowerCase(),StatusType.ReviewerReject.toString().toLowerCase()].includes(item.Status.toLowerCase()))
                return StatusType.Reject;
            else if(StatusType.Submit.toString().toLowerCase()==item.Status.toLowerCase())
                return StatusType.Submit;
            else if(StatusType.Revoke.toString().toLowerCase()==item.Status.toLowerCase())
                return StatusType.Revoke;
            else if(StatusType.Approved.toString().toLowerCase()==item.Status.toLowerCase())
                return StatusType.Approved;
            else
            return "" ;
        }
        else{
            return ""
        }
    }

    private generateExcel(dataTable, headerDates,startDate,endDate) {
        const wb = XLSX.utils.book_new();
        const workSheetRows = []
        let filename = 'Timesheet Daily Report'
        let wrapColumnsArray = []
        let headerRow = []
        let allBorders = {
            top: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } },
            }
        headerRow.push({ v: 'Client Name', t: "s", s: { font: { bold: true },border: allBorders } });
        headerRow.push({ v: 'Employee Name', t: "s", s: { font: { bold: true },border: allBorders } })
        let columnOrder = []
        columnOrder.push("Client")
        columnOrder.push("Initiator")
        // columnOrder.concat(headerDates) color: { rgb: "FF0000" }
        for (const d of headerDates) {
            columnOrder.push(d)
        }
let legend = [
    { v: 'Legend', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'ffffff' } },border: allBorders } },
    { v: 'Submitted', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'fafac5' } },border: allBorders } },
    { v: 'Revoked', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'fae3ea' } },border: allBorders } },
    { v: 'Approved', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'a9e6fc' } },border: allBorders } },
    { v: 'Rejected', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'f7b5b5' } },border: allBorders } }
]
let LegendRow = []
let position = (columnOrder.length - 5)/2+""
// position = parseInt(position)+""

for(let i=0;i<=parseInt(position);i++){
    LegendRow.push({ v: '', t: "s", s: { font: { bold: true },fill: { fgColor: { rgb: 'ffffff' },border: allBorders }} })
}
// LegendRow.concat(legend)
for (const h of legend) {
    LegendRow.push(h)
}
workSheetRows.push(LegendRow)
let heading = [{ v: `Timesheet(${startDate} to ${endDate})`, t: "s", s: { alignment: { vertical: "center",horizontal:"center" },font: { bold: true,sz: 20 },fill: { fgColor: { rgb: 'ffffff' } },border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: 'thin', color: { rgb: "000000" } },
    right: { style: 'thin', color: { rgb: "000000" } },
} } }];

for(let i=1;i<=columnOrder.length-2;i++){
    if(columnOrder.length-2!=i){
        heading.push({ v: '', t: "s", s: {alignment: { vertical: "center",horizontal:"center" }, font: { bold: true,sz: 20 },fill: { fgColor: { rgb: 'ffffff' } },border: {
             top: { style: 'thin', color: { rgb: "000000" } },
             left: { style: 'thin', color: { rgb: "000000" } },
             bottom: { style: 'thin', color: { rgb: "000000" } },
             right: { style: '', color: { rgb: "000000" } },
         } } })
    }
    else{
        heading.push({ v: '', t: "s", s: {alignment: { vertical: "center",horizontal:"center" }, font: { bold: true,sz: 20 },fill: { fgColor: { rgb: 'ffffff' } },border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } },
        } } })
    }
}
heading.push({ v: '', t: "s", s: {alignment: { vertical: "center",horizontal:"center" }, font: { bold: true,sz: 20 },fill: { fgColor: { rgb: 'ffffff' } },border: {
    top: { style: '', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: '', color: { rgb: "000000" } },
    right: { style: '', color: { rgb: "000000" } },
} } })
workSheetRows.push(heading)// header 
workSheetRows.push([])// giving a line gap
        for (const h of headerDates) {
            let obj = {}
            obj = { v: h, t: "s", s: { font: { bold: true },border: allBorders } }
            headerRow.push(obj);
        }
        workSheetRows.push(headerRow)
        
        //-------------------new code starts---------------
        dataTable.forEach((item) => {
            let tempArr = [];
            columnOrder.forEach((key) => {
                if (key !== "Id" && item.hasOwnProperty(key)) {
                    let value = item[key];
                    let cellObj = {};
                    
                    // Get the status from ExcelData based on the current item's Client, Initiator, and Date
                    let status = this.getStatusFromExcelData(item.Client, item.Initiator, key);
        
                    // Set color based on status
                    let color = "";
                    switch (status) {
                        case StatusType.Submit:
                            color = "fafac5"; // Color for Submitted
                            break;
                        case StatusType.Reject:
                            color = 'f7b5b5'; // Color for Rejected
                            break;
                        case StatusType.Revoke:
                            color = "fae3ea"; // Color for Revoked
                            break;
                        case StatusType.Approved:
                            color ="a9e6fc"// Color for Approved
                            break;
                        default:
                            color = "ffffff"; // Default color
                    }

                    if (wrapColumnsArray.includes(key)) {
                        cellObj = { v: value, t: "s", s: { alignment: { wrapText: true },border: allBorders, font: { bold: false}, fill: { fgColor: { rgb: color }} } };
                    } else {
                        cellObj = { v: value, t: "s", s: {border: allBorders, font: { bold: false,color:'1a1818'}, fill: { fgColor: { rgb: color }}} };
                    }
                    tempArr.push(cellObj);
                }
            });
            workSheetRows.push(tempArr);
        });
        let lastColumn = columnOrder.length-1
        //--------------new codes ends----------------------
        const finalWorkshetData = XLSX.utils.aoa_to_sheet(workSheetRows)
        finalWorkshetData['!autofilter'] = { ref: 'A4:B4' };
        const merge = [
            { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }
          ];
          finalWorkshetData["!merges"] = merge;
        XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);
        // STEP 4: Write Excel file to browser
        XLSX.writeFile(wb, `${filename}(${startDate} to ${endDate}).xlsx`);

    }

    // private generateExcel(dataTable){
    //         const wb = XLSX.utils.book_new();
    //         const workSheetRows = []
    //         let filename ='Timesheet Daily Report'
    //         let wrapColumnsArray  =['Client','Initiator']
    //         let headerRow = []
    //         let columnOrder =[]
    //         // STEP 2: Create data rows and styles
    //         let columns = [
    //             {
    //                 name: "Client Name",
    //                 selector: "Client",
    //             },
    //             {
    //                 name: "Employee Name",
    //                 selector: "Initiator",
    //             },
    //             {
    //                 name: "Date",
    //                 selector: "Date",
    //             },
    //             {
    //                 name: "Hours Worked",
    //                 selector: "Hours",
    //                 sortable: true
    //             },
    //         ]
    //         for (const h of columns) {
    //             let obj = {}

    //                 obj = {v:h.name,t:"s",s:{font: { bold: true},outerWidth:250}}

    //             headerRow.push(obj);
    //         }
    //         for (const c of columns) {
    //             columnOrder.push(c.selector)
    //         }
    //         workSheetRows.push(headerRow)
    //         wrapColumnsArray = wrapColumnsArray==null? []:wrapColumnsArray
    //         dataTable.forEach((item) => {
    //             let tempArr = [];
    //             columnOrder.forEach((key) => { 
    //                 if (key !== "Id" && item.hasOwnProperty(key)) { 
    //                     let value = item[key];
    //                     let cellObj = {}
    //                     if(wrapColumnsArray.includes(key)){
    //                         cellObj= { v: value, t: "s", s: {alignment: { wrapText: true },font: { bold: false },outerWidth:250 } };
    //                     }
    //                     else{
    //                         cellObj= { v: value, t: "s", s: { font: { bold: false } },outerWidth:250 };          
    //                     }
    //                     tempArr.push(cellObj);
    //                 }
    //             });
    //             workSheetRows.push(tempArr);
    //         });

    //     // STEP 3: Create worksheet with rows; Add worksheet to workbook
    //     const finalWorkshetData =   XLSX.utils.aoa_to_sheet(workSheetRows)
    //     finalWorkshetData['!autofilter'] = { ref: 'A1:B1' };
    //     XLSX.utils.book_append_sheet(wb, finalWorkshetData, `${filename}`);

    //     // STEP 4: Write Excel file to browser
    //     XLSX.writeFile(wb, `${filename}.xlsx`);

    // }

    public render() {
        if (!this.state.isPageAccessable) {
            let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            window.location.href = url
        }

        else {
            return (
                <React.Fragment>
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className="title">Timesheet Daily Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="media-m-2 media-p-1">
                                <div className="my-2">
                                    <div className="row pt-2 px-2">
                                        <div className="col-md-3">
                                            <div className="light-text">
                                                <label>Client<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleClientChange}>
                                                    {this.state.isHavingClients ? <option value='All'>All Clients</option> : <option value='None'>None</option>}
                                                    {this.state.ClientsObject.map((option) => (
                                                        <option value={option.Title} selected={option.Title == this.state.ClientName}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
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

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">Start Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divDateofJoining">

                                                    <DatePicker onDatechange={this.handleStartDate} selectedDate={this.state.startDate} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">End Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divDateofJoining">

                                                    <DatePicker onDatechange={this.handleEndDate} selectedDate={this.state.endDate} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                </div>
                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-2" id="">
                                        <button type="button" className="DownloadButtons btn" onClick={this.handleSubmit}>
                                        <FontAwesomeIcon icon={faCloudDownload} className=''></FontAwesomeIcon>Download</button>
                                        {/* <button type="button" className="DownloadButtons btn" onClick={this.Test}>
                                        <FontAwesomeIcon icon={faCloudDownload} className=''></FontAwesomeIcon>Test</button> */}

                                    </div>
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
export default DailyTimesheetReport

// reportData.forEach(report => {
//     let { Initiator, WeekStartDate, TotalHrs, ClientName } = report;
//     const startDate = new Date(WeekStartDate);
//     let startDay = startDate.getDay()
//     TotalHrs = JSON.parse(TotalHrs)
//     Object.keys(TotalHrs).forEach(day => {
//       const dayDate = new Date(startDate);
//       dayDate.setDate(startDate.getDate() + (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day) + 1 - startDate.getDay()) % 7);
//       let formmatedDate = `${dayDate.getMonth() + 1}/${dayDate.getDate()}/${dayDate.getFullYear()}`
//       const obj = {
//         Initiator: Initiator.Title,
//         Client: ClientName,
//         Date: formmatedDate,
//         Hours: TotalHrs[day]
//       };

//       ExcelData.push(obj);
//     });
//   });