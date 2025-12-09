import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';
import ModalForwardApprovals from '../Shared/ModalForwardApprovals.component';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { addDays } from 'office-ui-fabric-react';
import DateUtilities from '../../Utilities/DateUtilities';

export interface ApproversProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ApproversState {
    // ReportingManager: Array<Object>;
    // loading:boolean;
    // message : string;
    // title : string;
    // showHideModal : boolean;
    // isSuccess : boolean;
    // comments :  string;
    // Action : string;
    // errorMessage: string;
    // ItemID : Number;
    // SelectedRows:any;
    // SelectedValue:String;
    // DelegateToId:String;
    // // IsDelegated:boolean;
    // AssignedToId:String;
}

class ApproversApprovals extends React.Component<ApproversProps, ApproversState> {
    constructor(props: ApproversProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        // this.state = {ReportingManager: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,SelectedRows:[],SelectedValue:'',AssignedToId:'',DelegateToId:''};
    }
    public state = {
        ReportingManager: [],
        loading: false, message: '',
        title: '',
        showHideModal: false,
        showApproveRejectPopup: false,
        ModalHeader: '',
        isSuccess: true,
        comments: '',
        Action: '',
        errorMessage: '',
        ItemID: 0,
        SelectedRows: [],
        SelectedValue: '',
        DelegateToUsers: [],
        TimesheetID: "",
        redirect: false,
        isRedirect: false,
        clearRows: true,
        userGroups: [],
        //  AssignedToId:'',
        //  DelegateToId:'',
    };

    public componentDidMount() {
        this.ReportingManagerApproval();
    }

    public componentDidUpdate = () => {
        if (this.state.isRedirect) {
            this.ReportingManagerApproval();
        }
    }
    private handleRowClicked = (row, Id?) => {
        let ID = row.Id ? row.Id : Id;
        this.setState({ TimesheetID: ID, redirect: true })
    }

