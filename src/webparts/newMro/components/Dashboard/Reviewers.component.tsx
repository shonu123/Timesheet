import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import DateUtilities from '../../Utilities/DateUtilities';

export interface ReviewerApprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ReviewerApprovalsState {
    Reviewers: any;
    loading: boolean;
    message: string;
    title: string;
    showHideModal: boolean;
    isSuccess: boolean;
    comments: string;
    Action: string;
    errorMessage: string;
    ItemID: Number;
    siteURL: string;
    modalTitle: string;
    modalText: string;
    successPopUp: boolean;
    ModalHeader: string;
    IsClientApprovalNeed: boolean;
    ExportExcelData: any;
    currentTimesheetStatus: string;
    TimesheetID: string;
    TimeOffRecord: any;
    userGroups: any;
    redirect: boolean;
}

class ReviewerApprovals extends React.Component<ReviewerApprovalsProps, ReviewerApprovalsState> {
    constructor(props: ReviewerApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = { Reviewers: [], loading: false, message: '', title: '', showHideModal: false, isSuccess: false, comments: '', Action: '', errorMessage: '', ItemID: 0, siteURL: this.props.spContext.webAbsoluteUrl, modalTitle: '', modalText: '', successPopUp: false, ModalHeader: 'modal-header-Approve', IsClientApprovalNeed: false, ExportExcelData: [], currentTimesheetStatus: '', TimesheetID: '', TimeOffRecord: [], userGroups: [], redirect: false, };
    }

    public componentDidMount() {
        this.ReviewerApproval();
    }

    private showDelegatedRecords(startDate, endDate) {
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

    // this function is used to get 1 month records of weeklytime data of the employees who's Reviewer is current logged in user from weeklytimesheet list
    private ReviewerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 60);
        let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        var filterQuery = " and WeekStartDate ge '" + date + "'";

