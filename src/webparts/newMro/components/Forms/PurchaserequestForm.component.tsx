import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, Dropdowns, ActionStatus, ApprovalStatus, PendingStatus } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import Loader from '../Shared/Loader';
import { sp } from '@pnp/sp';
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
import { faPlus,faPrint} from "@fortawesome/free-solid-svg-icons";
import formValidation from '../../Utilities/Formvalidator';
import "../Shared/Menuhandler";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Navigate } from 'react-router-dom';
import { confirm } from 'react-confirm-box';
import InputCheckBox from '../Shared/InputCheckBox';

export interface PurchaseRequestProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface PurchaseRequestState {
}

class PurchaseRequestForm extends React.Component<PurchaseRequestProps, PurchaseRequestState> {
    private siteURL: string;
    private sitecollectionURL: string;
    private TrListname = 'PurchaseRequest';
    private selectedPlant: any = {};
    private userContext: any = {};
    private Company;
    private Plant;
    private RequsitionerCode;
    private buyercode;
    private ddlProjectCode;
    private ddlCommodityCategory;
    private ddlVendor;
    private ddlCurrency;
    private description;
    private txtComments;
    private ddlDepartment;
    private rootweb;
    private tempstate;
    // private database;
    private userGroups;

    public state = {
        formData: {
            Company: '',
            Plant: '',
            RequisitionerId: null,
            Buyer: '',
            RequsitionerCode: '',
            ProjectCode: '',
            CommodityCategory: '',
            Vendor:'',
            VendorName:'',
            Currency:'',
            Description: '',
            Status: ApprovalStatus.Msave,
            Department: '',
            Database: '',
            PlantCode: '',
            PONumber:null,
            CMSMstr: null,
            CapitalInvestment:false,
        },
        trFormdata: {
            ItemsData: [],
            Status: ApprovalStatus.draft,
            AssignToId: null,
            ApprovalLevel: "0",
            NextApprovalId: null,
            TotalAmount: 0,
            CurrencyAmount:0,
            Pendingwith: '',
            ItemsDatajson: '',
            Approver1Id: null,
            Approver2Id: null,
            Approver3Id: null,
            Approver4Id: null,
            ReviewerId: null,
            Comments: '',
            Commentsdata: []
            
        },
        poData:{PONumber:'',isPOProcessed:false,IsincludedinPOExcel:false},
        showHideModalConfirm:false,
        RequisitionerUserId: null,
        Requisitioner: '',
        ProjectCode: [],
        CommodityCategory: [],
        Vendor:[],
        Plants: [],
        requisitionData: [],
        RequisitionerEmail: '',
        SaveUpdateText: 'Submit',
        SaveResubmitBtnText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        redirect: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        isEdit: false,
        Buyers: [],
        RequsitionerCode: [],
        ApprovalsMatrix: [],
        ExchangeRates:[],
        ItemID: 0,
        Companys: JSON.parse(Dropdowns.Companys),
        fileArr: [],
        delfileArr: [],
        // Programs: ['Assembly', 'JT', 'JL', 'Mold', 'Press', 'WD', 'WK', 'WL'],
        Programs: [],
        Departments: [],
        isFormloadCompleted: false,
        currentdivCount: 0,
        DynamicDisabled: false,
        DeletePermissions : false,
        ProcessPoPermissions : false,
        Punits: [],
        Qunits: [],
        Vendors: [],
        CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
        Homeredirect: false,
        Errorclose: false,
        Comments: '',
        createdById: 0,
        isUserExistInPurchasingGroup: false,
        showHideDraftButton: false,
        isInitiatorEdit :false,
        userGroupIds :[],
        reorder:false,
        authorId:null,
        IsWithdraw: false,
        //GrandTotal:0,
    };

    constructor(props: PurchaseRequestProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.userContext = this.props.spContext;
        sp.setup({
            spfxContext: this.props.context
        });
        // this.Company = React.createRef();
        this.Plant = React.createRef();
        this.buyercode = React.createRef();
        this.RequsitionerCode = React.createRef();
        this.ddlProjectCode = React.createRef();
        this.ddlCommodityCategory = React.createRef();
        this.ddlVendor = React.createRef();
        this.description = React.createRef();
        this.ddlDepartment = React.createRef();
        this.txtComments = React.createRef();
        if (this.siteURL.includes('mayco')) {
            this.rootweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
            this.Company = 'Mayco';
            // this.database = 'CMSDAT';
        } else {
            this.rootweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
            this.Company = 'Jvis';
            // this.database = 'CMSDAT';
        }
        this.tempstate = { ...this.state };
    }
    public componentDidMount() {
        highlightCurrentNav("lipurchaseLink");
        this.setState({ loading: true });
        // this.getUserGroups();
        this.GetMasterListData();
    }
    private getUserGroups = async ()=>{
        let groups = await sp.web.currentUser.groups();
        this.userGroups=groups.filter(c=>c.Title.includes('MRO'));
    }
    private clearprvdata = () => {
        this.setState({ loading: true });
        this.GetMasterListData();
    }

    private BindComments = () => {
        let Commentsdata = this.state.trFormdata.Commentsdata;
        let Commentssection = [];
        if (Commentsdata.length > 0) {
            Commentsdata.map((selItem, index) => {
                Commentssection.push(
                    <tr>
                        <td >{selItem.Action}</td>
                        <td >{selItem.Role}</td>
                        <td >{selItem.User}</td>
                        <td>{selItem.comments}</td>
                        <td>{selItem.Date.split('/')[1]+"/"+selItem.Date.split('/')[0]+"/"+selItem.Date.split('/')[2]}</td>
                    </tr>);
            });
            return Commentssection;
        }
    }

    private handleCommetsChange = (event) => {
        let value = event.target.value;
        this.setState({ Comments: value });
    }

