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
import { highlightCurrentNav2 } from '../../Utilities/HighlightCurrentComponent';
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
        weekStartDay:'Monday',
        WeeklyData:[],
    }

    public componentDidMount() {
        highlightCurrentNav2("WeeklyTimesheetReport");
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
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true, InitiatorId: '0',weekStartDay:clientEmployees[0].WeekStartDay })
            else {
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false, InitiatorId: '-1',weekStartDay:weekDay })
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
        if (dateprops!= null) {
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
            WeeklyStartDate :{ val: this.state.startDate, required: true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid: "divWeekStartDate" }
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
        console.log(postObject)
        this.getReportData(postObject)
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
        filterQuery += "and Status ne '" + StatusType.Save + "' and Status ne '" + StatusType.Revoke + "'"
        let reportData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterQuery).expand('Initiator').select('Initiator/Title,TotalHrs,BillableSubtotalHrs,NonBillableSubTotalHrs,ClientName,WeekStartDate,Status').orderBy('WeekStartDate,ClientName,Initiator/Title', true).getAll()
        if (reportData.length > 0) {
            let weeklyData = []
            let row = 1;
            reportData.forEach(report => {
                let { Initiator, WeekStartDate, TotalHrs, ClientName, Status } = report;
                const startDate = new Date(WeekStartDate);
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

                let BillHrs = JSON.parse(report.BillableSubtotalHrs)[0]
                let NonBillhrs = JSON.parse(report.NonBillableSubTotalHrs)[0] 
                let Totalhrs = JSON.parse(report.TotalHrs)[0]
                let blanksHrs = {Mon:'',Tue:'',Wed:'',Thu:'',Fri:'',Sat:'',Sun:'',Total:'0'}
                report.ClientName.toLowerCase().includes('synergy')?BillHrs=blanksHrs:NonBillhrs = blanksHrs
                weeklyData.push({
                    SNo: row,
                    Employee:report.Initiator.Title,
                    MNB:NonBillhrs.Mon,
                    MB:BillHrs.Mon,
                    TNB:NonBillhrs.Tue,
                    TB:BillHrs.Tue,
                    WNB:NonBillhrs.Wed,
                    WB:BillHrs.Wed,
                    ThNB:NonBillhrs.Thu,
                    ThB:BillHrs.Thu,
                    FB:BillHrs.Fri,
                    FNB:NonBillhrs.Fri,
                    SB:BillHrs.Sat==""?"0":BillHrs.Sat,
                    SNB:NonBillhrs.Sat==""?"0":NonBillhrs.Sat,
                    SuB:BillHrs.Sun==""?"0":BillHrs.Sun,
                    SuNB:NonBillhrs.Sun==""?"0":NonBillhrs.Sun,
                    Status:this.getStatus(report.Status),
                    TotalNB:NonBillhrs.Total,
                    TotalB:BillHrs.Total,
                    TotalH:Totalhrs.Total,
                })
                row++;
            });
            console.log(weeklyData)
            this.setState({WeeklyData:weeklyData})
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, 'No data found!', 4000);
        }
    }
