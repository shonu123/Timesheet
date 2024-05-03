import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, StatusType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faL, faPlus,faPrint, fas} from "@fortawesome/free-solid-svg-icons";
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Navigate } from 'react-router-dom';
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
import DatePicker from "../Shared/DatePickerField";
import CustomDatePicker from "../Shared/DatePicker";
import { addDays } from 'office-ui-fabric-react';
import '../../CSS/WeeklyTimesheet.css'
import ModalPopUpConfirm from '../Shared/ModalPopUpConfirm';
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';

export interface WeeklyTimesheetProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface WeeklyTimesheetState {
    trFormdata: {
        ClientName: string,
        Name: string,
        WeekStartDate: Date,
        WeeklyItemsData: any,
        OTItemsData:any,
        BillableSubTotal:any,
        SynergyOfficeHrs:any,
        SynergyHolidayHrs:any,
        ClientHolidayHrs:any,
        PTOHrs:any,
        NonBillableSubTotal:any,
        Total:any,
        Pendingwith: any,
        Comments: any,
        CommentsHistoryData:Array<Object>;
        DateSubmitted:Date,
        SuperviserNames:any,
        Status:string
        WeeklyItemsTotalTime:string,
        WeeklySubTotalHrs:any,
        OTSubTotalHrs:any,
        OTItemsTotalTime:string,
        SuperviserIds:any,
        DelegateToIds:any,
        ReviewerIds:any,
        NotifierIds:any,
        DateOfJoining:Date,
        IsDescriptionMandatory:boolean,
        IsProjectCodeMandatory:boolean,
        WeekStartDay:string,
        HolidayType:string,

        ReportingManagersEmail:any,
        DelegateToEmails:any,
        ReviewersEmail:any,
        NotifiersEmail:any,
        IsClientApprovalNeeded:boolean,
        IsClientApprovalNeededUI:boolean,
        Revised:boolean,
        IsSubmitted:boolean,
        IsDelegated:boolean

    };
    ClientNames:any;
    Clients_DateOfJoinings:any,
    HolidaysList:any,
    SynergyHolidaysList:any,
    SuperviserNames:any,
    DelegateTo:any,
    Reviewers:any,
    Notifiers:any,
    currentWeeklyRowsCount:any,
    currentOTRowsCount:any,
    ItemID:any,
    userRole:string,
    EmployeeEmail:any,
//-------------------------------------
    SaveUpdateText: string;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    redirect:boolean,
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    isNewform: boolean;
    isSubmitted:boolean;
    showBillable: boolean;
    showNonBillable : boolean;
    showApproveRejectbtn: boolean;
    showSubmitSavebtn:boolean;
    showRevokebtn:boolean;
    IsReviewer:boolean;
    isRecordAcessable:boolean;
    UserGoups : any;
    showConfirmDeletePopup:boolean;
    ConfirmPopupMessage:string;
    ActionToasterMessage:string;
    ActionButtonId:any;
    RowType:string;
    rowCount:string;

    isAdmin:boolean,
    onBehalf:boolean;
    currentUserId:number;
    EmployeesObj:any;
    weeks:any;
    showToaster:boolean;
}