    //#region  handle Evnts
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const trFormdata={...this.state.trFormdata };
        const { name } = event.target;
        let inputvalue = event.target.value;
        const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        // const value = event.target.value;
        formData[name] = value != 'None' ? value : null;
        if(name=='Vendor'){
            const vname= event.target.selectedOptions[0].text;
            formData["VendorName"] = vname != 'None' ? vname : null;
            let vendorCurrency= this.state.Vendor.filter(item=>item.Vendor_x0020_Number==value);
            let curr =vendorCurrency.length>0?(vendorCurrency[0].Currency!=null?vendorCurrency[0].Currency:'US'):''
            formData["Currency"] = vname != 'None' ? curr : '';
            this.updateAmount(curr);
        }
        this.setState({ formData });
    }
    private updateAmount=(curr)=>{
        const trFormdata={...this.state.trFormdata };
        if(trFormdata.ItemsData != undefined && trFormdata.ItemsData.length >0){
            const vendorCurr = curr;
            let currValue = vendorCurr !="" ? this.state.ExchangeRates.filter(item=>item.Title==vendorCurr)[0].rate:1;
            let Total = 0;
            let currAmount = 0;
            trFormdata.ItemsData.map((selItem, index) => {
                let Quantity = selItem.Quantity;
                let UnitPrice = selItem.UnitPrice; 
                //let SubTotal =selItem.SubTotal;
                currAmount = currAmount + (Quantity * UnitPrice);
            });
            Total = currAmount/currValue;
            trFormdata.TotalAmount = Total;
            trFormdata.CurrencyAmount = currAmount;
        }
        this.setState({ trFormdata });
    }
    private handleChangeonlyNumaric = (event) => {
        let numbervalue = event.target.value;
        let Numberlength = numbervalue.length;
        let keyupcharter = numbervalue[Numberlength - 1];
        // let numberofdots= numbervalue.split('.');
        if (isNaN(keyupcharter)) {
            numbervalue = numbervalue.slice(0, -1);
        }
        const trFormdata = { ...this.state.trFormdata };
        let rowcount = parseInt(event.target.id.split('_')[0]);
        const { name } = event.target;
        trFormdata.ItemsData[rowcount][name] = numbervalue;
        const vendorCurr = this.state.formData.Currency;
        let currValue = vendorCurr !="" ? this.state.ExchangeRates.filter(item=>item.Title==vendorCurr)[0].rate:1;
        // calucate Total Amount 
        let Total = 0;
        let currAmount = 0;
        trFormdata.ItemsData.map((selItem, index) => {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice;
            currAmount = currAmount + (Quantity * UnitPrice);
        });
        Total = currAmount/currValue;
        trFormdata.TotalAmount = Total;
        trFormdata.CurrencyAmount = currAmount;

        this.setState({ trFormdata });
    }

    private filesChanged = (selectedFiles) => {
        this.setState({ fileArr: selectedFiles[0], delfileArr: selectedFiles[1] });
    }
    private handleChangeonlyNumaricwithDecmials = (event) => {
        let numbervalue = event.target.value;
        let Numberlength = numbervalue.length;
        let keyupcharter = numbervalue[Numberlength - 1];
        let numberofdots = numbervalue.split('.');
        if (isNaN(keyupcharter) && keyupcharter != '.') {
            numbervalue = numbervalue.slice(0, -1);
        }
        else if (numberofdots.length > 2) {
            numbervalue = numbervalue.slice(0, -1);
        }
        else if (numberofdots.length == 2 && numberofdots[1].length > 4) {
            numbervalue = numbervalue.slice(0, -1);
        }
        const trFormdata = { ...this.state.trFormdata };
        let rowcount = parseInt(event.target.id.split('_')[0]);
        const { name } = event.target;
        trFormdata.ItemsData[rowcount][name] = numbervalue;
        const vendorCurr = this.state.formData.Currency;
        let currValue = vendorCurr !="" ? this.state.ExchangeRates.filter(item=>item.Title==vendorCurr)[0].rate:1;
        //let subTotal = trFormdata.ItemsData[rowcount]['Quantity'] * numbervalue;
        //trFormdata.ItemsData[rowcount]['SubTotal'] = subTotal;
        // calucate Total Amount 
        let Total = 0;
        let currAmount = 0;
        trFormdata.ItemsData.map((selItem, index) => {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice; 
            //let SubTotal =selItem.SubTotal;
            currAmount = currAmount + (Quantity * UnitPrice);
        });
        Total = currAmount/currValue;
        trFormdata.TotalAmount = Total;
        trFormdata.CurrencyAmount = currAmount;

        this.setState({ trFormdata });
    }
    private handleChangeDaynamic = (event) => {
        const trFormdata = { ...this.state.trFormdata };
        let rowcount = parseInt(event.target.id.split('_')[0]);
        const { name } = event.target;
        const value = event.target.value;
        if (name == 'Program') {
            let ProgramLable = '';
            if (value == 'Assembly') ProgramLable = 'Assembly Line ID';
            else if (value == 'Mold') ProgramLable = 'Mold Number';
            else if (value == 'Press') ProgramLable = 'Press Number';
            trFormdata.ItemsData[rowcount]['ProgramLable'] = ProgramLable;
        }
        if(trFormdata.ItemsData[rowcount]["CMSReq"] == undefined)
        {
            trFormdata.ItemsData[rowcount]["CMSReq"]='';
        }
        if(name == 'QuantityUnit'){
            trFormdata.ItemsData[rowcount]['Unit'] = value != 'None' ? value : null;
        }
        trFormdata.ItemsData[rowcount][name] = value != 'None' ? value : null;
        this.setState({ trFormdata });
        // if (name == 'MasterRequisition' && value != "0")
        //this.GetRequisitionData(value);
       
    }
    private UpdateDate = (dateprops) => {
        const trFormdata = { ...this.state.trFormdata };
        let rowcount = parseInt(dateprops[1].split('_')[0]);
        let fildname = dateprops[1].split('_')[1];
        trFormdata.ItemsData[rowcount][fildname] = dateprops[0];
        this.setState({ trFormdata });
    }

    private dynamicFields = () => {
        let section = [];
        //console.log(this.state);
        for (var i = 0; i < this.state.currentdivCount; i++) {
            section.push(<div className="content pb-3 light-box mx-2 my-3 p-rel">
            <span className="c-close" onClick={this.RemoveDiv} id={i + "_Close"} hidden={this.state.currentdivCount == 1 || this.state.DynamicDisabled}>&times;</span>
             
             <label className='sub-total'>Sub Total { this.state.trFormdata.ItemsData[i].UnitPrice != null &&this.state.trFormdata.ItemsData[i].Quantity !=null? (this.state.trFormdata.ItemsData[i].UnitPrice*this.state.trFormdata.ItemsData[i].Quantity).toFixed(2):0}</label>   

                <div className="row pt-2 px-2">
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Quantity <span className="mandatoryhastrick">*</span></label>
                            <input className="form-control" required={true} placeholder="" name="Quantity" title="Quantity" value={this.state.trFormdata.ItemsData[i].Quantity || ''} onChange={this.handleChangeonlyNumaric} id={i + '_Quantity'} maxLength={10} autoComplete="off" disabled={this.state.DynamicDisabled} ref={this[i + "Quantity"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Quantity for Unit <span className="mandatoryhastrick">*</span></label>
                            <select className="form-control" required={true} name="QuantityUnit" title="Quantity for Unit" value={this.state.trFormdata.ItemsData[i].QuantityUnit} onChange={this.handleChangeDaynamic} id={i + '_QuantityUnit'} disabled={this.state.DynamicDisabled} ref={this[i + "QuantityUnit"]}>
                                <option value=''>None</option>
                                {this.state.Qunits.map((option) => (
                                    <option value={option.Title} selected={this.state.trFormdata.ItemsData[i].QuantityUnit == option.Title}>{`${option.Title} (${option.Description})`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                 
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Unit Price <span className="mandatoryhastrick">*</span></label>
                            <input className="form-control" required={true} placeholder="" name="UnitPrice" title="Unit Price" value={this.state.trFormdata.ItemsData[i].UnitPrice || ''} onChange={this.handleChangeonlyNumaricwithDecmials} id={i + '_UnitPrice'} maxLength={10} autoComplete="off" disabled={this.state.DynamicDisabled} ref={this[i + "UnitPrice"]} />
                        </div>
                    </div>
                  
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Price for Unit <span className="mandatoryhastrick">*</span></label>
                            <select className="form-control" required={true} name="Unit" title="Price for Unit" value={this.state.trFormdata.ItemsData[i].Unit} id={i + '_Unit'} disabled={true} ref={this[i + "Unit"]}>
                                <option value=''>None</option>
                                {this.state.Punits.map((option) => (
                                    <option value={option.Title} selected={this.state.trFormdata.ItemsData[i].Unit == option.Title}>{option.Title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>

                <div className="row pt-2 px-2">
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>VPT# </label>
                            <input className="form-control" required={true} placeholder="" type="text" name="VPT" title="VPT#" value={this.state.trFormdata.ItemsData[i].VPT || ''} onChange={this.handleChangeDaynamic} id={i + '_VPT'} autoComplete="off" disabled={this.state.DynamicDisabled} ref={this[i + "VPT"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Date Required </label>
                            <div className="custom-datepicker" id="divRDate">
                                <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.trFormdata.ItemsData[i].DateRequired} id={i + '_DateRequired'} isDisabled={this.state.DynamicDisabled} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Vendor</label>
                            <select className="form-control" required={true} name="Vendor" title="Vendor" value={this.state.formData.Vendor || this.state.trFormdata.ItemsData[i].Vendor} onChange={this.handleChangeDaynamic} id={i + '_Vendor'} disabled={true}>{/* this.state.DynamicDisabled */}
                                <option value=''>None</option>
                                {this.state.Vendors.map((option) => (
                                    <option value={option.Vendor_x0020_Number} selected={this.state.trFormdata.ItemsData[i].Vendor == option.Title}>{`${option.Title} (${option.Vendor_x0020_Number})`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Program</label>
                            <select className="form-control" required={true} name="Program" title="Program" value={this.state.trFormdata.ItemsData[i].Program} onChange={this.handleChangeDaynamic} id={i + '_Program'} disabled={this.state.DynamicDisabled}>
                                <option value=''>None</option>
                                {this.state.Programs.map((option) => (
                                    <option value={option.Title} selected={this.state.trFormdata.ItemsData[i].Program == option.Title}>{option.Title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="row pt-2 px-2">
                    <div className="col-md-3" hidden={this.state.trFormdata.ItemsData[i].ProgramLable == ''}>
                        <div className="light-text">
                            <label>{this.state.trFormdata.ItemsData[i].ProgramLable}</label>
                            <input className="form-control" required={true} placeholder="" type="text" name="ProgramNumber" title={this.state.trFormdata.ItemsData[i].ProgramLable} value={this.state.trFormdata.ItemsData[i].ProgramNumber || ''} onChange={this.handleChangeDaynamic} id={i + '_ProgramNumber'} autoComplete="off" disabled={this.state.DynamicDisabled} ref={this[i + "ProgramNumber"]} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="light-text">
                            <label>Description</label>
                            <textarea rows={2} className="form-control" maxLength={750} placeholder="" name="Description" title="Description" value={this.state.trFormdata.ItemsData[i].Description || ''} autoComplete="false" onChange={this.handleChangeDaynamic} id={i + '_Description'} disabled={this.state.DynamicDisabled} ref={this[i + "Description"]}></textarea>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="light-text">
                            <label>CMS Req# </label>
                            <input className="form-control" required={true} placeholder="" name="CMSReq" title="CMSReq" value={this.state.trFormdata.ItemsData[i].CMSReq || ''} autoComplete="off" disabled={true} />
                        </div>
                    </div>
                </div>

            </div>);
        }
        return section;
    }

    private createUI = () => {
        const trFormdata = { ...this.state.trFormdata };
        let prvcount = this.state.currentdivCount;
        let count = prvcount + 1;
        let newobj = {
            Quantity: '',
            QuantityUnit: '',
            UnitPrice: null,
            Unit: null,
            VPT: '',
            DateRequired: null,
            Vendor: '',
            Description: '',
            ProgramLable: '',
            ProgramNumber: null,
        };
        if(trFormdata.ItemsData.length>0){ let tempitem = trFormdata.ItemsData[trFormdata.ItemsData.length-1];
            newobj.DateRequired= tempitem.DateRequired;
            newobj.Vendor= tempitem.Vendor;
            newobj.QuantityUnit= tempitem.QuantityUnit;
            newobj.Unit=tempitem.Unit
        }
        else{
            newobj.Vendor=this.state.formData.Vendor;
        }
        this[prvcount + "Quantity"] = React.createRef();
        this[prvcount + "QuantityUnit"] = React.createRef();
        this[prvcount + "UnitPrice"] = React.createRef();
        this[prvcount + "Unit"] = React.createRef();
        this[prvcount + "VPT"] = React.createRef();
        this[prvcount + "Description"] = React.createRef();
        this[prvcount + "ProgramNumber"] = React.createRef();
        trFormdata.ItemsData.push(newobj);
        this.setState({ trFormdata, currentdivCount: count });
    }

    private RemoveDiv = (event) => {
        const trFormdata = { ...this.state.trFormdata };
        let rowcount = parseInt(event.target.id.split('_')[0]);
        let reqitems = trFormdata.ItemsData;
        trFormdata.ItemsData = [];
        const vendorCurr = this.state.formData.Currency;
        let currValue = vendorCurr !="" ? this.state.ExchangeRates.filter(item=>item.Title==vendorCurr)[0].rate:1;
        for (var i = 0; i < reqitems.length; i++) {
            if (i != rowcount)
                trFormdata.ItemsData.push(reqitems[i]);
        }
        let count = this.state.currentdivCount - 1;
        let Total = 0;
        let currAmount = 0;
        trFormdata.ItemsData.map((selItem, index) => {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice;
            currAmount = currAmount + (Quantity * UnitPrice);
        });
        Total = currAmount/currValue;
        trFormdata.TotalAmount = Total;
        this.setState({ trFormdata, currentdivCount: count });
    }

    private handlePlantChange = (event) => {
      
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.value;
        let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
        let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');
        var selectedIndex = event.nativeEvent.target.selectedIndex;
        formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
        // formData['Database'] = this.Company == 'Mayco' ? 'CMSDAT' : 'CMSDAT';
        formData[name] = event.nativeEvent.target[selectedIndex].text;
        formData['Department'] = '';
        formData['PlantCode'] = customAttrPlantCode != 'None' ? customAttrPlantCode : null;
        // formData[name] = value != 'None' ? value : null;

        this.loadVendoronPlantChange(formData.Plant, formData);
        // this.rootweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + formData.Plant + "'").select("*").orderBy("Title").get().then((response: any) => {
        //     
        //     // this.setState({ formData, Departments: response });
        // }).catch(e => {
        //     this.onError();
        //     console.log(e);
        // });
        
    }

    private async loadVendoronPlantChange(Plant, formData) {
        try {
            this.setState({ loading:true });
            let departments: any = await this.rootweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + formData.Plant + "'").select("*").orderBy("Title").get();
           // let vendors: any = await sp.web.lists.getByTitle('Vendor').items.filter(`IsActive eq 1 and Database eq '${formData.Database}' `).select("*").orderBy('Title').getAll();
            let vendors:any= await sp.web.lists.getByTitle("Vendor").items.select("*").orderBy('Title').getAll();
            var RequsitionerCodes: any = await sp.web.lists.getByTitle('RequsitionerCodes').items.filter(`IsActive eq 1 and Database eq '${formData.Database}'`).select("*").orderBy('Requsitioner_x0020_Code').getAll();
           var Buyers: any = await sp.web.lists.getByTitle('Buyers').items.filter(`Database eq '${formData.Database}' and IsActive eq 1`).select("*").orderBy('Title').getAll();
           // as database = CMSDAT removing it from  rest calls by Riyaz on 1/12/21
           // var Buyers: any = await sp.web.lists.getByTitle('Buyers').items.filter(`IsActive eq 1`).select("*").orderBy('Title').getAll();
           vendors=vendors.filter(x=>(x.Database==formData.Database && x.IsActive==true));
           vendors = sortDataByTitle(vendors, "Title");
            RequsitionerCodes = sortDataByTitle(RequsitionerCodes, "Requsitioner_x0020_Desc");
            Buyers = sortDataByTitle(Buyers, "Title");

            this.setState({ Vendors: vendors, formData, RequsitionerCode: RequsitionerCodes, Buyers: Buyers, Departments: departments,Vendor:vendors,loading:false });
        } catch (error) {
            this.onError();
            this.setState({ loading:false });
            console.log(error);
        }
    }

    private handleDeparmentChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.value;
        formData[name] = value != 'None' ? value : null;
        this.setState({ formData });
        this.getDepartmentsbasedDeatils(formData.Company, formData.Plant, event.target.value);
    }

    //private async getPlantbasedDeatils(Company, Plant) {
    //let Departments: any = await 
    // let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and Company eq '" + Company + "' and Plant eq '" + Plant + "'").select('*').get();
    // if(ApprovalsMatrix != null && ApprovalsMatrix.length>0)
    // this.setState({ Departments: Departments, ApprovalsMatrix: ApprovalsMatrix });
    // else{
    //     this.setState({ modalTitle: 'Error', modalText: ActionStatus.configMaster, showHideModal: true, loading: false, isSuccess: false, ItemID: 0,Errorclose:true });
    // }

    //}

    private async getDepartmentsbasedDeatils(Company, Plant, Department) {
        let filterQuery = "IsActive eq 1 and Company eq '" + Company + "' and Plant eq '" + Plant + "' and Department eq'" + Department + "'";
        let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter(filterQuery).select('*').get();
        if (ApprovalsMatrix != null && ApprovalsMatrix.length > 0)
            this.setState({ ApprovalsMatrix: ApprovalsMatrix });
        else {
            this.setState({ modalTitle: 'Error', modalText: ActionStatus.configMaster, showHideModal: true, loading: false, isSuccess: false, ItemID: 0, Errorclose: true });
        }
    }
    private _getPeoplePickerItems(items, name) {
        let RequisitionerUserId = null;
        if (items.length > 0) {
            RequisitionerUserId = items[0].id;
        }
        else {
            RequisitionerUserId = null;
        }
        this.setState({ RequisitionerUserId: RequisitionerUserId });
    }

    private handleMasterSubmit = (event) => {
        event.preventDefault();
        let data = {
            //Company: { val: this.state.formData.Company, required: true, Name: 'Company', Type: ControlType.string, Focusid: this.Company },
            plant: { val: this.state.formData.Plant, required: true, Name: 'Plant', Type: ControlType.string, Focusid: this.Plant },
            Department: { val: this.state.formData.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.ddlDepartment },
            Requisitioner: { val: this.state.RequisitionerUserId, required: true, Name: 'Requisitioner', Type: ControlType.people, Focusid: 'divRequisitioner' },
            requsitionerCode: { val: this.state.formData.RequsitionerCode, required: true, Name: 'Requisitioner Code', Type: ControlType.string, Focusid: this.RequsitionerCode },
            buyerCode: { val: this.state.formData.Buyer, required: true, Name: 'Buyer', Type: ControlType.string, Focusid: this.buyercode },
            vendorCode: { val: this.state.formData.Vendor, required: false, Name: 'Vendor', Type: ControlType.string, Focusid: this.ddlVendor },
            // projectCode: { val: this.state.formData.ProjectCode, required: true, Name: 'Project code', Type: ControlType.string, Focusid: this.ddlProjectCode },
            //commodityCategoryCode: { val: this.state.formData.CommodityCategory, required: true, Name: 'Commodity category', Type: ControlType.string, Focusid: this.ddlCommodityCategory },
            description: { val: this.state.formData.Description, required: true, Name: 'Reason', Type: ControlType.string, Focusid: this.description },
        };
        const formdata = { ...this.state.formData, RequisitionerId: this.state.RequisitionerUserId };
        //const id = this.props.match.params.id;
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.setState({ loading: true, showLabel: false, errorMessage: isValid.message,isInitiatorEdit: true });
            this.InsertorUpdatedata(formdata, ActionStatus.Submitted);
        }
        else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }
    private formData =()=>{
        let data = {
            //Company: { val: this.state.formData.Company, required: true, Name: 'Company', Type: ControlType.string, Focusid: this.Company },
            plant: { val: this.state.formData.Plant, required: true, Name: 'Plant', Type: ControlType.string, Focusid: this.Plant },
            Department: { val: this.state.formData.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.ddlDepartment },
            Requisitioner: { val: this.state.RequisitionerUserId, required: true, Name: 'Requisitioner', Type: ControlType.people, Focusid: 'divRequisitioner' },
            requsitionerCode: { val: this.state.formData.RequsitionerCode, required: true, Name: 'Requisitioner Code', Type: ControlType.string, Focusid: this.RequsitionerCode },
            buyerCode: { val: this.state.formData.Buyer, required: true, Name: 'Buyer', Type: ControlType.string, Focusid: this.buyercode },
            vendorCode: { val: this.state.formData.Vendor, required: false, Name: 'Vendor', Type: ControlType.string, Focusid: this.ddlVendor },
            // projectCode: { val: this.state.formData.ProjectCode, required: true, Name: 'Project code', Type: ControlType.string, Focusid: this.ddlProjectCode },
            //commodityCategoryCode: { val: this.state.formData.CommodityCategory, required: true, Name: 'Commodity category', Type: ControlType.string, Focusid: this.ddlCommodityCategory },
            description: { val: this.state.formData.Description, required: true, Name: 'Reason', Type: ControlType.string, Focusid: this.description },

        };
        return data;
    }
    private handlePurchageSubmit = async (event) => {
        let masterData = this.formData();
        let emaildetails ={toemail:[],ccemail:[],subject:"Purchase Request waiting for your Approval",bodyString:"Purchase Request has been submitted successfully.",body:'' };
        let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Vendor:this.state.formData.VendorName!=null?this.state.formData.VendorName:'',Buyer:this.state.formData.Buyer,Currency:this.state.formData.Currency,CurrencyAmount:this.state.trFormdata.CurrencyAmount,'TotalAmount(USD)':this.state.trFormdata.TotalAmount,Reason:this.state.formData.Description};
        emaildetails.body = this.emailBodyPreparation(this.siteURL+'/SitePages/Home.aspx#/purchaserequest/'+this.state.ItemID,tableContent,emaildetails.bodyString,this.userContext.userDisplayName);
        const data = { ...this.state.trFormdata,...this.state.formData, RequisitionerId: this.state.RequisitionerUserId, isEscalate: false };
        data.Status = ApprovalStatus.InProgress;
        //var validationdata = {};
        if(data.Vendor!="" && data.Vendor!=null){
        data.ItemsData.map((item,i)=>{
            data.ItemsData[i].Vendor=data.Vendor;
        });}
        let itemsData = JSON.stringify(data.ItemsData);
        let validationdata = {};
        var parentthis = this;
        data.ItemsData.map((selItem, index) => {
            validationdata["Quantity" + index] = { val: selItem.Quantity, required: true, Name: 'Quantity', Type: ControlType.number, Focusid: parentthis[index + 'Quantity'] };
            validationdata["QuantityUnit" + index] = { val: selItem.QuantityUnit, required: true, Name: 'Quantity for Unit', Type: ControlType.string, Focusid: parentthis[index + 'QuantityUnit'] };
            validationdata["UnitPrice" + index] = { val: selItem.UnitPrice, required: true, Name: 'Unit Price', Type: ControlType.number, Focusid: parentthis[index + 'UnitPrice'] };
            validationdata["Unit" + index] = { val: selItem.Unit, required: true, Name: 'Price for Unit', Type: ControlType.string, Focusid: parentthis[index + 'Unit'] };
            validationdata["VPT" + index] = { val: selItem.VPT, required: false, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
            validationdata["ProgramNumber" + index] = { val: selItem.ProgramNumber, required: false, Name: 'ProgramNumber', Type: ControlType.string, Focusid: parentthis[index + 'ProgramNumber'] };
            validationdata["Description" + index] = { val: selItem.Description, required: false, Name: 'Description', Type: ControlType.string, Focusid: parentthis[index + 'Description'] };
            // validationdata["Description" + index] = { val: selItem.Description, required: false, Name: 'Description/Reason', Type: ControlType.string, Focusid: parentthis[index + 'Description'] };
            // validationdata["VPT" + index] = { val: selItem.VPT, required: true, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
        });
        delete data.ItemsData;
        data.ItemsDatajson = itemsData;
        let isValidMaster = Formvalidator.checkValidations(masterData);
        let isValid;
        if(isValidMaster)
            isValid = formValidation.checkValidations(validationdata);
        if (isValidMaster.status && isValid.status) {
            let comments = this.state.Comments;
            let prvComments = data.Commentsdata;
            // if (comments != '') {
            let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: 'Submit', Role: 'Requisitioner', Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
            prvComments.push(curcomments);
            //}
            let prvcommentsdata = JSON.stringify(prvComments);
            delete data.Commentsdata;
            data.Comments = prvcommentsdata;
            let InformToId=0;
            for (var i = 0; i < this.state.ApprovalsMatrix.length; i++) {
                if (this.state.ApprovalsMatrix[i].FromBudget <= data.TotalAmount && this.state.ApprovalsMatrix[i].ToBudget >= data.TotalAmount) {
                    data.AssignToId = this.state.ApprovalsMatrix[i].Approval1Id;
                    InformToId = this.state.ApprovalsMatrix[i].InformToId!= null?this.state.ApprovalsMatrix[i].InformToId:0;
                    if (this.state.ApprovalsMatrix[i].Approval2Id != null)
                        data.NextApprovalId = this.state.ApprovalsMatrix[i].Approval2Id;
                    else if (this.state.ApprovalsMatrix[i].Approval3Id != null)
                        data.NextApprovalId = this.state.ApprovalsMatrix[i].Approval3Id;
                    else if (this.state.ApprovalsMatrix[i].Approval4Id != null)
                        data.NextApprovalId = this.state.ApprovalsMatrix[i].Approval4Id;
                    else if(data.TotalAmount>1000)
                        data.NextApprovalId = this.state.ApprovalsMatrix[i].ReviewerId;
                    data.ApprovalLevel = "1";
                    data.Pendingwith = PendingStatus.Level1; //"Approver 1"; 
                    data.Approver1Id = this.state.ApprovalsMatrix[i].Approval1Id;
                    data.Approver2Id = this.state.ApprovalsMatrix[i].Approval2Id;
                    data.Approver3Id = this.state.ApprovalsMatrix[i].Approval3Id;
                    data.Approver4Id = this.state.ApprovalsMatrix[i].Approval4Id;
                    data.ReviewerId  =  this.state.ApprovalsMatrix[i].ReviewerId;
                }
            }
            if (data.AssignToId == null) {
                data.ApprovalLevel = '';
                data.Status = ApprovalStatus.Approved;
                data.Pendingwith = '';
            }
            else{
                let grpusers= await sp.web.siteGroups.getById(data.AssignToId).users();
                emaildetails.toemail= grpusers.map(user=>user.Email);
                let InformUsers =InformToId !=0?await sp.web.siteGroups.getById(InformToId).users():[];
                emaildetails.ccemail=InformUsers.map(user=>user.Email);
                emaildetails.ccemail.push(this.userContext.userEmail);
            }
            this.setState({ loading: true, showLabel: false, errorMessage: isValid.message });
            this.insertorupdateListitem(data, ActionStatus.Submitted,emaildetails);
        }
        else
            this.setState({ errorMessage: isValid.message });
    }
    private handlePurchageSave = (event) => {
        let masterData = this.formData();
        const data = { ...this.state.trFormdata,...this.state.formData, RequisitionerId: this.state.RequisitionerUserId, isEscalate:false };
        data.Status = ApprovalStatus.draft;
        if(data.Vendor!="" && data.Vendor!=null){
            data.ItemsData.map((item,i)=>{
                data.ItemsData[i].Vendor=data.Vendor;
            });
        }
        let itemsData = JSON.stringify(data.ItemsData);
        let validationdata = {};
        var parentthis = this;
        let comments = this.state.Comments;
        let prvComments = data.Commentsdata;
        // if (comments != '') {
        let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: 'Save', Role: 'Requisitioner', Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
        prvComments.push(curcomments);
        // }
        let prvcommentsdata = JSON.stringify(prvComments);
        delete data.Commentsdata;
        data.Comments = prvcommentsdata;
        data.ItemsData.map((selItem, index) => {
            validationdata["Quantity" + index] = { val: selItem.Quantity, required: true, Name: 'Quantity', Type: ControlType.number, Focusid: parentthis[index + 'Quantity'] };
            validationdata["QuantityUnit" + index] = { val: selItem.QuantityUnit, required: true, Name: 'Quantity for Unit', Type: ControlType.string, Focusid: parentthis[index + 'QuantityUnit'] };
            validationdata["UnitPrice" + index] = { val: selItem.UnitPrice, required: true, Name: 'Unit Price', Type: ControlType.number, Focusid: parentthis[index + 'UnitPrice'] };
            validationdata["Unit" + index] = { val: selItem.Unit, required: true, Name: 'Price for Unit', Type: ControlType.string, Focusid: parentthis[index + 'Unit'] };
            // validationdata["VPT" + index] = { val: selItem.VPT, required: true, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
            validationdata["VPT" + index] = { val: selItem.VPT, required: false, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
            validationdata["ProgramNumber" + index] = { val: selItem.ProgramNumber, required: false, Name: 'ProgramNumber', Type: ControlType.string, Focusid: parentthis[index + 'ProgramNumber'] };
            validationdata["Description" + index] = { val: selItem.Description, required: false, Name: 'Description', Type: ControlType.string, Focusid: parentthis[index + 'Description'] };
            data.ItemsData[index].Vendor=data.Vendor
        });
        delete data.ItemsData;
        data.ItemsDatajson = itemsData;
        let isValidMaster = Formvalidator.checkValidations(masterData);
        //this.InsertorUpdatedata(data);
        this.setState({ loading: true });
        if(isValidMaster.status){
        this.insertorupdateListitem(data, ActionStatus.Draft,'');}
        else{
            this.setState({ showLabel: true, errorMessage: isValidMaster.message });
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
    private handleApprove = async () => {
        //this.ExportExcel();
        const data = { ...this.state.trFormdata };
        let comments = this.state.Comments;
        let prvComments = data.Commentsdata;
        let emaildetails ={toemail:[],ccemail:[],subject:"Purchase Request waiting for your Approval",bodyString:"Purchase Request has been submitted successfully.",body:'' };
        //let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Buyer:this.state.formData.Buyer,TotalAmount:this.state.trFormdata.TotalAmount};
        let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Vendor:this.state.formData.VendorName!=null?this.state.formData.VendorName:'',Buyer:this.state.formData.Buyer,Currency:this.state.formData.Currency,CurrencyAmount:this.state.trFormdata.CurrencyAmount,TotalAmount:this.state.trFormdata.TotalAmount,Reason:this.state.formData.Description};
        // if (comments != '') {
        let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: 'Approve', Role: `${data.ApprovalLevel == "5" ? "Purchasing manager" : "Approver " + data.ApprovalLevel}`, Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
        prvComments.push(curcomments);
        // }
        let prvcommentsdata = JSON.stringify(prvComments);
        var InformToId =0;
        const submitdata = { AssignToId: null, Status: ApprovalStatus.InProgress, ApprovalLevel: "", NextApprovalId: null, Pendingwith: '', Approver1Id: null, Approver2Id: null, Approver3Id: null,Approver4Id: null, ReviewerId: null,PurchasingTeamId:null, Comments: prvcommentsdata,isEscalate:false,DateApproved:null };
        for (var i = 0; i < this.state.ApprovalsMatrix.length; i++) {
            if (this.state.ApprovalsMatrix[i].FromBudget <= data.TotalAmount && this.state.ApprovalsMatrix[i].ToBudget >= data.TotalAmount) {
            var PurchasingTeam =this.state.ApprovalsMatrix[i].PurchasingTeamId;
             InformToId = this.state.ApprovalsMatrix[i].InformToId!= null?this.state.ApprovalsMatrix[i].InformToId:0;
                if (data.ApprovalLevel == "1") {
                    //if(data.TotalAmount>=1000){
                        if (this.state.ApprovalsMatrix[i].Approval2Id != null) {
                            submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval2Id;
                            submitdata.ApprovalLevel = "2";
                            submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].Approval3Id;
                            submitdata.Pendingwith = PendingStatus.Level2;//"Approver 2"; 
                        }
                        else if (this.state.ApprovalsMatrix[i].Approval3Id != null) {
                            submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval3Id;
                            submitdata.ApprovalLevel = "3";
                            submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].Approval4Id;
                            submitdata.Pendingwith = PendingStatus.Level3;//"Approver 3"; 
                        }else if (this.state.ApprovalsMatrix[i].Approval4Id != null) {
                            submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval4Id;
                            submitdata.ApprovalLevel = "4";
                            submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].ReviewerId;
                            submitdata.Pendingwith = PendingStatus.Level4;//"Approver 4"; 
                        }
                         else if(data.TotalAmount>=1000 && this.state.ApprovalsMatrix[i].ReviewerId != null) {
                            submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                            submitdata.ApprovalLevel = "5";
                            submitdata.NextApprovalId = null;
                            submitdata.Pendingwith = PendingStatus.Level5; //"Reviewer"; 
                        }
                   // }
                }
                else if (data.ApprovalLevel == "2") {
                    if (this.state.ApprovalsMatrix[i].Approval3Id != null) {
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval3Id;
                        submitdata.ApprovalLevel = "3";
                        submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].Approval4Id;
                        submitdata.Pendingwith = PendingStatus.Level3;//"Approver 3"; 
                    }
                    else if (this.state.ApprovalsMatrix[i].Approval4Id != null) {
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval4Id;
                        submitdata.ApprovalLevel = "4";
                        submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].ReviewerId;
                        submitdata.Pendingwith = PendingStatus.Level4;//"Approver 4"; 
                    }
                    else  if(data.TotalAmount>=1000 && this.state.ApprovalsMatrix[i].ReviewerId != null){
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                        submitdata.ApprovalLevel = "5";
                        submitdata.NextApprovalId = null;
                        submitdata.Pendingwith = PendingStatus.Level5; //"Reviewer"; 
                    }
                }
                else if (data.ApprovalLevel == "3") {
                    if (this.state.ApprovalsMatrix[i].Approval4Id != null) {
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval4Id;
                        submitdata.ApprovalLevel = "4";
                        submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].ReviewerId;
                        submitdata.Pendingwith = PendingStatus.Level4;//"Approver 4"; 
                    }else if(this.state.ApprovalsMatrix[i].ReviewerId != null && data.TotalAmount>=1000){
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                        submitdata.ApprovalLevel = "5"; // 20-02-2023 value change 4 to 5 as issue in approval, has approval going to twice  to purchasing manager
                        submitdata.NextApprovalId = null;
                        submitdata.Pendingwith = PendingStatus.Level5; //"Reviewer"; 
                    }
                }
                else if (data.ApprovalLevel == "4" && this.state.ApprovalsMatrix[i].ReviewerId != null && data.TotalAmount>=1000) {
                        submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                        submitdata.ApprovalLevel = "5";
                        submitdata.NextApprovalId = null;
                        submitdata.Pendingwith = PendingStatus.Level5; //"Reviewer"; 
                    
                }
                else if (data.ApprovalLevel == "Escalation" && this.state.ApprovalsMatrix[i].ReviewerId != null && data.TotalAmount>=1000) {
                    submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                    submitdata.ApprovalLevel = "5";
                    submitdata.NextApprovalId = null;
                    submitdata.Pendingwith = PendingStatus.Level5; //"Reviewer"; 
                }
                submitdata.Approver1Id = this.state.ApprovalsMatrix[i].Approval1Id;
                submitdata.Approver2Id = this.state.ApprovalsMatrix[i].Approval2Id;
                submitdata.Approver3Id = this.state.ApprovalsMatrix[i].Approval3Id;
                submitdata.Approver4Id = this.state.ApprovalsMatrix[i].Approval4Id;
                submitdata.ReviewerId = this.state.ApprovalsMatrix[i].ReviewerId;
                submitdata.PurchasingTeamId = this.state.ApprovalsMatrix[i].PurchasingTeamId;
                emaildetails.body = this.emailBodyPreparation(this.siteURL+'/SitePages/Home.aspx#/purchaserequest/'+this.state.ItemID,tableContent,emaildetails.bodyString,this.state.authorId.Title);
                break;
            }
        }
        if (submitdata.AssignToId == null) {
            emaildetails.toemail= [this.state.authorId.EMail];
            let grpusers= await sp.web.siteGroups.getByName('MRO Purchasing Team').users();
            let PurchasingTeamUsers= PurchasingTeam !=null?await sp.web.siteGroups.getById(PurchasingTeam).users():[];
            let InformToUsers= InformToId !=0?await sp.web.siteGroups.getById(InformToId).users():[];
            // emaildetails.ccemail= grpusers.map(user=>user.Email);
            for(let k in PurchasingTeamUsers){emaildetails.ccemail.push(PurchasingTeamUsers[k].Email);}
            for(let j in InformToUsers){emaildetails.ccemail.push(InformToUsers[j].Email);}
            emaildetails.subject ="Purchase Request has been approved successfully";
            emaildetails.bodyString = "Purchase Request has been approved successfully.";
            emaildetails.body = this.emailBodyPreparation(this.siteURL+'/SitePages/Home.aspx#/purchaserequest/'+this.state.ItemID,tableContent,emaildetails.bodyString,this.userContext.userDisplayName); 
            submitdata.Status = ApprovalStatus.Approved;
            submitdata.DateApproved = new Date();
            submitdata.Pendingwith = PendingStatus.Empty;
            this.checkUserInPurchasingGroup();
        }
        else{
            let grpusers= await sp.web.siteGroups.getById(submitdata.AssignToId).users();
            emaildetails.toemail= grpusers.map(user=>user.Email);
             let InformToUsers= InformToId !=0?await sp.web.siteGroups.getById(InformToId).users():[];
             emaildetails.ccemail= InformToUsers.map(user=>user.Email);
        }
        this.setState({ loading: true });
        this.insertorupdateListitem(submitdata, ActionStatus.Approved,emaildetails);
    }
    
    private async ExportExcel() {
        let now = new Date();
        let addonemoreday = new Date(now.getTime() + 86400000);
        // let last30days = new Date(now.setDate(now.getDate() - 30));
        let last0days = new Date(now.setDate(now.getDate() - 1));
        // let filterQuery = `(Status eq 'Purchasing Team Updated' or Status eq 'Approved') and (Modified ge datetime'${last0days.toISOString()}' and Modified le datetime'${addonemoreday.toISOString()}')`;
        let filterQuery = `(Status eq 'Purchasing Team Updated' or Status eq 'Approved') and (Modified ge datetime'${last0days.toISOString()}')`;
        let selRequisitions: any = await sp.web.lists.getByTitle(this.TrListname).items.filter(filterQuery).select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/UserName', '*').expand('Requisitioner').getAll();
        // let newfileContent = "Master Req#\t Company\t Plant\t Plant Code\t Database\t Department\t Buyer\t Project Code\t Commodity Category\t Description\t Total Amount \t Purchase Req# \t Quantity\t Quantity for Unit\t Unit Price\tPrice for Unit\tVPT# \tDate required \tVendor \tProgram \tDescription/Reason \tRequsitioner Code \tCMS Req# \n ";
        let newfileContent = "Master Req# , Company , Plant , Plant Code , Database , Department , Requsitioner Code , Buyer , Project Code , Commodity Category , Reason , Total Amount , Purchase Req# , Quantity , Quantity for Unit ,  Unit Price , Price for Unit , VPT# , Date required , Vendor , Program , Description , CMS Req# \n ";
        selRequisitions.map((selItem, index) => {
            let Itemsdata = JSON.parse(selItem.ItemsDatajson);
            let commentsdata = selItem.Comments ? JSON.parse(selItem.Comments) : '';

            Itemsdata.map((Item, i) => {
                let newDateFormat = '';
                let CommodityCategory = '';
                let PlantCode = '';
                let Database = '';
                let RequsitionerCode = '';
                let ProjectCode = '';
                let PurchaseRequestCount = 1;
                let cmsReq ='';
                if (Item.DateRequired != null) {
                    let itemDate = new Date(Item.DateRequired);
                    newDateFormat = `" "${itemDate.getFullYear() +'-' + (itemDate.getMonth() + 1) + '-' + itemDate.getDate()}`;
                }
                if (selItem.ProjectCode != null) {
                    ProjectCode = selItem.ProjectCode;
                }
                if (selItem.CommodityCategory != null) {
                    CommodityCategory = selItem.CommodityCategory;
                }
                if (selItem.PlantCode != null) {
                    PlantCode = selItem.PlantCode;
                }
                if (selItem.Database != null) {
                    Database = selItem.Database;
                }
                if (selItem.RequsitionerCode != null) {
                    RequsitionerCode = selItem.RequsitionerCode;
                }
                if (i >= 1) {
                    PurchaseRequestCount = i + 1;
                }
                if (!['',null,undefined].includes(Item.CMSReq)) {
                    cmsReq =  Item.CMSReq;
                }

                // newfileContent += "" + selItem.Id + "\t" + selItem.Company + "\t" + selItem.Plant + "\t" + PlantCode + "\t" + Database + "\t" + selItem.Department + "\t" + selItem.Buyer + "\t" + ProjectCode + "\t" + CommodityCategory + "\t" + selItem.Description + "\t" + selItem.TotalAmount + "\t" + PurchaseRequestCount + "\t" + Item.Quantity + "\t" + Item.QuantityUnit + "\t" + Item.UnitPrice + "\t" + Item.Unit + "\t" + Item.VPT + "\t" + newDateFormat + "\t" + Item.Vendor + "\t" + Item.Program + "\t" + Item.Description + "\t" + RequsitionerCode + "\t" + cmsReq +"\n";
                newfileContent += "" + selItem.Id + "," + selItem.Company + "," + selItem.Plant + "," + PlantCode + "," + Database + "," + selItem.Department + "," + RequsitionerCode + "," + selItem.Buyer + "," + ProjectCode + "," + CommodityCategory + "," +  selItem.Description.replaceAll(',',' ') + "," + selItem.TotalAmount + "," + PurchaseRequestCount + "," + Item.Quantity + "," + Item.QuantityUnit + "," + Item.UnitPrice + "," + Item.Unit + "," + Item.VPT + "," + newDateFormat + "," + Item.Vendor + "," + Item.Program + "," + Item.Description.replaceAll(',',' ') + "," + cmsReq +"\n";
            });
        });
        let siteAbsoluteURL = this.props.context.pageContext.web.serverRelativeUrl;
        let exportDate = "" + new Date().getFullYear() + "" + (new Date().getMonth() + 1) + "" + new Date().getDate() + "" + new Date().getHours() + "" + new Date().getMinutes() + "";
        // sp.web.getFolderByServerRelativeUrl(siteAbsoluteURL + "/MROExcels/From%20SharePoint").files.add(exportDate + '.csv', newfileContent, true).then((responce) => {
        // }, (Error) => {
        //     console.log(Error);
        //     this.onError();
        // });
    }

    private handleReject = (e) => {
        //let validationdata = {};
        const data = { ...this.state.trFormdata };
        let validationdata = {
            comments: { val: this.state.Comments, required: true, Name: 'Comments', Type: ControlType.string, Focusid: this.txtComments },
        };
        let emaildetails ={toemail:[],ccemail:[],subject:"Purchase Request rejected  successfully",bodyString:"Purchase Request rejected successfully.",body:'' };
        //let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Buyer:this.state.formData.Buyer,TotalAmount:this.state.trFormdata.TotalAmount};
        let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Vendor:this.state.formData.VendorName!=null?this.state.formData.VendorName:'',Buyer:this.state.formData.Buyer,TotalAmount:this.state.trFormdata.TotalAmount,Reason:this.state.formData.Description};
        let grpusers=[];
        let isValid = formValidation.checkValidations(validationdata);
        let newFileArry = this.state.fileArr.filter((file) => {
            return file.IsNew == true;
        });

        if (isValid.status) {
            let comments = this.state.Comments;
            let prvComments = this.state.trFormdata.Commentsdata;
            if (comments != '') {
                let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: 'Reject', Role: `${data.ApprovalLevel == "5" ? "Purchasing manager" : "Approver " + data.ApprovalLevel}`, Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
                prvComments.push(curcomments);
            }
            let prvcommentsdata = JSON.stringify(prvComments);
            const submitdata = { AssignToId: null, Status: ApprovalStatus.Rejected, ApprovalLevel: "", Pendingwith: PendingStatus.Empty, NextApprovalId: null, Comments: prvcommentsdata };
            this.setState({ loading: true });
            //this.InsertorUpdatedata(submitdata,ActionStatus.Rejected);
            emaildetails.body = this.emailBodyPreparation(this.siteURL+'/SitePages/Home.aspx#/purchaserequest/'+this.state.ItemID,tableContent,emaildetails.bodyString,this.userContext.userDisplayName);
            emaildetails.toemail= [this.state.authorId.EMail];
            // emaildetails.ccemail= [this.userContext.userEmail];
            emaildetails.ccemail=[];
            this.insertorupdateListitem(submitdata, ActionStatus.Rejected,emaildetails);
        } else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }

    private handleWithdraw = (e) => {
        //let validationdata = {};
        const data = { ...this.state.trFormdata };
        let validationdata = {
            comments: { val: this.state.Comments, required: true, Name: 'Comments', Type: ControlType.string, Focusid: this.txtComments },
        };
        let emaildetails ={toemail:[],ccemail:[],subject:"Purchase Request withdraw  successfully",bodyString:"Purchase Request withdraw successfully.",body:'' };
        let tableContent ={Company:this.state.formData.Company,Plant:this.state.formData.Plant,Department:this.state.formData.Department,Vendor:this.state.formData.VendorName!=null?this.state.formData.VendorName:'',Buyer:this.state.formData.Buyer,Currency:this.state.formData.Currency,CurrencyAmount:this.state.trFormdata.CurrencyAmount,'TotalAmount(USD)':this.state.trFormdata.TotalAmount};
        let grpusers=[];
        let isValid = formValidation.checkValidations(validationdata);
         if (isValid.status) {
            let comments = this.state.Comments;
            let prvComments = this.state.trFormdata.Commentsdata;
            if (comments != '') {
                let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: ApprovalStatus.Withdraw, Role: `Requisitioner`, Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
                prvComments.push(curcomments);
            }
            let prvcommentsdata = JSON.stringify(prvComments);
            const submitdata = { AssignToId: null, Status: ApprovalStatus.Withdraw, ApprovalLevel: "", Pendingwith: PendingStatus.Empty, NextApprovalId: null, Comments: prvcommentsdata };
            this.setState({ loading: true });
            //this.InsertorUpdatedata(submitdata,ActionStatus.Rejected);
            emaildetails.body = this.emailBodyPreparation(this.siteURL+'/SitePages/Home.aspx#/purchaserequest/'+this.state.ItemID,tableContent,emaildetails.bodyString,this.userContext.userDisplayName);
            emaildetails.toemail= [this.state.authorId.EMail];
            emaildetails.ccemail=[];
            this.insertorupdateListitem(submitdata, ActionStatus.Withdraw,emaildetails);
        } else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }


    private handleDelete=(e)=>{
        const submitdata = {IsActive:false};
        this.insertorupdateListitem(submitdata, ActionStatus.Deleted,[]);
    }

    private handleProcessPO=(event)=>{
        const poData = {...this.state.poData};
        poData["isPOProcessed"] = true;
        this.setState({ poData,showHideModalConfirm:true });

        // const classNames = {container:'confirm-modal',buttons:'btn',confirmButton:'btn-primary',cancelButton:'btn-secondary'};
        // const options = {
        //     labels: {
        //       confirmable: "Yes",
        //       cancellable: "No"
        //     },
        //     classNames:classNames
        //   };
        // const result = confirm("Are you sure?",options);
        // result.then((res1) => {
        //     if(res1){
        //         const submitdata = {isPOProcessed:true};
        //         this.insertorupdateListitem(submitdata, ActionStatus.PO,[]);
        //     }
        // });
      
    }

    private  printDocument=()=> {
        window.print();
    }

    private InsertorUpdatedata(formdata, actionStatus) {
        if (this.state.ItemID > 0) {                //update existing record
            sp.web.lists.getByTitle(this.TrListname).items.getById(this.state.ItemID).update(formdata).then((res) => {
                if (formdata.Status == ApprovalStatus.PurchasingTeamUpdated || formdata.Status == ApprovalStatus.Approved)
                    this.ExportExcel();
                this.onSucess(actionStatus, this.state.ItemID,'');
            }, (error) => {
                console.log(error);
                this.onError();
            });
        } else {                  //Add New record
            try {
                this.setState({ loading: true });
                sp.web.lists.getByTitle(this.TrListname).items.add(formdata).then((res) => {
                    let ItemID = res.data.Id;
                    this.props.match.params.id = ItemID;
                    this.onSucessMaster(actionStatus, ItemID);
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

    private insertorupdateListitem = (formData, actionStatus,emaildetails) => {
        this.setState({ loading: true });
        if (this.state.ItemID == 0) {
            try {
                sp.web.lists.getByTitle(this.TrListname).items.add(formData)
                    .then((res) => {
                        if(emaildetails!=''&& emaildetails.length!=0)
                        emaildetails.Subject= "Purchase Request [" +res.data.Id+ "] - "+actionStatus;
                        this.AddorUpdatelistItem(res.data.Id, actionStatus,emaildetails);
                    }, (Error) => {
                        console.log(Error);
                        this.onError();
                    })
                    .catch((err) => {
                        console.log(Error);
                        this.onError();
                    });
            }
            catch (e) {
                console.log(e);
            }
        } else {
            sp.web.lists.getByTitle(this.TrListname).items.getById(this.state.ItemID).update(formData).then((res) => {
                if (formData.Status == ApprovalStatus.PurchasingTeamUpdated || formData.Status == ApprovalStatus.Approved)
                    this.ExportExcel();
                if(emaildetails!=''&& emaildetails.length!=0)
                emaildetails.Subject= "Purchase Request [" +this.state.ItemID+ "] - "+actionStatus;
                this.AddorUpdatelistItem(this.state.ItemID, actionStatus,emaildetails);
            }, (Error) => {
                console.log(Error);
                this.onError();
            }).catch((err) => {
                this.onError();
                console.log(err);
            });
        }
    }
    private sendemail(Action,ItemID,emaildetails){
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,  
            //Subject of Email  
            Subject: emaildetails.subject,  
            //Array of string for To of Email  
            To: emaildetails.toemail,  
            CC: emaildetails.ccemail
          }).then((i) => {  
            //Set Success Message Bar after sending Email  
            this.setState({ modalTitle: 'Success', modalText: 'Requisition Details ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID,showHideModalConfirm:false });
          }).catch((i) => {  
            //Set Error Message Bar for any error  
            this.setState({  
              statusMessage: { isShowMessage: true, message: "Error", messageType: 1 }  
            });  
          });  
    }
    private async AddorUpdatelistItem(ItemID: number, actionStatus,emaildetails) {
        let processedFiles = 0;
        let newFileArry = [];
        newFileArry = this.state.fileArr.filter((file) => {
            return file.IsNew == true;
        });
        this.deleteListItem();
        if (newFileArry.length > 0) {
            for (const i in newFileArry) {
                let file = newFileArry[i];
                let siteAbsoluteURL = this.props.context.pageContext.web.serverRelativeUrl;
                sp.web.getFolderByServerRelativeUrl(siteAbsoluteURL + "/PurchaseRequestDocs").files.add(file.name, file, true).then((f) => {
                    f.file.getItem().then(item => {
                        item.update({
                            ItemID: ItemID
                        }).then((myupdate) => {
                            processedFiles = processedFiles + 1;
                            if (newFileArry.length == processedFiles) {
                              
                                this.onSucess(actionStatus, ItemID,emaildetails);
                            }
                        });
                    });

                }, (err) => {
                    console.log(Error);
                    this.onError();
                });
            }
        } else {
            this.onSucess(actionStatus, ItemID,emaildetails);
        }

    }

    private async deleteListItem() {
        let list = sp.web.lists.getByTitle("PurchaseRequestDocs");
        if (this.state.delfileArr.length > 0) {
            this.state.delfileArr.map((selItem, index) => {
                let itemId = selItem['FileID'];
                let item: any = list.items.getById(itemId).delete();
            });
        }
    }

    private onSucessMaster = (Action, ItemID) => {
        this.setState({ modalTitle: 'Success', modalText: 'Master Requisition ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID,showHideModalConfirm:false });
    }

    private onSucess = (Action, ItemID,emaildetails) => {
        if(Action == "submitted successfully" || Action == "rejected successfully"||Action == "approved successfully"){
            this.sendemail(Action,ItemID,emaildetails);
        }
        else{
            this.setState({ modalTitle: 'Success', modalText: 'Requisition Details ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID,showHideModalConfirm:false });
        }
        // this.setState({ modalTitle: 'Success', modalText: 'Requisition Details ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: ItemID });
    }

    private onError = () => {
        this.setState({ modalTitle: 'Error', modalText: ActionStatus.Error, showHideModal: true, loading: false, isSuccess: false, ItemID: 0 ,showHideModalConfirm:false});
    }

    //#endregion

    //#region Load Data
    private async GetMasterListData() {
        let projectCode: any = await sp.web.lists.getByTitle('ProjectCode').items.filter("IsActive eq 1").select('*').orderBy('Title').get();
        let commodityCategory: any = await sp.web.lists.getByTitle('CommodityCategory').items.filter("IsActive eq 1").select('*').orderBy('Title').get();
        let Vendors:any=[];
        let QUnits: any = await sp.web.lists.getByTitle('Units').items.filter("IsActive eq 1").select("*").orderBy('Title').get();
        let PUnits: any = await sp.web.lists.getByTitle('PriceUnit').items.filter("IsActive eq 1").select("*").orderBy('Title').get();
        let Plants: any = await this.rootweb.lists.getByTitle('Plant').items.filter("Status eq 1").select("*").orderBy("Title").get();
        let programs: any = await sp.web.lists.getByTitle('Programs').items.filter("IsActive eq 1").select("*").orderBy('Title').get();
        let exchangeRates: any = await sp.web.lists.getByTitle('exchangerates').items.select("*").orderBy('Title').get();
        let groups = await sp.web.currentUser.groups();
        this.userGroups=groups.filter(c=>c.Title.includes('MRO'));
        let groupIds = this.userGroups.map(grp=>grp.Id);
        let DynamicDisabled = false;
        let showHideDraftButtonforReject = false;
        let btnTextforRejectStatus = "Submit";
        if (this.props.match.params.id != undefined) {
            let trFormdata = { ...this.state.trFormdata };
            let formData = { ...this.state.formData };
            let ItemID = this.props.match.params.id;
            let selRequisitions: any = await sp.web.lists.getByTitle(this.TrListname).items.getById(ItemID).select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/UserName', 'Requisitioner/EMail', 'Author/Id', 'Author/Title', 'Author/UserName', 'Author/EMail', '*').expand('Requisitioner','Author').get();
            let files: any = await sp.web.lists.getByTitle('PurchaseRequestDocs').items.filter('ItemID eq ' + ItemID).expand('File').get();            

            let filesArry = [];
            files.map((selItem, index) => {
                let fileArray = {};
                let name = selItem.File.Name;
                var fileUrl = selItem.File.ServerRelativeUrl;
                let obj = { URL: fileUrl, IsDeleted: false, IsNew: false, name: name, FileID: selItem.Id };
                filesArry.push(obj);
            });
            if (selRequisitions != Error) {
                let itemsdata = [];
                itemsdata = JSON.parse(selRequisitions.ItemsDatajson);
                if (itemsdata == null) {
                    let newobj = {
                        Quantity: '',
                        QuantityUnit: '',
                        UnitPrice: null,
                        Unit: null,
                        VPT: '',
                        DateRequired: null,
                        Vendor: '',
                        Description: '',
                        Program: '', ProgramLable: '',
                        ProgramNumber: null,
                    };
                    itemsdata = [];
                    itemsdata.push(newobj);
                }
                let currentdivCount = itemsdata.length;
                for (var i = 0; i < currentdivCount; i++) {
                    this[i + "Quantity"] = React.createRef();
                    this[i + "QuantityUnit"] = React.createRef();
                    this[i + "UnitPrice"] = React.createRef();
                    this[i + "Unit"] = React.createRef();
                    this[i + "VPT"] = React.createRef();
                    this[i + "Description"] = React.createRef();
                    this[i + "ProgramNumber"] = React.createRef();
                }

                itemsdata.map((selItem, index) => {
                    selItem['DateRequired'] = selItem.DateRequired != null ? new Date(selItem.DateRequired) : null;
                });
                formData.Company = selRequisitions.Company;
                formData.Plant = selRequisitions.Plant;
                formData.PlantCode = selRequisitions.PlantCode;
                formData.Database = selRequisitions.Database;
                formData.RequisitionerId = selRequisitions.RequisitionerId;
                formData.Buyer = selRequisitions.Buyer;
                formData.Vendor = selRequisitions.Vendor;
                formData.VendorName = selRequisitions.VendorName;
                formData.Currency=selRequisitions.Currency!=null?selRequisitions.Currency:'';
                formData.RequsitionerCode = selRequisitions.RequsitionerCode;
                formData.ProjectCode = selRequisitions.ProjectCode;
                formData.CommodityCategory = selRequisitions.CommodityCategory;
                formData.Description = selRequisitions.Description;
                formData.Department = selRequisitions.Department;
                formData.CMSMstr = selRequisitions.CMSMstr;
                formData.PONumber=selRequisitions.PONumber;
                formData.CapitalInvestment=selRequisitions.CapitalInvestment!=null?selRequisitions.CapitalInvestment:false;
                trFormdata.Approver1Id = selRequisitions.Approver1Id;
                trFormdata.Approver2Id = selRequisitions.Approver2Id;
                trFormdata.Approver3Id = selRequisitions.Approver3Id;
                trFormdata.Approver4Id = selRequisitions.Approver4Id;
                trFormdata.ReviewerId = selRequisitions.ReviewerId;
                trFormdata.AssignToId = selRequisitions.AssignToId;
                trFormdata.ApprovalLevel = selRequisitions.ApprovalLevel;
                trFormdata.Status = selRequisitions.Status;
                trFormdata.NextApprovalId = selRequisitions.NextApprovalId;
                trFormdata.TotalAmount = selRequisitions.TotalAmount;
                trFormdata.CurrencyAmount = selRequisitions.CurrencyAmount;
                trFormdata.Pendingwith = selRequisitions.Pendingwith;
                trFormdata.ItemsData = itemsdata;
                this.state.authorId = selRequisitions.Author;
                if(selRequisitions.Author.Id == this.state.CurrentuserId && selRequisitions.ApprovalLevel =="1") this.state.IsWithdraw=true;
                //trFormdata.CMSReq = itemsdata.;
                let createdById = selRequisitions.AuthorId;
                if (selRequisitions.Comments != null) {
                    trFormdata.Commentsdata = JSON.parse(selRequisitions.Comments);
                }
                let Departments: any = await this.rootweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + formData.Plant + "'").select("*").orderBy("Title").get();
                let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and Company eq '" + formData.Company + "' and Plant eq '" + formData.Plant + "'  and Department eq '" + formData.Department + "'").select('*').get();
                
             //   let Vendors = await sp.web.lists.getByTitle('Vendor').items.filter(`Database eq '${formData.Database}' and IsActive eq 1`).select("*").orderBy('Title').getAll();
                let Vendors = await sp.web.lists.getByTitle('Vendor').items.select("*").orderBy('Title').getAll();

                Vendors=Vendors.filter(x=>(x.Database==formData.Database && x.IsActive==true));

                var RequsitionerCodes: any = await sp.web.lists.getByTitle('RequsitionerCodes').items.filter(`IsActive eq 1 and Database eq '${formData.Database}' `).select("*").orderBy('Requsitioner_x0020_Code').getAll();
                var Buyers: any = await sp.web.lists.getByTitle('Buyers').items.filter(`Database eq '${formData.Database}' and IsActive eq 1`).select("*").orderBy('Title').getAll();
                // as database = CMSDAT removing it from  rest calls by Riyaz on 1/12/21
                //var Buyers: any = await sp.web.lists.getByTitle('Buyers').items.filter(`IsActive eq 1`).select("*").orderBy('Title').getAll();
               
                if (trFormdata.Status != ApprovalStatus.draft && trFormdata.Status != ApprovalStatus.Msave && trFormdata.Status != ApprovalStatus.Rejected && trFormdata.Status != ApprovalStatus.Withdraw)
                    DynamicDisabled = true;
                // isUserExistInPurchasing = true;
                if (trFormdata.Status == ApprovalStatus.Rejected) {
                    btnTextforRejectStatus = "Submit";
                    showHideDraftButtonforReject = false;
                }
                Vendors = sortDataByTitle(Vendors, "Title");
                RequsitionerCodes = sortDataByTitle(RequsitionerCodes, "Requsitioner_x0020_Desc");
                Buyers = sortDataByTitle(Buyers, "Title");
                let del =false;
                if(selRequisitions.Author.Id == this.state.CurrentuserId && (trFormdata.Status == ApprovalStatus.draft || trFormdata.Status == ApprovalStatus.Msave)) del= true;
                let  PTM = false;
                if(groupIds.includes(selRequisitions.PurchasingTeamId) && trFormdata.Status == ApprovalStatus.Approved && selRequisitions.isPOProcessed== false) PTM = true;
                this.setState({
                    ProjectCode: projectCode, RequsitionerCode: RequsitionerCodes, Buyers: Buyers, CommodityCategory: commodityCategory, RequisitionerEmail: selRequisitions.Requisitioner.EMail, SaveUpdateText: 'Submit', showLabel: false, loading: false, RequisitionerUserId: this.userContext.userId, isFormloadCompleted: true, Vendors: Vendors, Punits: PUnits, Qunits: QUnits, Programs: programs,
                    Plants: Plants, Departments: Departments, ApprovalsMatrix: ApprovalsMatrix, formData, trFormdata, DynamicDisabled: DynamicDisabled, redirect: true, ItemID: ItemID, currentdivCount: currentdivCount, fileArr: filesArry, createdById: createdById,
                    SaveResubmitBtnText: btnTextforRejectStatus, showHideDraftButton: showHideDraftButtonforReject,userGroupIds:groupIds,DeletePermissions:del,ProcessPoPermissions:PTM,Vendor:Vendors,ExchangeRates:exchangeRates
                });
                if (selRequisitions.AssignToId == null && selRequisitions.Status == "Approved") {
                    this.checkUserInPurchasingGroup();
                }
                if(selRequisitions.AssignToId != null && selRequisitions.Status == "Draft"){
                    this.checkUserInPurchasingGroup();
                    this.setState({
                        isInitiatorEdit: false,
                        DynamicDisabled:true,
                        showHideDraftButton:true
                    });
                }
                if(selRequisitions.AuthorId == this.userContext.userId && selRequisitions.Status == "Draft"){
                    this.checkUserInPurchasingGroup();
                    this.setState({
                        isInitiatorEdit: true,
                        // DynamicDisabled:true,
                        // showHideDraftButton:true
                    });
                }
                if ((selRequisitions.AssignToId != null && selRequisitions.Pendingwith == PendingStatus.Level1 && selRequisitions.AuthorId==this.userContext.userId && selRequisitions.AssignToId !=this.userContext.userId && !this.state.userGroupIds.includes(this.state.trFormdata.AssignToId)) ||(selRequisitions.AssignToId == null && selRequisitions.ApprovalLevel == null && selRequisitions.AuthorId==this.userContext.userId && !this.state.userGroupIds.includes(this.state.trFormdata.AssignToId))) {
                    this.setState({
                        // isUserExistInPurchasingGroup: true,
                        isInitiatorEdit: true,
                        DynamicDisabled:false,
                        showHideDraftButton:false
                        // DynamicDisabled: false   //04/10/2021 Removed Purchasing Team Updation functionality, Make DynamicDisabled as False when Purchasing Team Should submit. 
                    });
                }
            }
        }
        else {
            commodityCategory = sortDataByTitle(commodityCategory, "Title");
            const formData = { ...this.tempstate.formData };
            formData.Company = this.Company;
            // formData.Database = this.database;
            const trFormdata = { ...this.tempstate.trFormdata };
            let filesArry = [];    
            this.setState({ ProjectCode: projectCode, CommodityCategory: commodityCategory, RequisitionerEmail: this.userContext.userEmail, SaveUpdateText: 'Submit', showLabel: false, loading: false, RequisitionerUserId: this.userContext.userId, isFormloadCompleted: true, Vendors: Vendors, Punits: PUnits, Qunits: QUnits, Programs:programs, formData, Plants: Plants, Departments: [], ItemID: 0, trFormdata, redirect: false, fileArr: filesArry, DynamicDisabled: false,ExchangeRates:exchangeRates });
        }
    }

    private loadListData = () => {
        sp.web.lists.getByTitle(this.TrListname).items.select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/EMail', '*').expand('Requisitioner').orderBy('Modified', false).get().then((response) => {
            this.setState({
                requisitionData: response.map(o => ({ Id: o.Id, Plant: o.Plant, Company: o.Company, Requisitioner: o.Requisitioner ? o.Requisitioner.Title : '', BuyerCode: o.BuyerCode, CommodityCategoryCode: o.CommodityCategoryCode, ProjectCode: o.ProjectCode, Description: o.Description,ddlVendor:o.Vendor_x0020_Number })),
                SaveUpdateText: 'Submit',
                showLabel: false,
                loading: false
            });
        }, (error) => {
            console.log(error);
        });
    }
    //#endregion

    private submitData=() => {
        this.insertorupdateListitem(this.state.poData, ActionStatus.PO,[]);
        // sp.web.lists.getByTitle('PurchaseRequest').items.getById(this.state.ItemID).update(this.state.poData).then((res) => {
        //     console.log('updated');
        //     this.setState({ showHideModalConfirm: false,showHideModal:true,loading:true});
        //     }, (Error) => {
        //         console.log(Error);
        //         this.onError();
        //     }).catch((err) => {
        //         this.onError();
        //         console.log(err);
        //     });
    }
    private cancelHandler = () => {
        this.resetMasterForm();
    }

    private handleClose = () => {
        if (this.state.Errorclose) {
            this.handlefullClose();
        } else {
            const trFormdata = { ...this.state.trFormdata };
            let newobj = {
                Quantity: '',
                QuantityUnit: '',
                UnitPrice: null,
                Unit: null,
                VPT: '',
                Buyer: '',
                DateRequired: null,
                Vendor: '',
                Description: '',
                Program: '', ProgramLable: '',
                ProgramNumber: null,
            };
            trFormdata.ItemsData = [];
            trFormdata.ItemsData.push(newobj);
            this["0Quantity"] = React.createRef();
            this["0QuantityUnit"] = React.createRef();
            this["0PartNumber"] = React.createRef();
            this["0UnitPrice"] = React.createRef();
            this["0Unit"] = React.createRef();
            this["0VPT"] = React.createRef();
            this["0Description"] = React.createRef();
            this["0ProgramNumber"] = React.createRef();
            trFormdata.Status = ApprovalStatus.draft,
                trFormdata.AssignToId = null,
                trFormdata.ApprovalLevel = "0",
                trFormdata.NextApprovalId = null,
                trFormdata.TotalAmount = 0,
                trFormdata.CurrencyAmount = 0,
                trFormdata.Pendingwith = '',
                trFormdata.ItemsDatajson = '',

                this.setState({
                    showHideModal: false, redirect: true,
                    currentdivCount: 1, trFormdata
                });
        }
    }
    public cancelData=()=>{
        this.setState({ showHideModalConfirm: false});
    }
    private handlefullClose = () => {

        this.setState({ showHideModal: false, Homeredirect: true, redirect: true, ItemID: 0 });
    }
    private handleReorder =()=>{
        this.setState({reorder: true});
    }
    private resetMasterForm = () => {
        this.setState({
            formData: {
                Plant: '',
                Company: '',
                RequisitionerId: null,
                BuyerCode: '',
                ddlVendor:'',
                RequsitionerCode: '',
                CommodityCategoryCode: '',
                ProjectCode: '',
                Description: '',
                CapitalInvestment:false
            },
            SaveUpdateText: 'Submit',
            addNewRequisitioner: false
        });
    }

    private handleOnPurchaseGroupSubmit = () => {
        const data = { ...this.state.trFormdata };
        data.Status = ApprovalStatus.PurchasingTeamUpdated;
        //var validationdata = {};
        let itemsData = JSON.stringify(data.ItemsData);
        let validationdata = {};
        var parentthis = this;
        data.ItemsData.map((selItem, index) => {
            validationdata["Quantity" + index] = { val: selItem.Quantity, required: true, Name: 'Quantity', Type: ControlType.number, Focusid: parentthis[index + 'Quantity'] };
            validationdata["QuantityUnit" + index] = { val: selItem.QuantityUnit, required: true, Name: 'Quantity for Unit', Type: ControlType.string, Focusid: parentthis[index + 'QuantityUnit'] };
            validationdata["UnitPrice" + index] = { val: selItem.UnitPrice, required: true, Name: 'Unit Price', Type: ControlType.number, Focusid: parentthis[index + 'UnitPrice'] };
            validationdata["Unit" + index] = { val: selItem.Unit, required: true, Name: 'Price for Unit', Type: ControlType.string, Focusid: parentthis[index + 'Unit'] };
            // validationdata["Description" + index] = { val: selItem.Description, required: false, Name: 'Description/Reason', Type: ControlType.string, Focusid: parentthis[index + 'Description'] };
            // validationdata["VPT" + index] = { val: selItem.VPT, required: true, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
        });
        delete data.ItemsData;
        data.ItemsDatajson = itemsData;


        let isValid = formValidation.checkValidations(validationdata);
        if (isValid.status) {
            let comments = this.state.Comments;
            let prvComments = data.Commentsdata;
            if (comments != '') {
                let curcomments = { User: this.props.context.pageContext.user.displayName, comments: comments, Action: 'Submit', Role: 'Purchasing Team', Date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() };
                prvComments.push(curcomments);
            }
            let prvcommentsdata = JSON.stringify(prvComments);
            delete data.Commentsdata;
            data.Comments = prvcommentsdata;

            for (var i = 0; i < this.state.ApprovalsMatrix.length; i++) {
                if (this.state.ApprovalsMatrix[i].FromBudget <= data.TotalAmount && this.state.ApprovalsMatrix[i].ToBudget >= data.TotalAmount) {
                    data.AssignToId = null;

                    data.NextApprovalId = null;
                    data.ApprovalLevel = "";
                    data.Pendingwith = PendingStatus.Empty; //"Approver 1"; 
                    data.Approver1Id = this.state.ApprovalsMatrix[i].Approval1Id;
                    data.Approver2Id = this.state.ApprovalsMatrix[i].Approval2Id;
                    data.Approver3Id = this.state.ApprovalsMatrix[i].Approval3Id;
                    data.Approver4Id = this.state.ApprovalsMatrix[i].Approval4Id;
                    data.ReviewerId = this.state.ApprovalsMatrix[i].ReviewerId;
                }
            }
            if (data.AssignToId == null) {
                data.ApprovalLevel = '';
                data.Status = ApprovalStatus.PurchasingTeamUpdated;
                data.Pendingwith = '';
            }
            //this.InsertorUpdatedata(data);
            //this.setState({ loading: true });
            this.setState({ loading: true, showLabel: false, errorMessage: isValid.message });
            // this.insertorupdateListitem(data, ActionStatus.Updated);
        }
        else
            this.setState({ errorMessage: isValid.message });
    }

    private checkUserInPurchasingGroup = async () => {
        //let groups = await sp.web.currentUser.groups();

        const groupInfo = this.userGroups.filter((item) => item.Title == "MRO Purchasing Team");
        // get user object by id
        // const user = await sp.web.siteUsers.getById(this.state.CurrentuserId).groups().then((Response)=>{
        //     console.log(Response);
        // });

        if (groupInfo.length && this.state.trFormdata.Status == "Approved") {
            const users = await sp.web.siteGroups.getById(groupInfo[0].Id).users();
            this.setState({
                isUserExistInPurchasingGroup: true,
                DynamicDisabled: true   //04/10/2021 Removed Purchasing Team Updation functionality, Make DynamicDisabled as False when Purchasing Team Should submit. 
            });
            //  console.log(users);
        }
        // else if (groupInfo.length && this.state.trFormdata.Pendingwith == PendingStatus.Level1) {
        //     const users = await sp.web.siteGroups.getById(groupInfo[0].Id).users();
        //     this.setState({
        //         isUserExistInPurchasingGroup: true,
        //         //isInitiatorEdit: true,
        //         DynamicDisabled: false   //04/10/2021 Removed Purchasing Team Updation functionality, Make DynamicDisabled as False when Purchasing Team Should submit. 
        //     });
        //     //  console.log(users);
        // }
    }
    private handleChangePONumber=(event)=>{
        const poData = {...this.state.poData};     
        const { name } = event.target;
        const value = event.target.value;
        poData[name] = value;
        if(value !=undefined && value !="")
        poData["IsincludedinPOExcel"] = true;
        else
        poData["IsincludedinPOExcel"] = false;
        this.setState({ poData }); 
    }
    public render() {
        if (this.state.Homeredirect) {
            let url = `/`;
            return (<Navigate to={url} />);
        }
        else if(this.state.reorder){
            let url = `/purchaserequestreorder/${this.state.ItemID}`;
            return (<Navigate to={url} />);
        }
        else if (this.state.redirect && this.props.match.params.id > 0) {
            return (
                <React.Fragment>
                    {highlightCurrentNav("lipurchaseLink")}
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Requisition
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                     <button className="btn-print btn" type="button" id="btnPrint" onClick={this.printDocument} hidden={this.state.trFormdata.Status =='Draft'} ><FontAwesomeIcon icon={faPrint}></FontAwesomeIcon> Print</button> 
                                </div>
                                <div className="after-title"></div>
                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        {/* <h6 className="mb-2">Master Requisition {` : ${this.props.match.params.id}`} <span>{this.state.formData.CMSMstr ? `Master Req# : ${this.state.formData.CMSMstr}` : "Master Req# : "}</span> </h6> */}
                                        <div className="row">
                                            <div className="col-6">
                                                <h6 className="mb-2">SharePoint Master Requisition {` : ${this.props.match.params.id}`} </h6>
                                            </div>
                                            <div className="col-3">
                                                <h6 className="mb-2">{this.state.formData.CMSMstr ? `CMS Master Req# : ${this.state.formData.CMSMstr}` : "CMS Master Req# : "}</h6>
                                            </div>
                                            <div className="col-3">
                                                <h6 className="mb-2">{this.state.formData.PONumber ? `PO Number# : ${this.state.formData.PONumber}` : "PO Number# : "}</h6>
                                            </div>
                                        </div>
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Company <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Company" title="Company" value={this.state.formData.Company} disabled={true}>
                                                        <option value=''>None</option>
                                                        {this.state.Companys.drp.map((option) => (
                                                            <option value={option.Title} selected={this.state.formData.Company == option.Title}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.handlePlantChange} ref={this.Plant} disabled={!this.state.isInitiatorEdit}>
                                                        <option value=''>None</option>
                                                        {this.state.Plants.map((option) => (
                                                            <option value={option.Title} data-plantcode={option.Plant_x0020_Code} data-database={option.Database} selected={this.state.formData.Plant == option.Title}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Database </label>
                                                    <input className="form-control" required={true} placeholder="" name="Database" title="Database" value={this.state.formData.Database || ''} onChange={this.handleChangeDaynamic} autoComplete="off" disabled={true} />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Department <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} id="ddlDepartment" name="Department" onChange={this.handleDeparmentChange} disabled={!this.state.isInitiatorEdit} ref={this.ddlDepartment} >
                                                        <option>None</option>
                                                        {this.state.Departments.map((item, index) => <option key={index} value={item.Title} selected={item.Title == this.state.formData.Department}>{item.Title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Requisitioner <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divRequisitioner">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            disabled={true}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'RequisitionerId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.RequisitionerEmail]}
                                                            principalTypes={[PrincipalType.User]} placeholder="Requisitioner"
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Requisitioner Code <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="RequsitionerCode" title="Requisitioner Codes" value={this.state.formData.RequsitionerCode} onChange={this.handleChange} ref={this.RequsitionerCode} disabled={!this.state.isInitiatorEdit}>
                                                        <option value=''>None</option>
                                                        {this.state.RequsitionerCode.map((option, index) => (
                                                            <option key={index} value={option.Requsitioner_x0020_Code} selected={option.Requsitioner_x0020_Code == this.state.formData.RequsitionerCode}>{`${option.Requsitioner_x0020_Desc} (${option.Requsitioner_x0020_Code})`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Buyer Code<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Buyer" title="Buyer" value={this.state.formData.Buyer} onChange={this.handleChange} ref={this.buyercode} disabled={!this.state.isInitiatorEdit}>
                                                        <option value=''>None</option>
                                                        {this.state.Buyers.map((option, index) => (
                                                            <option key={index} value={option.Buyer_x0020_Number} selected={option.Title == this.state.formData.Buyer}>{`${option.Title} (${option.Buyer_x0020_Number})`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Project Code </label>
                                                    <select className="form-control" name="ProjectCode" ref={this.ddlProjectCode} title="ProjectCode" onChange={this.handleChange} disabled={!this.state.isInitiatorEdit} >
                                                        <option>None</option>
                                                        {this.state.ProjectCode.map((item, index) => <option key={index} value={item.Project_x0020_Code} selected={item.Project_x0020_Code == this.state.formData.ProjectCode}>{`${item.Title} (${item.Project_x0020_Code})`}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row pt-2 px-2">
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Commodity Category </label>
                                                    <select className="form-control" name="CommodityCategory" ref={this.ddlCommodityCategory} title="Commodity Category" onChange={this.handleChange} disabled={!this.state.isInitiatorEdit}>
                                                        <option>None</option>
                                                        {this.state.CommodityCategory.map((option) => (
                                                            <option value={option.Title} selected={this.state.formData.CommodityCategory == option.Title}>{`${option.Title} (${option.Category_x0020_Code})`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Vendor</label>
                                                    <select className="form-control" name="Vendor" ref={this.ddlVendor} title="Vendor" onChange={this.handleChange} disabled={!this.state.isInitiatorEdit}>
                                                        <option>None</option>
                                                        {this.state.Vendor.map((option) => (
                                                            <option value={option.Vendor_x0020_Number} selected={this.state.formData.Vendor == option.Vendor_x0020_Number}>{`${option.Title} (${option.Vendor_x0020_Number})`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-1">
                                                <div className="light-text">
                                                    <label>Currency</label>
                                                    <input className="form-control" required={true} placeholder="" name="Currency" title="Currency" value={this.state.formData.Currency} autoComplete="off" disabled={true} />
                                                </div>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="light-text">
                                                    <label>Currency Amount </label>
                                                    <input className="form-control" required={true} placeholder="" type="number" name="CurrencyAmount" title="CurrencyAmount" value={this.state.trFormdata.CurrencyAmount!= null ?(this.state.trFormdata.CurrencyAmount).toFixed(4) : 0} disabled={true} />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <label>Total Amount (USD) </label>
                                                    <input className="form-control" required={true} placeholder="" type="number" name="TotalAmount" title="TotalAmount" value={this.state.trFormdata.TotalAmount!= null ?(this.state.trFormdata.TotalAmount).toFixed(4) : 0} disabled={true} />
                                                </div>
                                            </div>
                                            
                                        </div>
                                        
                                        <div className="row pt-2 px-2">
                                            <InputCheckBox
                                                label={"Capital Investment"}
                                                name={"CapitalInvestment"}
                                                checked={this.state.formData.CapitalInvestment}
                                                onChange={this.handleChange}
                                                isforMasters={false}
                                            />
                                            <div className="col-md-9">
                                                <div className="light-text">
                                                    <label className="floatingTextarea2">Reason <span className="mandatoryhastrick">*</span></label>
                                                    <textarea className="form-control requiredinput" onChange={this.handleChange} value={this.state.formData.Description || ''} placeholder="" maxLength={750} id="txtTargetDescription" name="Description" ref={this.description} disabled={!this.state.isInitiatorEdit}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="light-box border-box-shadow m-1">
                                            <div className='p-rel'>
                                            <h6 className="p-2 mb-0 c-bg-title">Purchase Requisition Details</h6>
                                            <h6 className='class-grand-total'> Grand Total: {this.state.trFormdata.CurrencyAmount !=null?(this.state.trFormdata.CurrencyAmount).toFixed(2):0} </h6>
                                            </div>
                                            {this.state.isFormloadCompleted && this.dynamicFields()}
                                        </div>
                                        <div className="px-1 text-right" hidden={this.props.match.params.id == undefined}>
                                            <span onClick={this.createUI} className="add-button" hidden={this.state.DynamicDisabled} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>
                                        </div>
                                        <div className="light-box border-box-shadow m-1 p-2 pt-3">
                                            <div className="media-px-12">

                                                <div className="light-text height-auto">
                                                    <label className="floatingTextarea2 top-11">Comments </label>
                                                    <textarea className="position-static form-control requiredinput" onChange={this.handleCommetsChange} value={this.state.Comments} placeholder="" maxLength={500} id="txtComments" name="Comments" ref={this.txtComments} disabled={false}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="">
                                            <div className="media-px-4">
                                                <div className="mt-4"></div>
                                                {this.state.isFormloadCompleted &&
                                                    <FileUpload ismultiAllowed={true} onFileChanges={this.filesChanged} isnewForm={!this.state.DynamicDisabled} files={[this.state.fileArr, this.state.delfileArr]} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className='text-validator'> {this.state.errorMessage}</span>
                                </div>

                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center mb-2" id="">
                                       <button type="button" id="btnWithdraw" onClick={this.handleWithdraw} className="ApproveButtons btn" hidden={!this.state.IsWithdraw} >Withdraw</button>
                                       <button type="button" id="btnDelete" onClick={this.handleDelete} className="RejectButtons btn" hidden={!this.state.DeletePermissions} >Delete</button>
                                       <button type="button" id="btnProcessed" onClick={this.handleProcessPO} className="ApproveButtons btn" hidden={!this.state.ProcessPoPermissions} >Process PO</button>
                                       <button type="button" id="btnApprove" onClick={this.handleApprove} className="SaveButtons btn" hidden={this.state.trFormdata.Status =='Draft' || !(this.state.trFormdata.AssignToId == this.state.CurrentuserId || this.state.userGroupIds.includes(this.state.trFormdata.AssignToId))} >Approve</button>
                                        <button type="button" id="btnReject" onClick={this.handleReject} className="RejectButtons btn" hidden={this.state.trFormdata.Status =='Draft' || !(this.state.trFormdata.AssignToId == this.state.CurrentuserId || this.state.userGroupIds.includes(this.state.trFormdata.AssignToId))} >Reject</button>
                                        {
                                            (!this.state.isUserExistInPurchasingGroup)&& <button type="button" id="btnSave" onClick={this.handlePurchageSave} className="SaveButtons btn" hidden={this.state.DynamicDisabled || this.state.showHideDraftButton || this.state.trFormdata.Status ==ApprovalStatus.Withdraw ||  this.state.trFormdata.Status ==ApprovalStatus.Approved ||  this.state.trFormdata.Status ==ApprovalStatus.InProgress }>Save as Draft</button>
                                        }
                                        {
                                            (!this.state.isUserExistInPurchasingGroup) && <button type="button" onClick={this.handlePurchageSubmit} id="btnSubmit" className="SubmitButtons btn" hidden={this.state.DynamicDisabled || this.state.trFormdata.Status ==ApprovalStatus.Withdraw ||  this.state.trFormdata.Status ==ApprovalStatus.Approved ||  (this.state.trFormdata.Status ==ApprovalStatus.InProgress && this.state.trFormdata.ApprovalLevel !='1')}>{this.state.SaveResubmitBtnText}</button>
                                        }
                                        <button type="button" id="btnReorder" onClick={this.handleReorder} className="SubmitButtons btn" hidden={this.state.trFormdata.Status !='Approved'} >Re-Order</button>
                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.handlefullClose}>Cancel</button>
                                    </div>
                                </div>

                                <div className="row justify-content-md-left">
                                    <div className="col-md-12">
                                        <div className="px-2">
                                            <table className="table border mt-2">
                                                <thead>
                                                    <tr>
                                                        <th>Action</th>
                                                        <th>Role</th>
                                                        <th>User</th>
                                                        <th>Comments </th>
                                                        <th>Date </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {this.BindComments()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    {this.state.showHideModalConfirm &&
                        <div className="modal" tabIndex={-1} style={{display:'block',background:'rgb(165 165 165 / 25%)'}} >
                            <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className={`modal-header txt-white bc-dblue`}>
                                <h5 className="modal-title txt-white">{'Are you sure?'}</h5>
                                </div>
                                <div className="modal-body">
                                    <div className="row pt-2 px-2">
                                        <div className="col-md-3">
                                            <div className="light-text">
                                                <label>PO# </label>
                                                <input className="form-control" required={false} placeholder="" name="PONumber" title="PONumber" value={this.state.poData.PONumber || ''} onChange={this.handleChangePONumber} autoComplete="off" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                <button type="button" onClick={this.submitData} className={`btn bc-dblue txt-white modalclosesuccess bc-dblue`} data-dismiss="modal">Confirm</button>
                                <button type="button" onClick={this.cancelData} className={`btn bc-dblue txt-white modalclosesuccess bc-dblue`} data-dismiss="modal">Cancel</button>
                                </div>
                            </div>
                            </div>
                        </div>
                    }
                    {this.state.loading && <Loader />}
                </React.Fragment >

            );

        }
        else if (this.props.match.params.id == undefined && this.state.ItemID != 0) {
            this.GetMasterListData();
            return (<div></div>);
        }
        else {
            return (
                <React.Fragment>
                    {highlightCurrentNav("lipurchaseLink")}
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div className="container-fluid">
                            <div className="FormContent">

                                <div className="title">Requisition
                                    <div className="mandatory-note"><span className="mandatoryhastrick">*</span> indicates a required field</div>
                                </div>
                                <div className="after-title"></div>

                                {this.state.loading && <Loader />}

                                <div className="light-box border-box-shadow mx-2">
                                    <div>
                                        <div>
                                            <div className="my-2">
                                                <h6 className="mb-2">SharePoint Master Requisition</h6>
                                                <div className="row pt-2 px-2">
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Company <span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} name="Company" title="Company" value={this.state.formData.Company} disabled={true} >
                                                                <option value=''>None</option>
                                                                {this.state.Companys.drp.map((option) => (
                                                                    <option value={option.Title} selected={this.state.formData.Company != ''}>{option.Title}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.handlePlantChange} ref={this.Plant}>
                                                                <option value=''>None</option>
                                                                {this.state.Plants.map((option) => (
                                                                    <option value={option.Title} data-plantcode={option.Plant_x0020_Code} data-database={option.Database} selected={this.state.formData.Plant != ''}>{option.Title}</option>
                                                                ))}
                                                            </select>


                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Database </label>
                                                            <input className="form-control" required={true} placeholder="" name="Database" title="Database" value={this.state.formData.Database || ''} onChange={this.handleChangeDaynamic} autoComplete="off" disabled={true} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Department <span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} id="ddlDepartment" name="Department" onChange={this.handleDeparmentChange} disabled={this.state.formData.Status != ApprovalStatus.Msave} ref={this.ddlDepartment}>
                                                                <option>None</option>
                                                                {this.state.Departments.map((item, index) => <option key={index} value={item.Title} selected={item.Title == this.state.formData.Department}>{item.Title}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row pt-2 px-2">
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Requisitioner <span className="mandatoryhastrick">*</span></label>
                                                            <div className="custom-peoplepicker" id="divRequisitioner">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText=""
                                                                    personSelectionLimit={1}
                                                                    showtooltip={false}
                                                                    disabled={this.state.isEdit}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'RequisitionerId')}
                                                                    showHiddenInUI={false}
                                                                    ensureUser={true}
                                                                    required={true}
                                                                    defaultSelectedUsers={[this.state.RequisitionerEmail]}
                                                                    principalTypes={[PrincipalType.User]} placeholder="Requisitioner"
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Requisitioner Code <span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} name="RequsitionerCode" title="Requisitioner Codes" value={this.state.formData.RequsitionerCode} onChange={this.handleChange} ref={this.RequsitionerCode}>
                                                                <option value=''>None</option>
                                                                {this.state.RequsitionerCode.map((option) => (
                                                                    <option value={option.Requsitioner_x0020_Code} selected={this.state.formData.RequsitionerCode != ''}>{`${option.Requsitioner_x0020_Desc} (${option.Requsitioner_x0020_Code})`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Buyer Code<span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} name="Buyer" title="Buyer" value={this.state.formData.Buyer} onChange={this.handleChange} ref={this.buyercode}>
                                                                <option value=''>None</option>
                                                                {this.state.Buyers.map((option) => (
                                                                    <option value={option.Buyer_x0020_Number} selected={this.state.formData.Buyer != ''}>{`${option.Title} (${option.Buyer_x0020_Number})`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Project Code </label>
                                                            <select className="form-control" name="ProjectCode" ref={this.ddlProjectCode} title="ProjectCode" onChange={this.handleChange} >
                                                                <option>None</option>
                                                                {this.state.ProjectCode.map((item, index) => <option key={index} value={item.Project_x0020_Code} selected={item.Project_x0020_Code == this.state.formData.ProjectCode}>{`${item.Title} (${item.Project_x0020_Code})`}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row pt-2 px-2">
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Commodity Category </label>
                                                            <select className="form-control" name="CommodityCategory" ref={this.ddlCommodityCategory} title="Commodity Category" onChange={this.handleChange} >
                                                                <option>None</option>
                                                                {this.state.CommodityCategory.map((option) => (
                                                                    <option value={option.Title} selected={option.Title == this.state.formData.CommodityCategory}>{`${option.Title} (${option.Category_x0020_Code})`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Vendor</label>
                                                            <select className="form-control" name="Vendor" ref={this.ddlVendor} title="Vendor" onChange={this.handleChange}>
                                                                <option>None</option>
                                                                {this.state.Vendor.map((option) => (
                                                                    <option value={option.Vendor_x0020_Number} selected={this.state.formData.Vendor == option.Vendor_x0020_Number}>{`${option.Title} (${option.Vendor_x0020_Number})`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label>Currency</label>
                                                            <input className="form-control" required={true} placeholder="" name="Currency" title="Currency" value={this.state.formData.Currency} autoComplete="off" disabled={true} />
                                                        </div>
                                                    </div>
                                                    <InputCheckBox
                                                            label={"Capital Investment"}
                                                            name={"CapitalInvestment"}
                                                            checked={this.state.formData.CapitalInvestment}
                                                            onChange={this.handleChange}
                                                            isforMasters={false}
                                                    />
                                                </div>
                                                <div className="row pt-2 px-2">
                                                    <div className="col-md-9">
                                                    <div className="light-text mt-1">
                                                            <label className="floatingTextarea2">Reason <span className="mandatoryhastrick">*</span></label>
                                                            <textarea className="form-control requiredinput" onChange={this.handleChange} value={this.state.formData.Description || ''} placeholder="" maxLength={750} id="txtTargetDescription" name="Description" ref={this.description}></textarea>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {this.state.showLabel &&
                                                <div>
                                                    <span className='text-validator'> {this.state.errorMessage}</span>
                                                </div>
                                            }

                                            <div className="row mx-1" id="">
                                                <div className="col-sm-12 text-center my-2" id="">
                                                    <button type="button" className="SubmitButtons btn" onClick={this.handleMasterSubmit}>{this.state.SaveUpdateText}</button>
                                                    <button type="button" className="CancelButtons btn" onClick={this.handlefullClose}>Cancel</button>
                                                </div>
                                            </div>
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

}

export default PurchaseRequestForm;