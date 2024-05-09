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
import { NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ModalForwardApprovals from '../Shared/ModalForwardApprovals.component';
import TableGenerator from '../Shared/TableGenerator';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
export interface DelegateApprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface DelegateApprovalsState {
}

class DelegateApprovals extends React.Component<DelegateApprovalsProps, DelegateApprovalsState> {

    private ReportingManager;
    private Client;
    constructor(props: DelegateApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.ReportingManager = React.createRef();
        this.Client = React.createRef();
    }

    public state = {
        ClientName: '',
        ReportingManagers: [],
        ReportingManagersObj:[],
        ClientObj:[],
        ClientDelegatesObj:[],
        loading: false,
        errorMessage: '',
        ReportingManagerId: '',
        Homeredirect: false,
        isPageAccessable: true,
        showHideModal: false,
        modalTitle: '',
        modalText: '',
        message: "Success",
        showToaster: false,
        GlobalHolidayList: [],
        EligibleforPTO: false,
        isDisabled: false,
        DelegateToUsersObj:[],
        DelegateToUsers: [],
        DelegateToId: { results: [] },
        comments: '',
        SelectedValue: '',
        SelectedRows: [],
        ApprovalsData: [],
        showTable: false,
        clearRows:true,
        selectedClient:'',
        // DelegateToEmail: [],
    }

    public componentDidMount() {
        this.setState({ loading: true });
        this.getOnLoadData();
    }


    private async getOnLoadData() {
        let [reportingManagers,Clients] = await Promise.all([
        sp.web.lists.getByTitle('EmployeeMaster').items.filter("IsActive eq '1'").expand('ReportingManager').select('ReportingManager/Title,ReportingManager/ID,*').orderBy('ReportingManager/Title', true).getAll(),
        sp.web.lists.getByTitle('Client').items.select('DelegateTo/ID,DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll()
    ])
        // let Managers = []
        // let ManagersObj = []
        // for (const name of reportingManagers) {
        //     for (const manager of name.ReportingManager) {
        //         if (!Managers.includes(manager.Title)) {
        //             Managers.push(manager.Title)
        //             ManagersObj.push({ ID: manager.ID, Title: manager.Title, Client: name.ClientName })
        //         }
        //     }
        // }
        // this.setState({ ReportingManagers: ManagersObj, loading: false })
        let ClientDelegatesObject = []
        let ClientsObject = []
        for (const d of Clients) {
            ClientsObject.push({ID:d.ID,Title:d.Title})
            ClientDelegatesObject.push({Client:d.Title,Delegates:d.DelegateTo})
        }   
        this.setState({ReportingManagersObj:reportingManagers,ClientObj:ClientsObject,ClientDelegatesObj:ClientDelegatesObject,loading:false})
    }

    // this function is used to bind and set values to respect form feilds
    private handleChangeEvents = (event) => {
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        let { name } = event.target;
        if(name == "selectedClient"){
            this.setState({loading:true})
            this.bindReportingManagers(value)
        }
        if (name == "ReportingManagerId") {
            // let Client = event.target.selectedOptions[0].getAttribute('data-Client');
            this.setState({ ReportingManagerId: value })
            // if (value == "")
                let Delegateobj =[] 
            this.state.DelegateToUsersObj.forEach(obj => {
                if (obj.ID !== parseInt(value)) {
                    Delegateobj.push(obj);
                }
            });

                this.setState({ showTable: false, ApprovalsData: [],SelectedRows: [],DelegateToUsers: Delegateobj, });
            // else{
            //     this.getManagerApprovals(value, this.state.selectedClient)
            // }
        }
        else if (name == "DelegateToId")
            this.setState({ SelectedValue: value });
        else
            this.setState({ [name]: value });

    }

    private bindReportingManagers=(value)=>{
        // this.setState({loading:true})
        let rm = this.state.ReportingManagersObj
        let ClientManagers =[]
        for (const m of rm) {
            if(m.ClientName == value){
                for (const u of m.ReportingManager) {
                    ClientManagers.push({
                        ID: u.ID,
                        Title: u.Title,
                    })
                }
            }
        }
        ClientManagers.sort((a, b) => a.Title.localeCompare(b.Title));
    let uniqueArray = ClientManagers.filter((value, index, self) => 
        index === self.findIndex(obj => (
            obj.Title === value.Title
        ))
    );
        let delegates = this.state.ClientDelegatesObj
        let obj = []
        for (const d of delegates) {
            if(d.Client == value){
                let users = d.Delegates
                for (const u of users) {
                        obj.push({
                            ID: u.ID,
                            Title: u.Title
                            // Email: u.EMail
                        })
                }
                
            }
        }
        obj.sort((a, b) => a.Title.localeCompare(b.Title));
        if(uniqueArray.length<1)
            customToaster('toster-error', ToasterTypes.Error, 'There are no Reporting Managers configured for this client', 4000);

        this.setState({DelegateToUsersObj:obj,ReportingManagers:uniqueArray,selectedClient:value,loading:false})
    }

    private getSelectedRows = (rows) => {
        if(rows.selectedRows.length>0){
            this.setState({clearRows:false});
        }
        this.setState({SelectedRows: rows.selectedRows });
    };

    private async getManagerApprovals(ID) {
        this.setState({clearRows:true,SelectedRows: [],ApprovalsData: [],loading: true });
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate() - 31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '" + date + "'"
        var filterString = "AssignedTo/Id eq '" + ID + "' and PendingWith eq 'Manager'";
        let [Approvals] = await Promise.all([
            sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString + filterQuery).expand("ReportingManager,Initiator").select('ReportingManager/Title,ReportingManager/EMail,Initiator/EMail,*').orderBy('WeekStartDate,DateSubmitted', false).get()
        ])
        let Data = [];
        for (const d of Approvals) {
            let date = new Date(d.WeekStartDate)
            let isBillable = true;
            if (d.ClientName.toLowerCase().includes('synergy')) {
                isBillable = false
            }
            Data.push({
                Id: d.Id,
                Date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                EmployeName: d.Name,
                PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                Status: d.Status == StatusType.ReviewerReject ? 'Rejected by Synergy' : d.Status == StatusType.ManagerReject ? 'Rejected by Reporting Manager' : d.Status,
                BillableTotalHrs: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
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

        this.setState({ ApprovalsData: Data, showTable: true, loading: false });
        
    }


    private handleCancel = () => {
        this.setState({ SelectedValue: '', comments: '', showHideModal: false })
    }

    private showToaster = () => {
        this.handleSubmit()
    }

    // this function is used to validate form and send data to list if validation succeeds
    private handleSubmit = async () => {
        let data = {
            Client:{ val: this.state.selectedClient, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.Client },
            ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting Manager', Type: ControlType.string, Focusid: this.ReportingManager },
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
        else {
            this.getManagerApprovals(this.state.ReportingManagerId);
        }
    }


    private ShowPopUp = () => {
        this.setState({ showHideModal: true })
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

            customToaster('toster-success', ToasterTypes.Success, 'Timesheets forwarded Sucessfully.', 2000)
            this.setState({ SelectedValue: '', comments: '', showHideModal: false, SelectedRows: [], loading: false });
            this.getManagerApprovals(this.state.ReportingManagerId);
        } catch (error) {
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            this.setState({ loading: false })
            console.log('Error occurred during bulk forwards:', error);
        }

    }

    // this function is used to close popup
    private handleClose = () => {
        this.setState({ loading: false, showHideModal: false, message: '', Homeredirect: true })
    }

    public render() {
        if (this.state.Homeredirect) {
            let url = `/Dashboard/`
            return (<Navigate to={url} />);
        }
        const columns = [
            {
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
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
                {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={true}></ModalPopUp> */}
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent box-shadow-none'>
                            <div className="title">Delegate Approvals
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
                                                <select className="form-control" required={true} name="selectedClient" title="Client" id='' ref={this.Client} onChange={this.handleChangeEvents} disabled={this.state.isDisabled}>
                                                    <option value=''>None</option>
                                                    {this.state.ClientObj.map((option) => (
                                                        <option value={option.Title} selected={option.Title == this.state.selectedClient}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text">
                                                <label>Reporting Manager<span className="mandatoryhastrick">*</span></label>
                                                <select className="form-control" required={true} name="ReportingManagerId" title="ReportingManager" id='' ref={this.ReportingManager} onChange={this.handleChangeEvents} disabled={this.state.isDisabled}>
                                                    <option value=''>None</option>
                                                    {this.state.ReportingManagers.map((option) => (
                                                        <option value={option.ID} selected={option.ID == this.state.ReportingManagerId}>{option.Title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-2" id="">
                                        <button type="button" className="SubmitButtons btn" onClick={this.showToaster}>Submit</button>
                                        <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div>
                            {this.state.showTable &&
                                <div>
                                    <ModalForwardApprovals changeEvent={this.handleChangeEvents} dropdownObject={this.state.DelegateToUsers} isVisible={this.state.showHideModal} message='Are you sure you want to forward the selected Timesheets?' modalHeader='modal-header-Approve' onCancel={this.handleCancel} onConfirm={this.forwardApprovals} selectedValue={this.state.SelectedValue} title='' commentsValue={this.state.comments}></ModalForwardApprovals>
                                    <div className='table-head-1st-td'>
                                        <TableGenerator columns={columns} data={this.state.ApprovalsData} fileName={''} showExportExcel={false}
                                            showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='' btnCaption='' btnTitle='Forward Approvals' searchBoxLeft={true} selectableRows={this.state.ApprovalsData.length > 0 ? true : false} handleSelectedRows={this.getSelectedRows} customButton={this.state.SelectedRows.length > 0 ? true : false} customButtonClick={this.ShowPopUp} clearSelectedRows={this.state.clearRows}></TableGenerator>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                </div>
                <Toaster />
                {this.state.loading && <Loader />}
                {this.state.showToaster && <Toaster />}
                {this.state.loading && <Loader />}
            </React.Fragment >
        );

    }
}
export default DelegateApprovals