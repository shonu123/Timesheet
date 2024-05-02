import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
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
export interface EmployeeMasterFormProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface EmployeeMasterFormState {
}

class EmployeeMasterForm extends React.Component<EmployeeMasterFormProps, EmployeeMasterFormState> {

    private siteURL: string;
    private sitecollectionURL: string;
    private listName = 'EmployeeMaster';
    private clientListName = "Client";
    private ItemID = "";
    private client;
    private HolidayType;
    private WeekStartDay;
    private MandatoryDescription;
    private MandatoryProjectCode;
    private EligibleforPTO;
    constructor(props: EmployeeMasterFormProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        this.HolidayType = React.createRef();
        this.WeekStartDay = React.createRef();
        this.MandatoryDescription = React.createRef();
        this.MandatoryProjectCode = React.createRef();
        this.EligibleforPTO = React.createRef();
    }

    public state = {
        ItemID: 0,
        EmployeeId: null,
        ClientName: '',
        HolidayType: '',
        ApproverId: { results: [] },
        ReviewerId: { results: [] },
        ClientsObject: [],
        HolidaysObject: [],
        DateOfJoining: new Date(),
        isActive: true,
        loading: false,
        errorMessage: '',
        EmployeeEmail: '',
        ReportingManagerId: { results: [] },
        ReportingManagerEmail: [],
        ApproverEmail: [],
        ReviewerEmail: [],
        weekStartDay: 'Monday',
        SelectedEmployee: '',
        SelectedClient: '',
        Homeredirect: false,
        MandatoryProjectCode: 'No',
        MandatoryDescription: 'No',
        isPageAccessable: true,
        showHideModal: false,
        modalTitle: '',
        modalText: '',
        message: "Success",
        showToaster: false,
        GlobalHolidayList: [],
        EligibleforPTO: false,
        isDisabled: false,
        // DelegateToId: { results: [] },
        // DelegateToEmail: [],
    }

    public componentDidMount() {
        highlightCurrentNav("employeemaster");
        this.setState({ loading: true });
        this.GetClients();
    }

    /* this function is used to 
    1. get al the active clients from client list 
    2. get current user groups
    3. Restricts other than Admin users to access the page
    */
    private async GetClients() {
        let Year = new Date().getFullYear() + "";
        let [clients, groups, Holidays] = await Promise.all([
            sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get(),
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('HolidaysList').items.top(2000).filter("Year eq '" + Year + "'").select('*').orderBy('ClientName').get()
        ])
        // this.setState({ClientsObject : clients})
        // console.log(clients);
        // this.setState({ loading: false});        this.setState({showToaster:true})
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if (this.props.match.params.id != undefined) {
            // this.setState({ loading: true});
            // console.log(this.props.match.params.id)
            // this.setState({ItemID : this.props.match.params.id})
            let ItemID = this.props.match.params.id
            this.getData(ItemID, Holidays, clients, userGroups)
        }
        else {
            if (userGroups.includes('Timesheet Administrators')) {
                this.setState({ isPageAccessable: true, showToaster: true })
            }
            else {
                this.setState({ isPageAccessable: false })
            }
            // let filterdHolidays = this.getHolidays(Holidays,'None')
            this.setState({ ClientsObject: clients, GlobalHolidayList: Holidays, HolidaysObject: [], loading: false })
        }
        // console.log("current user deatils")
        // console.log(this.props.context.pageContext)



    }

