import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import ImportExcel from '../Shared/ImportExcel';

interface VendorProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface VendorState {
    formData: {
        Title: string,
        IsActive: boolean,
        Vendor_x0020_Number: number,
        Company: string,
        Plant: string,
        Database: string,
        PlantCode: string
    };
    SaveUpdateText: string;
    vendors: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewvendor: boolean;
    isNewform: boolean;
    Plants: any;
    Companys: any;
    ImportedExcelData: any;
}

class Vendor extends Component<VendorProps, VendorState> {
    private siteURL: string;
    private vendorName;
    private vendorNumber;
    private inputCompany;
    private inputPlant;
    private oweb;
    private Company: string;
    private database;
    constructor(props: VendorProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.vendorName = React.createRef();
        this.vendorNumber = React.createRef();
        this.inputCompany = React.createRef();
        this.inputPlant = React.createRef();
        this.database = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;

        this.state = {
            formData: {
                Title: '',
                IsActive: true,
                Vendor_x0020_Number: null,
                Company: '',
                Plant: '',
                Database: '',
                PlantCode: ''
            },
            SaveUpdateText: 'Submit',
            vendors: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewvendor: false,
            isNewform: true,
            Plants: [],
            Companys: ['Mayco', 'Jvis'],
            ImportedExcelData: []
        };

        if (this.siteURL.includes('mayco')) {
            this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
            this.Company = 'Mayco';
        } else {
            this.oweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
            this.Company = 'Jvis';
        }
    }

