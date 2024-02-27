import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
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
    formData: {
        ClientName: string,
        Name: string,
        WeekStartDate: Date,
        WeeklyHrs: string,
        OverTimeHrs: string,
        BillableSubtotalHrs:string,
        SynergyOfficeHrs: string,
        SynergyHolidayHrs: string,
        PTOHrs: string,
        NonBillableSubTotalhrs: string,
        TotalHrs:string,
        Status: string,
        Comments: string,
        DateSubmitted :Date,
        SuperviserName:string,
       
    };
    trFormdata: {
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
        Commentsdata: any,
    };
    ClientNames:any;
    SuperviserNames:any;
    currentWeeklyRowsCount:any,
    currentOTRowsCount:any,

    SaveUpdateText: string;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    isNewform: boolean;
}

class WeeklyTimesheet extends Component<WeeklyTimesheetProps, WeeklyTimesheetState> {
    private siteURL: string;
    private oweb;
    private currentUser :string;
    private currentUserId:number;
    private listName = 'WeeklyTimeSheet';
    constructor(props: WeeklyTimesheetProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.currentUser=this.props.spContext.userDisplayName;
        this.currentUserId=this.props.spContext.userId;
        this.state = {
            formData: {
                ClientName: '',
                Name: this.currentUser,
                WeekStartDate: new Date(),
                WeeklyHrs: '',
                OverTimeHrs: '',
                BillableSubtotalHrs:'',
                SynergyOfficeHrs: '',
                SynergyHolidayHrs: '',
                PTOHrs: '',
                NonBillableSubTotalhrs: '',
                TotalHrs:'',
                Status: '',
                Comments: '', 
                DateSubmitted :new Date(),
                SuperviserName:'',
               

            },
            trFormdata: {
                WeeklyItemsData: [],
                OTItemsData:[],
                BillableSubTotal:[],
                SynergyOfficeHrs:[],
                SynergyHolidayHrs:[],
                PTOHrs:[],
                NonBillableSubTotal:[],
                Total:[],
                Pendingwith: '',
                Comments: '',
                Commentsdata: [],
            },
            ClientNames:[],
            SuperviserNames:[],
            currentWeeklyRowsCount:1,
            currentOTRowsCount:1,

            SaveUpdateText: 'Submit',
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            isNewform: true,
        };
        this.oweb = Web(this.props.spContext.siteAbsoluteUrl);
         // for first row of weekly and OT hrs
         const trFormdata = { ...this.state.trFormdata };
         trFormdata.WeeklyItemsData.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.OTItemsData.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.BillableSubTotal.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.SynergyOfficeHrs.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.SynergyHolidayHrs.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.PTOHrs.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.NonBillableSubTotal.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         trFormdata.Total.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
         this.setState({ trFormdata});
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
         this.setState({ loading: false });
         this.loadWeeklyTimeSheetData();
    
    }
     private async loadWeeklyTimeSheetData() {
       
        var ClientNames: any = await this.oweb.lists.getByTitle('EmployeeMaster').items.select("ClientName , Employee/Title, Employee/Id,Approvers/Title,*").orderBy("Employee/Title").expand("Employee,Approvers").getAll();
        console.log(ClientNames);
        ClientNames.filter(item => {
            if (item.Employee.Id == this.currentUserId) {
              this.state.ClientNames.push(item.ClientName);
              if(item.hasOwnProperty("Approvers"))
              item.Approvers.map(i=>(this.state.SuperviserNames.push({"ClientName":item.ClientName,"Approver":i.Title})));
            }
        }); 
    }
   
    private WeekStartDateChange = (dateprops) => {
        let date=new Date(dateprops[0]);
        const Formdata = { ...this.state.formData };
            Formdata.WeekStartDate=date;
        this.setState({formData:Formdata});
        console.log(this.state);
    }

    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        formData[name] = value != 'None' ? value : null;
        this.setState({ formData });
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
              // to iterate OT hrs
            for(var item of trFormdata.OTItemsData)
            {
                 //For weekly calculation
                let val=item[prop];
                WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                 //For total calculation
                 let TotalVal=item.Total;
                 Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
            }
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
    private calculateTimeWhenRemoveRow=()=>{
        const trFormdata = { ...this.state.trFormdata };
        let TableColumns=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        for(var prop of TableColumns)
        {
                        //FOR COLUMN WISE CALCULATION
                        let WeeklyTotal=0;
                        let WeeklyColHrs=0;
                        let WeeklyColMins=0;
                        let [Total,TotalColHrs,TotalColMins]=[0,0,0];
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
                            // to iterate OT hrs
                        for(var item of trFormdata.OTItemsData)
                        {
                            //For weekly calculation
                            let val=item[prop];
                            WeeklyTotal=WeeklyTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
                            //For total calculation
                            let TotalVal=item.Total;
                            Total= Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));
                        }
                        WeeklyColHrs=Math.floor(WeeklyTotal/60);
                        WeeklyColMins=Math.floor(WeeklyTotal%60);
                        TotalColHrs=Math.floor(Total/60);
                        TotalColMins=Math.floor(Total%60);

