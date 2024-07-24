import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
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
export interface ReviewerApprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ReviewerApprovalsState {
    Reviewers: any;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number;
    siteURL : string;
    modalTitle:string;
    modalText:string;
    successPopUp:boolean;
    ModalHeader: string;
    IsClientApprovalNeed:boolean;
    ExportExcelData:any;
    currentTimesheetStatus:string;
    TimesheetID:string;
    redirect:boolean;
}

class ReviewerApprovals extends React.Component<ReviewerApprovalsProps, ReviewerApprovalsState> {
    constructor(props: ReviewerApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Reviewers: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:false,comments:'',Action:'',errorMessage:'',ItemID:0,siteURL : this.props.spContext.webAbsoluteUrl,modalTitle:'',modalText:'',successPopUp:false,ModalHeader:'modal-header-Approve',IsClientApprovalNeed:false,ExportExcelData:[],currentTimesheetStatus:'',TimesheetID:'',redirect:false,};
    }

    public componentDidMount() {
        this.ReviewerApproval();
    }

    private showDelegatedRecords(startDate,endDate){
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
        dateFilter.setDate(new Date().getDate()-60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = " and WeekStartDate ge '"+date+"'"

        // var filterString = "Reviewers/Id eq '"+userId+"' and PendingWith eq 'Reviewer' and Status eq '"+StatusType.ManagerApprove+"'"
        var filterString = "(AssignedTo/Id eq '"+userId+"' or Reviewers/Id eq '"+userId+"') and PendingWith eq 'Reviewer'";


        let delegationQuery = "DelegateTo/Id eq '"+userId+"'"
        try {
        let [responseData,ManagerDelegations] = await Promise.all([
            sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterString+filterQuery).expand("Reviewers").select('Reviewers/Title','*').orderBy('WeekStartDate,Modified', false).get(),
            sp.web.lists.getByTitle('Delegations').items.filter(delegationQuery).expand("Authorizer,DelegateTo").select('Authorizer/Title,Authorizer/ID,DelegateTo/ID,*').orderBy('Authorizer/ID', false).get(),
        ])
                // let getDelegateRecords = this.showDelegatedRecords(ManagerDelegations[0].startDate,ManagerDelegations[0].endDate)
                let managers = []
                for (const row of ManagerDelegations) {
                    let isApplicable = this.showDelegatedRecords(row.From,row.To)
                    if(isApplicable){
                        managers.push(row)
                    }
                }
                // console.log(managers)
                let getDelTSQry = ''
                if(managers.length){
                    if(managers.length>2){
                        for (const row of managers) {
                            getDelTSQry+="(Reviewers/Id eq '"+row.Authorizer.ID+"' or"
                        }
                        getDelTSQry = getDelTSQry.substring(0, getDelTSQry.lastIndexOf("or"));
                    }
                    else{
                        getDelTSQry = "(Reviewers/Id eq '"+managers[0].Authorizer.ID+"'"
                    }
                }
                getDelTSQry+= ") and PendingWith eq 'Reviewer'";
                let delRmData = []
                if(managers.length)
                    delRmData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(getDelTSQry).expand("ReportingManager,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Initiator/EMail,*').orderBy('WeekStartDate,DateSubmitted', false).get()

                let Data = [];
                for (const d of responseData) {
                    let date = new Date(d.WeekStartDate.split('-')[1]+'/'+d.WeekStartDate.split('-')[2].split('T')[0]+'/'+d.WeekStartDate.split('-')[0])
                    let isBillable = true;
                    if(d.ClientName.toLowerCase().includes('synergy')){
                        isBillable = false
                    }
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        Company : d.ClientName,
                        PendingWith: d.PendingWith,
                        Status : this.getStatus(d.Status),
                        BillableHrs: isBillable?parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)):parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                        OTTotalHrs : parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                        TotalBillableHours: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs:parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                        PTOHrs:parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(2)),
                        GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2))
                    })
                }
                // this.setState({ExportExcelData:Data})
                // console.log(Data);
                this.setState({ Reviewers: Data,ExportExcelData:Data,loading: false});

                if(delRmData.length){
                    for (const d of delRmData) {
                        let date = new Date(d.WeekStartDate.split('-')[1]+'/'+d.WeekStartDate.split('-')[2].split('T')[0]+'/'+d.WeekStartDate.split('-')[0])
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
                            Date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                            EmployeName: d.Name,
                            PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                            Status: d.Status == StatusType.ReviewerReject ? 'Rejected by Synergy' : d.Status == StatusType.ManagerReject ? 'Rejected by Reporting Manager' : d.Status,
                            BillableTotalHrs: isBillable ?parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                            OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                            TotalBillable: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                            // NonBillableTotalHrs: d.NonBillableTotalHrs,
                            HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                            PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(2)),
                            GrandTotal: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                            Client: d.ClientName,
                            EmployeeEmail: d.Initiator.EMail,
                            ReportingManagerEmails: d.ReportingManager.map(e => e.EMail),
                            commentsObj: JSON.parse(d.CommentsHistory),
                            SynergyOfficeHrs: d.SynergyOfficeHrs,
                            ClientHolidayHrs: d.ClientHolidayHrs,
                        })
                    }
                }
            }
            catch (error) {
                console.log("Sorry something went wrong!", error)
            }
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
    //this function is used to send Email
    private sendemail(emaildetails,modalTitle,modalText){
        sp.utility.sendEmail({
            Body: emaildetails.body,  
            Subject: emaildetails.subject,  
            To: emaildetails.toemail,  
            CC: emaildetails.ccemail
          }).then((i) => {  
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:false,modalTitle:modalTitle});
            customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Reject.toLowerCase()+ ' succesfully',2000);
            this.ReviewerApproval();
          }).catch((i) => {
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:false,modalTitle:'Email sending failed',modalText:'Something went wrong please try again'}); 
            customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            console.log(i)
          });  
    }
    // this function is used to prepare Email body in table formate
    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName,DashboardURL) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details or go to <a href="+ DashboardURL+">Dashboard</a>.";
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

    // this function is used to update the weekly time sheet when Reviewer Approves/Rejects
    private  updateStatus = async (recordId,Status,Comments,To,CC,tableContent) =>{
        let clinetApproval = this.state.IsClientApprovalNeed
        let postObject = {
            Status : Status,
            CommentsHistory : Comments,
            PendingWith : Status == StatusType.Approved?'NA':'Initiator',
            IsClientApprovalNeed : clinetApproval,
            Revised: true,
        }
        // console.log(postObject);
        this.setState({comments  :''})

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(recordId).update(postObject).then((res) => {
            if(Status == StatusType.Approved){
                this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:false,modalTitle:'Record approved successfully'});
                customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Approved.toLowerCase()+ ' succesfully',2000);
            }
        else{
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:false,modalTitle:'Record rejected successfully'});
            customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Reject.toLowerCase()+ ' succesfully',2000);
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
// This function is used to bind comments to comments input feild
    private handleComments = async (e) =>{
       let value = e.target.type == 'checkbox' ? e.target.checked : e.target.value;
    //    console.log(value);
       let  {name}  = e.target;
       if(name =="comments")
       this.setState({comments : value})
        else if(name == "IsClientApprovalNeed")
        this.setState({IsClientApprovalNeed : value})

    }