    // this function is used to get data from the employee master of Edit record
    private async getData(ID, Holidays, Clients, userGroups) {
        let filterQuery = "ID eq '" + ID + "'"
        let selectQuery = "Employee/ID,Employee/EMail,ReportingManager/ID,ReportingManager/EMail,Approvers/ID,Approvers/EMail,Reviewers/ID,Reviewers/EMail,*"
        // let Year = new Date().getFullYear()+"";
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand('Employee,ReportingManager,Approvers,Reviewers').get()
        // let Holidays = await  sp.web.lists.getByTitle('HolidaysList').items.top(2000).filter("Year eq '"+Year+"'").select('*').orderBy('ClientName').get()

        // console.log(data)
        let date = new Date(data[0].DateOfJoining)
        let ReportingManagersEmail = []
        let ReportingManagerIds = { results: [] }
        let ReviewerIds = { results: [] }
        if (data[0].ReportingManager.length > 0) {
            for (const user of data[0].ReportingManager) {
                ReportingManagersEmail.push(user.EMail)
                ReportingManagerIds.results.push(user.ID)
            }
        }
        // let DelegateToIds = { results: [] }
        // let DelegateToEmails = []
        // if(data[0].DelegateTo!=undefined){
        //     if (data[0].DelegateTo.length > 0) {
        //         for (const user of data[0].DelegateTo) {
        //             DelegateToEmails.push(user.EMail)
        //             DelegateToIds.results.push(user.ID)
        //         }
        //     }
        // }
        let ReviewersEMail = []
        if (data[0].Reviewers.length > 0) {
            for (const user of data[0].Reviewers) {
                ReviewersEMail.push(user.EMail)
                ReviewerIds.results.push(user.ID)
            }
        }
        // let NotifiersEMail = []
        // if(data[0].Notifiers.length>0){
        //     for (const user of data[0].Notifiers) {
        //         NotifiersEMail.push(user.EMail)
        //         NotifierIds.results.push(user.ID)
        //     }
        // }
        let pageAccessable = false, disabled = false;
        if (userGroups.includes('Timesheet Administrators')) {
            pageAccessable = true
        }
        else if (ReportingManagerIds.results.includes(this.props.spContext.userId)) {
            pageAccessable = true,
                disabled = true
        }
        else {
            this.setState({ isPageAccessable: false })
        }
        let filterdHolidays = this.getHolidays(Holidays, data[0].ClientName)
        this.setState({ ClientsObject: Clients, ItemID: ID, EmployeeEmail: data[0].Employee.EMail, EmployeeId: data[0].Employee.ID, ClientName: data[0].ClientName, isActive: data[0].IsActive, DateOfJoining: date, SelectedEmployee: data[0].Employee.ID, SelectedClient: data[0].ClientName, HolidayType: data[0].HolidayType, weekStartDay: data[0].WeekStartDay, MandatoryProjectCode: data[0].MandatoryProjectCode ? "Yes" : "No", MandatoryDescription: data[0].MandatoryDescription ? "Yes" : "No", EligibleforPTO: data[0].EligibleforPTO, ReportingManagerEmail: ReportingManagersEmail, ReportingManagerId: ReportingManagerIds, ReviewerEmail: ReviewersEMail, ReviewerId: ReviewerIds,HolidaysObject: filterdHolidays, GlobalHolidayList: Holidays, isDisabled: disabled, isPageAccessable: pageAccessable, showToaster: true, loading: false })
    }

    // this function is used to bind users to people pickers
    private _getPeoplePickerItems(items, name) {
        let value = null;
        let values = { results: [] };
        if (items.length > 0) {
            if (['EmployeeId'].includes(name))
                value = items[0].id;
            else if (['ReportingManagerId', 'ReviewerId', 'NotifierId'].includes(name)) {
                let multiple = { results: [] }
                for (const user of items) {
                    multiple.results.push(user.id)
                }
                values = multiple
            }
        }
        else {
            value = null;
        }
        name == 'EmployeeId' ? this.setState({ EmployeeId: value }) : name == 'ReportingManagerId' ? this.setState({ ReportingManagerId: values }) : name == 'ApproverId' ? this.setState({ ApproverId: values }) : name == 'ReviewerId' ? this.setState({ ReviewerId: values }) : ''//this.setState({ NotifiersId: values })
    }

    /* this function is used to get holidays of all the clients from HolidaysList and filters with the active clients present in client list.
    Filter based on the selected client and Synergy
    we show all the Client holidays and all Synergy
     */
    private getHolidays(HolidaysList, selectedClientName) {
        // let Year = new Date().getFullYear()+"";
        // let Holidays = await  sp.web.lists.getByTitle('HolidaysList').items.top(2000).filter("Year eq '"+Year+"'").select('*').orderBy('ClientName').get()
        let HolidayClients = []
        let filteredData = HolidaysList.filter(item => {
            const lowerCaseItem = item.ClientName.toLowerCase();
            let selectedClient = selectedClientName.toLowerCase()
            return lowerCaseItem.includes(selectedClient) || lowerCaseItem.includes('synergy');
        });

        //   console.log(filteredData);
        for (const client of filteredData) {
            if (!HolidayClients.includes(client.ClientName)) {
                HolidayClients.push(client.ClientName)
            }
        }
        return HolidayClients;
        // this.setState({HolidaysObject : HolidayClients,loading: false})
    }