                        trFormdata.BillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
                        trFormdata.BillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

                        // NON BILLABLE SUBTOTAL COLUMN WISE
                        // WeeklyTotal=0;
                        // WeeklyColHrs=0;
                        // WeeklyColMins=0;
                        // [Total,TotalColHrs,TotalColMins]=[0,0,0];
                        // let NonBillableColValue=trFormdata.SynergyOfficeHrs[0][prop];
                        // let TotalVal=trFormdata.SynergyOfficeHrs[0]["Total"];
                        // WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1])); 
                        // Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1])); 

                        // NonBillableColValue=trFormdata.SynergyHolidayHrs[0][prop];
                        // TotalVal=trFormdata.SynergyHolidayHrs[0]["Total"];
                        // WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1]));
                        // Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1]));  

                        // NonBillableColValue=trFormdata.PTOHrs[0][prop];
                        // TotalVal=trFormdata.PTOHrs[0]["Total"];
                        // WeeklyTotal=WeeklyTotal+( parseInt(NonBillableColValue.split(":")[0])*60 ) + (parseInt(NonBillableColValue.split(":")[1])); 
                        // Total=Total+( parseInt(TotalVal.split(":")[0])*60 ) + (parseInt(TotalVal.split(":")[1])); 

                        // WeeklyColHrs=Math.floor(WeeklyTotal/60);
                        // WeeklyColMins=Math.floor(WeeklyTotal%60);
                        // TotalColHrs=Math.floor(Total/60);
                        // TotalColMins=Math.floor(Total%60);
                        // trFormdata.NonBillableSubTotal[0][prop]=(WeeklyColHrs.toString().length==1?"0"+WeeklyColHrs:WeeklyColHrs)+":"+(WeeklyColMins.toString().length==1?"0"+WeeklyColMins:WeeklyColMins);
                        // trFormdata.NonBillableSubTotal[0]["Total"]=(TotalColHrs.toString().length==1?"0"+TotalColHrs:TotalColHrs)+":"+(TotalColMins.toString().length==1?"0"+TotalColMins:TotalColMins);

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
                    
                </td>
                <td>
                    <input className="form-control time Total" value={Obj[i].Total} id={i+"_Total_"+rowType} onChange={this.changeTime} type="time" disabled></input>
                </td>
                <td onClick={this.RemoveCurrentRow} id={i+"_"+rowType}>
                -<span className="c-close" onClick={this.RemoveCurrentRow} id={i+"_"+rowType} >&times;</span>
                </td>
            </tr>);
        }   
        return section;
    }
    private RemoveCurrentRow=(event)=>{
        let RowType=event.target.id.split("_")[1];
        let rowCount=event.target.id.split("_")[0]
        if(RowType.toLowerCase()=="weekrow")
        {
            const trFormdata = { ...this.state.trFormdata };
            let tempItemsData=   trFormdata.WeeklyItemsData;
            trFormdata.WeeklyItemsData=[];
            let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
            let count = WeeklyRowsCount - 1;
           for( var i=0;i<tempItemsData.length;i++)
           {
            if(i!=rowCount)
            trFormdata.WeeklyItemsData.push(tempItemsData[i]);
           }
            this.setState({ trFormdata, currentWeeklyRowsCount: count});

        }
        else{
            const trFormdata = { ...this.state.trFormdata };
            let tempItemsData=   trFormdata.OTItemsData;
            trFormdata.OTItemsData=[];
            let OTRowsCount = this.state.currentOTRowsCount;
            let count = OTRowsCount - 1;
           for( var i=0;i<tempItemsData.length;i++)
           {
            if(i!=rowCount)
            trFormdata.OTItemsData.push(tempItemsData[i]);
           }
            this.setState({ trFormdata, currentOTRowsCount: count});
        }
        this.calculateTimeWhenRemoveRow();

    }
    private CreateWeeklyHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
        let count = WeeklyRowsCount + 1;
        trFormdata.WeeklyItemsData.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
        this.setState({ trFormdata, currentWeeklyRowsCount: count });
    }
    private CreateOTHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let OTRowsCount = this.state.currentOTRowsCount;
        let count = OTRowsCount + 1;
        trFormdata.OTItemsData.push({
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu: '00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total: '00:00',
        });
        this.setState({ trFormdata, currentOTRowsCount: count });
    }
    private getSupervisers=()=> {
        let section = [];
            for( var item of this.state.SuperviserNames)
            {
                if(item.ClientName.toLowerCase()==this.state.formData.ClientName.toLowerCase())
                {
                    section.push(<label>{item.ApproverName}</label>)
                }
            }
            return section;
    }
