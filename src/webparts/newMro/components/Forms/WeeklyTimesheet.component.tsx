import  jquery from 'jquery';
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

interface WeeklyTimesheetProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface WeeklyTimesheetState {
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
         let newobj = {
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
         };
         trFormdata.WeeklyItemsData.push(newobj);
         trFormdata.OTItemsData.push(newobj);
         trFormdata.BillableSubTotal.push(newobj);
         trFormdata.SynergyOfficeHrs.push(newobj);
         trFormdata.SynergyHolidayHrs.push(newobj);
         trFormdata.PTOHrs.push(newobj);
         trFormdata.NonBillableSubTotal.push(newobj);
         trFormdata.Total.push(newobj);
         this.setState({ trFormdata});
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
         this.setState({ loading: false });
         this.loadWeeklyTimeSheetData();
    
    }
    // public componentWillReceiveProps(newProps) {
    //     if (newProps.match.params.id == undefined)
    //         this.setState({
    //             formData: {
    //                 Title: '', Company: '', Plant: '',
    //                 Database: '',
    //                 PlantCode: '', IsActive: true, Vendor_x0020_Number: null,
    //                 Currency:'',
    //             }, SaveUpdateText: 'Submit', addNewvendor: false
    //         });
    // }
    // private handleChange = (event) => {
    //     const formData = { ...this.state.formData };
    //     const { name } = event.target;
    //     let inputvalue = event.target.value;
    //     const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
    //     formData[name] = value;
    //     this.setState({ formData });
    // }

    // private handleonBlur = (event) => {
    //     const formData = { ...this.state.formData };
    //     const { name } = event.target;
    //     let inputvalue = event.target.value.trim();
    //     const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
    //     formData[name] = value;
    //     this.setState({ formData });
    // }
    // private changeplant = (event) => {
    //     const formData = { ...this.state.formData };
    //     let name = event.target.name;
    //     formData[name] = event.target.value != 'None' ? event.target.value : null;
    //     // let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
    //     let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');
    //     var selectedIndex = event.nativeEvent.target.selectedIndex;
    //     // formData[name] = event.nativeEvent.target[selectedIndex].text;
    //     // formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
    //     formData['PlantCode'] = customAttrPlantCode != 'None' ? customAttrPlantCode : null;
    //     this.setState({ formData });
    // }
    // private handleChangeNumber = (event) => {
    //     const formData = { ...this.state.formData };
    //     const { name } = event.target;
    //     var numbervalue = event.target.value.trim();
    //     let Numberlength = numbervalue.length;
    //     if (isNaN(numbervalue[Numberlength - 1]))
    //         numbervalue = numbervalue.slice(0, -1);
    //     formData[name] = numbervalue;
    //     this.setState({ formData });
    // }
    // private handleSubmit = (event) => {
    //     event.preventDefault();
    //     // this.setState({ loading: true });
    //     let data = {
    //         Plant: { val: this.state.formData.Plant, required: false, Name: 'Plant', Type: ControlType.string, Focusid: this.inputPlant },
    //         venderName: { val: this.state.formData.Title, required: true, Name: 'Vendor Name', Type: ControlType.string, Focusid: this.vendorName },
    //         Database: { val: this.state.formData.Database, required: false, Name: 'Database', Type: ControlType.string, Focusid: this.database },
    //         venderNumber: { val: this.state.formData.Vendor_x0020_Number, required: true, Name: 'Vendor Number', Type: ControlType.string, Focusid: this.vendorNumber },
    //         Currency: { val: this.state.formData.Currency.toLocaleUpperCase(), required: true, Name: 'Currency', Type: ControlType.string, Focusid: this.inputCurrency },
    //     };

    //     const formdata = { ...this.state.formData };
    //     const id = this.props.match.params.id ? this.props.match.params.id : 0;

    //     let isValid = Formvalidator.checkValidations(data);
    //     if (isValid.status) {
    //         this.checkDuplicates(formdata, id);
    //     } else {
    //         this.setState({ showLabel: true, errorMessage: isValid.message });
    //     }
    // }

    // private checkDuplicates = (formData, id) => {
    //     let VendorList = 'Vendor';
    //     var filterString;

    //     try {
    //         if (id == 0)
    //             filterString = `(Vendor_x0020_Number eq '${formData.Vendor_x0020_Number}') and Company eq '${formData.Company}' and IsActive eq '${formData.IsActive ? 1 : 0}'`;
    //         else
    //             filterString = `(Vendor_x0020_Number eq '${formData.Vendor_x0020_Number}') and Company eq '${formData.Company}' and IsActive ne '${formData.IsActive}' and Id ne ` + id;
    //         sp.web.lists.getByTitle(VendorList).items.filter(filterString).get().
    //             then((response: any[]) => {
    //                 if (response.length > 0) {
    //                     this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
    //                 }
    //                 else {
    //                     // this.insertorupdateListitem(formData, HolidaysList);

    //                     this.setState({ loading: true });
    //                     if (id > 0) {                       //update existing record
    //                         //console.log(this.props);
    //                         sp.web.lists.getByTitle('Vendor').items.getById(id).update(formData).then((res) => {
    //                             // this.loadListData();
    //                             // this.resetVendorForm();
    //                             this.setState({
    //                                 modalTitle: 'Success',
    //                                 modalText: 'Vendor updated successfully',
    //                                 showHideModal: true,
    //                                 isSuccess: true
    //                             });
    //                             //console.log(res);
    //                         });
    //                     }
    //                     else {                             //Add New record
    //                         try {
    //                             this.setState({ loading: true });
    //                             sp.web.lists.getByTitle('vendor').items.add({ ...this.state.formData })
    //                                 .then((res) => {
    //                                     this.loadListData();
    //                                     this.resetVendorForm();
    //                                     this.setState({
    //                                         modalTitle: 'Success',
    //                                         modalText: 'Vendor submitted successfully',
    //                                         showHideModal: true,
    //                                         isSuccess: true
    //                                     });
    //                                 })
    //                                 .catch((err) => {
    //                                     console.log('Failed to add');
    //                                     this.setState({
    //                                         loading: false,
    //                                         modalTitle: 'Error',
    //                                         modalText: 'Sorry! something went wrong',
    //                                         showHideModal: true,
    //                                         isSuccess: false
    //                                     });
    //                                 });
    //                         }
    //                         catch (e) {
    //                             console.log(e);
    //                             this.setState({
    //                                 loading: false,
    //                                 modalTitle: 'Error',
    //                                 modalText: 'Sorry! something went wrong',
    //                                 showHideModal: true,
    //                                 isSuccess: false
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

    // private onError = () => {
    //     this.setState({
    //         loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
    //     });
    // }

    // private async loadListData() {
    //     // var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
    //     var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
    //     var uniquePlantsList = []; let flags = {};
    //     Plants.filter(item => {
    //         if (item.Database != null) {
    //             if (flags[item.Database] == true) return false;
    //             else { flags[item.Database] = true; uniquePlantsList.push(item); return true; }
    //         }
    //     });
    //     // var formdata = {...this.state.formData};
    //     // formdata.Company = this.Company;
    //     sp.web.lists.getByTitle('Vendor').items.select('Title,*').orderBy("Id", false).getAll()
    //         .then((response) => {
    //             response.sort((a, b) => b.Id - a.Id);
    //             this.setState({
    //                 vendors: response.map(o => ({
    //                     Id: o.Id, Company: o.Company, PlantCode: o.PlantCode, Plant: o.Plant,
    //                     Database: o.Database, Currency:o.Currency,
    //                     Title: o.Title, IsActive: o.IsActive == true ? 'Active' : 'In-Active', Vendor_x0020_Number: o.Vendor_x0020_Number
    //                 })),
    //                 SaveUpdateText: 'Submit',
    //                 showLabel: false,
    //                 loading: false,
    //                 Plants: uniquePlantsList
    //             });
    //         }).catch(err => {
    //             console.log('Failed to fetch data.');
    //             this.setState({
    //                 loading: false,
    //                 modalTitle: 'Error',
    //                 modalText: 'Sorry! something went wrong',
    //                 showHideModal: true,
    //                 isSuccess: false
    //             });
    //         });
    // }
    // private async onEditClickHandler(id) {
    //     console.log('edit clicked', id);

    //     try {
    //         var response = await sp.web.lists.getByTitle('vendor').items.getById(id).get();

    //         this.setState({
    //             formData: {
    //                 Title: response.Title, Company: response.Company, Plant: response.Plant, PlantCode: response.PlantCode,
    //                 Database: response.Database,
    //                 IsActive: response.IsActive, Vendor_x0020_Number: response.Vendor_x0020_Number.trim(),
    //                 Currency:response.Currency
    //             },
    //             SaveUpdateText: 'Update',
    //             showLabel: false,
    //             addNewvendor: true
    //         });
    //         // .then((response) => {
    //         //     })
    //         //     .catch(e => {
    //         //         console.log('Failed to fetch :' + e);
    //         //     });
    //     }
    //     catch (e) {
    //         console.log('failed to fetch data for record :' + id);
    //     }
    // }
    // private resetVendorForm = () => {
    //     this.setState({
    //         formData: {
    //             Title: '', Plant: '', Company: '',
    //             Database: '',
    //             PlantCode: '', IsActive: true, Vendor_x0020_Number: null,
    //             Currency:''
    //         }, SaveUpdateText: 'Submit', addNewvendor: false
    //     });
    //     //this.props.history.push('/vendor');
    //     () => this.props.history.push('/vendor');
    // }
    // private cancelHandler = () => {
    //     this.resetVendorForm();
    // }
    // public handleClose = () => {
    //     this.setState({ showHideModal: false });
    //     this.loadListData();
    //     this.resetVendorForm();
    // }
    // private addNewVendorMaster = () => {
    //     var formdata = { ...this.state.formData };
    //     formdata.Company = this.Company;
    //     this.setState({ addNewvendor: true, showLabel: false, formData: formdata });
    // }

    // public fetchImportedExcelData = (data) => {
    //     console.log(data);
    //     if (data.length > 0) {
    //         this.setState({ ImportedExcelData: data });
    //     }
    // }

    // public submitImportedExcelData = () => {
    //     var nonDuplicateRec = [];
    //     var statusChangedRec = [];
    //     const formdata = { ...this.state };
    //     var VendorsData = formdata.vendors;
    //     var excelData = formdata.ImportedExcelData;

    //     if (excelData.length) {   //To remove duplicate records from Excel data
    //         let jsonObject = excelData.map(JSON.stringify);
    //         let uniqueSet: any = new Set(jsonObject);
    //         excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
    //     }
    //     try {
    //         for (var i = excelData.length - 1; i >= 0; i--) {
    //             for (var j = 0; j < VendorsData.length; j++) {
    //                // VendorsData[j].Title= VendorsData[j].Title!=null?VendorsData[j].Title:"";
    //                 VendorsData[j].Database=VendorsData[j].Database!=null?VendorsData[j].Database:"";
    //                 if (excelData[i] && (excelData[i]["Vendor Number"].toLowerCase().trim() == VendorsData[j].Vendor_x0020_Number.toLowerCase().trim()) &&(excelData[i]["Vendor Name"].toLowerCase().trim() == VendorsData[j].Title.toLowerCase().trim()) && (excelData[i]["Database"].toLowerCase().trim() == VendorsData[j].Database.toLowerCase().trim())) {
    //                     if (excelData[i].Status == VendorsData[j].IsActive ) {
    //                         excelData.splice(i, 1);
    //                     } else if (VendorsData[j].IsActive  != excelData[i].Status) {
    //                         VendorsData[j].IsActive = excelData[i].Status == "Active" ? true : false;
    //                         VendorsData[j].Database = VendorsData[j].Database.trim();
    //                         VendorsData[j].Title = VendorsData[j].Title.trim();
    //                         VendorsData[j].Vendor_x0020_Number = VendorsData[j].Vendor_x0020_Number.trim();
    //                         VendorsData[j].Currency = VendorsData[j].Currency != undefined ? VendorsData[j].Currency.trim():'US';
    //                         statusChangedRec.push(VendorsData[j]);
    //                         excelData.splice(i, 1);
    //                     }
    //                 }
    //             }
    //         }
    //         if (excelData.length) {
    //             excelData.forEach(item => {
    //                 var obj = {};
    //                 obj["Title"] = item["Vendor Name"].trim();
    //                 obj["Vendor_x0020_Number"] = item["Vendor Number"].trim();
    //                 obj["Plant"] = item.Plant;
    //                 obj["PlantCode"] = item["Plant Code"];
    //                 obj["Database"] = item.Database.trim();
    //                 obj["Company"] = item.Company;
    //                 obj["Currency"] = item.Currency;
    //                 obj["IsActive"] = item.Status == "Active" ? true : false;

    //                 nonDuplicateRec.push(obj);
    //             });
    //         } else if (!excelData.length && !statusChangedRec.length) {
    //             this.resetImportField();
    //             this.setState({
    //                 loading: false,
    //                 modalTitle: 'Alert',
    //                 modalText: 'No new records found',
    //                 showHideModal: true,
    //                 isSuccess: false
    //             });
    //         }
    //         if (statusChangedRec.length) {
    //             this.updateImportExceldata(nonDuplicateRec, statusChangedRec);
    //         }
    //         if (nonDuplicateRec.length) {
    //             this.insertImportedExcelData(nonDuplicateRec);
    //         }
    //     }
    //     catch (e) {
    //         console.log(e);
    //         this.setState({
    //             loading: false,
    //             modalTitle: 'Error',
    //             modalText: 'Sorry! something went wrong',
    //             showHideModal: true,
    //             isSuccess: false
    //         });
    //     }
    // }

    // public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
    //     statusChangedData.forEach(element => {
    //         sp.web.lists.getByTitle('vendor').items.getById(element.Id).update(element).then((res) => {

    //         }).then((res) => {
    //             if (!nonDuplicateRec.length) {
    //                 //this.loadListData();  //
    //                 this.setState({
    //                     modalTitle: 'Success',
    //                     modalText: 'Vendors updated successfully',
    //                     showHideModal: true,
    //                     isSuccess: true
    //                 });
    //                 this.resetImportField();
    //                 console.log(res);
    //             }
    //         }).catch((err) => {
    //             console.log('Failed to add', err);
    //         });
    //     });
    //     this.loadListData(); //
    // }

    // public insertImportedExcelData = async (data) => {
    //     let failedrecords: any = [];
    //     try {
    //         this.setState({ loading: true });
    //         let list = await sp.web.lists.getByTitle("Vendor");
    //         const entityTypeFullName = await list.getListItemEntityTypeFullName();

    //         if (data && data != undefined) {
    //             let splitSize = data.length <= 1000 ? 1 : Math.floor(data.length / 1000) + 1;
    //             const chunk = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);
    //             var chunkData = chunk(data, 1000);
    //             //var chunkData = data.splice(0,data.length && data.length <= 1000);
              
    //                 chunkData.forEach((element, index) => { //1000
    //                     let batch = sp.web.createBatch();

    //                     element.forEach(item => {
    //                         list.items.inBatch(batch).add({ ...item }, entityTypeFullName);
    //                     });
    //                     batch.execute()
    //                         .then(response => {
    //                             if (response != undefined) {
    //                                 console.log('Failed to add');
    //                             }
    //                             if (index == splitSize - 1) {
    //                                 this.loadListData();
    //                                 this.setState({
    //                                     modalTitle: 'Success',
    //                                     modalText: 'Vendors uploaded successfully',
    //                                     showHideModal: true,
    //                                     isSuccess: true,
    //                                 });
    //                                 this.resetImportField();
    //                             }
    //                         })
    //                         .catch((err) => {
    //                             console.log('Failed to add');
    //                             console.log(err);
    //                             failedrecords.push(err);
    //                         });
    //                 });
               

    //         }
    //     }
    //     catch (e) {
    //         console.log(e);
    //         this.setState({
    //             loading: false,
    //             modalTitle: 'Alert',
    //             modalText: 'Error occured',
    //             showHideModal: true,
    //             isSuccess: false
    //         });
    //     }
    // }

    // public resetImportField = () => {
    //     // var fileEle = document.getElementById("inputFile");
    //     (document.getElementById("inputFile") as HTMLInputElement).value = '';
    // }
    // private onMenuItemClick(event) {
    //     let item = document.getElementById('sideMenuNav');
    //     item.classList.toggle('menu-hide');
    // }
    // public ErrorFileSelect = () => {
    //     this.resetImportField();
    //     this.setState({
    //         loading: false,
    //         modalTitle: 'Alert',
    //         modalText: 'Invalid Vendors file selected',
    //         showHideModal: true,
    //         isSuccess: false
    //     });
    // }

     private async loadWeeklyTimeSheetData() {
        // var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        var ClientNames: any = await this.oweb.lists.getByTitle('EmployeeMaster').items.select("ClientName , Employee/Title, Employee/Id,Approvers/Title,*").orderBy("Employee/Title").expand("Employee,Approvers").get();
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
                const rowData = { ...this.state.trFormdata.WeeklyItemsData };
                rowData[index][prop]=value;
                trFormdata.WeeklyItemsData=rowData;
                this.setState({ trFormdata});
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
           //FOR COLUMN WISE CALCULATION
           let [MonTotal,TueTotal,WedTotal,ThuTotal,FriTotal,SatTotal,SunTotal]=[0,0,0,0,0,0,0];
           let [MonColHrs,TueColHrs,WedColHrs,ThuColHrs,FriColHrs,SatColHrs,SunColHrs]=[0,0,0,0,0,0,0];
           let [MonColMins,TueColMins,WedColMins,ThuColMins,FriColMins,SatColMins,SunColMins]=[0,0,0,0,0,0,0];
           if(prop=="Mon")
           {
            //BILLABLE COLUMN WISE
            // to iterate Weekly hrs
            for(var item of trFormdata.WeeklyItemsData)
            {
                let val=item[prop]; 
                MonTotal=MonTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
            }
              // to iterate OT hrs
            for(var item of trFormdata.OTItemsData)
            {
                let val=item[prop];
                MonTotal=MonTotal+( parseInt(val.split(":")[0])*60 ) + (parseInt(val.split(":")[1])); 
            }
            MonColHrs=Math.floor(MonTotal/60);
            MonColMins=Math.floor(MonTotal%60);
            trFormdata.BillableSubTotal[index][prop]=(MonColHrs.toString().length==1?"0"+MonColHrs:MonColHrs)+":"+(MonColMins.toString().length==1?"0"+MonColMins:MonColMins);

             // NON BILLABLE COLUMN WISE
             MonTotal=0;
             MonColHrs=0;
             MonColMins=0;
           }
        
           
        this.setState({ trFormdata});
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
                    <input className="form-control time Total" value={Obj[i].Total} id={i+"_Total_"+rowType} type="time"></input>
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

    }
    private CreateWeeklyHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
        let count = WeeklyRowsCount + 1;
        let newobj = {
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue: '00:00',
            Wed:'00:00',
            Thu:'00:00',
            Fri: '00:00',
            Sat: '00:00',
            Sun: '00:00',
            Total:'00:00',
        };
        trFormdata.WeeklyItemsData.push(newobj);
        this.setState({ trFormdata, currentWeeklyRowsCount: count });
    }
    private CreateOTHrsRow= () => {
        const trFormdata = { ...this.state.trFormdata };
        let OTRowsCount = this.state.currentOTRowsCount;
        let count = OTRowsCount + 1;
        let newobj = {
            Description:'',
            ProjectCode:'',
            Mon: '00:00',
            Tue:'00:00',
            Wed:'00:00',
            Thu:'00:00',
            Fri: '00:00',
            Sat:'00:00',
            Sun: '00:00',
            Total:'00:00',
        };
        trFormdata.OTItemsData.push(newobj);
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
								<input className="form-control time Total"  value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" type="time"></input>
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
								<input className="form-control time" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" type="time"></input>
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
								<input className="form-control time" id="BillableTotalMon" value={this.state.trFormdata.BillableSubTotal[0].Mon} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalTue" value={this.state.trFormdata.BillableSubTotal[0].Tue} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalWed" value={this.state.trFormdata.BillableSubTotal[0].Wed} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalThu" value={this.state.trFormdata.BillableSubTotal[0].Thu} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalFri" value={this.state.trFormdata.BillableSubTotal[0].Fri} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sat} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" id="BillableTotalSat" value={this.state.trFormdata.BillableSubTotal[0].Sun} type="time" disabled></input>
							</td>
							<td>
								<span className="c-badge">BS</span>
							</td>
							<td>
								<input className="form-control time" id="BillableTotal" value={this.state.trFormdata.BillableSubTotal[0].Total}  type="time" disabled></input>
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
							<td><input className="form-control time" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} id="0_Total_SynOffcHrs" type="time" disabled></input></td>
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
							<td><input className="form-control time" value={this.state.trFormdata.SynergyHolidayHrs[0].Total} id="0_Total_SynHldHrs" type="time" disabled></input></td>
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
							<td><input className="form-control time" value={this.state.trFormdata.PTOHrs[0].Total} id="0_Total_PTOHrs" type="time" disabled></input></td>
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
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Mon} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Tue} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Wed} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Thu} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Fri} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Sat} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Sun} type="time" disabled></input>
							</td>
							<td><span className="c-badge">NS</span></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.NonBillableSubTotal[0].Total} type="time" disabled></input>
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
								<input className="form-control time" value={this.state.trFormdata.Total[0].Mon} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Tue} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Wed} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Thu} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Fri} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Sat} type="time" disabled></input>
							</td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Sun} type="time" disabled></input>
							</td>
							<td><span className="c-badge">T</span></td>
							<td>
								<input className="form-control time" value={this.state.trFormdata.Total[0].Total} type="time" disabled></input>
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