// this function is used to get current records data and then update the status of the time sheet to Approved
    private handleApprove = async (e) => {
        
        let recordId = this.state.ItemID;
        var filterString = "Id eq '"+recordId+"'"
        this.setState({ loading: true });
        let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').get()
        // console.log(data)
        
       let Initialstatus =  this.state.Reviewers.filter(record => { 
        if (recordId == record.Id) return record }
    )
        
    if(Initialstatus[0].Status != this.getStatus(data[0].Status)){
        customToaster('toster-warning', ToasterTypes.Warning,"Attention: This PTO has been modified. Please review the changes.", 3000);
        this.setState({showHideModal : false,isSuccess:true,ModalHeader:'',comments:'',IsClientApprovalNeed:false})
        this.ReviewerApproval();
        return false
    }
        let commentsObj = JSON.parse(data[0].CommentsHistory)
        if(commentsObj == null)
        commentsObj = [];
        commentsObj.push({
            Action : StatusType.Approved,
            Role : 'Reviewer',
            User : this.props.spContext.userDisplayName,
            Comments : this.state.comments,
            Date : new Date().toISOString()
        })
        commentsObj = JSON.stringify(commentsObj);
        // var filterString = "Initiator/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
        var selectString = 'Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,*'
        let emailData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select(selectString).expand('Initiator,Reviewers,ReportingManager,DelegateTo').get();
        // console.log(emailData)
        let toEmail = [];
        let ccEmail = [];
        toEmail.push(emailData[0].Initiator.EMail);
        // let approvers = emailData[0].ReportingManager
        let isDeligated = emailData[0].IsDelegated
        let approvers;
        isDeligated?emailData[0].DelegateTo:approvers = emailData[0].ReportingManager

        for (const user of approvers) {
            if(!ccEmail.includes(user.EMail))
            ccEmail.push(user.EMail);
        }
        //---------Notofiers------------------
        // let notifires = emailData[0].Notifiers
        // for (const user of notifires) {
        //     if(!toEmail.includes(user.EMail))
        //     toEmail.push(user.EMail);
        // }----------------------------------
        let reviewers = emailData[0].Reviewers
        for (const user of reviewers) {
            if(!toEmail.includes(user.EMail))
            toEmail.push(user.EMail);
        }
        // this.setState({comments : comments })
        let date = new Date(data[0].DateSubmitted)
        let tableContent = {'Name':data[0].Name,'Client':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Total Hours':data[0].GrandTotal}
        // console.log(tableContent)
        this.updateStatus(recordId,StatusType.Approved,commentsObj,toEmail,ccEmail,tableContent)
    }

// this function is used to get current records data and then update the status of the time sheet to Reject
    private handleReject= async (e) =>{

        let recordId = this.state.ItemID;
        if(['',undefined,null].includes(this.state.comments.trim())){
            // this.setState({errorMessage : 'Comments cannot be Blank',loading : false})
            this.setState({loading:false})
            customToaster('toster-error',ToasterTypes.Error,'Comments cannot be Blank.',4000)
        }
        else{
            var filterString = "Id eq '"+recordId+"'"
            this.setState({showHideModal:false, successPopUp:false,loading: true });
            let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').orderBy('WeekStartDate,DateSubmitted', false).get()

            let Initialstatus =  this.state.Reviewers.filter(record => { 
                if (recordId == record.Id) return record }
            )       
            if(Initialstatus[0].Status != this.getStatus(data[0].Status)){
                customToaster('toster-warning', ToasterTypes.Warning,"Attention: This PTO has been modified. Please review the changes.", 3000);
                this.setState({showHideModal : false,isSuccess:true,ModalHeader:'',comments:'',IsClientApprovalNeed:false})
                this.ReviewerApproval();
                return false
            } 
            // console.log(data)
            let commentsObj = JSON.parse(data[0].CommentsHistory)
            commentsObj.push({
                Action : StatusType.Reject,
                Role : 'Reviewer',
                User : this.props.spContext.userDisplayName,
                Comments : this.state.comments,
                Date : new Date().toISOString()
            })
            commentsObj = JSON.stringify(commentsObj);
            // var filterString = "Initiator/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
            var selectString = 'Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,*'
            let emailData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select(selectString).expand('Initiator,Reviewers,ReportingManager,DelegateTo').get();
            // console.log(emailData)
            let toEmail = [];
            let ccEmail = [];
            let isDeligated = emailData[0].IsDelegated
            toEmail.push(emailData[0].Initiator.EMail);
            let approvers;
            isDeligated?emailData[0].DelegateTo:approvers = emailData[0].ReportingManager
            if(this.state.IsClientApprovalNeed){
                for (const user of approvers) {
                    if(!ccEmail.includes(user.EMail))
                    ccEmail.push(user.EMail);
                }
            }
            // let notifires = emailData[0].Notifiers
            // for (const user of notifires) {
            //     if(!toEmail.includes(user.EMail))
            //     toEmail.push(user.EMail);
            // }
            let reviewers = emailData[0].Reviewers
            for (const user of reviewers) {
                if(!toEmail.includes(user.EMail))
                toEmail.push(user.EMail);
            }
            // this.setState({comments : comments })
            let tableContent = {}
            let date = new Date(data[0].DateSubmitted)
            if(data[0].ClientName.toLowerCase().includes("synergy")){
                tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Office Hours':JSON.parse(data[0].SynergyOfficeHrs)[0].Total,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal,'Comments':this.state.comments}
            }
            else{
                tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'Time Off Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal,'Comments':this.state.comments}
            }
            // console.log(tableContent)

            this.updateStatus(recordId,StatusType.ReviewerReject,commentsObj,toEmail,ccEmail,tableContent)
        }
    }
    //This function is used to close popup
    private handlefullClose = () => {
        this.setState({ showHideModal: false, Action :'', errorMessage : '',ItemID : 0,comments:''});
    }
// this function is used to reload the data after Approve/Reject is done
    private navigateAfterAction =()=>{
        this.setState({successPopUp : false});
        this.ReviewerApproval();
    }
// This function is used to Display confirm popup based on Approve/Reject
    private showPopUp = (e) =>{
        // console.log(e.target.id);
        // console.log(e.target.dataset);
        // console.log(e.target.dataset.name)
        let recordId = parseInt(e.target.id);
        this.setState({ItemID : recordId})
        let name = e.target.dataset.name
        if(name == 'Approve')
        {
            this.setState({message : 'Are you sure you want to approve?',title : 'Approve', Action : 'Approve'});
            this.setState({showHideModal : true,isSuccess:true,ModalHeader:'modal-header-Approve'})
            // this.setState({showHideModal : true,isSuccess:true,ModalHeader:'modal-header-reject'})
        }
        else
         if(name == 'Reject')
        {
            this.setState({message : 'Are you sure you want to reject?',title : 'Reject', Action :StatusType.Reject});
            this.setState({showHideModal : true,isSuccess:false,ModalHeader:'modal-header-reject'})
        }
        else{
            this.setState({showHideModal : false})
        }
    }

    //this function calls handleApprove/handleReject function based on the user action
    private handleAction = (e) =>{
        this.setState({loading : true})
         if(this.state.Action == "Approve")
        this.handleApprove(e)
        else
         this.handleReject(e)
    }

    private  handleRowClicked = (row) => {
        let ID = row.Id
        this.setState({TimesheetID:ID,redirect:true})
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
                                    <NavLink title="Edit"  className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
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
                    selector: (row, i) => row.Date,
                    width: '100px',
                    sortable: true
                },
                {
                    name: "Employee Name",
                    selector: (row, i) => row.EmployeName,
                    width: '220px',
                    sortable: true
                },
                {
                    name: "Client",
                    selector: (row, i) => row.Company,
                    sortable: true
                },
                {
                    name: "Pending With",
                    selector: (row, i) => row.PendingWith,
                    width: '180px',
                    sortable: true

                },
                {
                    name: "Status",
                    selector: (row, i) => row.Status,
                    sortable: true

                },
                {
                    name: "Hours",
                    selector: (row, i) => row.BillableHrs,
                    sortable: true,
                },
                {
                    name: "OT",
                    selector: (row, i) => row.OTTotalHrs,
                    width: '130px',
                    sortable: true,
                },
                {
                    name: "Total Billable",
                    selector: (row, i) => row.TotalBillableHours,
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
                    selector: (row, i) => row.GrandTotal,
                    // width: '140px',
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
                            <div style={{ paddingLeft: '10px' }} >
                                    <FontAwesomeIcon className='iconApprove' icon={faCheck} id={record.Id} data-name={'Approve'} color='green' size="lg" onClick={this.showPopUp} title='Approve'></FontAwesomeIcon>
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
                            <div style={{ paddingLeft: '10px' }} data-name='Reject'>
                                    <FontAwesomeIcon className='iconReject' icon={faXmark} id={record.Id} data-name='Reject' color='red' size="lg" onClick={this.showPopUp} title='Reject'></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                        );
                    },
                    // width: '100px'
                }
            ];
            if(this.state.redirect){
                let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
            return (<Navigate to={url}/>);
            }
            return (
                <React.Fragment>
                    {/* this popup is show after the approve/reject action completes */}
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.successPopUp} onClose={this.navigateAfterAction} isSuccess={this.state.isSuccess}></ModalPopUp>

                {/* ModalApprovePopUp is a custom popup shown with Comments and to Approve or Reject the timesheet */}
                <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showHideModal} isSuccess={this.state.isSuccess} onConfirm={this.handleAction} onCancel={this.handlefullClose} comments={this.handleComments} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} modalHeader={this.state.ModalHeader} IsClientApprovalNeed= {this.state.IsClientApprovalNeed}></ModalApprovePopUp>
                
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.Reviewers} fileName={'My Reviews'} showExportExcel={false} showAddButton={false} searchBoxLeft={true} ExportExcelCustomisedData={this.state.ExportExcelData} onRowClick={this.handleRowClicked}></TableGenerator>
                    </div>
                </div>
                    <Toaster />  
                {this.state.loading && <Loader />}
                </React.Fragment> 
            );
        
    }
}
export default ReviewerApprovals