//  private handleSubmit = (event) => {
//         event.preventDefault();
//         this.setState({ loading: true });
//         let data = {
//             Plant: { val: this.state.formData.Plant, required: false, Name: 'Plant', Type: ControlType.string, Focusid: this.inputPlant },
//             venderName: { val: this.state.formData.Title, required: true, Name: 'Vendor Name', Type: ControlType.string, Focusid: this.vendorName },
//             Database: { val: this.state.formData.Database, required: false, Name: 'Database', Type: ControlType.string, Focusid: this.database },
//             venderNumber: { val: this.state.formData.Vendor_x0020_Number, required: true, Name: 'Vendor Number', Type: ControlType.string, Focusid: this.vendorNumber },
//             Currency: { val: this.state.formData.Currency.toLocaleUpperCase(), required: true, Name: 'Currency', Type: ControlType.string, Focusid: this.inputCurrency },
//         };

//         const formdata = { ...this.state.formData };
//         const id = this.props.match.params.id ? this.props.match.params.id : 0;

//         let isValid = Formvalidator.checkValidations(data);
//         if (isValid.status) {
//             this.checkDuplicates(formdata, id);
//         } else {
//             this.setState({ showLabel: true, errorMessage: isValid.message });
//         }
//     }

    public render() {
        return (

            <React.Fragment>
<div className="container-fluid">
		<div className="my-3 media-p-1 Billable Hours">
		<div className="col-md-4">
			<div className="light-text">
				<label>Client Name <span className="mandatoryhastrick">*</span></label>
				<select className="form-control" required={true} name="ClientName" title="ClientName" onChange={this.handleChange}  value={this.state.formData.ClientName}>
					<option value=''>None</option>
					{this.state.ClientNames.map((option) => (
						<option value={option} selected={this.state.formData.ClientName != ''}>{option}</option>
					))}
				</select>
			</div>
            <div className="col-md-1">
                <div className="light-text">
                    <label>Name</label>
                    <input className="form-control" required={true} placeholder="" name="Name" title="Name" value={this.currentUser} disabled={true} />
                </div>
            </div>
            <div className="col-md-3">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Weekly Start Date</label>
                            <div className="custom-datepicker" id="divWeekStartDate">
                                <DatePicker onDatechange={this.WeekStartDateChange} selectedDate={this.state.formData.WeekStartDate} name="WeeklyStartDate" id="txtWeekStartDate"/>
                            </div>
                        </div>
            </div>
		</div>
			<div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
				<h4>Billable Hours</h4>
				<table className="table table-bordered m-0 timetable text-center">
					<thead style={{borderTop: "8px solid #9E9D9E"}}>
						<tr>		
						<th className="" ><div className="have-h"></div></th>					
							<th className="">Description</th>
							<th className="">Project Code</th>
							<th>Mon <span className="day">01</span></th>
							<th>Tue <span className="day">02</span></th>
							<th>Wed <span className="day">03</span></th>
							<th>Thu <span className="day">04</span></th>
							<th>Fri <span className="day">05</span></th>
							<th className="color-FF9800">Sat <span className="day color-FF9800">06</span></th>
							<th className="color-FF9800">Sun <span className="day color-FF9800">07</span></th>
							<th><div className="px-2"></div></th>
							<th className="bc-e1f2ff">Total</th>
							<th className=""><div className="px-3"></div></th>
						</tr>
					</thead>
					<tbody>
						
						<tr id="rowPRJ1">
							<td> </td>
							<td> 
								<input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].Description} id="0_Description_weekrow" onChange={this.changeTime} type="text"></input>
							</td>
							<td>      
								<input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].ProjectCode} id="0_ProjectCode_weekrow" onChange={this.changeTime} type="text"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Mon"  value={this.state.trFormdata.WeeklyItemsData[0].Mon} id="0_Mon_weekrow"  onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Tue" value={this.state.trFormdata.WeeklyItemsData[0].Tue} id="0_Tue_weekrow"  onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Wed" value={this.state.trFormdata.WeeklyItemsData[0].Wed} id="0_Wed_weekrow"  onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Thu" value={this.state.trFormdata.WeeklyItemsData[0].Thu} id="0_Thu_weekrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Fri" value={this.state.trFormdata.WeeklyItemsData[0].Fri} id="0_Fri_weekrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Sat" value={this.state.trFormdata.WeeklyItemsData[0].Sat} id="0_Sat_weekrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowPRJ1 Sun" value={this.state.trFormdata.WeeklyItemsData[0].Sun} id="0_Sun_weekrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								
							</td>
							<td>
								<input className="form-control time Total"  value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" onChange={this.changeTime} type="text" disabled></input>
							</td>
							<td >
                            <span  onClick={this.CreateWeeklyHrsRow} className="add-button" hidden={this.state.formData.Status != 'Save'} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>
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
                                <input className="form-control time" value={this.state.trFormdata.OTItemsData[0].Description} id="0_Description_otrow" onChange={this.changeTime} type="text"></input>
                            </td>
							<td>
                                <input className="form-control time" value={this.state.trFormdata.OTItemsData[0].ProjectCode}  id="0_ProjectCode_otrow"  onChange={this.changeTime} type="text"></input>
                            </td>
							<td>
								<input className="form-control time changerowOVR1 Mon" value={this.state.trFormdata.OTItemsData[0].Mon} id="0_Mon_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Tue" value={this.state.trFormdata.OTItemsData[0].Tue} id="0_Tue_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Wed" value={this.state.trFormdata.OTItemsData[0].Wed} id="0_Wed_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Thu" value={this.state.trFormdata.OTItemsData[0].Thu} id="0_Thu_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Fri" value={this.state.trFormdata.OTItemsData[0].Fri} id="0_Fri_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Sat" value={this.state.trFormdata.OTItemsData[0].Sat} id="0_Sat_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<input className="form-control time changerowOVR1 Sun" value={this.state.trFormdata.OTItemsData[0].Sun} id="0_Sun_otrow" onChange={this.changeTime} type="time"></input>
							</td>
							<td>
								<span className="c-badge">OT</span>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" disabled></input>
							</td>
							<td >
                            <span  onClick={this.CreateOTHrsRow}  className="add-button" hidden={this.state.formData.Status != 'Save'} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>
							</td>
						</tr>
                        {this.dynamicFieldsRow("otrow")}
						<tr className="font-td-bold">
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
						<tr>
							<td className="text-start"><div className="p-2">Synergy Office Hours</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Description} onChange={this.changeTime} id="0_Description_SynOffcHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynOffcHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynOffcHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynOffcHrs" type="time"></input></td>
							<td><span className="c-badge">O</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} onChange={this.changeTime} id="0_Total_SynOffcHrs" type="text" disabled></input></td>
							<td></td>
						</tr>
						<tr>
							<td className="text-start"><div className="p-2">Synergy Holiday</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_SynHldHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynHldHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Mon} onChange={this.changeTime} id="0_Mon_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Tue} onChange={this.changeTime} id="0_Tue_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Wed} onChange={this.changeTime} id="0_Wed_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Thu} onChange={this.changeTime} id="0_Thu_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Fri} onChange={this.changeTime} id="0_Fri_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Sat} onChange={this.changeTime} id="0_Sat_SynHldHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Sun} onChange={this.changeTime} id="0_Sun_SynHldHrs" type="time"></input></td>
							<td><span className="c-badge">H</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_SynHldHrs" type="text" disabled></input></td>
							<td></td>
						</tr>
						<tr>
							<td className="text-start"><div className="p-2">PTO (Paid Time Off)</div></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Description} onChange={this.changeTime} id="0_Description_PTOHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_PTOHrs" type="text"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Mon} onChange={this.changeTime} id="0_Mon_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Tue} onChange={this.changeTime} id="0_Tue_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Wed} onChange={this.changeTime} id="0_Wed_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Thu} onChange={this.changeTime} id="0_Thu_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Fri} onChange={this.changeTime} id="0_Fri_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Sat} onChange={this.changeTime} id="0_Sat_PTOHrs" type="time"></input></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Sun} onChange={this.changeTime} id="0_Sun_PTOHrs" type="time"></input></td>
							<td><span className="c-badge">PTO</span></td>
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" disabled></input></td>
							<td></td>
						</tr>

						<tr className="font-td-bold">
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
						<tr className="font-td-bold">
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
                                                    <textarea className="position-static form-control requiredinput" onChange={this.handleChange} value={this.state.formData.Comments} placeholder="" maxLength={500} id="txtComments" name="Comments"  disabled={false}></textarea>
                                                </div>
                                            </div>
                </div>
                <div className="col-md-3">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Date Submitted</label>
                            <div className="custom-datepicker" id="divDateSubmitted">
                                <DatePicker onDatechange={this.WeekStartDateChange} selectedDate={this.state.formData.DateSubmitted} name="WeeklyStartDate" id="txtWeekStartDate"/>
                            </div>
                        </div>
                </div>
                <div className="light-text">
				<label>Superviser Names <span className="mandatoryhastrick">*</span></label>
               {this.getSupervisers}
			</div>
			</div>
			<div className="row">
				<div className="col-md-12"><hr></hr></div>
				<div className="col-md-12 text-center mt-3">
					<button type="button" id="" className="SubmitButtons">Submit</button>
					<button type="button" id="" className="SaveButtons">Save</button>
				</div>
			</div>
		</div>
	</div>
            </React.Fragment>
        );
        // }
    }
}

export default WeeklyTimesheet;