    public componentDidMount() {
        highlightCurrentNav("vendor");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    Title: '', Company: '', Plant: '',
                    Database: '',
                    PlantCode: '', IsActive: true, Vendor_x0020_Number: null
                }, SaveUpdateText: 'Submit', addNewvendor: false
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value;
        const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        formData[name] = value;
        this.setState({ formData });
    }

    private handleonBlur = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value.trim();
        const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        formData[name] = value;
        this.setState({ formData });
    }
    private changeplant = (event) => {
        const formData = { ...this.state.formData };
        let name = event.target.name;
        formData[name] = event.target.value != 'None' ? event.target.value : null;

        // let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
        let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');

        var selectedIndex = event.nativeEvent.target.selectedIndex;

        // formData[name] = event.nativeEvent.target[selectedIndex].text;

        // formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
        formData['PlantCode'] = customAttrPlantCode != 'None' ? customAttrPlantCode : null;

        this.setState({ formData });
    }
    private handleChangeNumber = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        var numbervalue = event.target.value.trim();
        let Numberlength = numbervalue.length;
        if (isNaN(numbervalue[Numberlength - 1]))
            numbervalue = numbervalue.slice(0, -1);
        formData[name] = numbervalue;
        this.setState({ formData });
    }
    private handleSubmit = (event) => {
        event.preventDefault();
        // this.setState({ loading: true });
        let data = {
            Plant: { val: this.state.formData.Plant, required: false, Name: 'Plant', Type: ControlType.string, Focusid: this.inputPlant },
            venderName: { val: this.state.formData.Title, required: true, Name: 'Vendor Name', Type: ControlType.string, Focusid: this.vendorName },
            Database: { val: this.state.formData.Database, required: false, Name: 'Database', Type: ControlType.string, Focusid: this.database },
            venderNumber: { val: this.state.formData.Vendor_x0020_Number, required: true, Name: 'Vendor Number', Type: ControlType.string, Focusid: this.vendorNumber }
        };

        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.checkDuplicates(formdata, id);
        } else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }

    private checkDuplicates = (formData, id) => {
        let VendorList = 'Vendor';
        var filterString;

        try {
            if (id == 0)
                filterString = `(Vendor_x0020_Number eq '${formData.Vendor_x0020_Number}') and Company eq '${formData.Company}' and IsActive eq '${formData.IsActive ? 1 : 0}'`;
            else
                filterString = `(Vendor_x0020_Number eq '${formData.Vendor_x0020_Number}') and Company eq '${formData.Company}' and IsActive ne '${formData.IsActive}' and Id ne ` + id;
            sp.web.lists.getByTitle(VendorList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);

                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle('Vendor').items.getById(id).update(formData).then((res) => {
                                // this.loadListData();
                                // this.resetVendorForm();
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Vendor updated successfully',
                                    showHideModal: true,
                                    isSuccess: true
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle('vendor').items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.loadListData();
                                        this.resetVendorForm();
                                        this.setState({
                                            modalTitle: 'Success',
                                            modalText: 'Vendor submitted successfully',
                                            showHideModal: true,
                                            isSuccess: true
                                        });
                                    })
                                    .catch((err) => {
                                        console.log('Failed to add');
                                        this.setState({
                                            loading: false,
                                            modalTitle: 'Error',
                                            modalText: 'Sorry! something went wrong',
                                            showHideModal: true,
                                            isSuccess: false
                                        });
                                    });
                            }
                            catch (e) {
                                console.log(e);
                                this.setState({
                                    loading: false,
                                    modalTitle: 'Error',
                                    modalText: 'Sorry! something went wrong',
                                    showHideModal: true,
                                    isSuccess: false
                                });
                            }
                        }
                    }
                });
        }
        catch (e) {
            this.onError();
            console.log(e);
        }
        // return findduplicates
    }

    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }

    private async loadListData() {
        // var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        var uniquePlantsList = []; let flags = {};
        Plants.filter(item => {
            if (item.Database != null) {
                if (flags[item.Database] == true) return false;
                else { flags[item.Database] = true; uniquePlantsList.push(item); return true; }
            }
        });
        // var formdata = {...this.state.formData};
        // formdata.Company = this.Company;
        sp.web.lists.getByTitle('Vendor').items.select('Title,*').orderBy("Id", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                this.setState({
                    vendors: response.map(o => ({
                        Id: o.Id, Company: o.Company, PlantCode: o.PlantCode, Plant: o.Plant,
                        Database: o.Database,
                        Title: o.Title, IsActive: o.IsActive == true ? 'Active' : 'In-Active', Vendor_x0020_Number: o.Vendor_x0020_Number
                    })),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    Plants: uniquePlantsList
                });
            }).catch(err => {
                console.log('Failed to fetch data.');
                this.setState({
                    loading: false,
                    modalTitle: 'Error',
                    modalText: 'Sorry! something went wrong',
                    showHideModal: true,
                    isSuccess: false
                });
            });
    }
    private async onEditClickHandler(id) {
        console.log('edit clicked', id);

        try {
            var response = await sp.web.lists.getByTitle('vendor').items.getById(id).get();

            this.setState({
                formData: {
                    Title: response.Title, Company: response.Company, Plant: response.Plant, PlantCode: response.PlantCode,
                    Database: response.Database,
                    IsActive: response.IsActive, Vendor_x0020_Number: response.Vendor_x0020_Number.trim()
                },
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewvendor: true
            });
            // .then((response) => {
            //     })
            //     .catch(e => {
            //         console.log('Failed to fetch :' + e);
            //     });
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetVendorForm = () => {
        this.setState({
            formData: {
                Title: '', Plant: '', Company: '',
                Database: '',
                PlantCode: '', IsActive: true, Vendor_x0020_Number: null
            }, SaveUpdateText: 'Submit', addNewvendor: false
        });
        //this.props.history.push('/vendor');
        () => this.props.history.push('/vendor');
    }
    private cancelHandler = () => {
        this.resetVendorForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetVendorForm();
    }
    private addNewVendorMaster = () => {
        var formdata = { ...this.state.formData };
        formdata.Company = this.Company;
        this.setState({ addNewvendor: true, showLabel: false, formData: formdata });
    }

    public fetchImportedExcelData = (data) => {
        console.log(data);
        if (data.length > 0) {
            this.setState({ ImportedExcelData: data });
        }
    }

    public submitImportedExcelData = () => {
        var nonDuplicateRec = [];
        var statusChangedRec = [];
        const formdata = { ...this.state };
        var VendorsData = formdata.vendors;
        var excelData = formdata.ImportedExcelData;

        if (excelData.length) {   //To remove duplicate records from Excel data
            let jsonObject = excelData.map(JSON.stringify);
            let uniqueSet: any = new Set(jsonObject);
            excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
        }
        try {
            for (var i = excelData.length - 1; i >= 0; i--) {
                for (var j = 0; j < VendorsData.length; j++) {
                   // VendorsData[j].Title= VendorsData[j].Title!=null?VendorsData[j].Title:"";
                    VendorsData[j].Database=VendorsData[j].Database!=null?VendorsData[j].Database:"";
                    if (excelData[i] && (excelData[i]["Vendor Number"].toLowerCase().trim() == VendorsData[j].Vendor_x0020_Number.toLowerCase().trim()) &&(excelData[i]["Vendor Name"].toLowerCase().trim() == VendorsData[j].Title.toLowerCase().trim()) && (excelData[i]["Database"].toLowerCase().trim() == VendorsData[j].Database.toLowerCase().trim())) {
                        if (excelData[i].Status == VendorsData[j].IsActive ) {
                            excelData.splice(i, 1);
                        } else if (VendorsData[j].IsActive  != excelData[i].Status) {
                            VendorsData[j].IsActive = excelData[i].Status == "Active" ? true : false;
                            VendorsData[j].Database = VendorsData[j].Database.trim();
                            VendorsData[j].Title = VendorsData[j].Title.trim();
                            VendorsData[j].Vendor_x0020_Number = VendorsData[j].Vendor_x0020_Number.trim();
                            statusChangedRec.push(VendorsData[j]);
                            excelData.splice(i, 1);
                        }
                    }
                }
            }
            if (excelData.length) {
                excelData.forEach(item => {
                    var obj = {};
                    obj["Title"] = item["Vendor Name"].trim();
                    obj["Vendor_x0020_Number"] = item["Vendor Number"].trim();
                    obj["Plant"] = item.Plant;
                    obj["PlantCode"] = item["Plant Code"];
                    obj["Database"] = item.Database.trim();
                    obj["Company"] = item.Company;
                    obj["IsActive"] = item.Status == "Active" ? true : false;

                    nonDuplicateRec.push(obj);
                });
            } else if (!excelData.length && !statusChangedRec.length) {
                this.resetImportField();
                this.setState({
                    loading: false,
                    modalTitle: 'Alert',
                    modalText: 'No new records found',
                    showHideModal: true,
                    isSuccess: false
                });
            }
            if (statusChangedRec.length) {
                this.updateImportExceldata(nonDuplicateRec, statusChangedRec);
            }
            if (nonDuplicateRec.length) {
                this.insertImportedExcelData(nonDuplicateRec);
            }
        }
        catch (e) {
            console.log(e);
            this.setState({
                loading: false,
                modalTitle: 'Error',
                modalText: 'Sorry! something went wrong',
                showHideModal: true,
                isSuccess: false
            });
        }
    }

    public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
        statusChangedData.forEach(element => {
            sp.web.lists.getByTitle('vendor').items.getById(element.Id).update(element).then((res) => {

            }).then((res) => {
                if (!nonDuplicateRec.length) {
                    //this.loadListData();  //
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Vendors updated successfully',
                        showHideModal: true,
                        isSuccess: true
                    });
                    this.resetImportField();
                    console.log(res);
                }
            }).catch((err) => {
                console.log('Failed to add', err);
            });
        });
        this.loadListData(); //
    }

    public insertImportedExcelData = async (data) => {
        let failedrecords: any = [];
        try {
            this.setState({ loading: true });
            let list = await sp.web.lists.getByTitle("Vendor");
            const entityTypeFullName = await list.getListItemEntityTypeFullName();

            if (data && data != undefined) {
                let splitSize = data.length <= 1000 ? 1 : Math.floor(data.length / 1000) + 1;
                const chunk = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);
                var chunkData = chunk(data, 1000);
                //var chunkData = data.splice(0,data.length && data.length <= 1000);
              
                    chunkData.forEach((element, index) => { //1000
                        let batch = sp.web.createBatch();

                        element.forEach(item => {
                            list.items.inBatch(batch).add({ ...item }, entityTypeFullName);
                        });
                        batch.execute()
                            .then(response => {
                                if (response != undefined) {
                                    console.log('Failed to add');
                                }
                                if (index == splitSize - 1) {
                                    this.loadListData();
                                    this.setState({
                                        modalTitle: 'Success',
                                        modalText: 'Vendors uploaded successfully',
                                        showHideModal: true,
                                        isSuccess: true,
                                    });
                                    this.resetImportField();
                                }
                            })
                            .catch((err) => {
                                console.log('Failed to add');
                                console.log(err);
                                failedrecords.push(err);
                            });
                    });
               

            }
        }
        catch (e) {
            console.log(e);
            this.setState({
                loading: false,
                modalTitle: 'Alert',
                modalText: 'Error occured',
                showHideModal: true,
                isSuccess: false
            });
        }
    }

    public resetImportField = () => {
        // var fileEle = document.getElementById("inputFile");
        (document.getElementById("inputFile") as HTMLInputElement).value = '';
    }

    public ErrorFileSelect = () => {
        this.resetImportField();
        this.setState({
            loading: false,
            modalTitle: 'Alert',
            modalText: 'Invalid Vendors file selected',
            showHideModal: true,
            isSuccess: false
        });
    }
    public render() {
        let ExportExcelreportColumns = [
            {
                name: "Edit",
                selector: "Id",
            },
            // {
            //     name: "Company",
            //     selector: "Company",
            //     sortable: true,
            //     header: 'Company',
            //     dataKey: 'Company'
            // },
            // {
            //     name: "Plant",
            //     selector: "Plant",
            //     sortable: true,
            //     header: 'Plant',
            //     dataKey: 'Plant',
            // },
            // {
            //     name: "Plant Code",
            //     selector: "PlantCode",
            //     sortable: true,
            //     header: 'PlantCode',
            //     dataKey: 'PlantCode'
            // },

            {
                name: "Vendor Name",
                selector: "Title",
            },
            {
                name: "Vendor Number",
                selector: "Vendor_x0020_Number",
            },
            {
                name: "Database",
                selector: "Database",
                sortable: true,
                header: 'Database',
                dataKey: 'Database'
            },
            {
                name: "Status",
                selector: "IsActive",
            }

        ];
        const columns = [
            {
                name: "Edit",
                //selector: "Id",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/vendor/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id',


            },
            // {
            //     name: "Company",
            //     selector: "Company",
            //     sortable: true,
            //     header: 'Company',
            //     dataKey: 'Company'
            // },
            // {
            //     name: "Plant",
            //     selector: "Plant",
            //     sortable: true,
            //     header: 'Plant',
            //     dataKey: 'Plant',
            // },
            // {
            //     name: "Plant Code",
            //     selector: "PlantCode",
            //     sortable: true,
            //     header: 'PlantCode',
            //     dataKey: 'PlantCode'
            // },

            {
                name: "Vendor Name",
                //selector: "Title",
                selector: (row, i) => row.Title,
                sortable: true,
                header: 'Title',
                dataKey: 'Title'
            },
            {
                name: "Vendor Number",
                //selector: "Vendor_x0020_Number",                
                selector: (row, i) => row.Vendor_x0020_Number,
                sortable: true,
                header: 'Vendor Number',
                dataKey: 'Vendor_x0020_Number'
            },
            {
                name: "Database",
                //selector: "Database",
                selector: (row, i) => row.Database,
                sortable: true,
                header: 'Database',
                dataKey: 'Database'
            },
            {
                name: "Status",
                //selector: "IsActive",
                selector: (row, i) => row.IsActive,
                sortable: true,
                // cell: record =>{
                //     return (
                //         <div style={{ backgroundColor:  record.IsActive == 'true' ?  'white' : 'red' }}>
                //         <span>{record.IsActive}</span>
                //         </div>
                //     );
                // },
                header: 'IsActive',
                dataKey: 'IsActive'
            }
        ];

        return (

            <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className='title'>Vendors
                                {this.state.addNewvendor &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}


                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewvendor ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Vendor Name", "Vendor Number", "Status", "Database"]} filename="Vendors" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewVendorMaster}>Add</button>
                                        </div>
                                    </div>
                                    <div className="c-v-table">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewvendor ? '' : 'activediv'}>
                                                <div className="my-2">

                                                    {/* 
                                                    <div className="row pt-2 px-2">
                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Company <span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="Company" title="Company" value={this.state.formData.Company} ref={this.inputCompany} disabled>
                                                                    <option value=''>None</option>
                                                                    {this.state.Companys.map((option) => (
                                                                        <option value={option} selected={this.state.formData.Company != ''}>{option}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.changeplant} ref={this.inputPlant}>
                                                                    <option value=''>None</option>
                                                                    {this.state.Plants.map((option) => (
                                                                        // <option value={option.Plant_x0020_Code} selected={this.state.formData.Plant != ''}>{option.Plant_x0020_Code ? option.Title + " - " + option.Plant_x0020_Code : option.Title + " - "}</option>
                                                                        <option value={option.Title} data-plantcode={option.Plant_x0020_Code} data-database={option.Database} selected={this.state.formData.Plant == option.Title}>
                                                                            {option.Plant_x0020_Code ? option.Title + " - " + option.Plant_x0020_Code : option.Title + " - "}
                                                                        </option>
                                                                    ))}
                                                                </select>


                                                            </div>
                                                        </div>

                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Database </label>
                                                                <input className="form-control" required={true} placeholder="" name="Database" title="Database" value={this.state.formData.Database || ''} autoComplete="off" disabled={true} ref={this.database} />
                                                            </div>
                                                        </div>
                                                    </div> */}

                                                    <div className="row pt-2 px-2">
                                                        <InputText
                                                            type='text'
                                                            label={"Vendor Name"}
                                                            name={"Title"}
                                                            value={this.state.formData.Title || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.vendorName}
                                                            maxlength={250}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        <InputText
                                                            type='text'
                                                            label={"Vendor Number"}
                                                            name={"Vendor_x0020_Number"}
                                                            value={this.state.formData.Vendor_x0020_Number || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.vendorNumber}
                                                            maxlength={50}
                                                            onBlur={this.handleonBlur}
                                                        />
                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Database <span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="Database" title="Database" value={this.state.formData.Database} onChange={this.handleChange} ref={this.database}>
                                                                    <option value=''>None</option>
                                                                    {this.state.Plants.map((option) => (
                                                                        <option value={option.Database} selected={this.state.formData.Database != ''}>{option.Database}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <InputCheckBox
                                                            label={"Status"}
                                                            name={"IsActive"}
                                                            checked={this.state.formData.IsActive}
                                                            onChange={this.handleChange}
                                                        />
                                                    </div>
                                                </div>

                                                {this.state.showLabel &&
                                                    <div>
                                                        <span className='text-validator'> {this.state.errorMessage}</span>
                                                    </div>
                                                }
                                                <div className="row mx-1" id="">
                                                    <div className="col-sm-12 text-center my-2" id="">
                                                        <button type="button" onClick={this.handleSubmit} id="btnSubmit" className="SubmitButtons btn">{this.state.SaveUpdateText}</button>
                                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.cancelHandler}>Cancel</button>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div className="c-v-table table-head-1st-td">
                                        <TableGenerator columns={columns} data={this.state.vendors} fileName={'Vendors'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ></TableGenerator>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
        // }
    }
}

export default Vendor;