import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@pnp/sp';
import * as React from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import { sp } from '@pnp/sp';
import { Web } from '@pnp/sp/webs';
import "@pnp/sp/site-groups";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { Navigate} from "react-router-dom";
import FileUpload from '../Shared/FileUpload';
import { ControlType, PendingStatus, ApprovalStatus, ActionStatus } from '../../Constants/Constants';
import formValidation from '../../Utilities/Formvalidator';
import DatePicker from "../Shared/DatePickerField";
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import { faPlus } from "@fortawesome/free-solid-svg-icons";
export interface PurchaseRequestProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface PurchaseRequestState {

}

class PurchaseRequest extends React.Component<PurchaseRequestProps, PurchaseRequestState> {
    //private siteURL: string;
    private sitecollectionURL: string;
    //private Ref;
    private ddlRequisition; private ddlDepartment;
    constructor(props: PurchaseRequestProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.ddlRequisition = React.createRef();
        this.ddlDepartment = React.createRef();
        this.sitecollectionURL = this.props.spContext.siteAbsoluteUrl + "/Mayco";

    }
   
    public state = {
        formData: {
            ItemsData: [],
            MasterRequisition: null,
            Company: '',
            Plant: '',
            Department: '',
            RequisitionerId: null,
            Status: 'Save',
            AssignToId: null,
            ApprovalLevel: "0",
            NextApprovalId: null,
            TotalAmount: 0,
            Pendingwith: '',
            ItemsDatajson: '',
            Approver1Id:null,
            Approver2Id:null,
            Approver3Id:null,
            ReviewerId:null,
        },
        SaveUpdateText: 'Submit',
        Vendors: [],
        Buyers: [],
        Requisitions: [],
        Plants: [],
        Departments: [],
        Programs: ['Assembly', 'JT', 'JL', 'Mold', 'Press', 'WD', 'WK', 'WL'],
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: false,
        RequisitionerEmail: '',
        ItemID: 0,
        redirect: false,
        isEdit: false,
        fileArr: [],
        delfileArr: [],
        ApprovalsMatrix: [],
        currentdivCount: 0,
        isnewFormLoaded: false,
        isFormloadCompleted:false,
        Punits:[],
        Qunits:[]
    };
    public componentDidMount() {
        highlightCurrentNav("purchaserequest");
        this.GetMasterListData();
    }
    
