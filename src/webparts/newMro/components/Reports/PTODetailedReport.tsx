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
import { Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import * as XLSX from 'xlsx-js-style';
import { faCloudDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import DateUtilities from '../../Utilities/DateUtilities';
import InputCheckBox from '../Shared/InputCheckBox';

export interface PTODetailedReportProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface PTODetailedReportState {
}

class PTODetailedReport extends React.Component<PTODetailedReportProps, PTODetailedReportState> {

    private siteURL: string;
    private client;
    private EmployeeDropdown;
    private startDate;
    private endDate;
    constructor(props: PTODetailedReportProps) {
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
        // EmployeeEmail: '',
        ClientName: "All Clients",
        // ClientName: "",
        EmployeeId: '0',
        startDate: null,
        endDate: null,
        GenerateonlyGranted:false,
        ClientsObject: [],
        EmployeesObj: [],
        AllEmployees: [],
      
        loading: false,
        Homeredirect: false,
        isPageAccessable: true,
        showToaster: false,
        isHavingClients: true,
        isHavingEmployees: true,
        ResultExcelData : [],
        PTOData:[],
        PTOExcelData:[],
    }
    public componentDidMount() {
        highlightCurrentNav("PTODetailedReport");
        document.getElementById("Client").getElementsByTagName('input')[0].focus();
        this.setState({ loading: true });
        this.getOnLoadData()
    }
    private async getOnLoadData() {
        let selectQuery = "Employee/ID,Employee/Title";
        try {
            let [groups, Clients, Employees] = await Promise.all([
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('Client').items.top(5000).select('*').orderBy('Title').getAll(),
                sp.web.lists.getByTitle('Employees').items.top(5000).expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
            ]);
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
                this.setState({ isPageAccessable: true });
            }
            else {
                this.setState({ isPageAccessable: false });
                return false;
            }

            let EmpNames = [];
            let EmpObj = [];
            for (const name of Employees) {
                if (!EmpNames.includes(name.Employee.Title)) {
                    EmpNames.push(name.Employee.Title);
                    EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title });
                }
            }
            EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
            Clients.sort((a, b) => a.Title.localeCompare(b.Title));
            if (Clients.length > 0) {
                Clients.unshift({ Title: "All Clients" });
                EmpObj.unshift({ ID: "0", Title: "All Employees" });
                this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: true, showToaster: true });
            }
            else
                this.setState({ AllEmployees: EmpObj, EmployeesObj: EmpObj, ClientsObject: Clients, loading: false, isHavingClients: false, showToaster: true });
        }
        catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000);
            console.log("Sorry something went wrong! while getting onLoad data", error);
        }
    }
    private handleClientChange = (event,actionMeta?) => {
        this.setState({ loading: true });
        // let { name } = event.target;
        // let value = event.target.value;
        // this.setState({ [name]: value });
        // this.setState({ ReportData: [] });
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
            value =actionMeta.action =='clear'?'': event.value; 
        }
       this.setState({ [name] : value,PTOData: [],PTOExcelData:[] });
       this.getClientEmployees(value);
    }
    private async getClientEmployees(value) {
        try {
            if (value != "All Clients") {
                let selectQuery = "Employee/ID,Employee/Title";
                let filterQuery = "ClientName eq '" + value.replace(/'/g, "''") + "'";
                let clientEmployees = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterQuery).expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
                let EmpNames = [];
                let EmpObj = [];
                for (const name of clientEmployees) {
                    if (!EmpNames.includes(name.Employee.Title)) {
                        EmpNames.push(name.Employee.Title);
                        EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title });
                    }
                }
                EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
                if (EmpObj.length > 0) {
                    EmpObj.unshift({ ID: "0", Title: "All Employees" });
                    this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: true, EmployeeId: '0' });
                }
                else {
                    this.setState({ EmployeesObj: EmpObj, loading: false, isHavingEmployees: false, EmployeeId: '-1' });
                    customToaster('toster-error', ToasterTypes.Error, 'There are no employees associated with this client', 4000);
                }
            }
            else {
                this.setState({ EmployeesObj: this.state.AllEmployees, loading: false, isHavingEmployees: true, EmployeeId: '0' })
            }
        }
        catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000);
            console.log("Sorry something went wrong! while getting Employees of selected client", error);
        }
    }
    private handleChangeEvents = (event,actionMeta?) => {
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
            value =actionMeta.action =='clear'?name =='EmployeeId'?-1:'': event.value; 
        }
        this.setState({ [name]: value,PTOData: [],PTOExcelData:[] });
    }
    private handleStartDate = (dateprops) => {
        // console.log(dateprops)
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
            this.setState({ startDate: date,PTOData: [],PTOExcelData:[] });
        }
        else{
            this.setState({ startDate: null,PTOData: [],PTOExcelData:[] });
        }
    }
    private handleEndDate = (dateprops) => {
        // console.log(dateprops)
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
            this.setState({ endDate: date,PTOData: [],PTOExcelData:[] });
        }
        else{
            this.setState({ endDate: null,PTOData: [],PTOExcelData:[] });
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
            setTimeout(function (){
                // prpel.current.input.classList.add('mandatory-FormContent-focus');
                element.classList.add('mandatory-FormContent-focus');
            },0)
        }
        else if (this.state.endDate == null) {
            isvalid.status = false;
            isvalid.message = 'End Date cannot be blank'
            // let prpel =  this.endDate
            let element = document.getElementById('txtEndDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');

            // prpel.current.input.focus();
            setTimeout(function (){
                element.classList.add('mandatory-FormContent-focus');
            },0)
        }
        else if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
            isvalid.status = false;
            isvalid.message = 'Start Date cannot be greater than End Date'
            let element = document.getElementById('txtStartDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');
            // let prpel =  this.startDate
            // prpel.current.input.focus();
            setTimeout(function (){
                element.classList.add('mandatory-FormContent-focus');
            },0)
        }
        return isvalid;
    }
    private handleCancel = async (e)=>{
        // this.setState({Homeredirect : true,showToaster:false});
        // document.getElementById('divNavReportItems').classList.remove('show');
        // document.getElementById('Reports').classList.remove('heighlightMasters');
        this.setState({ ClientName: "All Clients",EmployeeId: '0',startDate: null, endDate: null,GenerateonlyGranted:false,EmployeesObj:this.state.AllEmployees,PTOData:[],PTOExcelData:[]});
        //this.setState({ ClientName: "",EmployeeId: '0',startDate: null, endDate: null,EmployeesObj:this.state.AllEmployees,PTOData:[],PTOExcelData:[]});
    }
    private handleSubmit = () => {
        this.setState({loading:true});
        let data = {
            Client: { val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.reactSelect, Focusid: 'Client' },
            Employee: { val: parseInt(this.state.EmployeeId), required: true, Name: 'Employee', Type: ControlType.reactSelect, Focusid: 'Employee' },
        }
        let isValid = this.checkIsvalid(data, this.state.startDate, this.state.endDate)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            this.setState({loading:false})
            return false
        }
        let date = new Date(this.state.startDate)
        let selectedStartDate = DateUtilities.getDateMMDDYYYY(date);
        date = new Date(this.state.endDate)
        let selectedEndDate =DateUtilities.getDateMMDDYYYY(date);

        let postObject = {
            Client: this.state.ClientName,
            Employee: parseInt(this.state.EmployeeId),
            StartDate: selectedStartDate,
            EndDate: selectedEndDate,
            GenerateonlyGranted:this.state.GenerateonlyGranted
        }
        this.generateDatatable(postObject);
    }
    private generateDateRange = (startDate,endDate) => {
        const dateRangeArray: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const formattedDate =DateUtilities.getDateMMDDYYYY(date);
            dateRangeArray.push(formattedDate);
        }

        return dateRangeArray;
    };
    private generateDatatable = async (postObject) => {
        let client = postObject.Client
        let Employee = postObject.Employee
        let startDate = postObject.StartDate
        let EndDate = postObject.EndDate
        // let prevDate = addDays(new Date(startDate), -7);
        let prevDate = addDays(new Date(startDate), -1);
        let nextDate = addDays(new Date(EndDate), 1);
        let prev = DateUtilities.getDateMMDDYYYY(prevDate);
        let next = DateUtilities.getDateMMDDYYYY(nextDate);
        var Data = [];
        var ExcelData = [];
        let filterQuery = '';
        if (client =="All Clients") {
            if (Employee == 0) {
                filterQuery = "PostedOn gt '" + prev + "' and PostedOn lt '" + next + "' and IsActive eq 1";
            }
            else {
                filterQuery = "EmployeeId eq '" + Employee + "' and PostedOn gt '" + prev + "' and PostedOn lt '" + next + "' and IsActive eq 1";
            }
        }
        else {
            if (Employee == 0) {
                filterQuery = "ClientName eq'" + client.replace(/'/g, "''") + "' and PostedOn gt '" + prev + "' and PostedOn lt '" + next + "' and IsActive eq 1";
            }
            else {
                filterQuery = "ClientName eq'" + client.replace(/'/g, "''") + "' and EmployeeId eq '" + Employee + "' and PostedOn gt '" + prev + "' and PostedOn lt '" + next + "' and IsActive eq 1";
            }
        }
        if(postObject.GenerateonlyGranted)
        filterQuery += " and TransactionType eq 'Granted'"; 
        else
        filterQuery += " and TransactionType ne 'Granted' and TransactionType ne 'Deducted'"; 
        try{
            let reportData = await sp.web.lists.getByTitle('PTOTransactions').items.top(5000).filter(filterQuery).expand('Employee').select('Employee/Title,Employee/Id,ClientName,*').orderBy('ClientName,Employee/Title', true).getAll();
            //Below is to filter exact date range.. Records , Due to DST, inaccurate rocords will fetched from above query.
            reportData = reportData.filter(item=>new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.PostedOn))>=new Date(startDate) && new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.PostedOn))<=new Date(EndDate));
            if (reportData.length > 0) {
                //Sorted to get latest modified records first
                reportData.sort((a, b) => {
                    const dateA = new Date(a.PostedOn).getTime();
                    const dateB = new Date(b.PostedOn).getTime();
                    return dateB-dateA;
                });
                Data = [];
                ExcelData = [];
                reportData.forEach(item => {
                    let PostedOn = new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.PostedOn));
                    let SubmittedDate =[null,undefined,''].includes(item.SubmittedDate)? new Date():new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.SubmittedDate));
                    let From =[null,undefined,''].includes(item.From)? new Date():new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.From));
                    let To =[null,undefined,''].includes(item.To)? new Date(): new Date(DateUtilities.GetDateMMDDYYYYAsInList(item.To));
                    let isTimeOffEmployee=this.getIsTimeOffEmployee( item.Employee.Id);
                    let TimeOffTypesFromList=[null,undefined,''].includes(item.TimeOffTypes)?[]:JSON.parse(item.TimeOffTypes),TimeOffTypes = '',ExcelTimeOffTypes = '';
                        TimeOffTypesFromList.forEach(type => {
                            TimeOffTypes+=`<div>${type}</div>`;
                            ExcelTimeOffTypes+=type+'\n';
                        });
                    Data.push({
                        Id: item.Id,
                        ClientName:item.ClientName,
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
                        PTOHours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(parseFloat(item.Hours).toFixed(4)),
                        PreviousPTOBalance:[null, undefined, ''].includes(item.PreviousPTOBalance) ? 0.00 : parseFloat(parseFloat(item.PreviousPTOBalance).toFixed(4)),
                        CurrentPTOBalance:[null, undefined, ''].includes(item.CurrentPTOBalance) ? 0.00 : parseFloat(parseFloat(item.CurrentPTOBalance).toFixed(4)),
                        Reason: item.Reason,
                    })
                    ExcelData.push({
                        Id: item.Id,
                        ClientName:[null, undefined, ''].includes(item.ClientName) ? '' :item.ClientName,
                        Employee: item.Employee.Title,
                        TransactionType: this.getStatus(item.TransactionType,isTimeOffEmployee),
                        TimeOffTypes:ExcelTimeOffTypes,
                        PostedOn : ['granted','deducted'].includes(item.TransactionType.toLowerCase())?'':DateUtilities.getDateMMDDYYYY(PostedOn),
                        SubmittedDate :['granted','deducted'].includes(item.TransactionType.toLowerCase())?DateUtilities.getDateMMDDYYYY(PostedOn):[null,undefined,''].includes(item.SubmittedDate)?'':DateUtilities.getDateMMDDYYYY(SubmittedDate),
                        From : [null,undefined,''].includes(item.From)? '-':DateUtilities.getDateMMDDYYYY(From),
                        To : [null,undefined,''].includes(item.To)? '-':DateUtilities.getDateMMDDYYYY(To),
                        PTOHours: [null, undefined, ''].includes(item.Hours) ? 0.00 : parseFloat(parseFloat(item.Hours).toFixed(4)),
                        PreviousPTOBalance:[null, undefined, ''].includes(item.PreviousPTOBalance) ? 0.00 : parseFloat(parseFloat(item.PreviousPTOBalance).toFixed(4)),
                        CurrentPTOBalance:[null, undefined, ''].includes(item.CurrentPTOBalance) ? 0.00 : parseFloat(parseFloat(item.CurrentPTOBalance).toFixed(4)),
                        Reason: [null, undefined, ''].includes(item.Reason) ? '' :item.Reason,
                    })
                }
                )
               this.setState({PTOData:Data,PTOExcelData:ExcelData,loading:false});
            }
            else {
                customToaster('toster-error', ToasterTypes.Error, 'No data found!', 4000);
                this.setState({loading:false})
            }
        }
        catch (error) {
            customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000);
            console.log("Sorry something went wrong! while getting PTO transactions data", error);
        }
    }
    private getIsTimeOffEmployee = async (EmployeeId)=>
    {
        let EmpGroups= await sp.web.getUserById(EmployeeId).groups();
        let isTimeOffEmployee = EmpGroups.some(Grp=>Grp.Title=='Time Off Members');
        return isTimeOffEmployee;
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
    private getcurrWeekSunDay=()=>{
        let date=new Date();
        if(new Date(date).getDay() === 0){
          return new Date(date)
        }
        else{
          return addDays(new Date(),7-(new Date().getDay()));
        }
    }
    public render() {
        let columns = [
            {
                name: "Client Name",
                selector: (row, i) => row.ClientName,
                // width: '230px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.Employee,
                // width: '230px',
                sortable: true
            },
            {
                name: "Transaction Status",
                selector: (row, i) => row.TransactionType,
                // width: '230px',
                sortable: true
            },
            {
                name: "Time Off Type",
                selector: (row, i) => row.TimeOffTypesForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.TimeOffTypesForGrid }}/>,
                // width: '200px',
                sortable: true
              },
            {
                name: "Time Off Date",
                selector: (row, i) => row.PostedOnForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.PostedOnForGrid }}/>,
                // width: '200px',
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
            //     name: "From",
            //     selector: (row, i) => row.FromForGrid,
            //     cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.FromForGrid }}/>,
            //     width: '150px',
            //    sortable: true
            //   },
            //   {
            //       name: "To",
            //       selector: (row, i) => row.ToForGrid,
            //       cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.ToForGrid }}/>,
            //      width: '150px',
            //       sortable: true
            //  },
            {
                name: "Previous PTO Balance",
                selector: (row, i) => row.PreviousPTOBalance,
                // width: '200px',
                sortable: true
            },
            {
                name: "Applied PTO Hours",
                selector: (row, i) => row.PTOHours,
                // width: '200px',
                sortable: true
            },
            {
                name: "Current PTO Balance",
                selector: (row, i) => row.CurrentPTOBalance,
                // width: '200px',
                sortable: true
            },
            {
                name: "Reason",
                selector: (row, i) => row.Reason,
                sortable: true,
            },
        ];
        let Exportcolumns = [
            {
                name: "Client Name",
                selector: "ClientName",
                width: '230px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector:  "Employee",
                width: '230px',
                sortable: true
            },
            {
                name: "Transaction Status",
                selector: "TransactionType",
                width: '230px',
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
                sortable: true
            },
            {
                name: "Submitted Date",
                selector: "SubmittedDate",
                sortable: true
            },
            // {
            //     name: "From",
            //     selector: "From",
            //     sortable: true
            // },
            // {
            //   name: "To",
            //   selector: "To",
            //   sortable: true
            // },
            {
                name: "Previous PTO Balance",
                selector: "PreviousPTOBalance",
                width: '200px',
                sortable: true
            },
            {
                name: "Applied PTO Hours",
                selector: "PTOHours",
                sortable: true
            },
            {
                name: "Current PTO Balance",
                selector: "CurrentPTOBalance",
                width: '200px',
                sortable: true
            },
            {
                name: "Reason",
                selector: "Reason",
                sortable: true,
            }
        ];
        const searchKeys=['ClientName','Employee','TransactionType','TimeOffTypes','PostedOn','SubmittedDate','Form','To','PreviousPTOBalance','PTOHours','CurrentPTOBalance','Reason'];
          //if generate only granted: Client Name,TimeOffType,TimeOffDate fields are always empty.
          if(this.state.GenerateonlyGranted)            
          {
            columns.splice(0,1);
            columns.splice(2,2);
            Exportcolumns.splice(0,1);
            Exportcolumns.splice(2,2);
          }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL+"/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        if (this.state.Homeredirect) {
             let url = `/Dashboard/`
             return (<Navigate to={url}/>);
         }
        else {
            return (
                <React.Fragment>
                    <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className="title">PTO Detailed Report
                                <div className='mandatory-note'>
                                    <span className='mandatoryhastrick'>*</span> indicates a required field
                                </div>
                            </div>
                            <div className="after-title"></div>
                            <div className="media-m-2 media-p-1">
                <div className="my-2">
                                    <div className="row pt-2 px-2">
                                        {/* <div className="col-md-3">
                                            <div className="light-text">
                                                <label>Client<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleClientChange}>
                                                    {this.state.isHavingClients ? <option value="All Clients">All Clients</option> : <option value='None'>None</option>}
                                                    {this.state.ClientsObject.map((option) => (
                                                        <option value={option.Title} selected={option.Title == this.state.ClientName}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="custom-dropdown">
                                                <SearchableDropdown label="Client" Title="Client" name="ClientName" id="Client" placeholderText="Select Client" className="" selectedValue={this.state.ClientName} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.ClientsObject} onChange={(selectedOption, actionMeta) => { this.handleClientChange(selectedOption, actionMeta) }} isRequired={true} refElement={this.client} noOptionsMessage="No Client"></SearchableDropdown>
                                            </div>
                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="light-text ">
                                                <label>Employee<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="InitiatorId" title="Employee" onChange={this.handleChangeEvents} ref={this.EmployeeDropdown}>
                                                    {this.state.isHavingEmployees ? <option value='0'>All Employees</option> : <option value='-1'>None</option>}
                                                    {this.state.EmployeesObj.map((option) => (
                                                        <option value={option.ID} selected={this.state.InitiatorId == option.ID}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div> */}

                                        <div className="col-md-3">
                                            <div className="custom-dropdown">
                                                <SearchableDropdown label="Employee" Title="Employee" name="EmployeeId" id="Employee" placeholderText="Select Employee" className="" selectedValue={this.state.EmployeeId} optionLabel={'Title'} optionValue={'ID'} OptionsList={this.state.EmployeesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} isRequired={true} refElement={this.EmployeeDropdown} noOptionsMessage="No Employee"></SearchableDropdown>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">Start Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divStartDate">

                                                    <DatePicker onDatechange={this.handleStartDate} selectedDate={this.state.startDate} ref={this.startDate} endDate={new Date()} placeholderText='MM/DD/YYYY' id={'txtStartDate'} title={"Start Date"}/>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">End Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divEndDate">

                                                    <DatePicker onDatechange={this.handleEndDate} ref={this.endDate} endDate={this.getcurrWeekSunDay()} selectedDate={this.state.endDate} id={'txtEndDate'} title={"End Date"}/>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="row pt-2 px-2">
                                        <div className="col-md-3">
                                                <div className="light-text">
                                                    <InputCheckBox
                                                        label={"Generate only Granted?"}
                                                        name={"GenerateonlyGranted"}
                                                        checked={this.state.GenerateonlyGranted}
                                                        onChange={this.handleChangeEvents}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        id='chkGenerateonlyGranted'
                                                    />
                                                </div>
                                            </div>
                                    </div>
                                </div>
                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-4" id="">
                                        {/* <button type="button" className="DownloadButtons btn" onClick={this.handleSubmit}>
                                        <FontAwesomeIcon icon={faCloudDownload} className=''></FontAwesomeIcon>Download</button> */}
                                        {/* <button type="button" className="ReportCancelButtons btn" onClick={this.handleCancel}>Cancel</button> */}
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit} title='Search'>Search</button>
                                        <button type="button" className="CancelButtons btn" onClick={this.handleCancel} title='Clear'>Clear</button>
                                    </div>
                                </div>
                                {this.state.PTOData.length>0 && <div className='c-v-table table-head-1st-td dataTables_wrapper-overflow'>
                                    <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.PTOData} fileName={'Employee(s) PTO Detailed Report'} showExportExcel={this.state.PTOData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.PTOExcelData} wrapColumns={['Employee','TimeOffTypes']} LargeWidthColumns={["ClientName","Employee","Reason"]} paginationPerPage={25}></TableGenerator>
                                </div>}
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
export default PTODetailedReport;