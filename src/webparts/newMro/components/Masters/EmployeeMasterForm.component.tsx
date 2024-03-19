import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, Dropdowns, ActionStatus, ApprovalStatus, PendingStatus,StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import Loader from '../Shared/Loader';
import { SPBatch, sp } from '@pnp/sp';
import { Web } from '@pnp/sp/webs';
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
import { highlightCurrentNav, sortDataByTitle } from '../../Utilities/HighlightCurrentComponent';
import FileUpload from '../Shared/FileUpload';
import DatePicker from "../Shared/DatePickerField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faL, faPlus,faPrint, fas} from "@fortawesome/free-solid-svg-icons";
import formValidation from '../../Utilities/Formvalidator';
import { Navigate } from 'react-router-dom';
import { confirm } from 'react-confirm-box';
import InputCheckBox from '../Shared/InputCheckBox';
// import CustomDatePicker from './DatePicker';


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
    private clientListName="Client";
    private ItemID = "";
    private client;
    private HolidayType;
    private WeekStartDay;
    private MandatoryDescription;
    private MandatoryProjectCode;
    constructor(props: EmployeeMasterFormProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        // this.userContext = this.props.spContext;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client=React.createRef();
        this.HolidayType = React.createRef();
        this.WeekStartDay = React.createRef();
        this.MandatoryDescription = React.createRef();
        this.MandatoryProjectCode  = React.createRef();
    }

    public state = {
        ItemID : 0,
        EmployeeId : null,
        // ReportingManagerId : null,
        ClientName : '',
        HolidayType: '',
        ApproverId : {results:[]},
        ReviewerId: {results:[]},
        // NotifierId: {results:[]},
        ClientsObject : [],
        HolidaysObject: [],
        DateOfJoining : new Date(),
        isActive: true,
        loading : false,
        errorMessage : '',
        EmployeeEmail:'',
        ReportingManagerId : {results:[]},
        ReportingManagerEmail:[],
        ApproverEmail : [],
        ReviewerEmail: [],
        // NotifierEmail: [],
        weekStartDay: 'Monday',
        SelectedEmployee : '',
        SelectedClient : '',
        Homeredirect: false,
        MandatoryProjectCode:'No',
        MandatoryDescription:'No',
        isPageAccessable: true,
        showHideModal: false,
        modalTitle:'',
    }

    public componentDidMount() {
        highlightCurrentNav("employeemaster");
        this.setState({ loading: true });
        // this.getUserGroups();
         this.GetClients();
    }

    private async GetClients() {

        let [clients,groups] = await Promise.all([
            sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get(),
            sp.web.currentUser.groups()
        ])
        this.setState({ClientsObject : clients})
        // let HolidayClients = []
        // for (const client of Holidays) {
        //     if(!HolidayClients.includes(client.ClientName))
        //     HolidayClients.push(client.ClientName)
        // }
        // this.setState({HolidaysObject : HolidayClients})
        console.log(clients);
        this.setState({ loading: false });

        if(this.props.match.params.id != undefined){
            this.setState({ loading: true });
            console.log(this.props.match.params.id)
            this.setState({ItemID : this.props.match.params.id})
            this.getData()
        }
        console.log("current user deatils")
        console.log(this.props.context.pageContext)

        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if(userGroups.includes('Timesheet Owners') || userGroups.includes('Timesheet Members')){
            this.setState({isPageAccessable : true})
        }
        else{
            this.setState({isPageAccessable : false})
        }
        // let user = userGroup=='Timesheet Initiators' ?'Initiator': userGroup=='Timesheet Approvers'?'Approver':userGroup=='Timesheet Reviewers'?'Reviewer':'Administrator'
        // console.log('You are :'+user)

        // if(user !='Administrator'){
        //     this.setState({isPageAccessable : false})
        // }


    }

    private async getData(){
        let filterQuery = "ID eq '"+this.state.ItemID+"'"
        let selectQuery = "Employee/ID,Employee/EMail,ReportingManager/ID,ReportingManager/EMail,Approvers/ID,Approvers/EMail,Reviewers/ID,Reviewers/EMail,Notifiers/ID,Notifiers/EMail,*"
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand('Employee,ReportingManager,Approvers,Reviewers,Notifiers').get()
        console.log(data)
        this.setState({EmployeeEmail : data[0].Employee.EMail,EmployeeId : data[0].Employee.ID})
        // this.setState({ReportingManagerEmail : data[0].ReportingManager.EMail,ReportingManagerId:data[0].ReportingManager.ID})
        this.setState({ClientName : data[0].ClientName})
        this.setState({isActive : data[0].IsActive})
        let date = new Date(data[0].DateOfJoining)
        this.setState({ DateOfJoining : date })
        this.setState({SelectedEmployee : data[0].Employee.ID})
        this.setState({SelectedClient : data[0].ClientName })
        this.setState({HolidayType : data[0].HolidayType})
        this.setState({weekStartDay : data[0].WeekStartDay })
        this.setState({MandatoryProjectCode : data[0].MandatoryProjectCode?"Yes":"No" })
        this.setState({MandatoryDescription : data[0].MandatoryDescription?"Yes":"No" })

        // let ApproversEMail = []
        let ReportingManagersEmail = []
        // let ApproverIds = {results:[]}
        let ReportingManagerIds = {results:[]}
        let ReviewerIds = {results:[]}
        // let NotifierIds = {results:[]}

        if(data[0].ReportingManager.length>0){
            let array = []
            for (const user of data[0].ReportingManager) {
                ReportingManagersEmail.push(user.EMail)
                ReportingManagerIds.results.push(user.ID)
            }
        }
        let ReviewersEMail = []
        if(data[0].Reviewers.length>0){
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
        // this.setState({ ApproverEmail: ApproversEMail,ApproverId : ApproverIds})
        this.setState({ ReportingManagerEmail: ReportingManagersEmail,ReportingManagerId : ReportingManagerIds})
        this.setState({ReviewerEmail : ReviewersEMail,ReviewerId : ReviewerIds})
        // this.setState({NotifierEmail : NotifiersEMail,NotifierId: NotifierIds})
        this.setState({ loading: false });
    }
    private _getPeoplePickerItems(items, name) { 
        
         let value = null;
         let values = {results:[]};
        if (items.length > 0) {
            if(['EmployeeId'].includes(name))
            value = items[0].id;
        else if(['ReportingManagerId','ReviewerId','NotifierId'].includes(name)){
            let multiple = {results:[]}
                for (const user of items) {
                    multiple.results.push(user.id)
                }
                values = multiple
            }
        }
        else {
            value = null;
        }
        name == 'EmployeeId'?this.setState({ EmployeeId: value }):name == 'ReportingManagerId'?this.setState({ ReportingManagerId: values }):name == 'ApproverId'?this.setState({ ApproverId: values }):name == 'ReviewerId'?this.setState({ ReviewerId: values }):this.setState({ NotifierId: values })
    }

    private async getHolidays(){
        let Year = new Date().getFullYear()+"";
        let Holidays = await  sp.web.lists.getByTitle('HolidaysList').items.filter("Year eq '"+Year+"'").select('*').orderBy('ClientName').get()
      let HolidayClients = []
      let filteredData = Holidays.filter(item=> {
        const lowerCaseItem = item.ClientName .toLowerCase();
        let selectedClient = this.state.ClientName.toLowerCase()
        return lowerCaseItem.includes(selectedClient) || lowerCaseItem.includes('synergy');
      });

      console.log(filteredData);
            for (const client of filteredData) {
                    if(!HolidayClients.includes(client.ClientName)){
                        HolidayClients.push(client.ClientName)
                    }
                }
            this.setState({HolidaysObject : HolidayClients})
    }
    private handleChangeEvents=(event)=>{
        console.log(this.state);
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        console.log(value);
        let  {name}  = event.target;
        this.setState({[name] : value});
        if(name == 'ClientName'){
            if(value!='')
            this.getHolidays()
            else
            this.setState({HolidaysObject : []})
        }
        
        // if(name == 'isActive')
        // this.setState({isActive : value})
        // else
    }
    
    private UpdateDate = (dateprops) => {
        console.log(dateprops)
        let date = new Date()
        if(dateprops[0]!= null){
            date = new Date(dateprops[0])
        }
        this.setState({ DateOfJoining : date });

    }



private async validateDuplicateRecord () {

    if(this.state.SelectedEmployee==this.state.EmployeeId && this.state.SelectedClient == this.state.ClientName){
        return 0;
    }
    else{
        let filterQuery = "Employee/Id eq '"+this.state.EmployeeId+"' and ClientName eq '"+this.state.ClientName+"' and IsActive eq 1"
        let selectQuery = "Employee/Title,Employee/ID,*"
        let duplicateRecord = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand('Employee').orderBy('Title').get()
        console.log(duplicateRecord);
        console.log("length = "+duplicateRecord.length)
        return duplicateRecord.length;
    }
}

    private handleCancel = async (e)=>{
        this.setState({Homeredirect : true});
    }


    private handleSubmit = async (e)=>{
        let data ={
        Employee : { val: this.state.EmployeeId, required: true, Name: 'Employee', Type: ControlType.people,Focusid:'divEmployee' },
        ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting Manager', Type: ControlType.people,Focusid:'divReportingManager' },
        // Approver : { val: this.state.ApproverId, required: true, Name: 'Approver', Type: ControlType.people,Focusid:'divApprover' },
        // Reviewer: { val: this.state.ReviewerId, required: true, Name: 'Reviewer', Type: ControlType.people,Focusid:'divReviewer' },
        // Notifier : { val: this.state.NotifierId, required: true, Name: 'Notifier', Type: ControlType.people,Focusid:'divNotifier' },
        Client:{ val: this.state.ClientName, required: true, Name: 'Client', Type: ControlType.string,Focusid:this.client },
        HolidayType:{val: this.state.HolidayType, required: true, Name: 'Holiday Type', Type: ControlType.string,Focusid:this.HolidayType},
        DateOfJoining: { val: this.state.DateOfJoining, required: true, Name: 'Date Of Joining', Type: ControlType.date }
        }
        let isValid = Formvalidator.checkValidations(data)
         let pdata = {
            // Approver : { val: this.state.ApproverId, required: true, Name: 'Approver', Type: ControlType.people,Focusid:'divApprover' },
            ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting Manager', Type: ControlType.people,Focusid:'divReportingManager' },
            Reviewer: { val: this.state.ReviewerId, required: true, Name: 'Reviewer', Type: ControlType.people,Focusid:'divReviewer' },
            // Notifier : { val: this.state.NotifierId, required: true, Name: 'Notifier', Type: ControlType.people,Focusid:'divNotifier' },
        }
        isValid = isValid.status?Formvalidator.multiplePeoplePickerValidation(pdata):isValid
        console.log(isValid)
        let Rm = []
        for(let manager of this.state.ReportingManagerId.results){
            Rm.push(manager)
        }
        if(!isValid.status){
            this.setState({errorMessage : isValid.message})
        }
        else if(Rm.includes(this.state.EmployeeId)){
            let errMsg = 'The selected Employee can not be assigned as their own Manager';
            this.setState({errorMessage : errMsg});
        }
        else{
            console.log(data);
            let postObject = {
                EmployeeId : this.state.EmployeeId,
                ReportingManagerId : this.state.ReportingManagerId,
                ClientName : this.state.ClientName,
                IsActive : this.state.isActive,
                ApproversId : this.state.ApproverId,
                ReviewersId : this.state.ReviewerId,
                // NotifiersId : this.state.NotifierId,
                DateOfJoining : this.state.DateOfJoining,
                MandatoryDescription:this.state.MandatoryDescription == 'Yes'?true:false,
                MandatoryProjectCode:this.state.MandatoryProjectCode == 'Yes'?true:false,
                WeekStartDay: this.state.weekStartDay,
                HolidayType : this.state.HolidayType
            }
           let duplicate = await this.validateDuplicateRecord()
           if(duplicate>0){
               console.log("duplicate record found");
               this.setState({errorMessage : 'Current Employee is already assosiated with '+this.state.ClientName+" client"})
           }
           else{
                this.setState({errorMessage : ''})
                this.InsertorUpdatedata(postObject, '');
           }

        }
    }

    private InsertorUpdatedata(formdata, actionStatus) {
        if (this.state.ItemID > 0) {   
            this.setState({ loading: true });
            //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then((res) => {
                this.setState({ loading: false});
                // alert('Data updated sucessfully');
                this.setState({showHideModal : true,modalTitle: 'Employee configuration updated sucessfully'});
            }, (error) => {
                console.log(error);
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle(this.listName).items.add(formdata).then((res) => {
                    console.log(res);
                    this.setState({ loading: false});
                    // alert('Data inserted sucessfully')
                    
                    this.setState({showHideModal : true,modalTitle: 'Employee configured added sucessfully'});
                }, (error) => {
                    console.log(error);
                });
            }
            catch (e) {
                console.log('Failed to add');
                this.onError();
            }

        }
    }

    private onSucess = (Action, ItemID,emaildetails) => {
        // if(Action == "submitted successfully" || Action == "rejected successfully"||Action == "approved successfully"){
        //     // this.sendemail(Action,ItemID,emaildetails);
        // }
        // else{
        //     // this.setState({ modalTitle: 'Success', modalText: 'Requisition Details ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID,showHideModalConfirm:false });
        // }
        // // this.setState({ modalTitle: 'Success', modalText: 'Requisition Details ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID });
    }

    private onError = () => {
        // this.setState({ modalTitle: 'Error', modalText: ActionStatus.Error, showHideModal: true, loading: false, isSuccess: false, ItemID: 0 ,showHideModalConfirm:false});
    }
    private handleClose(){
        this.setState({showHideModal : false,Homeredirect: true})
    }
   public render() {
    if(!this.state.isPageAccessable){
        let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
        // return (<Navigate to={url} />);
        window.location.href = url
    }
    if (this.state.Homeredirect) {
       
        let url = `/EmployeeMasterView`
        return (<Navigate to={url} />);
    }
else {
            return (
                <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={''} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={true}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div id="clickMenu" className="menu-icon-outer">
                            <div className="menu-icon">
                                <span>
                                </span>
                                <span>
                                </span>
                                <span>
                                </span>
                            </div>
                        </div>
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
                                                        <label>Employee <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divEmployee">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={1}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'EmployeeId')}    
                                                                    ensureUser={true}
                                                                    required={true}   
                                                                    defaultSelectedUsers = {[this.state.EmployeeEmail]}
                                                                    principalTypes={[PrincipalType.User]} placeholder="Employee"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>

                                                </div>

                                                <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Client<span className="mandatoryhastrick">*</span></label>
                                                        <select className="form-control" required={true} name="ClientName" title="Client" id='client' ref={this.client} onChange={this.handleChangeEvents}>
                                                            <option value=''>None</option>
                                                            {this.state.ClientsObject.map((option) => (
                                                                <option value={option.Title} selected={option.Title ==this.state.ClientName}>{option.Title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">Date of Joining <span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divDateofJoining">
                                                    
                                                    <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.DateOfJoining}/>
                                                </div>
                                            </div>
                                                </div>

                                                <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Holiday Type<span className="mandatoryhastrick">*</span></label>
                                                        <select className="form-control" required={true} name="HolidayType" title="HolidayType" id='HolidayType' ref={this.HolidayType} onChange={this.handleChangeEvents}>
                                                            <option value=''>None</option>
                                                            {this.state.HolidaysObject.map((option) => (
                                                                <option value={option} selected={option ==this.state.HolidayType}>{option}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                               
                                            </div>

                                            <div className="row pt-2 px-2">

                                            <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Manager <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divReportingManager">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    defaultSelectedUsers = {this.state.ReportingManagerEmail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'ReportingManagerId')}    
                                                                    ensureUser={true}
                                                                    required={true}        
                                                                    principalTypes={[PrincipalType.User]} placeholder="Reporting Manager"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                            </div>

                                            <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Reviewer <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divReviewer">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    defaultSelectedUsers = {this.state.ReviewerEmail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'ReviewerId')}    
                                                                    ensureUser={true}
                                                                    required={true}        
                                                                    principalTypes={[PrincipalType.User]} placeholder="Reviewer"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                            </div>

 

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
                                                                    principalTypes={[PrincipalType.User]} placeholder="Notifier"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div> */}
                                                {/* Notifiers */}

                                                {/* ///////////// */}
                                                    {/* <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Week Start Day<span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control"  name="weekStartDay" title="WeekStartDay" id='WeekStartDay' ref={this.WeekStartDay} onChange={this.handleChangeEvents} value={this.state.weekStartDay}>
                                                                <option value='Monday'>Monday</option>
                                                                <option value='Tuesday'>Tuesday</option>
                                                                <option value='Wednessday'>Wednessday</option>
                                                                <option value='Thursday'>Thursday</option>
                                                                <option value='Friday'>Friday</option>
                                                                <option value='Saturday'>Saturday</option>
                                                                <option value='Sunday'>Sunday</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Is Description Mandatory<span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control"  name="MandatoryDescription" title="MandatoryDescription" id='MandatoryDescription' ref={this.MandatoryDescription} onChange={this.handleChangeEvents} value={this.state.MandatoryDescription}>
                                                                <option value='No'>No</option>
                                                                <option value='Yes'>Yes</option>
                                                            </select>
                                                        </div>
                                                    </div> */}
                                                    {/* /////// */}
                                                 

                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Week Start Day</label>
                                                            <select className="form-control"  name="weekStartDay" title="WeekStartDay" id='WeekStartDay' ref={this.WeekStartDay} onChange={this.handleChangeEvents} value={this.state.weekStartDay}>
                                                                <option value='Monday'>Monday</option>
                                                                <option value='Tuesday'>Tuesday</option>
                                                                <option value='Wednessday'>Wednesday</option>
                                                                <option value='Thursday'>Thursday</option>
                                                                <option value='Friday'>Friday</option>
                                                                <option value='Saturday'>Saturday</option>
                                                                <option value='Sunday'>Sunday</option>
                                                            </select>
                                                        </div>
                                                    </div>


                                                   
                                                {/* ---Description--- */}
                                                <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Is Description Mandatory</label>
                                                            <select className="form-control"  name="MandatoryDescription" title="MandatoryDescription" id='MandatoryDescription' ref={this.MandatoryDescription} onChange={this.handleChangeEvents} value={this.state.MandatoryDescription}>
                                                                <option value='No'>No</option>
                                                                <option value='Yes'>Yes</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                {/* ---Description--- */}


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
                                                                    principalTypes={[PrincipalType.User]} placeholder="Approver"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div> */}
                                                {/* /////////////// */}
                                                {/* <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Week Start Day<span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control"  name="weekStartDay" title="WeekStartDay" id='WeekStartDay' ref={this.WeekStartDay} onChange={this.handleChangeEvents} value={this.state.weekStartDay}>
                                                                <option value='Monday'>Monday</option>
                                                                <option value='Tuesday'>Tuesday</option>
                                                                <option value='Wednessday'>Wednessday</option>
                                                                <option value='Thursday'>Thursday</option>
                                                                <option value='Friday'>Friday</option>
                                                                <option value='Saturday'>Saturday</option>
                                                                <option value='Sunday'>Sunday</option>
                                                            </select>
                                                        </div>
                                                    </div> */}
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Is Project Code Mandatory</label>
                                                            <select className="form-control"  name="MandatoryProjectCode" title="MandatoryProjectCode" id='MandatoryProjectCode' ref={this.MandatoryProjectCode} onChange={this.handleChangeEvents} value={this.state.MandatoryProjectCode}>
                                                                <option value='No'>No</option>
                                                                <option value='Yes'>Yes</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {/* ------------ Description ------------- */}
                                                    {/* <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Is Description Mandatory</label>
                                                            <select className="form-control"  name="MandatoryDescription" title="MandatoryDescription" id='MandatoryDescription' ref={this.MandatoryDescription} onChange={this.handleChangeEvents} value={this.state.MandatoryDescription}>
                                                                <option value='No'>No</option>
                                                                <option value='Yes'>Yes</option>
                                                            </select>
                                                        </div>
                                                    </div> */}
                                                    {/* -------------Description end------------- */}
                                                {/* <div className="col-md-3">
                                                    <div className="light-text">
                                                        <label>Reviewer <span className="mandatoryhastrick">*</span></label>
                                                        <div className="custom-peoplepicker" id="divReviewer">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    disabled={false}
                                                                    defaultSelectedUsers = {this.state.ReviewerEmail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'ReviewerId')}    
                                                                    ensureUser={true}
                                                                    required={true}        
                                                                    principalTypes={[PrincipalType.User]} placeholder="Reviewer"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
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
                                                                    principalTypes={[PrincipalType.User]} placeholder="Notifier"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                        </div>
                                                    </div>
                                                </div> */}
                                                {/* ////////////// */}
                                            <div className="col-md-3">
                                                    <div className="light-text" id='chkIsActive'>
                                                        <InputCheckBox
                                                        label={"Is Active"}
                                                        name={"isActive"}
                                                        checked={this.state.isActive}
                                                        onChange={this.handleChangeEvents}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        />
                                                    </div>
                                            </div>
                                            </div>
                                    </div>

                                </div>

   
                                <div className="row mx-1" id="">
                                                <div className="col-sm-12 text-center my-2" id="">
                                                    <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>Submit</button>
                                                    <button type="button" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                                </div>
                                </div>


                                {/* Error Message */}
                                <div>
                                    <span className='text-validator'> {this.state.errorMessage}</span>
                                </div>

                            </div>
                        </div>
                    </div>
                    {this.state.loading && <Loader />}
                </React.Fragment >
            );
    }
}
}
export default EmployeeMasterForm

