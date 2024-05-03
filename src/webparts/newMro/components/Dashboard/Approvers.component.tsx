import * as React from 'react';
import { NavLink } from 'react-router-dom';
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
        isSuccess: true,
        comments: '',
        Action: '',
        errorMessage: '',
        ItemID: 0,
        SelectedRows: [],
        SelectedValue: '',
        DelegateToUsers: [],
        //  AssignedToId:'',
        //  DelegateToId:'',
    };

    public componentDidMount() {
        this.ReportingManagerApproval();
    }
    // this function is used to get 1 month records of weeklytime data of the employees who's manager is current logged in user from weeklytimesheet list
    private ReportingManagerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '" + date + "'"
        // var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"
        var filterString = "AssignedTo/Id eq '" + userId + "'";
        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString + filterQuery).expand("ReportingManager,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Initiator/EMail,*').orderBy('WeekStartDate,DateSubmitted', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.WeekStartDate)
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
                // console.log(Data);
                
                this.getClientDeligates(Data)


            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }

    private async getClientDeligates(Data) {
        let obj;
if(Data.length>0){
    let clientDelegates = await sp.web.lists.getByTitle('Client').items.filter("Title eq '" + Data[0].Client + "' and IsActive eq 1").select('DelegateTo/Title,DelegateTo/ID,DelegateTo/EMail,*').expand('DelegateTo').get()
    let delegates = clientDelegates[0].DelegateTo
    obj = []
    for (const d of delegates) {
        if (d.ID != this.props.spContext.userId)
            obj.push({
                ID: d.ID,
                Title: d.Title,
                Email: d.EMail
            })
    }
}

        this.setState({ ReportingManager: Data, DelegateToUsers: obj, loading: false });
    }

    private getSelectedRows = (rows) => {
        // setSelectedRows(rows.selectedRows);
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
        let Comments = this.state.comments
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
            try{
            for (const m of selectedRows) {
                let To = this.state.DelegateToUsers.find(item => item.ID === delegatedUserID)?.Email;
                let CC = m.ReportingManagerEmails
                let tableContent = {}
                let date = new Date(m.Date)
                if (m.Client.toLowerCase().includes("synergy")) {
                    tableContent = { 'Name': m.EmployeName, 'Client Name': m.Client, 'Submitted Date': `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, 'Office Hours': JSON.parse(m.SynergyOfficeHrs)[0].Total, 'Holiday Hours': JSON.parse(m.ClientHolidayHrs)[0].Total, 'Time Off Hours': m.PTOHrs, 'Grand Total Hours': m.GrandTotal, 'Comments': this.state.comments }
                }
                else {
                    tableContent = { 'Name': m.EmployeName, 'Client Name': m.Client, 'Submitted Date': `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, 'Billable Hours': m.BillableTotalHrs, 'OT Hours': m.OTTotalHrs, 'Total Billable Hours': m.TotalBillable, 'Holiday Hours': JSON.parse(m.ClientHolidayHrs)[0].Total, 'Time Off Hours': m.PTOHrs, 'Grand Total Hours': m.GrandTotal, 'Comments': this.state.comments }
                }
                let emaildetails = { toemail: [To], ccemail: CC, subject: EmailSubject, bodyString: EmailSubject, body: '' };
                var DashboardURl = this.props.spContext.webAbsoluteUrl+'/SitePages/TimeSheet.aspx';
                emaildetails.body = this.emailBodyPreparation(this.props.spContext.webAbsoluteUrl+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/' + m.Id, tableContent, emaildetails.bodyString, this.props.spContext.userDisplayName, DashboardURl);
                await this.sendemail(emaildetails)

            }
            }
            catch (error) {
                customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                this.setState({ loading: false })
                console.log('Error occurred while sending emails:', error);
            }
            // console.log('Bulk forwards successful!');
            customToaster('toster-success', ToasterTypes.Success, 'Timesheets forwarded Sucessfully.', 2000)
            this.setState({ SelectedValue: '', comments: '', showHideModal: false,SelectedRows:[], loading: false });
            this.ReportingManagerApproval();
        } catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            this.setState({ loading: false })
            console.log('Error occurred during bulk forwards:', error);
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
                selector: (row, i) => row.Date,
                width: '100px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                width: '250px',
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
                selector: (row, i) => row.BillableTotalHrs,
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                width: '110px',
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
            }
        ];
        return (
            <React.Fragment>
                <ModalForwardApprovals changeEvent={this.handleChangeEvents} dropdownObject={this.state.DelegateToUsers} isVisible={this.state.showHideModal} message='Are you sure you want to forward the selected Timesheets?' modalHeader='modal-header-reject' onCancel={this.handleCancel} onConfirm={this.forwardApprovals} selectedValue={this.state.SelectedValue} title='' commentsValue={this.state.comments}></ModalForwardApprovals>
                <div>
                    <div className='table-head-1st-td'>
                        <TableGenerator columns={columns} data={this.state.ReportingManager} fileName={''} showExportExcel={false}
                            showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='' btnCaption='Forward Approvals' btnTitle='Forward Approvals' searchBoxLeft={true} selectableRows={this.state.ReportingManager.length>0?true:false} handleSelectedRows={this.getSelectedRows} customButton={this.state.SelectedRows.length > 0 ? true : false} customButtonClick={this.ShowPopUp}></TableGenerator>
                    </div>
                </div>
                <Toaster />
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default ApproversApprovals