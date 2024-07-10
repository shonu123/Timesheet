import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit,faEye,faPlus } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Navigate,redirect } from 'react-router-dom';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import { Web } from '@pnp/sp/webs';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import InputText from '../Shared/InputText';
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

interface TimesheetDelegationProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface TimesheetDelegationState {

}

class TimesheetDelegation extends Component<TimesheetDelegationProps, TimesheetDelegationState> {
    private siteURL: string;
    private Authorizer;
    private DelegateTo;
    constructor(props: TimesheetDelegationProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Authorizer = React.createRef();
        this.DelegateTo = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
        AuthorizerName: this.props.spContext.userDisplayName,
        EmployeeMasterObj:[],
        AuthorizerId: '', // column name to store
        AuthorizerObj: [], // Contains all the reporting managers and reviewers
        DelegateToId: '',
        DelegateToName:'',
        DelegateToObj: [], // Delegates of respective manager
        ClientDeligatesObj:[], // clients and their delegates
        ClientManagersObj:[],
        AllReviewersObj:[], // conatins all the reviewers
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
        Client:'',
        isRedirect:false,
        SaveUpdateText: 'Submit',
        addNewRequest: false,
        ExportExcelData:[],
        DelegationsListData:[],
        DelegateToEMail:'',
        isSynergyEmployee:false,
    };