    //#region  Events
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        formData[name] = value != 'None' ? value : null;
        this.setState({ formData });
        if (name == 'MasterRequisition' && value != "0")
            this.GetRequisitionData(value);
    }

    private handleChangeDaynamic = (event) => {
        const formData = { ...this.state.formData };
        let rowcount = parseInt(event.target.id.charAt(0));
        const { name } = event.target;
        const value = event.target.value.trim();
        if (name == 'Program') {
            let ProgramLable = '';
            if (value == 'Assembly') ProgramLable = 'Assembly Line ID';
            else if (value == 'Mold') ProgramLable = 'Mold Number';
            else if (value == 'Press') ProgramLable = 'Press Number';
            formData.ItemsData[rowcount]['ProgramLable'] = ProgramLable;
        }
        formData.ItemsData[rowcount][name] = value != 'None' ? value : null;
        this.setState({ formData });
       // if (name == 'MasterRequisition' && value != "0")
            //this.GetRequisitionData(value);
    }

    private handleChangeonlyNumaric = (event) => {
        let numbervalue = event.target.value.trim();
        let Numberlength = numbervalue.length;
        let keyupcharter =numbervalue[Numberlength - 1];
       // let numberofdots= numbervalue.split('.');
        if (isNaN(keyupcharter)) {
            numbervalue = numbervalue.slice(0, -1);
        }
        const formData = { ...this.state.formData };
        let rowcount = parseInt(event.target.id.charAt(0));
        const { name } = event.target;
        formData.ItemsData[rowcount][name] = numbervalue;

        // calucate Total Amount 
        let Total = 0;
        formData.ItemsData.map((selItem, index)=> {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice;
            Total = Total + (Quantity * UnitPrice);
        });
        formData.TotalAmount = Math.round(Total *100)/100;

        this.setState({ formData });
    }
    private handleChangeonlyNumaricwithDecmials = (event) => {
        let numbervalue = event.target.value.trim();
        let Numberlength = numbervalue.length;
        let keyupcharter =numbervalue[Numberlength - 1];
        let numberofdots= numbervalue.split('.');
        if (isNaN(keyupcharter) && keyupcharter!='.') {
            numbervalue = numbervalue.slice(0, -1);
        }
        else if(numberofdots.length>2)
        {
            numbervalue = numbervalue.slice(0, -1);
        }
        else if(numberofdots.length==2 && numberofdots[1].length>2)
        {
            numbervalue = numbervalue.slice(0, -1);
        }
        const formData = { ...this.state.formData };
        let rowcount = parseInt(event.target.id.charAt(0));
        const { name } = event.target;
        formData.ItemsData[rowcount][name] = numbervalue;

        // calucate Total Amount 
        let Total = 0;
        formData.ItemsData.map((selItem, index)=> {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice;
            Total = Total + (Quantity * UnitPrice);
        });
        formData.TotalAmount = Math.round(Total * 100)/100;

        this.setState({ formData });
    }

    // private getDifference = (s, t) => {
    //     let sum = t.charCodeAt(t.length - 1);
    //     for (let j = 0; j < s.length; j++) {
    //       sum -= s.charCodeAt(j);
    //       sum += t.charCodeAt(j);
    //     }
    //     return String.fromCharCode(sum);
    //   };


    private handleSubmit = (e) => {
        const data = { ...this.state.formData };
        data.Status = ApprovalStatus.InProgress;
        //var validationdata = {};
        let itemsData = JSON.stringify(data.ItemsData);

        let validationdata = {
            Requisition: { val: data.MasterRequisition, required: true, Name: 'Master Requisition', Type: ControlType.number, Focusid: this.ddlRequisition },
            Department: { val: data.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.ddlDepartment },
            Requisitioner: { val: data.RequisitionerId, required: true, Name: 'Requisitioner', Type: ControlType.people, Focusid: "divRequisitioner" },
        };
        var parentthis = this;
        data.ItemsData.map((selItem, index)=> {
            validationdata["Quantity" + index] = { val: selItem.Quantity, required: true, Name: 'Quantity', Type: ControlType.number, Focusid: parentthis[index + 'Quantity'] };
            validationdata["QuantityUnit" + index] = { val: selItem.QuantityUnit, required: true, Name: 'Quantity for Unit', Type: ControlType.string, Focusid: parentthis[index + 'QuantityUnit'] };
            validationdata["UnitPrice" + index] = { val: selItem.UnitPrice, required: true, Name: 'Unit Price', Type: ControlType.number, Focusid: parentthis[index + 'UnitPrice'] };
            validationdata["Unit" + index] = { val: selItem.Unit, required: true, Name: 'Price for Unit', Type: ControlType.string, Focusid: parentthis[index + 'Unit'] };
            validationdata["VPT" + index] = { val: selItem.VPT, required: true, Name: 'VPT', Type: ControlType.string, Focusid: parentthis[index + 'VPT'] };
        });
        delete data.ItemsData;
        data.ItemsDatajson = itemsData;

        //validationdata.push()

        let isValid = formValidation.checkValidations(validationdata);
        if (isValid.status) {
            for (var i = 0; i < this.state.ApprovalsMatrix.length; i++) {
                if (this.state.ApprovalsMatrix[i].FromBudget <= data.TotalAmount && this.state.ApprovalsMatrix[i].ToBudget >= data.TotalAmount) {
                    data.AssignToId = this.state.ApprovalsMatrix[i].Approval1Id;
                    data.NextApprovalId = this.state.ApprovalsMatrix[i].Approval2Id;
                    data.ApprovalLevel = "1";
                    data.Pendingwith = PendingStatus.Level1; //"Approver 1"; 
                    data.Approver1Id=this.state.ApprovalsMatrix[i].Approval1Id;
                    data.Approver2Id=this.state.ApprovalsMatrix[i].Approval2Id;
                    data.Approver3Id=this.state.ApprovalsMatrix[i].Approval3Id;
                    data.ReviewerId=this.state.ApprovalsMatrix[i].ReviewerId;
                }
            }
            this.insertorupdateListitem(data, "PurchaseRequest",ActionStatus.Submitted);
        }
        else
            this.setState({ errorMessage: isValid.message });
    }
    private handleSave = (e) => {
        const data = { ...this.state.formData };
        data.Status = ApprovalStatus.draft;//'Save';
        let validationdata = {
            Requisition: { val: data.MasterRequisition, required: true, Name: 'Master Requisition', Type: ControlType.number, Focusid: this.ddlRequisition },
            Department: { val: data.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.ddlDepartment },
            Requisitioner: { val: data.RequisitionerId, required: true, Name: 'Requisitioner', Type: ControlType.people, Focusid: "divRequisitioner" },
        };
        let itemsData = JSON.stringify(data.ItemsData);
        delete data.ItemsData;
        data.ItemsDatajson = itemsData;
        let isValid = formValidation.checkValidations(validationdata);
        if (isValid.status) {
            this.insertorupdateListitem(data, "PurchaseRequest",ActionStatus.Draft);
        }
        else
            this.setState({ errorMessage: isValid.message });
    }

    private handleClose = () => {
        this.setState({ showHideModal: false, ItemID: 0, redirect: true });
    }

    private handleApprove = (e) => {
        const data = { ...this.state.formData };
        const submitdata = { AssignToId: null, Status: ApprovalStatus.InProgress, ApprovalLevel: "", NextApprovalId: null };
        for (var i = 0; i < this.state.ApprovalsMatrix.length; i++) {
            if (this.state.ApprovalsMatrix[i].FromBudget <= data.TotalAmount && this.state.ApprovalsMatrix[i].ToBudget >= data.TotalAmount) {
                if (data.ApprovalLevel == "1" && this.state.ApprovalsMatrix[i].Approval2Id != null) {
                    submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval2Id;
                    submitdata.ApprovalLevel = "2";
                    submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].Approval3Id;
                    data.Pendingwith = PendingStatus.Level2;//"Approver 2"; 
                }
                else if (data.ApprovalLevel == "2" && this.state.ApprovalsMatrix[i].Approval3Id != null) {
                    submitdata.AssignToId = this.state.ApprovalsMatrix[i].Approval3Id;
                    submitdata.ApprovalLevel = "3";
                    submitdata.NextApprovalId = this.state.ApprovalsMatrix[i].ReviewerId;
                    data.Pendingwith = PendingStatus.Level3;//"Approver 3"; 
                }
                else if (data.ApprovalLevel == "3" && this.state.ApprovalsMatrix[i].ReviewerId != null) {
                    submitdata.AssignToId = this.state.ApprovalsMatrix[i].ReviewerId;
                    submitdata.ApprovalLevel = "4";
                    submitdata.NextApprovalId = null;
                    data.Pendingwith = PendingStatus.Level4; //"Reviewer"; 
                }
            }
        }
        if (submitdata.AssignToId == null) {
            submitdata.Status = ApprovalStatus.Approved;
            data.Pendingwith = PendingStatus.Empty;
        }
        this.insertorupdateListitem(submitdata, "PurchaseRequest",ActionStatus.Approved);
    }

    private handleReject = (e) => {
        const submitdata = { AssignToId: null, Status: ApprovalStatus.Rejected, ApprovalLevel: "", Pendingwith: PendingStatus.Empty, NextApprovalId: null };
        this.insertorupdateListitem(submitdata, "PurchaseRequest",ActionStatus.Rejected);
    }


    //  private handleExport = (e)=> {
    //     let fileContent = "<table border='1'>"+
    //     "<tr><td><b>Master Requisition</b></td><td><b>Company</b></td><td><b>Plant</b></td><td><b>Department</b></td><td><b>Total Amount</b></td></tr>"+
    //     "<tr><td>"+this.state.formData.MasterRequisition+"</td><td>"+this.state.formData.Company+"</td><td>"+this.state.formData.Plant+"</td><td>"+this.state.formData.Department+"</td><td>"+this.state.formData.TotalAmount+"</td></tr>"+
    //     "</table>";
    //     let newfileContent="Master Requisition\t Company\t Plant\t Department\t Total Amount \n "+this.state.formData.MasterRequisition+"\t"+this.state.formData.Company+"\t"+this.state.formData.Plant+"\t"+this.state.formData.Department+"\t"+this.state.formData.TotalAmount+"";
    //     let siteAbsoluteURL = this.props.context.pageContext.web.serverRelativeUrl;
    //     sp.web.getFolderByServerRelativeUrl(siteAbsoluteURL + "/MROExcels").files.add(this.state.ItemID+'.xls',newfileContent,true).then((responce) => {
    //        this.onSucess(ActionStatus.Export);
    //     });
    //  }
   

    private filesChanged = (selectedFiles) => {
        this.setState({ fileArr: selectedFiles[0],delfileArr:selectedFiles[1]});
    }
    //#endregion 

    //#region  Alerts

    private onSucess = (Action) => {
        this.setState({ modalTitle: 'Success', modalText: 'Purchase Request ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: 0 });
    }

    private onError = (status) => {
        this.setState({ modalTitle: 'Error', modalText:status==''?ActionStatus.Error:status, showHideModal: true, loading: false, isSuccess: false, ItemID: 0 });
    }

    //#endregion

    private async GetRequisitionData(value) {
        var Requisitions: any = await sp.web.lists.getByTitle('RequisitionMaster').items.filter('Id eq ' + value).expand('Requisitioner').select('Requisitioner/EMail,*').get();
        if (Requisitions != Error) {
            Requisitions = Requisitions[0];
            const formData = { ...this.state.formData };
            formData['Plant'] = Requisitions.Plant;
            formData['Company'] = Requisitions.Company;
            formData['RequisitionerId'] = Requisitions.RequisitionerId;
           // let maycoweb = Web(this.sitecollectionURL);
            let oweb;
            if(Requisitions.Company == 'Mayco')
            oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
            else
            oweb = Web(this.props.spContext.siteAbsoluteUrl + "/jvis");
            let Plants: any = await oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();

            var Departments: any = await oweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + Requisitions.Plant + "'").expand('Plant').select('Plant/Title,*').orderBy('Title').get();
            let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and Company eq '"+Requisitions.Company+"' and Plant eq '"+Requisitions.Plant+"'").select('*').get();
            if(ApprovalsMatrix.length==0 ||ApprovalsMatrix==null){
               this.onError("Please configure approvals");
            }
            this.setState({ formData,Departments:Departments,RequisitionerEmail:Requisitions.Requisitioner.EMail,ApprovalsMatrix: ApprovalsMatrix,Plants:Plants });

        }
    }

    private async GetMasterListData() {
        if (!this.state.loading)
            this.setState({ loading: true });
        let maycoweb = Web(this.sitecollectionURL);
        let Plants: any = await maycoweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        let Departments: any = await maycoweb.lists.getByTitle('Department').items.select("*").orderBy("Title").getAll();
        let RequisitionsMaster: any = await sp.web.lists.getByTitle('RequisitionMaster').items.orderBy('Id', true).get();
        let Buyers: any = await sp.web.lists.getByTitle('Buyers').items.select("*").orderBy('Title').get();
        let Vendors: any = await sp.web.lists.getByTitle('Vendor').items.select("*").orderBy('Title').get();
        let QUnits: any = await sp.web.lists.getByTitle('Units').items.select("*").orderBy('Title').get();
        let PUnits: any = await sp.web.lists.getByTitle('PriceUnit').items.select("*").orderBy('Title').get();
        let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1").select('*').get();
        if (this.props.match.params.id != undefined) {
            let ItemID = this.props.match.params.id;
            let Requisitions: any = await sp.web.lists.getByTitle('PurchaseRequest').items.filter('Id eq ' + ItemID).expand('Requisitioner').select('Requisitioner/EMail,*').getAll();
            let files: any = await sp.web.lists.getByTitle('PurchaseRequestDocs').items.filter('ItemID eq ' + ItemID).expand('File').get();
            let ApprovalsMatrixold: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and Company eq '"+Requisitions[0].Company+"' and Plant eq '"+Requisitions[0].Plant+"'").select('*').get();
            let oweb;
            if(Requisitions[0].Company == 'Mayco')
            oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
            else
            oweb = Web(this.props.spContext.siteAbsoluteUrl + "/jvis");
            let getPlants: any = await oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
            //let Departments: any = await maycoweb.lists.getByTitle('Department').items.select("*").orderBy("Title").getAll();
            let filesArry =[];
            files.map((selItem, index)=> {
                //let fileArray ={};
                let name =selItem.File.Name;
                var fileUrl= selItem.File.ServerRelativeUrl;
                let obj ={ URL: fileUrl, IsDeleted: false, IsNew: false,  name: name, FileID: selItem.Id };
                filesArry.push(obj);
            });
            if (Requisitions != Error) {
                Requisitions = Requisitions[0];
                let itemsdata = JSON.parse(Requisitions.ItemsDatajson);
                let currentdivCount = itemsdata.length;
                for (var i = 0; i < currentdivCount; i++) {
                    this[i + "Quantity"] = React.createRef();
                    this[i + "QuantityUnit"] = React.createRef();
                    this[i + "PartNumber"] = React.createRef();
                    this[i + "UnitPrice"] = React.createRef();
                    this[i + "Unit"] = React.createRef();
                    this[i + "VPT"] = React.createRef();
                }
                itemsdata.map((selItem, index)=> {
                    selItem['DateRequired'] = selItem.DateRequired != null ? new Date(selItem.DateRequired) : null;
                });
                const formData = { ...this.state.formData };
                formData['MasterRequisition'] = Requisitions.MasterRequisition;
                formData['Company'] = Requisitions.Company;
                formData['Plant'] = Requisitions.Plant;
                formData['Department'] = Requisitions.Department;
                formData['RequisitionerId'] = Requisitions.RequisitionerId;
                formData['AssignToId'] = Requisitions.AssignToId;
                formData['ApprovalLevel'] = Requisitions.ApprovalLevel;
                formData['Status'] = Requisitions.Status;
                formData['NextApprovalId'] = Requisitions.NextApprovalId;
                formData['TotalAmount'] = Requisitions.TotalAmount;
                formData['Pendingwith'] = Requisitions.Pendingwith;
                formData['ItemsData'] = itemsdata;
                formData.Approver1Id=Requisitions.Approver1Id;
                formData.Approver2Id=Requisitions.Approver2Id;
                formData.Approver3Id=Requisitions.Approver3Id;
                formData.ReviewerId=Requisitions.ReviewerId;

                var newform = {};
                newform['RequisitionerEmail'] = Requisitions.Requisitioner.EMail;
                newform['fileArr'] = files;
                this.setState({
                    Plants: getPlants, Departments: Departments, Requisitions: RequisitionsMaster, Buyers: Buyers, Vendors: Vendors, RequisitionerEmail: Requisitions.Requisitioner.EMail, ItemID: Requisitions.Id,
                    fileArr: filesArry, formData, loading: false, isEdit: true, ApprovalsMatrix: ApprovalsMatrixold, currentdivCount: currentdivCount,isFormloadCompleted:true,Punits:PUnits,Qunits:QUnits
                });

                //if(this.state.formData.Status != 'Save')
                //document.getElementById("divRDate input").disabled = true;

            }
        } else {
            const formData = { ...this.state.formData };
            let count = 1;
            let newobj = {
                Quantity: '',
                QuantityUnit: '',
                PartNumber: '',
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
            formData.ItemsData =[];
            formData.ItemsData.push(newobj);
            this["0Quantity"] = React.createRef();
            this["0QuantityUnit"] = React.createRef();
            this["0PartNumber"] = React.createRef();
            this["0UnitPrice"] = React.createRef();
            this["0Unit"] = React.createRef();
            this["0VPT"] = React.createRef();
            formData.MasterRequisition= null,
            formData.Company= '',
            formData.Plant= '',
            formData.Department= '',
            formData.RequisitionerId= null,
            formData.Status= 'Save',
            formData.AssignToId= null,
            formData.ApprovalLevel= "0",
            formData.NextApprovalId= null,
            formData.TotalAmount= 0,
            formData.Pendingwith= '',
            formData.ItemsDatajson= '',
            this.setState({ Plants: Plants, Departments: Departments, Requisitions: RequisitionsMaster, Buyers: Buyers, Vendors: Vendors, loading: false, ApprovalsMatrix: ApprovalsMatrix, formData, currentdivCount: count, isnewFormLoaded: true,ItemID:0, isEdit: false,RequisitionerEmail:null,fileArr:[],isFormloadCompleted:true,Punits:PUnits,Qunits:QUnits});
        }
    }

    private insertorupdateListitem = (formData, list,status) => {
        this.setState({ loading: true });
        if (this.state.ItemID == 0) {
            try {
                sp.web.lists.getByTitle(list).items.add(formData)
                    .then((res) => {
                        this.AddorUpdatelistItem(res.data.Id,status);
                    }, (Error) => {
                        console.log(Error);
                        this.onError("");
                    })
                    .catch((err) => {
                        console.log(Error);
                        this.onError("");
                    });
            }
            catch (e) {
                console.log(e);
            }
        } else {
            sp.web.lists.getByTitle(list).items.getById(this.state.ItemID).update(formData).then((res) => {
                this.AddorUpdatelistItem(this.state.ItemID,status);
                //this.onSucess(ActionStatus.Updated);
                //console.log(res);
            }, (Error) => {
                console.log(Error);
                this.onError("");
            }).catch((err) => {
                this.onError("");
                console.log(err);
            });
        }
    }

    private UpdateDate = (dateprops) => {
        const formData = { ...this.state.formData };
        let rowcount = parseInt(dateprops[1].charAt(0));
        let fildname = dateprops[1].substring(1);
        formData.ItemsData[rowcount][fildname] = dateprops[0];
        this.setState({ formData });

    }
    private _getPeoplePickerItems = (People, fildname) => {
        const formData = { ...this.state.formData };
        if (People.length > 0)
            formData[fildname] = People[0].id;
        else
            formData[fildname] = null;
        this.setState({ formData });
    }

    private RemoveDiv = (event) => {
        const formData = { ...this.state.formData };
        let rowcount = parseInt(event.target.id.charAt(0));
        let reqitems = formData.ItemsData;
        formData.ItemsData = [];
        for (var i = 0; i < reqitems.length; i++) {
            if (i != rowcount)
                formData.ItemsData.push(reqitems[i]);
        }
        let count = this.state.currentdivCount - 1;
        let Total = 0;
        formData.ItemsData.map((selItem, index)=> {
            let Quantity = selItem.Quantity;
            let UnitPrice = selItem.UnitPrice;
            Total = Total + (Quantity * UnitPrice);
        });
        formData.TotalAmount = Math.round(Total *100)/100;
        this.setState({ formData, currentdivCount: count });
    }

    private dynamicFields = () => {
        let section = [];
        //console.log(this.state);
        for (var i = 0; i < this.state.currentdivCount; i++) {
            section.push(<div className="content light-box border-box-shadow px-2 pt-1 pb-3 mb-2 p-rel">
                <span className="c-close" onClick={this.RemoveDiv} id={i + "Close"} hidden={this.state.currentdivCount == 1 || this.state.formData.Status != 'Save'}>&times;</span>
                <div className="row pt-2 px-2">
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Quantity <span className="mandatoryhastrick">*</span></label>
                            <input className="form-control" required={true} placeholder="" name="Quantity" title="Quantity" value={this.state.formData.ItemsData[i].Quantity || ''} onChange={this.handleChangeonlyNumaric} id={i + 'Quantity'} maxLength={10} autoComplete="off" disabled={this.state.formData.Status != 'Save'} ref={this[i + "Quantity"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Quantity for Unit <span className="mandatoryhastrick">*</span></label>
                            <select className="form-control" required={true} name="QuantityUnit" title="Quantity for Unit" value={this.state.formData.ItemsData[i].QuantityUnit} onChange={this.handleChangeDaynamic} id={i + 'QuantityUnit'} disabled={this.state.formData.Status != 'Save'} ref={this[i + "QuantityUnit"]}>
                                <option value=''>None</option>
                                {this.state.Qunits.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.ItemsData[i].QuantityUnit || ''}>{option.Title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Unit Price <span className="mandatoryhastrick">*</span></label>
                            <input className="form-control" required={true} placeholder="" name="UnitPrice" title="Unit Price" value={this.state.formData.ItemsData[i].UnitPrice || ''} onChange={this.handleChangeonlyNumaricwithDecmials} id={i + 'UnitPrice'} maxLength={10} autoComplete="off" disabled={this.state.formData.Status != 'Save'} ref={this[i + "UnitPrice"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Price for Unit <span className="mandatoryhastrick">*</span></label>
                            <select className="form-control" required={true} name="Unit" title="Price for Unit" value={this.state.formData.ItemsData[i].Unit} onChange={this.handleChangeDaynamic} id={i + 'Unit'} disabled={this.state.formData.Status != 'Save'} ref={this[i + "Unit"]}>
                                <option value=''>None</option>
                                {this.state.Punits.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.ItemsData[i].Unit || ''}>{option.Title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                </div>

                <div className="row pt-2 px-2">
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Part Number </label>
                            <input className="form-control" required={true} placeholder="" name="PartNumber" title="Part Number" value={this.state.formData.ItemsData[i].PartNumber || ''} onChange={this.handleChangeDaynamic} id={i + 'PartNumber'} autoComplete="off" disabled={this.state.formData.Status != 'Save'} ref={this[i + "PartNumber"]} />
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="light-text">
                            <label>VPT# <span className="mandatoryhastrick">*</span></label>
                            <input className="form-control" required={true} placeholder="" type="text" name="VPT" title="VPT#" value={this.state.formData.ItemsData[i].VPT || ''} onChange={this.handleChangeDaynamic} id={i + 'VPT'} autoComplete="off" disabled={this.state.formData.Status != 'Save'} ref={this[i + "VPT"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Buyer </label>
                            <select className="form-control" required={true} name="Buyer" title="Buyer" value={this.state.formData.ItemsData[i].Buyer} onChange={this.handleChangeDaynamic} id={i + 'Buyer'} disabled={this.state.formData.Status != 'Save'}>
                                <option value=''>None</option>
                                {this.state.Buyers.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.ItemsData[i].Buyer || ''}>{option.Title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="light-text div-readonly">
                            <label className="z-in-9">Date Required </label>
                            <div className="custom-datepicker" id="divRDate">

                                <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.formData.ItemsData[i].DateRequired} id={i + 'DateRequired'}  isDisabled={this.state.formData.Status != 'Save'}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row pt-2 px-2">

                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Vendor</label>
                            <select className="form-control" required={true} name="Vendor" title="Vendor" value={this.state.formData.ItemsData[i].Vendor} onChange={this.handleChangeDaynamic} id={i + 'Vendor'} disabled={this.state.formData.Status != 'Save'}>
                                <option value=''>None</option>
                                {this.state.Vendors.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.ItemsData[i].Vendor || ''}>{option.Title}</option>
                                ))}
                            </select>

                            {/* <select className="form-control" name="Vendor"  title="Vendor" onChange={this.handleChangeDaynamic} disabled={this.state.formData.Status !='Save'} id={i+'Vendor'}>
                            <option>None</option>
                            {this.state.Vendors.map((item, index) => <option key={index} value={this.state.formData.ItemsData[i].Vendor} selected={item.Title == this.state.formData.ItemsData[i].Vendor}>{item.Title}</option>)}
                        </select> */}
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Program</label>
                            <select className="form-control" required={true} name="Program" title="Program" value={this.state.formData.ItemsData[i].Program} onChange={this.handleChangeDaynamic} id={i + 'Program'} disabled={this.state.formData.Status != 'Save'}>
                                <option value=''>None</option>
                                {this.state.Programs.map((option) => (
                                    <option value={option} selected={this.state.formData.ItemsData[i].Program || ''}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-3" hidden={this.state.formData.ItemsData[i].ProgramLable == ''}>
                        <div className="light-text">
                            <label>{this.state.formData.ItemsData[i].ProgramLable}</label>
                            <input className="form-control" required={true} placeholder="" type="text" name="ProgramNumber" title={this.state.formData.ItemsData[i].ProgramLable} value={this.state.formData.ItemsData[i].ProgramNumber || ''} onChange={this.handleChangeDaynamic} id={i + 'ProgramNumber'} autoComplete="off" disabled={this.state.formData.Status != 'Save'} ref={this[i + "ProgramNumber"]} />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="light-text">
                            <label>Description/Reason</label>
                            <textarea rows={2} className="form-control" maxLength={1000} placeholder="" name="Description" title="Description" value={this.state.formData.ItemsData[i].Description || ''} autoComplete="false" onChange={this.handleChangeDaynamic} id={i + 'Description'} disabled={this.state.formData.Status != 'Save'}></textarea>
                        </div>
                    </div>
                </div>

            </div>);
        }
        return section;
    }

    private createUI = () => {
        const formData = { ...this.state.formData };
        let prvcount = this.state.currentdivCount;
        let count = prvcount + 1;
        let newobj = {

            Quantity: '',
            QuantityUnit: '',
            PartNumber: '',
            UnitPrice: null,
            Unit: null,
            VPT: '',
            Buyer: '',
            DateRequired: null,
            Vendor: '',
            Description: '',
            ProgramLable: '',
            ProgramNumber: null,
        };
        this[prvcount + "Quantity"] = React.createRef();
        this[prvcount + "QuantityUnit"] = React.createRef();
        this[prvcount + "PartNumber"] = React.createRef();
        this[prvcount + "UnitPrice"] = React.createRef();
        this[prvcount + "Unit"] = React.createRef();
        this[prvcount + "VPT"] = React.createRef();
        formData.ItemsData.push(newobj);
        this.setState({ formData, currentdivCount: count });
    }

    private async AddorUpdatelistItem(ItemID: number,actionStatus) {
        let processedFiles = 0;
        let newFileArry =[];
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
                                this.onSucess(actionStatus);
                                
                                //if (this.state.ItemID != 0)
                                   // this.onSucess(ActionStatus.Updated);
                                // else
                                //     this.onSucess( this.state.currentDataStatus == "Save" ? ActionStatus.Saved :ActionStatus.Submitted);
                            }
                        });
                    });

                }, (err) => {
                    console.log(Error);
                    this.onError("");
                });
            }
        } else {
            // if (this.state.ItemID != 0)
            //     //this.onSucess(ActionStatus.Updated);
            //     this.onSucess(ActionStatus.Submitted);
            // else
            //     this.onSucess(this.state.currentDataStatus == "Save" ? ActionStatus.Saved :ActionStatus.Submitted);
            this.onSucess(actionStatus);
        }

    }

    private async deleteListItem(){
        let list = sp.web.lists.getByTitle("PurchaseRequestDocs");
        if (this.state.delfileArr.length > 0) {
            this.state.delfileArr.map((selItem, index)=> {
                let itemId = selItem['FileID'];
                list.items.getById(itemId).delete(); 
            });
        }
    }

    public render() {
        if (this.props.match.params.id == undefined && this.state.ItemID != 0 && !this.state.isnewFormLoaded) {
            this.GetMasterListData();
        }
        if (this.state.redirect) {
            let url = `/`;
            return (<Navigate to={url} />);
        } else {
            return (
                <React.Fragment>
                    {highlightCurrentNav("lipurchaseLink")}
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Purchase Request
                            <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>
                                <div className="light-box media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row px-2">

                                            <div className="col-md-4">
                                                <div className='light-text'>
                                                    <label>Master Requisition <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} id="ddlRequisition" name="MasterRequisition" title={'Master Requisition'} onChange={this.handleChange} disabled={this.state.isEdit} ref={this.ddlRequisition}>
                                                        <option>None</option>
                                                        {this.state.Requisitions.map((item, index) => <option key={index} value={item.Id} selected={item.Id == this.state.formData.MasterRequisition}>{item.Description ? item.Id + " " + item.Description : item.Id}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <div className='light-text div-readonly'>
                                                    <label>Company </label>
                                                    <input type='text' required={true} className="form-control" value={this.state.formData.Company || ''} name='Company' onChange={this.handleChange} aria-errormessage='Please fill the Contact number' title='Company' disabled></input>
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <div className='light-text div-readonly'>
                                                    <label>Plant </label>
                                                    <select className="form-control" id="ddlPlant" required={true} name="Plant" value={this.state.formData.Plant} onChange={this.handleChange} disabled>
                                                        <option>None</option>
                                                        {this.state.Plants.map((item, index) => <option key={index} value={item.Title} selected={item.Title == this.state.formData.Plant}>{item.Title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row pt-2 px-2">
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Department <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} id="ddlDepartment" name="Department" value={this.state.formData.Department} onChange={this.handleChange} disabled={this.state.isEdit} ref={this.ddlDepartment}>
                                                        <option>None</option>
                                                        {this.state.Departments.map((item, index) => <option key={index} value={item.Title} selected={item.Title == this.state.formData.Department}>{item.Title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Requisitioner <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divRequisitioner">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={true}
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
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Total Amount </label>
                                                    <input className="form-control" required={true} placeholder="" type="number" name="Unit" title="Unit" value={this.state.formData.TotalAmount || ''} onChange={this.handleChange} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="light-box border-box-shadow m-1 p-3">
                                            <h6 className="mb-3">Request Details</h6>

                                           {this.state.isFormloadCompleted &&this.dynamicFields()} 
                                          


                                        </div>
                                        <div className="px-1 text-right">
                                            <span onClick={this.createUI} className="add-button" hidden={this.state.formData.Status != 'Save'} ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span>
                                        </div>
                                        <div className="">
                                            <div className="media-px-4">
                                                <div className="mt-4"></div>
                                                {this.state.isFormloadCompleted &&
                                                <FileUpload ismultiAllowed={true} onFileChanges={this.filesChanged} isnewForm={!(this.state.formData.Status != 'Save')} files={[this.state.fileArr,this.state.delfileArr]} />}
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div>
                                    <span className='text-validator'> {this.state.errorMessage}</span>
                                </div>

                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center button-area" id="">
                                        <button type="button" onClick={this.handleApprove} id="btnApprove" className="SaveButtons btn" hidden={this.state.formData.AssignToId != this.props.context.pageContext.legacyPageContext["userId"]} >Approve</button>
                                        <button type="button" onClick={this.handleReject} id="btnReject" className="RejectButtons btn" hidden={this.state.formData.AssignToId != this.props.context.pageContext.legacyPageContext["userId"]} >Reject</button>
                                        <button type="button" onClick={this.handleSave} id="btnSave" className="SaveButtons btn" hidden={this.state.formData.Status != 'Save'} >Draft</button>

                                        <button type="button" onClick={this.handleSubmit} id="btnSubmit" className="SubmitButtons btn" hidden={this.state.formData.Status != 'Save'}>{this.state.SaveUpdateText}</button>
                                       

                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.handleClose}>Cancel</button>
                                    </div>
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

export default PurchaseRequest;