    // this function is used to bind and set values to respect form feilds
    private handleChangeEvents = (event) => {
        // console.log(this.state);
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        // console.log(value);
        let { name } = event.target;
        this.setState({ [name]: value });
        if (name == 'ClientName') {
            if (value != '') {
                let HolidayClients = this.getHolidays(this.state.GlobalHolidayList, value)
                this.setState({ HolidaysObject: HolidayClients, HolidayType: '' })
            }
            else {
                this.setState({ HolidaysObject: [], HolidayType: '' })
            }
        }
    }

    // this function is used to set date to the date feild
    private UpdateDate = (dateprops) => {
        // console.log(dateprops)
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ DateOfJoining: date });

    }

    // this function is used to validate duplicate record if the  employee is already associated withe selected client or not
    private async validateDuplicateRecord() {

        if (this.state.SelectedEmployee == this.state.EmployeeId && this.state.SelectedClient == this.state.ClientName) {
            return 0;
        }
        else {
            let filterQuery = "Employee/Id eq '" + this.state.EmployeeId + "' and ClientName eq '" + this.state.ClientName + "' and IsActive eq 1"
            let selectQuery = "Employee/Title,Employee/ID,*"
            let duplicateRecord = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand('Employee').orderBy('Title').get()
            // console.log(duplicateRecord);
            // console.log("length = "+duplicateRecord.length)
            return duplicateRecord.length;
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
            Employee: { val: this.state.EmployeeId, required: true, Name: 'Employee', Type: ControlType.people, Focusid: 'divEmployee' },
            // ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting Manager', Type: ControlType.people, Focusid: 'divReportingManager' },
            // Approver : { val: this.state.ApproverId, required: true, Name: 'Approver', Type: ControlType.people,Focusid:'divApprover' },
            // Reviewer: { val: this.state.ReviewerId, required: true, Name: 'Reviewer', Type: ControlType.people,Focusid:'divReviewer' },
            // Notifier : { val: this.state.NotifierId, required: true, Name: 'Notifier', Type: ControlType.people,Focusid:'divNotifier' },
            Client: { val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.client },
            HolidayType: { val: this.state.HolidayType, required: true, Name: 'Holiday Calendar', Type: ControlType.string, Focusid: this.HolidayType },
            DateOfJoining: { val: this.state.DateOfJoining, required: true, Name: 'Date Of Joining', Type: ControlType.date }
        }
        let isValid = Formvalidator.checkValidations(data)
        let pdata = {
            // Approver : { val: this.state.ApproverId, required: true, Name: 'Approver', Type: ControlType.people,Focusid:'divApprover' },
            ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting Manager', Type: ControlType.people, Focusid: 'divReportingManager'},
            Reviewer: { val: this.state.ReviewerId, required: true, Name: 'Reviewer', Type: ControlType.people, Focusid: 'divReviewer' },
            // DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.people, Focusid: 'divDelegateTo'},
            // Notifier : { val: this.state.NotifierId, required: true, Name: 'Notifier', Type: ControlType.people,Focusid:'divNotifier' },
        }
        isValid = isValid.status ? Formvalidator.multiplePeoplePickerValidation(pdata) : isValid
        // console.log(isValid)
        let Rm = []
        for (let manager of this.state.ReportingManagerId.results) {
            Rm.push(manager)
        }
        // let Delegates = []
        // for (let delegate of this.state.DelegateToId.results) {
        //     Delegates.push(delegate)
        // }
        // let noDuplicates = true
        // Rm.forEach(element => {
        //     if (Delegates.includes(element)) {
        //         noDuplicates = false;
        //     }
        // });
        if (!isValid.status) {
            // this.setState({showToaster:true})
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
        else if (Rm.includes(this.state.EmployeeId)) {
            let errMsg = 'The selected Employee cannot be assigned as their own Manager.';
            // this.setState({showToaster:true})
            customToaster('toster-error', ToasterTypes.Error, errMsg, 4000)
        }
        // else if (Delegates.includes(this.state.EmployeeId)) {
        //     let errMsg = 'The selected Employee cannot be assigned as their own Delegate To.';
        //     // this.setState({showToaster:true})
        //     customToaster('toster-error', ToasterTypes.Error, errMsg, 4000)
        // }
        // else if (!noDuplicates) {
        //     let errMsg = 'The Reporting Managers and Delegate To Managers should be unique.';
        //     customToaster('toster-error', ToasterTypes.Error, errMsg, 4000)
        // }
        else {
            // console.log(data);
            let postObject = {
                EmployeeId: this.state.EmployeeId,
                ReportingManagerId: this.state.ReportingManagerId,
                ClientName: this.state.ClientName,
                IsActive: this.state.isActive,
                ApproversId: this.state.ApproverId,
                ReviewersId: this.state.ReviewerId,
                // DelegateToId: this.state.DelegateToId,
                // NotifiersId : this.state.NotifierId,
                DateOfJoining: this.state.DateOfJoining,
                MandatoryDescription: this.state.MandatoryDescription == 'Yes' ? true : false,
                MandatoryProjectCode: this.state.MandatoryProjectCode == 'Yes' ? true : false,
                EligibleforPTO: this.state.EligibleforPTO,
                WeekStartDay: this.state.weekStartDay,
                HolidayType: this.state.HolidayType
            }
            let duplicate = await this.validateDuplicateRecord()
            if (duplicate > 0) {
                //    console.log("duplicate record found");
                //    this.setState({showToaster:true})
                customToaster('toster-error', ToasterTypes.Error, 'Current Employee is already associated with ' + this.state.ClientName + " client", 4000)
            }
            else {
                this.setState({ errorMessage: '' })
                this.InsertorUpdatedata(postObject, '');
            }
        }
    }

    // this function is used save data in the list
    private InsertorUpdatedata(formdata, actionStatus) {
        if (this.state.ItemID > 0) {
            this.setState({ loading: true });
            //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then((res) => {
                this.setState({ loading: false });
                this.setState({ message: 'Success-Update', Homeredirect: true })
            }, (error) => {
                console.log(error);
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle(this.listName).items.add(formdata).then((res) => {
                    // console.log(res);
                    this.setState({ loading: false });
                    // alert('Data inserted sucessfully')
                    this.setState({ message: 'Success-Added', Homeredirect: true })
                    // this.setState({showHideModal : true,modalText: 'Employee configuration updated successfully',modalTitle:'Success'});
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

    // this function is used to close popup
    private handleClose = () => {
        this.setState({ loading: false, showHideModal: false, message: '', Homeredirect: true })
    }

    public render() {
        if (!this.state.isPageAccessable) {
            let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            window.location.href = url
        }
        if (this.state.Homeredirect) {
            let message = this.state.message
            let url
            if (this.props.match.params.redirect != undefined)
                url = `/Dashboard`
            else
                url = `/EmployeeMasterView/${message}`

            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={true}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Approval Matrix
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
                                                    <label className='lblPeoplepicker'>Employee <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divEmployee">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            disabled={this.state.isDisabled}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'EmployeeId')}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.EmployeeEmail]}
                                                            principalTypes={[PrincipalType.User]} placeholder=""
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Client<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleChangeEvents} disabled={this.state.isDisabled}>
                                                        <option value=''>None</option>
                                                        {this.state.ClientsObject.map((option) => (
                                                            <option value={option.Title} selected={option.Title == this.state.ClientName}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">Date of Joining <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divDateofJoining">

                                                        <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.DateOfJoining} isDisabled={this.state.isDisabled} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Holiday Calendar<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="HolidayType" title="HolidayType" id='HolidayType' ref={this.HolidayType} onChange={this.handleChangeEvents} disabled={this.state.isDisabled}>
                                                        <option value=''>None</option>
                                                        {this.state.HolidaysObject.map((option) => (
                                                            <option value={option} selected={option == this.state.HolidayType}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="row pt-2 px-2">

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label className='lblPeoplepicker'>Reporting Manager <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divReportingManager">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={10}
                                                            showtooltip={false}
                                                            disabled={this.state.isDisabled}
                                                            defaultSelectedUsers={this.state.ReportingManagerEmail}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'ReportingManagerId')}
                                                            ensureUser={true}
                                                            required={true}
                                                            principalTypes={[PrincipalType.User]} placeholder=""
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label className='lblPeoplepicker'> Synergy Reviewer <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divReviewer">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={10}
                                                            showtooltip={false}
                                                            disabled={this.state.isDisabled}
                                                            defaultSelectedUsers={this.state.ReviewerEmail}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'ReviewerId')}
                                                            ensureUser={true}
                                                            required={true}
                                                            principalTypes={[PrincipalType.User]} placeholder=""
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* ---Description--- */}
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Is Description Mandatory</label>
                                                    <select className="form-control" name="MandatoryDescription" title="MandatoryDescription" id='MandatoryDescription' ref={this.MandatoryDescription} onChange={this.handleChangeEvents} value={this.state.MandatoryDescription}>
                                                        <option value='No'>No</option>
                                                        <option value='Yes'>Yes</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {/* ---Description--- */}
                                            {/* <div className="col-md-3">
                                                <div className="light-text">
                                                    <label className='lblPeoplepicker'>Delegate To</label>
                                                    <div className="custom-peoplepicker" id="divDelegateTo">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={10}
                                                            showtooltip={false}
                                                            disabled={this.state.isDisabled}
                                                            defaultSelectedUsers={this.state.DelegateToEmail}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'DelegateToId')}
                                                            ensureUser={true}
                                                            required={true}
                                                            principalTypes={[PrincipalType.User]} placeholder=""
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div> */}
                                            {/* Notifers */}
                                            {/* <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Notifier <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divNotifier">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    defaultSelectedUsers = {this.state.NotifierEmail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'NotifierId')}    
                                                                    ensureUser={true}
                                                                    required={true}        
                                                                    principalTypes={[PrincipalType.User]} placeholder=""
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div> */}
                                            {/* Notifiers */}
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Week Start Day</label>
                                                    <select className="form-control" name="weekStartDay" title="WeekStartDay" id='WeekStartDay' disabled={this.state.isDisabled} ref={this.WeekStartDay} onChange={this.handleChangeEvents} value={this.state.weekStartDay}>
                                                        <option value='Monday'>Monday</option>
                                                        <option value='Tuesday'>Tuesday</option>
                                                        <option value='Wednesday'>Wednesday</option>
                                                        <option value='Thursday'>Thursday</option>
                                                        <option value='Friday'>Friday</option>
                                                        <option value='Saturday'>Saturday</option>
                                                        <option value='Sunday'>Sunday</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row pt-2 px-2">
                                            {/* <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Approver <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divApprover">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    defaultSelectedUsers = {this.state.ApproverEmail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'ApproverId')}    
                                                                    ensureUser={true}
                                                                    required={true}        
                                                                    principalTypes={[PrincipalType.User]} placeholder=""
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div> */}

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Is Project Code Mandatory</label>
                                                    <select className="form-control" name="MandatoryProjectCode" title="MandatoryProjectCode" id='MandatoryProjectCode' ref={this.MandatoryProjectCode} onChange={this.handleChangeEvents} value={this.state.MandatoryProjectCode}>
                                                        <option value='No'>No</option>
                                                        <option value='Yes'>Yes</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Eligible for PTO */}
                                            {/* <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Is Eligible for PTO</label>
                                                    <select className="form-control" name="EligibleforPTO" title="Is Eligible for PTO" id='EligibleforPTO' ref={this.EligibleforPTO} onChange={this.handleChangeEvents} value={this.state.EligibleforPTO} disabled={this.state.isDisabled}>
                                                        <option value='Yes'>Yes</option>
                                                        <option value='No'>No</option>
                                                    </select>
                                                </div>
                                            </div> */}
                                            <div className="col-md-3">
                                                <div className="light-text" id='chkIsActive'>
                                                    <InputCheckBox
                                                        label={"Is Eligible for PTO"}
                                                        name={"EligibleforPTO"}
                                                        checked={this.state.EligibleforPTO}
                                                        onChange={this.handleChangeEvents}
                                                        isforMasters={false}
                                                        isdisable={this.state.isDisabled}
                                                    />
                                                </div>
                                            </div>
                                            {/* EligibleforPTO */}
                                            <div className="col-md-3">
                                                <div className="light-text" id='chkIsActive'>
                                                    <InputCheckBox
                                                        label={"Is Active"}
                                                        name={"isActive"}
                                                        checked={this.state.isActive}
                                                        onChange={this.handleChangeEvents}
                                                        isforMasters={false}
                                                        isdisable={this.state.isDisabled}
                                                    />
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
export default EmployeeMasterForm

