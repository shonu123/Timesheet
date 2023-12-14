import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { Navigate, NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { sp } from '@pnp/sp';
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { Web } from '@pnp/sp/webs';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import TableGenerator from '../Shared/TableGenerator';
import { ControlType, Dropdowns } from '../../Constants/Constants';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import formValidation from '../../Utilities/Formvalidator';
import DatePicker from "../Shared/DatePickerField";
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import "../Shared/Menuhandler";

export interface ReportsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
}
export interface ReportsState {

}
class PurchaseReports extends React.Component<ReportsProps, ReportsState>{
    public state = {
        Company: '', FromDate: null, ToDate: null, PONumber:'', data: [], loading: true, modalText: '', modalTitle: '', isSuccess: false, showHideModal: false, errorMessage: '', ItemID: 0, displayListView: false, reportsData: [], ExportData: [], Companys: JSON.parse(Dropdowns.Companys), filterLable: 'All', filterData: [], filterText: 'All', defaultUsers: null, redirect: false,
        ExportExcelReportsData :[]
    };

    private rootURL: string;
    private rootweb;
    private Company: string;
    private ponumber;
    constructor(props) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });    
        if (this.props.spContext.webAbsoluteUrl.includes('mayco')) {
            this.rootURL = this.props.spContext.siteAbsoluteUrl + "/Mayco";
            this.Company = 'Mayco';
        }
        else {
            this.rootURL = this.props.spContext.siteAbsoluteUrl + "/jvis";
            this.Company = 'Jvis';
        }
        this.rootweb = Web(this.rootURL);
        this.ponumber = React.createRef();
    }
    public componentDidMount() {
        highlightCurrentNav("lisearchbypolistLink");
        this.GetMasterListData();
    }
    private async GetMasterListData() {
        var Plants: any = []; //await this.rootweb.lists.getByTitle('Plant').items.select("Title,*").orderBy("Title").get();
        this.setState({ loading: false, Plants: Plants, Company: this.Company });
    }

    private UpdateDate = (dateprops) => {
        let fildname = dateprops[1];
        let returnObj = {};
        returnObj[fildname] = dateprops[0];
        if(fildname=="FromDate" && (this.state.ToDate == "" || this.state.ToDate == null))
        returnObj["ToDate"]=new Date();
        this.setState(returnObj);
    }
    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }
    private _getPeoplePickerItems = (People, fildname) => {
        let returnObj = {};
        if (People.length > 0)
            returnObj[fildname] = People[0].id;
        else
            returnObj[fildname] = null;
        this.setState(returnObj);
    }

    private async GetReportsListData() {
        this.setState({ loading: true });
        //let addonemoreday = new Date(this.state.ToDate.getTime() + 86400000);
        // let filterQuery = `(Modified ge datetime'${this.state.FromDate.toISOString()}' and Modified le datetime'${addonemoreday.toISOString()}') and Company eq '` + this.state.Company + `' and (Status eq 'Approved' or Status eq 'Rejected' or Status eq 'purchasing team updated')`;
        let filterQuery = `PONumber eq '` + this.state.PONumber + `' and Company eq '` + this.state.Company + `' and (Status eq 'Approved')`;
        var reportsData: any = await sp.web.lists.getByTitle('PurchaseRequest').items.filter(filterQuery).expand("Author", "Requisitioner").select("Author/Title", "Requisitioner/Title,*").orderBy("Modified", true).getAll();
        let excelData = [];
        let tableData =[];
        reportsData.forEach((Item) => {
            let date = new Date(Item.Created).getMonth() + 1 + '/' + new Date(Item.Created).getDate() + '/' + new Date(Item.Created).getFullYear();
            let Itemsdata = JSON.parse(Item.ItemsDatajson);
            Itemsdata.map((Items, i) => {
                let newDateFormat = '';
                let CommodityCategory = '';
                let PlantCode = '';
                let Database = '';
                let RequsitionerCode = '';
                let ProjectCode = '';
                let PurchaseRequestCount = 1;
                let Quantity = '';
                let QuantityUnit = '';
                let UnitPrice = '';
                let Unit = '';
                let VPT = '';
                let Vendor = '';
                let Program = '';
                let ItemDescription = '';

                if (Items.DateRequired != null) {
                    let itemDate = new Date(Items.DateRequired);
                    newDateFormat = (itemDate.getMonth() + 1) + '-' + itemDate.getDate() + '-' + itemDate.getFullYear();
                }
                if (Item.ProjectCode != null) {
                    ProjectCode = Item.ProjectCode;
                }
                if (Item.CommodityCategory != null) {
                    CommodityCategory = Item.CommodityCategory;
                }
                if (Item.PlantCode != null) {
                    PlantCode = Item.PlantCode;
                }
                if (Item.Database != null) {
                    Database = Item.Database;
                }
                if (Item.RequsitionerCode != null) {
                    RequsitionerCode = Item.RequsitionerCode;
                }
                if (i >= 1) {
                    PurchaseRequestCount = i + 1;
                }
                Quantity = Items.Quantity;
                QuantityUnit = Items.QuantityUnit;
                UnitPrice = Items.UnitPrice;
                Unit = Items.Unit;
                VPT = Items.VPT;
                Vendor = Items.Vendor;
                Program = Items.Program;
                ItemDescription = Items.Description;
              //Below code is to prepare customised data for export exel.
                excelData.push({
                    Id: Item.Id,
                    Requisition: Item.Id,
                    Company:Item.Company,
                    Plant: Item.Plant,
                    PONumber:Item.PONumber,
                    Department: Item.Department,
                    TotalAmount: Item.TotalAmount,
                    Requisitioner: Item.Requisitioner.Title,
                    Buyer: Item.Buyer,
                    ProjectCode: Item.ProjectCode,
                    CommodityCategory: Item.CommodityCategory,
                    Status: Item.Status,
                    //Author: Item.Author.Title,
                    //Created: date,
                    UnitPrice:Items.UnitPrice,
                    Description: Item.Description,
                    Daterequired: newDateFormat,
                    PlantCode: PlantCode,
                    Database: Database,
                    RequsitionerCode: RequsitionerCode,
                    PurchaseRequestCount: PurchaseRequestCount,
                    Quantity: Quantity,
                    QuantityUnit: QuantityUnit,
                    Unit: Unit,
                    VPT: VPT,
                    Vendor: Vendor,
                    Program: Program,
                    ItemDescription: ItemDescription,                
                });
            });
             //Below code is to prepare table data.
            tableData.push({
                Id: Item.Id,
                Requisition: Item.Id,
                Plant: Item.Plant,
                Department: Item.Department,
                TotalAmount: Item.TotalAmount,
                Requisitioner: Item.Requisitioner.Title,
                Buyer: Item.Buyer,
                ProjectCode: Item.ProjectCode,
                CommodityCategory: Item.CommodityCategory,
                Status: Item.Status,
                
            });
            tableData.sort((a, b) => parseInt(b.Id) - parseInt(a.Id));
        });
       
        this.setState({ data: tableData, ExportExcelReportsData:excelData, loading: false, displayListView: true, errorMessage: '', reportsData: reportsData });
    }

    private handleChangeReport = (event) => {
        let returnObj = {};
        returnObj[event.target.name] = event.target.value;
        returnObj['filterLable'] = event.target.value;
        returnObj['filterText'] = null;
        returnObj['defaultUsers'] = null;
        this.setState(returnObj);
    }
    private handleChange = (event) => {
        let returnObj = {};
        returnObj[event.target.name] = event.target.value != "" ? event.target.value : '';
        this.setState(returnObj);
    }

    private handlePlanChange = (event) => {
        let returnObj = { ...this.state };
        let value = event.target.value;
        returnObj[event.target.name] = event.target.value != "None" ? event.target.value : null;
        // returnObj.Department = '';
        // this.rootweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + event.target.value + "'").select("*").orderBy("Title").get().then((res) => {
        //     let Departments = value != '' ? res : [];
        //     returnObj.Departments = Departments;
        //     this.setState(returnObj);
        // });
    }

    // private onSucess = (Action) => {
    //     this.setState({ modalTitle: 'Sucess', modalText: 'Purchase Request ' + Action, showHideModal: true, loading: false, isSuccess: true, ItemID: 0 });
    // }

    // private onError = () => {
    //     this.setState({ modalTitle: 'Error', modalText: ActionStatus.Error, showHideModal: true, loading: false, isSuccess: false, ItemID: 0 });
    // }
    public handleClose = () => {
        this.setState({ redirect: true, showHideModal: false });
    }
    private SubmitData = () => {
        let filtertext = '';
        let foucesitem;
        let type = ControlType.string;
        // if (this.state.filterLable == 'All') {
        //     filtertext = 'All';
        // }
        // else {
        //     filtertext = this.state.filterText;
        //     foucesitem = "divRequisitioner";
        //     type = ControlType.people;
        // }
        let data = {
            PONumber: { val: this.state.PONumber, required: true, Name: 'PO Number', Type: type, Focusid: this.ponumber },
            // FromDate: { val: this.state.FromDate, required: true, Name: 'From Date', Type: ControlType.date, Focusid: 'divFDate' },
            // ToDate: { val: this.state.ToDate, required: true, Name: 'To Date', Type: ControlType.date, Focusid: 'divTDate' },
            // compareDates: { startDate: this.state.FromDate, EndDate: this.state.ToDate, startDateName: 'From Date', EndDatename: 'To Date', Type: ControlType.compareDates, Focusid: 'divFDate' }
        };

        let isValid = formValidation.checkValidations(data);
        if (isValid.status)
            this.GetReportsListData();
        else
            this.setState({ errorMessage: isValid.message });
    }

    // private dynamicFields = () => {
    //     let section = [];
    //     if (this.state.filterLable != 'Approver') {
    //         section.push(<div className="col-md-4">
    //             <div className="light-text">
    //                 <label>{this.state.filterLable} <span className="mandatoryhastrick">*</span></label>
    //                 <div className="custom-peoplepicker" id="divRequisitioner">
    //                     <PeoplePicker
    //                         context={this.props.context}
    //                         titleText=""
    //                         personSelectionLimit={1}
    //                         showtooltip={false}
    //                         disabled={false}
    //                         onChange={(e) => this._getPeoplePickerItems(e, 'filterText')}
    //                         showHiddenInUI={false}
    //                         ensureUser={true}
    //                         required={true}
    //                         defaultSelectedUsers={[this.state.defaultUsers]}
    //                         principalTypes={[PrincipalType.User]}
    //                         resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
    //                 </div>
    //             </div>
    //         </div>);
    //     } else {
    //         section.push(<div className="col-md-4">
    //             <div></div>
    //             <div className="light-text">
    //                 <label>{this.state.filterLable} <span className="mandatoryhastrick">*</span></label>
    //                 <div className="custom-peoplepicker" id="divRequisitioner">
    //                     <PeoplePicker
    //                         context={this.props.context}
    //                         titleText=""
    //                         personSelectionLimit={1}
    //                         showtooltip={false}
    //                         disabled={false}
    //                         onChange={(e) => this._getPeoplePickerItems(e, 'filterText')}
    //                         showHiddenInUI={false}
    //                         ensureUser={true}
    //                         required={true}
    //                         defaultSelectedUsers={[]}
    //                         principalTypes={[PrincipalType.User]}
    //                         resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
    //                 </div>
    //             </div>
    //         </div>);
    //     }
    //     //}
    //     return section;
    // }

    public render() {
        //Below ExportExcelreportColumns code is to prepare customised columns for export exel.
        let ExportExcelreportColumns = [
            {
                name: "Master Req#",
                selector: 'Requisition',
                //selector: (row, i) => row.Requisition,
            },
            {
                name: "Company",
                selector: 'Company',
                //selector: (row, i) => row.Company,
            },
            {
                name: "Plant",
                selector: 'Plant',
                //selector: (row, i) => row.Plant,
            },
            {
                name: "Plant Code",
                selector: 'PlantCode',
                //selector: (row, i) => row.PlantCode,
            },
            {
                name: "Vendor",
                selector: 'VendorName',
                //selector: (row, i) => row.PlantCode,
            },
            {
                name: "PO Number",
                selector: 'PONumber', 
            },
            {
                name: "Database",
                selector: 'Database',
                //selector: (row, i) => row.Database,
            },
            {
                name: "Department",
                selector: 'Department',
                //selector: (row, i) => row.Department,
            },
            {
                name: "Buyer",
               selector: 'Buyer',
                //selector: (row, i) => row.Buyer,
            },
            {
                name: "Project Code",
                selector: 'ProjectCode',
                //selector: (row, i) => row.ProjectCode,
            },
            {
                name: "Commodity Category",
                selector: 'CommodityCategory',
               // selector: (row, i) => row.CommodityCategory,
            },
            {
                name: "Description",
                selector: 'Description',
                //selector: (row, i) => row.Description,
            },
            {
                name: "Total Amount",
                 selector: 'TotalAmount',
                //selector: (row, i) => row.TotalAmount,
            },
            {
                name: "Purchase Req#",
                selector: 'PurchaseRequestCount',
                //selector: (row, i) => row.PurchaseRequestCount,
            },
            {
                name: "Quantity",
                selector: 'Quantity',
                //selector: (row, i) => row.Quantity,
            }, {
                name: "Quantity for Unit",
                selector: 'QuantityUnit',
                //selector: (row, i) => row.QuantityUnit,
            },
            {
                name: "Unit Price",
                selector: 'UnitPrice',
                //selector: (row, i) => row.UnitPrice,
            },
            {
                name: "Price for Unit",
                selector: 'Unit',
                //selector: (row, i) => row.Unit,
            },
            {
                name: "VPT#",
                selector: 'VPT',
                //selector: (row, i) => row.VPT,
            },
            {
                name: "Date required",
                selector: 'Daterequired',
                //selector: (row, i) => row.Daterequired,
            },
            {
                name: "Vendor",
                selector: 'Vendor',
                //selector: (row, i) => row.Vendor,
            },
            {
                name: "Program",
                selector: 'Program',
                //selector: (row, i) => row.Program,
            },
            {
                name: "Description/Reason",
                selector: 'ItemDescription',
                //selector: (row, i) => row.ItemDescription,
            },
            {
                name: "Requsitioner Code",
                selector: 'RequsitionerCode',
                //selector: (row, i) => row.RequsitionerCode,
            },
            {
                name: "CMS Req#",
                selector: '',                
            }
        ];
        //Below columns used for regular table.
        let columns = [
            {
                name: "View",
               // selector: "Id",
               selector: (row, i) => row.Id,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View" className="csrLink ms-draggable" to={`/purchaserequest/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                }
            },

            {
                name: "Requisition",
               // selector: 'Requisition',
                selector: (row, i) => row.Requisition,
                sortable: true
            },
            {
                name: "Plant",
               // selector: 'Plant',
               selector: (row, i) => row.Plant,
                sortable: true
            },
            {
                name: "Vendor",
               // selector: 'Plant',
               selector: (row, i) => row.VendorName,
                sortable: true
            },
            {
                name: "Department",
                // selector: 'Department',
                selector: (row, i) => row.Department,
                sortable: true
            },
            {
                name: "Requisitioner",
               // selector: 'Requisitioner',
               selector: (row, i) => row.Requisitioner,
                sortable: true
            },
            {
                name: "Buyer",
                //selector: 'Buyer',
                selector: (row, i) => row.Buyer,
                sortable: true
            },
            {
                name: "Project Code",
                //selector: 'ProjectCode',
                selector: (row, i) => row.ProjectCode,
                sortable: true
            },
            {
                name: "Commodity Category",
               // selector: 'CommodityCategory',
                selector: (row, i) => row.CommodityCategory,
                sortable: true
            },
            {
                name: "Total Amount",
                //selector: 'TotalAmount',
                selector: (row, i) => row.TotalAmount,
                sortable: true
            },
            {
                name: "Status",
               // selector: 'Status',
               selector: (row, i) => row.Status,
                sortable: true
            },
        ];
        if (this.state.redirect) {
            let url = `/`;
            return (<Navigate to={url} />);
        }
        
        else { //var DatePicker = require("react-bootstrap-date-picker");
            return (
                <React.Fragment>
                    {this.state.loading && <Loader />}

                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
                            <div className="menu-icon">
                                <span>
                                </span>
                                <span>
                                </span>
                                <span>
                                </span>
                            </div>
                        </div>
                        <div className='container-fluid'>
                            <div className='FormContent min-52'>
                                <div className='title'>Search by PO#
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>

                                <div className="after-title"></div>

                                <div className="light-box border-box-shadow mx-2">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Company</label>
                                                    <select className="form-control" required={true} name="Company" title="Company" value={this.state.Company} disabled={true}>
                                                        <option value=''>None</option>
                                                        {this.state.Companys.drp.map((option) => (
                                                            <option value={option.Title} selected={this.state.Company != ''}>{option.Title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>PO # </label>
                                                    <input className="form-control" required={true} type="text" id="txtPONumber" name="PONumber" ref={this.ponumber} onChange={this.handleChange}>
                                                    </input>
                                                </div>
                                            </div>
                                            {/* <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Department </label>
                                                    <select className="form-control" required={true} id="ddlDepartment" name="Department" onChange={this.handleChange} ref={this.ddlDepartment}>
                                                        <option>None</option>
                                                        {this.state.Departments.map((item, index) => <option key={index} value={item.Title} selected={item.Title == this.state.Department}>{item.Title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className='light-text'>
                                                    <label>Report For <span className="mandatoryhastrick">*</span></label>
                                                    <select name="ReportFor" className="form-select form-control" onChange={this.handleChangeReport}>
                                                        {this.state.ReportType.map((Name, index) => <option key={index} value={Name} selected={Name == this.state.ReportFor}>{Name}</option>)}
                                                    </select>
                                                </div>
                                            </div> */}
    {/* 
                                            {this.state.filterLable != 'All' && this.dynamicFields()}
                                            <div className="col-md-4">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">From Date <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divFDate">
                                                        <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.FromDate || null} id="FromDate" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text div-readonly">
                                                    <label className="z-in-9">To Date <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-datepicker" id="divTDate">

                                                        <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.ToDate || null} id="ToDate" />
                                                    </div>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                    <span className="text-validator" id="spanErrorMessage">{this.state.errorMessage}</span>
                                    <div className="row mx-1" id="">
                                        <div className="col-sm-12 text-center my-2" id="">
                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.SubmitData}>Submit</button>
                                            <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.handleClose}>Cancel</button>
                                        </div>
                                    </div>
                                </div>
                                <div className={this.state.displayListView ? '' : 'activediv'}>
                                    <div className="light-box border-box-shadow m-2">
                                        <div className="c-v-table table-head-1st-td">
                                            <TableGenerator columns={columns} data={this.state.data} fileName={'Reports'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.ExportExcelReportsData} prvPageNumber={0}></TableGenerator>
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

export default PurchaseReports;