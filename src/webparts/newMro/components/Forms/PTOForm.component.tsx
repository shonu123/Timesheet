import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
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
import InputCheckBox from '../Shared/InputCheckBox';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import InputText from '../Shared/InputText';
import { addDays } from 'office-ui-fabric-react';
export interface PTOFormProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface PTOFormState {
}

class PTOForm extends React.Component<PTOFormProps, PTOFormState> {

    private siteURL: string;
    private sitecollectionURL: string;
    private ItemID = "";
    private client;
    private From;
    private To;
    private EmployeeType;
    private PTOType;
    private TotalHours;
    private Comments;
    constructor(props: PTOFormProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        this.From = React.createRef();
        this.To = React.createRef();
        this.EmployeeType = React.createRef();
        this.PTOType = React.createRef();
        this.TotalHours = React.createRef();
        this.Comments = React.createRef();
    }

    public state = {
        ItemID: 0,
        EmployeeId: this.props.spContext.userId,
        ClientsObject: [],
        selectedClient: '',
        fetchedClient: '',
        fetchedFromDate: null,
        fetchedToDate: null,
        EmployeeObj: [],
        HolidayDates: [],
        EmployeeHolidayType: '',
        EmployeeName: this.props.spContext.userDisplayName,
        ReportingManagerId: { results: [] },
        FromDate: new Date(),
        ToDate: new Date(),
        TotalHours: '',
        Comments: '',
        EmployeeType: '',
        PTOTypesObj: [],
        SelectedPTO: '',
        CommentsHistory: [],
        PTOObj: {
            SalariedEmployees: ["PTO Vacation (PTOV)", "PTO Sick (PTOS)", "Unpaid Time off (UPTO)", "Floating Holiday (FH)", "Family Medical (FMLA)", "Other Leave (OL)", "Bereavement/Jury Duty (BV/JD)", "PTO Cash Out* (TERM)"],
            HourlyEmployee: ["Unpaid Time off (UPTO)", "Family Medical (FMLA)", "Bereavement/Jury Duty (BV/JD)", "Other Leave (OL)"]
        },
        loading: false,
        userGroups:[],
        errorMessage: '',
        EmployeeEmail: this.props.spContext.userEmail,
        ReportingManagerEmails: [],
        Homeredirect: false,
        isRecordAcessable: true,
        showHideModal: false,
        modalTitle: '',
        modalText: '',
        message: "Success",
        showToaster: false,
        isDisabled: false,
        Status: '',
        PendingWith: "",
        IsSubmitted: false,
        DateOfJoining:'',
        ButtonsVisibility: {
            Submit: true,
            Withdraw: false,
            Approve: false,
            Reject: false,
            Revoke: false
        },
    }

    public componentDidMount() {
        highlightCurrentNav("PTOForm");
        this.setState({ loading: true });
        this.getOnLoadData();
    }

    private async getOnLoadData() {
        let userID = this.props.spContext.userId
        let filterQuery = "Employee/Id eq '" + userID + "' and  IsActive eq '1'"
        let Year = new Date().getFullYear() + "";
        let selectQuery = "Employee/Title,Employee/ID,Employee/EMail,ReportingManager/ID,ReportingManager/Title,ReportingManager/EMail,*"
        let [groups, Employee, Holidays] = await Promise.all([
            // sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get(),
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterQuery).expand("Employee,ReportingManager").select(selectQuery).get(),
            sp.web.lists.getByTitle('HolidaysList').items.top(2000).filter("Year eq '" + Year + "'").select('*').orderBy('ClientName').get(),
        ])
        let clientSelected = ''
        if (Employee.length && Employee.length < 2) {
            clientSelected = Employee[0].ClientName;
            let ReportingManagers = { results: [] }
            let Emails = []
            if (Employee[0].ReportingManager.length > 0) {
                for (const user of Employee[0].ReportingManager) {
                    ReportingManagers.results.push(user.ID)
                    Emails.push(user.EMail)
                }
            }
            this.setState({ ReportingManagerId: ReportingManagers, ReportingManagerEmails: Emails });
        }
        let clients = []
        for (const client of Employee) {
            clients.push(client.ClientName)
        }

        // let EmployeeHolidays = Holidays.filter(day=>{ if(day.ClientName==Employee[0].HolidayType) return new Date(day.HolidayDate).toLocaleDateString('en-US')})
        let EmployeeHolidayDates = Holidays.filter(day => {
            if (day.ClientName == Employee[0].HolidayType) {
                return true;
            }
        }).map(day => new Date(day.HolidayDate).toLocaleDateString('en-US'));
        // let HolidayDates =[]
        // for (const h of EmployeeHolidays) {
        //     HolidayDates.push(new Date(h.HolidayDate)) 
        // }