class WeeklyTimesheet extends Component<WeeklyTimesheetProps, WeeklyTimesheetState> {
    private siteURL: string;
    private oweb;
    private currentUser :string;
    private currentUserId:number;
    private listName = 'WeeklyTimeSheet';
    private Client;
    private EmployeeDropdown;
    private Comments;
    private WeekHeadings=[];
    private WeekNames=[];
    private weekStartDate;
    constructor(props: WeeklyTimesheetProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.currentUser=this.props.spContext.userDisplayName;
        this.currentUserId=this.props.spContext.userId;
        this.Client=React.createRef();
        this.Comments=React.createRef();
        this.weekStartDate=React.createRef();
        this.EmployeeDropdown = React.createRef();
        

        this.state = {
          
            trFormdata: {
                ClientName: '',
                Name: this.currentUser,
                WeekStartDate:null,
                WeeklyItemsData: [],
                OTItemsData:[],
                BillableSubTotal:[],
                SynergyOfficeHrs:[],
                SynergyHolidayHrs:[],
                ClientHolidayHrs:[],
                PTOHrs:[],
                NonBillableSubTotal:[], 
                Total:[],
                Pendingwith: '',
                Comments:'',
                CommentsHistoryData:[],
                DateSubmitted :new Date(),
                SuperviserNames:[],
                Status:StatusType.Save,
                WeeklyItemsTotalTime:'0',
                OTItemsTotalTime:'0',
                WeeklySubTotalHrs:[],
                OTSubTotalHrs:[],
                SuperviserIds:[],
                DelegateToIds:[],
                ReviewerIds:[],
                NotifierIds:[],
                DateOfJoining:new Date(),
                IsDescriptionMandatory:false,
                IsProjectCodeMandatory:false,
                WeekStartDay:'',
                HolidayType:'',

                ReportingManagersEmail:[],
                DelegateToEmails:[],
                ReviewersEmail:[],
                NotifiersEmail:[],
                IsClientApprovalNeeded:false,
                IsClientApprovalNeededUI:false,
                Revised:false,
                IsSubmitted:false,
                IsDelegated:false
            },
            ClientNames:[],
            Clients_DateOfJoinings:[],
            HolidaysList:[],
            SynergyHolidaysList:[],
            SuperviserNames:[],
            DelegateTo:[],
            Reviewers:[],
            Notifiers:[],
            currentWeeklyRowsCount:1,
            currentOTRowsCount:1,
            ItemID:0,
            userRole:"",
            EmployeeEmail:[],
//---------------------------------------------------   
            SaveUpdateText:StatusType.Save,
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            redirect:false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            isNewform: true,
            isSubmitted:false,
            showBillable:true,
            showNonBillable :true,
            showApproveRejectbtn : false,
            showSubmitSavebtn:false,
            showRevokebtn:false,
            ConfirmPopupMessage:'',
            ActionToasterMessage:"",
            ActionButtonId:'',
            IsReviewer:false,
            isRecordAcessable: true,
            UserGoups: [],
            showConfirmDeletePopup:false,
            RowType:"",
            rowCount:"",

            onBehalf: false,
            currentUserId: this.props.spContext.userId,
            EmployeesObj: [],
            isAdmin: false,
            weeks:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            showToaster:false,
        };
        this.oweb = Web(this.props.spContext.siteAbsoluteUrl);
         // for first row of weekly and OT hrs
         const trFormdata = { ...this.state.trFormdata };
         trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.BillableSubTotal.push({Type:"Billable Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
         trFormdata.SynergyOfficeHrs.push({Type:"Office Hours",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.ClientHolidayHrs.push({Type:"Holiday",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.PTOHrs.push({Type:"PTO",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
         trFormdata.WeeklySubTotalHrs.push({Type:"Billable",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
         trFormdata.OTSubTotalHrs.push({Type:"OT",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
         trFormdata.Total.push({Type:"Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
        
        this.WeekHeadings.push({"Mon":"",
        "IsMonJoined":true,
        "IsDay1Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay1SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Tue":"",
        "IsTueJoined":true,
        "IsDay2Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay2SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Wed":"",
        "IsWedJoined":true,
        "IsDay3Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay3SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Thu":"",
        "IsThuJoined":true,
        "IsDay4Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay4SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Fri":"",
        "IsFriJoined":true,
        "IsDay5Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay5SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Sat":"",
        "IsSatJoined":true,
        "IsDay6Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay6SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        "Sun":"",
        "IsSunJoined":true,
        "IsDay7Holiday":this.IsHoliday(trFormdata.WeekStartDate,trFormdata.HolidayType),
        "IsDay7SynergyHoliday":this.IsHoliday(trFormdata.WeekStartDate,"synergy"),
        })
        this.WeekNames.push({"day1":"Mon","day2":"Tue","day3":"Wed","day4":"Thu","day5":"Fri","day6":"Sat","day7":"Sun","dayCode":"Monday"});
        this.setState({ trFormdata});
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
         this.setState({ loading: true });
         this.loadWeeklyTimeSheetData(this.state.currentUserId);
    }
    //functions related to  initial loading
    private async loadWeeklyTimeSheetData(currentUserId) {
        var ClientNames: any;
        var ClientsFromClientMaster:any;
        var Client=[];
        let [clientMaster,groups] = await Promise.all([
            this.oweb.lists.getByTitle('Client').items.filter("IsActive eq 1").select("Title,DelegateTo/Id,DelegateTo/EMail,*").expand("DelegateTo").orderBy("Title",true).getAll(),
            sp.web.currentUser.groups()
        ]);
        // console.log("current user deatils")
        // console.log(this.props.context.pageContext)
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        let trFormdata = this.state.trFormdata
        trFormdata['Name'] = this.currentUser
        
        if(this.props.match.params.id!=undefined){
            this.setState({ItemID : this.props.match.params.id})
            ClientNames= await this.getItemData(this.props.match.params.id)
        }
        else
        {
            ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+currentUserId+"and IsActive eq 1").select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").expand("Employee,ReportingManager,Reviewers,Notifiers").orderBy("ClientName",true).getAll();

            if(userGroups.includes('Timesheet Members')){
                this.setState({isSubmitted : false,loading:false});
            }
            else{
                this.setState({isSubmitted : true,loading:false});
            }
            if(userGroups.includes('Timesheet Administrators')){
                this.setState({isAdmin:true,isSubmitted: false})
            }
        }
        if(ClientNames.length<1 && !this.state.isAdmin){
            this.setState({modalTitle:'Invalid Employee configuration',modalText:'Employee not configured in Approval Matrix,Please contact Administrator',isSuccess: false,showHideModal:true})
            this.setState({loading:false,isSubmitted:true});
            return false;
        }
        ClientsFromClientMaster =clientMaster;
        this.setState({EmployeeEmail:[],ClientNames:[],Clients_DateOfJoinings:[],SuperviserNames:[],Reviewers:[],Notifiers:[]});
        this.state.EmployeeEmail.push(ClientNames[0].Employee.EMail);
        
        ClientNames.filter(item => {
              Client.push({"ClientName":item.ClientName});
              this.state.Clients_DateOfJoinings.push({"ClientName":item.ClientName,"DOJ":item.DateOfJoining,"IsDescriptionMandatory":item.MandatoryDescription,"IsProjectCodeMandatory":item.MandatoryProjectCode,"WeekStartDay":item.WeekStartDay,"HolidayType":item.HolidayType})
              if(item.hasOwnProperty("ReportingManager"))
              item.ReportingManager.map(i=>(this.state.SuperviserNames.push({"ClientName":item.ClientName,"ReportingManager":i.Title,"ReportingManagerId":i.Id,"ReportingManagerEmail":i.EMail})));
              if(item.hasOwnProperty("Reviewers"))
              item.Reviewers.map(i=>(this.state.Reviewers.push({"ClientName":item.ClientName,"ReviewerId":i.Id,"ReviewerEmail":i.EMail})));
              if(item.hasOwnProperty("Notifiers"))
              item.Notifiers.map(i=>(this.state.Notifiers.push({"ClientName":item.ClientName,"NotifierId":i.Id,"NotifierEmail":i.EMail})));
        }); 
        ClientsFromClientMaster.filter(ClientItem=>{ //to filter only active client names
            Client.filter(employeeItem=>{
                if(ClientItem.Title.toLowerCase()==employeeItem.ClientName.toLowerCase())
                {
                    this.state.ClientNames.push(employeeItem.ClientName);
                    // if(ClientItem.hasOwnProperty("DelegateTo"))
                    // ClientItem.DelegateTo.map(i=>(this.state.DelegateTo.push({"ClientName":ClientItem.ClientName,"DelegateToId":i.Id,"DelegateToEmail":i.EMail})));
                }
            });
        });
         //For getting Dateofjoining,DescriptionMandatory,ProjectCOde Mandatory,WeekStartday of selected client
         for( var item of this.state.Clients_DateOfJoinings)
         {
             if(item.ClientName.toLowerCase()==trFormdata.ClientName.toLowerCase())
             {
                 trFormdata.DateOfJoining=new Date(item.DOJ);
                 trFormdata.IsDescriptionMandatory=item.IsDescriptionMandatory;
                 trFormdata.IsProjectCodeMandatory=item.IsProjectCodeMandatory;
                 trFormdata.WeekStartDay=item.WeekStartDay;
                 trFormdata.HolidayType=item.HolidayType;
                 break;
             }
         }
         let WeekStartDate=new Date(new Date(trFormdata.WeekStartDate).getMonth()+1+"/"+new Date(trFormdata.WeekStartDate).getDate()+"/"+new Date(trFormdata.WeekStartDate).getFullYear());
         let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
         this.WeekHeadings=[];
         this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsMonJoined":WeekStartDate<DateOfjoining,
         "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsTueJoined":WeekStartDate<DateOfjoining,
         "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsWedJoined":WeekStartDate<DateOfjoining,
         "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsThuJoined":WeekStartDate<DateOfjoining,
         "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsFriJoined":WeekStartDate<DateOfjoining,
         "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsSatJoined":WeekStartDate<DateOfjoining,
         "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "IsSunJoined":WeekStartDate<DateOfjoining,
         "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
         "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
         })
         this.showApproveAndRejectButton(trFormdata);
        // this.userAccessableRecord(trFormdata);
         
        this.setState({UserGoups:userGroups,trFormdata,ClientNames: this.state.ClientNames,EmployeeEmail:this.state.EmployeeEmail,currentUserId:ClientNames[0].Employee.Id,showToaster: true});
        if(this.state.ClientNames.length==1&&this.props.match.params.id==undefined){
            trFormdata.ClientName=ClientNames[0].ClientName;
            this.handleClientChange(ClientNames[0].ClientName);
        }
        this.GetHolidayMasterDataByClientName( trFormdata.WeekStartDate,trFormdata.HolidayType,trFormdata);
    }
    private async getItemData(TimesheetID){
        var ClientNames: any;
        let filterQuery = "ID eq '"+TimesheetID+"'";
        let selectQuery = "Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,Notifiers/EMail,*";
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand("Initiator,Reviewers,ReportingManager,DelegateTo,Notifiers").get();
        // console.log(data);
        if(data.length==0){   //for deleted or not founded record
            this.setState({ActionToasterMessage:'Success-Invalid',redirect:true});
            return false;
        }
        const trFormdata= this.state.trFormdata;
        trFormdata.ClientName=data[0].ClientName;
        trFormdata.Name=data[0].Name;
        trFormdata.WeekStartDate=new Date(data[0].WeekStartDate);
        trFormdata.WeeklyItemsData=JSON.parse(data[0].WeeklyHrs);
        trFormdata.OTItemsData=JSON.parse(data[0].OverTimeHrs);
        trFormdata.BillableSubTotal=JSON.parse(data[0].BillableSubtotalHrs);
        trFormdata.SynergyOfficeHrs=JSON.parse(data[0].SynergyOfficeHrs);
        trFormdata.SynergyHolidayHrs=JSON.parse(data[0].SynergyHolidayHrs);
        trFormdata.ClientHolidayHrs=JSON.parse(data[0].ClientHolidayHrs);
        trFormdata.PTOHrs=JSON.parse(data[0].PTOHrs);
        trFormdata.WeeklyItemsTotalTime=data[0].WeeklyTotalHrs;
        trFormdata.OTItemsTotalTime=data[0].OTTotalHrs;
        trFormdata.WeeklySubTotalHrs=JSON.parse(data[0].WeeklySubTotalHrs)
        trFormdata.OTSubTotalHrs=JSON.parse(data[0].OTSubTotalHrs)
        trFormdata.NonBillableSubTotal=JSON.parse(data[0].NonBillableSubTotalHrs);
        trFormdata.Total=JSON.parse(data[0].TotalHrs);
        trFormdata.Status=data[0].Status;
        trFormdata.CommentsHistoryData=JSON.parse(data[0].CommentsHistory);
        trFormdata.Status== StatusType.Save?trFormdata.Comments=data[0].Comments==null?'':data[0].Comments:trFormdata.Comments='';
        trFormdata.SuperviserNames=JSON.parse(data[0].SuperviserName);
        trFormdata.Pendingwith=data[0].PendingWith;
        trFormdata.IsClientApprovalNeeded=data[0].IsClientApprovalNeed;//value from the list
        trFormdata.IsClientApprovalNeededUI=false;//default value as false
        trFormdata.Revised=data[0].Revised;
        trFormdata.IsSubmitted=data[0].IsSubmitted;
        trFormdata.IsDelegated=data[0].IsDelegated;
        let EmpEmail=[];
        let RMEmail=[];
        let DelToEmail=[];
        let ReviewEmail=[];
        let NotifyEmail=[];
        EmpEmail.push(data[0].Initiator.EMail);
        if(data[0].hasOwnProperty("ReportingManager"))   
        data[0].ReportingManager.map(i=>(RMEmail.push(i.EMail)));
        if(data[0].hasOwnProperty("DelegateTo"))   
        data[0].DelegateTo.map(i=>(DelToEmail.push(i.EMail)));
        if(data[0].hasOwnProperty("Reviewers"))        
        data[0].Reviewers.map(i=>(ReviewEmail.push(i.EMail)));
        if(data[0].hasOwnProperty("Notifiers")) 
        data[0].Notifiers.map(i=>(NotifyEmail.push(i.EMail)));
        if( trFormdata.CommentsHistoryData==null)
        trFormdata.CommentsHistoryData=[];
       
        trFormdata.ReportingManagersEmail=RMEmail;
        trFormdata.DelegateToEmails=DelToEmail;
        trFormdata.ReviewersEmail=ReviewEmail;
        trFormdata.NotifiersEmail=NotifyEmail;
        trFormdata.WeekStartDay=this.state.weeks[trFormdata.WeekStartDate.getDay()];
        this.WeekNames=[];
        switch(trFormdata.WeekStartDay)
        {
            case "Monday":
                this.WeekNames.push({"day1":"Mon","day2":"Tue","day3":"Wed","day4":"Thu","day5":"Fri","day6":"Sat","day7":"Sun","dayCode":"Monday"});
                break;
            case "Tuesday":
                this.WeekNames.push({"day1":"Tue","day2":"Wed","day3":"Thu","day4":"Fri","day5":"Sat","day6":"Sun","day7":"Mon","dayCode":"Tuesday"});
                break;
            case "Wednesday":
                this.WeekNames.push({"day1":"Wed","day2":"Thu","day3":"Fri","day4":"Sat","day5":"Sun","day6":"Mon","day7":"Tue","dayCode":"Wednesday"});
                break;
            case "Thursday":
                this.WeekNames.push({"day1":"Thu","day2":"Fri","day3":"Sat","day4":"Sun","day5":"Mon","day6":"Tue","day7":"Wed","dayCode":"Thursday"});
                break;
            case "Friday":
                this.WeekNames.push({"day1":"Fri","day2":"Sat","day3":"Sun","day4":"Mon","day5":"Tue","day6":"Wed","day7":"Thu","dayCode":"Friday"});
                break;
            case "Saturday":
                this.WeekNames.push({"day1":"Sat","day2":"Sun","day3":"Mon","day4":"Tue","day5":"Wed","day6":"Thu","day7":"Fri","dayCode":"Saturday"});
                break;
            case "Sunday":
                this.WeekNames.push({"day1":"Sun","day2":"Mon","day3":"Tue","day4":"Wed","day5":"Thu","day6":"Fri","day7":"Sat","dayCode":"Sunday"});
                break;
        }
        this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,EmployeeEmail:EmpEmail,loading:false,showBillable : false, showNonBillable: false});
        if([StatusType.Submit,StatusType.Approved,StatusType.ManagerApprove].includes(data[0].Status))
        {
            this.setState({isSubmitted:true});
        }
        else if([StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.Save,StatusType.Revoke].includes(data[0].Status))
        {
            this.setState({isSubmitted:false});
        }
        if([StatusType.ReviewerReject,StatusType.Save].includes(data[0].Status))
        {
           //Condition for Reviewer reject / Manager reject scenarios changed to save
            if(trFormdata.Revised&&!data[0].IsClientApprovalNeed)
            {   
                this.setState({showBillable:false})
                if(trFormdata.CommentsHistoryData[trFormdata.CommentsHistoryData.length-1]['Role']=="Reviewer")
                {
                    if(data[0].IsClientApprovalNeed)
                     this.setState({showBillable:false})
                    else
                    this.setState({showBillable:true})
                }
            }
            else if(trFormdata.Revised)
            {
                if(data[0].IsClientApprovalNeed)
                this.setState({showBillable:false})
                else
                this.setState({showBillable:true})
            }
        }
        let groups = await sp.web.currentUser.groups();
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        this.setState({UserGoups:userGroups})

       this.showApproveAndRejectButton(trFormdata);
       this.userAccessableRecord(trFormdata);

        ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+data[0].InitiatorId+"and IsActive eq 1").select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").orderBy("ClientName",true).expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();
        
        return ClientNames;
    }
    // Functions related to OnBehalf functionality.
    private async getAllEmployees(){
        let selectQuery = "Employee/ID,Employee/Title"

        let employees =  await  sp.web.lists.getByTitle('EmployeeMaster').items.expand('Employee').select(selectQuery).orderBy('Employee/Title',true).getAll()
        let EmpNames = []
        let EmpObj= []
        for (const name of employees){
            if(!EmpNames.includes(name.Employee.Title)){
                EmpNames.push(name.Employee.Title)
                EmpObj.push({ID:name.Employee.ID,Title:name.Employee.Title})
            }
        }
        this.setState({EmployeesObj: EmpObj,loading:false,ClientNames:[]})

    }
    private handleApplyingfor = (e)=>{
        this.setState({loading:true})
        let value = e.target.value;
        const {name} = e.target;
        let trFormdata = {...this.state.trFormdata}
        if(name == 'Applying'){
            if(value=='Self'){
                this.currentUser = this.props.spContext.userDisplayName;;
                trFormdata['ClientName'] = ''
                trFormdata['Name'] = this.currentUser
                trFormdata.WeekStartDate=null;
                this.setState({onBehalf: false,ClientNames:[],loading:true,trFormdata})
                this.loadWeeklyTimeSheetData(this.props.spContext.userId)
            }
            else{
                trFormdata.Name='';
                trFormdata.ClientName='';
                trFormdata.WeekStartDate=null;
                this.setState({trFormdata,onBehalf: true,isSubmitted:true,ClientNames:[],currentUserId:-1,loading:true});
                this.getAllEmployees()
            }
            
        }
        else{
            // this.currentUserId = parseInt(value)
            this.setState({loading:true})
            if(value == '-1'){
                trFormdata.ClientName='';
                trFormdata.WeekStartDate=null;
                this.setState({trFormdata,currentUserId: -1,isSubmitted:true,ClientNames:[],loading:false})
                this.currentUser = this.props.spContext.userDisplayName;
            }
            else{
                let trFormdata = {...this.state.trFormdata}
                trFormdata['ClientName'] = '';
                trFormdata.WeekStartDate=null;
                trFormdata['Name'] = e.target.selectedOptions[0].label
                this.currentUser = e.target.selectedOptions[0].label;
                this.setState({currentUserId: parseInt(value),ClientNames:[],trFormdata})
                this.loadWeeklyTimeSheetData(parseInt(value))
            }
        }
        //changes by Ganesh in this method:Clear the fields and validate record.
        this.ClearTimesheetControls(trFormdata);
    }
    //functions related to calculation
    private WeekStartDateChange = (dateprops) => {
        this.setState({loading: true})
        let date  = new Date()
        if(dateprops==null){
            //date = this.GetCurrentWeekMonday(new Date())
            date =dateprops;
        }
        else{
            date=new Date(dateprops);
        }
        //let WeekStartDate=new Date(date);
        const Formdata = { ...this.state.trFormdata };
            Formdata.WeekStartDate=date;
            this.GetHolidayMasterDataByClientName(date,Formdata.HolidayType,Formdata);
            this.validateDuplicateRecord(date,Formdata.ClientName,Formdata);
        //this.setState({trFormdata:Formdata});
        // console.log(this.state);
       
    }
    private handleClientChange=(event)=>{
        this.setState({loading:true})
        let clientVal=event.target!=undefined? event.target.value: event;
        const Formdata = { ...this.state.trFormdata };
            Formdata.ClientName=clientVal;
            Formdata.SuperviserNames=[];
            Formdata.SuperviserIds=[];
            Formdata.ReviewerIds=[];
            Formdata.NotifierIds=[];
        // console.log(this.state);
        if(clientVal == 'None'){
                 this.setState({showBillable : true, showNonBillable: true})
             }
             else
             {
                this.setState({showBillable : false, showNonBillable: false})
             }
        //For getting Dateofjoining of selected client
         for( var item of this.state.Clients_DateOfJoinings)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.DateOfJoining=new Date(item.DOJ);
                Formdata.IsDescriptionMandatory=item.IsDescriptionMandatory;
                Formdata.IsProjectCodeMandatory=item.IsProjectCodeMandatory;
                Formdata.WeekStartDay=item.WeekStartDay;
                Formdata.HolidayType=item.HolidayType;
                this.WeekNames=[];
                switch(Formdata.WeekStartDay)
                {
                    case "Monday":
                        this.WeekNames.push({"day1":"Mon","day2":"Tue","day3":"Wed","day4":"Thu","day5":"Fri","day6":"Sat","day7":"Sun","dayCode":"Monday"});
                        break;
                    case "Tuesday":
                        this.WeekNames.push({"day1":"Tue","day2":"Wed","day3":"Thu","day4":"Fri","day5":"Sat","day6":"Sun","day7":"Mon","dayCode":"Tuesday"});
                        break;
                    case "Wednesday":
                        this.WeekNames.push({"day1":"Wed","day2":"Thu","day3":"Fri","day4":"Sat","day5":"Sun","day6":"Mon","day7":"Tue","dayCode":"Wednesday"});
                        break;
                    case "Thursday":
                        this.WeekNames.push({"day1":"Thu","day2":"Fri","day3":"Sat","day4":"Sun","day5":"Mon","day6":"Tue","day7":"Wed","dayCode":"Thursday"});
                        break;
                    case "Friday":
                        this.WeekNames.push({"day1":"Fri","day2":"Sat","day3":"Sun","day4":"Mon","day5":"Tue","day6":"Wed","day7":"Thu","dayCode":"Friday"});
                        break;
                    case "Saturday":
                        this.WeekNames.push({"day1":"Sat","day2":"Sun","day3":"Mon","day4":"Tue","day5":"Wed","day6":"Thu","day7":"Fri","dayCode":"Saturday"});
                        break;
                    case "Sunday":
                        this.WeekNames.push({"day1":"Sun","day2":"Mon","day3":"Tue","day4":"Wed","day5":"Thu","day6":"Fri","day7":"Sat","dayCode":"Sunday"});
                        break;
                }
                break;
            }
        }
        // Formdata.WeekStartDate=null; 
        Formdata.WeekStartDate=this.getCurrentWeekStartDate(Formdata.WeekStartDay);
        //For restricting  of incorrect WeekstarDay binding in DatePicker
        //this.setState({trFormdata:Formdata});
       this.GetHolidayMasterDataByClientName(Formdata.WeekStartDate,Formdata.HolidayType,Formdata);
       this.validateDuplicateRecord(Formdata.WeekStartDate,clientVal,Formdata);
    
    }
    private handleChange = (event) => {
        const formData = { ...this.state.trFormdata };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value != 'None' ? value : null;
        this.setState({trFormdata:formData});
    }
    private changeTime=(event)=>{
        const trFormdata = { ...this.state.trFormdata };
        let value=event.target.value;

        let index=parseInt(event.target.id.split("_")[0]);
        let prop=event.target.id.split("_")[1];
        let rowType=event.target.id.split("_")[2];
        if(!["Description","ProjectCode","Total"].includes(prop))
        {
            value=value.match(/\d{0,5}(\.\d{0,2})?/)[0];
           if(parseFloat(value)>24.00){
                return false
           }
        }
        //FOR ROW WISE CALCULATION
        let TotalRowMins=0;
            if(rowType=="weekrow")
            {
                trFormdata.WeeklyItemsData[index][prop]=value.toString();
                this.setState({trFormdata});
              Object.keys(trFormdata.WeeklyItemsData[index]).forEach(key =>{
                let val=trFormdata.WeeklyItemsData[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" : val;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+(parseFloat(val)); 
                }
              })
              trFormdata.WeeklyItemsData[index]["Total"]=TotalRowMins.toFixed(2);
            }
            else if(rowType=="otrow")
            {
            trFormdata.OTItemsData[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.OTItemsData[index]).forEach(key =>{
                let val=trFormdata.OTItemsData[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+(parseFloat(val)); 
                }
              })
              trFormdata.OTItemsData[index]["Total"]=TotalRowMins.toFixed(2);
            }
            else if(rowType=="SynOffcHrs")
            {
                trFormdata.SynergyOfficeHrs[index][prop]=value.toString();
                this.setState({ trFormdata});
                  Object.keys(trFormdata.SynergyOfficeHrs[index]).forEach(key =>{
                    let val=trFormdata.SynergyOfficeHrs[index][key].toString();
                    [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                    if(!["Description","ProjectCode","Total","Type"].includes(key))
                    {
                        TotalRowMins=TotalRowMins+(parseFloat(val)); 
                    }
                  })
                  trFormdata.SynergyOfficeHrs[index]["Total"]=TotalRowMins.toFixed(2);
            }
            else if(rowType=="SynHldHrs")
           {
            trFormdata.SynergyHolidayHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.SynergyHolidayHrs[index]).forEach(key =>{
                let val=trFormdata.SynergyHolidayHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  value;
                if(!["Description","ProjectCode","Total",,"Type"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })
              trFormdata.SynergyHolidayHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
           else if(rowType=="ClientHldHrs")
           {
            trFormdata.ClientHolidayHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.ClientHolidayHrs[index]).forEach(key =>{
                let val=trFormdata.ClientHolidayHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                if(!["Description","ProjectCode","Total","Type"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })
              trFormdata.ClientHolidayHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
            else if(rowType=="PTOHrs")
          {
            trFormdata.PTOHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.PTOHrs[index]).forEach(key =>{
                let val=trFormdata.PTOHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                if(!["Description","ProjectCode","Total","Type"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })
              trFormdata.PTOHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
           this.setState({ trFormdata});
           //FOR COLUMN WISE CALCULATION
           let WeeklyTotal=0;
           let [Total]=[0];
           let [WeekTotal,OTTotal]=[0,0];
            //BILLABLE SUB TOTAL COLUMN WISE
            // to iterate Weekly hrs
            for(var item of trFormdata.WeeklyItemsData)
            {
                //For weekly calculation
                let val=item[prop].toString();; 
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                WeeklyTotal=WeeklyTotal+(parseFloat(val));
                 //For total calculation
                let TotalVal=item.Total.toString();
                [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal;
                Total= Total+(parseFloat(TotalVal));
                WeekTotal= WeekTotal+(parseFloat(TotalVal));
            }
            trFormdata.WeeklyItemsTotalTime=WeeklyTotal.toFixed(2).toString();
            // to iterate OT hrs
            for(var item of trFormdata.OTItemsData)
            {
                 //For weekly calculation
                let val=item[prop].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" : val;
                WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                 //For total calculation
                 let TotalVal=item.Total.toString();
                [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal;
                 Total= Total+( parseFloat(TotalVal));
                 OTTotal= OTTotal+( parseFloat(TotalVal));
            }
            trFormdata.OTItemsTotalTime=OTTotal.toFixed(2).toString();

            if(!["Description","ProjectCode"].includes(prop))
            trFormdata.BillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
            trFormdata.BillableSubTotal[0]["Total"]=Total.toFixed(2).toString();

             // NON BILLABLE SUBTOTAL COLUMN WISE
             WeeklyTotal=0;
            [Total]=[0];
             let NonBillableColValue=trFormdata.SynergyOfficeHrs[0][prop].toString();
             [undefined,null,"","."].includes(NonBillableColValue.trim())? NonBillableColValue="0" : NonBillableColValue;
             let TotalVal=trFormdata.SynergyOfficeHrs[0]["Total"];
             [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal=TotalVal.toString();
             WeeklyTotal=WeeklyTotal+( parseFloat(NonBillableColValue)); 
             Total=Total+( parseFloat(TotalVal)); 

             NonBillableColValue=trFormdata.SynergyHolidayHrs[0][prop].toString();
             [undefined,null,"","."].includes(NonBillableColValue.trim())? NonBillableColValue="0" : NonBillableColValue;
             TotalVal=trFormdata.SynergyHolidayHrs[0]["Total"].toString();
             [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal;
             WeeklyTotal=WeeklyTotal+( parseFloat(NonBillableColValue));
             Total=Total+( parseFloat(TotalVal)); 
             
             NonBillableColValue=trFormdata.ClientHolidayHrs[0][prop].toString();
             [undefined,null,"","."].includes(NonBillableColValue.trim())? NonBillableColValue="0" : NonBillableColValue;
             TotalVal=trFormdata.ClientHolidayHrs[0]["Total"].toString();
             [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal;
             WeeklyTotal=WeeklyTotal+( parseFloat(NonBillableColValue));
             Total=Total+( parseFloat(TotalVal)); 

             NonBillableColValue=trFormdata.PTOHrs[0][prop].toString();
             [undefined,null,"","."].includes(NonBillableColValue.trim())? NonBillableColValue="0" : NonBillableColValue;
             TotalVal=trFormdata.PTOHrs[0]["Total"].toString();
             [undefined,null,"","."].includes(TotalVal.trim())? TotalVal="0" : TotalVal;
             WeeklyTotal=WeeklyTotal+( parseFloat(NonBillableColValue)); 
             Total=Total+( parseFloat(TotalVal)); 

             if(!["Description","ProjectCode"].includes(prop))
             trFormdata.NonBillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
             trFormdata.NonBillableSubTotal[0]["Total"]=Total.toFixed(2).toString();
             //GRAND TOTAL COLUMN WISE
             WeeklyTotal=0;
             [Total]=[0];
             if(!["Description","ProjectCode"].includes(prop))
             {
             let TotalColVal=trFormdata.BillableSubTotal[0][prop].toString();
             [undefined,null,"","."].includes(TotalColVal.trim())? TotalColVal="0" : TotalColVal;
            let BillableTotalVal=trFormdata.BillableSubTotal[0]["Total"].toString();
            [undefined,null,"","."].includes(BillableTotalVal.trim())? BillableTotalVal="0" : BillableTotalVal;
             WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal)); 
             Total=Total+( parseFloat(BillableTotalVal)); 

             TotalColVal=trFormdata.NonBillableSubTotal[0][prop].toString(); 
             [undefined,null,"","."].includes(TotalColVal.trim())? TotalColVal="0" : TotalColVal;
             BillableTotalVal=trFormdata.NonBillableSubTotal[0]["Total"].toString();
            [undefined,null,"","."].includes(BillableTotalVal.trim())? BillableTotalVal="0" : BillableTotalVal;
             WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal));
             Total=Total+( parseFloat(BillableTotalVal)); 
             }
             if(!["Description","ProjectCode"].includes(prop))
             {

                 trFormdata.Total[0][prop]=WeeklyTotal.toFixed(2).toString();
                 trFormdata.Total[0]["Total"]=Total.toFixed(2).toString();
             }else{
                trFormdata.Total[0][prop]=trFormdata.Total[0][prop];
                trFormdata.Total[0]["Total"]=trFormdata.Total[0]["Total"];
             }
          
        this.setState({ trFormdata});
    }
    private calculateTimeWhenRemoveRow=(Data,DataAfterRemovedObject,RowType)=>{
        const trFormdata =Data;
        let TableColumns=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Total"];
          //FOR COLUMN WISE CALCULATION
        for(var prop of TableColumns)
        {
            let [WeeklyTotal]=[0,0,0];
            if(RowType.toLowerCase()=="weekrow")  //When Weekly items removed 
            {

                        //BILLABLE SUB TOTAL COLUMN WISE
                        // to iterate Weekly hrs
                        for(var item of DataAfterRemovedObject)
                        { 
                            let val=item[prop].toString(); 
                            [undefined,null,"","."].includes(val)? val="0" : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                        }
                         // to iterate OT hrs
                        for(var item of trFormdata.OTItemsData)
                        {
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0"  :  val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                        }
            }
            else{      //When OT items removed 
                
                        //BILLABLE SUB TOTAL COLUMN WISE
                        // to iterate Weekly hrs
                        for(var item of trFormdata.WeeklyItemsData)
                        {
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0" : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val));
                        }
                       // to iterate OT hrs
                        for(var item of DataAfterRemovedObject)
                        {
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0"  : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                        }

            }
                        trFormdata.BillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
                        //GRAND TOTAL COLUMN WISE
                        WeeklyTotal=0;
                        let TotalColVal=trFormdata.BillableSubTotal[0][prop].toString();
                        [undefined,null,"","."].includes(TotalColVal)? TotalColVal="0" : TotalColVal;
                         WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal)); 
                     
                        TotalColVal=trFormdata.NonBillableSubTotal[0][prop].toString();
                        [undefined,null,"","."].includes(TotalColVal)? TotalColVal="0"  : TotalColVal;
                         WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal));
                     
                        trFormdata.Total[0][prop]=WeeklyTotal.toFixed(2).toString();
        }
        return trFormdata;  
    }
    private CancelDeleteRow =() =>
    {
        this.setState({showConfirmDeletePopup:false,ConfirmPopupMessage:"",ActionButtonId:"",redirect:false});
    }
    private RemoveCurrentRow=()=>{
        let RowType=this.state.RowType;
        let rowCount=parseInt(this.state.rowCount);
        let count;
        // let ItemsAfterRemove=[];
        if(RowType.toLowerCase()=="weekrow")
        {
            let trFormdata = { ...this.state.trFormdata };
            let tempItemsData=   trFormdata.WeeklyItemsData;
            trFormdata.WeeklyItemsData=[];
            let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
            count = WeeklyRowsCount - 1;
           for( var i=0;i<tempItemsData.length;i++)
           {
            if(i!=rowCount)
            // ItemsAfterRemove.push(tempItemsData[i]);
            trFormdata.WeeklyItemsData.push(tempItemsData[i]);
           }
           //trFormdata.WeeklyItemsData=ItemsAfterRemove;
            trFormdata=this.calculateTimeWhenRemoveRow(trFormdata,trFormdata.WeeklyItemsData,RowType);
            this.setState({trFormdata, currentWeeklyRowsCount: count,showConfirmDeletePopup:false});

        }
        else{
            let trFormdata = { ...this.state.trFormdata };
            let tempItemsData=   trFormdata.OTItemsData;
            trFormdata.OTItemsData=[];
            let OTRowsCount = this.state.currentOTRowsCount;
            count = OTRowsCount - 1;
           for( var i=0;i<tempItemsData.length;i++)
           {
            if(i!=rowCount)
            // ItemsAfterRemove.push(tempItemsData[i]);
            trFormdata.OTItemsData.push(tempItemsData[i]);
           }
        //trFormdata.OTItemsData=ItemsAfterRemove;
        trFormdata=this.calculateTimeWhenRemoveRow(trFormdata,trFormdata.OTItemsData,RowType);
            this.setState({ trFormdata, currentOTRowsCount: count,showConfirmDeletePopup:false});
        }
    }
    private CreateWeeklyHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let isValid={status:true,message:''};
        for(let i in trFormdata.WeeklyItemsData)
        {  
            if(parseFloat(trFormdata.WeeklyItemsData[i].Total)==0)
            {
                isValid.message="Total working hours in a week cannot be 0 .";
                isValid.status=false;
                document.getElementById(i+"_Total_weekrow").focus();
                document.getElementById(i+"_Total_weekrow").classList.add('mandatory-FormContent-focus');
                break;
            }
        }
        if(isValid.status)
        {
            for(let i in trFormdata.WeeklyItemsData)
            {
            document.getElementById(i+"_Total_weekrow").classList.remove('mandatory-FormContent-focus');
            }
            
            let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
            let count = WeeklyRowsCount + 1;
            let newObj={Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00'};
            trFormdata.WeeklyItemsData.push(newObj);
            this.setState({ trFormdata, currentWeeklyRowsCount: count ,showLabel: true, errorMessage:""});
        }
        else{
            customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
        }
    }
    private CreateOTHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let isValid={status:true,message:''};
        for(let i in trFormdata.OTItemsData)
        {
            if(parseFloat(trFormdata.OTItemsData[i].Total)==0)
            {
                isValid.message="Total working hours in a week cannot be 0 .";
                isValid.status=false;
                document.getElementById(i+"_Total_otrow").focus();
                document.getElementById(i+"_Total_otrow").classList.add('mandatory-FormContent-focus');
                break;
            }
        }
      if(isValid.status)
      {
        for(let i in trFormdata.OTItemsData)
            {
            document.getElementById(i+"_Total_otrow").classList.remove('mandatory-FormContent-focus');
            }
          let OTRowsCount = this.state.currentOTRowsCount;
          let count = OTRowsCount + 1;
          let newObj={Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00'};
  
          trFormdata.OTItemsData.push(newObj);
          this.setState({ trFormdata, currentOTRowsCount: count,showLabel:false, errorMessage:""});
      }
      else{
        customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
      }
    }
    //functions related to confirmation popup
    private showConfirmDeleteRow = (event)=>{
        this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to delete this row?'});
         let TypeofRow = event.currentTarget.id.split("_")[1];
         let  CountOfRow = event.currentTarget.id.split("_")[0];
         this.setState({RowType:TypeofRow,rowCount:CountOfRow})
    }
    private showConfirmSubmit=(event)=>{
        let data = {};
        // new onbehalf changes
        {this.state.onBehalf?data['Employee'] = {val:this.state.currentUserId,required:true, Name: 'Employee', Type: ControlType.number, Focusid: this.EmployeeDropdown}:''}
        data['ClientName']={val:this.state.trFormdata.ClientName,required:true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client}
        data['WeeklyStartDate']={val: this.state.trFormdata.WeekStartDate, required:true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid:"divWeekStartDate"}
        var formdata = { ...this.state.trFormdata };
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            isValid=this.validateTimeControls(formdata,"Submit");
        }
        if (isValid.status) {
        this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to submit?',ActionButtonId:event.target.id});
         }
        else {
            customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
        }
    }
    private showConfirmApprove=(event)=>{
        this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to approve?',ActionButtonId:event.target.id});
    }
    private showConfirmReject=(event)=>{
        if ([null,undefined,""].includes(this.state.trFormdata.Comments.trim())) {
            customToaster('toster-error',ToasterTypes.Error,'Comments cannot be blank.',4000)
            document.getElementById("txtComments").focus();
            document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
        }
        else
        {
            this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to reject?',ActionButtonId:event.target.id});
        }
    }
    private showConfirmRevoke=(event)=>{
        if ([null,undefined,""].includes(this.state.trFormdata.Comments.trim())) {
            customToaster('toster-error',ToasterTypes.Error,'Comments cannot be blank.',4000)
            document.getElementById("txtComments").focus();
            document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
        }
        else
        {
        this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to revoke?',ActionButtonId:event.target.id});
        }
       
    }
    //functions related to CRUD operations
   private handleSubmitorSave = async () => {
    this.setState({showConfirmDeletePopup:false})
        let Action=this.state.ActionButtonId=="btnSubmit"? this.state.ActionButtonId : "btnSave";
        let data = {};
                // new onbehalf changes
        {this.state.onBehalf?data['Employee'] = {val:this.state.currentUserId,required:true, Name: 'Employee', Type: ControlType.number, Focusid: this.EmployeeDropdown}:''}
        data['ClientName']={val:this.state.trFormdata.ClientName,required:true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client}
        data['WeeklyStartDate']={val: this.state.trFormdata.WeekStartDate, required:true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid:"divWeekStartDate"}
        var formdata = { ...this.state.trFormdata };
        var id = this.props.match.params.id ? this.props.match.params.id : 0;

        formdata=this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        this.setState({trFormdata:formdata})
        let isValid = Formvalidator.checkValidations(data);
        if(Action=="btnSave")
        {
            if (isValid.status) {
                isValid=this.validateTimeControls(formdata,"Save");
            }
        }
        if (isValid.status) {
            // console.log(this.state);
            formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
            this.setState({trFormdata:formdata})
            var postObject = {
                Name : formdata.Name,
                ClientName :formdata.ClientName, 
                WeekStartDate:this.addBrowserwrtServer(new Date(formdata.WeekStartDate.getMonth()+1+"/"+formdata.WeekStartDate.getDate()+"/"+formdata.WeekStartDate.getFullYear())),
                WeeklyHrs:JSON.stringify(formdata.WeeklyItemsData),
                OverTimeHrs:JSON.stringify(formdata.OTItemsData),
                BillableSubtotalHrs:JSON.stringify(formdata.BillableSubTotal),
                SynergyOfficeHrs:JSON.stringify(formdata.SynergyOfficeHrs),
                SynergyHolidayHrs:JSON.stringify(formdata.SynergyHolidayHrs),
                ClientHolidayHrs:JSON.stringify(formdata.ClientHolidayHrs),
                PTOHrs:JSON.stringify(formdata.PTOHrs),
                NonBillableSubTotalHrs:JSON.stringify(formdata.NonBillableSubTotal),
                TotalHrs:JSON.stringify(formdata.Total),
                SuperviserName:JSON.stringify(formdata.SuperviserNames),
                InitiatorId:this.state.currentUserId,
                BillableTotalHrs:formdata.BillableSubTotal[0].Total,
                NonBillableTotalHrs:formdata.NonBillableSubTotal[0].Total,
                GrandTotal:formdata.Total[0].Total,
                WeeklyTotalHrs:formdata.WeeklyItemsTotalTime,
                OTTotalHrs:formdata.OTItemsTotalTime,
                WeeklySubTotalHrs:JSON.stringify(formdata.WeeklySubTotalHrs),
                OTSubTotalHrs:JSON.stringify(formdata.OTSubTotalHrs),
                ReportingManagerId:{"results":formdata.SuperviserIds},
               // DelegateToId:{"results":formdata.DelegateToIds},
                ReviewersId:{"results":formdata.ReviewerIds},
                NotifiersId:{"results":formdata.NotifierIds},
                Comments:formdata.Comments,
               //IsClientApprovalNeed:formdata.IsClientApprovalNeededUI,
               Revised:formdata.Revised
            }
            if(Action.toLowerCase()=="btnsave")
            {
                    postObject['Status']=StatusType.Save;
                    postObject['PendingWith']="Initiator";
                   postObject['AssignedToId']={"results":[this.state.currentUserId]};
            }
            else if(Action.toLowerCase()=="btnsubmit")
              {

                    if(formdata.IsSubmitted)
                    {
                        let user = "Initiator";
                        user = this.state.EmployeeEmail!=this.props.spContext.userEmail?"Administator":user
                        formdata.CommentsHistoryData.push({"Action":"Re-Submitted","Role":user,"User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                    }
                    else{
                        let user = "Initiator"
                        user = this.state.onBehalf?"Administrator":user
                        formdata.CommentsHistoryData.push({"Action":StatusType.Submit,"Role":user,"User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                    }
                    postObject['IsSubmitted']=true;
                   if(this.state.ItemID==0)
                   {
                    postObject['Status']=StatusType.Submit;
                    postObject['PendingWith']="Manager";
                    postObject['DateSubmitted']=new Date();
                    postObject['AssignedToId']={"results":formdata.SuperviserIds};
                   }
                   else
                   {
                       if(formdata.IsClientApprovalNeeded)
                       {
                           postObject['Status']=StatusType.Submit;
                           postObject['PendingWith']="Manager";
                           postObject['DateSubmitted']=new Date();
                           postObject['AssignedToId']={"results":formdata.SuperviserIds};
                       }
                       else{
                        if(StatusType.Save==formdata.Status||StatusType.Revoke==formdata.Status||StatusType.ManagerReject==formdata.Status)
                         {
                            postObject['Status']=StatusType.Submit;
                            postObject['PendingWith']="Manager";
                            postObject['DateSubmitted']=new Date();
                            postObject['AssignedToId']={"results":formdata.SuperviserIds};
                            //Condition for Reviewer reject / Manager reject scenarios changed to save
                            if(formdata.CommentsHistoryData.length>2)
                            {
                                if(formdata.CommentsHistoryData[formdata.CommentsHistoryData.length-2]['Role']=="Reviewer")
                                {
                                    //postObject['Status']=StatusType.Approved;
                                    //postObject['PendingWith']="NA";
                                    postObject['Status']=StatusType.ManagerApprove;
                                    postObject['PendingWith']="Reviewer";
                                    postObject['DateSubmitted']=new Date();
                                    postObject['AssignedToId']={"results":formdata.ReviewerIds};
                                }else
                                {
                                    postObject['Status']=StatusType.Submit;
                                    postObject['PendingWith']="Manager";
                                    postObject['DateSubmitted']=new Date();
                                    postObject['AssignedToId']={"results":formdata.SuperviserIds};
                                }
                            }
                         }
                         else if(StatusType.ReviewerReject==formdata.Status){
                            // postObject['Status']=StatusType.Approved;
                            // postObject['PendingWith']="NA";
                             postObject['Status']=StatusType.ManagerApprove;
                             postObject['PendingWith']="Reviewer";
                             postObject['DateSubmitted']=new Date();
                             postObject['AssignedToId']={"results":formdata.ReviewerIds};
                         }
                       }
                   }
            }
                postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
                this.setState({errorMessage : '',trFormdata:formdata});
                this.InsertorUpdatedata(postObject,formdata);
       } 
        else {
            customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
        }
    }
    private GetRequiredEmails=(ClientName,formdata)=>{
        let clientVal=ClientName;
        const Formdata =formdata;
            Formdata.ClientName=clientVal;
            Formdata.SuperviserNames=[];
            Formdata.SuperviserIds=[];
            Formdata.ReviewerIds=[];
            Formdata.NotifierIds=[];
            let RMEmail=[];
            let ReviewEmail=[];
            let NotifyEmail=[];
        // console.log(this.state);
        for( var item of this.state.SuperviserNames)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.SuperviserNames.push(item.ReportingManager);
                Formdata.SuperviserIds.push(item.ReportingManagerId);
                RMEmail.push(item.ReportingManagerEmail)
            }
        }
        // for( var item of this.state.DelegateTo)
        // {
        //     if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
        //     {
        //         Formdata.DelegateToIds.push(item.DelegateToId);
        //         Formdata.DelegateToEmails.push(item.DelegateToEmail);
        //     }
        // }
        for( var item of this.state.Reviewers)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.ReviewerIds.push(item.ReviewerId);
                ReviewEmail.push(item.ReviewerEmail)
            }
        }
        for( var item of this.state.Notifiers)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.NotifierIds.push(item.NotifierId);
                NotifyEmail.push(item.NotifierEmail);
            }
        }
        Formdata.ReportingManagersEmail=RMEmail;
        Formdata.ReviewersEmail=ReviewEmail;
        Formdata.NotifierEmail=NotifyEmail;
        return Formdata;
     }
     private Calculate_Indvidual_OT_Weekly_TotalTime=(Formdata)=>{
        const formdata =Formdata;
        let TableColumns=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Total"];
         for(var prop of TableColumns)
         {
             let [WeeklyTotal,OTTotal]=[0,0];
                         //WEEKLY SUB TOTAL COLUMN WISE
                         for(var item of formdata.WeeklyItemsData)
                         {
                             let val=item[prop].toString(); 
                             [undefined,null,"","."].includes(val)? val="0" : val;
                             WeeklyTotal=WeeklyTotal+( parseFloat(val));
                         }
                         //OT SUB TOTAL COLUMN WISE      
                         for(var item of formdata.OTItemsData)
                         {
                             let val=item[prop].toString();
                             [undefined,null,"","."].includes(val)? val="0" : val;
                             OTTotal=OTTotal+( parseFloat(val));
                         }
                         formdata.WeeklySubTotalHrs[0][prop]=WeeklyTotal.toFixed(2).toString();
                         formdata.OTSubTotalHrs[0][prop]=OTTotal.toFixed(2).toString();
             }   
             formdata.WeeklyItemsTotalTime=formdata.WeeklySubTotalHrs[0]["Total"];
             formdata.OTItemsTotalTime=formdata.OTSubTotalHrs[0]["Total"] ;
         return formdata;
     }
    private handleApprove=async ()=>
    {
        this.setState({showConfirmDeletePopup:false})
        var formdata = { ...this.state.trFormdata };
        formdata=this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
        var postObject={};
        switch(formdata.Status)
        {
            case StatusType.Submit:
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Manager","User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                //postObject['Status']=StatusType.Approved;
                //postObject['PendingWith']="NA";
                let IsReportingManagerReviewerSame=false;
                for(let RM of formdata.ReportingManagersEmail){
                    for(let Rew of formdata.ReviewersEmail){
                        if(RM==Rew)
                        {
                            IsReportingManagerReviewerSame=true;
                            break;
                        }
                           
                    }}
                    if(IsReportingManagerReviewerSame)
                    {
                        postObject['Status']=StatusType.Approved;
                        postObject['PendingWith']="NA";
                        postObject['AssignedToId']={"results":[]};
                        break;
                    }else{
                        postObject['Status']=StatusType.ManagerApprove;
                        postObject['PendingWith']="Reviewer";
                        postObject['AssignedToId']={"results":formdata.ReviewerIds};
                        break;
                    }
            //case StatusType.InProgress:
            case StatusType.ManagerApprove:
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Reviewer","User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.Approved;
                postObject['PendingWith']="NA";
                postObject['AssignedToId']={"results":[]};
                break;
        }
             postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
    }
    private handleRevoke=async ()=>
    {  
        this.setState({showConfirmDeletePopup:false})
        var formdata = { ...this.state.trFormdata };
        formdata=this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
        var postObject={};
        let user = "Initiator";
        user = this.state.EmployeeEmail!=this.props.spContext.userEmail?"Administator":user;
                formdata.CommentsHistoryData.push({"Action":StatusType.Revoke,"Role":user,"User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.Revoke;
                postObject['PendingWith']="Initiator";
                postObject['AssignedToId']={"results":[this.state.currentUserId]};
                postObject['IsClientApprovalNeed']=false;
                //if(formdata.Status==StatusType.Approved)
                if(formdata.Status==StatusType.ManagerApprove)
                postObject['Revised']=true;
           
             postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
    }
    private handleReject=async ()=>
    {
        this.setState({showConfirmDeletePopup:false})
        var formdata = { ...this.state.trFormdata};
            formdata=this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
            formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
            var postObject={};
            if(formdata.Status==StatusType.Submit)
            {
                formdata.CommentsHistoryData.push({"Action":StatusType.Reject,"Role":"Manager","User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.ManagerReject;
            }
           // else if(formdata.Status==StatusType.Approved){
            else if(formdata.Status==StatusType.ManagerApprove){
                formdata.CommentsHistoryData.push({"Action":StatusType.Reject,"Role":"Reviewer","User":this.props.spContext.userDisplayName,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.ReviewerReject;
                postObject['Revised']=true;
            }
            postObject['PendingWith']="Initiator";
            postObject['AssignedToId']={"results":[this.state.currentUserId]};
            postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            postObject['IsClientApprovalNeed']=formdata.IsClientApprovalNeededUI;
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
    }
    private handleCancel=async()=>
    {
        this.setState({showHideModal : false,ItemID:0,errorMessage:'',loading: false});
        this.setState({redirect : true}); 
    }
    private InsertorUpdatedata(formdata,formObject) {
        this.setState({ loading: true });
        let tableContent;
        if(formObject.ClientName.toLowerCase().includes("synergy"))
        {   
            if(formObject.Comments.trim()=="")
            tableContent = {'Name':this.state.trFormdata.Name,'Client':this.state.trFormdata.ClientName,'Submitted Date':`${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`,'Office  Hours':this.state.trFormdata.SynergyOfficeHrs[0].Total,'Holiday Hours':this.state.trFormdata.ClientHolidayHrs[0].Total,'Time Off Hours':this.state.trFormdata.PTOHrs[0].Total,'Grand Total Hours':this.state.trFormdata.Total[0].Total}
            else
            tableContent = {'Name':this.state.trFormdata.Name,'Client':this.state.trFormdata.ClientName,'Submitted Date':`${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`,'Office  Hours':this.state.trFormdata.SynergyOfficeHrs[0].Total,'Holiday Hours':this.state.trFormdata.ClientHolidayHrs[0].Total,'Time Off Hours':this.state.trFormdata.PTOHrs[0].Total,'Grand Total Hours':this.state.trFormdata.Total[0].Total,'Comments':formObject.Comments}
        }
        else 
        {
            if(formObject.Comments.trim()=="")
            tableContent = {'Name':this.state.trFormdata.Name,'Client':this.state.trFormdata.ClientName,'Submitted Date':`${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`,'Billable Hours':formObject.WeeklyItemsTotalTime,'OT Hours':formObject.OTItemsTotalTime,'Total Billable Hours':this.state.trFormdata.BillableSubTotal[0].Total,'Holiday Hours':this.state.trFormdata.ClientHolidayHrs[0].Total,'Time Off Hours':this.state.trFormdata.PTOHrs[0].Total,'Grand Total Hours':this.state.trFormdata.Total[0].Total}
            else
            tableContent = {'Name':this.state.trFormdata.Name,'Client':this.state.trFormdata.ClientName,'Submitted Date':`${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`,'Billable Hours':formObject.WeeklyItemsTotalTime,'OT Hours':formObject.OTItemsTotalTime,'Total Billable Hours':this.state.trFormdata.BillableSubTotal[0].Total,'Holiday Hours':this.state.trFormdata.ClientHolidayHrs[0].Total,'Time Off Hours':this.state.trFormdata.PTOHrs[0].Total,'Grand Total Hours':this.state.trFormdata.Total[0].Total,'Comments':formObject.Comments}
        }
        let sub='';
        let emaildetails={};
        let To=[];
        let CC=[];
        if (this.state.ItemID!=0) { //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then((res) => {
               if(StatusType.Save==formdata.Status)
               {
                customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet saved successfully',2000)
                this.getItemData(this.state.ItemID);
               }
               else if(StatusType.Revoke==formdata.Status)
               {
                     if(formObject.IsDelegated)
                     {
                        for(const mail of formObject.DelegateToEmails)
                        {
                            To.push(mail);
                        }
                     }
                     else{
                         for(const mail of formObject.ReportingManagersEmail)
                         {
                             To.push(mail);
                         }
                     }
                    for(const mail of formObject.ReviewersEmail)
                    {
                        To.push(mail);
                    }
                sub="Weekly Time Sheet has been "+formdata.Status+"."
                emaildetails ={toemail:To,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                this.sendemail(emaildetails,formdata.Status);
                // this.setState({loading:false})
                // customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Revoke.toLowerCase()+' successfully',2000)
                // this.getItemData(this.state.ItemID);
               }
               else if(StatusType.Submit==formdata.Status)
               {
                    sub="Weekly Time Sheet has been "+formdata.Status+"."
                    formObject.IsDelegated?To=formObject.DelegateToEmails:To=formObject.ReportingManagersEmail;
                    emaildetails ={toemail:To,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                    var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                    this.sendemail(emaildetails,formdata.Status);
                    //this.setState({ActionToasterMessage:'Success-'+StatusType.Submit,loading:false,redirect:true})

               }
               else if([StatusType.ReviewerReject,StatusType.Save].includes(formObject.Status))  //submitted after Reviewer Reject or Reviewer reject->save but client Approval not needed or not depends on IsClientApprovalNeeded
            {
                 sub="Weekly Time Sheet has been "+StatusType.Submit+"."
                 if(formObject.IsClientApprovalNeeded)
                 {
                    if(formObject.IsDelegated)
                    {
                        for(const mail of formObject.DelegateToEmails)
                        {
                            CC.push(mail);
                        }
                    }
                    else{
                        for(const mail of formObject.ReportingManagersEmail)
                        {
                            CC.push(mail);
                        }
                    }
                 }
                for(const mail of formObject.ReviewersEmail)
                {
                    CC.push(mail);
                }
                 emaildetails ={toemail:CC,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                 var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                 emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                 this.sendemail(emaildetails,StatusType.Submit);
                 //this.setState({ActionToasterMessage:'Success-'+StatusType.Submit,loading:false,redirect:true})

               }
               else if([StatusType.ManagerApprove,StatusType.Approved].includes(formdata.Status))
               {
                    sub=formdata.Status==StatusType.Approved?"Weekly Time Sheet has been "+StatusType.ReviewerApprove+".":"Weekly Time Sheet has been "+formdata.Status+".";
                    if(formdata.Status==StatusType.ManagerApprove)
                    {
                        To=this.state.EmployeeEmail;
                        if(formObject.IsDelegated)
                        {
                            for(const mail of formObject.DelegateToEmails)
                            {
                                CC.push(mail);
                            }
                        }
                        else{
                            for(const mail of formObject.ReportingManagersEmail)
                            {
                                CC.push(mail);
                            }
                        }
                        for(const mail of formObject.ReviewersEmail)
                        {
                            To.push(mail);
                        }
                    }
                    else if(formdata.Status==StatusType.Approved){
                        To=this.state.EmployeeEmail;
                        if(formObject.IsDelegated)
                        {
                            for(const mail of formObject.DelegateToEmails)
                            {
                                CC.push(mail);
                            }
                        }
                        else{
                            for(const mail of formObject.ReportingManagersEmail)
                            {
                                CC.push(mail);
                            }
                        }
                        for(const mail of formObject.ReviewersEmail)
                        {
                            CC.push(mail);
                        }

                    }
                    emaildetails ={toemail:To,ccemail:CC,subject:sub,bodyString:sub,body:'' };
                    var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                    this.sendemail(emaildetails,StatusType.Approved);
                    //this.setState({ActionToasterMessage:'Success-'+StatusType.Approved,loading:false,redirect:true})
               }
               else if([StatusType.ManagerReject,StatusType.ReviewerReject].includes(formdata.Status))
               {
                sub="Weekly Time Sheet has been "+formdata.Status+". Please re-submit with necessary details."
                        if(formObject.IsClientApprovalNeeded)
                        {
                            if(formObject.IsDelegated)
                            {
                                for(const mail of formObject.DelegateToEmails)
                                {
                                    CC.push(mail);
                                }
                            }
                            else{
                                for(const mail of formObject.ReportingManagersEmail)
                                {
                                    CC.push(mail);
                                }
                            }
                        }
                       
                       for(const mail of formObject.ReviewersEmail)
                       {
                           CC.push(mail);
                       }
                       emaildetails ={toemail:this.state.EmployeeEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
                       var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                       emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                       this.sendemail(emaildetails,formdata.Status);
                       //this.setState({ActionToasterMessage:'Success-'+StatusType.Reject,loading:false,redirect:true})
               } 
            }, (error) => {
                this.setState({ActionToasterMessage:'Error',loading:false,redirect:true})
                console.log(error);
            });
        } 
        else {   //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle(this.listName).items.add(formdata).then((res) => {
                    let ItemID = res.data.Id;
                    if (StatusType.Save == formdata.Status) {
                        this.setState({ItemID:ItemID})
                        customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet saved successfully',2000)
                        this.getItemData(ItemID);
                    }
                    else if(StatusType.Submit==formdata.Status)
                    {
                         sub="Weekly Time Sheet has been "+formdata.Status+"."
                         emaildetails ={toemail:formObject.ReportingManagersEmail,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                         var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                         emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                         this.sendemail(emaildetails,formdata.Status);
                         //this.setState({ActionToasterMessage:'Success-'+StatusType.Submit,loading:false,redirect:true})
                    }
                }, (error) => {
                    console.log(error);
                    this.setState({ActionToasterMessage:'Error',loading:false,redirect:true})
                });
            }
            catch (e) {
                console.log('Failed to add');
                this.setState({ActionToasterMessage:'Error',loading:false,redirect:true})
            }

        }
    }
    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName,DashboardURL) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details or go to <a href="+ DashboardURL+">Dashboard</a>.";
        var emailBody = '<table id="email-container" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; text-align: left;"width="600px">' +
            '<tr valign="top"><td colspan="2"><div id="email-to">Dear Sir/Madam,</br></div></td></tr>';
        emailBody += '<tr valign="top"><td colspan="2" style="padding-top: 10px;">' + bodyString + '</td></tr>';
        var i = 0;
        for (var key in tableContent) {        
            if (i === 0)
                emailBody += "<tr><td></br></td></tr>";
            var tdValue = tableContent[key];
            emailBody += '<tr valign="top"> <td style="width:200px">' + key + '</td><td>: ' + tdValue + '</td></tr>';
            i++;
        }
        emailBody += '<tr valign="top"> <td colspan="2" style="padding-top: 10px;"></br>' + emailLink + '</td></tr>';
        emailBody += '<tr valign="top"><td colspan="2"></br><p style="margin-bottom: 0;">Regards,</p><div style="margin-top: 5px;" id="email-from">' + userName + '</div>';
        emailBody += '</td></tr></table>';
        return emailBody;
    }
    private sendemail(emaildetails,ActionStatus){
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,  
            //Subject of Email  
            Subject: emaildetails.subject,  
            //Array of string for To of Email  
            To: emaildetails.toemail,  
            CC: emaildetails.ccemail
          }).then((i) => {  
           if(ActionStatus==StatusType.Submit)
           this.setState({ActionToasterMessage:'Success-'+StatusType.Submit,loading:false,redirect:true})
           else if(ActionStatus==StatusType.Approved)
           this.setState({ActionToasterMessage:'Success-'+StatusType.Approved,loading:false,redirect:true})
           else if([StatusType.ManagerReject,StatusType.ReviewerReject].includes(ActionStatus))
           this.setState({ActionToasterMessage:'Success-'+StatusType.Reject,loading:false,redirect:true})
           else if(ActionStatus==StatusType.Revoke)
           {
               this.setState({loading:false})
               customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Revoke.toLowerCase()+' successfully',2000)
               this.getItemData(this.state.ItemID);
           }
          
          }).catch((i) => {
            this.setState({ActionToasterMessage:'Error',loading:false,redirect:true})
            console.log(i)
          });  
    }
    private async validateDuplicateRecord(date,ClientName,trFormdata) {
        let filterQuery = '';
        let ExistRecordData = [];
        if(![null,"",undefined].includes(date)){
        let prevDate = addDays(new Date(date), -1);
        let nextDate = addDays(new Date(date), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`
         filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
         let selectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,DelegateTo/EMail,Notifiers/EMail,*"
         let filterQuery2 = " and ClientName eq '" + ClientName + "' and Initiator/ID eq '" + this.state.currentUserId + "'"
         filterQuery += filterQuery2;
          ExistRecordData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).select(selectQuery).expand('Initiator,Reviewers,ReportingManager,DelegateTo,Notifiers').get();
        //  console.log(ExistRecordData);
        }
            if(ExistRecordData.length>=1)
            {
                trFormdata.ClientName=ExistRecordData[0].ClientName;
                trFormdata.Name=ExistRecordData[0].Name;
                trFormdata.WeekStartDate=new Date(ExistRecordData[0].WeekStartDate);
                trFormdata.WeeklyItemsData=JSON.parse(ExistRecordData[0].WeeklyHrs);
                trFormdata.OTItemsData=JSON.parse(ExistRecordData[0].OverTimeHrs);
                trFormdata.BillableSubTotal=JSON.parse(ExistRecordData[0].BillableSubtotalHrs);
                trFormdata.SynergyOfficeHrs=JSON.parse(ExistRecordData[0].SynergyOfficeHrs);
                trFormdata.SynergyHolidayHrs=JSON.parse(ExistRecordData[0].SynergyHolidayHrs);
                trFormdata.ClientHolidayHrs=JSON.parse(ExistRecordData[0].ClientHolidayHrs);
                trFormdata.PTOHrs=JSON.parse(ExistRecordData[0].PTOHrs);
                trFormdata.WeeklyItemsTotalTime=ExistRecordData[0].WeeklyTotalHrs;
                trFormdata.OTItemsTotalTime=ExistRecordData[0].OTTotalHrs;
                trFormdata.WeeklySubTotalHrs=JSON.parse(ExistRecordData[0].WeeklySubTotalHrs)
                trFormdata.OTSubTotalHrs=JSON.parse(ExistRecordData[0].OTSubTotalHrs)
                trFormdata.NonBillableSubTotal=JSON.parse(ExistRecordData[0].NonBillableSubTotalHrs);
                trFormdata.Total=JSON.parse(ExistRecordData[0].TotalHrs);
                trFormdata.Status=ExistRecordData[0].Status;
                trFormdata.CommentsHistoryData=JSON.parse(ExistRecordData[0].CommentsHistory);
                trFormdata.Status== StatusType.Save?trFormdata.Comments=ExistRecordData[0].Comments==null?'':ExistRecordData[0].Comments:trFormdata.Comments='';
                trFormdata.SuperviserNames=JSON.parse(ExistRecordData[0].SuperviserName);
                trFormdata.Pendingwith=ExistRecordData[0].PendingWith;
                trFormdata.IsClientApprovalNeeded=ExistRecordData[0].IsClientApprovalNeed;
                trFormdata.IsClientApprovalNeededUI=false;
                trFormdata.Revised=ExistRecordData[0].Revised;
                trFormdata.IsSubmitted=ExistRecordData[0].IsSubmitted;
                trFormdata.IsDelegated=ExistRecordData[0].IsDelegated;
                let EmpEmail=[];
                let RMEmail=[];
                let DelToEmail=[];
                let ReviewEmail=[];
                let NotifyEmail=[];
                EmpEmail.push(ExistRecordData[0].Initiator.EMail); 
                if(ExistRecordData[0].hasOwnProperty("ReportingManager"))   
                ExistRecordData[0].ReportingManager.map(i=>(RMEmail.push(i.EMail)));
                if(ExistRecordData[0].hasOwnProperty("DelegateTo"))        
                ExistRecordData[0].DelegateTo.map(i=>(DelToEmail.push(i.EMail)));
                if(ExistRecordData[0].hasOwnProperty("Reviewers"))        
                ExistRecordData[0].Reviewers.map(i=>(ReviewEmail.push(i.EMail)));
                if(ExistRecordData[0].hasOwnProperty("Notifiers"))  
                ExistRecordData[0].Notifiers.map(i=>(NotifyEmail.push(i.EMail)));
                if( trFormdata.CommentsHistoryData==null)
                trFormdata.CommentsHistoryData=[];
               
                trFormdata.ReportingManagersEmail=RMEmail;
                trFormdata.DelegateToEmails=DelToEmail;
                trFormdata.ReviewersEmail=ReviewEmail;
                trFormdata.NotifiersEmail=NotifyEmail;
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:ExistRecordData[0].ID,EmployeeEmail:EmpEmail,errorMessage:'',loading:false,showBillable : false, showNonBillable: false});
                if([StatusType.Submit,StatusType.Approved,StatusType.ManagerApprove].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:true});
                }
                else if([StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.Save,StatusType.Revoke].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:false});
                }
                if([StatusType.ReviewerReject,StatusType.Save].includes(ExistRecordData[0].Status))
                {
                     //Condition for Reviewer reject / Manager reject scenarios changed to save
                    if(trFormdata.Revised&&!ExistRecordData[0].IsClientApprovalNeed)
                    {   
                        this.setState({showBillable:false})
                        if (trFormdata.CommentsHistoryData[trFormdata.CommentsHistoryData.length - 1]['Role'] == "Reviewer") {
                            if (ExistRecordData[0].IsClientApprovalNeed)
                                this.setState({ showBillable: false })
                            else
                                this.setState({ showBillable: true })
                        }
                    }
                    else if(trFormdata.Revised)
                    {   
                        if(ExistRecordData[0].IsClientApprovalNeed)
                        this.setState({showBillable:false})
                        else
                        this.setState({showBillable:true})
                    }
                }
                let WeekStartDate=new Date(new Date(ExistRecordData[0].WeekStartDate).getMonth()+1+"/"+new Date(ExistRecordData[0].WeekStartDate).getDate()+"/"+new Date(ExistRecordData[0].WeekStartDate).getFullYear());
                let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
                this.WeekHeadings=[];
                this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsMonJoined":WeekStartDate<DateOfjoining,
                "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsTueJoined":WeekStartDate<DateOfjoining,
                "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsWedJoined":WeekStartDate<DateOfjoining,
                "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsThuJoined":WeekStartDate<DateOfjoining,
                "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsFriJoined":WeekStartDate<DateOfjoining,
                "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsSatJoined":WeekStartDate<DateOfjoining,
                "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsSunJoined":WeekStartDate<DateOfjoining,
                "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                })
            }
            else{
                trFormdata.ClientName=trFormdata.ClientName;
                trFormdata.Name=trFormdata.Name;
                trFormdata.WeekStartDate=trFormdata.WeekStartDate;
                trFormdata.WeeklyItemsData=[];
                trFormdata.OTItemsData=[];
                trFormdata.BillableSubTotal=[];
                trFormdata.SynergyOfficeHrs=[];
                trFormdata.SynergyHolidayHrs=[];
                trFormdata.ClientHolidayHrs=[];
                trFormdata.PTOHrs=[];
                trFormdata.WeeklyItemsTotalTime="0";
                trFormdata.OTItemsTotalTime="0";
                trFormdata.WeeklySubTotalHrs=[];
                trFormdata.OTSubTotalHrs=[];
                trFormdata.NonBillableSubTotal=[];
                trFormdata.WeeklySubTotalHrs=[];
                trFormdata.OTSubTotalHrs=[];
                trFormdata.Total=[];
                trFormdata.Status=StatusType.Save;
                trFormdata.CommentsHistoryData=[];
                trFormdata.Comments="";
                trFormdata.SuperviserNames=[];
                trFormdata.Pendingwith="NA";
                trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.BillableSubTotal.push({Type:"Billable Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
                trFormdata.SynergyOfficeHrs.push({Type:"Office Hours",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.ClientHolidayHrs.push({Type:"Holiday",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.PTOHrs.push({Type:"PTO",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
                trFormdata.WeeklySubTotalHrs.push({Type:"Billable",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
                trFormdata.OTSubTotalHrs.push({Type:"OT",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
                trFormdata.Total.push({Type:"Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
                trFormdata.ReportingManagersEmail=[];
                trFormdata.DelegateToEmails=[];
                trFormdata.ReviewersEmail=[];
                trFormdata.NotifiersEmail=[];
                trFormdata.IsClientApprovalNeeded=false;
                trFormdata.IsClientApprovalNeededUI=false;
                trFormdata.Revised=false;
                trFormdata.IsSubmitted=false;
                trFormdata.IsDelegated=false;

                let WeekStartDate=([null,undefined,''].includes(trFormdata.WeekStartDate)?new Date():new Date(trFormdata.WeekStartDate.getMonth()+1+"/"+trFormdata.WeekStartDate.getDate()+"/"+trFormdata.WeekStartDate.getFullYear()));
                let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
                this.WeekHeadings=[];
              
                if(trFormdata.WeekStartDate==null)
                {
                    this.WeekHeadings.push({"Mon":"",
                    "IsMonJoined":true,
                    "IsDay1Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Tue":"",
                    "IsTueJoined":true,
                    "IsDay2Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Wed":"",
                    "IsWedJoined":true,
                    "IsDay3Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Thu":"",
                    "IsThuJoined":true,
                    "IsDay4Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Fri":"",
                    "IsFriJoined":true,
                    "IsDay5Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sat":"",
                    "IsSatJoined":true,
                    "IsDay6Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sun":"",
                    "IsSunJoined":true,
                    "IsDay7Holiday":{isHoliday:false,HolidayName:""},
                    "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    })
                }
                else{
                    this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsMonJoined":WeekStartDate<DateOfjoining,
                    "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsTueJoined":WeekStartDate<DateOfjoining,
                    "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsWedJoined":WeekStartDate<DateOfjoining,
                    "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsThuJoined":WeekStartDate<DateOfjoining,
                    "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsFriJoined":WeekStartDate<DateOfjoining,
                    "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsSatJoined":WeekStartDate<DateOfjoining,
                    "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsSunJoined":WeekStartDate<DateOfjoining,
                    "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    })
                }
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:0,EmployeeEmail:this.state.EmployeeEmail,isSubmitted:false,errorMessage:'',showBillable:false,loading:false});
            }
        this.showApproveAndRejectButton(trFormdata);
        //To remove mandatory-FormContent-focus
        if (trFormdata.ClientName.toLowerCase().includes("synergy")) {
            document.getElementById("0_Description_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_ProjectCode_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_"+this.WeekNames[0].day1+"_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
        }
        document.getElementById("0_Description_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_ProjectCode_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_Description_PTOHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_ProjectCode_PTOHrs").classList.remove('mandatory-FormContent-focus');

     Object.keys(trFormdata.Total[0]).forEach(key =>{
      if(!["Total","Description","ProjectCode","Type"].includes(key))
      document.getElementById("Total"+key).classList.remove('mandatory-FormContent-focus');        
     })
     document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
     document.getElementById("txtComments").classList.remove('mandatory-FormContent-focus');
    }
    private ClearTimesheetControls=(trFormdata)=>{
       
            trFormdata.ClientName="";
            trFormdata.Name==""?trFormdata.Name="":trFormdata.Name=trFormdata.Name;
            trFormdata.WeekStartDate=null;
            trFormdata.WeeklyItemsData=[];
            trFormdata.OTItemsData=[];
            trFormdata.BillableSubTotal=[];
            trFormdata.SynergyOfficeHrs=[];
            trFormdata.SynergyHolidayHrs=[];
            trFormdata.ClientHolidayHrs=[];
            trFormdata.PTOHrs=[];
            trFormdata.WeeklyItemsTotalTime="0";
            trFormdata.OTItemsTotalTime="0";
            trFormdata.WeeklySubTotalHrs=[];
            trFormdata.OTSubTotalHrs=[];
            trFormdata.NonBillableSubTotal=[];
            trFormdata.WeeklySubTotalHrs=[];
            trFormdata.OTSubTotalHrs=[];
            trFormdata.Total=[];
            trFormdata.Status=StatusType.Save;
            trFormdata.CommentsHistoryData=[];
            trFormdata.Comments="";
            trFormdata.SuperviserNames=[];
            trFormdata.Pendingwith="NA";
            trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.BillableSubTotal.push({Type:"Billable Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
            trFormdata.SynergyOfficeHrs.push({Type:"Office Hours",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.ClientHolidayHrs.push({Type:"Holiday",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.PTOHrs.push({Type:"PTO",Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0.00',});
            trFormdata.WeeklySubTotalHrs.push({Type:"Billable",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
            trFormdata.OTSubTotalHrs.push({Type:"OT",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.00',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
            trFormdata.Total.push({Type:"Total",Mon: '0.00',Tue: '0.00',Wed:'0.00',Thu: '0.000',Fri: '0.00',Sat: '0.00',Sun: '0.00',Total: '0.00',});
            trFormdata.ReportingManagersEmail=[];
            trFormdata.DelegateToEMails=[];
            trFormdata.ReviewersEmail=[];
            trFormdata.NotifiersEmail=[];
            trFormdata.IsClientApprovalNeeded=false;
            trFormdata.IsClientApprovalNeededUI=false;
            trFormdata.Revised=false;
            trFormdata.IsSubmitted=false;
            trFormdata.IsDelegated=false;

            let WeekStartDate=([null,undefined,''].includes(trFormdata.WeekStartDate)?new Date():new Date(trFormdata.WeekStartDate.getMonth()+1+"/"+trFormdata.WeekStartDate.getDate()+"/"+trFormdata.WeekStartDate.getFullYear()));
            let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
            this.WeekHeadings=[];
                this.WeekHeadings.push({"Mon":"",
                "IsMonJoined":true,
                "IsDay1Holiday":{isHoliday:false,HolidayName:""},
                "Tue":"",
                "IsTueJoined":true,
                "IsDay2Holiday":{isHoliday:false,HolidayName:""},
                "Wed":"",
                "IsWedJoined":true,
                "IsDay3Holiday":{isHoliday:false,HolidayName:""},
                "Thu":"",
                "IsThuJoined":true,
                "IsDay4Holiday":{isHoliday:false,HolidayName:""},
                "Fri":"",
                "IsFriJoined":true,
                "IsDay5Holiday":{isHoliday:false,HolidayName:""},
                "Sat":"",
                "IsSatJoined":true,
                "IsDay6Holiday":{isHoliday:false,HolidayName:""},
                "Sun":"",
                "IsSunJoined":true,
                "IsDay7Holiday":{isHoliday:false,HolidayName:""},
                })
           
            this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:0,EmployeeEmail:this.state.EmployeeEmail,isSubmitted:true,errorMessage:'',showBillable:false,loading:false});
      
        this.showApproveAndRejectButton(trFormdata);
         //To remove mandatory-FormContent-focus
         if (trFormdata.ClientName.toLowerCase().includes("synergy")) {
            document.getElementById("0_Description_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_ProjectCode_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_"+this.WeekNames[0].day1+"_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
        }
        document.getElementById("0_Description_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_ProjectCode_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_Description_PTOHrs").classList.remove('mandatory-FormContent-focus');
        document.getElementById("0_ProjectCode_PTOHrs").classList.remove('mandatory-FormContent-focus');

     Object.keys(trFormdata.Total[0]).forEach(key =>{
      if(!["Total","Description","ProjectCode","Type"].includes(key))
      document.getElementById("Total"+key).classList.remove('mandatory-FormContent-focus');        
     })
     document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
     document.getElementById("txtComments").classList.remove('mandatory-FormContent-focus');
     document.getElementById("ddlClient").classList.remove('mandatory-FormContent-focus');
     document.getElementById("dateWeeklyTimesheet").classList.remove('mandatory-FormContent-focus');

    }
    private handlefullClose = () => {

        this.setState({ redirect: true,ItemID: 0,showHideModal: false,errorMessage:'',loading: false });
    }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes+this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    //this function is used to hide and show Approve/Reject/Submit/Save/Revoke buttons based on logged in user and current record respective users
    private showApproveAndRejectButton(trFormdata) {
        let value = trFormdata.Status != StatusType.Save ? true : false;
        let userGroups = this.state.UserGoups;
        let userEmail = this.props.spContext.userEmail;
        let isAdmin = false;
        if(userGroups.includes('Timesheet Administrators')){
            isAdmin = true
        }
        //for show/hide of SubmitSave Revoke buttons
        if (userEmail == this.state.EmployeeEmail || isAdmin) {
            let managerApprove= StatusType.ManagerApprove.toString()
            let Approve = StatusType.Approved.toString()
            let submit = StatusType.Submit.toString()
            // if (![Approve, submit].includes(trFormdata.Status)) 
            //     this.setState({ showSubmitSavebtn: true})
            // else
            //     this.setState({ showSubmitSavebtn: false})

            // if ([Approve,submit].includes(trFormdata.Status))
            //     this.setState({showRevokebtn: true })
            // else
            //     this.setState({showRevokebtn:false })
            if (![managerApprove,Approve, submit].includes(trFormdata.Status)) 
                this.setState({ showSubmitSavebtn: true})
            else
                this.setState({ showSubmitSavebtn: false})

            if ([submit].includes(trFormdata.Status))
                this.setState({showRevokebtn: true })
            else
                this.setState({showRevokebtn:false })

            if(isAdmin)  //to show revoke button only for admin if status is Submit/Approved
            {
                if ([Approve, submit].includes(trFormdata.Status))
                    this.setState({showRevokebtn: true })
                else
                   this.setState({showRevokebtn:false })
            }
        }
        else {
            this.setState({ showSubmitSavebtn: false,showRevokebtn:false })
        }
        if(value){
        let RMEmails = trFormdata.ReportingManagersEmail;
        let DelToEmails=trFormdata.DelegateToEmails;
        let RevEmails = trFormdata.ReviewersEmail;
        if(userEmail == this.state.EmployeeEmail){
            value = false;
        }
        if(trFormdata.IsDelegated)
        {
            if (DelToEmails.includes(userEmail)) {
                if (trFormdata.Pendingwith == "Manager") {
                    value = true;
                    this.setState({ showApproveRejectbtn: value,IsReviewer:false })
                    return false;
                }
                else {
                    value = false
                }
            }
        }
        else{
            if (RMEmails.includes(userEmail)) {
                if (trFormdata.Pendingwith == "Manager") {
                    value = true;
                    this.setState({ showApproveRejectbtn: value,IsReviewer:false })
                    return false;
                }
                else {
                    value = false
                }
            }
        }
        if (RevEmails.includes(userEmail)) {
           // if (this.state.trFormdata.Pendingwith == "NA") {
            if (trFormdata.Pendingwith == "Reviewer") {
                value = true;
                this.setState({ showApproveRejectbtn: value,IsReviewer:true })
                return false;
            }
            else {
                value = false
            }
        }
        if(!RMEmails.includes(userEmail)){
            if(!RevEmails.includes(userEmail))
            { if(!DelToEmails.includes(userEmail))
                value = false;
            }       
        }
        this.setState({ showApproveRejectbtn: value,IsReviewer:false  })
        }
       else{
        this.setState({ showApproveRejectbtn: value,IsReviewer:false})  
       }
       
    }
     private userAccessableRecord(trFormdata){
        let currentUserEmail = this.props.spContext.userEmail;
        let userEmail = this.state.EmployeeEmail;
        let NotifiersEmail =trFormdata.NotifiersEmail ;
        let ReviewerEmails =trFormdata.ReviewersEmail;
        let ApproverEmails =trFormdata.ReportingManagersEmail;
        let DelegateToEmails=trFormdata.DelegateToEmails;
        let userGroups = this.state.UserGoups;
        let isAccessable = false;
        if(userEmail.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(ApproverEmails.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(DelegateToEmails.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(ReviewerEmails.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(NotifiersEmail.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(userGroups.includes('Timesheet Administrators')){
            isAccessable = true;
            //this.setState({isSubmitted:true})
        }
        this.setState({isRecordAcessable : isAccessable})
    }
    //function related to custom Validation
    private validateTimeControls(formdata,Action){
        let isValid={status:true,message:''};
         let val;
         let Time;
         var isAllDaysEmpty;
         var weeks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for(let key in formdata.Total[0])
        {
            val=formdata.Total[0][key];
                let DayTime=0;
                if(!["Description","ProjectCode","Total","Type"].includes(key))
                {
                    DayTime=parseFloat(val);
                    if(DayTime>24)
                    {
                         isValid.message="Total working hours in a day must not exceed 24 hours.";
                          isValid.status=false;
                        document.getElementById("Total"+key).focus();
                        document.getElementById("Total"+key).classList.add('mandatory-FormContent-focus');
                          return isValid;
                    } 
                } 
        }
        if(Action=="Submit")
        {
            if(formdata.ClientName.toLowerCase().includes("synergy"))
            {
                if(formdata.SynergyOfficeHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_Description_SynOffcHrs").focus();
                     document.getElementById("0_Description_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.SynergyOfficeHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="Project Code cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_SynOffcHrs").focus();
                     document.getElementById("0_ProjectCode_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 isAllDaysEmpty=true;
                 for( let key in formdata.SynergyOfficeHrs[0]) //validation if entire row Empty of  Synergy Office Hrs 
                 {
                    if(!["Description","ProjectCode","Total","Type"].includes(key))
                    {
                        if(formdata.SynergyOfficeHrs[0][key]!="")
                        {
                            isAllDaysEmpty=false;
                            break;
                        }
                    }
                 }
                 if(isAllDaysEmpty)
                 {
                     isValid.message="Hours cannot be blank, Please provide atleast 0.";
                     isValid.status=false;
                     for (let day of weeks) {
                        let control = document.getElementById("0_" + day + "_SynOffcHrs") as HTMLInputElement;
                        if (!control.disabled) {
                            document.getElementById("0_" + day + "_SynOffcHrs").focus();
                            document.getElementById("0_" + day + "_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                    }
                 }
            }
            else if(!formdata.ClientName.toLowerCase().includes("synergy"))
            {
                  for(let i in formdata.WeeklyItemsData)
                  { 
                     if(formdata.WeeklyItemsData[i].Description.trim()=="" && formdata.IsDescriptionMandatory)
                     {
                         isValid.message="Description cannot be blank.";
                         isValid.status=false;
                         document.getElementById(i+"_Description_weekrow").focus();
                         document.getElementById(i+"_Description_weekrow").classList.add('mandatory-FormContent-focus');
                        return isValid;
                     }
                     else if(formdata.WeeklyItemsData[i].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                     {
                         isValid.message="Project Code cannot be blank.";
                         isValid.status=false;
                         document.getElementById(i+"_ProjectCode_weekrow").focus();
                         document.getElementById(i+"_ProjectCode_weekrow").classList.add('mandatory-FormContent-focus');
                         return isValid;
                     }
                      isAllDaysEmpty=true;
                     for( let key in formdata.WeeklyItemsData[i]) //validation if entire row Empty of Weekly Hrs 
                     {
                        if(!["Description","ProjectCode","Total"].includes(key))
                        {
                            if(formdata.WeeklyItemsData[i][key]!="")
                            {
                                isAllDaysEmpty=false;
                                break;
                            }
                        }
                     }
                      if(isAllDaysEmpty) {
                          isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                          isValid.status = false
                          for (let day of weeks) {
                              let control = document.getElementById(i + "_" + day + "_weekrow") as HTMLInputElement;
                              if (!control.disabled) {
                                  document.getElementById(i + "_" + day + "_weekrow").focus();
                                  document.getElementById(i + "_" + day + "_weekrow").classList.add('mandatory-FormContent-focus');
                                  return isValid;
                              }
                          }
                      }
 
                  }
                  for(let i in formdata.OTItemsData)
                      { 
                         if(formdata.OTItemsData[i].Description.trim()=="" && formdata.IsDescriptionMandatory&&parseFloat(formdata.OTItemsData[i].Total)!=0)
                         {
                             isValid.message="Description cannot be blank.";
                             isValid.status=false;
                             document.getElementById(i+"_Description_otrow").focus();
                             document.getElementById(i+"_Description_otrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                         }
                         else if(formdata.OTItemsData[i].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory&&parseFloat(formdata.OTItemsData[i].Total)!=0)
                         {
                             isValid.message="Project Code cannot be blank.";
                             isValid.status=false;
                             document.getElementById(i+"_ProjectCode_otrow").focus();
                             document.getElementById(i+"_ProjectCode_otrow").classList.add('mandatory-FormContent-focus');
                             return isValid;
                         }
                         if(formdata.OTItemsData.length>1)//validation if entire row Empty of OT Hrs And OT rows greater than 1 
                         {
                            isAllDaysEmpty=true;
                             for (let key in formdata.OTItemsData[i]) {
                                 if (!["Description","ProjectCode","Total"].includes(key)) {
                                     if (formdata.OTItemsData[i][key] != "")
                                     {
                                         isAllDaysEmpty = false;
                                          break;
                                     }
                                 }
                             } 
                             if(isAllDaysEmpty) {
                                 isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                                 isValid.status = false;
                                 for (let day of weeks) {
                                    let control = document.getElementById(i + "_" + day + "_otrow") as HTMLInputElement;
                                    if (!control.disabled) {
                                        document.getElementById(i + "_" + day + "_otrow").focus();
                                        document.getElementById(i + "_" + day + "_otrow").classList.add('mandatory-FormContent-focus');
                                        return isValid;
                                    }
                                }

                             }
                      }
                  }
            if(formdata.ClientName.toLowerCase()!="")
            {
             if(parseFloat(formdata.ClientHolidayHrs[0].Total)!=0)
             {
                 if(formdata.ClientHolidayHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_Description_ClientHldHrs").focus();
                     document.getElementById("0_Description_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.ClientHolidayHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="Project Code cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_ClientHldHrs").focus();
                     document.getElementById("0_ProjectCode_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
             }
             if(parseFloat(formdata.PTOHrs[0].Total)!=0){
                 if(formdata.PTOHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_Description_PTOHrs").focus();
                     document.getElementById("0_Description_PTOHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.PTOHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="Project Code cannot be blank.";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_PTOHrs").focus();
                     document.getElementById("0_ProjectCode_PTOHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
             }
            }
            }
            val=formdata.Total[0].Total;
            Time=parseFloat(val);
            if(Time==0&&formdata.Comments.trim()=="")
            {
             isValid.message="'Comments' required for '0' hours.";
             isValid.status=false;
             document.getElementById("txtComments").focus();
             document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
             return isValid;
            }
           //if isValid true remove all 'mandatory-FormContent-focus' classes
         if (!formdata.ClientName.toLowerCase().includes("synergy")) {
            for (let i in formdata.WeeklyItemsData) {
                document.getElementById(i + "_Description_weekrow").classList.remove('mandatory-FormContent-focus');
                document.getElementById(i + "_ProjectCode_weekrow").classList.remove('mandatory-FormContent-focus');
                document.getElementById(i + "_"+this.WeekNames[0].day1+"_weekrow").classList.remove('mandatory-FormContent-focus');
            }
            for (let i in formdata.OTItemsData) {
                document.getElementById(i + "_Description_otrow").classList.remove('mandatory-FormContent-focus');
                document.getElementById(i + "_ProjectCode_otrow").classList.remove('mandatory-FormContent-focus');
                document.getElementById(i + "_"+this.WeekNames[0].day1+"_otrow").classList.remove('mandatory-FormContent-focus');
            }
        }
        else {
            document.getElementById("0_Description_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_ProjectCode_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
            document.getElementById("0_"+this.WeekNames[0].day1+"_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
        }
              document.getElementById("0_Description_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_ProjectCode_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_Description_PTOHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_ProjectCode_PTOHrs").classList.remove('mandatory-FormContent-focus');

           Object.keys(formdata.Total[0]).forEach(key =>{
            if(!["Total","Description","ProjectCode","Type"].includes(key))
            document.getElementById("Total"+key).classList.remove('mandatory-FormContent-focus');        
           })
           document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
           document.getElementById("txtComments").classList.remove('mandatory-FormContent-focus');
           return isValid;
    }
    return isValid;
}
    //Functions related to HolidayMaster
    private GetHolidayMasterDataByClientName= async (WeekStartDate,selectedClientName,trFormdata)=>
    {
        let Start = addDays(new Date(WeekStartDate), -1);
        let End = addDays(new Date(WeekStartDate), 7);
        let WeekStart = `${Start.getMonth() + 1}/${Start.getDate()}/${Start.getFullYear()}`
        let WeekEnd = `${End.getMonth() + 1}/${End.getDate()}/${End.getFullYear()}`
        let filterQuery="ClientName eq '"+selectedClientName+"' and HolidayDate gt '"+WeekStart+"' and HolidayDate lt '"+WeekEnd+"' and IsActive eq 1";
        let selectQuery="ClientName,HolidayName,HolidayDate,Year,*";
        let HolidaysListData = await sp.web.lists.getByTitle('HolidaysList').items.filter(filterQuery).select(selectQuery).getAll();
        // console.log(HolidaysListData);
        if(HolidaysListData.length>=1)
        {
             let HolidayData=[];
            HolidaysListData.filter(item =>{
                HolidayData.push({"ClientName":item.ClientName,"HolidayName":item.HolidayName,"HolidayDate":item.HolidayDate})
            }); 
            this.setState({HolidaysList:HolidayData})
            let WeekStartDate=new Date(new Date(trFormdata.WeekStartDate).getMonth()+1+"/"+new Date(trFormdata.WeekStartDate).getDate()+"/"+new Date(trFormdata.WeekStartDate).getFullYear());
            let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
            this.WeekHeadings=[];
            this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsMonJoined":WeekStartDate<DateOfjoining,
            "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsTueJoined":WeekStartDate<DateOfjoining,
            "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsWedJoined":WeekStartDate<DateOfjoining,
            "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsThuJoined":WeekStartDate<DateOfjoining,
            "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsFriJoined":WeekStartDate<DateOfjoining,
            "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsSatJoined":WeekStartDate<DateOfjoining,
            "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "IsSunJoined":WeekStartDate<DateOfjoining,
            "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
            "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
            })
        }
        this.setState({trFormdata:trFormdata})
    }
    private  IsHoliday=(CurrentWeekDay,ClientName)=>{
        let HolidayData={isHoliday:false,HolidayName:""};
        let WeekDay=new Date(CurrentWeekDay);
        let Day=WeekDay.getMonth()+1+"/"+WeekDay.getDate()+"/"+WeekDay.getFullYear();
            for(var item of this.state.HolidaysList)
            {
                let Holiday=new Date(item.HolidayDate).getMonth()+1+"/"+new Date(item.HolidayDate).getDate()+"/"+new Date(item.HolidayDate).getFullYear();
                 if(Holiday==Day)
                 {
                    HolidayData.isHoliday=true;
                    HolidayData.HolidayName=item.HolidayName;
                    return HolidayData;
                 }
            }
        return HolidayData;
    }
    //Functions related to dynamic HTML binding
    private dynamicFieldsRow= (rowType) => {
        let NoOfRows;
        let rowId;
        let Obj;
        if(rowType.toLowerCase()=="weekrow")
        {
            NoOfRows=this.state.currentWeeklyRowsCount;
            Obj=this.state.trFormdata.WeeklyItemsData;
            rowId="rowPRJ"
        }
        else
        {
            NoOfRows=this.state.currentOTRowsCount;
            Obj=this.state.trFormdata.OTItemsData;
            rowId="rowOVR"
        }
       
       
        let section = [];
        for(var i=1;i<NoOfRows;i++)
        {
            section.push(<tr id={rowId+(i+1)}>
                <td className=" text-start"> </td>
                <td> 
                    <textarea className="form-control textareaBorder" rows={1} value={Obj[i].Description}  id={i+"_Description_"+rowType}  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                </td>
                <td>      
                    <input className="form-control" value={Obj[i].ProjectCode} id={i+"_ProjectCode_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} type="text"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day1)} value={Obj[i][this.WeekNames[0].day1]} id={i+"_"+this.WeekNames[0].day1+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day2)} value={Obj[i][this.WeekNames[0].day2]} id={i+"_"+this.WeekNames[0].day2+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day3)} value={Obj[i][this.WeekNames[0].day3]} id={i+"_"+this.WeekNames[0].day3+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day4)} value={Obj[i][this.WeekNames[0].day4]} id={i+"_"+this.WeekNames[0].day4+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day5)} value={Obj[i][this.WeekNames[0].day5]} id={i+"_"+this.WeekNames[0].day5+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day6)} value={Obj[i][this.WeekNames[0].day6]} id={i+"_"+this.WeekNames[0].day6+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day7)} value={Obj[i][this.WeekNames[0].day7]} id={i+"_"+this.WeekNames[0].day7+"_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                </td>
                <td>
                {rowType.toLowerCase()=="otrow"?<span className="c-badge">OT</span>:""}
                </td>
                <td>
                    <input className="form-control time WeekTotal" value={Obj[i].Total} id={i+"_Total_"+rowType} onChange={this.changeTime} type="text" maxLength={5} readOnly></input>
                </td>
                <td>
    
                {this.state.showBillable? '' :this.state.isSubmitted? '' : <span className='span-fa-close' title='Delete row' onClick={this.showConfirmDeleteRow} id={i+"_"+rowType} ><FontAwesomeIcon icon={faClose} id={i+"_"+rowType}></FontAwesomeIcon></span> }
                </td>
            </tr>);
        }   
        return section;
    }
    private bindComments=()=>{
        let body=[];
        if(this.state.trFormdata.CommentsHistoryData.length>0)
        {
            var History=this.state.trFormdata.CommentsHistoryData;
            for(let i=History.length-1;i>=0;i--)
            {
            body.push(<tr>
            {/* <td className="" >{History[i]["Role"]}</td> */}
            <td className="" >{History[i]["User"]}</td>
            <td className="" >{History[i]["Action"]}</td>
            <td className="" >{(new Date(History[i]["Date"]).getMonth().toString().length==1?"0"+(new Date(History[i]["Date"]).getMonth()+1):new Date(History[i]["Date"]).getMonth()+1)+"/"+(new Date(History[i]["Date"]).getDate().toString().length==1?"0"+new Date(History[i]["Date"]).getDate():new Date(History[i]["Date"]).getDate())+"/"+new Date(History[i]["Date"]).getFullYear()}  {"  "+new Date(History[i]["Date"]).toLocaleString('en-US', { timeZone: 'America/New_York',hour12:false }).split(",")[1]}</td>
            <td className="" >{History[i]["Comments"]}</td>
        </tr>)
            }
        }
       return body;
    }
   private getWeekstartAndWeekEnd=(formdata)=>
   {
    if(formdata.WeekStartDate!=null)
    {
        let weekstartWeekEnd=''
        let weekStart=new Date(formdata.WeekStartDate);
        let weekEnd=addDays(new Date(weekStart), 6);
        let weekStartArr=weekStart.toDateString().split(" ");
        let weekEndArr=weekEnd.toDateString().split(" ")
        weekstartWeekEnd="      ("+weekStartArr[1]+"-"+weekStartArr[2]+"-"+weekStartArr[3]+" To "+weekEndArr[1]+"-"+weekEndArr[2]+"-"+weekEndArr[3]+" )";
        return weekstartWeekEnd
    }
   }
    //get current week start date based on clients weekstartday
    private getCurrentWeekStartDate =(weekStartDay)=>{
        let weeks = this.state.weeks
        let dayCode = weeks.indexOf(weekStartDay)
        let date = new Date()
        while(date.getDay()!=dayCode){
            date.setDate(date.getDate()-1)
        }
        return date;
    }
    public render() {

        if (!this.state.isRecordAcessable) {
            
            let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            //return (<Navigate to={url} />);
            window.location.href = url;
        }
        if (this.state.redirect) {
            let url = `/Dashboard${this.state.ActionToasterMessage}`
            return (<Navigate to={url} />);
        }
        else{
            return (

                <React.Fragment>
                      <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                      {
                      this.state.ConfirmPopupMessage==""?"":
                      this.state.ConfirmPopupMessage=="Are you sure you want to delete this row?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.RemoveCurrentRow} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>:
                      this.state.ConfirmPopupMessage=="Are you sure you want to submit?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleSubmitorSave} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>:
                      this.state.ConfirmPopupMessage=="Are you sure you want to approve?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleApprove} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>:
                      this.state.ConfirmPopupMessage=="Are you sure you want to reject?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleReject} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm> :
                      this.state.ConfirmPopupMessage=="Are you sure you want to revoke?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleRevoke} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>:""
                       }
            <div id="content" className="content p-2 pt-2">
            <div className="container-fluid">
            <div className='FormContent'>
                <div className="mt-3 mb-1 media-p-1 Billable Hours">
                <div className="title">Weekly Timesheet {this.state.trFormdata.Revised?" -Revised":""}
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    </div>
                    <div className="col-md-12 SynergyAddress">
                    <label className='headerClient'>{this.state.trFormdata.ClientName}</label><span id='weekstartAndweekEnd'>{this.getWeekstartAndWeekEnd(this.state.trFormdata)}</span>
                    </div>
                    <div className="row pt-2 px-4 weeklysection1">
                    {/* new changes start */}
                    {this.state.isAdmin &&this.props.match.params.id==undefined?
                    <div className="col-md-3">
                                <div className="light-text clientName">
                                    <label>Applying for<span className="mandatoryhastrick">*</span></label>
                                    <select className="ddlApplying"  name="Applying" title="Applying for" onChange={this.handleApplyingfor}>
                                            <option value='Self'>Self</option>
                                            <option value='onBehalf'>On Behalf</option>
                                    </select>
                                </div>
                    </div>:''}

                    
                    {this.state.onBehalf?
                    <div className={this.state.isAdmin?"col-md-3":"col-md-4"}>
                                <div className="light-text ">
                                    <label>Employee<span className="mandatoryhastrick">*</span></label>
                                    <select className="ddlEmployee ddlClient" required={true}  name="Employee" title="Employee" onChange={this.handleApplyingfor} ref={this.EmployeeDropdown}>
                                                <option value='-1'>None</option>
                                                {this.state.EmployeesObj.map((option) => (
                                                    <option value={option.ID} selected={this.state.currentUserId==option.ID}>{option.Title}</option>
                                                ))}
                                    </select>
                                </div>
                        </div>:
                    <div className={this.state.isAdmin?"col-md-3":"col-md-4"}>
                                <div className="light-text">
                                    <label>Name</label>
                                    <input className="txtEmployeeName" required={true}  name="Name" title="Name" value={this.state.trFormdata.Name} readOnly />
                                </div>
                        </div>
                    }
                        <div className={this.state.isAdmin?"col-md-3":"col-md-4"}>
                                <div className="light-text clientName">
                                    <label className='lblClient'>Client Name <span className="mandatoryhastrick">*</span></label>
                                    <select className="ddlClient" required={true} id='ddlClient' name="ClientName" title="Client Name" onChange={this.handleClientChange} ref={this.Client} disabled={(this.state.ClientNames.length==1?true:this.currentUser==this.state.trFormdata.Name||this.state.isAdmin?false:true)}>
                                    <option value=''>None</option>
                                        {this.state.ClientNames.map((option) => <option value={option} selected={option == this.state.trFormdata.ClientName}>{option}</option>)}
                                                {/* {this.getClientNames()} */}
                                    </select>
                                </div>
                        </div>

                        <div className={this.state.isAdmin?"col-md-3 divWeeklyStartDate":"col-md-4 divWeeklyStartDate"}>
                                <div className="light-text div-readonly">
                                           
                                            <div className="custom-datepicker" id="divWeekStartDate">
                                                <CustomDatePicker
                                                    handleChange={this.WeekStartDateChange}
                                                    selectedDate={this.state.trFormdata.WeekStartDate}
                                                    className='dateWeeklyTimesheet'
                                                    labelName='Weekly Start Date'
                                                    isDisabled = {(this.currentUser==this.state.trFormdata.Name||this.state.isAdmin?false:true)}
                                                    ref={this.weekStartDate}
                                                    Day={this.WeekNames[0].dayCode}
                                                />
                                            </div>
                                </div>
                        </div>
                    </div>
                    <div className="border-box-shadow light-box table-responsive table-NoScroll">
                        <div className='table-outer'></div>
                        <table className="table table-bordered m-0 timetable table-td-p-0">
                                        <thead style={{ borderBottom: "4px solid #444444" }}>
                                        <tr>
                                        <th className="" ><div className="have-h"></div></th>
                                        <th className=""><div className='th-description'>Description {this.state.trFormdata.IsDescriptionMandatory? <span className="mandatoryhastrick">*</span>:""}</div></th>
                                        <th className="projectCode"><div className='th-Project-Code'>Project Code {this.state.trFormdata.IsProjectCodeMandatory? <span className="mandatoryhastrick">*</span>:""}</div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day1=="Sat"||this.WeekNames[0].day1=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day1} <span className={"day "+(this.WeekNames[0].day1=="Sat"||this.WeekNames[0].day1=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Mon}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day2=="Sat"||this.WeekNames[0].day2=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day2} <span className={"day "+(this.WeekNames[0].day2=="Sat"||this.WeekNames[0].day2=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Tue}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day3=="Sat"||this.WeekNames[0].day3=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day3} <span className={"day "+(this.WeekNames[0].day3=="Sat"||this.WeekNames[0].day3=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Wed}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day4=="Sat"||this.WeekNames[0].day4=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day4} <span className={"day "+(this.WeekNames[0].day4=="Sat"||this.WeekNames[0].day4=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Thu}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day5=="Sat"||this.WeekNames[0].day5=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day5} <span className={"day "+(this.WeekNames[0].day5=="Sat"||this.WeekNames[0].day5=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Fri}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day6=="Sat"||this.WeekNames[0].day6=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day6} <span className={"day "+(this.WeekNames[0].day6=="Sat"||this.WeekNames[0].day6=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Sat}</span></div></th>
            <th><div className={"weekDay "+(this.WeekNames[0].day7=="Sat"||this.WeekNames[0].day7=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day7} <span className={"day "+(this.WeekNames[0].day7=="Sat"||this.WeekNames[0].day7=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Sun}</span></div></th>
                                        <th><div className="px-2"></div></th>
                                        <th className="bc-e1f2ff"><div className='th-total'>Total</div></th>
                                        <th className=""><div className="px-3"></div></th>
                                        </tr>
                                        </thead>
                            <tbody>
                                {this.state.trFormdata.ClientName.toLowerCase().includes("synergy")||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                <tr id="rowPRJ1"  >
                                    <td className=" text-start"> 
                                        <div className="p-1">
                                            <strong>Billable Hours</strong>
                                        </div>
                                    </td>
                                    <td> 
                                        <textarea className="form-control textareaBorder" rows={1}  value={this.state.trFormdata.WeeklyItemsData[0].Description} id="0_Description_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable}  ></textarea>
                                    </td>
                                    <td>      
                                        <input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].ProjectCode}  id="0_ProjectCode_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day1]} id={"0_"+this.WeekNames[0].day1+"_weekrow"}  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day2]} id={"0_"+this.WeekNames[0].day2+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day3]} id={"0_"+this.WeekNames[0].day3+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day4]} id={"0_"+this.WeekNames[0].day4+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day5]} id={"0_"+this.WeekNames[0].day5+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                    </td>
                                    <td>
                                       <input className={"form-control time "+(this.WeekNames[0].day6)}  value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day6]} id={"0_"+this.WeekNames[0].day6+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day7]} id={"0_"+this.WeekNames[0].day7+"_weekrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                    <td>
                                        <input className="form-control time WeekTotal"  value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" onChange={this.changeTime} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                    { this.state.showBillable ? '' :this.state.isSubmitted?'':<span className='span-fa-plus' title='Add new Billable hours row'   onClick={this.CreateWeeklyHrsRow} id='addnewRow'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>}
                                    </td>
                                </tr>}
                                {this.dynamicFieldsRow("weekrow")}
                                {this.state.trFormdata.ClientName.toLowerCase().includes("synergy")||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                <tr id="rowOVR1" className="font-td-bold"  >
                                    <td className=" text-start"> 
                                        <div className="p-1">
                                            <i className="fas fa-user-clock color-gray"></i> Overtime
                                        </div>
                                    </td>
                                    <td>
                                        <textarea className="form-control textareaBorder fw-normal" rows={1} value={this.state.trFormdata.OTItemsData[0].Description} id="0_Description_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                                    </td>
                                    <td>
                                        <input className="form-control" value={this.state.trFormdata.OTItemsData[0].ProjectCode}   id="0_ProjectCode_otrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day1]} id={"0_"+this.WeekNames[0].day1+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day2]} id={"0_"+this.WeekNames[0].day2+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day3]} id={"0_"+this.WeekNames[0].day3+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day4]} id={"0_"+this.WeekNames[0].day4+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day5]} id={"0_"+this.WeekNames[0].day5+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day6]} id={"0_"+this.WeekNames[0].day6+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day7]} id={"0_"+this.WeekNames[0].day7+"_otrow"} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                    </td>
                                    <td>
                                        <span className="c-badge">OT</span>
                                    </td>
                                    <td>
                                        <input className="form-control time WeekTotal" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                    { this.state.showBillable ? '' :this.state.isSubmitted?'':<span className='span-fa-plus' title='Add new OT hours row'   onClick={this.CreateOTHrsRow} id=''><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>}
                                    </td>
                                </tr>}
                                {this.dynamicFieldsRow("otrow")}
                                 {!this.state.trFormdata.ClientName.toLowerCase().includes("synergy")?"":
                                <tr id="SynergyOfficeHrs">
                                    <td className="text-start"><div className="p-1">Office Hours</div></td>
                                    <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.SynergyOfficeHrs[0].Description} onChange={this.changeTime} id="0_Description_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                    <td><input className="form-control" value={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynOffcHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day1+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day2+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day3+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day4+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day5+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day6+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day7+"_SynOffcHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                        </td>
                                    <td><span className="c-badge">O</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} onChange={this.changeTime} id="0_Total_SynOffcHrs" type="text"maxLength={5} readOnly></input></td>
                                    <td></td>
                                </tr>}
                               
                                <tr id="Holiday">
                                    <td className="text-start"><div className="p-1">Holiday</div></td>
                                    <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.ClientHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                    <td><input className="form-control" value={this.state.trFormdata.ClientHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_ClientHldHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)+(this.WeekHeadings[0].IsDay1Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day1+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined||!this.WeekHeadings[0].IsDay1Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)+(this.WeekHeadings[0].IsDay2Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day2+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined||!this.WeekHeadings[0].IsDay2Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)+(this.WeekHeadings[0].IsDay3Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day3+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined||!this.WeekHeadings[0].IsDay3Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)+(this.WeekHeadings[0].IsDay4Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day4+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined||!this.WeekHeadings[0].IsDay4Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)+(this.WeekHeadings[0].IsDay5Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day5+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined||!this.WeekHeadings[0].IsDay5Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)+(this.WeekHeadings[0].IsDay6Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day6+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined||!this.WeekHeadings[0].IsDay6Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)+(this.WeekHeadings[0].IsDay7Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day7+"_ClientHldHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined||!this.WeekHeadings[0].IsDay7Holiday.isHoliday} ></input>
                                        </td>
                                    <td><span className="c-badge">H</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.ClientHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_ClientHldHrs" type="text" maxLength={5} readOnly></input></td>
                                    <td></td>
                                </tr>
                                <tr id="PTOHrs">
                                    {/* <td className="text-start"><div className="p-1">PTO (Paid Time Off)</div></td> */}
                                    <td className="text-start"><div className="p-1">Time Off</div></td>
                                    <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.PTOHrs[0].Description} onChange={this.changeTime} id="0_Description_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable}></textarea></td>
                                    <td><input className="form-control" value={this.state.trFormdata.PTOHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_PTOHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td>
                                            <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day1+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                            </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day2+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day3+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day4+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day5+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day6+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} id={"0_"+this.WeekNames[0].day7+"_PTOHrs"}  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                        </td>
                                    <td><span className="c-badge">TO</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" maxLength={5} readOnly></input></td>
                                    <td></td>
                                </tr>
        
                                 {this.state.trFormdata.ClientName.toLowerCase().includes("synergy")||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                 <tr className="">
                                    <td className="fw-bold text-start">
                                        <div className="p-2 fw-bold">
                                            <i className="fas fa-business-time color-gray"></i> Billable Total
                                        </div>
                                    </td>
                                     <td colSpan={2}>
                                    
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day1} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day1]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day2} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day2]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day3} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day3]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day4} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day4]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day5} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day5]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day6} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day6]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"BillableTotal"+this.WeekNames[0].day7} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day7]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <span className="c-badge">BT</span>
                                    </td>
                                    <td className='fw-bold'>
                                        <input className="form-control fw-bold time BillableSubTotal" id="BillableTotal" value={this.state.trFormdata.BillableSubTotal[0].Total}  type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                </tr>}
                                <tr className="" id="GrandTotalRow">
                                    <td className="fw-bold text-start"> 
                                        <div className="p-2 fw-bold">
                                            <i className="fas fa-business-time color-gray"></i> Grand Total
                                        </div>
                                    </td>
                                    <td colSpan={2}></td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day1]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day1]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day2]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day2]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day3]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day3]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day4]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day4]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td> 
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day5]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day5]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day6]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day6]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id={"Total"+[this.WeekNames[0].day7]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day7]} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td><span className="c-badge">T</span></td>
                                    <td>
                                        <input className="form-control time  GrandTotal" id="GrandTotal" value={this.state.trFormdata.Total[0].Total} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                        <div className="light-box m-1 p-2 pt-3">
                                                    <div className="media-px-12,col-md-9">
                                                        <div className="light-text height-auto">
                                                            <label className="floatingTextarea2 top-11">Comments{this.state.IsReviewer?<span className="mandatoryhastrick">*</span>:""} </label>
                                                            <textarea className="position-static form-control requiredinput" ref={ this.Comments} onChange={this.handleChange} value={this.state.trFormdata.Comments} maxLength={500} id="txtComments" name="Comments"  disabled={false}></textarea>
                                                        </div>
                                                    </div>
                                                    {this.state.IsReviewer?
                                                    <div className="col-md-3">
                                                    <div className="light-text" id='chkIsClientApprovalNeed'>
                                                        <InputCheckBox
                                                        label={"Is Client Approval Needed?"}
                                                        name={"IsClientApprovalNeededUI"}
                                                        checked={this.state.trFormdata.IsClientApprovalNeededUI}
                                                        onChange={this.handleChange}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        />
                                                    </div>
                                                   </div>:""}
                        </div>
                    </div>                       
                    <div className="row">
                        <div className="col-md-12 text-center my-2">
                            {/* {this.state.showApproveRejectbtn&&!this.state.IsReviewer?<button type="button" id="btnApprove" onClick={this.showConfirmApprove} className="SubmitButtons btn">Approve</button>:''} */}
                            {this.state.showApproveRejectbtn?<button type="button" id="btnApprove" onClick={this.showConfirmApprove} className="SubmitButtons btn">Approve</button>:''}
                            {this.state.showApproveRejectbtn?<button type="button" id="btnReject" onClick={this.showConfirmReject}  className="RejectButtons btn">Reject</button>:''}
                            {this.state.showRevokebtn?<button type="button" id="btnRevoke" onClick={this.showConfirmRevoke} className="txt-white CancelButtons bc-burgundy btn">Revoke</button>:''}
                            {!this.state.isSubmitted&&this.state.showSubmitSavebtn?<button type="button" id="btnSave" onClick={this.handleSubmitorSave} className="SaveButtons btn">Save</button>:''}
                            {!this.state.isSubmitted&&this.state.showSubmitSavebtn? <button type="button" id="btnSubmit" onClick={this.showConfirmSubmit} className="SubmitButtons btn">Submit</button>:''}
                            <button type="button" id="btnCancel" onClick={this.handleCancel} className="CancelButtons btn">Cancel</button>
                        </div>
                        
                    </div>

                       {this.state.trFormdata.CommentsHistoryData.length>0? <><div className="p-2">
                                            <h4>History</h4>
                                        </div><div>
                                                <table className="table table-bordered m-0 timetable">
                                                    <thead style={{ borderBottom: "4px solid #444444" }}>
                                                        <tr>
                                                            {/* <th className="">Action By</th> */}
                                                            <th className="" style={{width:'250px'}}>Action By</th>
                                                            <th className="" style={{width:'150px'}}>Status</th>
                                                            <th className="" style={{width:'250px'}}>Date & Time (EST)</th>
                                                            <th className="">Comments</th>
                                                          
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {this.bindComments()}

                                                    </tbody>
                                                </table>
                                            </div></>:""
                               }
                </div>
            </div>
        </div>
        {this.state.showToaster &&<Toaster />}  
            {this.state.loading && <Loader />}
                </React.Fragment>
            );
        } 
    }
}
export default WeeklyTimesheet;