    private showDelegatedRecords(startDate, endDate) {
        // let today = new Date().toLocaleDateString()
        // startDate = new Date(startDate).toLocaleDateString()
        // endDate = new Date(endDate).toLocaleDateString()
        // if(today>=startDate || today<=endDate){
        //     return true
        // }
        // return false
        let today = new Date();
        let start = new Date(startDate);
        let end = new Date(endDate);
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today >= start && today <= end) {
            return true;
        }
        return false;
    }
    // this function is used to get 2 month records of weeklytime data of the employees who's manager is current logged in user from weeklytimesheet list

    private ReportingManagerApproval = async () => {
        // this.setState({ loading: true,isRedirect:false });
        this.setState({ clearRows: false, SelectedRows: [], ReportingManager: [], isRedirect: false, loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 60);
        let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        var filterQuery = "and WeekStartDate ge '" + date + "'";
        // var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"
        var filterString = "(AssignedTo/Id eq '" + userId + "' or ReportingManager/Id eq '" + userId + "') and Status eq '" + StatusType.Submit + "' and PendingWith eq 'Manager'";
        let delegationQuery = "DelegateTo/Id eq '" + userId + "'";
        try {
            let [groups, responseData, ManagerDelegations] = await Promise.all([
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("ReportingManager,Reviewers,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Reviewers/EMail,Reviewers/Id,Initiator/EMail,Initiator/Id,*').orderBy('WeekStartDate,DateSubmitted', false).get(),
                sp.web.lists.getByTitle('Delegations').items.filter(delegationQuery).expand("Authorizer,DelegateTo").select('Authorizer/Title,Authorizer/ID,Authorizer/EMail,DelegateTo/ID,DelegateTo/EMail,*').orderBy('Authorizer/ID', false).get(),
            ])
            let userGroups = [];
            groups.forEach(grp => userGroups.push(grp.Title));
            // let getDelegateRecords = this.showDelegatedRecords(ManagerDelegations[0].startDate,ManagerDelegations[0].endDate)
            let managers = []
            for (const row of ManagerDelegations) {
                let isApplicable = this.showDelegatedRecords(row.From, row.To)
                if (isApplicable) {
                    managers.push(row)
                }
            }
            // console.log(managers)
            let getDelTSQry = '';
            if (managers.length) {
                if (managers.length > 1) {
                    getDelTSQry = '(';
                    for (const row of managers) {
                        getDelTSQry += ` (ReportingManager/Id eq '${row.Authorizer.ID}') or`;
                    }
                    getDelTSQry = getDelTSQry.substring(0, getDelTSQry.lastIndexOf(") or"));
                    getDelTSQry += ")) and PendingWith eq 'Manager'";
                }
                else {
                    getDelTSQry = `ReportingManager/Id eq '${managers[0].Authorizer.ID}' and PendingWith eq 'Manager'`;
                }
            }
            let delRmData = [];
            if (managers.length)
                delRmData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(getDelTSQry).expand("ReportingManager,Reviewers,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Reviewers/EMail,Reviewers/Id,Initiator/EMail,Initiator/Id,*').orderBy('WeekStartDate,DateSubmitted', false).get()

            let Data = [];
            for (const d of responseData) {
                let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate))
                let isBillable = true;
                if (d.ClientName.toLowerCase().includes('synergy')) {
                    isBillable = false
                }
                // var managerEmails = []
                // for (const e of d.ReportingManager) {
                //     managerEmails.push(e.EMail)
                // }
                Data.push({
                    Id: d.Id,
                    Date: DateUtilities.getDateMMDDYYYY(date),
                    DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                    EmployeName: d.Name,
                    PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                    Status: this.getStatus(d.Status),
                    BillableTotalHrs: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                    OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                    TotalBillable: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                    // NonBillableTotalHrs: d.NonBillableTotalHrs,
                    HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                    PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(4)),
                    PTORow: JSON.parse(d.PTOHrs),
                    GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                    Client: d.ClientName,
                    EmployeeEmail: d.Initiator.EMail,
                    ReportingManagerEmails: d.ReportingManager.map(e => e.EMail),
                    ReviewerEmails: d.Reviewers.map(e => e.EMail),
                    ReviewerIds: d.Reviewers.map(e => e.Id),
                    EmployeeId: d.Initiator.Id,
                    StatusInList: d.Status,
                    commentsObj: JSON.parse(d.CommentsHistory),
                    SynergyOfficeHrs: d.SynergyOfficeHrs,
                    ClientHolidayHrs: d.ClientHolidayHrs,
                    EligibleforPTO: d.EligibleforPTO,
                    //PTONewHrs:d.EligibleforPTO?parseFloat(parseFloat(JSON.parse(d.PTONewHrs)[0].Total).toFixed(2)):'NA',
                })
            }
            if (delRmData.length) {
                for (const d of delRmData) {
                    let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate))
                    let isBillable = true;
                    if (d.ClientName.toLowerCase().includes('synergy')) {
                        isBillable = false;
                    }
                    // To handle: in case of  Manager and Reviewer same: manager delegated to another user , if another user approved, instead of Status=Approved, Status= apprved by Manager updated
                    let RMEmails = d.ReportingManager.map(e => e.EMail);
                    var DelegatedMngrObj = ManagerDelegations.find(MngrD => this.showDelegatedRecords(MngrD.From, MngrD.To) && RMEmails.includes(MngrD.Authorizer.EMail));
                    Data.push({
                        Id: d.Id,
                        Date: DateUtilities.getDateMMDDYYYY(date),
                        DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                        EmployeName: d.Name,
                        PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                        Status: this.getStatus(d.Status),
                        BillableTotalHrs: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                        OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                        TotalBillable: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                        PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(4)),
                        PTORow: JSON.parse(d.PTOHrs),
                        GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                        Client: d.ClientName,
                        EmployeeEmail: d.Initiator.EMail,
                        ReportingManagerEmails: d.ReportingManager.map(e => e.EMail),
                        ReviewerEmails: d.Reviewers.map(e => e.EMail),
                        ReviewerIds: d.Reviewers.map(e => e.Id),
                        EmployeeId: d.Initiator.Id,
                        StatusInList: d.Status,
                        commentsObj: JSON.parse(d.CommentsHistory),
                        SynergyOfficeHrs: d.SynergyOfficeHrs,
                        ClientHolidayHrs: d.ClientHolidayHrs,
                        EligibleforPTO: d.EligibleforPTO,
                        DelegatedMngrObj: DelegatedMngrObj     // To handle: in case of  Manager and Reviewer same: manager delegated to another user , if another user approved, instead of Status=Approved, Status= apprved by Manager updated
                        // PTONewHrs:d.EligibleforPTO?parseFloat(parseFloat(JSON.parse(d.PTONewHrs)[0].Total).toFixed(2)):'NA',
                    })
                }
            }
            // console.log(Data);
            //this.getClientDeligates(Data)
            this.setState({ clearRows: false, ReportingManager: Data, userGroups: userGroups, loading: false });
        }
        catch (error) {
            console.log("Sorry something went wrong!", error);
        }

        // catch(err => {
        //     console.log('Failed to fetch data.', err);
        // });
    }
    private getStatus(value) {
        let Status = value
        if (value == "approved by Manager") {
            Status = "Approved by Reporting Manager";
        }
        else if (value == "rejected by Manager") {
            Status = "Rejected by Reporting Manager";
        }
        else if (value == "approved by Synergy") {
            Status = "Approved by Reviewer";
        }
        else if (value == "rejected by Synergy") {
            Status = "Rejected by Synergy";
        }
        else if (value == "rejected by HR") {
            Status = "Rejected by HR";
        }
        return Status;
    }
    private async getClientDeligates(Data) {
        let obj;
        if (Data.length > 0) {
            let clientDelegates = await sp.web.lists.getByTitle('Client').items.filter("Title eq '" + Data[0].Client + "' and IsActive eq 1").select('DelegateTo/Title,DelegateTo/ID,DelegateTo/EMail,*').expand('DelegateTo').orderBy('Modified', false).get()
            let delegates = clientDelegates[0].DelegateTo
            obj = []
            if (delegates != undefined) {
                for (const d of delegates) {
                    if (d.ID != this.props.spContext.userId)
                        obj.push({
                            ID: d.ID,
                            Title: d.Title,
                            Email: d.EMail
                        })
                }
            }
        }
        this.setState({ ReportingManager: Data, DelegateToUsers: obj, loading: false });
    }
    private getSelectedRows = (rows) => {
        // setSelectedRows(rows.selectedRows);
        if (rows.selectedRows.length > 0) {
            // this.setState({clearRows:false})
            this.setState({ clearRows: false, SelectedRows: rows.selectedRows });
        }
        else
            this.setState({ SelectedRows: rows.selectedRows });
    };
    private ShowPopUp = () => {
        this.setState({ showHideModal: true })
    }
    private handleCancel = () => {
        this.setState({ SelectedValue: '', comments: '', showHideModal: false })
    }
    private handleChangeEvents = (event) => {
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        let { name } = event.target;
        if (name == "DelegateToId")
            this.setState({ SelectedValue: value });
        else
            this.setState({ comments: value });
    }
    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName, DashboardURL) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details or go to <a href=" + DashboardURL + ">Dashboard</a>.";
        var emailBody = '<table id="email-container" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; text-align: left;""width="600px"">' +
            '<tr valign="top"><td colspan="2"><div id="email-to">Dear Sir/Madam,</br></div></td></tr>';
        emailBody += '<tr valign="top"><td colspan="2" style="padding-top: 10px;">' + bodyString + '</td></tr>';
        var i = 0;
        for (var key in tableContent) {
            if (i === 0)
                emailBody += "<tr><td></br></td></tr>";
            var tdValue = tableContent[key];
            emailBody += '<tr valign="top"> <td>' + key + '</td><td>: ' + tdValue + '</td></tr>';
            i++;
        }
        emailBody += '<tr valign="top"> <td colspan="2" style="padding-top: 10px;"></br>' + emailLink + '</td></tr>';
        emailBody += '<tr valign="top"><td colspan="2"></br><p style="margin-bottom: 0;">Regards,</p><div style="margin-top: 5px;" id="email-from">' + userName + '</div>';
        emailBody += '</td></tr></table>';
        return emailBody;
    }
    private sendemail(emaildetails) {
        sp.utility.sendEmail({
            Body: emaildetails.body,
            Subject: emaildetails.subject,
            To: emaildetails.toemail,
            CC: emaildetails.ccemail
        }).then((i) => {
        }).catch((i) => {
            console.log(i)
        });
    }
    private checkIsValid(value, ID, ErrMsg) {
        let isValid = true
        if (value == "") {
            customToaster('toster-error', ToasterTypes.Error, ErrMsg, 4000);
            document.getElementById(ID).focus()
            document.getElementById(ID).classList.add('mandatory-FormContent-focus');
            isValid = false
        }
        return isValid;
    }
    private forwardApprovals = async () => {
        let selectedValue = this.state.SelectedValue;
        let Comments = this.state.comments;
        document.getElementById('ddlDelegateTo').classList.remove('mandatory-FormContent-focus');
        document.getElementById('txtComments').classList.remove('mandatory-FormContent-focus');
        let isValid = this.checkIsValid(selectedValue, 'ddlDelegateTo', 'Please select the person you want to delegate the approvals to.')

        if (isValid) {
            if (!this.checkIsValid(Comments, 'txtComments', 'Comments cannot be blank.'))
                return false
        }
        else
            return false

        if (!this.checkIsValid) {
            return false
        }
        this.setState({ loading: true })
        document.getElementById('ddlDelegateTo').classList.remove('mandatory-FormContent-focus');
        let selectedRows = this.state.SelectedRows
        // updateStatus(recordId,StatusType.ReviewerReject,commentsObj,toEmail,ccEmail,tableContent)

        try {
            let delegatedUserID = parseInt(selectedValue)
            // Start a new batch
            const batch = sp.web.createBatch();

            for (const row of selectedRows) {
                // Queue update operation for each item in the batch
                let comments = row.commentsObj
                comments.push({
                    Action: StatusType.ForwardApprovals,
                    Role: 'Manager',
                    User: this.props.spContext.userDisplayName,
                    Comments: this.state.comments,
                    Date: new Date().toISOString()
                })
                let formData = {
                    DelegateToId: { results: [delegatedUserID] },
                    AssignedToId: { results: [delegatedUserID] },
                    CommentsHistory: JSON.stringify(comments),
                    IsDelegated: true
                }
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
            }
            let EmailSubject = "Weekly Time Sheet has been forwarded for your Approval"
            // Execute the batch
            await batch.execute();
            // Send Email
            // try{
            // for (const m of selectedRows) {
            //     let To = this.state.DelegateToUsers.find(item => item.ID === delegatedUserID)?.Email;
            //     let CC = m.ReportingManagerEmails
            //     let tableContent = {}
            //     let date = new Date(m.Date)
            //     if (m.Client.toLowerCase().includes("synergy")) {
            //         tableContent = { 'Name': m.EmployeName, 'Client Name': m.Client, 'Submitted Date': `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, 'Office Hours': JSON.parse(m.SynergyOfficeHrs)[0].Total, 'Holiday Hours': JSON.parse(m.ClientHolidayHrs)[0].Total, 'Time Off Hours': m.PTOHrs, 'Grand Total Hours': m.GrandTotal, 'Comments': this.state.comments }
            //     }
            //     else {
            //         tableContent = { 'Name': m.EmployeName, 'Client Name': m.Client, 'Submitted Date': `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, 'Billable Hours': m.BillableTotalHrs, 'OT Hours': m.OTTotalHrs, 'Total Billable Hours': m.TotalBillable, 'Holiday Hours': JSON.parse(m.ClientHolidayHrs)[0].Total, 'Time Off Hours': m.PTOHrs, 'Grand Total Hours': m.GrandTotal, 'Comments': this.state.comments }
            //     }
            //     let emaildetails = { toemail: [To], ccemail: CC, subject: EmailSubject, bodyString: EmailSubject, body: '' };
            //     var DashboardURl = this.props.spContext.webAbsoluteUrl+'/SitePages/TimeSheet.aspx';
            //     emaildetails.body = this.emailBodyPreparation(this.props.spContext.webAbsoluteUrl+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/' + m.Id, tableContent, emaildetails.bodyString, this.props.spContext.userDisplayName, DashboardURl);
            //     await this.sendemail(emaildetails)

            // }
            // }
            // catch (error) {
            //     customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            //     this.setState({ loading: false })
            //     console.log('Error occurred while sending emails:', error);
            // }
            // console.log('Bulk forwards successful!');
            // customToaster('toster-success', ToasterTypes.Success, 'Timesheets forwarded Sucessfully.', 2000)
            customToaster('toster-success', ToasterTypes.Success, 'Timesheet(s) Approved Sucessfully.', 2000)
            this.setState({ SelectedValue: '', comments: '', showHideModal: false, SelectedRows: [], loading: false, clearRows: true, isRedirect: true });
            // this.ReportingManagerApproval();
        } catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            this.setState({ loading: false })
            console.log('Error occurred during bulk forwards:', error);
        }

    }
    //////////////// functions related to Multi Approve/Reject

    private getNotApprovedTimeOffTSs = async () => {
        const promises = this.state.SelectedRows.map(async (item) => {
            const isReviewer = item.ReviewerEmails.some(
                (email) => email === this.props.spContext.userEmail
            );

            const timeOffRec = await this.getTimeOffItemDataByFromDate(item.Date, item.EmployeeId);

            if (isReviewer && timeOffRec.length && !timeOffRec[0].IsSubmittedFromTimesheetForm && ![StatusType.Approved].includes(timeOffRec[0].Status)) {
                return item;
            }
            return null;
        });

        const results = await Promise.all(promises);
        return results.filter((item) => item !== null);
    };

    private showConfirmApproveRejectPopup = async (e) => {
        let name = e.target.name;
        if (name == 'Approve') {
            // for holding timesheets if all time off requests are pending with HR
            let TimeOffNotApprovedTSs = [];
            if (!this.state.userGroups.includes('Timesheet HR')) {
                TimeOffNotApprovedTSs = await this.getNotApprovedTimeOffTSs();

            }
            if (TimeOffNotApprovedTSs.length == this.state.SelectedRows.length) {
                customToaster('toster-warning', ToasterTypes.Warning, `Selected Timesheet ${TimeOffNotApprovedTSs.length > 1 ? '(s)' : ''} of time off request ${TimeOffNotApprovedTSs.length > 1 ? 'have' : 'has'} been pending with HR approval. Cannot approve`, 4000);
            }
            else {
                this.setState({ message: 'Are you sure you want to approve timesheet(s)?', title: 'Approve', Action: 'Approve', showApproveRejectPopup: true, isSuccess: true, ModalHeader: 'modal-header-Approve' });
            }
        }
        else
            if (name == 'Reject') {
                this.setState({ message: 'Are you sure you want to reject timesheet(s)?', title: 'Reject', Action: StatusType.Reject, showApproveRejectPopup: true, isSuccess: false, ModalHeader: 'modal-header-reject' });
            }
            else {
                this.setState({ showApproveRejectPopup: false })
            }
    }
    private closeApproveRejectPopup = () => {
        this.setState({ showApproveRejectPopup: false, Action: '', errorMessage: '', comments: '' });
    }
    private handleApproveReject = (e) => {
        if (this.state.Action == "Approve")
            this.handleMultiApprove();
        else
            this.handleMultiReject();
    }
    private handleMultiApprove = async () => {
        document.getElementById('txtComments').classList.remove('mandatory-FormContent-focus');
        this.setState({ loading: true, showApproveRejectPopup: false });
        let selectedRows = this.state.SelectedRows;
        try {
            // Batch declaration
            const batch = sp.web.createBatch();
            const EmployeePTOBatch = sp.web.createBatch(); // Regarding PTO
            const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO
            let NotModifiedTimesheets = [], TimeOffNotApprovedTSs = [];
            var ItemsJustBeforeActionPerform = await this.GetAllItemsStatusBeforeActionPerform();
            let selectQueryPTOTransaction = "Employee/Id,Employee/Title,*";
            var [EmployeePTOReords, PTOTransactionRecords] = await Promise.all([
                this.getLatestPTOData(),
                sp.web.lists.getByTitle('PTOTransactions').items.top(5000).expand('Employee').filter(`IsActive eq 1`).select(selectQueryPTOTransaction).orderBy('PostedOn', false).getAll()
            ])
            for (const row of selectedRows) {
                // Queue update operation for each item in the batch
                //For handling  Reportimg Manager and Reviewer same case.
                let IsReportingManagerReviewerSame = false;
                let currentActioner = this.props.spContext.userEmail;
                for (let Rew of row.ReviewerEmails) {
                    if (currentActioner == Rew) {
                        IsReportingManagerReviewerSame = true;
                        break;
                    }
                }
                // To handle: in case of  Manager and Reviewer same: manager delegated to another user , if another user approved, instead of Status=Approved, Status= apprved by Manager updated
                if (!IsReportingManagerReviewerSame && row.DelegatedMngrObj) {
                    for (let Rew of row.ReviewerEmails) {
                        if (row.DelegatedMngrObj.Authorizer.EMail == Rew) {
                            IsReportingManagerReviewerSame = true;
                            break;
                        }
                    }
                }
                let comments = row.commentsObj;
                comments.push({ Action: StatusType.Approved, Role: 'Manager', User: this.props.spContext.userDisplayName, Comments: this.state.comments.trim(), Date: new Date().toISOString() })
                let TimeOffRec = await this.getTimeOffItemDataByFromDate(row.Date, row.EmployeeId);
                let formData = {
                    Status: IsReportingManagerReviewerSame ? StatusType.Approved : StatusType.ManagerApprove,
                    PendingWith: IsReportingManagerReviewerSame ? "NA" : "Reviewer",
                    AssignedToId: IsReportingManagerReviewerSame ? { "results": [] } : { "results": row.ReviewerIds },
                    CommentsHistory: JSON.stringify(comments),
                }

                //Code to handle PTO Calculations if Manager and Reviewer Same :start
                let currentEmployeePTO = [];
                let PTOData = {};
                let TimeOffPostData = {}, Transaction = {};
                let PTOHrs = row.PTORow[0].Total;
                //    if(parseFloat(row.PTORow[0].PTOAfterDeduction)<0)
                //    PTOHrs=parseFloat(row.PTORow[0].Total)+parseFloat(row.PTORow[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs
                //for handling TimeOffRecord consideration:Start
                if (TimeOffRec.length) {
                    PTOHrs = TimeOffRec[0].PTOTotal;// PTO hours geting from TimeOff Record
                    let timeOffCommentsObj = JSON.parse(TimeOffRec[0].CommentsHistory);
                    timeOffCommentsObj.push({ Action: StatusType.Approved, Role: "Manager", User: this.props.spContext.userDisplayName, Comments: this.state.comments, Date: new Date().toISOString() });
                    if (TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                        if (IsReportingManagerReviewerSame && (this.state.userGroups.includes('Timesheet HR') || !row.EligibleforPTO)) // ReportingManager/Reviewer/HR same or PTO not eligible
                        {
                            //Timesheet data
                            formData.Status = StatusType.Approved;
                            formData.PendingWith = "NA";
                            formData.AssignedToId = { "results": [] };
                            //TimeOff data
                            TimeOffPostData['Status'] = StatusType.Approved;
                            TimeOffPostData['PendingWith'] = 'NA';
                            TimeOffPostData['CommentsHistory'] = JSON.stringify(timeOffCommentsObj);
                            //Transaction data
                            Transaction['TransactionType'] = StatusType.Approved;
                        }
                        else if (IsReportingManagerReviewerSame && row.EligibleforPTO) // ReportingManager/Reviewer same
                        {
                            //Timesheet data
                            formData.Status = StatusType.ReviewerApprove;
                            formData.PendingWith = "HR";
                            formData.AssignedToId = { "results": [] };
                            //TimeOff data
                            TimeOffPostData['Status'] = StatusType.ReviewerApprove;
                            TimeOffPostData['PendingWith'] = 'HR';
                            TimeOffPostData['CommentsHistory'] = JSON.stringify(timeOffCommentsObj);
                            //Transaction data
                            Transaction['TransactionType'] = StatusType.ReviewerApprove;
                        }

                    }
                }
                //for handling TimeOffRecord consideration:End
                if (IsReportingManagerReviewerSame && row.EligibleforPTO && row.PTOHrs != 0 && parseFloat(PTOHrs) > 0 && TimeOffRec.length && TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                    currentEmployeePTO = EmployeePTOReords.filter(pto => pto.Employee.Id == row.EmployeeId && pto.Year == new Date(row.Date).getFullYear()); // Regarding PTO
                    //  PTOTransaction={
                    //     EmployeeId:row.EmployeeId,
                    //     TransactionType:StatusType.Approved,
                    //     PostedOn:new Date(),
                    //     From:this.addBrowserwrtServer(new Date(row.Date)),
                    //     To:this.addBrowserwrtServer(addDays(new Date(row.Date),6)),
                    //     Hours:parseFloat(PTOHrs).toFixed(4),
                    //     Reason:this.state.comments.trim(),
                    //     Year:new Date(row.Date).getFullYear().toString()
                    //  }
                    if (currentEmployeePTO.length)
                        PTOData = {
                            PTOBalance: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalance) ? 0 : currentEmployeePTO[0].PTOBalance) - parseFloat(PTOHrs)).toFixed(4),
                            PTOApplied: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4),
                            PTOAvailed: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOAvailed) ? 0 : currentEmployeePTO[0].PTOAvailed) + parseFloat(PTOHrs)).toFixed(4),
                        }
                    // Below is for : after action component is not get reloaded, so to get updated PTO Data
                    let EmployeePTO = [];
                    EmployeePTOReords.forEach(obj => {
                        if (obj.Employee.Id == row.EmployeeId && obj.Year == new Date(row.Date).getFullYear()) {
                            obj.PTOBalance = (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalance) ? 0 : currentEmployeePTO[0].PTOBalance) - parseFloat(PTOHrs)).toFixed(4);
                            obj.PTOApplied = (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4);
                            obj.PTOAvailed = (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOAvailed) ? 0 : currentEmployeePTO[0].PTOAvailed) + parseFloat(PTOHrs)).toFixed(4);
                            EmployeePTO.push(obj);
                        }
                        else {
                            EmployeePTO.push(obj);
                        }
                    })
                    EmployeePTOReords = EmployeePTO;
                }
                //Code to handle PTO Calculations if Manager and Reviewer Same :end

                //let itemStatus = await this.getItemStatusBeforeActionPerform(row.Id,row.StatusInList);
                // if(itemStatus==row.StatusInList)
                // {
                //      sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                //      NotModifiedTimesheets.push(row);
                // }

                for (let T in ItemsJustBeforeActionPerform) {
                    if (row.Id == ItemsJustBeforeActionPerform[T].Id && row.StatusInList == ItemsJustBeforeActionPerform[T].Status) {
                        //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                        if (row.PTOHrs != 0 && TimeOffRec.length && TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                            sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                            if (row.EligibleforPTO && row.PTOHrs != 0 && parseFloat(PTOHrs) > 0 && [StatusType.Approved].includes(formData.Status)) {
                                sp.web.lists.getByTitle('EmployeePTO').items.getById(currentEmployeePTO[0].Id).inBatch(EmployeePTOBatch).update(PTOData);
                                PTOTransactionRecords
                                    .filter(item => item.IsActive && parseInt(item.TimeOffID) === parseInt(TimeOffRec[0].Id))
                                    .forEach(pto => {
                                        sp.web.lists.getByTitle('PTOTransactions').items.getById(pto.ID).inBatch(PTOTransactionBatch).update(Transaction);
                                    });
                            }
                            sp.web.lists.getByTitle('TimeOffEmployees').items.getById(TimeOffRec[0].Id).inBatch(PTOTransactionBatch).update(TimeOffPostData);//TimeOff update
                        }
                        else if (row.PTOHrs != 0 && TimeOffRec.length && !TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                            if (!IsReportingManagerReviewerSame || (IsReportingManagerReviewerSame && [StatusType.Approved].includes(TimeOffRec[0].Status)))//condition1: if manager&reviewer not same, directly approve timesheet. condition2: if Manager&reviewer  and TimeOffRec is alredy approved by HR then approve timesheet otherwise holding the timesheet
                            {
                                sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                            }
                            else {
                                TimeOffNotApprovedTSs.push(row); //for skipping the TimeOff not approved timesheets holding
                            }
                        }
                        else if (row.PTOHrs == 0 && !TimeOffRec.length) {
                            sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                        }
                        NotModifiedTimesheets.push(row);
                        break;
                    }
                }
            }
            // Execute the batch
            await Promise.all([batch.execute(), EmployeePTOBatch.execute(), PTOTransactionBatch.execute()]);
            customToaster('toster-success', ToasterTypes.Success, NotModifiedTimesheets.length + ' Timesheet(s) Approved Successfully.' + (selectedRows.length - NotModifiedTimesheets.length != 0 ? ' Attention: ' + (selectedRows.length - NotModifiedTimesheets.length) + ' Timesheet(s) has been modified. Please review the changes.' : ''), 4000);
            if (TimeOffNotApprovedTSs.length)
                customToaster('toster-warning', ToasterTypes.Warning, `Selected Timesheet ${TimeOffNotApprovedTSs.length > 1 ? '(s)' : ''} of time off request ${TimeOffNotApprovedTSs.length > 1 ? 'have' : 'has'} been pending with HR approval. Cannot approve`, 4000);
            this.setState({ comments: '', showApproveRejectPopup: false, SelectedRows: [], loading: false, clearRows: true, isRedirect: true });
            // this.ReportingManagerApproval();
        } catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000);
            this.setState({ loading: false });
            console.log('Error occurred during multi approvals:', error);
        }

    }
    private handleMultiReject = async () => {
        let Comments = this.state.comments.trim();
        document.getElementById('txtComments').classList.remove('mandatory-FormContent-focus');
        let isValid = this.checkIsValid(Comments, 'txtComments', 'Comments cannot be blank.');
        if (isValid) {
            this.setState({ loading: true, showApproveRejectPopup: false })
            let selectedRows = this.state.SelectedRows;
            try {
                // Batch declaration
                const batch = sp.web.createBatch();
                const EmployeePTOBatch = sp.web.createBatch(); // Regarding PTO
                const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO
                let NotModifiedTimesheets = [];
                var ItemsJustBeforeActionPerform = await this.GetAllItemsStatusBeforeActionPerform();
                // var EmployeePTOReords= await this.getLatestPTOData();
                let selectQueryPTOTransaction = "Employee/Id,Employee/Title,*";
                var [EmployeePTOReords, PTOTransactionRecords] = await Promise.all([
                    this.getLatestPTOData(),
                    sp.web.lists.getByTitle('PTOTransactions').items.top(5000).expand('Employee').filter(`IsActive eq 1`).select(selectQueryPTOTransaction).orderBy('PostedOn', false).getAll()
                ])


                for (const row of selectedRows) {
                    // Queue update operation for each item in the batch

                    let comments = row.commentsObj;
                    comments.push({ Action: StatusType.Reject, Role: 'Manager', User: this.props.spContext.userDisplayName, Comments: this.state.comments.trim(), Date: new Date().toISOString() });
                    let TimeOffRec = await this.getTimeOffItemDataByFromDate(row.Date, row.EmployeeId);
                    let formData = {
                        Status: StatusType.ManagerReject,
                        PendingWith: "Initiator",
                        AssignedToId: { "results": [row.EmployeeId] },
                        CommentsHistory: JSON.stringify(comments),
                    }
                    let currentEmployeePTO = [];
                    let PTOData = {};
                    let TimeOffPostData = {}, Transaction = {};
                    let PTOHrs = row.PTORow[0].Total;
                    //    if(parseFloat(row.PTORow[0].PTOAfterDeduction)<0)
                    //    PTOHrs=parseFloat(row.PTORow[0].Total)+parseFloat(row.PTORow[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs
                    //for handling TimeOffRecord consideration:Start
                    if (TimeOffRec.length) {
                        PTOHrs = TimeOffRec[0].PTOTotal;// PTO hours geting from TimeOff Record
                        let timeOffCommentsObj = JSON.parse(TimeOffRec[0].CommentsHistory);
                        timeOffCommentsObj.push({ Action: StatusType.Reject, Role: "Manager", User: this.props.spContext.userDisplayName, Comments: this.state.comments, Date: new Date().toISOString() });
                        if (TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                            //Timesheet data
                            TimeOffPostData['Status'] = StatusType.ManagerReject;
                            TimeOffPostData['PendingWith'] = 'Initiator';
                            TimeOffPostData['CommentsHistory'] = JSON.stringify(timeOffCommentsObj);
                            //Transaction data
                            Transaction['TransactionType'] = StatusType.Reject;
                        }
                    }
                    //for handling TimeOffRecord consideration:End
                    if (row.EligibleforPTO && row.PTOHrs != 0 && parseFloat(PTOHrs) > 0) {
                        currentEmployeePTO = EmployeePTOReords.filter(pto => pto.Employee.Id == row.EmployeeId && pto.Year == new Date(row.Date).getFullYear()); // Regarding PTO
                        //  PTOTransaction={
                        //     EmployeeId:row.EmployeeId,
                        //     TransactionType:StatusType.ManagerReject,
                        //     PostedOn:new Date(),
                        //     From:this.addBrowserwrtServer(new Date(row.Date)),
                        //     To:this.addBrowserwrtServer(addDays(new Date(row.Date),6)),
                        //     Hours:parseFloat(PTOHrs).toFixed(4),
                        //     Reason:this.state.comments.trim(),
                        //     Year:new Date(row.Date).getFullYear().toString()
                        //  }
                        if (currentEmployeePTO.length) {
                            PTOData = {
                                PTOBalanceAfterDeduction: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? 0 : currentEmployeePTO[0].PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4),
                                PTOApplied: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4)
                            }
                            TimeOffPostData['PreviousPTOBalance'] = parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(PTOHrs)).toFixed(4)).toString();
                            TimeOffPostData['CurrentPTOBalance'] = PTOData['PTOBalanceAfterDeduction'];
                        }
                        // Below is for : after action component is not get reloaded, so to get updated PTO Data
                        let EmployeePTO = [];
                        EmployeePTOReords.forEach(obj => {
                            if (obj.Employee.Id == row.EmployeeId && obj.Year == new Date(row.Date).getFullYear()) {
                                obj.PTOBalanceAfterDeduction = (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? 0 : currentEmployeePTO[0].PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4);
                                obj.PTOApplied = (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4);
                                EmployeePTO.push(obj);
                            }
                            else {
                                EmployeePTO.push(obj);
                            }
                        })
                        EmployeePTOReords = EmployeePTO;
                    }

                    //    let itemStatus = await this.getItemStatusBeforeActionPerform(row.Id,row.StatusInList);
                    //     if(itemStatus==row.StatusInList)
                    //     {
                    //         sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                    //         NotModifiedTimesheets.push(row);
                    //     }
                    // let Transaction = {
                    //     TransactionType: StatusType.Reject
                    // }
                    for (let T in ItemsJustBeforeActionPerform) {
                        if (row.Id == ItemsJustBeforeActionPerform[T].Id && row.StatusInList == ItemsJustBeforeActionPerform[T].Status) {
                            sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(row.Id).inBatch(batch).update(formData);
                            //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                            if (row.PTOHrs != 0 && TimeOffRec.length && TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                                if (row.EligibleforPTO && parseFloat(PTOHrs) > 0) {
                                    sp.web.lists.getByTitle('EmployeePTO').items.getById(currentEmployeePTO[0].Id).inBatch(EmployeePTOBatch).update(PTOData);
                                    PTOTransactionRecords
                                        .filter(item => item.IsActive && parseInt(item.TimeOffID) === parseInt(TimeOffRec[0].Id))
                                        .forEach(pto => {
                                            sp.web.lists.getByTitle('PTOTransactions').items.getById(pto.ID).inBatch(PTOTransactionBatch).update(Transaction);
                                        });
                                }
                                sp.web.lists.getByTitle('TimeOffEmployees').items.getById(TimeOffRec[0].Id).inBatch(PTOTransactionBatch).update(TimeOffPostData);//TimeOff update

                            }
                            NotModifiedTimesheets.push(row);
                            break;
                        }
                    }
                }
                // Execute the batch
                await Promise.all([batch.execute(), EmployeePTOBatch.execute(), PTOTransactionBatch.execute()]);
                customToaster('toster-success', ToasterTypes.Success, NotModifiedTimesheets.length + ' Timesheet(s) Rejected Successfully.' + (selectedRows.length - NotModifiedTimesheets.length != 0 ? ' Attention: ' + (selectedRows.length - NotModifiedTimesheets.length) + ' Timesheet(s) has been modified. Please review the changes.' : ''), 2000);
                this.setState({ comments: '', showApproveRejectPopup: false, SelectedRows: [], loading: false, clearRows: true, isRedirect: true });
                // this.ReportingManagerApproval();
            }
            catch (error) {
                customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                this.setState({ loading: false })
                console.log('Error occurred during multi rejections:', error);
            }

        }
    }
    private async getLatestPTOData() {
        let EmployeePTO = [];
        try {

            let filterQuery = "EligibleforPTO eq 1 and IsActive eq 1";
            await sp.web.lists.getByTitle('EmployeePTO').items.top(5000).filter(filterQuery).select('Employee/Id,Employee/EMail,*').expand("Employee").getAll()
                .then((response) => {
                    EmployeePTO = response;
                }, (error) => {
                    console.log(error);
                    customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000);
                    this.setState({ loading: false })
                });
        }
        catch (e) {
            console.log(e);
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000);
            this.setState({ loading: false })
        }
        return EmployeePTO;
    }
    private async getItemStatusBeforeActionPerform(TimesheetID, OpenedTimeStatus) {
        let filterQuery = "ID eq '" + TimesheetID + "'";
        let data = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).select('Status').get();
        if (data.length == 1)
            return data[0].Status;
        else
            return OpenedTimeStatus;

    }
    //This function is used to get employee's corresponding week timeoffrequest
    private async getTimeOffItemDataByFromDate(FromDate, EmployeeId) {
        let TimeOff = [];
        if (![null, "", undefined].includes(FromDate)) {
            let prevDate = addDays(new Date(FromDate), -1);
            let nextDate = addDays(new Date(FromDate), 1);
            let prev = DateUtilities.getDateMMDDYYYY(prevDate);
            let next = DateUtilities.getDateMMDDYYYY(nextDate);
            let StatusfilterQuery = `(Status eq '${StatusType.Submit}' or Status eq '${StatusType.ManagerApprove}' or Status eq '${StatusType.ReviewerApprove}' or Status eq '${StatusType.Approved}')`;
            let filterQuery = `(From gt '${prev}' and From lt '${next}' and Employee/ID eq '${EmployeeId}' and IsActive eq 1) and ${StatusfilterQuery}`;
            let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
            try {
                TimeOff = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').getAll();
                return TimeOff;
            }
            catch (e) {
                console.log('Failed to get TimeOffRequest Data' + e);
            }
        }

    }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    private GetAllItemsStatusBeforeActionPerform = async () => {
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 60);
        let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        var filterQuery = "and WeekStartDate ge '" + date + "'"
        // var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"
        var filterString = "(AssignedTo/Id eq '" + userId + "' or ReportingManager/Id eq '" + userId + "') and PendingWith eq 'Manager'";
        let delegationQuery = "DelegateTo/Id eq '" + userId + "'"
        try {
            let [responseData, ManagerDelegations] = await Promise.all([
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString + filterQuery).expand("ReportingManager,Reviewers,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Reviewers/EMail,Reviewers/Id,Initiator/EMail,Initiator/Id,*').orderBy('WeekStartDate,DateSubmitted', false).get(),
                sp.web.lists.getByTitle('Delegations').items.filter(delegationQuery).expand("Authorizer,DelegateTo").select('Authorizer/Title,Authorizer/ID,DelegateTo/ID,*').orderBy('Authorizer/ID', false).get(),
            ])
            let managers = []
            for (const row of ManagerDelegations) {
                let isApplicable = this.showDelegatedRecords(row.From, row.To)
                if (isApplicable) {
                    managers.push(row)
                }
            }
            let getDelTSQry = '';
            if (managers.length) {
                if (managers.length > 1) {
                    getDelTSQry = '(';
                    for (const row of managers) {
                        getDelTSQry += ` (ReportingManager/Id eq '${row.Authorizer.ID}') or`;
                    }
                    getDelTSQry = getDelTSQry.substring(0, getDelTSQry.lastIndexOf(") or"));
                    getDelTSQry += ")) and PendingWith eq 'Manager'";
                }
                else {
                    getDelTSQry = `ReportingManager/Id eq '${managers[0].Authorizer.ID}' and PendingWith eq 'Manager'`;
                }
            }
            let delRmData = [];
            if (managers.length)
                delRmData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(getDelTSQry).expand("ReportingManager,Reviewers,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Reviewers/EMail,Reviewers/Id,Initiator/EMail,Initiator/Id,*').orderBy('WeekStartDate,DateSubmitted', false).get()

            let ItemsJustBeforeActionPerform = [];
            for (const d of responseData) {
                ItemsJustBeforeActionPerform.push({
                    Id: d.Id,
                    EmployeName: d.Name,
                    Status: d.Status,
                })
            }
            if (delRmData.length) {
                for (const d of delRmData) {
                    ItemsJustBeforeActionPerform.push({
                        Id: d.Id,
                        EmployeName: d.Name,
                        Status: d.Status,
                    })
                }
            }
            return ItemsJustBeforeActionPerform;
        }
        catch (error) {
            console.log("Sorry something went wrong!", error)
        }
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Date",
                selector: (row, i) => row.DateForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.DateForGrid }} onClick={(event) => this.handleRowClicked(event, row.Id)} />,
                // width: '100px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                // width: '250px',
                sortable: true
            },
            // {
            //     name: "Status",
            //     selector: (row, i) => row.Status,
            //     // width: '250px',
            //     sortable: true
            // },
            // {
            //     name: "Pending With",
            //     selector: (row, i) => row.PendingWith,
            //     // width: '250px',
            //     sortable: true
            // },
            {
                name: "Hours",
                selector: (row, i) => row.BillableTotalHrs,
                // width: '110px',
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                // width: '110px',
                sortable: true,
            },
            // {
            //     name: "Paid Time Off",
            //     selector: (row, i) => row.PTONewHrs,
            //     width: '130px',
            //     sortable: true,
            // },
            {
                name: "Holiday",
                selector: (row, i) => row.HolidayHrs,
                // width: '120px',
                sortable: true,
            },
            {
                name: "Time Off",
                selector: (row, i) => row.PTOHrs,
                // width: '120px',
                sortable: true,
            },
            {
                name: "Grand Total",
                selector: (row, i) => row.GrandTotal,
                // width: '130px',
                sortable: true
            }
        ];
        // const searchKeys=['Date','EmployeName','Status','PendingWith','BillableTotalHrs','OTTotalHrs','TotalBillableHrs','HolidayHrs','PTOHrs','GrandTotal'];
        const searchKeys = ['Date', 'EmployeName', 'BillableTotalHrs', 'OTTotalHrs', 'TotalBillableHrs', 'HolidayHrs', 'PTOHrs', 'GrandTotal'];
        if (this.state.redirect) {
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
            return (<Navigate to={url} />);
        }
        return (
            <React.Fragment>
                <ModalForwardApprovals changeEvent={this.handleChangeEvents} dropdownObject={this.state.DelegateToUsers} isVisible={this.state.showHideModal} message='Are you sure you want to forward the selected Timesheets?' modalHeader='modal-header-reject' onCancel={this.handleCancel} onConfirm={this.forwardApprovals} selectedValue={this.state.SelectedValue} title='' commentsValue={this.state.comments}></ModalForwardApprovals>
                {/* Popup for Multi Approve/Reject */}
                <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showApproveRejectPopup} isSuccess={this.state.isSuccess} isManager={true} onConfirm={this.handleApproveReject} onCancel={this.closeApproveRejectPopup} comments={this.handleChangeEvents} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} modalHeader={this.state.ModalHeader} IsClientApprovalNeed={false}></ModalApprovePopUp>
                <div>
                    <div className='MultiRow-Select'>
                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.ReportingManager} fileName={''} showExportExcel={false}
                            showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='' btnCaption='' btnTitle='Forward Approvals' searchBoxLeft={true} selectableRows={this.state.ReportingManager.length > 0 ? true : false} clearSelectedRows={this.state.clearRows} handleSelectedRows={this.getSelectedRows} customButton={false} showMultiApproveOrReject={this.state.SelectedRows.length > 0 ? true : false} onClickApproveOrReject={this.showConfirmApproveRejectPopup} customButtonClick={this.ShowPopUp} onRowClick={this.handleRowClicked}></TableGenerator>
                    </div>
                    {/*selectableRows={this.state.ReportingManager.length>0?true:false} replace this to show delegations */}
                </div>
                <Toaster />
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default ApproversApprovals