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
import CustomDatePicker from "../Forms/DatePicker";
import { addDays } from 'office-ui-fabric-react';
import '../../CSS/WeeklyTimesheet.css'
import ModalPopUpConfirm from '../Shared/ModalPopUpConfirm';


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

    };
    ClientNames:any;
    Clients_DateOfJoinings:any,
    HolidaysList:any,
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
    RowType:string;
    rowCount:string;

}

class WeeklyTimesheet extends Component<WeeklyTimesheetProps, WeeklyTimesheetState> {
    private siteURL: string;
    private oweb;
    private currentUser :string;
    private currentUserId:number;
    private listName = 'WeeklyTimeSheet';
    private Client;
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
            },
            ClientNames:[],
            Clients_DateOfJoinings:[],
            HolidaysList:[],
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
            showNonBillable : true,
            showApproveRejectbtn : false,
            IsReviewer:false,
            isRecordAcessable: true,
            UserGoups: [],
            showConfirmDeletePopup:false,
            RowType:"",
            rowCount:"",
        };
        this.oweb = Web(this.props.spContext.siteAbsoluteUrl);
         // for first row of weekly and OT hrs
         const trFormdata = { ...this.state.trFormdata };
         trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.BillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.NonBillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.Total.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
        
        this.WeekHeadings.push({"Mon":"",
        "IsMonJoined":true,
        "IsDay1Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Tue":"",
        "IsTueJoined":true,
        "IsDay2Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Wed":"",
        "IsWedJoined":true,
        "IsDay3Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Thu":"",
        "IsThuJoined":true,
        "IsDay4Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Fri":"",
        "IsFriJoined":true,
        "IsDay5Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Sat":"",
        "IsSatJoined":true,
        "IsDay6Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        "Sun":"",
        "IsSunJoined":true,
        "IsDay7Holiday":this.IsHoliday(trFormdata.WeekStartDate),
        })
        this.WeekNames.push({"day1":"Mon","day2":"Tue","day3":"Wed","day4":"Thu","day5":"Fri","day6":"Sat","day7":"Sun","dayCode":1});
        this.setState({ trFormdata});
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
         this.setState({ loading: true });
         this.loadWeeklyTimeSheetData();
    
    }
    //functions related to  initial loading
     private async loadWeeklyTimeSheetData() {
        var ClientNames: any;

         if(this.props.match.params.id!=undefined){
            this.setState({ItemID : this.props.match.params.id})
             ClientNames= await this.getItemData(this.props.match.params.id)
            //  ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+data[0].InitiatorId+"and IsActive eq 1").select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").orderBy("Employee/Title").expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();
         }
         else
         {
             ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+this.currentUserId+"and IsActive eq 1").select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").orderBy("Employee/Title").expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();
         }
        console.log(ClientNames);
        if(ClientNames.length<1){
            this.setState({modalTitle:'Invalid Employee configuration',modalText:'Employee not configured in Approval Matrix,Please contact Administrator',isSuccess: false,showHideModal:true})
            this.setState({loading:false,isSubmitted:true});
            return false;
        }
        this.state.EmployeeEmail.push(ClientNames[0].Employee.EMail);
        ClientNames.filter(item => {
              this.state.ClientNames.push(item.ClientName);
              this.state.Clients_DateOfJoinings.push({"ClientName":item.ClientName,"DOJ":item.DateOfJoining,"IsDescriptionMandatory":item.MandatoryDescription,"IsProjectCodeMandatory":item.MandatoryProjectCode,"WeekStartDay":item.WeekStartDay,"HolidayType":item.HolidayType})
              if(item.hasOwnProperty("ReportingManager"))
              item.ReportingManager.map(i=>(this.state.SuperviserNames.push({"ClientName":item.ClientName,"ReportingManager":i.Title,"ReportingManagerId":i.Id,"ReportingManagerEmail":i.EMail})));
              if(item.hasOwnProperty("Reviewers"))
              item.Reviewers.map(i=>(this.state.Reviewers.push({"ClientName":item.ClientName,"ReviewerId":i.Id,"ReviewerEmail":i.EMail})));
              if(item.hasOwnProperty("Notifiers"))
              item.Notifiers.map(i=>(this.state.Notifiers.push({"ClientName":item.ClientName,"NotifierId":i.Id,"NotifierEmail":i.EMail})));

        }); 
        let groups = await sp.web.currentUser.groups();
        console.log("current user deatils")
        console.log(this.props.context.pageContext)
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        this.setState({UserGoups:userGroups})
        // ---new -------
        let userGroup = groups[0].Title
        let user = userGroup=='Timesheet Initiators' ?'Initiator': userGroup=='Timesheet Approvers'?'Approver':userGroup=='Timesheet Reviewers'?'Reviewer':'Administrator'
        console.log('You are :'+user)
        this.setState({ClientNames: this.state.ClientNames,userRole : user,EmployeeEmail:this.state.EmployeeEmail})
        if(this.props.match.params.id != undefined){
            console.log(this.props.match.params.id)
            this.setState({ItemID : this.props.match.params.id})
            this.getItemData(this.state.ItemID);
        }
        else {
            if(this.state.userRole != 'Initiator'){
                this.setState({isSubmitted : true,loading:false});
            }
        }

    }
    private async getItemData(TimesheetID){
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
        trFormdata.PTOHrs=JSON.parse(data[0].PTOHrs);
        trFormdata.NonBillableSubTotal=JSON.parse(data[0].NonBillableSubTotalHrs);
        trFormdata.Total=JSON.parse(data[0].TotalHrs);
        trFormdata.Status=data[0].Status;
        trFormdata.CommentsHistoryData=JSON.parse(data[0].CommentsHistory);
        trFormdata.SuperviserNames=JSON.parse(data[0].SuperviserName);
        trFormdata.Pendingwith=data[0].PendingWith;
        trFormdata.IsClientApprovalNeeded=data[0].IsClientApprovalNeed;
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
         //For getting Dynamic Week headings
        trFormdata.WeekStartDate.getDay()==1?trFormdata.WeekStartDay="Monday":
        trFormdata.WeekStartDate.getDay()==2?trFormdata.WeekStartDay="Tuesday":
        trFormdata.WeekStartDate.getDay()==3?trFormdata.WeekStartDay="Wednesday":
        trFormdata.WeekStartDate.getDay()==4?trFormdata.WeekStartDay="Thursday":
        trFormdata.WeekStartDate.getDay()==5?trFormdata.WeekStartDay="Friday":
        trFormdata.WeekStartDate.getDay()==6?trFormdata.WeekStartDay="Saturday":
        trFormdata.WeekStartDate.getDay()==0?trFormdata.WeekStartDay="Sunday":trFormdata.WeekStartDay="Monday"
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
    
        this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,EmployeeEmail:EmpEmail,loading:false});
        // if(data[0].ClientName =='synergy'){
        //     this.setState({showBillable : true, showNonBillable: false})
        // }
        // else{
             this.setState({showBillable : false, showNonBillable: false})
        // }
        if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(data[0].Status))
        {
            this.setState({isSubmitted:true});
        }
        else if([StatusType.Reject].includes(data[0].Status))
        {
            this.setState({isSubmitted:false});
        }
          //For getting Dateofjoining,DescriptionMandatory,ProjectCOde Mandatory,WeekStartday of selected client
          for( var item of this.state.Clients_DateOfJoinings)
          {
              if(item.ClientName.toLowerCase()==data[0].ClientName.toLowerCase())
              {
                  trFormdata.DateOfJoining=new Date(item.DOJ);
                  trFormdata.IsDescriptionMandatory=item.IsDescriptionMandatory;
                  trFormdata.IsProjectCodeMandatory=item.IsProjectCodeMandatory;
                  trFormdata.WeekStartDay=item.WeekStartDay;
                  break;
              }
          }
          
        let WeekStartDate=new Date(data[0].WeekStartDate);
        this.WeekHeadings=[];
        this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsMonJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay1Holiday":this.IsHoliday(WeekStartDate),
        "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsTueJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay2Holiday":this.IsHoliday(WeekStartDate),
        "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsWedJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay3Holiday":this.IsHoliday(WeekStartDate),
        "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsThuJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay4Holiday":this.IsHoliday(WeekStartDate),
        "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsFriJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay5Holiday":this.IsHoliday(WeekStartDate),
        "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsSatJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay6Holiday":this.IsHoliday(WeekStartDate),
        "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
        "IsSunJoined":WeekStartDate<trFormdata.DateOfJoining,
        "IsDay7Holiday":this.IsHoliday(WeekStartDate),
        })
        let groups = await sp.web.currentUser.groups();
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        this.setState({UserGoups:userGroups})

        this.hideApproveAndRejectButton();
        this.userAccessableRecord();

        ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+data[0].InitiatorId+"and IsActive eq 1").select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").orderBy("Employee/Title").expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();
        
        return ClientNames;
    }
    //functions related to calculation
    private WeekStartDateChange = (dateprops) => {
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
            this.GetHolidayMasterDataByClientName(date,Formdata.HolidayType);
            this.validateDuplicateRecord(date,Formdata.ClientName);
        this.setState({trFormdata:Formdata});
        console.log(this.state);
       
    }
     private handleClientChange=(event)=>{
        let clientVal=event.target.value;
        const Formdata = { ...this.state.trFormdata };
            Formdata.ClientName=clientVal;
            Formdata.SuperviserNames=[];
            Formdata.SuperviserIds=[];
            Formdata.ReviewerIds=[];
            Formdata.NotifierIds=[];
            let RMEmail=[];
            let ReviewEmail=[];
            let NotifyEmail=[];
        console.log(this.state);

        // if(clientVal == 'synergy')
        // {
        //     this.setState({showBillable : true, showNonBillable: false})
        // }
        // else if(clientVal == 'None'){
        //     this.setState({showBillable : true, showNonBillable: true})
        // }
        // else{
        //     this.setState({showBillable : false, showNonBillable: true})
        // }
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
        Formdata.WeekStartDate=null;  //For restricting  of incorrect WeekstarDay binding in DatePicker
       this.validateDuplicateRecord(Formdata.WeekStartDate,clientVal);
        this.setState({trFormdata:Formdata});
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
        [undefined,null,""].includes(value)?value="00:00":value;

        //FOR ROW WISE CALCULATION
        let TotalRowMins=0;
        let Rowhrs=0;
        let RowMins=0;
            if(rowType=="weekrow")
            {
                trFormdata.WeeklyItemsData[index][prop]=value;
                this.setState({trFormdata});
              Object.keys(trFormdata.WeeklyItemsData[index]).forEach(key =>{
                let val=trFormdata.WeeklyItemsData[index][key];
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                }
              })

              Rowhrs=Math.floor(TotalRowMins/60);
              RowMins=Math.floor(TotalRowMins%60);
              trFormdata.WeeklyItemsData[index]["Total"]=(Rowhrs.toString().length==1?"0"+Rowhrs:Rowhrs)+":"+(RowMins.toString().length==1?"0"+RowMins:RowMins);
            }
            else if(rowType=="otrow")
            {
            trFormdata.OTItemsData[index][prop]=value;
            this.setState({ trFormdata});
              Object.keys(trFormdata.OTItemsData[index]).forEach(key =>{
                let val=trFormdata.OTItemsData[index][key];
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                }
              })

              Rowhrs=Math.floor(TotalRowMins/60);
              RowMins=Math.floor(TotalRowMins%60);
              trFormdata.OTItemsData[index]["Total"]=(Rowhrs.toString().length==1?"0"+Rowhrs:Rowhrs)+":"+(RowMins.toString().length==1?"0"+RowMins:RowMins);
            }
            else if(rowType=="SynOffcHrs")
            {
                trFormdata.SynergyOfficeHrs[index][prop]=value;
                this.setState({ trFormdata});
                  Object.keys(trFormdata.SynergyOfficeHrs[index]).forEach(key =>{
                    let val=trFormdata.SynergyOfficeHrs[index][key];
                    if(!["Description","ProjectCode","Total"].includes(key))
                    {
                        TotalRowMins=TotalRowMins+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                    }
                  })
    
                  Rowhrs=Math.floor(TotalRowMins/60);
                  RowMins=Math.floor(TotalRowMins%60);
                  trFormdata.SynergyOfficeHrs[index]["Total"]=(Rowhrs.toString().length==1?"0"+Rowhrs:Rowhrs)+":"+(RowMins.toString().length==1?"0"+RowMins:RowMins);
            }
            else if(rowType=="SynHldHrs")
           {
            trFormdata.SynergyHolidayHrs[index][prop]=value;
            this.setState({ trFormdata});
              Object.keys(trFormdata.SynergyHolidayHrs[index]).forEach(key =>{
                let val=trFormdata.SynergyHolidayHrs[index][key];
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                }
              })

              Rowhrs=Math.floor(TotalRowMins/60);
              RowMins=Math.floor(TotalRowMins%60);
              trFormdata.SynergyHolidayHrs[index]["Total"]=(Rowhrs.toString().length==1?"0"+Rowhrs:Rowhrs)+":"+(RowMins.toString().length==1?"0"+RowMins:RowMins);
           }
            else if(rowType=="PTOHrs")
          {
            trFormdata.PTOHrs[index][prop]=value;
            this.setState({ trFormdata});
              Object.keys(trFormdata.PTOHrs[index]).forEach(key =>{
                let val=trFormdata.PTOHrs[index][key];
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    TotalRowMins=TotalRowMins+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                }
              })

              Rowhrs=Math.floor(TotalRowMins/60);
              RowMins=Math.floor(TotalRowMins%60);
              trFormdata.PTOHrs[index]["Total"]=(Rowhrs.toString().length==1?"0"+Rowhrs:Rowhrs)+":"+(RowMins.toString().length==1?"0"+RowMins:RowMins);
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
                let val=item[prop]; 
                WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1]));
                 //For total calculation
                let TotalVal=item.Total;
                Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                WeekTotal= WeekTotal+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
            }
            let H=Math.floor(WeekTotal/60);
            let M=Math.floor(WeekTotal%60);
            trFormdata.WeeklyItemsTotalTime=(H.toString().length==1?"0"+H:H)+":"+(M.toString().length==1?"0"+M:M);
              // to iterate OT hrs
              H=0;
              M=0;
            for(var item of trFormdata.OTItemsData)
            {
                 //For weekly calculation
                let val=item[prop];
                WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                 //For total calculation
                 let TotalVal=item.Total;
                 Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                 OTTotal= OTTotal+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
            }
             H=Math.floor(OTTotal/60);
             M=Math.floor(OTTotal%60);
            trFormdata.OTItemsTotalTime=(H.toString().length==1?"0"+H:H)+":"+(M.toString().length==1?"0"+M:M);

            WeeklyColHrs=Math.floor(WeeklyTotal/60);
            WeeklyColMins=Math.floor(WeeklyTotal%60);
            TotalColHrs=Math.floor(Total/60);
            TotalColMins=Math.floor(Total%60);
            if(!["Description","ProjectCode"].includes(prop))
            trFormdata.BillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
            trFormdata.BillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

             // NON BILLABLE SUBTOTAL COLUMN WISE
             WeeklyTotal=0;
             WeeklyColHrs=0;
             WeeklyColMins=0;
            [Total,TotalColHrs,TotalColMins]=[0,0,0];
             let NonBillableColValue=trFormdata.SynergyOfficeHrs[0][prop];
             let TotalVal=trFormdata.SynergyOfficeHrs[0]["Total"];
             WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1])); 
             Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1])); 

             NonBillableColValue=trFormdata.SynergyHolidayHrs[0][prop];
             TotalVal=trFormdata.SynergyHolidayHrs[0]["Total"];
             WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1]));
             Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));  

             NonBillableColValue=trFormdata.PTOHrs[0][prop];
             TotalVal=trFormdata.PTOHrs[0]["Total"];
             WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1])); 
             Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1])); 

             WeeklyColHrs=Math.floor(WeeklyTotal/60);
             WeeklyColMins=Math.floor(WeeklyTotal%60);
             TotalColHrs=Math.floor(Total/60);
             TotalColMins=Math.floor(Total%60);
             if(!["Description","ProjectCode"].includes(prop))
             trFormdata.NonBillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
             trFormdata.NonBillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

             //GRAND TOTAL COLUMN WISE
             WeeklyTotal=0;
             WeeklyColHrs=0;
             WeeklyColMins=0;
             [Total,TotalColHrs,TotalColMins]=[0,0,0];
             if(!["Description","ProjectCode"].includes(prop))
             {
             let TotalColVal=trFormdata.BillableSubTotal[0][prop];
            let BillableTotalVal=trFormdata.BillableSubTotal[0]["Total"];
             WeeklyTotal=WeeklyTotal+( parseInt(TotalColVal.split(":")[0])*60 ) + (parseInt(TotalColVal.split(":")[1])); 
             Total=Total+( parseInt(BillableTotalVal.split(":")[0])*60 ) + (parseInt(BillableTotalVal.split(":")[1])); 

             TotalColVal=trFormdata.NonBillableSubTotal[0][prop];  
             BillableTotalVal=trFormdata.NonBillableSubTotal[0]["Total"];
             WeeklyTotal=WeeklyTotal+( parseInt(TotalColVal.split(":")[0])*60 ) + (parseInt(TotalColVal.split(":")[1]));
             Total=Total+( parseInt(BillableTotalVal.split(":")[0])*60 ) + (parseInt(BillableTotalVal.split(":")[1])); 
             
             WeeklyColHrs=Math.floor(WeeklyTotal/60);
             WeeklyColMins=Math.floor(WeeklyTotal%60);
             TotalColHrs=Math.floor(Total/60);
             TotalColMins=Math.floor(Total%60);
             }
             if(!["Description","ProjectCode"].includes(prop))
             {

                 trFormdata.Total[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
                 trFormdata.Total[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);
             }else{
                trFormdata.Total[0][prop]=trFormdata.Total[0][prop]
                trFormdata.Total[0]["Total"]=trFormdata.Total[0]["Total"]
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
                            let val=item[prop]; 
                            WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1]));
                            //For total calculation
                            let TotalVal=item.Total;
                            Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                           
                        }
                        for(var item of trFormdata.OTItemsData)
                        {
                            //For weekly calculation
                            let val=item[prop];
                            WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                            //For total calculation
                            let TotalVal=item.Total;
                            Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                        }
            }
            else{      //When OT items removed 
                
                        //BILLABLE SUB TOTAL COLUMN WISE
                        // to iterate Weekly hrs
                        for(var item of trFormdata.WeeklyItemsData)
                        {
                            //For weekly calculation
                            let val=item[prop]; 
                            WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1]));
                            //For total calculation
                            let TotalVal=item.Total;
                            Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                           
                        }
                      
                        for(var item of DataAfterRemovedObject)
                        {
                            //For weekly calculation
                            let val=item[prop];
                            WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                            //For total calculation
                            let TotalVal=item.Total;
                            Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                           
                        }

            }
                        WeeklyColHrs=Math.floor(WeeklyTotal/60);
                        WeeklyColMins=Math.floor(WeeklyTotal%60);
                        TotalColHrs=Math.floor(Total/60);
                        TotalColMins=Math.floor(Total%60);

                        trFormdata.BillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
                        trFormdata.BillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

                        //GRAND TOTAL COLUMN WISE
                        WeeklyTotal=0;
                        WeeklyColHrs=0;
                        WeeklyColMins=0;
                        [Total,TotalColHrs,TotalColMins]=[0,0,0];
                        let TotalColVal=trFormdata.BillableSubTotal[0][prop];
                        let BillableTotalVal=trFormdata.BillableSubTotal[0]["Total"];
                        WeeklyTotal=WeeklyTotal+( parseInt(TotalColVal.split(":")[0])*60 ) + (parseInt(TotalColVal.split(":")[1])); 
                        Total=Total+( parseInt(BillableTotalVal.split(":")[0])*60 ) + (parseInt(BillableTotalVal.split(":")[1])); 

                        TotalColVal=trFormdata.NonBillableSubTotal[0][prop];  
                        BillableTotalVal=trFormdata.NonBillableSubTotal[0]["Total"];
                        WeeklyTotal=WeeklyTotal+( parseInt(TotalColVal.split(":")[0])*60 ) + (parseInt(TotalColVal.split(":")[1]));
                        Total=Total+( parseInt(BillableTotalVal.split(":")[0])*60 ) + (parseInt(BillableTotalVal.split(":")[1])); 
                        
                        WeeklyColHrs=Math.floor(WeeklyTotal/60);
                        WeeklyColMins=Math.floor(WeeklyTotal%60);
                        TotalColHrs=Math.floor(Total/60);
                        TotalColMins=Math.floor(Total%60);
                        trFormdata.Total[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
                        trFormdata.Total[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

                       // this.setState({ trFormdata});  
                      
        }
        return trFormdata;
       
    }
    private showConfirmDeleteRow = (event)=>{
        this.setState({showConfirmDeletePopup:true});
         let TypeofRow = event.target.id.split("_")[1];
         let  CountOfRow = event.target.id.split("_")[0];
         this.setState({RowType:TypeofRow,rowCount:CountOfRow})
    }
    private CancelDeleteRow =() =>
    {
        this.setState({showConfirmDeletePopup:false});
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
            if(trFormdata.WeeklyItemsData[i].Total=="00:00")
            {
                isValid.message="Total working hours in a week can not be '00:00' hours";
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
            let newObj={Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00'};
            trFormdata.WeeklyItemsData.push(newObj);
            this.setState({ trFormdata, currentWeeklyRowsCount: count ,showLabel: true, errorMessage:""});
        }
        else{
            this.setState({ showLabel: true, errorMessage: isValid.message});
        }
    }
    private CreateOTHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let isValid={status:true,message:''};
        for(let i in trFormdata.OTItemsData)
        {
            if(trFormdata.OTItemsData[i].Total=="00:00")
            {
                isValid.message="Total working hours in a week can not be '00:00' hours";
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
          let newObj={Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00'};
  
          trFormdata.OTItemsData.push(newObj);
          this.setState({ trFormdata, currentOTRowsCount: count,showLabel:false, errorMessage:""});
      }
      else{
        this.setState({ showLabel: true, errorMessage: isValid.message});
      }
    }
    //functions related to CRUD operations
   private handleSubmitorSave = async (event) => {
        event.preventDefault();
        let btnId=event.target.id;
        let data = {
            ClientName:{val:this.state.trFormdata.ClientName,required:true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client},
            WeeklyStartDate:{val: this.state.trFormdata.WeekStartDate, required:true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid:"divWeekStartDate"}
        };
        var formdata = { ...this.state.trFormdata };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        formdata=this.Calculte_Indvidual_OT_Weekly_TotalTime(formdata);
        this.setState({trFormdata:formdata})
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            isValid=this.validateTimeControls(formdata);
        }
        if (isValid.status) {
            console.log(this.state);
            formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
            this.setState({trFormdata:formdata})
            var postObject = {
                Name : formdata.Name,
                ClientName :formdata.ClientName, 
                WeekStartDate:new Date(formdata.WeekStartDate),
                WeeklyHrs:JSON.stringify(formdata.WeeklyItemsData),
                OverTimeHrs:JSON.stringify(formdata.OTItemsData),
                BillableSubtotalHrs:JSON.stringify(formdata.BillableSubTotal),
                SynergyOfficeHrs:JSON.stringify(formdata.SynergyOfficeHrs),
                SynergyHolidayHrs:JSON.stringify(formdata.SynergyHolidayHrs),
                PTOHrs:JSON.stringify(formdata.PTOHrs),
                NonBillableSubTotalHrs:JSON.stringify(formdata.NonBillableSubTotal),
                TotalHrs:JSON.stringify(formdata.Total),
                SuperviserName:JSON.stringify(formdata.SuperviserNames),
                InitiatorId:this.currentUserId,
                BillableTotalHrs:formdata.BillableSubTotal[0].Total,
                NonBillableTotalHrs:formdata.NonBillableSubTotal[0].Total,
                GrandTotal:formdata.Total[0].Total,
                WeeklyTotalHrs:formdata.WeeklyItemsTotalTime,
                OTTotalHrs:formdata.OTItemsTotalTime,
                ReportingManagerId:{"results":formdata.SuperviserIds},
                ReviewersId:{"results":formdata.ReviewerIds},
                NotifiersId:{"results":formdata.NotifierIds},
               IsClientApprovalNeed:formdata.IsClientApprovalNeeded,
            }
            switch(btnId.toLowerCase())
            {
                case "btnsave":
                    //formdata.CommentsHistoryData.push({"Action":StatusType.Save,"Role":this.state.userRole,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    postObject['Status']=StatusType.Save;
                    postObject['PendingWith']="NA";
                    break;
                case "btnsubmit":
                    if(this.state.ItemID==0)
                    formdata.CommentsHistoryData.push({"Action":StatusType.Submit,"Role":"Initiator","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    else
                    formdata.CommentsHistoryData.push({"Action":"Re-Submitted","Role":"Initiator","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})

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
                           postObject['Status']=StatusType.Approved;
                           postObject['PendingWith']="NA";
                           postObject['DateSubmitted']=new Date();
                       }
                   }
                  
                    break;
            }
                 postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
                this.setState({errorMessage : '',trFormdata:formdata});
                this.InsertorUpdatedata(postObject,formdata);
         
        } 
        else {
            this.setState({ showLabel: true, errorMessage: isValid.message});
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
        //this.setState({ReportingManagersEmail:RMEmail,ReviewersEmail:ReviewEmail,NotifiersEmail:NotifyEmail});
        return Formdata;
     }
     private Calculte_Indvidual_OT_Weekly_TotalTime=(Formdata)=>{
        const formdata =Formdata;
         //Weekly  and OT total Hrs calculation

         let [WeekTotal,OTTotal]=[0,0];
         let [H,M]=[0,0];
         // to iterate Weekly items
         for(var item of formdata.WeeklyItemsData)
         {
             let TotalVal=item.Total;
             WeekTotal= WeekTotal+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
         }
          H=Math.floor(WeekTotal/60);
          M=Math.floor(WeekTotal%60);
          formdata.WeeklyItemsTotalTime=(H.toString().length==1?"0"+H:H)+":"+(M.toString().length==1?"0"+M:M);
             // to iterate OT hrs
             H=0;
             M=0;
         for(var item of formdata.OTItemsData)
         {
             let TotalVal=item.Total;
             OTTotal= OTTotal+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
         } 
         H=Math.floor(OTTotal/60);
         M=Math.floor(OTTotal%60);
         formdata.OTItemsTotalTime=(H.toString().length==1?"0"+H:H)+":"+(M.toString().length==1?"0"+M:M);

         return formdata;
     }
    private handleApprove=async (event)=>
    {
        var formdata = { ...this.state.trFormdata };
        formdata=this.Calculte_Indvidual_OT_Weekly_TotalTime(formdata);
        formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
        var postObject={};
       // postObject["WeeklyTotalHrs"]=formdata.WeeklyItemsTotalTime;
        //postObject["OTTotalHrs"]=formdata.OTItemsTotalTime;
        switch(formdata.Status)
        {
            case StatusType.Submit:
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Manager","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                //postObject['Status']=StatusType.InProgress;
                postObject['Status']=StatusType.Approved;
                //postObject['PendingWith']="Reviewer";
                postObject['PendingWith']="NA";
                break;
            case StatusType.InProgress:
                formdata.CommentsHistoryData.push({"Action":StatusType.Approved,"Role":"Reviewer","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
               
                postObject['Status']=StatusType.Approved;
                postObject['PendingWith']="NA";
                break;
        }
             postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
    }
    private handleReject=async (event)=>
    {
        var formdata = { ...this.state.trFormdata};
        let data = {
            Comments:{val:this.state.trFormdata.Comments,required:true, Name: 'Comments', Type: ControlType.string, Focusid:this.Comments},
        };
        //postObject["WeeklyTotalHrs"]=formdata.WeeklyItemsTotalTime;
        //postObject["OTTotalHrs"]=formdata.OTItemsTotalTime;
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            formdata=this.Calculte_Indvidual_OT_Weekly_TotalTime(formdata);
            formdata=this.GetRequiredEmails(formdata.ClientName,formdata);
            var postObject={};
            if(formdata.Status==StatusType.Submit)
            {
                formdata.CommentsHistoryData.push({"Action":StatusType.ManagerReject,"Role":"Manager","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                postObject['Status']=StatusType.ManagerReject;
            }
            else if(formdata.Status==StatusType.Approved){
                formdata.CommentsHistoryData.push({"Action":StatusType.ReviewerReject,"Role":"Reviewer","User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                postObject['Status']=StatusType.ReviewerReject;
            }
            postObject['PendingWith']="initiator";
            postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
            postObject['IsClientApprovalNeed']=formdata.IsClientApprovalNeeded;
            this.setState({errorMessage : '',trFormdata:formdata});
            this.InsertorUpdatedata(postObject,formdata);
        }
        else
        {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }
    private handleCancel=async(event)=>
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
                //alert("Weekly Time Sheet updated successfully");
               if(StatusType.Save==formdata.Status)
               {
                this.setState({loading:false,modalTitle:'Success Message',modalText:' Weekly Timesheet Updated Successfully',isSuccess:true,showHideModal:true});
               }
               else if(StatusType.Submit==formdata.Status)
               {
                    sub="Weekly Time Sheet has been "+formdata.Status+"."
                    emaildetails ={toemail:formObject.ReportingManagersEmail,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
                    this.sendemail(emaildetails);
               }
            //    else if(StatusType.InProgress==formdata.Status)
            //    {
            //         sub="Weekly Time Sheet has been  approved by Manager."
            //          CC=this.state.EmployeeEmail;
            //         for(const mail of formObject.ReportingManagersEmail)
            //         {
            //             CC.push(mail);
            //         }
            //         emaildetails ={toemail:formObject.ReviewersEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
            //         emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
            //         this.sendemail(emaildetails);
            //    }
            else if(formObject.Status==StatusType.ReviewerReject)
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
               emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
               this.sendemail(emaildetails);
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
                    emaildetails ={toemail:formObject.NotifiersEmail,ccemail:CC,subject:sub,bodyString:sub,body:'' };
                    emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
                    this.sendemail(emaildetails);
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
                       emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+this.state.ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
                       this.sendemail(emaildetails);
               } 
            }, (error) => {
                alert("Something Went Wrong ,While updating");
                console.log(error);
            });
        } 
        else {   //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle(this.listName).items.add(formdata).then((res) => {
                    let ItemID = res.data.Id;
                    this.props.match.params.id =ItemID;
                    //alert("Weekly Time Sheet Added successfully");
                    if (StatusType.Save == formdata.Status) {
                        this.setState({loading:false,modalTitle:'Success Message',modalText:' Weekly Timesheet Added Successfully',isSuccess:true,showHideModal:true});
                    }
                    else if(StatusType.Submit==formdata.Status)
                    {
                         sub="Weekly Time Sheet has been "+formdata.Status+"."
                         emaildetails ={toemail:formObject.ReportingManagersEmail,ccemail:this.state.EmployeeEmail,subject:sub,bodyString:sub,body:'' };
                         emaildetails['body'] = this.emailBodyPreparation(this.siteURL+'/SitePages/TimeSheet.aspx#/WeeklyTimesheet/'+ItemID,tableContent,emaildetails['bodyString'],this.props.spContext.userDisplayName);
                         this.sendemail(emaildetails);
                    }
                }, (error) => {
                    console.log(error);
                    alert("Something Went Wrong ,While Adding");
                });
            }
            catch (e) {
                console.log('Failed to add');
            }

        }
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
    private sendemail(emaildetails){
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,  
            //Subject of Email  
            Subject: emaildetails.subject,  
            //Array of string for To of Email  
            To: emaildetails.toemail,  
            CC: emaildetails.ccemail
          }).then((i) => {  
            //alert("Record Updated Successfully");
            this.setState({loading:false,modalTitle:'Success Message',modalText:' Weekly Timesheet updated Successfully',isSuccess:true,showHideModal:true});
          }).catch((i) => {
            //alert("Error while sending an Email");
            this.setState({showHideModal : false,ItemID:0,errorMessage:'',loading: false,redirect : true});
            console.log(i)
          });  
    }
    private async validateDuplicateRecord(date,ClientName) {
        let prevDate = addDays(new Date(date), -1);
        let nextDate = addDays(new Date(date), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`

        let filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"

        let selectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,ReportingManager/EMail,Notifiers/EMail,*"
        let filterQuery2 = " and ClientName eq '" + ClientName + "'and Initiator/ID eq '" + this.props.spContext.userId + "'"
        filterQuery += filterQuery2;
        let ExistRecordData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).select(selectQuery).expand('Initiator,Reviewers,ReportingManager,Notifiers').get();
        console.log(ExistRecordData);
        const trFormdata= this.state.trFormdata;
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
                trFormdata.PTOHrs=JSON.parse(ExistRecordData[0].PTOHrs);
                trFormdata.NonBillableSubTotal=JSON.parse(ExistRecordData[0].NonBillableSubTotalHrs);
                trFormdata.Total=JSON.parse(ExistRecordData[0].TotalHrs);
                trFormdata.Status=ExistRecordData[0].Status;
                trFormdata.CommentsHistoryData=JSON.parse(ExistRecordData[0].CommentsHistory);
                trFormdata.SuperviserNames=JSON.parse(ExistRecordData[0].SuperviserName);
                trFormdata.Pendingwith=ExistRecordData[0].PendingWith;
                trFormdata.IsClientApprovalNeeded=ExistRecordData[0].IsClientApprovalNeed;
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
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:ExistRecordData[0].ID,EmployeeEmail:EmpEmail,errorMessage:''});
                // if(ExistRecordData[0].ClientName =='synergy'){
                //     this.setState({showBillable : true, showNonBillable: false})
                // }
                // else{
                     this.setState({showBillable : false, showNonBillable: false})
                // }
                if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:true});
                }
                else if([StatusType.Reject,StatusType.Save].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:false});
                }
               
                 //For getting Dateofjoining of selected client
                for( var item of this.state.Clients_DateOfJoinings)
                {
                    if(item.ClientName.toLowerCase()==ExistRecordData[0].ClientName.toLowerCase())
                    {
                        trFormdata.DateOfJoining=new Date(item.DOJ);
                        break;
                    }
                }
                let WeekStartDate=new Date(ExistRecordData[0].WeekStartDate);
                this.WeekHeadings=[];
                this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsMonJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay1Holiday":this.IsHoliday(WeekStartDate),
                "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsTueJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay2Holiday":this.IsHoliday(WeekStartDate),
                "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsWedJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay3Holiday":this.IsHoliday(WeekStartDate),
                "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsThuJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay4Holiday":this.IsHoliday(WeekStartDate),
                "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsFriJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay5Holiday":this.IsHoliday(WeekStartDate),
                "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsSatJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay6Holiday":this.IsHoliday(WeekStartDate),
                "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                "IsSunJoined":WeekStartDate<trFormdata.DateOfJoining,
                "IsDay7Holiday":this.IsHoliday(WeekStartDate),
                })
            }
            else{
                trFormdata.ClientName=this.state.trFormdata.ClientName;
                trFormdata.Name=this.state.trFormdata.Name;
                trFormdata.WeekStartDate=this.state.trFormdata.WeekStartDate;
                trFormdata.WeeklyItemsData=[];
                trFormdata.OTItemsData=[];
                trFormdata.BillableSubTotal=[];
                trFormdata.SynergyOfficeHrs=[];
                trFormdata.SynergyHolidayHrs=[];
                trFormdata.PTOHrs=[];
                trFormdata.NonBillableSubTotal=[];
                trFormdata.Total=[];
                trFormdata.Status=StatusType.Save;
                trFormdata.CommentsHistoryData=[];
                trFormdata.SuperviserNames=[];
                trFormdata.Pendingwith="NA";
                trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.BillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.NonBillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.Total.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
                trFormdata.ReportingManagersEmail=[];
                trFormdata.ReviewersEmail=[];
                trFormdata.NotifiersEmail=[];
                trFormdata.IsClientApprovalNeeded=false;
                for( var item of this.state.Clients_DateOfJoinings)
                {
                    if(item.ClientName.toLowerCase()==trFormdata.ClientName.toLowerCase())
                    {
                        trFormdata.DateOfJoining=new Date(item.DOJ);
                        break;
                    }
                }
                let WeekStartDate=new Date(trFormdata.WeekStartDate);
                this.WeekHeadings=[];
              
                if(trFormdata.WeekStartDate==null)
                {
                    this.WeekHeadings.push({"Mon":"",
                    "IsMonJoined":true,
                    "IsDay1Holiday":this.IsHoliday(WeekStartDate),
                    "Tue":"",
                    "IsTueJoined":true,
                    "IsDay2Holiday":this.IsHoliday(WeekStartDate),
                    "Wed":"",
                    "IsWedJoined":true,
                    "IsDay3Holiday":this.IsHoliday(WeekStartDate),
                    "Thu":"",
                    "IsThuJoined":true,
                    "IsDay4Holiday":this.IsHoliday(WeekStartDate),
                    "Fri":"",
                    "IsFriJoined":true,
                    "IsDay5Holiday":this.IsHoliday(WeekStartDate),
                    "Sat":"",
                    "IsSatJoined":true,
                    "IsDay6Holiday":this.IsHoliday(WeekStartDate),
                    "Sun":"",
                    "IsSunJoined":true,
                    "IsDay7Holiday":this.IsHoliday(WeekStartDate),
                    })
                }
                else{
                    this.WeekHeadings.push({"Mon":(new Date(WeekStartDate).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsMonJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay1Holiday":this.IsHoliday(WeekStartDate),
                    "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsTueJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay2Holiday":this.IsHoliday(WeekStartDate),
                    "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsWedJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay3Holiday":this.IsHoliday(WeekStartDate),
                    "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsThuJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay4Holiday":this.IsHoliday(WeekStartDate),
                    "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsFriJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay5Holiday":this.IsHoliday(WeekStartDate),
                    "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsSatJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay6Holiday":this.IsHoliday(WeekStartDate),
                    "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
                    "IsSunJoined":WeekStartDate<trFormdata.DateOfJoining,
                    "IsDay7Holiday":this.IsHoliday(WeekStartDate),
                    })
                }
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:0,EmployeeEmail:this.state.EmployeeEmail,isSubmitted:false,errorMessage:''});
            }
            this.hideApproveAndRejectButton()  
    }
    private handlefullClose = () => {

        this.setState({ redirect: true,ItemID: 0,showHideModal: false,errorMessage:'',loading: false });
    }
    private GetCurrentWeekMonday=(date: Date)=>
    {
        let tempCurrDate=new Date(date);
        let currWeekMonday=new Date();
        while(tempCurrDate)
        {
            if(tempCurrDate.getDay()==1)
            {
                currWeekMonday=tempCurrDate;
                break;
            }
            tempCurrDate.setDate(tempCurrDate.getDate()-1)
        }

        return currWeekMonday;
    }
    //functions related to approval process
    private hideApproveAndRejectButton() {
        let value = this.state.trFormdata.Status != StatusType.Save ? true : false;
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
        // value = value?this.state.trFormdata.Pendingwith == "Approver"?this.state.userRole == 'Approver'?true:false:this.state.trFormdata.Pendingwith == "Reviewer"?this.state.userRole == 'Reviewer'?true:false:false:false
        this.setState({ showApproveRejectbtn: value,IsReviewer:false  })
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
        else if(userGroups.includes('Timesheet Owners') || userGroups.includes('Timesheet Members')){
            isAccessable = true;
            this.setState({isSubmitted:true})
        }
        this.setState({isRecordAcessable : isAccessable})
    }
    //function related to custom Validation
    private validateTimeControls(formdata){
        let isValid={status:true,message:''};
         let val;
        let Time;
        for(let key in formdata.Total[0])
        {
            val=formdata.Total[0][key];
                let DayTime=0;
                if(!["Description","ProjectCode","Total"].includes(key))
                {
                    DayTime=( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1]));
                    if(DayTime>1440)
                    {
                         isValid.message="Total working hours in a day can not exceed '24' hours";
                          isValid.status=false;
                        document.getElementById("Total"+key).focus();
                        document.getElementById("Total"+key).classList.add('mandatory-FormContent-focus');
                          return isValid;
                    } 
                } 
        }
           val=formdata.Total[0].Total;
           Time=( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1]));
           if(Time==0)
           {
            isValid.message="Total working hours in a week can not be '00:00' hours";
            isValid.status=false;
            document.getElementById("GrandTotal").focus();
            document.getElementById("GrandTotal").classList.add('mandatory-FormContent-focus');
            return isValid;
           }
           if(formdata.ClientName.toLowerCase()!="")
           {
            if(formdata.SynergyHolidayHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
            {
                isValid.message="Description can not be blank";
                isValid.status=false;
                document.getElementById("0_Description_SynHldHrs").focus();
                document.getElementById("0_Description_SynHldHrs").classList.add('mandatory-FormContent-focus');
                return isValid;
            }
            else if(formdata.SynergyHolidayHrs[0].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
            {
                isValid.message="ProjectCode can not be blank";
                isValid.status=false;
                document.getElementById("0_ProjectCode_SynHldHrs").focus();
                document.getElementById("0_ProjectCode_SynHldHrs").classList.add('mandatory-FormContent-focus');
                return isValid;
            }
            else if(formdata.PTOHrs[0].Description.trim()=="" && formdata.IsDescriptionMandatory)
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
           if(formdata.ClientName.toLowerCase()=="synergy")
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
           else if(formdata.ClientName.toLowerCase()!="synergy")
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
                 if(formdata.OTItemsData.length>1)
                 {
                     for(let i in formdata.OTItemsData)
                     { 
                        if(formdata.OTItemsData[i].Description.trim()=="" && formdata.IsDescriptionMandatory)
                        {
                            isValid.message="Description can not be blank";
                            isValid.status=false;
                            document.getElementById(i+"_Description_otrow").focus();
                            document.getElementById(i+"_Description_otrow").classList.add('mandatory-FormContent-focus');
                           return isValid;
                        }
                        else if(formdata.OTItemsData[i].ProjectCode.trim()=="" && formdata.IsProjectCodeMandatory)
                        {
                            isValid.message="ProjectCode can not be blank";
                            isValid.status=false;
                            document.getElementById(i+"_ProjectCode_otrow").focus();
                            document.getElementById(i+"_ProjectCode_otrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
    
                     }
                 }
           }
        //is isValid true remove all 'mandatory-FormContent-focus' classes
        if (formdata.ClientName.toLowerCase() != "synergy") {
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
              document.getElementById("0_Description_SynHldHrs").classList.remove('mandatory-FormContent-focus');
              document.getElementById("0_ProjectCode_SynHldHrs").classList.remove('mandatory-FormContent-focus');
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
    private GetHolidayMasterDataByClientName= async (WeekStartDate,selectedClientName)=>
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
            HolidaysListData.filter(item => {
                HolidayData.push({"ClientName":item.ClientName,"HolidayName":item.HolidayName,"HolidayDate":item.HolidayDate})
            }); 
            this.setState({HolidaysList:HolidayData})
        }
    }
    private  IsHoliday=(CurrentWeekDay)=>{
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
                    <textarea className="form-control textareaBorder" value={Obj[i].Description}  id={i+"_Description_"+rowType}  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                </td>
                <td>      
                    <input className="form-control" value={Obj[i].ProjectCode} id={i+"_ProjectCode_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} type="text"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day1)} value={Obj[i].Mon} id={i+"_Mon_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day2)} value={Obj[i].Tue} id={i+"_Tue_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day3)} value={Obj[i].Wed} id={i+"_Wed_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day4)} value={Obj[i].Thu} id={i+"_Thu_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day5)} value={Obj[i].Fri} id={i+"_Fri_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day6)} value={Obj[i].Sat} id={i+"_Sat_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input>
                </td>
                <td>
                    <input className={"form-control time "+(this.WeekNames[0].day7)} value={Obj[i].Sun} id={i+"_Sun_"+rowType} onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input>
                </td>
                <td>
                {this.getOTBadge(rowType)}
                </td>
                <td>
                    <input className="form-control textareaBorder time WeekTotal" value={Obj[i].Total} id={i+"_Total_"+rowType} onChange={this.changeTime} type="text" readOnly></input>
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
                <td className="" >{option["Action"]}</td>
                {/* <td className="" >{option["Action"]==StatusType.InProgress?"Approved by Manager":
                option["Action"]==StatusType.Approved?"Approved by Reviewer":
                option["Action"]==StatusType.Reject?"Rejected":"Pending with initiator"}</td> */}
                <td className="" >{option["Role"]}</td>
                <td className="" >{option["User"]}</td>
                <td className="" >{option["Comments"]}</td>
                <td className="" >{(new Date(option["Date"]).getMonth().toString().length==1?"0"+(new Date(option["Date"]).getMonth()+1):new Date(option["Date"]).getMonth()+1)+"/"+(new Date(option["Date"]).getDate().toString().length==1?"0"+new Date(option["Date"]).getDate():new Date(option["Date"]).getDate())+"/"+new Date(option["Date"]).getFullYear()}</td>
            </tr>)
           ))
        }
       return body;
    }
    public render() {

        if (!this.state.isRecordAcessable) {
            
            let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
            //return (<Navigate to={url} />);
            window.location.href = url;
        }
        if (this.state.redirect) {
            let url = `/Dashboard`
            return (<Navigate to={url} />);
        }
        else{
            return (

                <React.Fragment>
                      <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                      <ModalPopUpConfirm message={'Are you sure you want to delete this row?'} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.RemoveCurrentRow} onCancel={this.CancelDeleteRow}></ModalPopUpConfirm>
            <div id="content" className="content p-2 pt-2">
            <div className="container-fluid">
            <div className='FormContent'>
                <div className="my-3 media-p-1 Billable Hours">
                <div className="title">Weekly Timesheet
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    </div>
                    <div className="col-md-4 SynergyAddress">
                    <h4>Synergy Computer Solutions, Inc.</h4>
                    <h6>30700 Telegraph Rd.  Suite 2615</h6>
                    <h6>Bingham Farms, MI  48025</h6>
                    <p id='fax'>248.723.5100   Fax: 248.723.5372</p>
                    </div>
                    <div className="row pt-2 px-2 weeklysection1">

                    <div className="col-md-4">
                                <div className="light-text">
                                    <label>Name</label>
                                    <input className="txtEmployeeName" required={true}  name="Name" title="Name" value={this.state.trFormdata.Name} readOnly />
                                </div>
                        </div>

                        <div className="col-md-4">
                                <div className="light-text clientName">
                                    <label>Client Name <span className="mandatoryhastrick">*</span></label>
                                    <select className="ddlClient" required={true}  name="ClientName" title="Client Name" onChange={this.handleClientChange} ref={this.Client} disabled={(this.currentUser==this.state.trFormdata.Name?false: this.state.isSubmitted)}>
                                                <option value=''>None</option>
                                                {this.state.ClientNames.map((option) => (
                                                    <option value={option} selected={this.state.trFormdata.ClientName==option}>{option}</option>
                                                ))}
                                    </select>
                                </div>
                        </div>

                        <div className="col-md-4 divWeeklyStartDate">
                                <div className="light-text div-readonly">
                                            {/* <label className="z-in-9">Weekly Start Date</label> */}
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
                    <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                        {/* <h4>Billable Hours</h4> */}
                        <table className="table table-bordered m-0 timetable text-center">
                                        <thead style={{ borderBottom: "4px solid #444444" }}>
                                        <tr>
                                        <th className="" ><div className="have-h"></div></th>
                                        <th className="">Description {this.state.trFormdata.IsDescriptionMandatory? <span className="mandatoryhastrick">*</span>:""}</th>
                                        <th className="projectCode">Project Code{this.state.trFormdata.IsProjectCodeMandatory? <span className="mandatoryhastrick">*</span>:""}</th>
            <th className={"weekDay "+(this.WeekNames[0].day1=="Sat"||this.WeekNames[0].day1=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day1} <span className={"day "+(this.WeekNames[0].day1=="Sat"||this.WeekNames[0].day1=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Mon}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day2=="Sat"||this.WeekNames[0].day2=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day2} <span className={"day "+(this.WeekNames[0].day2=="Sat"||this.WeekNames[0].day2=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Tue}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day3=="Sat"||this.WeekNames[0].day3=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day3} <span className={"day "+(this.WeekNames[0].day3=="Sat"||this.WeekNames[0].day3=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Wed}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day4=="Sat"||this.WeekNames[0].day4=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day4} <span className={"day "+(this.WeekNames[0].day4=="Sat"||this.WeekNames[0].day4=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Thu}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day5=="Sat"||this.WeekNames[0].day5=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day5} <span className={"day "+(this.WeekNames[0].day5=="Sat"||this.WeekNames[0].day5=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Fri}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day6=="Sat"||this.WeekNames[0].day6=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day6} <span className={"day "+(this.WeekNames[0].day6=="Sat"||this.WeekNames[0].day6=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Sat}</span></th>
            <th className={"weekDay "+(this.WeekNames[0].day7=="Sat"||this.WeekNames[0].day7=="Sun"?"color-FF9800":"")}>{this.WeekNames[0].day7} <span className={"day "+(this.WeekNames[0].day7=="Sat"||this.WeekNames[0].day7=="Sun"?"color-FF9800":"")}>{this.WeekHeadings[0].Sun}</span></th>
                                        <th><div className="px-2"></div></th>
                                        <th className="bc-e1f2ff">Total</th>
                                        <th className=""><div className="px-3"></div></th>
                                        </tr>
                                        </thead>
                            <tbody>
                                {this.state.trFormdata.ClientName.toLowerCase()=="synergy"||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                <tr id="rowPRJ1"  >
                                    <td className=" text-start"> 
                                        <div className="p-2">
                                            <strong>Billable Hours</strong>
                                        </div>
                                    </td>
                                    <td> 
                                        <textarea className="form-control textareaBorder"  value={this.state.trFormdata.WeeklyItemsData[0].Description} id="0_Description_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable}  ></textarea>
                                    </td>
                                    <td>      
                                        <input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].ProjectCode}  id="0_ProjectCode_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)}  value={this.state.trFormdata.WeeklyItemsData[0].Mon} id="0_Mon_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.WeeklyItemsData[0].Tue} id="0_Tue_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.WeeklyItemsData[0].Wed} id="0_Wed_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.WeeklyItemsData[0].Thu} id="0_Thu_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.WeeklyItemsData[0].Fri} id="0_Fri_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.WeeklyItemsData[0].Sat} id="0_Sat_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.WeeklyItemsData[0].Sun} id="0_Sun_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                    <td>
                                        <input className="form-control time WeekTotal"  value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" onChange={this.changeTime} type="text" readOnly></input>
                                    </td>
                                    <td>
                                    {/* <span className='span-fa-plus' title='Add New Row' onClick={this.CreateWeeklyHrsRow} id='addnewRow' hidden={this.state.isSubmitted}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span> */}
                                    { this.state.showBillable ? '' :this.state.isSubmitted?'':<span className='span-fa-plus' title='Add new Billable hours row'   onClick={this.CreateWeeklyHrsRow} id='addnewRow'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>}
                                    </td>
                                </tr>}
                                {this.dynamicFieldsRow("weekrow")}
                                {this.state.trFormdata.ClientName.toLowerCase()=="synergy"||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                <tr id="rowOVR1" className="font-td-bold"  >
                                    <td className=" text-start"> 
                                        <div className="p-2">
                                            <i className="fas fa-user-clock color-gray"></i> Overtime
                                        </div>
                                    </td>
                                    <td>
                                        <textarea className="form-control textareaBorder time" value={this.state.trFormdata.OTItemsData[0].Description} id="0_Description_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                                    </td>
                                    <td>
                                        <input className="form-control time" value={this.state.trFormdata.OTItemsData[0].ProjectCode}   id="0_ProjectCode_otrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.OTItemsData[0].Mon} id="0_Mon_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.OTItemsData[0].Tue} id="0_Tue_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.OTItemsData[0].Wed} id="0_Wed_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.OTItemsData[0].Thu} id="0_Thu_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.OTItemsData[0].Fri} id="0_Fri_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.OTItemsData[0].Sat} id="0_Sat_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.OTItemsData[0].Sun} id="0_Sun_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input>
                                    </td>
                                    <td>
                                        <span className="c-badge">OT</span>
                                    </td>
                                    <td>
                                        <input className="form-control time WeekTotal" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" readOnly></input>
                                    </td>
                                    <td>
                                    {/* <span className='span-fa-plus' title='Add New row'   onClick={this.CreateOTHrsRow} id='' hidden={this.state.isSubmitted}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span> */}
                                    { this.state.showBillable ? '' :this.state.isSubmitted?'':<span className='span-fa-plus' title='Add new OT hours row'   onClick={this.CreateOTHrsRow} id=''><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>}
                                    </td>
                                </tr>}
                                {this.dynamicFieldsRow("otrow")}
                                {/* <tr className='nonBillableHours'>
                                    <td colSpan={13} className="text-start greyBackground"><h4 className="my-2">Non-Billable Hours</h4></td>
                                </tr> */}
                                 {this.state.trFormdata.ClientName.toLowerCase()!="synergy"?"":
                                <tr id="SynergyOfficeHrs">
                                    <td className="text-start"><div className="p-2">Office Hours</div></td>
                                    <td><textarea className="form-control textareaBorder time"  value={this.state.trFormdata.SynergyOfficeHrs[0].Description} onChange={this.changeTime} id="0_Description_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                    <td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynOffcHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.SynergyOfficeHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.SynergyOfficeHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.SynergyOfficeHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.SynergyOfficeHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.SynergyOfficeHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.SynergyOfficeHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.SynergyOfficeHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynOffcHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input></td>
                                    <td><span className="c-badge">O</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} onChange={this.changeTime} id="0_Total_SynOffcHrs" type="text" readOnly></input></td>
                                    <td></td>
                                </tr>}
                                <tr id="SynergyHolidayHrs">
                                    <td className="text-start"><div className="p-2">Synergy Holiday</div></td>
                                    <td><textarea className="form-control textareaBorder time"  value={this.state.trFormdata.SynergyHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                    <td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynHldHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day1)+(this.WeekHeadings[0].IsDay1Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day2)+(this.WeekHeadings[0].IsDay2Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day3)+(this.WeekHeadings[0].IsDay3Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day4)+(this.WeekHeadings[0].IsDay4Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day5)+(this.WeekHeadings[0].IsDay5Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day6)+(this.WeekHeadings[0].IsDay6Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day7)+(this.WeekHeadings[0].IsDay7Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input></td>
                                    <td><span className="c-badge">H</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.SynergyHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_SynHldHrs" type="text" readOnly></input></td>
                                    <td></td>
                                </tr>
                                {this.state.trFormdata.ClientName.toLowerCase()=="synergy"?"":
                                <tr id="ClientHoliday">
                                    <td className="text-start"><div className="p-2"> Holiday</div></td>
                                    <td><textarea className="form-control textareaBorder time"  value={this.state.trFormdata.SynergyHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                    <td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynHldHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day1)+(this.WeekHeadings[0].IsDay1Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day2)+(this.WeekHeadings[0].IsDay2Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day3)+(this.WeekHeadings[0].IsDay3Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day4)+(this.WeekHeadings[0].IsDay4Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day5)+(this.WeekHeadings[0].IsDay5Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day6)+(this.WeekHeadings[0].IsDay6Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day7)+(this.WeekHeadings[0].IsDay7Holiday.isHoliday?" ClientHoliday":"")} value={this.state.trFormdata.SynergyHolidayHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynHldHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input></td>
                                    <td><span className="c-badge">H</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.SynergyHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_SynHldHrs" type="text" readOnly></input></td>
                                    <td></td>
                                </tr>}
                                <tr id="PTOHrs">
                                    <td className="text-start"><div className="p-2">PTO (Paid Time Off)</div></td>
                                    <td><textarea className="form-control textareaBorder time"  value={this.state.trFormdata.PTOHrs[0].Description} onChange={this.changeTime} id="0_Description_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable}></textarea></td>
                                    <td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_PTOHrs"   disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day1)} value={this.state.trFormdata.PTOHrs[0].Mon} onChange={this.changeTime} id="0_Mon_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day2)} value={this.state.trFormdata.PTOHrs[0].Tue} onChange={this.changeTime} id="0_Tue_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day3)} value={this.state.trFormdata.PTOHrs[0].Wed} onChange={this.changeTime} id="0_Wed_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day4)} value={this.state.trFormdata.PTOHrs[0].Thu} onChange={this.changeTime} id="0_Thu_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day5)} value={this.state.trFormdata.PTOHrs[0].Fri} onChange={this.changeTime} id="0_Fri_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day6)} value={this.state.trFormdata.PTOHrs[0].Sat} onChange={this.changeTime} id="0_Sat_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} type="time"></input></td>
                                    <td><input className={"form-control time "+(this.WeekNames[0].day7)} value={this.state.trFormdata.PTOHrs[0].Sun} onChange={this.changeTime} id="0_Sun_PTOHrs"  disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} type="time"></input></td>
                                    <td><span className="c-badge">PTO</span></td>
                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" readOnly></input></td>
                                    <td></td>
                                </tr>
        
                                {/* <tr className="font-td-bold" id="NonBillableTotal">
                                    <td className="fw-bold text-start"> 
                                        <div className="p-2">
                                            <i className="fas fa-business-time color-gray"></i> Non-Billable Subtotal
                                        </div>
                                    </td>
                                    <td colSpan={2}></td>
                                    {/* <td></td> 
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Mon} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Tue} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Wed} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Thu} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Fri} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Sat} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Sun} type="text" readOnly></input>
                                    </td>
                                    <td><span className="c-badge">NS</span></td>
                                    <td>
                                        <input className="form-control time NonBillableSubTotal" value={this.state.trFormdata.NonBillableSubTotal[0].Total} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                </tr> */}
                                 {this.state.trFormdata.ClientName.toLowerCase()=="synergy"||this.state.trFormdata.ClientName.toLowerCase()==""?"":
                                 <tr className="font-td-bold" id="BillableTotal">
                                    <td className="fw-bold text-start">
                                        <div className="p-2">
                                            <i className="fas fa-business-time color-gray"></i> Billable Total
                                        </div>
                                    </td>
                                     <td colSpan={2}>
                                    
                                    </td>
                                    {/* <td>   
                                    </td> */}
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalMon" value={this.state.trFormdata.BillableSubTotal[0].Mon} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalTue" value={this.state.trFormdata.BillableSubTotal[0].Tue} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalWed" value={this.state.trFormdata.BillableSubTotal[0].Wed} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalThu" value={this.state.trFormdata.BillableSubTotal[0].Thu} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalFri" value={this.state.trFormdata.BillableSubTotal[0].Fri} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sat} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sun} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <span className="c-badge">BS</span>
                                    </td>
                                    <td>
                                        <input className="form-control time BillableSubTotal" id="BillableTotal" value={this.state.trFormdata.BillableSubTotal[0].Total}  type="text" readOnly></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                </tr>}
                                <tr className="font-td-bold" id="GrandTotalRow">
                                    <td className="fw-bold text-start"> 
                                        <div className="p-2">
                                            <i className="fas fa-business-time color-gray"></i> Total
                                        </div>
                                    </td>
                                    <td colSpan={2}></td>
                                    {/* <td></td> */}
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalMon" value={this.state.trFormdata.Total[0].Mon} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalTue" value={this.state.trFormdata.Total[0].Tue} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalWed" value={this.state.trFormdata.Total[0].Wed} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalThu" value={this.state.trFormdata.Total[0].Thu} type="text" readOnly></input>
                                    </td>
                                    <td> 
                                        <input className="form-control time DayTotal" id="TotalFri" value={this.state.trFormdata.Total[0].Fri} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalSat" value={this.state.trFormdata.Total[0].Sat} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        <input className="form-control time DayTotal" id="TotalSun" value={this.state.trFormdata.Total[0].Sun} type="text" readOnly></input>
                                    </td>
                                    <td><span className="c-badge">T</span></td>
                                    <td>
                                        <input className="form-control time GrandTotal" id="GrandTotal" value={this.state.trFormdata.Total[0].Total} type="text" readOnly></input>
                                    </td>
                                    <td>
                                        
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="light-box border-box-shadow m-1 p-2 pt-3">
                                                    <div className="media-px-12,col-md-9">
                                                        <div className="light-text height-auto">
                                                            <label className="floatingTextarea2 top-11">Comments </label>
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
                        {/* <div className="col-md-6">
                                <div className="light-text div-readonly col-md-3">
                                    <label className="z-in-9">Date Submitted</label>
                                        <input className="form-control"  name="Name" title="DateSubmitted" value={(this.state.trFormdata.DateSubmitted.getMonth()+1)+"/"+this.state.trFormdata.DateSubmitted.getDate()+"/"+this.state.trFormdata.DateSubmitted.getFullYear()}  disabled={true} />
                                </div>
                                <div className="light-text div-readonly col-md-3">
                                    <label>Superviser Names</label>
                                    <div className="light-text div-readonly">
                                        <div className="" id="SuperviserNames">
                                            {this.state.trFormdata.SuperviserNames.map((option) => (
                                                <label>{option}</label>
                                            ))}
                                        </div>
                                    </div>
        
                                </div>
                        </div> */}
                
                    </div>
                    <div className="row">
                        <div className="col-md-12"><hr></hr></div>
                        <div className="col-md-12 text-center mt-3">
                            {/* <button type="button" id="btnApprove" onClick={this.handleApprove} hidden={!(this.state.isSubmitted) && ( (this.state.trFormdata.Pendingwith=="Approver" && this.state.userRole=="Approver")?false:(this.state.trFormdata.Pendingwith=="Reviewer" && this.state.userRole=="Reviewer")?false:true )} className="SubmitButtons btn">Approve</button>
                            <button type="button" id="btnReject" onClick={this.handleReject} hidden={!(this.state.isSubmitted) && ( (this.state.trFormdata.Pendingwith=="Approver" && this.state.userRole=="Approver")?false:(this.state.trFormdata.Pendingwith=="Reviewer" && this.state.userRole=="Reviewer")?false:true )} className="CancelButtons btn">Reject</button> */}
                            {this.state.showApproveRejectbtn&&!this.state.IsReviewer?<button type="button" id="btnApprove" onClick={this.handleApprove} className="SubmitButtons btn">Approve</button>:''}
                            {this.state.showApproveRejectbtn?<button type="button" id="btnReject" onClick={this.handleReject}  className="RejectButtons btn">Reject</button>:''}
                            {this.state.isSubmitted?'': <button type="button" id="btnSubmit" onClick={this.handleSubmitorSave} className="SubmitButtons btn">Submit</button>}
                            {this.state.isSubmitted?'':  <button type="button" id="btnSave" onClick={this.handleSubmitorSave} className="SaveButtons btn">Save</button>}
                            <button type="button" id="btnCancel" onClick={this.handleCancel} className="CancelButtons btn">Cancel</button>
                        </div>
                        
                    </div>
                    {/* Error Message */}
                        <div>
                        <span className='text-validator'> {this.state.errorMessage}</span>
                        </div>
                       {this.state.trFormdata.CommentsHistoryData.length>0? <><div className="p-2">
                                            <h4>Action History</h4>
                                        </div><div>
                                                <table className="table table-bordered m-0 timetable text-center">
                                                    <thead style={{ borderBottom: "4px solid #444444" }}>
                                                        <tr>
                                                            <th className="">Action</th>
                                                            <th className="">Action By</th>
                                                            <th className="">User</th>
                                                            <th className="">Comments</th>
                                                            <th className=""> Action Date</th>
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
        </div>
            {this.state.loading && <Loader />}
                </React.Fragment>
            );
    
        }
       
    }
}
export default WeeklyTimesheet;