import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';

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
    redirect:boolean;
    modalTitle:string;
    modalText:string;
    successPopUp:boolean;
    ModalHeader: string;
    // pageNumber:number;
    // sortBy:number;
    // sortOrder:boolean;
}

class ReviewerApprovals extends React.Component<ReviewerApprovalsProps, ReviewerApprovalsState> {
    constructor(props: ReviewerApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Reviewers: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:false,comments:'',Action:'',errorMessage:'',ItemID:0,siteURL : this.props.spContext.webAbsoluteUrl,redirect:false,modalTitle:'',modalText:'',successPopUp:false,ModalHeader:'modal-header-Approve'};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.ReviewerApproval();
    }

    private ReviewerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        var filterString = "Reviewers/Id eq '"+userId+"' and PendingWith eq 'Reviewer' and Status eq '"+StatusType.InProgress+"'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("Reviewers").select('Reviewers/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.WeekStartDate)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        Company : d.ClientName,
                        Status : d.Status,
                        BillableHrs: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillableHours: d.BillableTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        WeeklyTotalHrs: d.GrandTotal
                    })
                }
                console.log(Data);
                this.setState({ Reviewers: Data,loading:false });
                this.setState({ loading: false });
                //console.log(this.state.approvals);
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }

    private sendemail(emaildetails,modalTitle,modalText){
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,  
            //Subject of Email  
            Subject: emaildetails.subject,  
            //Array of string for To of Email  
            To: emaildetails.toemail,  
            CC: emaildetails.ccemail
          }).then((i) => {  
            // alert("Record Updated Sucessfully");
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:true,modalTitle:modalTitle});
            // this.setState({redirect : true});
            // <Navigate to={'/'} />
          }).catch((i) => {
            // alert("Error while updating the record");
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false,successPopUp:true,modalTitle:'Email sending failed',modalText:'Something went wrong please try again'});            // this.setState({redirect : true});
            console.log(i)
          });  
    }
    
    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details.";
        var emailBody = '<table id="email-container" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; text-align: left;" width="100%">' +
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

    private  updateStatus = async (recordId,Status,Comments,To,CC,tableContent) =>{

        let postObject = {
            Status : Status,
            CommentsHistory : Comments,
            PendingWith : 'NA'
        }
        console.log(postObject);
        this.setState({comments  :''})
        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(recordId).update(postObject).then((res) => {
            // alert("Record Updated Sucessfully");
            // this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false});
            let sub=''; 
            if(Status==StatusType.Approved){
                sub = "Weekly Time Sheet has been approved by Reviewer"
                this.setState({ModalHeader:'modal-header-Approve'})
            }
            else{
                sub = "Weekly Time Sheet has been rejected by Reviewer.Please re-submit with necessary details."
                this.setState({ModalHeader:'modal-header-reject'})
            }

            let emaildetails ={toemail:To,ccemail:CC,subject:sub,bodyString:sub,body:'' };
             let table = tableContent;
             emaildetails.body = this.emailBodyPreparation(this.state.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,table,emaildetails.bodyString,this.props.spContext.userDisplayName);
             if(Status == StatusType.Approved)
             this.sendemail(emaildetails,'Record approved successfully','')
            else
            this.sendemail(emaildetails,'Record rejected successfully','')
            // <Navigate to={'/'} />
            // this.setState({redirect:true})
        });
    }

    private handleComments = async (e) =>{
       let value = e.target.value
       this.setState({comments : value})
    }

    private handleApprove = async (e) => {
        
        let recordId = this.state.ItemID;
        var filterString = "Id eq '"+recordId+"'"
        this.setState({ loading: true });
        let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').get()
        console.log(data)
        let commentsObj = JSON.parse(data[0].CommentsHistory)
        if(commentsObj == null)
        commentsObj = [];
        commentsObj.push({
            Action : 'Approve',
            Role : 'Reviewer',
            User : this.props.spContext.userDisplayName,
            Comments : this.state.comments,
            Date : new Date().toISOString()
        })
        commentsObj = JSON.stringify(commentsObj);
        var filterString = "Employee/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
        var selectString = 'Employee/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*'
        let emailData = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterString).select(selectString).expand('Employee,Reviewers,ReportingManager,Notifiers').get();
        console.log(emailData)
        let toEmail = [];
        let ccEmail = [];
        toEmail.push(emailData[0].Employee.EMail);
        let approvers = emailData[0].ReportingManager
        for (const user of approvers) {
            if(!ccEmail.includes(user.EMail))
            ccEmail.push(user.EMail);
        }
        let notifires = emailData[0].Notifiers
        for (const user of notifires) {
            if(!toEmail.includes(user.EMail))
            toEmail.push(user.EMail);
        }
        let reviewers = emailData[0].Reviewers
        for (const user of reviewers) {
            if(!toEmail.includes(user.EMail))
            toEmail.push(user.EMail);
        }
        // this.setState({comments : comments })
        let date = new Date(data[0].DateSubmitted)
        let tableContent = {'Name':data[0].Name,'Client':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Non-Billable  Hours':data[0].WeeklyTotalHrs,'Total Hours':data[0].WeeklyTotalHrs}
        console.log(tableContent)
        this.updateStatus(recordId,StatusType.Approved,commentsObj,toEmail,ccEmail,tableContent)
    }

    private handleReject= async (e) =>{

        let recordId = this.state.ItemID;
        if(['',undefined,null].includes(this.state.comments)){
            this.setState({errorMessage : 'Comments cannot be Blank'})
            this.setState({loading : false})
        }
        else{

            var filterString = "Id eq '"+recordId+"'"
            this.setState({ loading: true });
            let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Initiator/ID,Initiator/Title,*').expand('Initiator').orderBy('WeekStartDate,DateSubmitted', false).get()
            console.log(data)
            let commentsObj = JSON.parse(data[0].CommentsHistory)
            commentsObj.push({
                Action : 'Reject',
                Role : 'Reviewer',
                user : this.props.spContext.userDisplayName,
                Comments : this.state.comments,
                Date : new Date().toISOString()
            })
            commentsObj = JSON.stringify(commentsObj);
            var filterString = "Employee/ID eq '"+data[0].Initiator.ID+"' and ClientName eq '"+data[0].ClientName+"'"
            var selectString = 'Employee/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*'
            let emailData = await sp.web.lists.getByTitle('EmployeeMaster').items.filter(filterString).select(selectString).expand('Employee,Reviewers,ReportingManager,Notifiers').get();
            console.log(emailData)
            let toEmail = [];
            let ccEmail = [];
            toEmail.push(emailData[0].Employee.EMail);
            let approvers = emailData[0].ReportingManager
            for (const user of approvers) {
                if(!ccEmail.includes(user.EMail))
                ccEmail.push(user.EMail);
            }
            let notifires = emailData[0].Notifiers
            for (const user of notifires) {
                if(!toEmail.includes(user.EMail))
                toEmail.push(user.EMail);
            }
            let reviewers = emailData[0].Reviewers
            for (const user of reviewers) {
                if(!toEmail.includes(user.EMail))
                toEmail.push(user.EMail);
            }
            // this.setState({comments : comments })
            let date = new Date(data[0].DateSubmitted)
            let tableContent = {'Name':data[0].Name,'Client':data[0].ClientName,'Submitted Date':`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,'Billable Hours':data[0].WeeklyTotalHrs,'OT Hours':data[0].OTTotalHrs,'Total Billable Hours':data[0].BillableTotalHrs,'Non-Billable  Hours':data[0].NonBillableTotalHrs,'Total Hours':data[0].GrandTotal}
            console.log(tableContent)
    
            this.updateStatus(recordId,StatusType.Reject,commentsObj,toEmail,ccEmail,tableContent)
        }
    }
    private handlefullClose = () => {
        this.setState({ showHideModal: false, Action :'', errorMessage : '',ItemID : 0});
    }

    private navigateAfterAction =()=>{
        this.setState({successPopUp : false});
        this.setState({redirect : true});
    }

    private showPopUp = (e) =>{
        console.log(e.target.id);
        console.log(e.target.dataset);
        console.log(e.target.dataset.name)
        let recordId = parseInt(e.target.id);
        this.setState({ItemID : recordId})
        let name = e.target.dataset.name
        if(name == 'Approve')
        {
            this.setState({message : 'Are you sure you want to approve?',title : 'Approve', Action : 'Approve'});
            this.setState({showHideModal : true,isSuccess:true})
        }
        else if(name == 'Reject')
        {
            this.setState({message : 'Are you sure you want to reject?',title : 'Reject', Action : 'Reject'});
            this.setState({showHideModal : true,isSuccess:false})
        }
        else{
            this.setState({showHideModal : false})
        }
    }

    private handleAction = (e) =>{
        this.setState({loading : true})
        if(this.state.Action == 'Approve')
        this.handleApprove(e)
        else
         this.handleReject(e)
    }

    public render() {
        if (this.state.redirect) {
            let url = `/`
            return (<Navigate to={url} />);
        }
        else {
            const columns = [
                {
                    name: "Edit",
                    //selector: "Id",
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
                    //selector: "Plant",
                    selector: (row, i) => row.Date,
                    width: '100px',
                    sortable: true
                },
                {
                    name: "Employee Name",
                    //selector: "Department",
                    selector: (row, i) => row.EmployeName,
                    // width: '180px',
                    sortable: true
                },
                {
                    name: "Client",
                    //selector: "Department",
                    selector: (row, i) => row.Company,
                    // width: '150px',
                    sortable: true
                },
                {
                    name: "Status",
                    //selector: 'VendorName',
                    selector: (row, i) => row.Status,
                    // width: '180px',
                    sortable: true

                },
                {
                    name: "Billable Hours",
                    //selector: "Requisitioner",
                    selector: (row, i) => row.BillableHrs,
                    sortable: true,
                    // width: '135px'
                },
                {
                    name: "OT Hours",
                    //selector: 'Created',
                    selector: (row, i) => row.OTTotalHrs,
                    width: '130px',
                    sortable: true,
                },
                {
                    name: "Total Billable Hours",
                    //selector: "Requisitioner",
                    selector: (row, i) => row.TotalBillableHours,
                    sortable: true,
                    // width: '175px'
                },
                {
                    name: "Non-Billable Hours",
                    //selector: "TotalAmount",
                    selector: (row, i) => row.NonBillableTotalHrs,
                    sortable: true,
                    // width: '200px'
                },
                {
                    name: "Total Hours",
                    //selector: "Status",
                    selector: (row, i) => row.WeeklyTotalHrs,
                    // width: '150px',
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
                                    <FontAwesomeIcon icon={faCheck} id={record.Id} data-name={'Approve'} color='green' size="lg" onClick={this.showPopUp} title='Approve'></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                        );
                    },
                    width: '100px'
                },
                {
                    name: "Reject",
                    //selector: "Id",
                    selector: (row, i) => row.Id,
                    export: false,
                    cell: record => {
                        return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                    <FontAwesomeIcon icon={faXmark} id={record.Id} data-name='Reject' color='red' size="lg" onClick={this.showPopUp} title='Reject'></FontAwesomeIcon>
                            </div>
                        </React.Fragment>
                        );
                    },
                    width: '100px'
                }
            ];
            return (
                <React.Fragment>
                {/* <h1>Reviewer Screen</h1> */}
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.successPopUp} onClose={this.navigateAfterAction} isSuccess={this.state.isSuccess}></ModalPopUp>
                {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp> */}
                <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showHideModal} isSuccess={this.state.isSuccess} onConfirm={this.handleAction} onCancel={this.handlefullClose} comments={this.handleComments} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} modalHeader={this.state.ModalHeader} ></ModalApprovePopUp>
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.Reviewers} fileName={'My Approvals'} showExportExcel={false}></TableGenerator>
                    </div>
                </div>
                {this.state.loading && <Loader />}
                </React.Fragment> 
            );
        }
    }
}

export default ReviewerApprovals