        // var filterString = "Reviewers/Id eq '"+userId+"' and PendingWith eq 'Reviewer' and Status eq '"+StatusType.ManagerApprove+"'"
        var filterString = `(((AssignedTo/Id eq '${userId}' or Reviewers/Id eq '${userId}') and Status eq '${StatusType.ManagerApprove}' and PendingWith eq 'Reviewer') or (Status eq '${StatusType.ReviewerApprove}' and PendingWith eq 'HR'))`;
        let delegationQuery = "DelegateTo/Id eq '" + userId + "'";
        try {
            let [groups, responseData, ManagerDelegations] = await Promise.all([
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterString).expand("Reviewers,Initiator").select('Reviewers/Title,Initiator/Id,Initiator/Title,Initiator/EMail,*').orderBy('WeekStartDate,Modified', false).get(),
                sp.web.lists.getByTitle('Delegations').items.filter(delegationQuery).expand("Authorizer,DelegateTo").select('Authorizer/Title,Authorizer/ID,DelegateTo/ID,*').orderBy('Authorizer/ID', false).get(),
            ]);
            let userGroups = [];
            groups.forEach(grp => userGroups.push(grp.Title));
            //filter pending with hr timesheets, if loged in person is HR
            if (!userGroups.includes('Timesheet HR')) {
                responseData = responseData.filter(rec => !(rec.PendingWith == 'HR'));
            }
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
                        getDelTSQry += ` (Reviewers/Id eq '${row.Authorizer.ID}') or`;
                    }
                    getDelTSQry = getDelTSQry.substring(0, getDelTSQry.lastIndexOf(") or"));
                    getDelTSQry += ")) and PendingWith eq 'Reviewer'";
                }
                else {
                    getDelTSQry = `Reviewers/Id eq '${managers[0].Authorizer.ID}' and PendingWith eq 'Reviewer'`;
                }
            }
            let delRmData = [];
            if (managers.length)
                delRmData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(getDelTSQry).expand("ReportingManager,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Initiator/Id,Initiator/Title,Initiator/EMail,*').orderBy('WeekStartDate,DateSubmitted', false).get()

            let Data = [];
            for (const d of responseData) {
                let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate))
                let isBillable = true;
                if (d.ClientName.toLowerCase().includes('synergy')) {
                    isBillable = false
                }
                Data.push({
                    Id: d.Id,
                    Date: DateUtilities.getDateMMDDYYYY(date),
                    DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                    EmployeName: d.Initiator.Title,
                    PendingWith: d.PendingWith,
                    Status: this.getStatus(d.Status),
                    BillableHrs: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                    OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                    TotalBillableHours: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                    // NonBillableTotalHrs: d.NonBillableTotalHrs,
                    HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                    PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(4)),
                    PTORow: JSON.parse(d.PTOHrs),
                    GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                    Client: d.ClientName,
                    EmployeeEmail: d.Initiator.EMail,
                    EmployeeId: d.Initiator.Id,
                    //ReportingManagerEmails: d.ReportingManager.map(e => e.EMail),
                    commentsObj: JSON.parse(d.CommentsHistory),
                    //SynergyOfficeHrs: d.SynergyOfficeHrs,
                    //ClientHolidayHrs: d.ClientHolidayHrs,
                    EligibleforPTO: d.EligibleforPTO,
                    //PTONewHrs:d.EligibleforPTO?parseFloat(parseFloat(JSON.parse(d.PTONewHrs)[0].Total).toFixed(2)):'NA',
                })
            }
            // this.setState({ExportExcelData:Data})
            // console.log(Data);

            if (delRmData.length) {
                for (const d of delRmData) {
                    let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate))
                    let isBillable = true;
                    if (d.ClientName.toLowerCase().includes('synergy')) {
                        isBillable = false;
                    }
                    // var managerEmails = []
                    // for (const e of d.ReportingManager) {
                    //     managerEmails.push(e.EMail)
                    // }
                    if (Data.findIndex(item => item.Id == d.Id) === -1) {
                        Data.push({
                            Id: d.Id,
                            Date: DateUtilities.getDateMMDDYYYY(date),
                            DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                            EmployeName: d.Initiator.Title,
                            PendingWith: d.PendingWith,
                            Status: this.getStatus(d.Status),
                            BillableHrs: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                            OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                            TotalBillableHours: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                            // NonBillableTotalHrs: d.NonBillableTotalHrs,
                            HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                            PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(4)),
                            PTORow: JSON.parse(d.PTOHrs),
                            GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                            Client: d.ClientName,
                            EmployeeEmail: d.Initiator.EMail,
                            EmployeeId: d.Initiator.Id,
                            //ReportingManagerEmails: d.ReportingManager.map(e => e.EMail),
                            commentsObj: JSON.parse(d.CommentsHistory),
                            //SynergyOfficeHrs: d.SynergyOfficeHrs,
                            //ClientHolidayHrs: d.ClientHolidayHrs,
                            EligibleforPTO: d.EligibleforPTO,
                            //PTONewHrs:d.EligibleforPTO?parseFloat(parseFloat(JSON.parse(d.PTONewHrs)[0].Total).toFixed(2)):'NA',
                        })
                    }
                }
            }
            this.setState({ Reviewers: Data, ExportExcelData: Data, userGroups: userGroups, loading: false });
        }
        catch (error) {
            console.log("Sorry something went wrong!", error);
        }
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
        return Status
    }
    //this function is used to send Email
    private sendemail(emaildetails, modalTitle, modalText) {
        sp.utility.sendEmail({
            Body: emaildetails.body,
            Subject: emaildetails.subject,
            To: emaildetails.toemail,
            CC: emaildetails.ccemail
        }).then((i) => {
            this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: modalTitle });
            customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Reject.toLowerCase() + ' succesfully', 2000);
            this.ReviewerApproval();
        }).catch((i) => {
            this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Email sending failed', modalText: 'Something went wrong please try again' });
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            console.log(i)
        });
    }
    // this function is used to prepare Email body in table formate
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
    // this function is used to reload the data after Approve/Reject is done
    private navigateAfterAction = () => {
        this.setState({ successPopUp: false });
        this.ReviewerApproval();
    }
    // This function is used to bind comments to comments input feild
    private handleComments = async (e) => {
        let value = e.target.type == 'checkbox' ? e.target.checked : e.target.value;
        //    console.log(value);
        let { name } = e.target;
        if (name == "comments")
            this.setState({ comments: value })
        else if (name == "IsClientApprovalNeed")
            this.setState({ IsClientApprovalNeed: value })

    }
    //This function is used to close popup
    private handlefullClose = () => {
        this.setState({ showHideModal: false, Action: '', errorMessage: '', ItemID: 0, comments: '' });
    }

    // This function is used to Display confirm popup based on Approve/Reject
    private showConfirmApproveRejectPopup = async (e) => {
        // console.log(e.target.id);
        // console.log(e.target.dataset);
        // console.log(e.target.dataset.name)
        let recordId = parseInt(e.target.id);
        this.setState({ ItemID: recordId })
        let name = e.target.dataset.name;
        //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR :START
        let selRecord = this.state.Reviewers.find(item => item.Id == e.target.id);
        let TimeOffRec = await this.getTimeOffItemDataByFromDate(selRecord.Date, selRecord.EmployeeId);
        // if(name == 'Approve')
        //     {
        //     //   if(selRecord.EligibleforPTO || (TimeOffRec.length && TimeOffRec[0].TimeOffRows.toLowerCase().includes('bereavement'))) // restrict only if employee eligible for PTO or utilizing bereavement time off 
        //     let filteredTimeOff=TimeOffRec.find(i=>i.Status!=StatusType.Approved && (!i.IsSubmittedFromTimesheetForm || (i.IsSubmittedFromTimesheetForm && selRecord.EligibleforPTO && !this.state.userGroups.includes('Timesheet HR'))) && (JSON.stringify(i.TimeOffRows).toLowerCase().includes('bereavement') || JSON.stringify(i.TimeOffRows).toLowerCase().includes('jury duty')));
        //       if(TimeOffRec.length && filteredTimeOff) // restrict if timeoff utilized, for both PTO and Non PTO employees
        //      {
        //          let HoldMsg="'Time off request' pending with approval. Cannot approve";
        //         // if(!selRecord.EligibleforPTO)
        //         // HoldMsg="'Bereavement (BV)' time off request pending with HR approval. Cannot approve"; 
        //         //if(TimeOffRec[0].Status!=StatusType.Approved)
        //         //{
        //             customToaster('toster-warning', ToasterTypes.Warning,HoldMsg, 4000); 
        //             return false;
        //         //}
        //      }
        //    }
        //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR:END
        if (name == 'Approve') {
            this.setState({ message: 'Are you sure you want to approve?', title: 'Approve', Action: 'Approve', showHideModal: true, isSuccess: true, ModalHeader: 'modal-header-Approve', TimeOffRecord: TimeOffRec });
            //this.setState({showHideModal : true,isSuccess:true,ModalHeader:'modal-header-Approve'})
            // this.setState({showHideModal : true,isSuccess:true,ModalHeader:'modal-header-reject'})
        }
        else if (name == 'Reject') {
            this.setState({ message: 'Are you sure you want to reject?', title: 'Reject', Action: StatusType.Reject, showHideModal: true, isSuccess: false, ModalHeader: 'modal-header-reject', TimeOffRecord: TimeOffRec });
            //this.setState({showHideModal : true,isSuccess:false,ModalHeader:'modal-header-reject'})
        }
        else {
            this.setState({ showHideModal: false, TimeOffRecord: [] });
        }
    }
    //This function is used to get employee's corresponding week timeoffrequest
    private async getTimeOffItemDataByFromDate(FromDate, EmployeeId) {
        let TimeOff = [];
        if (![null, "", undefined].includes(FromDate)) {
            let prevDate = addDays(new Date(FromDate), -1);
            let nextDate = addDays(new Date(FromDate), 1);
            let prev = DateUtilities.getDateMMDDYYYY(FromDate);
            let next = DateUtilities.getDateMMDDYYYY(nextDate);
            let WeekEndDate = DateUtilities.getDateMMDDYYYY(addDays(new Date(FromDate), 6));
            let StatusfilterQuery = `(Status eq '${StatusType.Submit}' or Status eq '${StatusType.ManagerApprove}' or Status eq '${StatusType.ReviewerApprove}' or Status eq '${StatusType.Approved}')`;
            let filterQuery = `(From le '${WeekEndDate}' and To ge '${prev}' and Employee/ID eq '${EmployeeId}' and IsActive eq 1) and ${StatusfilterQuery}`;
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
    //this function calls handleApprove/handleReject function based on the user action
    private handleApproveReject = (e) => {
        if (this.state.Action == "Approve")
            this.handleApprove(e);
        else
            this.handleReject(e);
    }
    // this function is used to get current records data and then update the status of the time sheet to Approved
    private handleApprove = async (e) => {
        let recordId = this.state.ItemID;
        var filterString = "Id eq '" + recordId + "'";
        this.setState({ showHideModal: false, loading: true });
        let selectQueryPTOTransaction = "Employee/Id,Employee/Title,*";
        // let filterPTOTransactionQuery = "TimesheetID eq '"+recordId+"' and IsActive eq 1";
        let TimeOffRecordID = this.state.TimeOffRecord.length ? this.state.TimeOffRecord[0].Id : 0;
        let filterPTOTransactionQuery = `TimeOffID eq '${TimeOffRecordID}' and IsActive eq 1`;
        // let data = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').get()
        let [data, PTOTransactionRecords] = await Promise.all([
            sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').get(),
            sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter(filterPTOTransactionQuery).select(selectQueryPTOTransaction).orderBy('PostedOn', false).getAll()
        ])
        let InitialRecord = this.state.Reviewers.filter(record => {
            if (recordId == record.Id) return record
        }
        )
        if (InitialRecord[0].Status != this.getStatus(data[0].Status)) {
            customToaster('toster-warning', ToasterTypes.Warning, "Attention: This timesheet has been modified. Please review the changes.", 3000);
            this.setState({ showHideModal: false, isSuccess: true, ModalHeader: '', comments: '', IsClientApprovalNeed: false });
            this.ReviewerApproval();
            return false;
        }
        let commentsObj = JSON.parse(data[0].CommentsHistory);
        commentsObj.push({
            Action: StatusType.Approved, Role: 'Reviewer', User: this.props.spContext.userDisplayName, Comments: this.state.comments,
            Date: new Date().toISOString()
        })
        commentsObj = JSON.stringify(commentsObj);
        let postObject = {
            Status: StatusType.Approved,
            CommentsHistory: commentsObj,
            PendingWith: 'NA',
            IsClientApprovalNeed: this.state.IsClientApprovalNeed,
            Revised: true,
            AssignedToId: { "results": [] },
        }
        //Below is commented as per new requirement on 09/Dec/2025: Timesheet approval for HR is not required, instead it goes to Approved directly after Manager approval if RM and Reviewer are same. after complete approval of TimeOff Rec from Time Off Dashboard otherwise holds with toaster message.
        //  if(this.state.TimeOffRecord.length && this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm && InitialRecord[0].EligibleforPTO  && !this.state.userGroups.includes('Timesheet HR'))
        // {
        //     postObject.Status=StatusType.ReviewerApprove;
        //     postObject.PendingWith='HR';
        // }
        let PTOData = {};
        // let PTOTransaction={};
        let TimeOffPostData = {};
        let PTOHrs = InitialRecord[0].PTORow[0].Total;
        // if(parseFloat(InitialRecord[0].PTORow[0].PTOAfterDeduction)<0)
        //    PTOHrs=parseFloat(InitialRecord[0].PTORow[0].Total)+parseFloat(InitialRecord[0].PTORow[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs
        if (this.state.TimeOffRecord.length) {
            PTOHrs = this.state.TimeOffRecord[0].PTOTotal;// PTO hours geting from TimeOff Record
            let timeOffCommentsObj = JSON.parse(this.state.TimeOffRecord[0].CommentsHistory);
            timeOffCommentsObj.push({ Action: StatusType.Approved, Role: "Reviewer", User: this.props.spContext.userDisplayName, Comments: this.state.comments, Date: new Date().toISOString() });
            TimeOffPostData =
            {
                CommentsHistory: JSON.stringify(timeOffCommentsObj),
                Status: StatusType.Approved,
                PendingWith: "NA"
            }
            //Below is commented as per new requirement on 09/Dec/2025: Timesheet approval for HR is not required, instead it goes to Approved directly after Manager approval if RM and Reviewer are same. after complete approval of TimeOff Rec from Time Off Dashboard otherwise holds with toaster message.
            //  if(this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm && InitialRecord[0].EligibleforPTO && !this.state.userGroups.includes('Timesheet HR'))
            // {
            //     TimeOffPostData['Status']=StatusType.ReviewerApprove;
            //     TimeOffPostData['PendingWith']='HR';
            // }
        }
        let currentEmployeePTO = await sp.web.lists.getByTitle('EmployeePTO').items.filter("Employee/Id eq " + InitialRecord[0].EmployeeId + " and Year eq " + new Date(InitialRecord[0].Date).getFullYear() + " and IsActive eq 1").select('Employee/Id,Employee/EMail,*').expand("Employee").getAll(); // Regarding PTO
        if (currentEmployeePTO.length && InitialRecord[0].EligibleforPTO && InitialRecord[0].PTOHrs != 0 && parseFloat(PTOHrs) > 0) {
            //  PTOTransaction={
            //     EmployeeId:InitialRecord[0].EmployeeId,
            //     TransactionType:StatusType.Approved,
            //     PostedOn:new Date(),
            //     From:this.addBrowserwrtServer(new Date(InitialRecord[0].Date)),
            //     To:this.addBrowserwrtServer(addDays(new Date(InitialRecord[0].Date),6)),
            //     Hours:parseFloat(PTOHrs).toFixed(4),
            //     Reason:this.state.comments.trim(),
            //     Year:new Date(InitialRecord[0].Date).getFullYear().toString()
            //  }
            PTOData = {
                PTOBalance: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalance) ? 0 : currentEmployeePTO[0].PTOBalance) - parseFloat(PTOHrs)).toFixed(4),
                PTOApplied: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4),
                PTOAvailed: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOAvailed) ? 0 : currentEmployeePTO[0].PTOAvailed) + parseFloat(PTOHrs)).toFixed(4),
            }
        }
        this.setState({ comments: '' })
        const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO Transaction
        let Transaction = {
            TransactionType: StatusType.Approved
        };
        //Below is commented as per new requirement on 09/Dec/2025: Timesheet approval for HR is not required, instead it goes to Approved directly after Manager approval if RM and Reviewer are same. after complete approval of TimeOff Rec from Time Off Dashboard otherwise holds with toaster message.
        //  if(this.state.TimeOffRecord.length && this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm && InitialRecord[0].EligibleforPTO && !this.state.userGroups.includes('Timesheet HR'))
        //     {
        //         Transaction['TransactionType']=StatusType.ReviewerApprove;
        //     }
        if (this.state.TimeOffRecord.length && this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm && !this.state.userGroups.includes('Timesheet HR') && (JSON.stringify(this.state.TimeOffRecord[0].TimeOffRows).toLowerCase().includes('bereavement') || JSON.stringify(this.state.TimeOffRecord[0].TimeOffRows).toLowerCase().includes('jury duty'))) {
            postObject.Status = StatusType.ReviewerApprove;
            postObject.PendingWith = 'HR';
            TimeOffPostData['Status'] = StatusType.ReviewerApprove;
            TimeOffPostData['PendingWith'] = 'HR';
            Transaction['TransactionType'] = StatusType.ReviewerApprove;
        }

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(data[0].Id).update(postObject).then(async (res) => {
            // to update Employee PTO
            //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
            if (InitialRecord[0].PTOHrs != 0 && this.state.TimeOffRecord.length && this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm) {
                // if(currentEmployeePTO.length && InitialRecord[0].EligibleforPTO && parseFloat(PTOHrs)>0 && [StatusType.Approved].includes(postObject.Status) && this.state.userGroups.includes('Timesheet HR'))
                if (currentEmployeePTO.length && InitialRecord[0].EligibleforPTO && parseFloat(PTOHrs) > 0 && [StatusType.ReviewerApprove, StatusType.Approved].includes(postObject.Status)) {
                    sp.web.lists.getByTitle('EmployeePTO').items.getById(currentEmployeePTO[0].Id).inBatch(PTOTransactionBatch).update(PTOData);//PTO update
                    PTOTransactionRecords.forEach(pto => {
                        sp.web.lists.getByTitle('PTOTransactions').items.getById(pto.ID).inBatch(PTOTransactionBatch).update(Transaction);//Transactions update
                    });
                }
                sp.web.lists.getByTitle('TimeOffEmployees').items.getById(TimeOffRecordID).inBatch(PTOTransactionBatch).update(TimeOffPostData);//TimeOff update

                Promise.all([PTOTransactionBatch.execute()]).then((resPTOTranc) => {
                    this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record approved successfully' });
                    customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Approved.toLowerCase() + ' succesfully', 2000);
                    this.ReviewerApproval();
                }).catch(err => {
                    console.log('Error while updating PTO and PTO transaction.', err);
                });
            }
            else {
                this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record approved successfully' });
                customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Approved.toLowerCase() + ' succesfully', 2000);
                this.ReviewerApproval();
            }
        }).catch(err => {
            console.log('Failed to fetch data.', err);
        });
    }
    // private handleApprove = async (e) => {

    //     let recordId = this.state.ItemID;
    //     var filterString = "Id eq '"+recordId+"'"
    //     this.setState({ loading: true });
    //     let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').get()
    //     // console.log(data)

    //    let InitialRecord =  this.state.Reviewers.filter(record => { 
    //     if (recordId == record.Id) return record }
    // )

    // if(InitialRecord[0].Status != this.getStatus(data[0].Status)){
    //     customToaster('toster-warning', ToasterTypes.Warning,"Attention: This PTO has been modified. Please review the changes.", 3000);
    //     this.setState({showHideModal : false,isSuccess:true,ModalHeader:'',comments:'',IsClientApprovalNeed:false})
    //     this.ReviewerApproval();
    //     return false
    // }
    //     let commentsObj = JSON.parse(data[0].CommentsHistory)
    //     if(commentsObj == null)
    //     commentsObj = [];
    //     commentsObj.push({
    //         Action : StatusType.Approved,
    //         Role : 'Reviewer',
    //         User : this.props.spContext.userDisplayName,
    //         Comments : this.state.comments,
    //         Date : new Date().toISOString()
    //     })
    //     commentsObj = JSON.stringify(commentsObj);
    //     // var filterString = "Initiator/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
    //     var selectString = 'Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,*'
    //     let emailData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select(selectString).expand('Initiator,Reviewers,ReportingManager,DelegateTo').get();
    //     // console.log(emailData)
    //     let toEmail = [];
    //     let ccEmail = [];
    //     toEmail.push(emailData[0].Initiator.EMail);
    //     // let approvers = emailData[0].ReportingManager
    //     let isDeligated = emailData[0].IsDelegated
    //     let approvers;
    //     isDeligated?emailData[0].DelegateTo:approvers = emailData[0].ReportingManager

    //     for (const user of approvers) {
    //         if(!ccEmail.includes(user.EMail))
    //         ccEmail.push(user.EMail);
    //     }
    //     //---------Notofiers------------------
    //     // let notifires = emailData[0].Notifiers
    //     // for (const user of notifires) {
    //     //     if(!toEmail.includes(user.EMail))
    //     //     toEmail.push(user.EMail);
    //     // }----------------------------------
    //     let reviewers = emailData[0].Reviewers
    //     for (const user of reviewers) {
    //         if(!toEmail.includes(user.EMail))
    //         toEmail.push(user.EMail);
    //     }
    //     // this.setState({comments : comments })
    //     let date = new Date(data[0].DateSubmitted.split('-')[1]+'/'+data[0].DateSubmitted.split('-')[2].split('T')[0]+'/'+data[0].DateSubmitted.split('-')[0])
    //     let tableContent = {'Name':data[0].Name,'Client':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Total Hours':data[0].GrandTotal}
    //     // console.log(tableContent)
    //     this.updateStatus(recordId,StatusType.Approved,commentsObj,toEmail,ccEmail,tableContent)
    // }
    // this function is used to get current records data and then update the status of the time sheet to Reject
    private handleReject = async (e) => {

        let recordId = this.state.ItemID;
        if (['', undefined, null].includes(this.state.comments.trim())) {
            this.setState({ loading: false });
            document.getElementById('txtComments').focus();
            document.getElementById('txtComments').classList.add('mandatory-FormContent-focus');
            customToaster('toster-error', ToasterTypes.Error, 'Comments cannot be Blank.', 4000);
        }
        else {
            var filterString = "Id eq '" + recordId + "'";
            this.setState({ showHideModal: false, successPopUp: false, loading: true });
            // let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').orderBy('WeekStartDate,DateSubmitted', false).get()
            let selectQueryPTOTransaction = "Employee/Id,Employee/Title,*";
            // let filterPTOTransactionQuery = "TimesheetID eq '"+recordId+"' and IsActive eq 1";
            let TimeOffRecordID = this.state.TimeOffRecord.length ? this.state.TimeOffRecord[0].Id : 0;
            let filterPTOTransactionQuery = `TimeOffID eq '${TimeOffRecordID}' and IsActive eq 1`;
            let [data, PTOTransactionRecords] = await Promise.all([
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').orderBy('WeekStartDate,DateSubmitted', false).get(),
                sp.web.lists.getByTitle('PTOTransactions').items.expand('Employee').filter(filterPTOTransactionQuery).select(selectQueryPTOTransaction).orderBy('PostedOn', false).getAll()
            ])
            let InitialRecord = this.state.Reviewers.filter(record => {
                if (recordId == record.Id) return record
            }
            )
            if (InitialRecord[0].Status != this.getStatus(data[0].Status)) {
                customToaster('toster-warning', ToasterTypes.Warning, "Attention: This timesheet has been modified. Please review the changes.", 3000);
                this.setState({ showHideModal: false, isSuccess: true, ModalHeader: '', comments: '', IsClientApprovalNeed: false });
                this.ReviewerApproval();
                return false;
            }
            let commentsObj = JSON.parse(data[0].CommentsHistory);
            let postObject = {
                PendingWith: 'Initiator',
                IsClientApprovalNeed: this.state.IsClientApprovalNeed,
                Revised: true,
                AssignedToId: { "results": [InitialRecord[0].EmployeeId] }
            }
            if (InitialRecord[0].Status == this.getStatus(StatusType.ManagerApprove)) {
                commentsObj.push({ "Action": StatusType.Reject, "Role": "Reviewer", "User": this.props.spContext.userDisplayName, "Comments": this.state.comments.trim(), "Date": new Date().toISOString() })
                postObject['Status'] = StatusType.ReviewerReject;
                postObject['CommentsHistory'] = JSON.stringify(commentsObj);
            }
            else if (InitialRecord[0].Status == this.getStatus(StatusType.ReviewerApprove)) {
                commentsObj.push({ "Action": StatusType.Reject, "Role": "HR", "User": this.props.spContext.userDisplayName, "Comments": this.state.comments.trim(), "Date": new Date().toISOString() })
                postObject['Status'] = StatusType.HRReject;
                postObject['CommentsHistory'] = JSON.stringify(commentsObj);
            }
            let PTOData = {};
            // let PTOTransaction={};
            let TimeOffPostData = {};
            let PTOHrs = InitialRecord[0].PTORow[0].Total;
            // if(parseFloat(InitialRecord[0].PTORow[0].PTOAfterDeduction)<0)
            // PTOHrs=parseFloat(InitialRecord[0].PTORow[0].Total)+parseFloat(InitialRecord[0].PTORow[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs
            if (this.state.TimeOffRecord.length) {
                PTOHrs = this.state.TimeOffRecord[0].PTOTotal;// PTO hours geting from TimeOff Record
                let timeOffCommentsObj = JSON.parse(this.state.TimeOffRecord[0].CommentsHistory);
                timeOffCommentsObj.push({ Action: StatusType.Reject, Role: InitialRecord[0].Status == this.getStatus(StatusType.ManagerApprove) ? "Reviewer" : "HR", User: this.props.spContext.userDisplayName, Comments: this.state.comments, Date: new Date().toISOString() });
                TimeOffPostData =
                {
                    CommentsHistory: JSON.stringify(timeOffCommentsObj),
                    Status: InitialRecord[0].Status == this.getStatus(StatusType.ManagerApprove) ? StatusType.ReviewerReject : StatusType.HRReject,
                    PendingWith: 'Initiator',
                }
            }
            let currentEmployeePTO = await sp.web.lists.getByTitle('EmployeePTO').items.filter("Employee/Id eq " + InitialRecord[0].EmployeeId + " and Year eq " + new Date(InitialRecord[0].Date).getFullYear() + " and IsActive eq 1").select('Employee/Id,Employee/EMail,*').expand("Employee").getAll();
            ; // Regarding PTO
            if (currentEmployeePTO.length && InitialRecord[0].EligibleforPTO && InitialRecord[0].PTOHrs != 0 && parseFloat(PTOHrs) > 0) {
                //  PTOTransaction={
                //     EmployeeId:InitialRecord[0].EmployeeId,
                //     TransactionType:StatusType.ReviewerReject,
                //     PostedOn:new Date(),
                //     From:this.addBrowserwrtServer(new Date(InitialRecord[0].Date)),
                //     To:this.addBrowserwrtServer(addDays(new Date(InitialRecord[0].Date),6)),
                //     Hours:parseFloat(PTOHrs).toFixed(4),
                //     Reason:this.state.comments.trim(),
                //     Year:new Date(InitialRecord[0].Date).getFullYear().toString()
                //  }
                PTOData = {
                    PTOBalanceAfterDeduction: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? 0 : currentEmployeePTO[0].PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4),
                    PTOApplied: (parseFloat([null, undefined, ''].includes(currentEmployeePTO[0].PTOApplied) ? 0 : currentEmployeePTO[0].PTOApplied) - parseFloat(PTOHrs)).toFixed(4)
                }
                TimeOffPostData['PreviousPTOBalance'] = parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(PTOHrs)).toFixed(4)).toString();
                TimeOffPostData['CurrentPTOBalance'] = PTOData['PTOBalanceAfterDeduction'];
            }
            this.setState({ comments: '' });
            const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO Transaction
            let Transaction = {
                TransactionType: StatusType.Reject
            }

            sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(data[0].Id).update(postObject).then(async (res) => {
                // to update Employee PTO
                //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                if (InitialRecord[0].PTOHrs != 0 && this.state.TimeOffRecord.length && this.state.TimeOffRecord[0].IsSubmittedFromTimesheetForm && [StatusType.Submit,StatusType.ReviewerApprove].includes(this.state.TimeOffRecord[0].Status)) {
                    if (currentEmployeePTO.length && InitialRecord[0].EligibleforPTO && parseFloat(PTOHrs) > 0) {
                        sp.web.lists.getByTitle('EmployeePTO').items.getById(currentEmployeePTO[0].Id).inBatch(PTOTransactionBatch).update(PTOData);//PTO update
                        PTOTransactionRecords.forEach(pto => {
                            sp.web.lists.getByTitle('PTOTransactions').items.getById(pto.ID).inBatch(PTOTransactionBatch).update(Transaction);//Transactions update
                        });
                    }
                    sp.web.lists.getByTitle('TimeOffEmployees').items.getById(TimeOffRecordID).inBatch(PTOTransactionBatch).update(TimeOffPostData);//TimeOff update

                    Promise.all([PTOTransactionBatch.execute()]).then((resPTOTranc) => {
                        this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record rejected successfully' });
                        customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Reject.toLowerCase() + ' succesfully', 2000);
                        this.ReviewerApproval();
                    }).catch(err => {
                        console.log('Error while adding PTO transaction.', err);
                    });
                }
                else {
                    this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record rejected successfully' });
                    customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Reject.toLowerCase() + ' succesfully', 2000);
                    this.ReviewerApproval();
                }
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
        }
    }
    // private handleReject= async (e) =>{

    //     let recordId = this.state.ItemID;
    //     if(['',undefined,null].includes(this.state.comments.trim())){
    //         // this.setState({errorMessage : 'Comments cannot be Blank',loading : false})
    //         this.setState({loading:false})
    //         customToaster('toster-error',ToasterTypes.Error,'Comments cannot be Blank.',4000)
    //     }
    //     else{
    //         var filterString = "Id eq '"+recordId+"'"
    //         this.setState({showHideModal:false, successPopUp:false,loading: true });
    //         let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').orderBy('WeekStartDate,DateSubmitted', false).get()

    //         let InitialRecord =  this.state.Reviewers.filter(record => { 
    //             if (recordId == record.Id) return record }
    //         )       
    //         if(InitialRecord[0].Status != this.getStatus(data[0].Status)){
    //             customToaster('toster-warning', ToasterTypes.Warning,"Attention: This PTO has been modified. Please review the changes.", 3000);
    //             this.setState({showHideModal : false,isSuccess:true,ModalHeader:'',comments:'',IsClientApprovalNeed:false})
    //             this.ReviewerApproval();
    //             return false
    //         } 
    //         // console.log(data)
    //         let commentsObj = JSON.parse(data[0].CommentsHistory)
    //         commentsObj.push({
    //             Action : StatusType.Reject,
    //             Role : 'Reviewer',
    //             User : this.props.spContext.userDisplayName,
    //             Comments : this.state.comments,
    //             Date : new Date().toISOString()
    //         })
    //         commentsObj = JSON.stringify(commentsObj);
    //         // var filterString = "Initiator/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
    //         var selectString = 'Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,*'
    //         let emailData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select(selectString).expand('Initiator,Reviewers,ReportingManager,DelegateTo').get();
    //         // console.log(emailData)
    //         let toEmail = [];
    //         let ccEmail = [];
    //         let isDeligated = emailData[0].IsDelegated
    //         toEmail.push(emailData[0].Initiator.EMail);
    //         let approvers;
    //         isDeligated?emailData[0].DelegateTo:approvers = emailData[0].ReportingManager
    //         if(this.state.IsClientApprovalNeed){
    //             for (const user of approvers) {
    //                 if(!ccEmail.includes(user.EMail))
    //                 ccEmail.push(user.EMail);
    //             }
    //         }
    //         // let notifires = emailData[0].Notifiers
    //         // for (const user of notifires) {
    //         //     if(!toEmail.includes(user.EMail))
    //         //     toEmail.push(user.EMail);
    //         // }
    //         let reviewers = emailData[0].Reviewers
    //         for (const user of reviewers) {
    //             if(!toEmail.includes(user.EMail))
    //             toEmail.push(user.EMail);
    //         }
    //         // this.setState({comments : comments })
    //         let tableContent = {}
    //         let date = new Date(data[0].DateSubmitted.split('-')[1]+'/'+data[0].DateSubmitted.split('-')[2].split('T')[0]+'/'+data[0].DateSubmitted.split('-')[0])
    //         if(data[0].ClientName.toLowerCase().includes("synergy")){
    //             tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Office Hours':JSON.parse(data[0].SynergyOfficeHrs)[0].Total,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal,'Comments':this.state.comments}
    //         }
    //         else{
    //             tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal,'Comments':this.state.comments}
    //         }
    //         // console.log(tableContent)

    //         this.updateStatus(recordId,StatusType.ReviewerReject,commentsObj,toEmail,ccEmail,tableContent)
    //     }
    // }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    // this function is used to update the weekly time sheet when Reviewer Approves/Rejects
    private updateStatus = async (recordId, Status, Comments, To, CC, tableContent) => {
        let clinetApproval = this.state.IsClientApprovalNeed
        let postObject = {
            Status: Status,
            CommentsHistory: Comments,
            PendingWith: Status == StatusType.Approved ? 'NA' : 'Initiator',
            IsClientApprovalNeed: clinetApproval,
            Revised: true,
        }
        // console.log(postObject);
        this.setState({ comments: '' })

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(recordId).update(postObject).then((res) => {
            if (Status == StatusType.Approved) {
                this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record approved successfully' });
                customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Approved.toLowerCase() + ' succesfully', 2000);
            }
            else {
                this.setState({ showHideModal: false, ItemID: 0, message: '', title: '', Action: '', loading: false, successPopUp: false, modalTitle: 'Record rejected successfully' });
                customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Reject.toLowerCase() + ' succesfully', 2000);
            }
            this.ReviewerApproval();
            // let sub=''; 
            // if(Status==StatusType.Approved){
            //     sub = "Weekly Time Sheet has been "+StatusType.ReviewerApprove+"."
            //     // this.setState({ModalHeader:'modal-header-Approve'})
            // }
            // else{
            //     sub = "Weekly Time Sheet has been "+StatusType.ReviewerReject+". Please re-submit with necessary details."
            // }

            // let emaildetails ={toemail:To,ccemail:CC,subject:sub,bodyString:sub,body:'' };
            //  let table = tableContent;
            //  var DashboardURl = this.state.siteURL+'/SitePages/TimeSheet.aspx';
            //  emaildetails.body = this.emailBodyPreparation(this.state.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,table,emaildetails.bodyString,this.props.spContext.userDisplayName,DashboardURl);
            //  if(Status == StatusType.Approved)
            //  this.sendemail(emaildetails,'Success','Record approved successfully')
            // else
            // this.sendemail(emaildetails,'Success','Record rejected successfully')
        }).catch(err => {
            console.log('Failed to fetch data.', err);
        });
    }
    private handleRowClicked = (row, Id?) => {
        let ID = row.Id ? row.Id : Id;
        this.setState({ TimesheetID: ID, redirect: true })
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
                // width: '220px',
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                sortable: true
            },
            // {
            //     name: "Status",
            //     selector: (row, i) => row.Status,
            //     // width: '220px',
            //     sortable: true
            // },
            // {
            //     name: "Pending With",
            //     selector: (row, i) => row.PendingWith,
            //     // width: '180px',
            //     sortable: true
            // },
            {
                name: "Hours",
                selector: (row, i) => row.BillableHrs,
                // width: '100px',
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                // width: '100px',
                sortable: true,
            },
            // {
            //     name: "Paid Time Off",
            //     selector: (row, i) => row.PTONewHrs,
            //     width: '120px',
            //     sortable: true,
            // },
            {
                name: "Total Billable",
                selector: (row, i) => row.TotalBillableHours,
                // width: '150px',
                sortable: true,
            },
            {
                name: "Holiday",
                selector: (row, i) => row.HolidayHrs,
                // width: '110px',
                sortable: true,
            },
            {
                name: "Time Off",
                selector: (row, i) => row.PTOHrs,
                // width: '110px',
                sortable: true,
            },
            {
                name: "Grand Total",
                selector: (row, i) => row.GrandTotal,
                // width: '120px',
                sortable: true
            },
            {
                name: "Approve",
                //selector: "Id",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }} id={record.Id} data-name={'Approve'}>
                                <FontAwesomeIcon className='iconApprove' icon={faCheck} id={record.Id} data-name={'Approve'} color='green' size="lg" onClick={this.showConfirmApproveRejectPopup} title='Approve'></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                    );
                },
                // width: '100px'
            },
            {
                name: "Reject",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }} id={record.Id} data-name={'Reject'}>
                                <FontAwesomeIcon className='iconReject' icon={faXmark} id={record.Id} data-name={'Reject'} color='red' size="lg" onClick={this.showConfirmApproveRejectPopup} title='Reject'></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                    );
                },
                // width: '100px'
            }
        ];
        //const searchKeys=['Date','EmployeName','Client','Status','PendingWith','BillableHrs','OTTotalHrs','TotalBillableHours','HolidayHrs','PTOHrs','GrandTotal'];
        const searchKeys = ['Date', 'EmployeName', 'Client', 'BillableHrs', 'OTTotalHrs', 'TotalBillableHours', 'HolidayHrs', 'PTOHrs', 'GrandTotal'];

        if (this.state.redirect) {
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
            return (<Navigate to={url} />);
        }
        return (
            <React.Fragment>
                {/* this popup is show after the approve/reject action completes */}
                {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.successPopUp} onClose={this.navigateAfterAction} isSuccess={this.state.isSuccess}></ModalPopUp> */}

                {/* ModalApprovePopUp is a custom popup shown with Comments and to Approve or Reject the timesheet */}
                <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showHideModal} isSuccess={this.state.isSuccess} isManager={this.state.isSuccess} onConfirm={this.handleApproveReject} onCancel={this.handlefullClose} comments={this.handleComments} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} modalHeader={this.state.ModalHeader} IsClientApprovalNeed={this.state.IsClientApprovalNeed}></ModalApprovePopUp>

                <div>
                    <div className=''>
                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.Reviewers} fileName={'My Reviews'} showExportExcel={false} showAddButton={false} searchBoxLeft={true} ExportExcelCustomisedData={this.state.ExportExcelData} onRowClick={this.handleRowClicked}></TableGenerator>
                    </div>
                </div>
                <Toaster />
                {this.state.loading && <Loader />}
            </React.Fragment>
        );

    }
}
export default ReviewerApprovals