        this.setState({ showToaster: true })
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if (this.props.match.params.id != undefined) {
            let ItemID = this.props.match.params.id
            this.getData(ItemID,userGroups, EmployeeHolidayDates)
        }
        else {
            this.setState({ ClientsObject: clients, EmployeeObj: Employee, selectedClient: clientSelected, HolidayDates: EmployeeHolidayDates, loading: false })
        }
    }

    // this function is used to get data from the employee master of Edit record
    private async getData(ID,userGroups, Holidays) {
        let filterQuery = "ID eq '" + ID + "'"
        let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,ReportingManager/ID,ReportingManager/EMail,*"

    let data = await sp.web.lists.getByTitle('PTO').items.filter(filterQuery).select(selectQuery).expand('Employee,ReportingManager').get()
       
        let filterQuery2 = "Employee/Id eq '" + data[0].Employee.ID + "'"
        let selectQuery2 = "Employee/Title,Employee/ID,Employee/EMail,ReportingManager/ID,ReportingManager/Title,ReportingManager/EMail,*"
        if (data.length < 1) {
            this.setState({message:'Invalid',Homeredirect:true})
            return false;
        }
        let EmployeeData = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterQuery2).expand("Employee,ReportingManager").select(selectQuery2).get()
        let Clients = []
        // if()
            let isApproved = false;
        for (const s of data[0].CommentsHistory) {
            if(s.Action==StatusType.Approved){
                isApproved = false;
                break;
            }
        }
            let ActiveClients = EmployeeData.filter(employee => { if (employee.IsActive) return employee })
                if(isApproved){
                    for (const client of EmployeeData) {
                        Clients.push(client.ClientName)
                    }
                }
                else{
                    for (const client of ActiveClients) {
                        Clients.push(client.ClientName)
                    }
                }
        let ReportingManagers = { results: [] }
        let Emails = []
        if (data[0].ReportingManager.length > 0) {
            for (const user of data[0].ReportingManager) {
                ReportingManagers.results.push(user.ID)
                Emails.push(user.EMail)
            }
        }
        let EmployeeEmail = data[0].Employee.EMail
        this.userAccessableRecord(userGroups, EmployeeEmail, Emails)
        let result = this.buttonsVisibility(data[0].Status, data[0].Employee.ID, ReportingManagers, userGroups)
        let PTOTypes = data[0].EmployeeType == "Salaried Employee" ? this.state.PTOObj.SalariedEmployees : this.state.PTOObj.HourlyEmployee
        this.setState({
            EmployeeId: data[0].Employee.ID,
            EmployeeName: data[0].Employee.Title,
            EmployeeEmail: EmployeeEmail,
            EmployeeObj: EmployeeData,
            ClientsObject: Clients,
            selectedClient: data[0].Client,
            fetchedClient: data[0].Client,
            EmployeeType: data[0].EmployeeType,
            SelectedPTO: data[0].PTOType,
            PTOTypesObj: PTOTypes,
            FromDate: new Date(data[0].From),
            fetchedFromDate: new Date(data[0].From),
            ToDate: new Date(data[0].To),
            fetchedToDate: new Date(data[0].To),
            TotalHours: data[0].TotalHours,
            CommentsHistory: JSON.parse(data[0].CommentsHistory),
            ReportingManagerId: ReportingManagers,
            HolidayDates: Holidays,
            loading: false,
            Status: data[0].Status,
            ButtonsVisibility: result.visibility,
            isDisabled: result.isDisabled,
            ReportingManagerEmails: Emails,
            IsSubmitted: data[0].IsSubmitted,
            ItemID: parseInt(ID),
            Comments:'',
            DateOfJoining: new Date(data[0].DateOfJoining).toLocaleDateString('en-US'),
            userGroups: userGroups,
        })
    }

    private buttonsVisibility(Status, EmployeeID, Managers, userGroups) {
        let result = { visibility: {}, isDisabled: false }
        let loginUserID = this.props.spContext.userId
        let isHR = userGroups.includes('Timesheet HR')
        let ButtonsVisibility = { ...this.state.ButtonsVisibility }
        if (Status == StatusType.Withdraw) {
            result.isDisabled = true
            ButtonsVisibility.Submit = false
        }
        else if (Status == StatusType.Submit) {
            result.isDisabled = true
            ButtonsVisibility.Submit = false
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Withdraw = true
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Approve = true
                ButtonsVisibility.Reject = true
            }
            // else if(isHR){
            //     ButtonsVisibility.Submit = false
            // }
        }
        else if (Status == StatusType.ManagerApprove) {
            result.isDisabled = true
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = false
                ButtonsVisibility.Revoke = true
                if (isHR) {
                    ButtonsVisibility.Approve = true
                    ButtonsVisibility.Reject = true
                }
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false
            }
            else if (isHR) {
                ButtonsVisibility.Approve = true
                ButtonsVisibility.Reject = true
            }
        }
        else if (Status == StatusType.ManagerReject) {
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
        }
        else if (Status == StatusType.Revoke) {
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true
                ButtonsVisibility.Approve = false
                ButtonsVisibility.Reject = false
                ButtonsVisibility.Revoke = false
                ButtonsVisibility.Withdraw = false
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
        }
        else if (Status == StatusType.Approved) {
            result.isDisabled = true
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = false
                ButtonsVisibility.Revoke = true
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false
            }
        }
        else if (Status == StatusType.Reject) {
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true
            }
            else if (Managers.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false
                result.isDisabled = true
            }
        }
        result.visibility = ButtonsVisibility
        return result;
    }

    private checkIsValidDateRange(FromDate, ToDate, HolidayDates) {

        let isValid = { status: true, message: "" };

        let currentDate = new Date(FromDate).toLocaleDateString('en-US');
        const endDate = new Date(ToDate).toLocaleDateString('en-US');

        while (new Date(currentDate) <= new Date(endDate)) {

            if (new Date(currentDate).getDay() === 0 || new Date(currentDate).getDay() === 6 || HolidayDates.includes(new Date(currentDate).toLocaleDateString('en-US'))) {
                isValid.status = false;
                isValid.message = "Date range includes either a Saturday or Sunday, or holiday.";
                break;
            }
            let nextDate = addDays(new Date(currentDate), 1)
            currentDate = nextDate.toLocaleDateString('en-US')
        }
        return isValid;
    }

    private handleActions = (e) => {
        console.log(e.target.id)
        let ActionID = e.target.id
        this.validateStatusBeforeAction(this.state.ItemID, ActionID, this.state.Status, this.state.Comments, this.state.CommentsHistory)
    }

    private async validateStatusBeforeAction(ID, ActionID, Status, Comments, commentsObj) {
        let filterQuery = "ID eq '" + ID + "'"
        let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,ReportingManager/ID,ReportingManager/EMail,*"
        let data = await sp.web.lists.getByTitle('PTO').items.filter(filterQuery).select(selectQuery).expand('Employee,ReportingManager').get()
        if (Status != data[0].Status) {
            // customToaster('toster-error', ToasterTypes.Error, "Attention: This PTO has been modified. Please review the changes.", 4000);
            this.setState({ loading: false, message: 'Success-'+StatusType.RecordModified, Homeredirect: true })
            // this.setState({message:'RecordModified',Homeredirect:true})
            return false
        }
        let postObject, ActionStatus = '';
        let isHR = this.state.userGroups.includes('Timesheet HR')
        if (ActionID == "btnApprove") {
            if (this.state.Status == StatusType.Submit) {
                commentsObj.push({
                    Action: StatusType.Approved,
                    Role: 'Reporting Manager',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                if(isHR){
                    postObject = {
                        CommentsHistory: JSON.stringify(commentsObj),
                        Status: StatusType.Approved,
                        PendingWith: "NA",
                    }
                    ActionStatus = StatusType.Approved 
                }
                else{
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.ManagerApprove,
                    PendingWith: "HR",
                }
                ActionStatus = StatusType.ManagerApprove
            }
            }
            else {
                commentsObj.push({
                    Action: StatusType.Approved,
                    Role: 'HR',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.Approved,
                    PendingWith: "NA",
                }
                ActionStatus = StatusType.Approved
            }
            this.generateEmailData(postObject, ActionStatus)

        }
        else if (ActionID == "btnReject") {
            let isValid = this.checkMandatoryComments(Comments)
            if (!isValid) {
                return false
            }
            if (this.state.Status == StatusType.Submit) {
                commentsObj.push({
                    Action: StatusType.Reject,
                    Role: 'Reporting Manager',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.ManagerReject,
                    PendingWith: "Initiator",
                }
                ActionStatus=StatusType.ManagerReject
            }
            else {
                commentsObj.push({
                    Action: StatusType.Reject,
                    Role: 'HR',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.HRReject,
                    PendingWith: "Initiator",
                }
                ActionStatus=StatusType.HRReject
            }            // this.InsertorUpdatedata(postObject, '');
            this.generateEmailData(postObject,ActionStatus)

        }
        else if (ActionID == "btnRevoke") {
            let isValid = this.checkMandatoryComments(Comments)
            if (!isValid) {
                return false
            }
            commentsObj.push({
                Action: StatusType.Revoke,
                Role: 'Initiator',
                User: this.props.spContext.userDisplayName,
                Comments: Comments,
                Date: new Date().toISOString()
            })
            let postObject = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Revoke,
                PendingWith: "Initiator",
            }
            ActionStatus=StatusType.Revoke
            this.generateEmailData(postObject,ActionStatus)
        }
        else if (ActionID == "btnWithdraw") {
            let isValid = this.checkMandatoryComments(Comments)
            if (!isValid) {
                return false
            }
            commentsObj.push({
                Action: StatusType.Withdraw,
                Role: 'Initiator',
                User: this.props.spContext.userDisplayName,
                Comments: Comments,
                Date: new Date().toISOString()
            })
            let postObject = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Withdraw,
                PendingWith: "NA",
            }
            ActionStatus = StatusType.Withdraw
            this.generateEmailData(postObject,ActionStatus)
        }

    }

    private userAccessableRecord(userGroups, EmployeeEmail, ManagerEmails) {
        let currentUserEmail = this.props.spContext.userEmail;
        let userEmail = EmployeeEmail;
        let ApproverEmails = ManagerEmails;
        let isAccessable = false;
        if (userEmail.includes(currentUserEmail) || ApproverEmails.includes(currentUserEmail) || userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins') || userGroups.includes('Timesheet HR')) {
            isAccessable = true
            this.setState({ isRecordAcessable: isAccessable })
        }
    }

    private checkMandatoryComments(Comments) {
        if (Comments == "") {
            let element = document.getElementById('txtComments')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');
            setTimeout(function () {
                element.classList.add('mandatory-FormContent-focus');
            }, 0)
            customToaster('toster-error', ToasterTypes.Error, "Comments can not be balnk.", 4000)
            return false
        }
        return true
    }
    // this function is used to bind and set values to respect form feilds
    private handleChangeEvents = (event) => {
        // console.log(this.state);
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value
        // console.log(value);
        let { name } = event.target
        if (name != "TotalHours")
            this.setState({ [name]: value });
        else {
            if (/^\d+$/.test(value)) {
                this.setState({ [name]: value });
            }
        }
        let Employee = this.state.EmployeeObj.filter(employee => { if (value == employee.ClientName) return employee })
        if (name == "selectedClient") {
            let ReportingManagers = { results: [] }
            let Emails = []
            if (Employee[0].ReportingManager.length > 0) {
                for (const user of Employee[0].ReportingManager) {
                    ReportingManagers.results.push(user.ID)
                    Emails.push(user.EMail)
                }
            }
            this.setState({ ReportingManagerId: ReportingManagers, ReportingManagerEmails: Emails,DateOfJoining:Employee[0].DateOfJoining });
        }
        else if (name == 'EmployeeType') {
            let obj = this.state.PTOObj
            if (value == "None") {
                this.setState({ PTOTypesObj: [], SelectedPTO: 'None', HolidayType: '' })
            }
            else if (value == "Salaried Employee") {
                this.setState({ PTOTypesObj: obj.SalariedEmployees, SelectedPTO: 'None', HolidayType: '' })
            }
            else {
                this.setState({ PTOTypesObj: obj.HourlyEmployee, SelectedPTO: 'None', HolidayType: '' })
            }
        }
    }

    // this function is used to set date to the date feild
    private SetFromDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ FromDate: date });
    }

    private SetToDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ ToDate: date });
    }

    // this function is used to validate duplicate record if the  employee is already associated withe selected client or not
    private async validateDuplicateRecord() {
        let isValid = {
            status: true,
            message: ""
        }
        let prevDate = addDays(new Date(this.state.FromDate), -1);
        let nextDate = addDays(new Date(this.state.FromDate), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`
        // filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
        let from1 = this.state.FromDate.toLocaleDateString('en-US')
        let from2 = this.state.fetchedFromDate != null ? this.state.fetchedFromDate.toLocaleDateString('en-US') : ''
        let to1 = this.state.ToDate.toLocaleDateString('en-US')
        let to2 = this.state.fetchedFromDate != null ? this.state.fetchedToDate.toLocaleDateString('en-US') : ''
        if (this.state.selectedClient == this.state.fetchedClient && from1 == from2 && to1 == to2) {
            return isValid;
        }
        else {
            let from = new Date(this.state.FromDate).toLocaleDateString('en-US')
            let to = new Date(this.state.ToDate).toLocaleDateString('en-US')
            let filterQuery
            if (this.state.ItemID != 0) {
                filterQuery = "Employee/Id eq '" + this.state.EmployeeId + "' and Client eq '" + this.state.selectedClient + "' and From gt '" + prev + "' and Status ne '" + StatusType.Withdraw + "' and ID ne '" + this.state.ItemID + "' "
            }
            else {
                filterQuery = "Employee/Id eq '" + this.state.EmployeeId + "' and Client eq '" + this.state.selectedClient + "' and From gt '" + prev + "' and Status ne '" + StatusType.Withdraw + "'"
            }
            // " and From lt '"+next+"'
            let selectQuery = "Employee/Title,Employee/ID,*"
            let duplicateRecord = await sp.web.lists.getByTitle('PTO').items.filter(filterQuery).select(selectQuery).expand('Employee').orderBy('Title').get()
            // console.log(duplicateRecord);
            // console.log("length = "+duplicateRecord.length)
            // return duplicateRecord.length;

            if (this.checkDateRangeOverlap(duplicateRecord, from, to)) {
                isValid.status = false;
                isValid.message = "Dates overlap with existing PTO. Please select different dates."
            }
            return isValid
        }
    }

    private isOverlap(existingFromDate, existingToDate, newFromDate, newToDate) {
        return (existingFromDate <= newToDate && existingToDate >= newFromDate);
    }

    // Function to check if all dates in the new date range are present in any of the record date ranges
    private checkDateRangeOverlap(records, newFromDate, newToDate) {
        const fromDate = new Date(newFromDate);
        const toDate = new Date(newToDate);
        for (let record of records) {
            const recordFromDate = new Date(record.From).toLocaleDateString('en-US');
            const recordToDate = new Date(record.To).toLocaleDateString('en-US');
            if (this.isOverlap(new Date(recordFromDate), new Date(recordToDate), fromDate, toDate)) {
                return true; // There is an overlap
            }
        }
        return false; // No overlap found
    }

    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName, DashboardURL) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details or go to <a href=" + DashboardURL + ">Dashboard</a>.";
        var emailBody = '<table id="email-container" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; text-align: left;"width="600px">' +
            '<tr valign="top"><td colspan="2"><div id="email-to">Dear Sir/Madam,</br></div></td></tr>';
        emailBody += '<tr valign="top"><td colspan="2" style="padding-top: 10px;">' + bodyString + '</td></tr>';
        var i = 0;
        for (var key in tableContent) {
            if (i === 0)
                emailBody += "<tr><td></br></td></tr>";
            var tdValue = tableContent[key];
            emailBody += '<tr valign="top"> <td style="width:200px">' + key + '</td><td>: ' + tdValue + '</td></tr>';
            i++;
        }
        emailBody += '<tr valign="top"> <td colspan="2" style="padding-top: 10px;"></br>' + emailLink + '</td></tr>';
        emailBody += '<tr valign="top"><td colspan="2"></br><p style="margin-bottom: 0;">Regards,</p><div style="margin-top: 5px;" id="email-from">' + userName + '</div>';
        emailBody += '</td></tr></table>';
        return emailBody;
    }

    private sendemail(emaildetails, ActionStatus) {
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,
            //Subject of Email  
            Subject: emaildetails.subject,
            //Array of string for To of Email  
            To: emaildetails.toemail,
            CC: emaildetails.ccemail
        }).then((i) => {
            //  customToaster('toster-success', ToasterTypes.Success,'PTO Applied Successfully', 2000)
            if(StatusType.Revoke!=ActionStatus)
            this.setState({ loading: false, message: 'Success-'+ActionStatus, Homeredirect: true })
        else{
            customToaster('toster-success',ToasterTypes.Success,'PTO form '+StatusType.Revoke.toLowerCase()+ ' succesfully',2000)
            this.getOnLoadData()
        }
            //   this.setState({loading: false})
            // if (ActionStatus == StatusType.Submit)
            //     this.setState({ ActionToasterMessage: 'Success-' + StatusType.Submit, loading: false, redirect: true })
            // else if (ActionStatus == StatusType.Approved)
            //     this.setState({ ActionToasterMessage: 'Success-' + StatusType.Approved, loading: false, redirect: true })
            // else if ([StatusType.ManagerReject, StatusType.ReviewerReject].includes(ActionStatus))
            //     this.setState({ ActionToasterMessage: 'Success-' + StatusType.Reject, loading: false, redirect: true })
            // else if (ActionStatus == StatusType.Revoke) {
            //     this.setState({ loading: false })
            //     customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Revoke.toLowerCase() + ' successfully', 2000)
            // }

        }).catch((i) => {
            // customToaster('toster-success', ToasterTypes.Success,'Something went wrong while sending an Email', 2000)
            console.log(i)
            this.setState({ message: 'Error', loading: false, Homeredirect: true })
        });
    }

    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    // this functionis uesd to go to dashboard when clicked on cancel button
    private handleCancel = async (e) => {
        this.setState({ message: '', Homeredirect: true });
    }

    private showToaster = () => {
        this.handleSubmit()
    }

    // this function is used to validate form and send data to list if validation succeeds
    private handleSubmit = async () => {
        // this.setState({showToaster:true})
        let data = {
            // Employee: { val: this.state.EmployeeId, required: true, Name: 'Employee', Type: ControlType.people, Focusid: 'divEmployee' },
            Client: { val: this.state.selectedClient, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.client },
            EmployeeType: { val: this.state.EmployeeType, required: true, Name: 'Employee Type', Type: ControlType.string, Focusid: this.EmployeeType },
            PTOType: { val: this.state.SelectedPTO, required: true, Name: 'PTO Type', Type: ControlType.string, Focusid: this.PTOType },
            FromDate: { val: this.state.FromDate, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
            ToDate: { val: this.state.ToDate, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
            TotalHours: { val: this.state.TotalHours, required: true, Name: 'Total Hours', Type: ControlType.string, Focusid: this.TotalHours }
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        if (new Date(this.state.FromDate) > new Date(this.state.ToDate)) {
            isValid.message = 'From Date cannot be greater than To Date'
            let element = document.getElementById('txtFromDate')
            element.focus()
            element.classList.add('mandatory-FormContent-focus');
            setTimeout(function () {
                element.classList.add('mandatory-FormContent-focus');
            }, 0)
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        isValid = this.checkIsValidDateRange(this.state.FromDate, this.state.ToDate, this.state.HolidayDates)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        isValid = this.validateTotalPTOhours(this.state.FromDate.toLocaleDateString('en-US'), this.state.ToDate.toLocaleDateString('en-US'), this.state.TotalHours)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        let doj  = new Date(this.state.DateOfJoining).toLocaleDateString('en-US')
        let from = new Date(this.state.FromDate).toLocaleDateString('en-US')
        if(new Date(doj)>new Date(from)){
            customToaster('toster-error', ToasterTypes.Error, "PTO cannot be applied for days preceding your date of joining.", 4000)
            return false
        }
        isValid = await this.validateDuplicateRecord()
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        let commentsObj = this.state.CommentsHistory
        commentsObj.push({
            Action: this.state.IsSubmitted ? "Re-" + StatusType.Submit : StatusType.Submit,
            Role: 'Initiator',
            User: this.props.spContext.userDisplayName,
            Comments: this.state.Comments,
            Date: new Date().toISOString()
        })
        let postObject = {
            EmployeeId: this.state.EmployeeId,
            Client: this.state.selectedClient,
            EmployeeType: this.state.EmployeeType,
            PTOType: this.state.SelectedPTO,
            From: this.addBrowserwrtServer(new Date(this.state.FromDate)),
            To: this.addBrowserwrtServer(new Date(this.state.ToDate)),
            TotalHours: this.state.TotalHours,
            CommentsHistory: JSON.stringify(commentsObj),
            Status: StatusType.Submit,
            PendingWith: "Manager",
            ReportingManagerId: this.state.ReportingManagerId,
            IsSubmitted: true
        }
        console.log(postObject);
        // return false

        // if (duplicate > 0) {
        //     //    console.log("duplicate record found");
        //     //    this.setState({showToaster:true})
        //     customToaster('toster-error', ToasterTypes.Error, "You have already applied PTO on in this date range", 4000)
        // }
        // // else {
        // //     this.setState({ errorMessage: '' })

        this.generateEmailData(postObject, this.state.IsSubmitted ? "Re-"+StatusType.Submit : StatusType.Submit)
    }

    private generateEmailData = (postObject, ActionStatus) => {
        // let emaildetails = { toemail: EmailData.ReportingManagersEmail, ccemail: this.state.EmployeeEmail, subject: EmailData.Sub, bodyString: EmailData.Sub, body: '' };
        // // }  let emaildetails = {toemail:[],ccemail:[],subject:'',bodyString:'',body:''}

        let emaildetails = {}
        // let tableContent = { 'Name': this.state.trFormdata.Name, 'Client': this.state.trFormdata.ClientName, 'Submitted Date': `${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`, 'Office  Hours': this.state.trFormdata.SynergyOfficeHrs[0].Total, 'Holiday Hours': this.state.trFormdata.ClientHolidayHrs[0].Total, 'Time Off Hours': this.state.trFormdata.PTOHrs[0].Total, 'Grand Total Hours': this.state.trFormdata.Total[0].Total }
        let Content =
        {'Employee' : this.state.EmployeeName,
         'Employee Type': this.state.EmployeeType,
         'PTO Type': this.state.SelectedPTO,
         'From': this.state.FromDate.toLocaleDateString('en-US'),
         'To': this.state.ToDate.toLocaleDateString('en-US'),
         'Total Hours': this.state.TotalHours
        }

        switch (ActionStatus) {
            case StatusType.Submit:
                emaildetails = { toemail: this.state.ReportingManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'Request for PTO', bodyString: 'PTO Form has been ' + StatusType.Submit + ' for your approval', body: '',tableContent:Content }
                break;
            case "Re-"+StatusType.Submit:
                emaildetails = { toemail: this.state.ReportingManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'Request for PTO', bodyString: 'PTO Form has been Re-Submitted for your approval', body: '',tableContent:Content }
                break;
            case StatusType.ManagerApprove:
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.ReportingManagerEmails, subject: 'PTO Approved', bodyString: 'PTO Form has been ' + StatusType.ManagerApprove + ".", body: '',tableContent:Content }
                break;
            case StatusType.ManagerReject:
                Content['Comments']= this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.ReportingManagerEmails, subject: 'PTO Rejected', bodyString: 'PTO Form has been ' + StatusType.ManagerReject + ".", body: '',tableContent:Content }
                break;
            case StatusType.Revoke:
                Content['Comments']= this.state.Comments
                emaildetails = { toemail: this.state.ReportingManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'PTO Revoked', bodyString: 'PTO Form has been ' + StatusType.Revoke + ".", body: '',tableContent:Content }
                break;
            case StatusType.Withdraw:
                Content['Comments']= this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.ReportingManagerEmails, subject: 'PTO Withdrawn', bodyString: 'PTO Form has been ' + StatusType.Withdraw + ".", body: '',tableContent:Content }
                break;
            case StatusType.Approved:
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.ReportingManagerEmails, subject: 'PTO Approved', bodyString: 'PTO Form has been ' + StatusType.Approved + ".", body: '',tableContent:Content }
                break;
            case StatusType.Reject:
                Content['Comments']= this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.ReportingManagerEmails, subject: 'PTO Approved', bodyString: 'PTO Form has been ' + StatusType.HRReject + ".", body: '',tableContent:Content }
                break;
            default:
                break;
        }

        this.InsertorUpdatedata(postObject, emaildetails,ActionStatus);

    }

    private validateTotalPTOhours(FromDate, ToDate, Hours) {
        let isValid = {
            status: true,
            message: ''
        }
        let From = new Date(FromDate)
        let To = new Date(ToDate)
        let days = 0;
        while (From <= To) {
            days++
            From.setDate(From.getDate() + 1);
        }
        if (parseInt(Hours) > days * 8) {
            isValid.status = false
            isValid.message = "Employees can apply a maximum of 8 hours of Paid Time Off (PTO) per day."
        }
        return isValid
    }
    // this function is used save data in the list
    private InsertorUpdatedata(formdata, EmailData,Action) {
        if (this.state.ItemID > 0) {
            this.setState({ loading: true });
            //update existing record
            sp.web.lists.getByTitle('PTO').items.getById(this.state.ItemID).update(formdata).then((res) => {
                // this.setState({ loading: false });
                // this.setState({ message: 'Success-Update', Homeredirect: true })
                let emaildetails = EmailData;
                var DashboardURl = this.siteURL + '/SitePages/TimeSheet.aspx';
                emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/PTOForm/' + this.state.ItemID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);
                this.sendemail(emaildetails, formdata.Status);

            }, (error) => {
                console.log(error);
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle('PTO').items.add(formdata).then((res) => {
                    // this.setState({ loading: false });
                    let emaildetails = EmailData;
                    var DashboardURl = this.siteURL + '/SitePages/TimeSheet.aspx';
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/PTOForm/' + res.data.ID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);
                    this.sendemail(emaildetails, formdata.Status);
                    // this.setState({ message: 'Success-Added', Homeredirect: true })
                }, (error) => {
                    console.log(error);
                });
            }
            catch (e) {
                console.log('Failed to add');
                this.setState({ message: 'Error' })
            }

        }
    }

    private bindComments = () => {
        let body = [];
        if (this.state.CommentsHistory.length > 0) {
            var History = this.state.CommentsHistory;
            for (let i = History.length - 1; i >= 0; i--) {
                body.push(<tr>
                    {/* <td className="" >{History[i]["Role"]}</td> */}
                    <td className="" >{History[i]["User"]}</td>
                    <td className="" >{History[i]["Action"]}</td>
                    <td className="" >{(new Date(History[i]["Date"]).getMonth().toString().length == 1 ? "0" + (new Date(History[i]["Date"]).getMonth() + 1) : new Date(History[i]["Date"]).getMonth() + 1) + "/" + (new Date(History[i]["Date"]).getDate().toString().length == 1 ? "0" + new Date(History[i]["Date"]).getDate() : new Date(History[i]["Date"]).getDate()) + "/" + new Date(History[i]["Date"]).getFullYear()}  {"  " + new Date(History[i]["Date"]).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1]}</td>
                    <td className="" >{History[i]["Comments"]}</td>
                </tr>)
            }
        }
        return body;
    }

    // this function is used to close popup
    private handleClose = () => {
        this.setState({ loading: false, showHideModal: false, message: '', Homeredirect: true })
    }

    public render() {
        if (!this.state.isRecordAcessable) {
            // let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            let url = this.siteURL + "/SitePages/AccessDenied.aspx"
            window.location.href = url
        }
        if (this.state.Homeredirect) {
            let message = this.state.message
            let url
            if (this.props.match.params.redirect != undefined)
                url = `/Dashboard`
            else
                url = `/PTODashboard/${message}`

            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={true}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Time-Off Request Form
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>
                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">

                                            <div className={"col-md-3"}>
                                                <div className="light-text">
                                                    <label>Employee Name</label>
                                                    <input className="txtEmployeeName form-control" required={true} name="EmployeeName" title="Employee Name" value={this.state.EmployeeName} readOnly />
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Client<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="selectedClient" title="Client" id='client' ref={this.client} onChange={this.handleChangeEvents} disabled={(this.state.EmployeeObj.length < 2) || this.state.isDisabled}>
                                                        <option value=''>None</option>
                                                        {this.state.ClientsObject.map((option) => (
                                                            <option value={option} selected={option == this.state.selectedClient}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Employee Type<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="EmployeeType" title="Employee Type" id='EmployeeType' ref={this.EmployeeType} onChange={this.handleChangeEvents} disabled={this.state.isDisabled} value={this.state.EmployeeType}>
                                                        <option value='None'>None</option>
                                                        <option value="Salaried Employee">Salaried Employee</option>
                                                        <option value="Hourly Employee">Hourly Employee</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>PTO Type<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="SelectedPTO" title="PTO Type" id='PTOType' ref={this.PTOType} onChange={this.handleChangeEvents} disabled={this.state.isDisabled} value={this.state.SelectedPTO}>
                                                        <option value='None'>None</option>
                                                        {this.state.PTOTypesObj.map((option) => (
                                                            <option value={option} selected={option == this.state.SelectedPTO}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>


                                        </div>


                                        <div className="row pt-2 px-2">

                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">From Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divFromDate">
                                                        <DatePicker onDatechange={this.SetFromDate} selectedDate={this.state.FromDate} isDisabled={this.state.isDisabled} id="txtFromDate" title="From Date" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">To Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divToDate">
                                                        <DatePicker onDatechange={this.SetToDate} selectedDate={this.state.ToDate} isDisabled={this.state.isDisabled} id="txtToData" title="To Date" />
                                                    </div>
                                                </div>
                                            </div>

                                            <InputText
                                                type='text'
                                                label={"Total Hours"}
                                                name={"TotalHours"}
                                                value={this.state.TotalHours || ''}
                                                isRequired={true}
                                                onChange={this.handleChangeEvents}
                                                refElement={this.TotalHours}
                                                maxlength={250}
                                                onBlur={null}
                                                id={"txtTotal Hours"}
                                                disabled={this.state.isDisabled}
                                            />

                                        </div>
                                        <div className="media-px-12,col-md-9">
                                            <div className="light-text height-auto">
                                                <label className="floatingTextarea2 top-11">Comments</label>
                                                <textarea className="position-static form-control requiredinput mt-3" ref={this.Comments} onChange={this.handleChangeEvents} value={this.state.Comments} maxLength={500} id="txtComments" name="Comments" disabled={false} title='Comments'></textarea>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-2" id="">
                                        {this.state.ButtonsVisibility.Approve && <button type="button" id="btnApprove" onClick={this.handleActions} className="SubmitButtons btn" title='Approve'>Approve</button>}
                                        {this.state.ButtonsVisibility.Reject && <button type="button" id="btnReject" onClick={this.handleActions} className="RejectButtons btn" title='Reject'>Reject</button>}
                                        {this.state.ButtonsVisibility.Revoke && <button type="button" id="btnRevoke" onClick={this.handleActions} className="txt-white CancelButtons bc-burgundy btn" title='Revoke'>Revoke</button>}
                                        {this.state.ButtonsVisibility.Withdraw && <button type="button" id="btnWithdraw" onClick={this.handleActions} className="SaveButtons btn" title='Withdraw'>Withdraw</button>}
                                        {this.state.ButtonsVisibility.Submit && <button type="button" className="SubmitButtons btn" onClick={this.showToaster} title='Submit'>Submit</button>}
                                        <button type="button" title="Cancel" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div>

                                {this.state.CommentsHistory.length > 0 ? <><div className="p-2">
                                    <h4>History</h4>
                                </div><div>
                                        <table className="table table-bordered m-0 timetable">
                                            <thead style={{ borderBottom: "4px solid #444444" }}>
                                                <tr>
                                                    {/* <th className="">Action By</th> */}
                                                    <th className="" style={{ width: '250px' }}>Action By</th>
                                                    <th className="" style={{ width: '150px' }}>Status</th>
                                                    <th className="" style={{ width: '250px' }}>Date & Time (EST)</th>
                                                    <th className="">Comments</th>

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.bindComments()}

                                            </tbody>
                                        </table>
                                    </div></> : ""
                                }
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
export default PTOForm

