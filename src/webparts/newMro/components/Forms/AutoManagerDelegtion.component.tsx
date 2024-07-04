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
import DatePicker from "../Shared/DatePickerField";
import { highlightCurrentNav2 } from '../../Utilities/HighlightCurrentComponent';
export interface DelegateMangerProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface DelegateMangerState {
}

class DelegateManagerApprovals extends React.Component<DelegateMangerProps, DelegateMangerState> {
    private ReportingManager;
    private DelegateTo;
    private From;
    private To;
    private siteURL;
    // handleChangeEvents: ChangeEventHandler<HTMLTextAreaElement>;
    constructor(props: DelegateMangerProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.ReportingManager = React.createRef();
        this.DelegateTo = React.createRef();
    }

    public state = {
        ReportingManagerName: this.props.spContext.userDisplayName,
        ReportingManagerId: '',
        ReportingManagersObj: [],
        DelegateToId: '',
        DelegateToName:'',
        DelegateToObj: [],
        ClientDeligatesObj:[],
        ClientManagersObj:[],
        From: null,
        To: null,
        Comments: '',
        ActionHistory: [],
        PreviousDateHistory: [],
        showToaster: false,
        loading: false,
        isRecordAcessable: true,
        isAdmin:false,
        Homeredirect:false,
        message:'Success-Delegated',
        userGroups:[],
        ItemID:0,
        Client:''
    }

    public componentDidMount() {
        highlightCurrentNav2("liDashboard")
        this.setState({ loading: true });
        if (this.props.match.params.id != undefined) {
            let ItemID = this.props.match.params.id
            this.getItemIDdata(ItemID)
        }
        else{
            this.getOnLoadData();
        }
    }

