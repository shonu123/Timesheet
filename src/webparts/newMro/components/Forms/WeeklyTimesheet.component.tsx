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
        OTItemsTotalTime:string,
        SuperviserIds:any,
        ReviewerIds:any,
        NotifierIds:any,
        DateOfJoining:Date,
        IsDescriptionMandatory:boolean,
        IsProjectCodeMandatory:boolean,
        WeekStartDay:string,
        HolidayType:string,

        ReportingManagersEmail:any,
        ReviewersEmail:any,
        NotifiersEmail:any,
        IsClientApprovalNeeded:boolean,
        Revised:boolean,
        IsSubmitted:boolean

    };
    ClientNames:any;
    Clients_DateOfJoinings:any,
    HolidaysList:any,
    SynergyHolidaysList:any,
    SuperviserNames:any;
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
    IsReviewer:boolean;
    isRecordAcessable:boolean;
    UserGoups : any;
    showConfirmDeletePopup:boolean;
    ConfirmPopupMessage:string;
    ActionToasterMessage:string;
    ActionButtonId:any;
    RowType:string;
    rowCount:string;
    // new changes by Sri
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
    // new changes
    private EmployeeDropdown;
    //end
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
        //new
        this.EmployeeDropdown = React.createRef();
        //end

        this.state = {
          
            trFormdata: {
                ClientName: '',
                Name: this.currentUser,
                // WeekStartDate:this.GetCurrentWeekMonday(new Date()),
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
                WeeklyItemsTotalTime:'',
                OTItemsTotalTime:'',
                SuperviserIds:[],
                ReviewerIds:[],
                NotifierIds:[],
                DateOfJoining:new Date(),
                IsDescriptionMandatory:false,
                IsProjectCodeMandatory:false,
                WeekStartDay:'',
                HolidayType:'',

                ReportingManagersEmail:[],
                ReviewersEmail:[],
                NotifiersEmail:[],
                IsClientApprovalNeeded:false,
                Revised:false,
                IsSubmitted:false
            },
            ClientNames:[],
            Clients_DateOfJoinings:[],
            HolidaysList:[],
            SynergyHolidaysList:[],
            SuperviserNames:[],
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
            ConfirmPopupMessage:'',
            ActionToasterMessage:"",
            ActionButtonId:'',
            IsReviewer:false,
            isRecordAcessable: true,
            UserGoups: [],
            showConfirmDeletePopup:false,
            RowType:"",
            rowCount:"",
            // new changes by Sri
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
         trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.BillableSubTotal.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
         trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.ClientHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
         trFormdata.Total.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
        
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
            this.oweb.lists.getByTitle('Client').items.filter("IsActive eq 1").select("Title,*").orderBy("Title",true).getAll(),
            sp.web.currentUser.groups()
        ]);
        console.log("current user deatils")
        console.log(this.props.context.pageContext)
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
                this.setState({isAdmin:true,isSubmitted: true})
            }
        }
        console.log(ClientNames);
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
                this.state.ClientNames.push(employeeItem.ClientName)
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
         this.GetHolidayMasterDataByClientName( trFormdata.WeekStartDate,trFormdata.HolidayType,trFormdata);
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
        this.setState({UserGoups:userGroups,trFormdata,ClientNames: this.state.ClientNames,EmployeeEmail:this.state.EmployeeEmail,showToaster: true});
        if(this.state.ClientNames.length==1){
            trFormdata.ClientName=ClientNames[0].ClientName;
            this.handleClientChange(ClientNames[0].ClientName);
        }
        
    }
    private async getItemData(TimesheetID){
        //this.setState({loading:true});
        var ClientNames: any;
        let filterQuery = "ID eq '"+TimesheetID+"'";
        let selectQuery = "Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*";
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand("Initiator,Reviewers,ReportingManager,Notifiers").get();
        console.log(data);
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
        trFormdata.NonBillableSubTotal=JSON.parse(data[0].NonBillableSubTotalHrs);
        trFormdata.Total=JSON.parse(data[0].TotalHrs);
        trFormdata.Status=data[0].Status;
        trFormdata.CommentsHistoryData=JSON.parse(data[0].CommentsHistory);
        trFormdata.SuperviserNames=JSON.parse(data[0].SuperviserName);
        trFormdata.Pendingwith=data[0].PendingWith;
        trFormdata.IsClientApprovalNeeded=data[0].IsClientApprovalNeed;
        trFormdata.Revised=data[0].Revised;
        trFormdata.IsSubmitted=data[0].IsSubmitted;
        let EmpEmail=[];
        let RMEmail=[];
        let ReviewEmail=[];
        let NotifyEmail=[];
        EmpEmail.push(data[0].Initiator.EMail);
        if(data[0].hasOwnProperty("ReportingManager"))   
        data[0].ReportingManager.map(i=>(RMEmail.push(i.EMail)));
        if(data[0].hasOwnProperty("Reviewers"))        
        data[0].Reviewers.map(i=>(ReviewEmail.push(i.EMail)));
        if(data[0].hasOwnProperty("Notifiers")) 
        data[0].Notifiers.map(i=>(NotifyEmail.push(i.EMail)));
        if( trFormdata.CommentsHistoryData==null)
        trFormdata.CommentsHistoryData=[];
       
        trFormdata.ReportingManagersEmail=RMEmail;
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
        if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(data[0].Status))
        {
            this.setState({isSubmitted:true});
        }
        else if([StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.Save,StatusType.Revoke].includes(data[0].Status))
        {
            this.setState({isSubmitted:false});
        }
        if([StatusType.ReviewerReject].includes(data[0].Status))
        {
            if(data[0].IsClientApprovalNeed)
            this.setState({showBillable:false})
            else
            this.setState({showBillable:true})
        }
        //For getting Dateofjoining,DescriptionMandatory,ProjectCOde Mandatory,WeekStartday of selected client
        //   for( var item of this.state.Clients_DateOfJoinings)
        //   {
        //       if(item.ClientName.toLowerCase()==data[0].ClientName.toLowerCase())
        //       {
        //           trFormdata.DateOfJoining=new Date(item.DOJ);
        //           trFormdata.IsDescriptionMandatory=item.IsDescriptionMandatory;
        //           trFormdata.IsProjectCodeMandatory=item.IsProjectCodeMandatory;
        //           trFormdata.WeekStartDay=item.WeekStartDay;
        //           trFormdata.HolidayType=item.HolidayType;
        //           break;
        //       }
        //   }
        // this.GetHolidayMasterDataByClientName( trFormdata.WeekStartDate,trFormdata.HolidayType,trFormdata);
        // let WeekStartDate=new Date(new Date(data[0].WeekStartDate).getMonth()+1+"/"+new Date(data[0].WeekStartDate).getDate()+"/"+new Date(data[0].WeekStartDate).getFullYear());
        // let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
        // this.WeekHeadings=[];
        // this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsMonJoined":WeekStartDate<DateOfjoining,
        // "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsTueJoined":WeekStartDate<DateOfjoining,
        // "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsWedJoined":WeekStartDate<DateOfjoining,
        // "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsThuJoined":WeekStartDate<DateOfjoining,
        // "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsFriJoined":WeekStartDate<DateOfjoining,
        // "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsSatJoined":WeekStartDate<DateOfjoining,
        // "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        // "IsSunJoined":WeekStartDate<DateOfjoining,
        // "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
        // "IsDay7SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
        // })
        let groups = await sp.web.currentUser.groups();
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        this.setState({UserGoups:userGroups})

        this.showApproveAndRejectButton();
        this.userAccessableRecord();

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
        console.log(this.state);
       
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
        console.log(this.state);
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
        let Rowhrs=0;
        let RowMins=0;
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

              //Rowhrs=Math.floor(TotalRowMins/60);
              //RowMins=Math.floor(TotalRowMins%60);
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

            //Rowhrs=Math.floor(TotalRowMins/60);
            //RowMins=Math.floor(TotalRowMins%60);
              trFormdata.OTItemsData[index]["Total"]=TotalRowMins.toFixed(2);
            }
            else if(rowType=="SynOffcHrs")
            {
                trFormdata.SynergyOfficeHrs[index][prop]=value.toString();
                this.setState({ trFormdata});
                  Object.keys(trFormdata.SynergyOfficeHrs[index]).forEach(key =>{
                    let val=trFormdata.SynergyOfficeHrs[index][key].toString();
                    [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                    if(!["Description","ProjectCode","Total"].includes(key))
                    {
                        TotalRowMins=TotalRowMins+(parseFloat(val)); 
                    }
                  })
    
                  //Rowhrs=Math.floor(TotalRowMins/60);
                 // RowMins=Math.floor(TotalRowMins%60);
                  trFormdata.SynergyOfficeHrs[index]["Total"]=TotalRowMins.toFixed(2);
            }
            else if(rowType=="SynHldHrs")
           {
            trFormdata.SynergyHolidayHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.SynergyHolidayHrs[index]).forEach(key =>{
                let val=trFormdata.SynergyHolidayHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  value;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })

              //Rowhrs=Math.floor(TotalRowMins/60);
              //RowMins=Math.floor(TotalRowMins%60);
              trFormdata.SynergyHolidayHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
           else if(rowType=="ClientHldHrs")
           {
            trFormdata.ClientHolidayHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.ClientHolidayHrs[index]).forEach(key =>{
                let val=trFormdata.ClientHolidayHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })

              //Rowhrs=Math.floor(TotalRowMins/60);
              //RowMins=Math.floor(TotalRowMins%60);
              trFormdata.ClientHolidayHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
            else if(rowType=="PTOHrs")
          {
            trFormdata.PTOHrs[index][prop]=value.toString();
            this.setState({ trFormdata});
              Object.keys(trFormdata.PTOHrs[index]).forEach(key =>{
                let val=trFormdata.PTOHrs[index][key].toString();
                [undefined,null,"","."].includes(val.trim())? val="0" :  val;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseFloat(val)); 
                }
              })

              //Rowhrs=Math.floor(TotalRowMins/60);
              //RowMins=Math.floor(TotalRowMins%60);
              trFormdata.PTOHrs[index]["Total"]=TotalRowMins.toFixed(2);
           }
           this.setState({ trFormdata});
           //FOR COLUMN WISE CALCULATION
           let WeeklyTotal=0;
           let WeeklyColHrs=0;
           let WeeklyColMins=0;
           let [Total,TotalColHrs,TotalColMins]=[0,0,0];
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
            let H=Math.floor(WeekTotal/60);
            let M=Math.floor(WeekTotal%60);
            //trFormdata.WeeklyItemsTotalTime=(H.toString().length==1?"0"+H:H)+"."+(M.toString().length==1?"0"+M:M);
            trFormdata.WeeklyItemsTotalTime=WeeklyTotal.toFixed(2).toString();
            // to iterate OT hrs
              H=0;
              M=0;
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
             //H=Math.floor(OTTotal/60);
             //M=Math.floor(OTTotal%60);
            trFormdata.OTItemsTotalTime=OTTotal.toFixed(2).toString();

            //WeeklyColHrs=Math.floor(WeeklyTotal/60);
            //WeeklyColMins=Math.floor(WeeklyTotal%60);
            //TotalColHrs=Math.floor(Total/60);
            //TotalColMins=Math.floor(Total%60);
            if(!["Description","ProjectCode"].includes(prop))
            trFormdata.BillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
            trFormdata.BillableSubTotal[0]["Total"]=Total.toFixed(2).toString();

             // NON BILLABLE SUBTOTAL COLUMN WISE
             WeeklyTotal=0;
             WeeklyColHrs=0;
             WeeklyColMins=0;
            [Total,TotalColHrs,TotalColMins]=[0,0,0];
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

            // WeeklyColHrs=Math.floor(WeeklyTotal/60);
             //WeeklyColMins=Math.floor(WeeklyTotal%60);
             //TotalColHrs=Math.floor(Total/60);
             //TotalColMins=Math.floor(Total%60);
             if(!["Description","ProjectCode"].includes(prop))
             trFormdata.NonBillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
             trFormdata.NonBillableSubTotal[0]["Total"]=Total.toFixed(2).toString();

             //GRAND TOTAL COLUMN WISE
             WeeklyTotal=0;
             WeeklyColHrs=0;
             WeeklyColMins=0;
             [Total,TotalColHrs,TotalColMins]=[0,0,0];
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
             
             //WeeklyColHrs=Math.floor(WeeklyTotal/60);
             //WeeklyColMins=Math.floor(WeeklyTotal%60);
             //TotalColHrs=Math.floor(Total/60);
             //TotalColMins=Math.floor(Total%60);
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
        let TableColumns=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
          //FOR COLUMN WISE CALCULATION
       
        for(var prop of TableColumns)
        {
            let [Total,TotalColHrs,TotalColMins]=[0,0,0];
            let [WeeklyTotal,WeeklyColHrs,WeeklyColMins]=[0,0,0];
            if(RowType.toLowerCase()=="weekrow")  //When Weekly items removed 
            {

                        //BILLABLE SUB TOTAL COLUMN WISE
                        // to iterate Weekly hrs
                        for(var item of DataAfterRemovedObject)
                        {
                            //For weekly calculation
                            let val=item[prop].toString(); 
                            [undefined,null,"","."].includes(val)? val="0" : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val));
                            //For total calculation
                            let TotalVal=item.Total.toString();
                            [undefined,null,"","."].includes(TotalVal)? TotalVal="0"  : TotalVal;
                            Total= Total+( parseFloat(TotalVal));
                           
                        }
                        for(var item of trFormdata.OTItemsData)
                        {
                            //For weekly calculation
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0"  :  val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                            //For total calculation
                            let TotalVal=item.Total.toString();
                            [undefined,null,"","."].includes(TotalVal)? TotalVal="0"  : TotalVal;
                            Total= Total+( parseFloat(TotalVal));
                        }
            }
            else{      //When OT items removed 
                
                        //BILLABLE SUB TOTAL COLUMN WISE
                        // to iterate Weekly hrs
                        for(var item of trFormdata.WeeklyItemsData)
                        {
                            //For weekly calculation
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0" : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val));
                            //For total calculation
                            let TotalVal=item.Total.toString();
                            [undefined,null,"","."].includes(TotalVal)? TotalVal="0" : TotalVal;
                            Total= Total+( parseFloat(TotalVal));
                           
                        }
                      
                        for(var item of DataAfterRemovedObject)
                        {
                            //For weekly calculation
                            let val=item[prop].toString();
                            [undefined,null,"","."].includes(val)? val="0"  : val;
                            WeeklyTotal=WeeklyTotal+( parseFloat(val)); 
                            //For total calculation
                            let TotalVal=item.Total.toString();
                            [undefined,null,"","."].includes(TotalVal)? TotalVal="0" : TotalVal;
                            Total= Total+( parseFloat(TotalVal));
                           
                        }

            }
                       // WeeklyColHrs=Math.floor(WeeklyTotal/60);
                       // WeeklyColMins=Math.floor(WeeklyTotal%60);
                       // TotalColHrs=Math.floor(Total/60);
                        //TotalColMins=Math.floor(Total%60);

                        trFormdata.BillableSubTotal[0][prop]=WeeklyTotal.toFixed(2).toString();
                        trFormdata.BillableSubTotal[0]["Total"]=Total.toFixed(2).toString();

                        //GRAND TOTAL COLUMN WISE
                        WeeklyTotal=0;
                        WeeklyColHrs=0;
                        WeeklyColMins=0;
                        [Total,TotalColHrs,TotalColMins]=[0,0,0];
                        let TotalColVal=trFormdata.BillableSubTotal[0][prop].toString();
                        [undefined,null,"","."].includes(TotalColVal)? TotalColVal="0" : TotalColVal;
                        let BillableTotalVal=trFormdata.BillableSubTotal[0]["Total"].toString();
                        [undefined,null,"","."].includes(BillableTotalVal)? BillableTotalVal="0"  : BillableTotalVal;
                        WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal)); 
                        Total=Total+( parseFloat(BillableTotalVal)); 

                        TotalColVal=trFormdata.NonBillableSubTotal[0][prop].toString();
                        [undefined,null,"","."].includes(TotalColVal)? TotalColVal="0"  : TotalColVal;
                        BillableTotalVal=trFormdata.NonBillableSubTotal[0]["Total"].toString();
                        [undefined,null,"","."].includes(BillableTotalVal)? BillableTotalVal="0"  : BillableTotalVal;
                        WeeklyTotal=WeeklyTotal+( parseFloat(TotalColVal));
                        Total=Total+( parseFloat(BillableTotalVal)); 
                        
                        //WeeklyColHrs=Math.floor(WeeklyTotal/60);
                        //WeeklyColMins=Math.floor(WeeklyTotal%60);
                        //TotalColHrs=Math.floor(Total/60);
                        //TotalColMins=Math.floor(Total%60);
                        trFormdata.Total[0][prop]=WeeklyTotal.toFixed(2).toString();
                        trFormdata.Total[0]["Total"]=Total.toFixed(2).toString();

                       // this.setState({ trFormdata});  
                      
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
                isValid.message="Total working hours in a week can not be blank";
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
            let newObj={Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0'};
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
                isValid.message="Total working hours in a week can not be blank";
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
          let newObj={Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0'};
  
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
         let TypeofRow = event.target.id.split("_")[1];
         let  CountOfRow = event.target.id.split("_")[0];
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
        let data = {
            Comments:{val:this.state.trFormdata.Comments,required:true, Name: 'Comments', Type: ControlType.string, Focusid:this.Comments},
        };
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
        this.setState({showConfirmDeletePopup:true,ConfirmPopupMessage:'Are you sure you want to reject?',ActionButtonId:event.target.id});
        }
        else
        {
        customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
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
            console.log(this.state);
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
                ReportingManagerId:{"results":formdata.SuperviserIds},
                ReviewersId:{"results":formdata.ReviewerIds},
                NotifiersId:{"results":formdata.NotifierIds},
               IsClientApprovalNeed:formdata.IsClientApprovalNeeded,
               Revised:formdata.Revised
            }
            if(Action.toLowerCase()=="btnsave")
            {
                    postObject['Status']=StatusType.Save;
                    postObject['PendingWith']="Initiator";
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
                   }
                   else
                   {
                       if(formdata.IsClientApprovalNeeded)
                       {
                           postObject['Status']=StatusType.Submit;
                           postObject['PendingWith']="Manager";
                           postObject['DateSubmitted']=new Date();
                       }
                       else{
                        if(StatusType.Save==formdata.Status||StatusType.Revoke==formdata.Status||StatusType.ManagerReject==formdata.Status)
                         {
                            postObject['Status']=StatusType.Submit;
                            postObject['PendingWith']="Manager";
                            postObject['DateSubmitted']=new Date();
                         }
                         else if(StatusType.ReviewerReject==formdata.Status){
                             postObject['Status']=StatusType.Approved;
                             postObject['PendingWith']="NA";
                             postObject['DateSubmitted']=new Date();
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
    private GetRequiredEmails=(ClentName,formdata)=>{
        let clientVal=ClentName;
        const Formdata =formdata;
            Formdata.ClientName=clientVal;
            Formdata.SuperviserNames=[];
            Formdata.SuperviserIds=[];
            Formdata.ReviewerIds=[];
            Formdata.NotifierIds=[];
            let RMEmail=[];
            let ReviewEmail=[];
            let NotifyEmail=[];
        console.log(this.state);
        for( var item of this.state.SuperviserNames)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.SuperviserNames.push(item.ReportingManager);
                Formdata.SuperviserIds.push(item.ReportingManagerId);
                RMEmail.push(item.ReportingManagerEmail)
            }
        }
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
        Formdata.ReviewEmail=ReviewEmail;
        Formdata.NotifierEmail=NotifyEmail;
        return Formdata;
     }
     private Calculate_Indvidual_OT_Weekly_TotalTime=(Formdata)=>{
        const formdata =Formdata;
         //Weekly  and OT total Hrs calculation

         let [WeekTotal,OTTotal]=[0,0];
         let [H,M]=[0,0];
         // to iterate Weekly items
         for(var item of formdata.WeeklyItemsData)
         {
             let TotalVal=item.Total.toString();
             WeekTotal= WeekTotal+( parseFloat(TotalVal));
         }
          //H=Math.floor(WeekTotal/60);
          //M=Math.floor(WeekTotal%60);
          formdata.WeeklyItemsTotalTime=WeekTotal.toFixed(2).toString();
             // to iterate OT hrs
             H=0;
             M=0;
         for(var item of formdata.OTItemsData)
         {
             let TotalVal=item.Total.toString()
             OTTotal= OTTotal+( parseFloat(TotalVal));
         } 
         //H=Math.floor(OTTotal/60);
         //M=Math.floor(OTTotal%60);
         formdata.OTItemsTotalTime=OTTotal.toFixed(2).toString();

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
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Manager","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.Approved;
                postObject['PendingWith']="NA";
                break;
            case StatusType.InProgress:
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Reviewer","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
               
                postObject['Status']=StatusType.Approved;
                postObject['PendingWith']="NA";
                break;
        }
             postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
    }
    private handleRevoke=async ()=>
    {
        var formdata = { ...this.state.trFormdata };
        formdata=this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
        var postObject={};
        let user = "Initiator";
        user = this.state.EmployeeEmail!=this.props.spContext.userEmail?"Administator":user;
                formdata.CommentsHistoryData.push({"Action":StatusType.Revoke,"Role":user,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.Revoke;
                postObject['PendingWith']="Initiator";
                if(formdata.Status==StatusType.Approved)
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
                formdata.CommentsHistoryData.push({"Action":StatusType.Reject,"Role":"Manager","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.ManagerReject;
            }
            else if(formdata.Status==StatusType.Approved){
                formdata.CommentsHistoryData.push({"Action":StatusType.Reject,"Role":"Reviewer","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date().toISOString()})
                postObject['Status']=StatusType.ReviewerReject;
                postObject['Revised']=true;
            }
            postObject['PendingWith']="Initiator";
            postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            postObject['IsClientApprovalNeed']=formdata.IsClientApprovalNeeded;
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
        let tableContent = {'Name':this.state.trFormdata.Name,'Client':this.state.trFormdata.ClientName,'Submitted Date':`${this.state.trFormdata.DateSubmitted.getMonth() + 1}/${this.state.trFormdata.DateSubmitted.getDate()}/${this.state.trFormdata.DateSubmitted.getFullYear()}`,'Billable Hours':formObject.WeeklyItemsTotalTime,'OT Hours':formObject.OTItemsTotalTime,'Total Billable Hours':this.state.trFormdata.BillableSubTotal[0].Total,'Total Non-Billable Hours':this.state.trFormdata.NonBillableSubTotal[0].Total,'Total Hours':this.state.trFormdata.Total[0].Total}
        let sub='';
        let emaildetails={};
        let CC=[];
        if (this.state.ItemID!=0) { //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then((res) => {
               if(StatusType.Save==formdata.Status)
               {
                //this.setState({loading:false})
                customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet saved successfully',2000)
                this.getItemData(this.state.ItemID);
               }
               else if(StatusType.Revoke==formdata.Status)
               {
                let To=[];
             
                    for(const mail of formObject.ReportingManagersEmail)
                    {
                        To.push(mail);
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
               }
               else if(StatusType.Submit==formdata.Status)
               {
                    sub="Weekly Time Sheet has been "+formdata.Status+"."
                    emaildetails ={toemail:formObject.ReportingManagersEmail,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                    var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                    this.sendemail(emaildetails,formdata.Status);
               }
               else if(StatusType.Save==formObject.Status)  //save after submit case.
            {
                 sub="Weekly Time Sheet has been "+StatusType.Submit+"."
                 emaildetails ={toemail:formObject.ReportingManagersEmail,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                 var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                 emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                 this.sendemail(emaildetails,StatusType.Submit);
               }
              else if(StatusType.ReviewerReject==formObject.Status) //Reviewer rejected but client Approval not needed or not depends on IsClientApprovalNeeded
            {
                sub="Weekly Time Sheet has been "+StatusType.Submit+"."
                CC=this.state.EmployeeEmail;
                if(formObject.IsClientApprovalNeeded)
                {
                    for(const mail of formObject.ReportingManagersEmail)
                    {
                        CC.push(mail);
                    }
                }
               
               for(const mail of formObject.ReviewersEmail)
               {
                   CC.push(mail);
               }
               emaildetails ={toemail:this.state.EmployeeEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
               var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
               emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
               this.sendemail(emaildetails,StatusType.Submit);
              }
               else if(StatusType.Approved==formdata.Status)
               {
                    sub="Weekly Time Sheet has been approved by Manager."
                    CC=this.state.EmployeeEmail;
                    for(const mail of formObject.ReportingManagersEmail)
                    {
                        CC.push(mail);
                    }
                    for(const mail of formObject.ReviewersEmail)
                    {
                        CC.push(mail);
                    }
                    emaildetails ={toemail:this.state.EmployeeEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
                    var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                    this.sendemail(emaildetails,formdata.Status);
               }
               else if([StatusType.ManagerReject,StatusType.ReviewerReject].includes(formdata.Status))
               {
                sub="Weekly Time Sheet has been "+formdata.Status+". Please re-submit with necessary details."
                        CC=this.state.EmployeeEmail;
                        if(formObject.IsClientApprovalNeeded)
                        {
                            for(const mail of formObject.ReportingManagersEmail)
                            {
                                CC.push(mail);
                            }
                        }
                       
                       for(const mail of formObject.ReviewersEmail)
                       {
                           CC.push(mail);
                       }
                    //    for(const mail of this.state.NotifiersEmail)
                    //    {
                    //        CC.push(mail);
                    //    }
                       emaildetails ={toemail:this.state.EmployeeEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
                       var DashboardURl = 'https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/TimeSheet.aspx';
                       emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName,DashboardURl);
                       this.sendemail(emaildetails,formdata.Status);
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
                    // this.props.match.params.id =ItemID;
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
         let selectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*"
         let filterQuery2 = " and ClientName eq '" + ClientName + "' and Initiator/ID eq '" + this.state.currentUserId + "'"
         filterQuery += filterQuery2;
          ExistRecordData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).select(selectQuery).expand('Initiator,Reviewers,ReportingManager,Notifiers').get();
         console.log(ExistRecordData);
        }
        //const trFormdata= this.state.trFormdata;
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
                trFormdata.NonBillableSubTotal=JSON.parse(ExistRecordData[0].NonBillableSubTotalHrs);
                trFormdata.Total=JSON.parse(ExistRecordData[0].TotalHrs);
                trFormdata.Status=ExistRecordData[0].Status;
                trFormdata.CommentsHistoryData=JSON.parse(ExistRecordData[0].CommentsHistory);
                trFormdata.SuperviserNames=JSON.parse(ExistRecordData[0].SuperviserName);
                trFormdata.Pendingwith=ExistRecordData[0].PendingWith;
                trFormdata.IsClientApprovalNeeded=ExistRecordData[0].IsClientApprovalNeed;
                trFormdata.Revised=ExistRecordData[0].Revised;
                trFormdata.IsSubmitted=ExistRecordData[0].IsSubmitted;
                let EmpEmail=[];
                let RMEmail=[];
                let ReviewEmail=[];
                let NotifyEmail=[];
                EmpEmail.push(ExistRecordData[0].Initiator.EMail); 
                if(ExistRecordData[0].hasOwnProperty("ReportingManager"))   
                ExistRecordData[0].ReportingManager.map(i=>(RMEmail.push(i.EMail)));
                if(ExistRecordData[0].hasOwnProperty("Reviewers"))        
                ExistRecordData[0].Reviewers.map(i=>(ReviewEmail.push(i.EMail)));
                if(ExistRecordData[0].hasOwnProperty("Notifiers"))  
                ExistRecordData[0].Notifiers.map(i=>(NotifyEmail.push(i.EMail)));
                if( trFormdata.CommentsHistoryData==null)
                trFormdata.CommentsHistoryData=[];
               
                trFormdata.ReportingManagersEmail=RMEmail;
                trFormdata.ReviewersEmail=ReviewEmail;
                trFormdata.NotifiersEmail=NotifyEmail;
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:ExistRecordData[0].ID,EmployeeEmail:EmpEmail,errorMessage:'',loading:false,showBillable : false, showNonBillable: false});
                if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:true});
                }
                else if([StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.Save,StatusType.Revoke].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:false});
                }
                if([StatusType.ReviewerReject].includes(ExistRecordData[0].Status))
                {
                    if(ExistRecordData[0].IsClientApprovalNeed)
                    this.setState({showBillable:false})
                    else
                    this.setState({showBillable:true})
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
                trFormdata.NonBillableSubTotal=[];
                trFormdata.Total=[];
                trFormdata.Status=StatusType.Save;
                trFormdata.CommentsHistoryData=[];
                trFormdata.SuperviserNames=[];
                trFormdata.Pendingwith="NA";
                trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.BillableSubTotal.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
                trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.ClientHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
                trFormdata.Total.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
                trFormdata.ReportingManagersEmail=[];
                trFormdata.ReviewersEmail=[];
                trFormdata.NotifiersEmail=[];
                trFormdata.IsClientApprovalNeeded=false;
                trFormdata.Revised=false;
                trFormdata.IsSubmitted=false;

                let WeekStartDate=([null,undefined,''].includes(trFormdata.WeekStartDate)?new Date():new Date(trFormdata.WeekStartDate.getMonth()+1+"/"+trFormdata.WeekStartDate.getDate()+"/"+trFormdata.WeekStartDate.getFullYear()));
                let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
                this.WeekHeadings=[];
              
                if(trFormdata.WeekStartDate==null)
                {
                    this.WeekHeadings.push({"Mon":"",
                    "IsMonJoined":true,
                    "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay1SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Tue":"",
                    "IsTueJoined":true,
                    "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay2SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Wed":"",
                    "IsWedJoined":true,
                    "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay3SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Thu":"",
                    "IsThuJoined":true,
                    "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay4SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Fri":"",
                    "IsFriJoined":true,
                    "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay5SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sat":"",
                    "IsSatJoined":true,
                    "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                    "IsDay6SynergyHoliday":this.IsHoliday(WeekStartDate,"synergy"),
                    "Sun":"",
                    "IsSunJoined":true,
                    "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
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
            this.showApproveAndRejectButton()
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
            trFormdata.NonBillableSubTotal=[];
            trFormdata.Total=[];
            trFormdata.Status=StatusType.Save;
            trFormdata.CommentsHistoryData=[];
            trFormdata.SuperviserNames=[];
            trFormdata.Pendingwith="NA";
            trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.BillableSubTotal.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
            trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.ClientHolidayHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.NonBillableSubTotal.push({Mon: '',Tue: '',Wed:'',Thu: '',Fri: '',Sat: '',Sun: '',Total: '0',});
            trFormdata.Total.push({Mon: '0',Tue: '0',Wed:'0',Thu: '0',Fri: '0',Sat: '0',Sun: '0',Total: '0',});
            trFormdata.ReportingManagersEmail=[];
            trFormdata.ReviewersEmail=[];
            trFormdata.NotifiersEmail=[];
            trFormdata.IsClientApprovalNeeded=false;
            trFormdata.Revised=false;
            trFormdata.IsSubmitted=false;

            let WeekStartDate=([null,undefined,''].includes(trFormdata.WeekStartDate)?new Date():new Date(trFormdata.WeekStartDate.getMonth()+1+"/"+trFormdata.WeekStartDate.getDate()+"/"+trFormdata.WeekStartDate.getFullYear()));
            let DateOfjoining=new Date(trFormdata.DateOfJoining.getMonth()+1+"/"+trFormdata.DateOfJoining.getDate()+"/"+trFormdata.DateOfJoining.getFullYear());
            this.WeekHeadings=[];
                this.WeekHeadings.push({"Mon":"",
                "IsMonJoined":true,
                "IsDay1Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Tue":"",
                "IsTueJoined":true,
                "IsDay2Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Wed":"",
                "IsWedJoined":true,
                "IsDay3Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Thu":"",
                "IsThuJoined":true,
                "IsDay4Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Fri":"",
                "IsFriJoined":true,
                "IsDay5Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Sat":"",
                "IsSatJoined":true,
                "IsDay6Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                "Sun":"",
                "IsSunJoined":true,
                "IsDay7Holiday":this.IsHoliday(WeekStartDate,trFormdata.HolidayType),
                })
           
            this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:0,EmployeeEmail:this.state.EmployeeEmail,isSubmitted:true,errorMessage:'',showBillable:false,loading:false});
      
        this.showApproveAndRejectButton()

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
    //functions related to approval process
    private showApproveAndRejectButton() {
        let value = this.state.trFormdata.Status != StatusType.Save ? true : false;
        if(value){
        let userGroups = this.state.UserGoups
        let RMEmails = this.state.trFormdata.ReportingManagersEmail
        let RevEmails = this.state.trFormdata.ReviewersEmail
        let userEmail = this.props.spContext.userEmail

        if(userEmail == this.state.EmployeeEmail){
            value = false;
        }

        // trFormdata.ReportingManagersEmail=RMEmail;
        //     trFormdata.ReviewersEmail=ReviewEmail;
        console.log(this.props.spContext)

        if (RMEmails.includes(userEmail)) {
            if (this.state.trFormdata.Pendingwith == "Manager") {
                value = true;
                this.setState({ showApproveRejectbtn: value,IsReviewer:false })
                return false;
            }
            else {
                value = false
            }
        }
        if (RevEmails.includes(userEmail)) {
           // if (this.state.trFormdata.Pendingwith == "Reviewer") {
            if (this.state.trFormdata.Pendingwith == "NA") {
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
                value = false;
        }
        // value = value?this.state.trFormdata.Pendingwith == "Approver"?this.state.userRole == 'Approver'?true:false:this.state.trFormdata.Pendingwith == "Reviewer"?this.state.userRole == 'Reviewer'?true:false:false:false
        this.setState({ showApproveRejectbtn: value,IsReviewer:false  })
    }
    else{
        this.setState({ showApproveRejectbtn: value,IsReviewer:false  })  
    }
    }
     private userAccessableRecord(){
        let currentUserEmail = this.props.spContext.userEmail;
        let userEmail = this.state.EmployeeEmail
        let NotifiersEmail = this.state.trFormdata.NotifiersEmail 
        let ReviewerEmails = this.state.trFormdata.ReviewersEmail
        let ApproverEmails = this.state.trFormdata.ReportingManagersEmail
        let userGroups = this.state.UserGoups
        let isAccessable = false;
        if(userEmail.includes(currentUserEmail)){
            isAccessable = true
        }
        else if(ApproverEmails.includes(currentUserEmail)){
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
            this.setState({isSubmitted:true})
        }
        this.setState({isRecordAcessable : isAccessable})
    }
    //function related to custom Validation
    private validateTimeControls(formdata,Action){
        let isValid={status:true,message:''};
         let val;
         let Time;
        for(let key in formdata.Total[0])
        {
            val=formdata.Total[0][key];
                let DayTime=0;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    DayTime=parseFloat(val);
                    if(DayTime>24)
                    {
                         isValid.message="Total working hours in a day must not exceed 24 hours";
                          isValid.status=false;
                        document.getElementById("Total"+key).focus();
                        document.getElementById("Total"+key).classList.add('mandatory-FormContent-focus');
                          return isValid;
                    } 
                } 
        }
           val=formdata.Total[0].Total;
           Time=parseFloat(val);
        //    if(Time==0)
        //    {
        //     isValid.message="Total working hours in a week can not be blank";
        //     isValid.status=false;
        //     document.getElementById("GrandTotal").focus();
        //     document.getElementById("GrandTotal").classList.add('mandatory-FormContent-focus');
        //     return isValid;
        //    }
        if(Action=="Submit")
        {
            if(formdata.ClientName.toLowerCase().includes("synergy"))
            {
                if(formdata.SynergyOfficeHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description can not be blank";
                     isValid.status=false;
                     document.getElementById("0_Description_SynOffcHrs").focus();
                     document.getElementById("0_Description_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.SynergyOfficeHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="ProjectCode can not be blank";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_SynOffcHrs").focus();
                     document.getElementById("0_ProjectCode_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
            }
            else if(!formdata.ClientName.toLowerCase().includes("synergy"))
            {
                  for(let i in formdata.WeeklyItemsData)
                  { 
                     if(formdata.WeeklyItemsData[i].Description.trim()=="" && formdata.IsDescriptionMandatory)
                     {
                         isValid.message="Description can not be blank";
                         isValid.status=false;
                         document.getElementById(i+"_Description_weekrow").focus();
                         document.getElementById(i+"_Description_weekrow").classList.add('mandatory-FormContent-focus');
                        return isValid;
                     }
                     else if(formdata.WeeklyItemsData[i].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                     {
                         isValid.message="ProjectCode can not be blank";
                         isValid.status=false;
                         document.getElementById(i+"_ProjectCode_weekrow").focus();
                         document.getElementById(i+"_ProjectCode_weekrow").classList.add('mandatory-FormContent-focus');
                         return isValid;
                     }
 
                  }
                 // if(formdata.OTItemsData.length>1)
                  //{
                      for(let i in formdata.OTItemsData)
                      { 
                         if(formdata.OTItemsData[i].Description.trim()=="" && formdata.IsDescriptionMandatory&&parseFloat(formdata.OTItemsData[i].Total)!=0)
                         {
                             isValid.message="Description can not be blank";
                             isValid.status=false;
                             document.getElementById(i+"_Description_otrow").focus();
                             document.getElementById(i+"_Description_otrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                         }
                         else if(formdata.OTItemsData[i].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory&&parseFloat(formdata.OTItemsData[i].Total)!=0)
                         {
                             isValid.message="ProjectCode can not be blank";
                             isValid.status=false;
                             document.getElementById(i+"_ProjectCode_otrow").focus();
                             document.getElementById(i+"_ProjectCode_otrow").classList.add('mandatory-FormContent-focus');
                             return isValid;
                         }
     
                      }
                 // }
            }
            if(formdata.ClientName.toLowerCase()!="")
            {
             if(parseFloat(formdata.ClientHolidayHrs[0].Total)!=0)
             {
                 if(formdata.ClientHolidayHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description can not be blank";
                     isValid.status=false;
                     document.getElementById("0_Description_ClientHldHrs").focus();
                     document.getElementById("0_Description_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.ClientHolidayHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="ProjectCode can not be blank";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_ClientHldHrs").focus();
                     document.getElementById("0_ProjectCode_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
             }
             if(parseFloat(formdata.PTOHrs[0].Total)!=0){
                 if(formdata.PTOHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
                 {
                     isValid.message="Description can not be blank";
                     isValid.status=false;
                     document.getElementById("0_Description_PTOHrs").focus();
                     document.getElementById("0_Description_PTOHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
                 else if(formdata.PTOHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                 {
                     isValid.message="ProjectCode can not be blank";
                     isValid.status=false;
                     document.getElementById("0_ProjectCode_PTOHrs").focus();
                     document.getElementById("0_ProjectCode_PTOHrs").classList.add('mandatory-FormContent-focus');
                     return isValid;
                 }
             }
            }
         //is isValid true remove all 'mandatory-FormContent-focus' classes
         if (!formdata.ClientName.toLowerCase().includes("synergy")) {
             for (let i in formdata.WeeklyItemsData) {
                 document.getElementById(i + "_Description_weekrow").classList.remove('mandatory-FormContent-focus');
                 document.getElementById(i + "_ProjectCode_weekrow").classList.remove('mandatory-FormContent-focus');
             }
             for (let i in formdata.OTItemsData) {
                 document.getElementById(i + "_Description_otrow").classList.remove('mandatory-FormContent-focus');
                 document.getElementById(i + "_ProjectCode_otrow").classList.remove('mandatory-FormContent-focus');
             }
         }
         else {
             document.getElementById("0_Description_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
             document.getElementById("0_ProjectCode_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
         }
        }
              document.getElementById("0_Description_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_ProjectCode_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_Description_PTOHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_ProjectCode_PTOHrs").classList.remove('mandatory-FormContent-focus');
           Object.keys(formdata.Total[0]).forEach(key =>{
            if(!["Total","Description","ProjectCode"].includes(key))
            document.getElementById("Total"+key).classList.remove('mandatory-FormContent-focus');        
           })
           document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
           return isValid;
    }
    //Functions related to HolidayMaster
    private GetHolidayMasterDataByClientName= async (WeekStartDate,selectedClientName,trFormdata)=>
    {
        let Start = addDays(new Date(WeekStartDate), -1);
        let End = addDays(new Date(WeekStartDate), 7);
        let WeekStart = `${Start.getMonth() + 1}/${Start.getDate()}/${Start.getFullYear()}`
        let WeekEnd = `${End.getMonth() + 1}/${End.getDate()}/${End.getFullYear()}`
        let filterQuery="ClientName eq '"+selectedClientName+"' and HolidayDate gt '"+WeekStart+"' and HolidayDate lt '"+WeekEnd+"'";
        let selectQuery="ClientName,HolidayName,HolidayDate,Year,*";
        let HolidaysListData = await sp.web.lists.getByTitle('HolidaysList').items.filter(filterQuery).select(selectQuery).getAll();
        console.log(HolidaysListData);
        if(HolidaysListData.length>=1)
        {
             let HolidayData=[];
            HolidaysListData.filter(item =>{
                HolidayData.push({"ClientName":item.ClientName,"HolidayName":item.HolidayName,"HolidayDate":item.HolidayDate})
            }); 
            // if(selectedClientName.toLowerCase()=="synergy")
            // this.setState({SynergyHolidaysList:HolidayData})
            // else
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
                    <input className={"form-control time "+(this.WeekNames[0].day1)} value={Obj[i].Mon} id={i+"_Mon_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day2)} value={Obj[i].Tue} id={i+"_Tue_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day3)} value={Obj[i].Wed} id={i+"_Wed_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day4)} value={Obj[i].Thu} id={i+"_Thu_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day5)} value={Obj[i].Fri} id={i+"_Fri_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day6)} value={Obj[i].Sat} id={i+"_Sat_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day7)} value={Obj[i].Sun} id={i+"_Sun_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                </td>
                <td>
                {this.getOTBadge(rowType)}
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
    private getOTBadge=(rowType)=>
    {
        let badge=[]
        if(rowType.toLowerCase()=="otrow")
        {
            badge.push(<span className="c-badge">OT</span>)
        }
          return badge;
    }
    private bindComments=()=>{
        let body=[];
        if(this.state.trFormdata.CommentsHistoryData.length>0)
        {
            this.state.trFormdata.CommentsHistoryData.map((option) => (
                body.push(<tr>
                {/* <td className="" >{option["Action"]==StatusType.InProgress?"Approved by Manager":
                option["Action"]==StatusType.Approved?"Approved by Reviewer":
                option["Action"]==StatusType.Reject?"Rejected":"Pending with initiator"}</td> */}
                <td className="" >{option["Role"]}</td>
                <td className="" >{option["Action"]}</td>
                <td className="" >{option["User"]}</td>
                <td className="" >{option["Comments"]}</td>
                <td className="" >{(new Date(option["Date"]).getMonth().toString().length==1?"0"+(new Date(option["Date"]).getMonth()+1):new Date(option["Date"]).getMonth()+1)+"/"+(new Date(option["Date"]).getDate().toString().length==1?"0"+new Date(option["Date"]).getDate():new Date(option["Date"]).getDate())+"/"+new Date(option["Date"]).getFullYear()}  {"  "+new Date(option["Date"]).toLocaleTimeString()}</td>
            </tr>)
           ))
        }
       return body;
    }
    private getClientNames=()=>
    {
        var Formdata=this.state.trFormdata;
        let section=[];
        //code commented for single client binding
    //    if(this.state.ClientNames.length==1)
    //    {
    //        Formdata.ClientName= this.state.ClientNames[0];
    //        this.state.ClientNames.map((option) => (
    //            section.push(
    //                <><option value={option} selected={Formdata.ClientName == option} disabled>{option}</option></>
    //        )))
    //        //For getting Dateofjoining of selected client
    //      for( var item of this.state.Clients_DateOfJoinings)
    //      {
    //          if(item.ClientName.toLowerCase()== Formdata.ClientName.toLowerCase())
    //          {
    //              Formdata.DateOfJoining=new Date(item.DOJ);
    //              Formdata.IsDescriptionMandatory=item.IsDescriptionMandatory;
    //              Formdata.IsProjectCodeMandatory=item.IsProjectCodeMandatory;
    //              Formdata.WeekStartDay=item.WeekStartDay;
    //              Formdata.WeekStartDate = this.getCurrentWeekStartDate(item.WeekStartDay)
    //              Formdata.HolidayType=item.HolidayType;
    //             // this.setState({isSubmitted:false})
    //              this.WeekNames=[];
    //              switch(Formdata.WeekStartDay)
    //              {
    //                  case "Monday":
    //                      this.WeekNames.push({"day1":"Mon","day2":"Tue","day3":"Wed","day4":"Thu","day5":"Fri","day6":"Sat","day7":"Sun","dayCode":"Monday"});
    //                      break;
    //                  case "Tuesday":
    //                      this.WeekNames.push({"day1":"Tue","day2":"Wed","day3":"Thu","day4":"Fri","day5":"Sat","day6":"Sun","day7":"Mon","dayCode":"Tuesday"});
    //                      break;
    //                  case "Wednesday":
    //                      this.WeekNames.push({"day1":"Wed","day2":"Thu","day3":"Fri","day4":"Sat","day5":"Sun","day6":"Mon","day7":"Tue","dayCode":"Wednesday"});
    //                      break;
    //                  case "Thursday":
    //                      this.WeekNames.push({"day1":"Thu","day2":"Fri","day3":"Sat","day4":"Sun","day5":"Mon","day6":"Tue","day7":"Wed","dayCode":"Thursday"});
    //                      break;
    //                  case "Friday":
    //                      this.WeekNames.push({"day1":"Fri","day2":"Sat","day3":"Sun","day4":"Mon","day5":"Tue","day6":"Wed","day7":"Thu","dayCode":"Friday"});
    //                      break;
    //                  case "Saturday":
    //                      this.WeekNames.push({"day1":"Sat","day2":"Sun","day3":"Mon","day4":"Tue","day5":"Wed","day6":"Thu","day7":"Fri","dayCode":"Saturday"});
    //                      break;
    //                  case "Sunday":
    //                      this.WeekNames.push({"day1":"Sun","day2":"Mon","day3":"Tue","day4":"Wed","day5":"Thu","day6":"Fri","day7":"Sat","dayCode":"Sunday"});
    //                      break;
    //              }
    //              break;
    //          }
    //      }
         
    //    }
    //else if(this.state.ClientNames.length>1){
           section.push(<option value=''>None</option>)
               this.state.ClientNames.map((option) => (
                   section.push(
                       <><option value={option} selected={this.state.trFormdata.ClientName == option}>{option}</option></>
               )))
      // }
       //this.setState({trFormdata:Formdata})
        return section;
    }
    private getRevisedLabel=(formdata)=>
    {
        let label=""
        if(formdata.Revised)
        label="-Revised";
        return label;
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
                      this.state.ConfirmPopupMessage=="Are you sure you want to reject?"?<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleReject} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>:""
                       }
            <div id="content" className="content p-2 pt-2">
            <div className="container-fluid">
            <div className='FormContent'>
                <div className="mt-3 mb-1 media-p-1 Billable Hours">
                <div className="title">Weekly Timesheet {this.getRevisedLabel(this.state.trFormdata)}
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    </div>
                    <div className="col-md-12 SynergyAddress">
                    <label className='headerClient'>{this.state.trFormdata.ClientName}</label><span id='weekstartAndweekEnd'>{this.getWeekstartAndWeekEnd(this.state.trFormdata)}</span>
                    </div>
                    <div className="row pt-2 px-4 weeklysection1">
                    {/* new changes start */}
                    {this.state.isAdmin &&
                    <div className="col-md-3">
                                <div className="light-text clientName">
                                    <label>Applying for<span className="mandatoryhastrick">*</span></label>
                                    <select className="ddlApplying"  name="Applying" title="Applying for" onChange={this.handleApplyingfor}>
                                            <option value='Self'>Self</option>
                                            <option value='onBehalf'>On Behalf</option>
                                    </select>
                                </div>
                    </div>}

                    
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
                                    <select className="ddlClient" required={true}  name="ClientName" title="Client Name" onChange={this.handleClientChange} ref={this.Client} disabled={(this.state.ClientNames.length==1?true:this.currentUser==this.state.trFormdata.Name?false: this.state.isSubmitted)}>
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
                                                    isDisabled = {(this.currentUser==this.state.trFormdata.Name?false: this.state.isSubmitted)}
                                                    ref={this.weekStartDate}
                                                    Day={this.WeekNames[0].dayCode}
                                                />
                                            </div>
                                </div>
                        </div>
                    </div>
                    <div className="border-box-shadow light-box table-responsive table-NoScroll">
                        {/* <h4>Billable Hours</h4> */}
                        <div className='table-outer'></div>
                        <table className="table table-bordered m-0 timetable table-td-p-0">
                                        <thead style={{ borderBottom: "4px solid #444444" }}>
                                        <tr>
                                        <th className="" ><div className="have-h"></div></th>
                                        <th className=""><div className='th-description'>Description {this.state.trFormdata.IsDescriptionMandatory? <span className="mandatoryhastrick">*</span>:""}</div></th>
                                        <th className="projectCode"><div className='th-Project-Code'>Project Code{this.state.trFormdata.IsProjectCodeMandatory? <span className="mandatoryhastrick">*</span>:""}</div></th>
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
                                        <input className={"form-control time "+(this.WeekNames[0].day1)}  value={this.state.trFormdata.WeeklyItemsData[0].Mon} id="0_Mon_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.WeeklyItemsData[0].Tue} id="0_Tue_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.WeeklyItemsData[0].Wed} id="0_Wed_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.WeeklyItemsData[0].Thu} id="0_Thu_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.WeeklyItemsData[0].Fri} id="0_Fri_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                    </td>
                                    <td>
                                      <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.WeeklyItemsData[0].Sat} id="0_Sat_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.WeeklyItemsData[0].Sun} id="0_Sun_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
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
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.OTItemsData[0].Mon} id="0_Mon_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.OTItemsData[0].Tue} id="0_Tue_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.OTItemsData[0].Wed} id="0_Wed_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.OTItemsData[0].Thu} id="0_Thu_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.OTItemsData[0].Fri} id="0_Fri_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.OTItemsData[0].Sat} id="0_Sat_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.OTItemsData[0].Sun} id="0_Sun_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                    </td>
                                    <td>
                                        <span className="c-badge">OT</span>
                                    </td>
                                    <td>
                                        <input className="form-control time WeekTotal" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                    {/* <span className='span-fa-plus' title='Add New row'   onClick={this.CreateOTHrsRow} id='' hidden={this.state.isSubmitted}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span> */}
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
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.SynergyOfficeHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.SynergyOfficeHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.SynergyOfficeHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.SynergyOfficeHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.SynergyOfficeHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.SynergyOfficeHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.SynergyOfficeHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} ></input>
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
                                        <input className={"form-control time "+(this.WeekNames[0].day1)+(this.WeekHeadings[0].IsDay1Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Mon} onChange={this.changeTime} id="0_Mon_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined||!this.WeekHeadings[0].IsDay1Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)+(this.WeekHeadings[0].IsDay2Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Tue} onChange={this.changeTime} id="0_Tue_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined||!this.WeekHeadings[0].IsDay2Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)+(this.WeekHeadings[0].IsDay3Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Wed} onChange={this.changeTime} id="0_Wed_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined||!this.WeekHeadings[0].IsDay3Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)+(this.WeekHeadings[0].IsDay4Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Thu} onChange={this.changeTime} id="0_Thu_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined||!this.WeekHeadings[0].IsDay4Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)+(this.WeekHeadings[0].IsDay5Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Fri} onChange={this.changeTime} id="0_Fri_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined||!this.WeekHeadings[0].IsDay5Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)+(this.WeekHeadings[0].IsDay6Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Sat} onChange={this.changeTime} id="0_Sat_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined||!this.WeekHeadings[0].IsDay6Holiday.isHoliday} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)+(this.WeekHeadings[0].IsDay7Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.ClientHolidayHrs[0].Sun} onChange={this.changeTime} id="0_Sun_ClientHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined||!this.WeekHeadings[0].IsDay7Holiday.isHoliday} ></input>
                                        </td>
                                    <td><span className="c-badge">H</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.ClientHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_ClientHldHrs" type="text" maxLength={5} readOnly></input></td>
                                    <td></td>
                                </tr>
                                <tr id="PTOHrs">
                                    <td className="text-start"><div className="p-1">PTO (Paid Time Off)</div></td>
                                    <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.PTOHrs[0].Description} onChange={this.changeTime} id="0_Description_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable}></textarea></td>
                                    <td><input className="form-control" value={this.state.trFormdata.PTOHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_PTOHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td>
                                            <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.PTOHrs[0].Mon} onChange={this.changeTime} id="0_Mon_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                            </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.PTOHrs[0].Tue} onChange={this.changeTime} id="0_Tue_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.PTOHrs[0].Wed} onChange={this.changeTime} id="0_Wed_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.PTOHrs[0].Thu} onChange={this.changeTime} id="0_Thu_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.PTOHrs[0].Fri} onChange={this.changeTime} id="0_Fri_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.PTOHrs[0].Sat} onChange={this.changeTime} id="0_Sat_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                        </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.PTOHrs[0].Sun} onChange={this.changeTime} id="0_Sun_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                        </td>
                                    <td><span className="c-badge">PTO</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" maxLength={5} readOnly></input></td>
                                    <td></td>
                                </tr>
        
                                 {this.state.trFormdata.ClientName.toLowerCase()=="synergy"||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                 <tr className="">
                                    <td className="fw-bold text-start">
                                        <div className="p-2 fw-bold">
                                            <i className="fas fa-business-time color-gray"></i> Billable Total
                                        </div>
                                    </td>
                                     <td colSpan={2}>
                                    
                                    </td>
                                    {/* <td>   
                                    </td> */}
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalMon" value={this.state.trFormdata.BillableSubTotal[0].Mon} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalTue" value={this.state.trFormdata.BillableSubTotal[0].Tue} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalWed" value={this.state.trFormdata.BillableSubTotal[0].Wed} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalThu" value={this.state.trFormdata.BillableSubTotal[0].Thu} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalFri" value={this.state.trFormdata.BillableSubTotal[0].Fri} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sat} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sun} type="text" maxLength={5} readOnly></input>
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
                                            <i className="fas fa-business-time color-gray"></i> Total
                                        </div>
                                    </td>
                                    <td colSpan={2}></td>
                                    {/* <td></td> */}
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalMon" value={this.state.trFormdata.Total[0].Mon} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalTue" value={this.state.trFormdata.Total[0].Tue} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalWed" value={this.state.trFormdata.Total[0].Wed} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalThu" value={this.state.trFormdata.Total[0].Thu} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td> 
                                        <input className="form-control time DayTotal" id="TotalFri" value={this.state.trFormdata.Total[0].Fri} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalSat" value={this.state.trFormdata.Total[0].Sat} type="text" maxLength={5} readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalSun" value={this.state.trFormdata.Total[0].Sun} type="text" maxLength={5} readOnly></input>
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
                                                        name={"IsClientApprovalNeeded"}
                                                        checked={this.state.trFormdata.IsClientApprovalNeeded}
                                                        onChange={this.handleChange}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        />
                                                    </div>
                                                   </div>:""}
                        </div>
                    </div>                       
                    <div className="row">
                        <div className="col-md-12 text-center mb-3">
                            {/* Error Message */}
                        <div className='text-left'>
                        <span className='text-validator'> {this.state.errorMessage}</span>
                    </div> 
                            {this.state.showApproveRejectbtn&&!this.state.IsReviewer?<button type="button" id="btnApprove" onClick={this.showConfirmApprove} className="SubmitButtons btn">Approve</button>:''}
                            {this.state.showApproveRejectbtn?<button type="button" id="btnReject" onClick={this.showConfirmReject}  className="RejectButtons btn">Reject</button>:''}
                            {this.state.isSubmitted?'': <button type="button" id="btnSubmit" onClick={this.showConfirmSubmit} className="SubmitButtons btn">Submit</button>}
                            {(this.state.trFormdata.Status==StatusType.Submit||this.state.trFormdata.Status==StatusType.Approved)&&!this.state.showApproveRejectbtn?<button type="button" id="btnRevoke" onClick={this.handleRevoke} className="txt-white CancelButtons bc-burgundy btn">Revoke</button>:''}
                            {this.state.isSubmitted?'':  <button type="button" id="btnSave" onClick={this.handleSubmitorSave} className="SaveButtons btn">Save</button>}
                            <button type="button" id="btnCancel" onClick={this.handleCancel} className="CancelButtons btn">Cancel</button>
                        </div>
                        
                    </div>

                       {this.state.trFormdata.CommentsHistoryData.length>0? <><div className="p-2">
                                            <h4>History</h4>
                                        </div><div>
                                                <table className="table table-bordered m-0 timetable">
                                                    <thead style={{ borderBottom: "4px solid #444444" }}>
                                                        <tr>
                                                            <th className="">Action By</th>
                                                            <th className="">Status</th>
                                                            <th className="">User Name</th>
                                                            <th className="">Comments</th>
                                                            <th className="">Date & Time</th>
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