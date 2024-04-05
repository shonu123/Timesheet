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
export interface TimesheetReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface TimesheetReportState {
}

class TimesheetReport extends React.Component<TimesheetReportProps, TimesheetReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    constructor(props: TimesheetReportProps) {
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
    }

    public componentDidMount() {
        highlightCurrentNav("TimesheetReport");
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
            this.setState({AllEmployees: EmpObj,EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: true, showToaster: true })
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
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true,InitiatorId:'0' })
            else {
                this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false,InitiatorId:'-1' })
                customToaster('toster-error', ToasterTypes.Error, 'There are no employees associated with this client', 4000);
            }
        }
        else {
            this.setState({ EmployeesObj: this.state.AllEmployees, loading: false, isHavingEmployees: true,InitiatorId:'0'})
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
    private checkIsvalid =(data,selectedStartDate,selectedEndDate)=>{
        let isvalid = {
            status:true,
            message:''
        }
        let isValid = Formvalidator.checkValidations(data)
        if(!isValid.status){
            isvalid.status = false;
            isvalid.message = isValid.message
        }
        else if(this.state.startDate==null){
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be blank'
        }
        else if(this.state.endDate==null){
            isvalid.status = false;
            isvalid.message = 'End Date cannot be blank'
        }
        else if(new Date(selectedStartDate)>new Date(selectedEndDate)){
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be greater than End Date'
        }
        return isvalid;
    }
    private handleSubmit = ()=>{
        let data ={
            Client:{val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.string,Focusid:this.client},
            Employee:{val: parseInt(this.state.InitiatorId), required: true, Name: 'Employee', Type: ControlType.number,Focusid:this.EmployeeDropdown},
        }
        let isValid = this.checkIsvalid(data,this.state.startDate,this.state.endDate)
        if(!isValid.status){
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            return false
        }
        let date = new Date(this.state.startDate)
        let selectedStartDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        date = new Date(this.state.endDate)
        let selectedEndDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

        let postObject={
            Client:this.state.ClientName,
            Employee:parseInt(this.state.InitiatorId),
            StartDate: selectedStartDate,
            EndDate:selectedEndDate
        }
        console.log(postObject)
        this.generateExcel(postObject)
    }

    private  generateExcel = async (postObject)=>{
        let client = postObject.Client
        let Employee = postObject.Employee
        let startDate = postObject.StartDate
        let EndDate = postObject.EndDate
        let prevDate = addDays(new Date(startDate), -7);
        let nextDate = addDays(new Date(EndDate), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
         let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`

        let filterQuery=''
        if(client=="All"){
            if(Employee==0){
                filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" +next+ "'"
            }
            else{
                filterQuery = "InitiatorId eq '"+Employee+"' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" +next+ "'"
            }
        }
        else{
            if(Employee==0){
                filterQuery = "ClientName eq'"+client+"' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" +next+ "'"
            }
            else{
                filterQuery = "ClientName eq'"+client+"' and InitiatorId eq '"+Employee+"' and WeekStartDate gt '" + prev + "' and WeekStartDate lt '" +next+ "'"
            }
        }
        let reportData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).expand('Initiator').select('Initiator/Title,TotalHrs,ClientName,WeekStartDate').orderBy('WeekStartDate,ClientName,Initiator/Title', true).getAll()
        if(reportData.length>0){
            console.log(reportData) 
            let ExcelData =[]
            reportData.forEach(report => {
                let { Initiator, WeekStartDate, TotalHrs, ClientName } = report;
                const startDate = new Date(WeekStartDate);
                let startDay = startDate.getDay()

                let  weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
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
                    let obj= {
                        Initiator: '',
                            Client: '',
                            Date: '',
                            Hours:''
                    };
                     obj.Initiator= Initiator.Title,
                     obj.Client= ClientName,
                     obj.Date= d,
                     obj.Hours=arrangedWeekDays[new Date(d).getDay()]
                    ExcelData.push(obj);
                }
           
                // Object.keys(TotalHrs).forEach(day => {
                //   const dayDate = new Date(startDate);
                //   dayDate.setDate(startDate.getDate() + (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day) + 1 - startDate.getDay()) % 7);
                //   let formmatedDate = `${dayDate.getMonth() + 1}/${dayDate.getDate()}/${dayDate.getFullYear()}`
                //   const obj = {
                //     Initiator: Initiator.Title,
                //     Client: ClientName,
                //     Date: formmatedDate,
                //     Hours: TotalHrs[day]
                //   };
           
                //   ExcelData.push(obj);
                // });
              });
              console.log(ExcelData)
        }
        else{
            customToaster('toster-error', ToasterTypes.Error,'No data found!', 4000);
        }


    }

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
                            <div className="title">Timesheet Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="media-m-2 media-p-1">
                                <div className="my-2">
                                    <div className="row pt-2 px-2">
                                        <div className="col-md-4">
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
                                        <div className="col-md-4">
                                            <div className="light-text ">
                                                <label>Employee<span className="mandatoryhastrick">*</span></label>
                                                <select className="ddlEmployee ddlClient" required={true} name="InitiatorId" title="Employee" onChange={this.handleChangeEvents} ref={this.EmployeeDropdown}>
                                                    {this.state.isHavingEmployees ? <option value='0'>All Employees</option> : <option value='-1'>None</option>}
                                                    {this.state.EmployeesObj.map((option) => (
                                                        <option value={option.ID} selected={this.state.InitiatorId == option.ID}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">Start Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divDateofJoining">

                                                    <DatePicker onDatechange={this.handleStartDate} selectedDate={this.state.startDate} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
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
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Download Excel</button>
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
export default TimesheetReport

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