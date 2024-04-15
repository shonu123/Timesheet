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
    Reviewers: Array<Object>;
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
}

class ReviewerApprovals extends React.Component<ReviewerApprovalsProps, ReviewerApprovalsState> {
    constructor(props: ReviewerApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Reviewers: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:false,comments:'',Action:'',errorMessage:'',ItemID:0,siteURL : this.props.spContext.webAbsoluteUrl,modalTitle:'',modalText:'',successPopUp:false,ModalHeader:'modal-header-Approve',IsClientApprovalNeed:false,ExportExcelData:[]};
    }

    public componentDidMount() {
        this.ReviewerApproval();
    }
// this function is used to get 1 month records of weeklytime data of the employees who's Reviewer is current logged in user from weeklytimesheet list
    private ReviewerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '"+date+"'"

        var filterString = "Reviewers/Id eq '"+userId+"' and PendingWith eq 'NA' and Status eq '"+StatusType.Approved+"'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(filterString+filterQuery).expand("Reviewers").select('Reviewers/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.WeekStartDate)
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
                        Status : d.Status=='rejected by Synergy'?'Rejected by Synergy':d.Status=='rejected by Manager'?'Rejected by Reporting Manager':d.Status,
                        BillableHrs: isBillable?d.WeeklyTotalHrs:JSON.parse(d.SynergyOfficeHrs)[0].Total,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHours: d.BillableTotalHrs,
                        // NonBillableTotalHrs: d.NonBillableTotalHrs,
                        HolidayHrs:JSON.parse(d.ClientHolidayHrs)[0].Total,
                        PTOHrs:JSON.parse(d.PTOHrs)[0].Total,
                        GrandTotal: d.GrandTotal
                    })
                }
                this.setState({ExportExcelData:Data})
                // console.log(Data);
                this.setState({ Reviewers: Data,loading: false});
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
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
            customToaster('toster-success',ToasterTypes.Success,'Timesheet'+StatusType.Reject+'successfully',2000);
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
            PendingWith : 'Initiator',
            IsClientApprovalNeed : clinetApproval,
            Revised: true,
        }
        // console.log(postObject);
        this.setState({comments  :''})
        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(recordId).update(postObject).then((res) => {
            let sub=''; 
            if(Status==StatusType.Approved){
                sub = "Weekly Time Sheet has been approved by Reviewer"
                // this.setState({ModalHeader:'modal-header-Approve'})
            }
            else{
                sub = "Weekly Time Sheet has been "+StatusType.ReviewerReject+". Please re-submit with necessary details."
            }

            let emaildetails ={toemail:To,ccemail:CC,subject:sub,bodyString:sub,body:'' };
             let table = tableContent;
             var DashboardURl = this.state.siteURL+'/SitePages/TimeSheet.aspx';
             emaildetails.body = this.emailBodyPreparation(this.state.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,table,emaildetails.bodyString,this.props.spContext.userDisplayName,DashboardURl);
             if(Status == StatusType.Approved)
             this.sendemail(emaildetails,'Success','Record approved successfully')
            else
            this.sendemail(emaildetails,'Success','Record rejected successfully')
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
        var filterString = "Employee/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
        var selectString = 'Employee/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*'
        let emailData = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterString).select(selectString).expand('Employee,Reviewers,ReportingManager,Notifiers').get();
        // console.log(emailData)
        let toEmail = [];
        let ccEmail = [];
        toEmail.push(emailData[0].Employee.EMail);
        let approvers = emailData[0].ReportingManager
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
        let tableContent = {'Name':data[0].Name,'Client':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'PTO Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Total Hours':data[0].GrandTotal}
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
            // var filterString = "Employee/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
            var selectString = 'Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*'
            let emailData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select(selectString).expand('Initiator,Reviewers,ReportingManager,Notifiers').get();
            // console.log(emailData)
            let toEmail = [];
            let ccEmail = [];
            toEmail.push(emailData[0].Initiator.EMail);
            let approvers = emailData[0].ReportingManager
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
                tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Office Hours':JSON.parse(data[0].SynergyOfficeHrs)[0].Total,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'PTO Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal}
            }
            else{
                tableContent = {'Name':data[0].Name,'Client Name':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Holiday Hours':JSON.parse(data[0].ClientHolidayHrs)[0].Total,'PTO Hours':JSON.parse(data[0].PTOHrs)[0].Total,'Grand Total Hours':data[0].GrandTotal}
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
        // if(name == 'Approve')
        // {
        //     this.setState({message : 'Are you sure you want to approve?',title : 'Approve', Action : 'Approve'});
        //     this.setState({showHideModal : true,isSuccess:true,ModalHeader:'modal-header-Approve'})

        // }
        // else
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
         //if(this.state.Action == StatusType.Approved)
        // this.handleApprove(e)
        // else
         this.handleReject(e)
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
                    name: "PTO",
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
                // {
                //     name: "Approve",
                //     //selector: "Id",
                //     selector: (row, i) => row.Id,
                //     export: false,
                //     cell: record => {
                //         return (
                //             <React.Fragment>
                //             <div style={{ paddingLeft: '10px' }} >
                //                     <FontAwesomeIcon className='iconApprove' icon={faCheck} id={record.Id} data-name={'Approve'} color='green' size="lg" onClick={this.showPopUp} title='Approve'></FontAwesomeIcon>
                //             </div>
                //         </React.Fragment>
                //         );
                //     },
                //     width: '100px'
                // },
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
                    width: '100px'
                }
            ];
            return (
                <React.Fragment>
                    {/* this popup is show after the approve/reject action completes */}
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.successPopUp} onClose={this.navigateAfterAction} isSuccess={this.state.isSuccess}></ModalPopUp>

                {/* ModalApprovePopUp is a custom popup shown with Comments and to Approve or Reject the timesheet */}
                <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showHideModal} isSuccess={this.state.isSuccess} onConfirm={this.handleAction} onCancel={this.handlefullClose} comments={this.handleComments} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} modalHeader={this.state.ModalHeader} IsClientApprovalNeed= {this.state.IsClientApprovalNeed}></ModalApprovePopUp>
                
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.Reviewers} fileName={'My Reviews'} showExportExcel={false} showAddButton={false} searchBoxLeft={true} ExportExcelCustomisedData={this.state.ExportExcelData}></TableGenerator>
                    </div>
                </div>
                    <Toaster />  
                {this.state.loading && <Loader />}
                </React.Fragment> 
            );
        
    }
}
export default ReviewerApprovals