    private SetFromDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ From: date });
    }

    private async getOnLoadData() {
        let [reportingManagers,Clients,groups] = await Promise.all([
            sp.web.lists.getByTitle('EmployeeMaster').items.filter("IsActive eq '1'").expand('ReportingManager').select('ReportingManager/Title,ReportingManager/ID,*').orderBy('ReportingManager/Title', true).getAll(),
            sp.web.lists.getByTitle('Client').items.select('DelegateTo/ID,DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll(),
            sp.web.currentUser.groups(),
        ])
        let isAdmin = false,userGroups = [],ClientDeligates = [],Managers =[],ClientManagers = [],ManagersObj=[]
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if(userGroups.includes('Timesheet Administrators')){
            isAdmin = true
        }
        for (const C of Clients) {
            ClientDeligates.push({Client:C.Title,DelegateTo:C.DelegateTo})
        }
        //MLC --
        for (const manager of reportingManagers) {
            for (const m of manager.ReportingManager) {                
                if(!Managers.includes(m.Title)){
                    Managers.push(m.Title)
                    ManagersObj.push({ID:m.ID,Title:m.Title})
                }
            }
            ClientManagers.push({Client:manager.ClientName,Managers:manager.ReportingManager})
        }
        //  --MLC
        if(!isAdmin){
            let Delegateobj =[] 
            let manager = ClientManagers.find(item=>{
                return item.Managers.some(m => {
                    return m.ID == parseInt(this.props.spContext.userId)
                });
            })
            let Delegates = ClientDeligates.find(item=>{
               return item.Client == manager.Client
            })
            Delegates.DelegateTo.forEach(obj => {
                if (obj.ID !== parseInt(this.props.spContext.userId)) {
                    Delegateobj.push(obj);
                }
            });
                this.setState({ReportingManagersObj: ManagersObj,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,userGroups:userGroups,isAdmin:isAdmin,showToaster:true,DelegateToObj: Delegateobj,Client:manager.Client,DelegateToName:''});
                let data = await  sp.web.lists.getByTitle('Delegations').items.filter("ReportingManager/ID eq'"+this.props.spContext.userId+"'").expand('ReportingManager,DelegateTo').select('ReportingManager/Title,ReportingManager/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('ReportingManager/Title', true).get()
                if(data.length>0){
                  let res = data[0]
                  this.setState({ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,loading:false})
                }
                else{
                    this.setState({loading:false})
                }
          
        }
        else{
        this.setState({ReportingManagersObj: ManagersObj,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,DelegateToName:'',userGroups:userGroups,isAdmin:isAdmin,showToaster:true,loading:false})
        }

        // this.getItemIDdata
    }

    async getItemIDdata(ItemID){
        let [reportingManagers,Clients,groups,ItemData] = await Promise.all([
            sp.web.lists.getByTitle('EmployeeMaster').items.filter("IsActive eq '1'").expand('ReportingManager').select('ReportingManager/Title,ReportingManager/ID,*').orderBy('ReportingManager/Title', true).getAll(),
            sp.web.lists.getByTitle('Client').items.select('DelegateTo/ID,DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll(),
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('Delegations').items.filter("ID eq'"+ItemID+"'").expand('ReportingManager,DelegateTo').select('ReportingManager/Title,ReportingManager/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('ReportingManager/Title', true).get(),
        ])
        let isAdmin = false,userGroups = [],ClientDeligates = [],Managers =[],ClientManagers = [],ManagersObj=[]
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if(userGroups.includes('Timesheet Administrators')){
            isAdmin = true
        }
        for (const C of Clients) {
            ClientDeligates.push({Client:C.Title,DelegateTo:C.DelegateTo})
        }
        //MLC --
        for (const manager of reportingManagers) {
            for (const m of manager.ReportingManager) {                
                if(!Managers.includes(m.Title)){
                    Managers.push(m.Title)
                    ManagersObj.push({ID:m.ID,Title:m.Title})
                }
            }
            ClientManagers.push({Client:manager.ClientName,Managers:manager.ReportingManager})
        }
       let ReportingManagerId = ItemData[0].ReportingManager.ID,selectedClient = ItemData[0].Client,DelegateToId=ItemData[0].DelegateToId,From=new Date(ItemData[0].From),To= new Date(ItemData[0].To),Comments = ItemData[0].Comments,ActionHistory = JSON.parse(ItemData[0].ActionHistory), PreviousDateHistory = JSON.parse(ItemData[0].PreviousDateHistory),DelegateToName= ItemData[0].DelegateTo.Title
       selectedClient == null? selectedClient='':selectedClient
       let Delegateobj =[] 
       let manager = ClientManagers.find(item=>{
           return item.Managers.some(m => {
               return m.ID == parseInt(ReportingManagerId)
           });
       })
       let Delegates = ClientDeligates.find(item=>{
          return item.Client == manager.Client
       })
       Delegates.DelegateTo.forEach(obj => {
           if (obj.ID !== parseInt(ReportingManagerId)) {
               Delegateobj.push(obj);
           }
       });
        //  --MLC
        // if(!isAdmin){
        this.setState({ReportingManagersObj: ManagersObj,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,userGroups:userGroups,isAdmin:isAdmin,showToaster:true,ReportingManagerId:ReportingManagerId,DelegateToId:DelegateToId,Client:selectedClient,DelegateToObj: Delegateobj,From:From,To:To,Comments:Comments,ActionHistory:ActionHistory,PreviousDateHistory:PreviousDateHistory,ItemID:ItemID,DelegateToName:DelegateToName,loading:false});
        // }
        // else{
        //         this.setState({ReportingManagersObj: ManagersObj,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,userGroups:userGroups,isAdmin:isAdmin,showToaster:true,ReportingManagerId:ReportingManagerId,DelegateToId:DelegateToId,Client:selectedClient,DelegateToObj: Delegateobj,From:From,To:To,Comments:Comments,ActionHistory:ActionHistory,PreviousDateHistory:PreviousDateHistory,ItemID:ItemID,DelegateToName:DelegateToName,loading:false})
        // }

    }


    async getReportingManagerData(ManagerID,Delegateobj,Client){
      let data = await  sp.web.lists.getByTitle('Delegations').items.filter("ReportingManager/ID eq'"+ManagerID+"'").expand('ReportingManager,DelegateTo').select('ReportingManager/Title,ReportingManager/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('ReportingManager/Title', true).get()
      if(data.length>0){
        let res = data[0]
        // this.setState({ReportingManagerId:res.ReportingManagerId,DelegateToId:res.DelegateToId,Client:res.Client,DelegateToObj:Delegateobj,From:new Date(res.From),To:new Date(res.To),Comments:res.Comments,ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,DelegateToName:res.DelegateTo.Title,loading:false})
        this.setState({Client:res.Client,DelegateToObj:Delegateobj,ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,loading:false})
      }
      else{
        this.setState({DelegateToObj: Delegateobj,Client:Client,DelegateToId:'',DelegateToName:'',From:null,To:null,Comments:'',loading:false});
      }

    }

    private handleCancel = () => {
        this.setState({message:'',Homeredirect: true })
    }

    private SetToDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ To: date });
    }

    handleChangeEvents = (event) => {
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        let { name } = event.target;
        if (name == "ReportingManagerId") {
            this.setState({ ReportingManagerId: parseInt(value),loading:true })
            if(value!='None'){
            // let title = event.target.selectedOptions[0].getAttribute('data-name');
            // let obj = {Title:title,ID:value}
            let Delegateobj =[] 
            let manager = this.state.ClientManagersObj.find(item=>{
                return item.Managers.some(m => {
                    return m.ID == parseInt(value)
                });
            })
            let Delegates = this.state.ClientDeligatesObj.find(item=>{
               return item.Client == manager.Client
            })
            Delegates.DelegateTo.forEach(obj => {
                if (obj.ID !== parseInt(value)) {
                    Delegateobj.push(obj);
                }
            });
                // this.setState({DelegateToObj: Delegateobj,Client:manager.Client});
                this.getReportingManagerData(parseInt(value),Delegateobj,manager.Client)
        }
        else {
            this.setState({DelegateToObj: [],DelegateToId:'',ReportingManagerId:'',Client:'',loading:false});
        }
        }
        else if(name == "DelegateToId"){
            let title = event.target.selectedOptions[0].getAttribute('data-name');
            this.setState({DelegateToId: parseInt(value),DelegateToName:title })
        }
        else{
            this.setState({[name]:value})
        }
    }

    // bindActionHistory = ()=>{
    //     return (
    //         <div></div>
    //     )
    // }

    handleSubmit = () =>{
        let data = {
            ReportingManager: { val: this.state.ReportingManagerId, required: true, Name: 'Reporting manager', Type: ControlType.string, Focusid: this.ReportingManager },
            DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.string, Focusid: this.DelegateTo },
            From: { val: this.state.From, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
            To: { val: this.state.To, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        else{
            let preDH = this.state.PreviousDateHistory,history = this.state.ActionHistory,from=this.addBrowserwrtServer(new Date(this.state.From)).toLocaleDateString(),to = this.addBrowserwrtServer(new Date(this.state.To)).toLocaleDateString()
            preDH.push({From:from,To:to,DelegateToId:this.state.DelegateToId,DelegateTo:this.state.DelegateToName})
            history.push({
                ActionBy:this.props.spContext.userDisplayName,
                DelegateTo: this.state.DelegateToName,
                From: from,
                To: to,
                Comments: this.state.Comments,
                DateTime: new Date().toISOString()
            })
            let postObject ={
                ReportingManagerId:this.state.ReportingManagerId,
                DelegateToId: this.state.DelegateToId,
                From: this.addBrowserwrtServer(new Date(this.state.From)),
                To: this.addBrowserwrtServer(new Date(this.state.To)),
                ActionHistory:JSON.stringify(history),
                PreviousDateHistory:JSON.stringify(this.state.PreviousDateHistory),
                Comments: this.state.Comments,
                Client:this.state.Client,
            }
            console.log(postObject)
            this.InsertorUpdatedata(postObject, '');
        }
    }

    private InsertorUpdatedata(formdata, actionStatus) {
        if (this.state.ItemID > 0) {
            this.setState({ loading: true });
            //update existing record
            sp.web.lists.getByTitle('Delegations').items.getById(this.state.ItemID).update(formdata).then((res) => {
                this.setState({ loading: false });
                this.setState({ message: 'Success-Update', Homeredirect: true })
            }, (error) => {
                console.log(error);
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle('Delegations').items.add(formdata).then((res) => {
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

    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }

        getCurrentWeekMonday=()=>{
            let today =  new Date()
            while(today.getDay()!=1){
                today.setDate(today.getDate()-1)
            }
            return new Date(today)
        }

    public render() {
        if (!this.state.isRecordAcessable) {
            // let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            let url = this.siteURL + "/SitePages/AccessDenied.aspx"
            window.location.href = url
        }
        if (this.state.Homeredirect) {
            let message = this.state.message
            let url = `/Dashboard/${message}`
            // if (this.props.match.params.redirect != undefined)
            //     url = `/Dashboard`
            // else
            //     url = `/PTODashboard/${message}`

            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={true}></ModalPopUp> */}
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Delegate Approvals
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>
                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">
                                            {this.state.isAdmin ?
                                                <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Reporting Manager<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="ReportingManagerId" title="Reporting Manager" id='ddlReportingManager' ref={this.ReportingManager} onChange={this.handleChangeEvents}>
                                                        <option value='None'>None</option>
                                                        {this.state.ReportingManagersObj.map((option) => (
                                                            <option value={option.ID} data-name={option.Title} selected={option.ID == this.state.ReportingManagerId}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                                :<div className={"col-md-3"}>
                                                    <div className="light-text">
                                                        <label>Reporting Manager</label>
                                                        <input className="txtManagerName form-control" required={true} name="Reporting Manager" title="Reporting Manager" value={this.state.ReportingManagerName} readOnly />
                                                    </div>
                                                </div> 
                                            }

                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Delegate To<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="DelegateToId" title="Delegate To" id='ddlDelegateTo' ref={this.DelegateTo} onChange={this.handleChangeEvents}>
                                                        <option value=''>None</option>
                                                        {this.state.DelegateToObj.map((option) => (
                                                            <option value={option.ID} data-name={option.Title} selected={option.ID == this.state.DelegateToId}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">From Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divFromDate">
                                                        <DatePicker onDatechange={this.SetFromDate} selectedDate={this.state.From} id="txtFromDate" title="From Date" minDate={this.getCurrentWeekMonday()} customDate={true} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">To Date<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divToDate">
                                                        <DatePicker onDatechange={this.SetToDate} selectedDate={this.state.To} id="txtToData" title="To Date" minDate={new Date()} customDate={true}/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        <div className="media-px-12,col-md-9">
                                            <div className="light-text height-auto">
                                                <label className="floatingTextarea2 top-11">Comments</label>
                                                <textarea className="position-static form-control requiredinput mt-3" onChange={this.handleChangeEvents} value={this.state.Comments} maxLength={500} id="txtComments" name="Comments" disabled={false} title='Comments'></textarea>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-2" id="">
                                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit} title='Submit'>Submit</button>
                                        <button type="button" title="Cancel" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div>

{/* Action history code below */}
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

export default DelegateManagerApprovals

// Action History
// {this.state.ActionHistory.length > 0 ? <><div className="p-2">
//     <h4>History</h4>
// </div><div>
//         <table className="table table-bordered m-0 timetable">
//             <thead style={{ borderBottom: "4px solid #444444" }}>
//                 <tr>
//                     {/* <th className="">Action By</th> */}
//                     <th className="" style={{ width: '150px' }}>Action By</th>
//                     <th className="" style={{ width: '150px' }}>Delegate To</th>
//                     <th className="" style={{ width: '150px' }}>From</th>
//                     <th className="" style={{ width: '150px' }}>To</th>
//                     <th className="" style={{ width: '250px' }}>Date & Time (EST)</th>
//                     <th className="">Comments</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 {this.bindActionHistory()}
//             </tbody>
//         </table>
//     </div></> : ""
// }