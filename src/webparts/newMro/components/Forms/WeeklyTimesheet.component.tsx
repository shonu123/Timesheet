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
import { NavLink } from 'react-router-dom';
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
        WeekHeadings:any,
        SuperviserIds:any,
        ReviewerIds:any,
        NotifierIds:any,

    };
    ClientNames:any;
    SuperviserNames:any;
    Reviewers:any,
    Notifiers:any,
    currentWeeklyRowsCount:any,
    currentOTRowsCount:any,
    ItemID:any,
    userRole:string,
   
  

    SaveUpdateText: string;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    isNewform: boolean;
    isSubmitted:boolean;
}

class WeeklyTimesheet extends Component<WeeklyTimesheetProps, WeeklyTimesheetState> {
    private siteURL: string;
    private oweb;
    private currentUser :string;
    private currentUserId:number;
    private listName = 'WeeklyTimeSheet';
    private Client;
    private WeekHeadings=[];
    constructor(props: WeeklyTimesheetProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.currentUser=this.props.spContext.userDisplayName;
        this.currentUserId=this.props.spContext.userId;
        this.Client=React.createRef();
        this.state = {
          
            trFormdata: {
                ClientName: '',
                Name: this.currentUser,
                WeekStartDate:this.GetCurrentWeekMonday(new Date()),
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
                WeekHeadings:[],
                SuperviserIds:[],
                ReviewerIds:[],
                NotifierIds:[],

               
            },
            ClientNames:[],
            SuperviserNames:[],
            Reviewers:[],
            Notifiers:[],
            currentWeeklyRowsCount:1,
            currentOTRowsCount:1,
            ItemID:0,
            userRole:"",
          
           
           

            SaveUpdateText:StatusType.Save,
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            isNewform: true,
            isSubmitted:false,
        };
        this.oweb = Web(this.props.spContext.siteAbsoluteUrl);
         // for first row of weekly and OT hrs
         const trFormdata = { ...this.state.trFormdata };
          let WeekStartDate=trFormdata.WeekStartDate;
         trFormdata.WeeklyItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.OTItemsData.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.BillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.SynergyOfficeHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.SynergyHolidayHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.PTOHrs.push({Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.NonBillableSubTotal.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         trFormdata.Total.push({Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00',});
         this.WeekHeadings.push({"Mon":(WeekStartDate.getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
         })
         this.setState({ trFormdata});
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
         this.setState({ loading: false });
         this.loadWeeklyTimeSheetData();
    
    }
    //functions related to  initial loading
     private async loadWeeklyTimeSheetData() {
       
        var ClientNames: any = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(" Employee/Id eq "+this.currentUserId).select("ClientName , Employee/Title,Employee/Id,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,*").orderBy("Employee/Title").expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();
        console.log(ClientNames);
        ClientNames.filter(item => {
              this.state.ClientNames.push(item.ClientName);
              if(item.hasOwnProperty("ReportingManager"))
              item.ReportingManager.map(i=>(this.state.SuperviserNames.push({"ClientName":item.ClientName,"ReportingManager":i.Title,"ReportingManagerId":i.Id})));
              if(item.hasOwnProperty("Reviewers"))
              item.ReportingManager.map(i=>(this.state.Reviewers.push({"ClientName":item.ClientName,"ReviewerId":i.Id})));
              if(item.hasOwnProperty("Notifiers"))
              item.ReportingManager.map(i=>(this.state.Notifiers.push({"ClientName":item.ClientName,"NotifierId":i.Id})));

        }); 
        let groups = await sp.web.currentUser.groups();
        console.log("current user deatils")
        console.log(this.props.context.pageContext)

        let userGroup = groups[0].Title
        let user = userGroup=='Timesheet Initiators' ?'Initiator': userGroup=='Timesheet Approvers'?'Approver':userGroup=='Timesheet Reviewers'?'Reviewer':'Administrator'
        console.log('You are :'+user)
        this.setState({ClientNames: this.state.ClientNames,userRole : user})
        if(this.props.match.params.id != undefined){
            console.log(this.props.match.params.id)
            this.setState({ItemID : this.props.match.params.id})
            this.getItemData()
        }

    }
    private async getItemData(){
        let filterQuery = "ID eq '"+this.state.ItemID+"'";
        let selectQuery = "*";
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).get();
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

        if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(data[0].Status))
        {
            this.setState({isSubmitted:true});
        }
    
        this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length});
    }

    //functions related to calculation
    private WeekStartDateChange = (dateprops) => {
        let date=new Date(dateprops[0]);
        let WeekStartDate=new Date(date);
        const Formdata = { ...this.state.trFormdata };
            Formdata.WeekStartDate=date;
            this.WeekHeadings=[];
            this.WeekHeadings.push({"Mon":(WeekStartDate.getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Tue":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Wed":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Thu":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Fri":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Sat":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            "Sun":(new Date(WeekStartDate.setDate(WeekStartDate.getDate()+1)).getDate().toString().length == 1 ? "0" +WeekStartDate.getDate() :WeekStartDate.getDate()),
            })
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
        console.log(this.state);
        for( var item of this.state.SuperviserNames)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.SuperviserNames.push(item.ReportingManager);
                Formdata.SuperviserIds.push(item.ReportingManagerId);
            }
        }
        for( var item of this.state.Reviewers)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.ReviewerIds.push(item.ReviewerId);
            }
        }
        for( var item of this.state.Notifiers)
        {
            if(item.ClientName.toLowerCase()==clientVal.toLowerCase())
            {
                Formdata.NotifierIds.push(item.NotifierId);
            }
        }
        this.validateDuplicateRecord(Formdata.WeekStartDate,clientVal);
        this.setState({trFormdata:Formdata});
     }
    private handleChange = (event) => {
        const formData = { ...this.state.trFormdata };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        formData[name] = value != 'None' ? value : null;
        this.setState({trFormdata:formData});
    }
    private changeTime=(event)=>{
        const trFormdata = { ...this.state.trFormdata };
        let value=event.target.value;
        let index=parseInt(event.target.id.split("_")[0]);
        let prop=event.target.id.split("_")[1];
        let rowType=event.target.id.split("_")[2];

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
             trFormdata.NonBillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
             trFormdata.NonBillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

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
                <td> </td>
                <td> 
                    <input className="form-control" value={Obj[i].Description}  id={i+"_Description_"+rowType}  onChange={this.changeTime} type="text"></input>
                </td>
                <td>      
                    <input className="form-control" value={Obj[i].ProjectCode} id={i+"_ProjectCode_"+rowType} onChange={this.changeTime} type="text"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Mon" value={Obj[i].Mon} id={i+"_Mon_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Tue" value={Obj[i].Tue} id={i+"_Tue_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Wed" value={Obj[i].Wed} id={i+"_Wed_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Thu" value={Obj[i].Thu} id={i+"_Thu_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Fri" value={Obj[i].Fri} id={i+"_Fri_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Sat" value={Obj[i].Sat} id={i+"_Sat_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                    <input className="form-control time changerowPRJ1 Sun" value={Obj[i].Sun} id={i+"_Sun_"+rowType} onChange={this.changeTime} type="time"></input>
                </td>
                <td>
                {this.getOTBadge(rowType)}
                </td>
                <td>
                    <input className="form-control time Total" value={Obj[i].Total} id={i+"_Total_"+rowType} onChange={this.changeTime} type="text" disabled></input>
                </td>
                <td onClick={this.RemoveCurrentRow} id={i+"_"+rowType}>
                <span className="span-fa-close"><i className='fas fa-plus'></i></span>
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
    private RemoveCurrentRow=(event)=>{
        let RowType=event.target.id.split("_")[1];
        let rowCount=event.target.id.split("_")[0]
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
            this.setState({trFormdata, currentWeeklyRowsCount: count});

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
            this.setState({ trFormdata, currentOTRowsCount: count});
        }
    }
    private CreateWeeklyHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
        let count = WeeklyRowsCount + 1;
        let newObj={Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00'};
        trFormdata.WeeklyItemsData.push(newObj);
        this.setState({ trFormdata, currentWeeklyRowsCount: count });
    }
    private CreateOTHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let OTRowsCount = this.state.currentOTRowsCount;
        let count = OTRowsCount + 1;
        let newObj={Description:'',ProjectCode:'',Mon: '00:00',Tue: '00:00',Wed:'00:00',Thu: '00:00',Fri: '00:00',Sat: '00:00',Sun: '00:00',Total: '00:00'};

        trFormdata.OTItemsData.push(newObj);
        this.setState({ trFormdata, currentOTRowsCount: count });
    }
     

    private bindComments=()=>{
        let body=[];
        if( this.state.trFormdata.CommentsHistoryData.length>0)
        {
            this.state.trFormdata.CommentsHistoryData.map((option) => (
                body.push(<tr>
                <td className="" >{option["Action"]}</td>
                <td className="" >{option["Role"]}</td>
                <td className="" >{option["User"]}</td>
                <td className="" >{option["Comments"]}</td>
                <td className="" >{(new Date(option["Date"]).getMonth().toString().length==1?"0"+new Date(option["Date"]).getMonth():new Date(option["Date"]).getMonth())+"-"+(new Date(option["Date"]).getDate().toString().length==1?"0"+new Date(option["Date"]).getDate():new Date(option["Date"]).getDate())+"-"+new Date(option["Date"]).getFullYear()}</td>
            </tr>)
           ))
        }
       return body;
    }
    //functions related to CRUD operations
   private handleSubmit = async (event) => {
        event.preventDefault();
        let btnId=event.target.id;
        let data = {
            ClientName:{val:this.state.trFormdata.ClientName,required:true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client},
            WeeklyStartDate:{val: this.state.trFormdata.WeekStartDate, required:true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid:"divWeekStartDate"}
        };
        const formdata = { ...this.state.trFormdata };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

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

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            console.log(this.state);
            var postObject = {
                Name : this.state.trFormdata.Name,
                ClientName : this.state.trFormdata.ClientName, 
                WeekStartDate:new Date(this.state.trFormdata.WeekStartDate),
                WeeklyHrs:JSON.stringify(this.state.trFormdata.WeeklyItemsData),
                OverTimeHrs:JSON.stringify(this.state.trFormdata.OTItemsData),
                BillableSubtotalHrs:JSON.stringify(this.state.trFormdata.BillableSubTotal),
                SynergyOfficeHrs:JSON.stringify(this.state.trFormdata.SynergyOfficeHrs),
                SynergyHolidayHrs:JSON.stringify(this.state.trFormdata.SynergyHolidayHrs),
                PTOHrs:JSON.stringify(this.state.trFormdata.PTOHrs),
                NonBillableSubTotalHrs:JSON.stringify(this.state.trFormdata.NonBillableSubTotal),
                TotalHrs:JSON.stringify(this.state.trFormdata.Total),
                SuperviserName:JSON.stringify(this.state.trFormdata.SuperviserNames),
                InitiatorId:this.currentUserId,
                BillableTotalHrs:this.state.trFormdata.BillableSubTotal[0].Total,
                NonBillableTotalHrs:this.state.trFormdata.NonBillableSubTotal[0].Total,
                GrandTotal:this.state.trFormdata.Total[0].Total,
                WeeklyTotalHrs:formdata.WeeklyItemsTotalTime,
                OTTotalHrs:formdata.OTItemsTotalTime,
                ReportingManagerId:{"results":formdata.SuperviserIds},
                ReviewersId:{"results":formdata.ReviewerIds},
                NotifiersId:{"results":formdata.NotifierIds}

            }
            switch(btnId.toLowerCase())
            {
                case "btnsave":
                    formdata.CommentsHistoryData.push({"Action":StatusType.Save,"Role":this.state.userRole,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    postObject['Status']=StatusType.Save;
                    postObject['PendingWith']="";
                   
                    break;
                case "btnsubmit":
                    formdata.CommentsHistoryData.push({"Action":StatusType.Submit,"Role":this.state.userRole,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    postObject['Status']=StatusType.Submit;
                    postObject['PendingWith']="Approver";
                    postObject['DateSubmitted']=new Date();
                    break;
                case "btnapprove":
                    formdata.CommentsHistoryData.push({"Action":StatusType.InProgress,"Role":this.state.userRole,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    postObject['Status']=StatusType.InProgress;
                    postObject['PendingWith']="Reviewer";
                    break;
                case "btnreject":
                    formdata.CommentsHistoryData.push({"Action":StatusType.Reject,"Role":this.state.userRole,"User":this.currentUser,"Comments":this.state.trFormdata.Comments,"Date":new Date()})
                    postObject['Status']=StatusType.Reject;
                    postObject['PendingWith']="";
                    break;
    
            }
                 postObject["CommentsHistory"]=JSON.stringify(formdata.CommentsHistoryData),
                this.setState({errorMessage : '',trFormdata:formdata});
                this.InsertorUpdatedata(postObject);
         
        } 
        else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }
    private InsertorUpdatedata(formdata) {
        this.setState({ loading: true });
        if (this.state.ItemID!=0) { //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then((res) => {
                alert("Weekly Time Sheet updated successfully");
                this.setState({ loading: false });
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
                    alert("Weekly Time Sheet Added successfully");
                    this.setState({ loading: false });
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
    private async validateDuplicateRecord(date,ClientName) {

            let filterQuery = "WeekStartDate eq '"+(date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear()+"' and ClientName eq '"+ClientName+"' and Initiator/ID eq '"+this.currentUserId+"'"
            let selectQuery = "WeekStartDate,ClientName,Initiator/ID,*"
            let ExistRecordData= await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand("Initiator").orderBy('WeekStartDate').get();
            console.log(ExistRecordData);
            if(ExistRecordData.length>=1)
            {
                const trFormdata= this.state.trFormdata;
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
                if([StatusType.Submit,StatusType.Approved,StatusType.InProgress].includes(ExistRecordData[0].Status))
                {
                    this.setState({isSubmitted:true});
                }
               
                this.setState({ trFormdata:trFormdata,currentWeeklyRowsCount:trFormdata.WeeklyItemsData.length,currentOTRowsCount: trFormdata.OTItemsData.length,ItemID:ExistRecordData[0].ID});
            }
           
          
    }
    private handlefullClose = () => {

        this.setState({ showHideModal: false,ItemID: 0 });
    }

    //functions related to Weekly start date enable only past two weeks monda dates 
    private isDisabled = (date: Date) => !this.isWithinPastTwoWeeksMonday(date);

    private isWithinPastTwoWeeksMonday = (date: Date) => {
        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
     
        return date >= twoWeeksAgo && date <= today && this.isMonday(date);
      };
    private isMonday = (date: Date) => date.getDay() === 1

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

    public render() {
        return (

            <React.Fragment>
                  <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp>
<div className="container-fluid">
		<div className="my-3 media-p-1 Billable Hours">
            <div className="col-md-4 SynergyAddress">
            <h1>Synergy Computer Solutions, Inc.</h1>
            <h2>30700 Telegraph Rd.  Suite 2615</h2>
            <h2>Bingham Farms, MI  48025</h2>
            <h2>248.723.5100</h2>
            </div>
		<div className="col-md-4">
			<div className="light-text">
				<label>Client Name <span className="mandatoryhastrick">*</span></label>
				<select className="form-control" required={true} name="ClientName" title="ClientName" onChange={this.handleClientChange}  ref={this.Client} disabled={this.state.isSubmitted}>
					<option value='None'>None</option>
					{this.state.ClientNames.map((option) => (
						<option value={option} selected={this.state.trFormdata.ClientName != ''}>{option}</option>
					))}
				</select>
			</div>
            <div className="col-md-4">
                <div className="light-text">
                    <label>Name</label>
                    <input className="form-control" required={true} placeholder="" name="Name" title="Name" value={this.currentUser} disabled={true} />
                </div>
            </div>
            <div className="col-md-4">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Weekly Start Date</label>
                            <div className="custom-datepicker" id="divWeekStartDate">
                                <DatePicker 
                                onDatechange={this.WeekStartDateChange} 
                                selectedDate={this.state.trFormdata.WeekStartDate} 
                                name="WeeklyStartDate" 
                                id="txtWeekStartDate"
                                filterData={this.isDisabled}
                                disabled={this.state.isSubmitted}
                                 
                                />
                                
                            </div>
                        </div>
            </div>
		</div>
			<div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
				<h4>Billable Hours</h4>
				<table className="table table-bordered m-0 timetable text-center">
                                <thead style={{ borderTop: "8px solid #9E9D9E" }}>
                                    <tr>
                                        <th className="" ><div className="have-h"></div></th>
                                        <th className="">Description</th>
                                        <th className="">Project Code</th>
                                        <th>Mon <span className="day">{this.WeekHeadings[0].Mon}</span></th>
                                        <th>Tue <span className="day">{this.WeekHeadings[0].Tue}</span></th>
                                        <th>Wed <span className="day">{this.WeekHeadings[0].Wed}</span></th>
                                        <th>Thu <span className="day">{this.WeekHeadings[0].Thu}</span></th>
                                        <th>Fri <span className="day">{this.WeekHeadings[0].Fri}</span></th>
                                        <th className="color-FF9800">Sat <span className="day color-FF9800">{this.WeekHeadings[0].Sat}</span></th>
                                        <th className="color-FF9800">Sun <span className="day color-FF9800">{this.WeekHeadings[0].Sun}</span></th>
                                        <th><div className="px-2"></div></th>
                                        <th className="bc-e1f2ff">Total</th>
                                        <th className=""><div className="px-3"></div></th>
                                    </tr>
                                </thead>
					<tbody>
						
						<tr id="rowPRJ1">
							<td> </td>
							<td> 
								<input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].Description} id="0_Description_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted}  type="text"></input>
							</td>
							<td>      
								<input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].ProjectCode} id="0_ProjectCode_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="text"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Mon"  value={this.state.trFormdata.WeeklyItemsData[0].Mon} id="0_Mon_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Tue" value={this.state.trFormdata.WeeklyItemsData[0].Tue} id="0_Tue_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Wed" value={this.state.trFormdata.WeeklyItemsData[0].Wed} id="0_Wed_weekrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Thu" value={this.state.trFormdata.WeeklyItemsData[0].Thu} id="0_Thu_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Fri" value={this.state.trFormdata.WeeklyItemsData[0].Fri} id="0_Fri_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Sat" value={this.state.trFormdata.WeeklyItemsData[0].Sat} id="0_Sat_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Sun" value={this.state.trFormdata.WeeklyItemsData[0].Sun} id="0_Sun_weekrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								
							</td>
							<td>
								<input className="form-control time Total"  value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" onChange={this.changeTime} type="text" disabled></input>
							</td>
							<td>
                            {/* <span  onClick={this.CreateWeeklyHrsRow} className="add-button" hidden={false} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span> */}
                            <span className="span-fa-plus" onClick={this.CreateWeeklyHrsRow} ><i className='fas fa-plus'></i></span>
							</td>
						</tr>
                        {this.dynamicFieldsRow("weekrow")}
						<tr id="rowOVR1" className="font-td-bold">
							<td className=" text-start"> 
								<div className="p-2">
									<i className="fas fa-user-clock color-gray"></i> Overtime
								</div>
							</td>
							<td>
                                <input className="form-control time" value={this.state.trFormdata.OTItemsData[0].Description} id="0_Description_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="text"></input>
                            </td>
							<td>
                                <input className="form-control time" value={this.state.trFormdata.OTItemsData[0].ProjectCode}  id="0_ProjectCode_otrow"  onChange={this.changeTime}  disabled={this.state.isSubmitted} type="text"></input>
                            </td>
							<td>
								<input className="form-control time changerowOVR1 Mon" value={this.state.trFormdata.OTItemsData[0].Mon} id="0_Mon_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Tue" value={this.state.trFormdata.OTItemsData[0].Tue} id="0_Tue_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Wed" value={this.state.trFormdata.OTItemsData[0].Wed} id="0_Wed_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Thu" value={this.state.trFormdata.OTItemsData[0].Thu} id="0_Thu_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Fri" value={this.state.trFormdata.OTItemsData[0].Fri} id="0_Fri_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Sat" value={this.state.trFormdata.OTItemsData[0].Sat} id="0_Sat_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Sun" value={this.state.trFormdata.OTItemsData[0].Sun} id="0_Sun_otrow" onChange={this.changeTime}  disabled={this.state.isSubmitted} type="time"></input>
							</td>
							<td>
								<span className="c-badge">OT</span>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" disabled></input>
							</td>
							<td>
                            {/* <span  onClick={this.CreateOTHrsRow}  className="add-button" hidden={false} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span> */}
                            <span className="span-fa-plus" onClick={this.CreateOTHrsRow} ><i className='fas fa-plus'></i></span>
							</td>
						</tr>
                        {this.dynamicFieldsRow("otrow")}
						<tr className="font-td-bold" id="BillableTotal">
							<td className="fw-bold text-start"> 
								<div className="p-2">
									<i className="fas fa-business-time color-gray"></i> Billable Subtotal
								</div>
							</td>
							<td>
                               
                            </td>
							<td>
                                
                            </td>
							<td>
								<input className="form-control time" id="BillableTotalMon" value={this.state.trFormdata.BillableSubTotal[0].Mon} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalTue" value={this.state.trFormdata.BillableSubTotal[0].Tue} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalWed" value={this.state.trFormdata.BillableSubTotal[0].Wed} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalThu" value={this.state.trFormdata.BillableSubTotal[0].Thu} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalFri" value={this.state.trFormdata.BillableSubTotal[0].Fri} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sat} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sun} type="text" disabled></input>
							</td>
							<td>
								<span className="c-badge">BS</span>
							</td>
							<td>
								<input className="form-control time" id="BillableTotal" value={this.state.trFormdata.BillableSubTotal[0].Total}  type="text" disabled></input>
							</td>
							<td>
								
							</td>
						</tr>
						
						<tr>
							<td colSpan={13} className="text-start"><h4 className="my-2">NonBillable Hours</h4></td>
						</tr>
						<tr id="SynergyOfficeHrs">
							<td className="text-start"><div className="p-2">Synergy Office Hours</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Description} onChange={this.changeTime} id="0_Description_SynOffcHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynOffcHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynOffcHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><span className="c-badge">O</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} onChange={this.changeTime} id="0_Total_SynOffcHrs" type="text" disabled></input></td>
							<td></td>
						</tr>
						<tr id="SynergyHolidayHrs">
							<td className="text-start"><div className="p-2">Synergy Holiday</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_SynHldHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynHldHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynHldHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><span className="c-badge">H</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_SynHldHrs" type="text" disabled></input></td>
							<td></td>
						</tr>
						<tr id="PTOHrs">
							<td className="text-start"><div className="p-2">PTO (Paid Time Off)</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Description} onChange={this.changeTime} id="0_Description_PTOHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_PTOHrs"  disabled={this.state.isSubmitted} type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Mon} onChange={this.changeTime} id="0_Mon_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Tue} onChange={this.changeTime} id="0_Tue_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Wed} onChange={this.changeTime} id="0_Wed_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Thu} onChange={this.changeTime} id="0_Thu_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Fri} onChange={this.changeTime} id="0_Fri_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Sat} onChange={this.changeTime} id="0_Sat_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Sun} onChange={this.changeTime} id="0_Sun_PTOHrs"  disabled={this.state.isSubmitted} type="time"></input></td>
							<td><span className="c-badge">PTO</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" disabled></input></td>
							<td></td>
						</tr>

						<tr className="font-td-bold" id="NonBillableTotal">
							<td className="fw-bold text-start"> 
								<div className="p-2">
									<i className="fas fa-business-time color-gray"></i> NonBillable Subtotal
								</div>
							</td>
							<td></td>
							<td></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Mon} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Tue} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Wed} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Thu} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Fri} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Sat} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Sun} type="text" disabled></input>
							</td>
							<td><span className="c-badge">NS</span></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Total} type="text" disabled></input>
							</td>
							<td>
								
							</td>
						</tr>
						<tr className="font-td-bold" id="GrandTotal">
							<td className="fw-bold text-start"> 
								<div className="p-2">
									<i className="fas fa-business-time color-gray"></i> Total
								</div>
							</td>
							<td></td>
							<td></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Mon} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Tue} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Wed} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Thu} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Fri} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Sat} type="text" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Sun} type="text" disabled></input>
							</td>
							<td><span className="c-badge">T</span></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Total} type="text" disabled></input>
							</td>
							<td>
								
							</td>
						</tr>
					</tbody>
				</table>
                <div className="light-box border-box-shadow m-1 p-2 pt-3">
                                            <div className="media-px-12">

                                                <div className="light-text height-auto">
                                                    <label className="floatingTextarea2 top-11">Comments </label>
                                                    <textarea className="position-static form-control requiredinput" onChange={this.handleChange} value={this.state.trFormdata.Comments} placeholder="" maxLength={500} id="txtComments" name="Comments"  disabled={false}></textarea>
                                                </div>
                                            </div>
                </div>
                <div className="col-md-3">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Date Submitted</label>
                            <div className="custom-datepicker" id="divDateSubmitted">
                                <DatePicker onDatechange={this.WeekStartDateChange} selectedDate={this.state.trFormdata.DateSubmitted} name="WeeklyStartDate" id="txtWeekStartDate" hidden={!(this.state.isSubmitted)} disabled/>
                            </div>
                        </div>
                        <div className="light-text div-readonly">
                            <label>Superviser Names</label>
                            <div className="light-text div-readonly">
                                <div className="" id="SuperviserNames">
                                    {/* {this.state.SuperviserNames.map((option) => (
                                        <h3>{option}</h3>
                                    ))} */}
                                </div>
                            </div>

                        </div>
                </div>
           
			</div>
			<div className="row">
				<div className="col-md-12"><hr></hr></div>
				<div className="col-md-12 text-center mt-3">
                    <button type="button" id="btnApprove" onClick={this.handleSubmit} hidden={!(this.state.isSubmitted)} className="SubmitButtons">Approve</button>
                    <button type="button" id="btnReject" onClick={this.handleSubmit} hidden={!(this.state.isSubmitted)} className="CancelButtons">Reject</button>
					<button type="button" id="btnSubmit" onClick={this.handleSubmit} hidden={this.state.isSubmitted} className="SubmitButtons">Submit</button>
					<button type="button" id="btnSave" onClick={this.handleSubmit} hidden={this.state.isSubmitted} className="SaveButtons">Save</button>
                    <button type="button" id="btnCancel" className="CancelButtons">Cancel</button>
				</div>
			</div>
                        <div className="p-2">
                         Comments History
                        </div>
                        <div>
                        <table className="table table-bordered m-0 timetable text-center">
                                <thead style={{ borderTop: "8px solid #9E9D9E" }}>
                                    <tr>
                                        <th className="" >Action</th>
                                        <th className="" >Role</th>
                                        <th className="" >User</th>
                                        <th className="" >Comments</th>
                                        <th className="" >Date</th>
                                    </tr>
                                </thead>
					<tbody>
                    {this.bindComments()}
						
					</tbody>
				</table>
                        </div>
		</div>
	</div>
            </React.Fragment>
        );

    }
}
export default WeeklyTimesheet;