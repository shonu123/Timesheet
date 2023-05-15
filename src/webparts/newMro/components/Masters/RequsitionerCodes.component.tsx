import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import TableGenerator from '../Shared/TableGenerator';
import { ControlType } from '../../Constants/Constants';
import Formvalidator from '../../Utilities/Formvalidator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';
import InputText from '../Shared/InputText';
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "../Shared/Menuhandler";
import ImportExcel from '../Shared/ImportExcel';
import { Web } from '@pnp/sp/webs';

export interface RequsitionerCodesProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface RequsitionerCodesState {
    formData: {
        Plant: '',
        Requsitioner_x0020_Code: string,
        Requsitioner_x0020_Desc: number,
        Database: string,
        IsActive: boolean,
        PlantCode: string
    };
    SaveUpdateText: string;
    RequsitionerCodes: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewRequisitionerCode: boolean;
    ImportedExcelData: any;
    Plants: any;
}

class RequsitionerCodes extends Component<RequsitionerCodesProps, RequsitionerCodesState> {
    private siteURL: string;
    private RequisitionCode;
    private database;
    private RequisitionDesc;
    private oweb;
    private inputPlant;

    constructor(props: RequsitionerCodesProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.siteURL = this.props.spContext.webAbsoluteUrl;

        if (this.siteURL.includes('mayco')) {
            this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        } else {
            this.oweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
        }

        this.RequisitionCode = React.createRef();
        this.RequisitionDesc = React.createRef();
        this.database = React.createRef();
        this.inputPlant = React.createRef();
        this.state = {
            formData: {
                Plant: '',
                Requsitioner_x0020_Code: '',
                Requsitioner_x0020_Desc: null,
                Database: '',
                IsActive: true,
                PlantCode: ''
            },
            SaveUpdateText: 'Submit',
            RequsitionerCodes: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewRequisitionerCode: false,
            ImportedExcelData: [],
            Plants: []
        };
    }
    public componentDidMount() {
        highlightCurrentNav("RequsitionerCodes");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    Requsitioner_x0020_Code: '', Plant: '', PlantCode: '', IsActive: true,
                    Database: '',
                    Requsitioner_x0020_Desc: null
                }, SaveUpdateText: 'Submit', addNewRequisitionerCode: false
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value;
        this.setState({ formData });
    }

    private changeplant = (event) => {
        const formData = { ...this.state.formData };
        let name = event.target.name;
        formData[name] = event.target.value != 'None' ? event.target.value : null;

        // let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
        let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');

        // formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
        formData['PlantCode'] = customAttrPlantCode != 'None' ? customAttrPlantCode : null;
        this.setState({ formData });
    }

    private handleonBlur = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        formData[name] = value;
        this.setState({ formData });
    }

    private handleSubmit = (event) => {
        event.preventDefault();
        // this.setState({ loading: true });
        let data = {           
            RCode: { val: this.state.formData.Requsitioner_x0020_Code, required: true, Name: 'Requisitioner Code', Type: ControlType.string, Focusid: this.RequisitionCode },
            Database: { val: this.state.formData.Database, required: true, Name: 'Database', Type: ControlType.string, Focusid: this.database },
            RDesc: { val: this.state.formData.Requsitioner_x0020_Desc, required: true, Name: 'Requisitioner Desc', Type: ControlType.string, Focusid: this.RequisitionDesc }
        };
        const formData = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.checkDuplicates(formData, id);
        } else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }
    private checkDuplicates = (formData, id) => {
        var filterString;
        try {
            if (id == 0)
            filterString = `(Requsitioner_x0020_Code eq '${formData.Requsitioner_x0020_Code}') and Database eq '${formData.Database}'  and IsActive eq '${formData.IsActive ? 1 : 0}'`;
        else
            filterString = `(Requsitioner_x0020_Code eq '${formData.Requsitioner_x0020_Code}') and Database eq '${formData.Database}' and IsActive ne '${formData.IsActive}' and Id ne ` + id;
        sp.web.lists.getByTitle('RequsitionerCodes').items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);
                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle('RequsitionerCodes').items.getById(id).update(formData).then((res) => {
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Requisitioner Codes updated successfully',
                                    showHideModal: true,
                                    isSuccess: true
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle('RequsitionerCodes').items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.loadListData();
                                        this.resetBuyerForm();
                                        this.setState({
                                            modalTitle: 'Success',
                                            modalText: 'Requisitioner Codes submitted successfully',
                                            showHideModal: true,
                                            isSuccess: true
                                        });
                                    })
                                    .catch((err) => {
                                        console.log('Failed to add');
                                    });
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
        var PlantsList: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        var uniquePlantsList = []; let flags = {};
         PlantsList.filter(item => { if(item.Database != null){if(flags[item.Database] ==true) return false; 
            else {flags[item.Database] = true; uniquePlantsList.push(item); return true;} }
         });

        sp.web.lists.getByTitle('RequsitionerCodes').items.select('*').orderBy("Id", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                this.setState({
                    RequsitionerCodes: response.map(o => ({ Id: o.Id, Plant: o.Plant,PlantCode:o.PlantCode, Database: o.Database, Requsitioner_x0020_Code: o.Requsitioner_x0020_Code, Requsitioner_x0020_Desc: o.Requsitioner_x0020_Desc, IsActive: o.IsActive == true ? 'Active' : 'In-Active' })),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    Plants: uniquePlantsList
                });
            }).catch(err => {
                console.log('Failed to fetch data.');
                this.setState({
                    loading: false,
                    modalTitle: 'Alert',
                    modalText: 'Error occured',
                    showHideModal: true,
                    isSuccess: false
                });
            });
    }
    private onEditClickHandler = (id) => {
        console.log('edit clicked', id);
        try {
            sp.web.lists.getByTitle('RequsitionerCodes').items.getById(id).get()
                .then((response) => {
                    this.setState({
                        formData: { Requsitioner_x0020_Code: response.Requsitioner_x0020_Code, Plant: response.Plant, PlantCode: response.PlantCode,
                              Database: response.Database,
                              Requsitioner_x0020_Desc: response.Requsitioner_x0020_Desc, IsActive: response.IsActive },
                        SaveUpdateText: 'Update',
                        showLabel: false,
                        addNewRequisitionerCode: true
                    });
                })
                .catch(e => {
                    console.log('Failed to fetch :' + e);
                });
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetBuyerForm = () => {
        this.setState({ formData: { Requsitioner_x0020_Code: '', PlantCode: '', Plant: '',Database: '',
        Requsitioner_x0020_Desc: null, IsActive: true, }, SaveUpdateText: 'Submit', addNewRequisitionerCode: false, showLabel: false });
        // this.props.history.push('/RequsitionerCodes');
        () => this.props.history.push('/RequsitionerCodes');
    }
    private cancelHandler = () => {
        this.resetBuyerForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetBuyerForm();
    }
    private addNewBuyerMaster = () => {
        this.setState({ addNewRequisitionerCode: true });
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
        var RequsitionerData = formdata.RequsitionerCodes;
        var excelData = formdata.ImportedExcelData;
        if (excelData.length) {   //To remove duplicate records from Excel data
            let jsonObject = excelData.map(JSON.stringify);
            let uniqueSet: any = new Set(jsonObject);
            excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
        }

        for (var i = excelData.length - 1; i >= 0; i--) {
            for (var j = 0; j < RequsitionerData.length; j++) {
                console.log(i,j);
                let Requsitioner= RequsitionerData[j].Database!= null ?RequsitionerData[j].Database.toLowerCase():"";
                if (excelData[i] && (excelData[i]["Requisitioner Code"].toLowerCase() === RequsitionerData[j].Requsitioner_x0020_Code.toLowerCase() && excelData[i]["Database"].toLowerCase() === Requsitioner)) {
                    if (excelData[i].Status == RequsitionerData[j].IsActive) {
                        excelData.splice(i, 1);
                    } else if (RequsitionerData[j].IsActive != excelData[i].Status) {
                        RequsitionerData[j].IsActive = excelData[i].Status == "Active" ? true : false;
                        statusChangedRec.push(RequsitionerData[j]);
                        excelData.splice(i, 1);
                    }
                }
            }
        }
        if (excelData.length) {
            excelData.forEach(item => {
                var obj = {};
                obj["Requsitioner_x0020_Code"] = item["Requisitioner Code"];
                obj["Requsitioner_x0020_Desc"] = item["Requisitioner Desc"];
                obj["Database"] = item["Database"];
                obj["Plant"] = item["Plant"];
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
        if (nonDuplicateRec.length) {
            this.insertImportedExcelData(nonDuplicateRec);
        }
        if (statusChangedRec.length) {
            this.updateImportExceldata(nonDuplicateRec, statusChangedRec);
        }
    }
    public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
        statusChangedData.forEach(element => {
            sp.web.lists.getByTitle('RequsitionerCodes').items.getById(element.Id).update(element).then((res) => {

            }).then((res) => {
                if (!nonDuplicateRec.length) {
                    this.loadListData();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Requisitioner updated successfully',
                        showHideModal: true,
                        isSuccess: true
                    });
                    this.resetImportField();
                    console.log(res);
                }
            }).catch((err) => {
                console.log('Failed to add');
            });
        });
    }

    public insertImportedExcelData = async (data) => {
        try {
            this.setState({ loading: true });
            let list = await sp.web.lists.getByTitle("RequsitionerCodes");
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
                                    modalText: 'Requisitioner Codes uploaded successfully',
                                    showHideModal: true,
                                    isSuccess: true,
                                });
                                this.resetImportField();
                            }
                        })
                        .catch((err) => {
                            console.log('Failed to add');
                            console.log(err);
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
            modalText: 'Invalid Requisitioner Codes file selected',
            showHideModal: true,
            isSuccess: false
        });
    }

    public render() {
        const ExportExcelreportColumns = [
            {
                name: "Edit",
                selector: "Id",
            },
            // {
            //     name: "Plant",
            //     selector: "Plant",
            //     sortable: true,
            //     header: 'Plant',
            //     dataKey: 'Plant'
            // },
            // {
            //     name: "Plant Code",
            //     selector: "PlantCode",
            //     sortable: true,
            //     header: 'PlantCode',
            //     dataKey: 'PlantCode'
            // },
            {
                name: "Requisitioner Code",
                selector: "Requsitioner_x0020_Code",
            },
            // {
            //     name: "Database",
            //     selector: "Database",
            //     sortable: true,
            //     header: 'Database',
            //     dataKey: 'Database'
            // },
            {
                name: "Requisitioner Desc",
                selector: "Requsitioner_x0020_Desc",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/RequsitionerCodes/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id'
            },
            // {
            //     name: "Plant",
            //     selector: "Plant",
            //     sortable: true,
            //     header: 'Plant',
            //     dataKey: 'Plant'
            // },
            // {
            //     name: "Plant Code",
            //     selector: "PlantCode",
            //     sortable: true,
            //     header: 'PlantCode',
            //     dataKey: 'PlantCode'
            // },
            {
                name: "Requisitioner Code",
                //selector: "Requsitioner_x0020_Code",
                selector: (row, i) => row.Requsitioner_x0020_Code,
                sortable: true,
                header: 'Requsitioner_x0020_Code',
                dataKey: 'Requsitioner_x0020_Code'
            },
            {
                name: "Database",
                // selector: "Database",
                selector: (row, i) => row.Database,
                sortable: true,
                header: 'Database',
                dataKey: 'Database'
            },
            {
                name: "Requisitioner Desc",
                //selector: "Requsitioner_x0020_Desc",
                selector: (row, i) => row.Requsitioner_x0020_Desc,
                sortable: true,
                header: 'Requsitioner Desc',
                dataKey: 'Requsitioner_x0020_Desc'
            },
            {
                name: "Status",
                // selector: "IsActive",
                selector: (row, i) => row.IsActive,
                sortable: true,
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
                            <div className='title'>Requisitioner Codes
                                {this.state.addNewRequisitionerCode &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewRequisitionerCode ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2" id="">
                                        <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Requisitioner Code",'Database',"Requisitioner Desc", "Status"]} filename="Requisitioner Codes" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>
                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewBuyerMaster}>Add</button>

                                        </div>
                                    </div>
                                    <div className="c-v-table">
                                        <div className="light-box border-box-shadow m-2">
                                            <div className={this.state.addNewRequisitionerCode ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                        {/* <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.changeplant} ref={this.inputPlant}>
                                                                    <option value=''>None</option>
                                                                    {this.state.Plants.map((option) => (
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
                                                        </div> */}

                                                        <InputText
                                                            type='text'
                                                            label={"Requisitioner Code"}
                                                            name={"Requsitioner_x0020_Code"}
                                                            value={this.state.formData.Requsitioner_x0020_Code || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.RequisitionCode}
                                                            maxlength={250}
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
                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Requisitioner Desc<span className="mandatoryhastrick">*</span></label>
                                                                <textarea rows={2} className="form-control" ref={this.RequisitionDesc} maxLength={1000} placeholder="" name="Requsitioner_x0020_Desc" title="Requisitioner Desc" value={this.state.formData.Requsitioner_x0020_Desc || ''} autoComplete="false" onChange={this.handleChange}></textarea>
                                                            </div>
                                                        </div>
                                                        <InputCheckBox
                                                            label={"Status"}
                                                            name={"IsActive"}
                                                            checked={this.state.formData.IsActive}
                                                            onChange={this.handleChange}
                                                        />

                                                       
                                                    </div>

                                                    {/* <div className="row pt-2 px-2">
                                                        <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Requsitioner Desc<span className="mandatoryhastrick">*</span></label>
                                                                <textarea rows={2} className="form-control" ref={this.RequisitionDesc} maxLength={1000} placeholder="" name="Requsitioner_x0020_Desc" title="Requsitioner Desc" value={this.state.formData.Requsitioner_x0020_Desc || ''} autoComplete="false" onChange={this.handleChange}></textarea>
                                                            </div>
                                                        </div>

                                                        <InputCheckBox
                                                            label={"Status"}
                                                            name={"IsActive"}
                                                            checked={this.state.formData.IsActive}
                                                            onChange={this.handleChange}
                                                        />
                                                    </div> */}
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
                                        <TableGenerator columns={columns} data={this.state.RequsitionerCodes} fileName={'Requisitioner Codes'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
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

export default RequsitionerCodes;