    public componentDidMount() {

        this.setState({ loading: true });
        this.getOnLoadData();
    }
    public componentDidUpdate = () => {
        if (this.state.isRedirect) {
            this.getOnLoadData();
        }
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                AuthorizerName: this.props.spContext.userDisplayName,
                AuthorizerId: '',
                // AuthorizerObj: [],
                DelegateToId: '',
                DelegateToName:'',
                DelegateToObj: [],
                DelegateToEMail:'',
                // ClientDeligatesObj:[],
                // ClientManagersObj:[],
                From: null,
                To: null,
                Comments: '',
                ActionHistory: [],
                PreviousDateHistory: [],
                // showToaster: false,
                loading: false,
                isRecordAcessable: true,
                // isAdmin:false,
                Homeredirect:false,
                message:'',
                userGroups:[],
                ItemID:0,
                Client:'',
                isRedirect:false,
                SaveUpdateText: 'Submit',
                addNewRequest: false
            });
    }

    handleChangeEvents = (event) => {
        let value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        let { name } = event.target;
        if (name == "AuthorizerId") {
            this.setState({ AuthorizerId: parseInt(value),loading:true })
            if(value!='None'){
            let EMail = event.target.selectedOptions[0].getAttribute('data-EMail');
            let ClientName,Delegateobj = [],mangers
            if(EMail.toLowerCase().includes('synergy')){
              let obj=  this.state.ClientDeligatesObj.find(item=>{
                    return item.Client.toLowerCase().includes('synergy')
                })
                ClientName = obj.Client
            }
            else{
                // let obj = {Title:title,ID:value}
                 mangers =  this.state.EmployeeMasterObj.filter(obj => {
                    return obj.ReportingManager.some(m => {
                        return m.ID == parseInt(value);
                    });
                });
                ClientName = mangers[0].ClientName
            }

            // if(mangers.length==0){
            //     mangers =  this.state.EmployeeMasterObj.filter(obj => {
            //         return obj.Reviewers.some(m => {
            //             return m.ID == parseInt(value);
            //         });
            //     });
            // }

            // let empObj = mangers.find(obj => {
            //     return obj.ReportingManager.some(m => {
            //         return m.ID == parseInt(value);
            //     });
            // });


            if(!ClientName.toLowerCase().includes('synergy')){
                // let Delegateobj =[] 
                let Delegates = this.state.ClientDeligatesObj.find(item=>{
                return item.Client == ClientName
                })
                Delegates.DelegateTo.forEach(obj => {
                    if (obj.ID !== parseInt(value)) {
                        Delegateobj.push(obj);
                    }
                });
                    // this.setState({DelegateToObj: Delegateobj,Client:manager.Client});
                }
                this.getAuthorizerData(parseInt(value),Delegateobj,ClientName)
            // else{
            //     this.setState({isSynergyEmployee:true,DelegateToObj: this.state.AllReviewersObj,Client:ClientName,DelegateToId:'',DelegateToName:'',From:null,To:null,Comments:'',loading:false});
            // }
        }
        else {
            this.setState({DelegateToObj: [],DelegateToId:'',AuthorizerId:'',Client:'',loading:false});
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

    async getAuthorizerData(ManagerID,Delegateobj,Client){
        let data = await  sp.web.lists.getByTitle('Delegations').items.filter("Authorizer/ID eq'"+ManagerID+"'").expand('ReportingManager,DelegateTo').select('ReportingManager/Title,ReportingManager/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('ReportingManager/Title', true).get()
        if(data.length>0){
          let res = data[0]
          if(!Client.toLowerCase().includes('synergy')){
          // this.setState({AuthorizerId:res.AuthorizerId,DelegateToId:res.DelegateToId,Client:res.Client,DelegateToObj:Delegateobj,From:new Date(res.From),To:new Date(res.To),Comments:res.Comments,ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,DelegateToName:res.DelegateTo.Title,loading:false})
          this.setState({isSynergyEmployee:false,Client:res.Client,DelegateToObj:Delegateobj,ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,loading:false})
          }
          else{
            this.setState({isSynergyEmployee:true,Client:Client,DelegateToObj:Delegateobj,ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,loading:false});
          }
        }
        else{
            if(!Client.toLowerCase().includes('synergy')){
                this.setState({isSynergyEmployee:false,DelegateToObj: Delegateobj,Client:Client,DelegateToId:'',DelegateToName:'',From:null,To:null,Comments:'',loading:false});
            }
            else{
                this.setState({isSynergyEmployee:true,DelegateToObj: [],Client:Client,DelegateToId:'',DelegateToName:'',From:null,To:null,Comments:'',loading:false});
            }
        }
  
      }

    private SetFromDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ From: date });
    }

    private SetToDate = (dateprops) => {
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        this.setState({ To: date });
    }

    // private _getPeoplePickerItems(items, name) {
    //     let values = { results: [] };
    //     let formData = {...this.state.formData}
    //     if (items.length > 0) {
    //             let multiple = { results: [] }
    //             for (const user of items) {
    //                 multiple.results.push(user.id)
    //             }
    //             values = multiple
    //     }
    //     formData['DelegateToId'] = values
    //     this.setState({ formData }) 
    // }
    private _getPeoplePickerItems(items, name) {
        let value = null;
        let values = { results: [] };
        if (items.length > 0) {
            if (['DelegateToId'].includes(name))
                value = items[0].id;
        }
        else {
            value = null;
        }
        this.setState({ DelegateToId: value,DelegateToName:items.text })
    }

    private async getOnLoadData() {
        // this.setState({isRedirect:false})
        let [Authorizer,Clients,groups,DelegationData] = await Promise.all([
            sp.web.lists.getByTitle('EmployeeMaster').items.filter("IsActive eq '1'").expand('ReportingManager,Reviewers').select('ReportingManager/Title,ReportingManager/ID,ReportingManager/EMail,Reviewers/Title,Reviewers/ID,Reviewers/EMail,*').orderBy('ReportingManager/Title', true).getAll(),
            sp.web.lists.getByTitle('Client').items.select('DelegateTo/ID,DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll(),
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle('Delegations').items.expand('Authorizer,DelegateTo').select('Authorizer/Title,Authorizer/ID,DelegateTo/Title,DelegateTo/ID,*').orderBy('Authorizer/Title', true).getAll()
        ])
        let isAdmin = false,userGroups = [],ClientDeligates = [],ClientManagers = [],AuthorizersObj=[],AllReviewers =[],filterDelegates = [],userID = this.props.spContext.userId,isSynergyEmployee =false;
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        if(userGroups.includes('Timesheet Administrators')){
            isAdmin = true
            filterDelegates = DelegationData
        }
        else{
            for (const d of DelegationData) {
                if(d.Authorizer.ID == userID){
                    filterDelegates.push(d)
                }
            } 
        }
        
        for (const C of Clients) {
            ClientDeligates.push({Client:C.Title,DelegateTo:C.DelegateTo})
        }

        //  const ManagerOrReviewer = []
         Authorizer.forEach(obj => {
            obj.ReportingManager.forEach(manager => {
                if (!AuthorizersObj.some(user => user.ID === manager.ID)) {
                    AuthorizersObj.push(manager);
                }
            });
            obj.Reviewers.forEach(reviewer => {
                if (!AuthorizersObj.some(user => user.ID === reviewer.ID)) {
                    AuthorizersObj.push(reviewer);
                }
                if (!AllReviewers.some(user => user.ID === reviewer.ID)) {
                    AllReviewers.push(reviewer);
                }
            });
        });

        let tableDataObj = []
        let excelData = []
        for (const d of filterDelegates) {
            let fromDate = new Date(d.From)
                    let toDate = new Date(d.To)
                    tableDataObj.push({
                        Id : d.Id,
                        Client: d.Client==null?'':d.Client,
                        ReportingManager: d.Authorizer.Title,
                        DelegateTo:d.DelegateTo.Title,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                    })
                    excelData.push({
                        Id : d.Id,
                        Client: d.Client,
                        ReportingManager: d.Authorizer.Title,
                        DelegateTo:d.DelegateTo.Title,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                    })
        }
        //
        // Authorizer.forEach(obj => {
        //     // Iterate through Reviewers array and add unique reviewers to uniqueReviewers array
        //     obj.Reviewers.forEach(reviewer => {
        //         if (!AllReviewers.some(user => user.ID === reviewer.ID)) {
        //             AllReviewers.push(reviewer);
        //         }
        //     });
        // });

        //MLC --

        //  --MLC
        if(!isAdmin){       
           
            let Delegateobj =[] 
            let manager = Authorizer.find(item=>{
                return item.ReportingManager.some(m => {
                    return m.ID == parseInt(this.props.spContext.userId)
                });
            })
            if(manager!=undefined){
                let Delegates = ClientDeligates.find(item=>{
                return item.Client == manager.ClientName
                })
                Delegates.DelegateTo.forEach(obj => {
                    if (obj.ID !== parseInt(this.props.spContext.userId)) {
                        Delegateobj.push(obj);
                    }
                });
                if(manager.ClientName.toLowerCase().includes('synegry')){
                    isSynergyEmployee = true
                }
        }
            let reviewer = Authorizer.find(item=>{
                return item.Reviewers.some(m => {
                    return m.ID == parseInt(this.props.spContext.userId)
                });
            })
            if(manager!=undefined){
                this.setState({isSynergyEmployee:isSynergyEmployee,EmployeeMasterObj:Authorizer,AuthorizerObj: AuthorizersObj,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,userGroups:userGroups,Client:manager.ClientName,isAdmin:isAdmin,showToaster:true,DelegateToObj: Delegateobj,DelegateToName:'',AllReviewersObj:AllReviewers,DelegationsListData:tableDataObj,ExportExcelData:excelData});
            }
            else if(reviewer!=undefined){
                this.setState({isSynergyEmployee:true,EmployeeMasterObj:Authorizer,AuthorizerId:this.props.spContext.userId,AuthorizerObj: AuthorizersObj,Client:reviewer.ClientName,DelegateToObj:AllReviewers,ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,userGroups:userGroups,isAdmin:isAdmin,showToaster:true,DelegateToName:'',AllReviewersObj:AllReviewers,DelegationsListData:tableDataObj,ExportExcelData:excelData});
            }

                let data = await  sp.web.lists.getByTitle('Delegations').items.filter("Authorizer/ID eq'"+this.props.spContext.userId+"'").expand('Authorizer,DelegateTo').select('Authorizer/Title,Authorizer/ID,DelegateTo/Title,DelegateTo/ID,DelegateTo/EMail,*').orderBy('Authorizer/Title', true).get()
                if(data.length>0){
                  let res = data[0]
                //   if(!res.Client.toLowerCase().includes('synergy')){
                  this.setState({ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,loading:false})
                //   }
                // else{
                //     this.setState({ActionHistory:JSON.parse(res.ActionHistory),PreviousDateHistory:JSON.parse(res.PreviousDateHistory),ItemID:res.ID,DelegateToId:res.DelegateTo.ID,DelegateToEMail:res.DelegateTo.EMail,loading:false})
                // }
                }
                else{
                    this.setState({loading:false})
                }
          
        }
        else{//AuthorizerObj: AuthorizersObj,
            this.setState({isSynergyEmployee:isSynergyEmployee,EmployeeMasterObj:Authorizer,AuthorizerObj: AuthorizersObj,ClientDeligatesObj:ClientDeligates,userGroups:userGroups,isAdmin:isAdmin,DelegateToName:'',ClientManagersObj:ClientManagers,AllReviewersObj:AllReviewers,DelegationsListData:tableDataObj,ExportExcelData:excelData,showToaster:true,loading:false})
        // this.setState({ClientDeligatesObj:ClientDeligates,ClientManagersObj:ClientManagers,DelegateToName:'',userGroups:userGroups,isAdmin:isAdmin,AllReviewersObj:AllReviewers,DelegationsListData:tableDataObj,ExportExcelData:excelData,showToaster:true,loading:false})
        }

        // this.getItemIDdata
    }

    // private checkDuplicates = (formData, id) => {
    //     let ClientList = 'Client';

    //     // let dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    //     let filterString = ''

    //     try {
    //         if (id == 0)
    //             filterString = `Title eq '${formData.Title}' and IsActive eq '1'`;
    //         else
    //             filterString = filterString = `Title eq '${formData.Title}' and  IsActive eq '1' and Id ne ` + id;
    //         sp.web.lists.getByTitle(ClientList).items.filter(filterString).get().
    //             then((response: any[]) => {
    //                 if (response.length > 0) {
    //                     this.setState({ loading: false });
    //                     // this.setState({ showLabel: true, errorMessage: 'Duplicate record is not accepted'});
    //                     customToaster('toster-error',ToasterTypes.Error,'Duplicate record is not accepted',4000)
    //                 }
    //                 else {
    //                     // this.insertorupdateListitem(formData, HolidaysList);
    //                     if (id > 0) {                       //update existing record
    //                         //console.log(this.props);
    //                         sp.web.lists.getByTitle(ClientList).items.getById(id).update(formData).then((res) => {
    //                             // this.resetForm();
    //                             // toast.success('updated successfully');
    //                             customToaster('toster-success',ToasterTypes.Success,'Client updated successfully.',2000)
    //                             this.resetForm();
    //                             this.setState({
    //                                 modalTitle: 'Success',
    //                                 modalText: 'Client updated successfully',
    //                                 showHideModal: false,
    //                                 isSuccess: true,
    //                                 loading: false,
    //                                 isRedirect: false,
    //                                 addNewRequest: false
    //                             });
    //                             //console.log(res);
    //                         });
    //                     }
    //                     else {                             //Add New record
    //                         try {
    //                             // this.setState({ loading: true });
    //                             sp.web.lists.getByTitle(ClientList).items.add({ ...this.state.formData })
    //                                 .then((res) => {
    //                                     customToaster('toster-success',ToasterTypes.Success,'Client added successfully',2000)
    //                                     this.resetForm();
    //                                     // toast.success('updated successfully');
    //                                     this.setState({ showHideModal: false,addNewRequest: false,loading:false,isRedirect:true});
    //                                     //  this.setState({
    //                                     //      modalTitle: 'Success',
    //                                     //      modalText: 'Client submitted successfully',
    //                                     //     showHideModal: false,
    //                                     //     isSuccess: true,
    //                                     //      isRedirect: false
    //                                     //  });
    //                                 })
    //                                 .catch((err) => {
    //                                     console.log('Failed to add');
    //                                     // toast.error('Sorry! something went wrong');
    //                                     customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
    //                                     this.setState({ showHideModal: false,isRedirect:true,loading:false,addNewRequest:false});
    //                                     // this.setState({
    //                                     //     loading: false,
    //                                     //     modalTitle: 'Error',
    //                                     //     modalText: 'Sorry! something went wrong',
    //                                     //     showHideModal: false,
    //                                     //     isSuccess: false,
    //                                     //     isRedirect: false
    //                                     // });
    //                                 });
    //                         }
    //                         catch (e) {
    //                             console.log(e);
    //                             this.setState({
    //                                 loading: false,
    //                                 modalTitle: 'Error',
    //                                 modalText: 'Sorry! something went wrong',
    //                                 showHideModal: true,
    //                                 isSuccess: false,
    //                                 isRedirect: false
    //                             });
    //                         }
    //                     }
    //                 }
    //             });
    //     }
    //     catch (e) {
    //         this.onError();
    //         console.log(e);
    //     }
    //     // return findduplicates
    // }

    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }

    private async loadListData() {
        // var Clients = await  sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get()
        this.setState({isRedirect:false})
        // console.log(Clients);
        
        sp.web.lists.getByTitle('Client').items.select('DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                let ExcelData = []
                let Data = [];
                for (const d of response) {
                    let delegateToString = ""
                    let delegateToStringExcel = "";
                    if(d.DelegateTo!=undefined){
                        d.DelegateTo.sort((a, b) => a.Title.localeCompare(b.Title));
                    if(d.DelegateTo.length>0)
                        {
                            for(let r of d.DelegateTo){
                                delegateToString += "<div>"+r.Title+"</div>"
                                delegateToStringExcel += r.Title+"\n"
                            }
                            // ExcelRm = ExcelRm.substring(0, ExcelRm.lastIndexOf("\n"));
                        }
                    }
                    ExcelData.push({
                       ClientName: d.Title,
                       IsActive: d.IsActive?"Active":"In-Active",
                       DelegateTo:delegateToStringExcel
                    })
                
                Data.push({
                    Id: d.Id, 
                    ClientName: d.Title, 
                    IsActive: d.IsActive,
                    DelegateTo:delegateToString
                })
            }
                this.setState({
                    ClientsObj: Data,
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    ExportExcelData : ExcelData,showToaster:true,
                });
   
                // setTimeout(() => {
                    // this.setState({loading: false})
                //   }, 100);
            }).catch(err => {
                console.log('Failed to fetch data.');
                this.setState({
                    loading: false,
                    modalTitle: 'Error',
                    modalText: 'Sorry! something went wrong',
                    // showHideModal: true,
                    isSuccess: false
                });
            });
    }

    private async onEditClickHandler(id) {
        try {
            var data = await sp.web.lists.getByTitle('Delegations').items.filter("ID eq'"+id+"'").expand('Authorizer,DelegateTo').select('Authorizer/Title,Authorizer/ID,DelegateTo/Title,DelegateTo/ID,DelegateTo/EMail,*').orderBy('Authorizer/Title', true).get()
            //    let response = data[0]
               let Delegateobj = []
               let Delegates = this.state.ClientDeligatesObj.find(item=>{
                return item.Client == data[0].Client
             })
             if(!this.state.isAdmin){
                Delegates.DelegateTo.forEach(obj => {
                    if (obj.ID !== parseInt(this.props.spContext.userId)) {
                        Delegateobj.push(obj);
                    }
                });
             }
             else{
                Delegates.DelegateTo.forEach(obj => {
                    // if (!Delegateobj.includes(obj.ID)) {
                        Delegateobj.push(obj);
                    // }
                });
             }
             if(!data[0].Client.toLowerCase().includes('synergy')){
                this.setState({isSynergyEmployee:true,AuthorizerId:data[0].AuthorizerId,DelegateToId:data[0].DelegateToId,DelegateToObj: Delegateobj,DelegateToName:data[0].DelegateTo.Title,From :new Date(data[0].From),To: new Date(data[0].To),ActionHistory:JSON.parse(data[0].ActionHistory),PreviousDateHistory:JSON.parse(data[0].PreviousDateHistory),Client: data[0].Client,ItemID:data[0].ID,addNewRequest:true,DelegateToEMail:data[0].DelegateTo.EMail,loading:false})
             }
             else{
                this.setState({isSynergyEmployee:false,AuthorizerId:data[0].AuthorizerId,DelegateToId:data[0].DelegateToId,DelegateToObj: Delegateobj,DelegateToName:data[0].DelegateTo.Title,From :new Date(data[0].From),To: new Date(data[0].To),ActionHistory:JSON.parse(data[0].ActionHistory),PreviousDateHistory:JSON.parse(data[0].PreviousDateHistory),Client: data[0].Client,ItemID:data[0].ID,addNewRequest:true,DelegateToEMail:data[0].DelegateTo.EMail,loading:false})
             }
                //Comments: data[0].Comments,
                // document.getElementById("txtClientName").scrollIntoView({behavior: 'smooth', block: 'start'});
                // document.getElementById("txtClientName").focus();
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }

    private resetForm = () => {
        this.setState({
            AuthorizerName: this.props.spContext.userDisplayName,
            AuthorizerId: '',
            // AuthorizerObj: [],
            DelegateToId: '',
            DelegateToName:'',
            DelegateToObj: [],
            DelegateToEMail:null,
            // ClientDeligatesObj:[],
            // ClientManagersObj:[],
            From: null,
            To: null,
            Comments: '',
            ActionHistory: [],
            PreviousDateHistory: [],
            // showToaster: false,
            loading: false,
            isRecordAcessable: true,
            // isAdmin:false,
            Homeredirect:false,
            message:'',
            // userGroups:[],
            ItemID:0,
            Client:'',
            isRedirect:false,
            SaveUpdateText: 'Submit',
            addNewRequest: false
        });
    }

    private  handleRowClicked = (row) => {
        window.location.hash=`#/TimesheetDelegation/${row.Id}`;
        this.props.match.params.id = row.Id
        this.onEditClickHandler(row.Id)
      }
      
    private cancelHandler(){
        this.resetForm()
    }

    public handleClose = () => {
        // this.setState({ showHideModal: false});
        this.resetForm();
    }

    private addNewRequest = () => {
        // var formdata = { ...this.state.formData };
        this.setState({ addNewRequest: true, showLabel: false});
    }

    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }



    async delegateToGroups(id,postObject){
        //  return user
        let   user = await sp.web.siteUsers.getById(id).groups.get()
        // console.log(user)
        let ugrps = []
        for (const row of user) {
            ugrps.push(row.Title)
        }
        if(ugrps.includes('Timesheet Administrators')|| ugrps.includes('Synergycom Timesheet Members') || ugrps.includes('Dashboard Admins'))
        this.InsertorUpdatedata(postObject, '');
        else
        customToaster('toster-error',ToasterTypes.Error,'Selected DelegateTo does not have access to Timesheet page',4000);
    }

     handleSubmit = () =>{
        let data;
        if(this.state.isAdmin){
            if(!this.state.Client.toLowerCase().includes('synergy')){
                data = {
                    Authorizer: { val: this.state.AuthorizerId, required: true, Name: 'Name', Type: ControlType.string, Focusid: this.Authorizer },
                    DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.string, Focusid: this.DelegateTo },
                    From: { val: this.state.From, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
                    To: { val: this.state.To, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
                }
            }
            else{
                data = {
                    Authorizer: { val: this.state.AuthorizerId, required: true, Name: 'Name', Type: ControlType.string, Focusid: this.Authorizer },
                    DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.people, Focusid:"divDelegateTo" },
                    From: { val: this.state.From, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
                    To: { val: this.state.To, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
                }
            }
        }
        else {
            if(!this.state.Client.toLowerCase().includes('synergy')){
            data = {
                DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.string, Focusid: this.DelegateTo },
                From: { val: this.state.From, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
                To: { val: this.state.To, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
            }
            }
            else{
                data = {
                    DelegateTo: { val: this.state.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.people, Focusid:"divDelegateTo" },
                    From: { val: this.state.From, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
                    To: { val: this.state.To, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
                }
            }
        }
        let isValid = Formvalidator.checkValidations(data)
        if (!isValid.status) {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        else{
            // this.state.userGroups
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
                AuthorizerId:this.state.AuthorizerId,
                DelegateToId: this.state.DelegateToId,
                From: this.addBrowserwrtServer(new Date(this.state.From)),
                To: this.addBrowserwrtServer(new Date(this.state.To)),
                ActionHistory:JSON.stringify(history),
                PreviousDateHistory:JSON.stringify(this.state.PreviousDateHistory),
                Comments: this.state.Comments,
                Client:this.state.Client,
            }
            this.delegateToGroups(this.state.DelegateToId,postObject)
            // console.log(postObject)
            // this.InsertorUpdatedata(postObject, '');
        }
    }

    private InsertorUpdatedata(formdata, actionStatus) {
        if (this.state.ItemID > 0) {
            this.setState({ loading: true });
            //update existing record
            sp.web.lists.getByTitle('Delegations').items.getById(this.state.ItemID).update(formdata).then((res) => {
                // this.setState({ loading: false });
                // now
                this.resetForm()
                this.getOnLoadData()
                // this.setState({ message: 'Success-Update', isRedirect: true })
            }, (error) => {
                console.log(error);
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle('Delegations').items.add(formdata).then((res) => {
                    // console.log(res);
                    // alert('Data inserted sucessfully')
                    // now
                    // this.setState({ loading: false });
                    this.resetForm()
                    this.getOnLoadData()
                    // this.setState({ message: 'Success-Added', isRedirect: true })

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
        const columns = [
            {
                name: "Edit",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={''}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                // width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate,
                // width: '250px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                // width: '250px',
                sortable: true
            }
           
        ];
        const AdminColumns = [
            {
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View"  className="csrLink ms-draggable" to={''}>
                                    <FontAwesomeIcon icon={faEye} onClick={() => { this.onEditClickHandler(record.Id);}}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                // width: '250px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.ReportingManager,
                // width: '250px',
                sortable: true
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                // width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate,
                width: '250px',
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                // width: '250px',
                sortable: true
            }
           
        ];
        const ExcelColumns = [
            {
                name: "Client",
                selector: "Client",
               
            },
            {
                name: "Reporting Manager",
                selector:"ReportingManager",
            },
            {
                name: "Delegate To",
                selector: "DelegateTo",
                width: '250px',
                sortable: true
            },
            {
                name: "From",
                selector: "FromDate",
            },
            {
                name: "To",
                selector: "ToDate",
            }
           
        ];
        if(this.state.isRedirect){
                return (<Navigate to={'/ClientMaster'} />);
        }
            return (
                <React.Fragment>
                    {this.state.loading && <Loader />}
                    {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp> */}
                    <div id="content" className="content p-2 pt-2">
                        {/* <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
                            <div className="menu-icon">
                                <span>
                                </span>
                                <span>
                                </span>
                                <span>
                                </span>
                            </div>
                        </div> */}
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                {/*<div className='title'>Clients
                                    {this.state.addNewRequest &&
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    }
                                </div>*/}

                                <div className="after-title"></div>
                                <div className="row justify-content-md-left">
                                    <div className="col-12 col-md-12 col-lg-12">
                                        <div className={this.state.addNewRequest ? 'mx-2 activediv' : 'mx-2'}>
                                            <div className="text-right pt-2">
                                                <button type="button" id="btnSubmit" title='Add New Client' className="SubmitButtons btn" onClick={this.addNewRequest}>
                                                <span className='' id='addClient'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="c-v-table clientForm">
                                            <div className="light-box border-box-shadow mx-2">
                                                <div className={this.state.addNewRequest ? '' : 'activediv'}>
                                                    <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                {this.state.isAdmin ?
                                                <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Name<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="AuthorizerId" title="Name" id='Authorizer' ref={this.Authorizer} onChange={this.handleChangeEvents}>
                                                        <option value='None'>None</option>
                                                        {this.state.AuthorizerObj.map((option) => (
                                                            <option value={option.ID} data-name={option.Title} data-EMail = {option.EMail} selected={option.ID == this.state.AuthorizerId}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                                :<div className={"col-md-3"}>
                                                    <div className="light-text">
                                                        <label>Name</label>
                                                        <input className="txtManagerName form-control" required={true} name="Reporting Manager" title="Reporting Manager" value={this.state.AuthorizerName} readOnly />
                                                    </div>
                                                </div> 
                                            }
                                            {!this.state.isSynergyEmployee?
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
                                            </div>:  <div className="col-md-3">
                                                <div className="light-text">
                                                    <label className='lblPeoplepicker'>Delegate To<span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divDelegateTo">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText="Delegate To"
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            disabled={false}
                                                            defaultSelectedUsers={[this.state.DelegateToEMail]}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'DelegateToId')}
                                                            ensureUser={true}
                                                            required={true}
                                                            principalTypes={[PrincipalType.User]} placeholder=""
                                                            // ref={this.DelegateTo}
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>}

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
                                                    <div className="row mx-1" id="">
                                                        <div className="col-sm-12 text-center my-2" id="">
                                                            <button type="button" onClick={this.handleSubmit} id="btnSubmit" className="SubmitButtons btn" title={this.state.SaveUpdateText}>{this.state.SaveUpdateText}</button>
                                                            <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.handleClose} title='Cancel'>Cancel</button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        {this.state.showToaster&&<Toaster /> }
                                        <div className="c-v-table table-head-1st-td">
                                            <TableGenerator columns={this.state.isAdmin?AdminColumns:columns} data={this.state.DelegationsListData} fileName={'Timesheet Delegations'}showExportExcel={true} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={"DelegateTo"} onRowClick={this.handleRowClicked}></TableGenerator>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        
    }
}

export default TimesheetDelegation;