private downloadExcel(startDate){
    
    const wb = XLSX.utils.book_new();
    let Excelheaders = this.constructExcelHeader()
    let finalData = this.generateExcelData(this.state.WeeklyData,Excelheaders)

        const finalWorkshetData = XLSX.utils.aoa_to_sheet(finalData)
        // finalWorkshetData['!autofilter'] = { ref: 'A7:B7' };
        // mention the range of merge for individual row/item accordingly
        const merge = [
                { s: { r: 1, c: 1 }, e: { r: 1, c: 20 } },
                { s: { r: 2, c: 2 }, e: { r: 2, c: 16 } },
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

        let excelName = 'Weekly Timesheet Report '
        let date = new Date(this.state.startDate)
        let endDate = addDays(new Date(date), 6).toLocaleDateString('en-US');
        let SD = startDate.replaceAll("/","-")
        XLSX.utils.book_append_sheet(wb, finalWorkshetData, `WE ${SD}`);
        // STEP 4: Write Excel file to browser
        XLSX.writeFile(wb, `${excelName}(${startDate} to ${endDate}).xlsx`);

}

private constructTable(weeklyData){
    let date = new Date(this.state.startDate)
    let dateArray = []
    let days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    dateArray.push("Monday "+new Date(this.state.startDate).toLocaleDateString('en-US'))
    for(let i=0;i<6;i++){
        date.setDate(date.getDate()+1)
        dateArray.push(days[i+1]+" "+new Date(date).toLocaleDateString('en-US'))
    }
    return (
        
        <div className='border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2'>
            <div style={{backgroundColor:"#fff"}} className=' txt-center'> <a type="button" id="btnDownloadFile" className="icon-export-b txt-center" onClick={(e) => this.downloadExcel(new Date(this.state.startDate).toLocaleDateString('en-US'))}>
          <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
        </a></div>
    <table className="tblWeeklyTimesheetReport" width="100%">
                <thead>
              <tr className='tr-brd'>
                <th></th>
                <th></th>
                {/* <th className='min-width210'>{dateArray[0]} - {dateArray[dateArray.length-1]}</th> */}
                {dateArray.map((date) =>(
                    <th colSpan={2}  className=''>{date}</th>
                ))}
                <th className=''></th>
                <th className=''></th>
                <th className=''></th>
                <th className=''></th>
              </tr>
              <tr className='tr-brd-2'>
              <th className="text-center">S.NO</th>
                <th>Employee Name</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Non Billable</th>
                <th>Billable</th>
                <th>Total Non Billable</th>
                <th>Total Billable</th>
                <th>Total Hours</th>
                <th className="text-center">Approval Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className='Billable-Salary'>
                <td></td>
                <td></td>
                <td className='text-center' colSpan={14}>{this.state.ClientName.toLowerCase().includes('synergy')?'Billable Salary':'Billable Hourly'}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
             {/*dynamic data */}
             {this.generateTableRows(weeklyData)}
            </tbody>
          </table>
        </div>
      );
}

private generateTableRows(weeklyData) {
    // let statusClass=''
    return weeklyData.map((item, index) => (
        // statusClass= this.getStatusClass(item.Status),
        <tr className='table-data' key={index}>
            <td className='txt-center'>{item.SNo}</td>
            <td className='text-dark'>{item.Employee}</td>
            <td className=''>{item.MNB}</td>
            <td className=''>{item.MB}</td>
            <td className=''>{item.TNB}</td>
            <td className=''>{item.TB}</td>
            <td className=''>{item.WNB}</td>
            <td className=''>{item.WB}</td>
            <td className=''>{item.ThNB}</td>
            <td className=''>{item.ThB}</td>
            <td className=''>{item.FNB}</td>
            <td className=''>{item.FB}</td>
            <td className=''>{item.SNB}</td>
            <td className=''>{item.SB}</td>
            <td className=''>{item.SuNB}</td>
            <td className=''>{item.SuB}</td>
            <td className=''>{item.TotalNB}</td>
            <td className=''>{item.TotalB}</td>
            <td className=''>{item.TotalH}</td>
            <td className='text-center'><span className={this.getStatusClass(item.Status)}>{item.Status}</span></td>
        </tr>
    ));
}

private getStatusClass(Status){
    if(Status == "Submitted"){
        return "span-blue"
    }
    else if(Status == "Approved"){
        return "span-green"
    }
    else if(Status == "Approved by Reporting Manager"){
        return "span-manager-approve"
    }
    else if(Status == "Rejected by Reporting Manager"){
        return "span-rejected"
    }
    else if(Status == "Rejected by Synergy"){
        return "span-rejected"
    }
}
//-------- Modiefied on 6/17/2024 ----------------

// private constructTable(weeklyData){
//         let date = new Date(this.state.startDate)
//         let dateArray = []
//         dateArray.push(new Date(this.state.startDate).toLocaleDateString('en-US'))
//         for(let i=0;i<6;i++){
//             date.setDate(date.getDate()+1)
//             dateArray.push(new Date(date).toLocaleDateString('en-US'))
//         }
//         return (
//             <div className='border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2'>
//         <table className="tblWeeklyTimesheetReport" width="100%">
//                     <thead>
//                   <tr className='WR-LBlue'>
//                     <th></th>
//                     <th colSpan={18} className='fz-20 txt-center'>Synergy Computer Solutions, Inc.</th>
//                     <th style={{backgroundColor:"#fff"}} className=' txt-center'> <a type="button" id="btnDownloadFile" className="icon-export-b txt-center" onClick={(e) => this.downloadExcel(new Date(this.state.startDate).toLocaleDateString('en-US'))}>
//               <FontAwesomeIcon icon={faFileExcel} className='icon-export-b'></FontAwesomeIcon>
//             </a></th>
//                   </tr>
//                   <tr className='WR-LBlue'>
//                     <th></th>
//                     <th className='customTh'>{this.state.ClientName}</th>
//                     <th colSpan={15} className='txt-center fz-15'>Weekly Time sheet</th>
//                     <th></th>
//                     <th></th>
//                     <th></th>
//                   </tr>
//                   <tr className='greyCells'>
//                     <th className='overRidedBlue'></th>
//                     <th className='min-width210'>Week Start - End Date</th>
//                     <th colSpan={2}>Monday</th>
//                     <th colSpan={2}>Tuesday</th>
//                     <th colSpan={2}>Wednesday</th>
//                     <th colSpan={2}>Thursday</th>
//                     <th colSpan={2}>Friday</th>
//                     <th colSpan={2} className='WR-ORWood'>Saturday</th>
//                     <th colSpan={2} className='WR-ORWood'>Sunday</th>
//                     <th></th>
//                     <th></th>
//                     <th></th>
//                     <th></th>
//                   </tr>
//                   <tr>
//                     <th className='WR-LBlue'></th>
//                     <th className='min-width210'>{dateArray[0]} - {dateArray[dateArray.length-1]}</th>
//                     {dateArray.map((date) =>(
//                         <th colSpan={2}  className='lightGreyCells'>{date}</th>
//                     ))}
//                     <th rowSpan={2} className='WR-CRed lightGreyCells'>Total Non Billable</th>
//                     <th rowSpan={2} className='lightGreyCells'>Total Billable</th>
//                     <th rowSpan={2} className='WR-LPurple'>Total Hours</th>
//                     <th rowSpan={2} className='WR-LGreen min-width125'>Approval Status</th>
//                   </tr>
//                   <tr>
//                     <th className='WR-LBlue txt-center'>S.NO</th>
//                     <th>Employee Name</th>
//                     <th className='lightGreyCells'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='lightGreyCells'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='lightGreyCells'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='lightGreyCells'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='lightGreyCells'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='WR-LWood'>Non Billable</th>
//                     <th>Billable</th>
//                     <th className='WR-LWood'>Non Billable</th>
//                     <th>Billable</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td className='WR-LBlue'></td>
//                     <td className='customTh'>{this.state.ClientName.toLowerCase().includes('synergy')?'Billable Salary':'Billable Hourly'}</td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="WR-LWood"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="WR-LWood"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="lightGreyCells"></td>
//                     <td className="WR-LPurple"></td>
//                     <td className="lightGreyCells"></td>
//                   </tr>
//                  {/*dynamic data */}
//                  {this.generateTableRows(weeklyData)}
//                 </tbody>
//               </table>
//             </div>
//           );
// }

// private generateTableRows(weeklyData) {
//     return weeklyData.map((item, index) => (
//         <tr key={index}>
//             <td className='WR-LBlue txt-center'>{item.SNo}</td>
//             <td className=''>{item.Employee}</td>
//             <td className='lightGreyCells'>{item.MNB}</td>
//             <td className=''>{item.MB}</td>
//             <td className='lightGreyCells'>{item.TNB}</td>
//             <td className=''>{item.TB}</td>
//             <td className='lightGreyCells'>{item.WNB}</td>
//             <td className=''>{item.WB}</td>
//             <td className='lightGreyCells'>{item.ThNB}</td>
//             <td className=''>{item.ThB}</td>
//             <td className='lightGreyCells'>{item.FNB}</td>
//             <td className=''>{item.FB}</td>
//             <td className='WR-LWood'>{item.SNB}</td>
//             <td className=''>{item.SB}</td>
//             <td className='WR-LWood'>{item.SuNB}</td>
//             <td className=''>{item.SuB}</td>
//             <td className='WR-CRed'>{item.TotalNB}</td>
//             <td className=''>{item.TotalB}</td>
//             <td className='WR-LPurple'>{item.TotalH}</td>
//             <td className=''>{item.Status}</td>
//         </tr>
//     ));
// }

//-------------- Modified on 6/17/2024 ----------------------

private generateCellStyle(fillColor, isLastRow = false,CellBorders,color='000000',isbold=false) {

    const defaultStyle = { font: { bold: isbold,color: { rgb: color } }, fill: { fgColor: { rgb: fillColor } }, border: CellBorders };
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
            { v: i + 1, t: "s", s: this.generateCellStyle('dbf6ff',false,allBorders) },
            { v: d.Employee, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.MNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow,{}) },
            { v: d.MB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.TNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow,{}) },
            { v: d.TB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.WNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow,{}) },
            { v: d.WB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.ThNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow,{}) },
            { v: d.ThB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.FNB, t: "s", s: this.generateCellStyle('E7E6E6', isLastRow,{}) },
            { v: d.FB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.SNB, t: "s", s: this.generateCellStyle('FCE4D6', isLastRow,{}) },
            { v: d.SB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{}) },
            { v: d.SuNB, t: "s", s: this.generateCellStyle('FCE4D6', isLastRow,{}) },
            { v: d.SuB, t: "s", s: this.generateCellStyle('ffffff', isLastRow,{right: { style: 'thin', color: { rgb: "000000" } }}) },
            { v: d.TotalNB, t: "s", s: isLastRow?{font: { color: { rgb: "FF0000" } },fill: { fgColor: { rgb: 'ffffff' }},border: allBorders  }:this.generateCellStyle('ffffff', isLastRow,{bottom: { style: 'thin', color: { rgb: "000000" } },right: { style: 'thin', color: { rgb: "000000" } }},'FF0000') },
            { v: d.TotalB, t: "s", s: isLastRow?{ font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' }},border: allBorders  }:this.generateCellStyle('ffffff', isLastRow,{bottom: { style: 'thin', color: { rgb: "000000" } },right: { style: 'thin', color: { rgb: "000000" } }}) },
            { v: d.TotalH, t: "s", s: { font: { bold: true }, fill: { fgColor: { rgb: 'D9E1F2' }}, border: allBorders  } },
            { v: d.Status, t: "s", s: isLastRow?{ font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' }},border: allBorders  }:this.generateCellStyle('ffffff', isLastRow,{bottom: { style: 'thin', color: { rgb: "000000" } },right: { style: 'thin', color: { rgb: "000000" } }}) },
            { v: '', t: "s", s: isLastRow?{ font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' }},border: allBorders }:this.generateCellStyle('ffffff', isLastRow,{bottom: { style: 'thin', color: { rgb: "000000" } },right: { style: 'thin', color: { rgb: "000000" } }}) }
        ];
        sheetData.push(rowData);
    }

    return sheetData;
}

    // let lastRow = []
    // for(let i=0;i<21;i++){
    //     lastRow.push({ v: '', t: "s", s: { font: { bold: false }, fill: { fgColor: { rgb: 'ffffff' } },border: {top: { style: 'thin', color: { rgb: "000000" } } }} })
    // }
    // sheetData.push(lastRow)

    private constructExcelHeader(){
         
        let worksheetRows =[]
        worksheetRows.push([])
        let row1=[{
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
        for(let i=0;i<19;i++){
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
        let row2 =[];
         row2=[{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: this.state.ClientName, t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        row2.push({
            v: 'Weekly Time sheet', t: "s", s: {
                alignment: { vertical: "center", horizontal: "center" }, font: { bold: true, sz: 12,color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        for(let i=0;i<18;i++){
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
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
        row2=[];
        row2=[{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: 'Week Start Date - Week End Date ', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'BEBABA' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        let startDate = this.state.startDate
        let days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
        let dates =[]
        dates.push(new Date(startDate).toLocaleDateString('en-US'))
        let date = new Date(startDate)
        for(let i=0;i<6;i++){
            date.setDate(date.getDate()+1)
            dates.push(new Date(date).toLocaleDateString('en-US'))
        }
        for (const day of days) {
            let bgColor = "BEBABA";
            ["Saturday","Sunday"].includes(day)?bgColor="FCE4D6":bgColor//f7ead7
            row2.push({
                v: day, t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        for(let i=0;i<5;i++){// d4cfcf ~ BEBABA
            let bgColor = "BEBABA";
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row2)
        row2 =[]
        row2=[{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: dates[0]+" - "+dates[dates.length-1], t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'ffffff' } }, border: {
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
                    alignment: {wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
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
                    alignment: {wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
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
                    alignment: {wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'D9E1F2' } }, border: {
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
                    alignment: {wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: '609c75' } }, border: {// 2a7042
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
                    alignment: {wrapText: true, vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12, color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            }
        )
        worksheetRows.push(row2)
        row2 =[]
        row2=[{
            v: 'S.No', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        row2.push({
            v: 'Employee Name', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'ffffff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        })
        let data = {
            value : "Non Billable",
            isBold : false,
            bgColor: 'E7E6E6',
            wrapText: true
        }
        for(let i=1;i<=14;i++){
            if(i%2!=0){
                data.value = "Non Billable"
                data.isBold = false
                data.wrapText= true
                if([11,13].includes(i))
                    data.bgColor= 'FCE4D6'
                else
                data.bgColor= 'E7E6E6'
            }
            else{
                data.value = "Billable"
                data.isBold = false
                data.bgColor= 'ffffff'
                data. wrapText= false
            }
            row2.push({
                v:  data.value, t: "s", s: {
                    alignment: { wrapText: data.wrapText, vertical: "center", horizontal: "left" }, font: { bold: data.isBold, sz: 10,color: { rgb: "00000" } }, fill: { fgColor: { rgb: data.bgColor } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
           
        }
        for(let i=0;i<5;i++){
            row2.push({
                v:  '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: data.isBold, sz: 12,color: { rgb: "00000" } }, fill: { fgColor: { rgb: 'E7E6E6' } }, border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }
                }
            })
        }
        worksheetRows.push(row2)
        row2 =[]
        row2=[{
            v: '', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: 'dbf6ff' } }, border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } },
                }
            }
        }]
        if(!this.state.ClientName.toLowerCase().includes('synergy'))
        row2.push({
            v: 'Billable Hourly', t: "s", s: {
                alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {}
            }
        })
        else{
            row2.push({
                v: 'Billable Salary', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: true, sz: 12,color: { rgb: "FF0000" } }, fill: { fgColor: { rgb: 'fafa66' } }, border: {}
                }
            }) 
        }

        for(let i=1;i<20;i++){
            let bgColor = "E7E6E6"
            if(i==17){
                bgColor = "D9E1F2"// dbf6ff
            }
            else if([11,13].includes(i))
                bgColor = 'FCE4D6'
            if(i!=19)
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border: {}
                }
            })
            else
            row2.push({
                v: '', t: "s", s: {
                    alignment: { vertical: "center", horizontal: "left" }, font: { bold: false, sz: 12,color: { rgb: "000000" } }, fill: { fgColor: { rgb: bgColor } }, border:             {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        // left: { style: 'thin', color: { rgb: "000000" } },
                        // bottom: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } },
                    }        
                }
            })
        }
        worksheetRows.push(row2)
        return worksheetRows
    }

    public render() {
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
                        <div className='FormContent-2'>
                            <div className="title">Timesheet Weekly Report
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
                                                    <option value=''>None</option>
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

                                </div>
                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-4" id="">
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
                                        <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div>
                                    {this.state.WeeklyData.length>0?this.constructTable(this.state.WeeklyData):''}
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
export default WeeklyTimesheetReport