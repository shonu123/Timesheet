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

export interface ToolsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface ToolsState { // need to Toll list Columns
    formData: { // add columns which used for CRUD operations
        Tool_x0020_Number: string,
        Tool_x0020_Description: string,
        Sequence_x0020_Number: string,
        Sequence_x0020_Description: string,
        Database: string,
        IsActive: true,
    };// add remaining columns if needed
    SaveUpdateText: string;
    Tools: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewTool: boolean;
    ImportedExcelData: any;
    Plants: any;
}

class Tools extends Component<ToolsProps, ToolsState> {
    private siteURL: string;// need to add respective variables
    private ToolDescription;
    private ToolNumber;
    private database;
    private  SequenceNumber;
    private  SequenceDescription;
    private inputPlant;
    private oweb;
    constructor(props: ToolsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.ToolDescription = React.createRef();
        this.ToolNumber = React.createRef();
        this.inputPlant = React.createRef();
        this.SequenceNumber = React.createRef();
        this.SequenceDescription = React.createRef();
        this.database = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.state = {
            formData: {
                Tool_x0020_Number: '',
                Tool_x0020_Description: '',
                Sequence_x0020_Number: '',
                Sequence_x0020_Description: '',
                Database: '',
                IsActive: true
            },
            SaveUpdateText: 'Submit',
            Tools: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewTool: false,
            ImportedExcelData: [],
            Plants: []
        };

        if (this.siteURL.includes('mayco')) {
            this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        } else {
            this.oweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
        }
    }

    public componentDidMount() {
        highlightCurrentNav("Tools");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    Tool_x0020_Number: '', Tool_x0020_Description: '', Sequence_x0020_Description: '',
                    Sequence_x0020_Number: '',Database: '',IsActive: true
                }, SaveUpdateText: 'Submit', addNewTool: false
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value;
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
            Database: { val: this.state.formData.Database, required: false, Name: 'Database', Type: ControlType.string, Focusid: this.database },
            ToolDescription: { val: this.state.formData.Tool_x0020_Description, required: true, Name: 'Tool Description', Type: ControlType.string, Focusid: this.ToolDescription },
            ToolNumber: { val: this.state.formData.Tool_x0020_Number, required: true, Name: 'Tool Number', Type: ControlType.string, Focusid: this.ToolNumber },
            SequenceNumber: { val: this.state.formData. Sequence_x0020_Number, required: true, Name: 'Sequence Number', Type: ControlType.string, Focusid: this.SequenceNumber },
            SequenceDescription: { val: this.state.formData. Sequence_x0020_Description, required: true, Name: 'Sequence Description', Type: ControlType.string, Focusid: this.SequenceDescription }
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
        let ToolsList = 'Tools';
        var filterString;
        try {
            if (id == 0)
                filterString = `(Tool_x0020_Number eq '${formData.Tool_x0020_Number}') and IsActive eq '${formData.IsActive ? 1 : 0}'`;
            else
                filterString = `(Tool_x0020_Number eq '${formData.Tool_x0020_Number}') and IsActive ne '${formData.IsActive}' and Id ne ` + id;
            sp.web.lists.getByTitle(ToolsList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);
                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle('Tools').items.getById(id).update(formData).then((res) => {
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Tools updated successfully',
                                    showHideModal: true,
                                    isSuccess: true
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle('Tools').items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.loadListData();
                                        this.resetToolForm();
                                        this.setState({
                                            modalTitle: 'Success',
                                            modalText: 'Tools submitted successfully',
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
        PlantsList.filter(item => {
            if (item.Database != null) {
                if (flags[item.Database] == true) return false;
                else { flags[item.Database] = true; uniquePlantsList.push(item); return true; }
            }
        });


        sp.web.lists.getByTitle('Tools').items.select("Title,*").orderBy("Id", false).getAll()
            .then((response) => {
                this.setState({
                    Tools: response.map(o => ({ Id: o.Id, Database: o.Database,IsActive: o.IsActive == true ? 'Active' : 'In-Active', Tool_x0020_Number: o.Tool_x0020_Number,Tool_x0020_Description: o.Tool_x0020_Description,Sequence_x0020_Number: o.Sequence_x0020_Number,Sequence_x0020_Description: o.Sequence_x0020_Description })),
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
            sp.web.lists.getByTitle('Tools').items.getById(id).get()
                .then((response) => {
                    this.setState({
                        formData: {
                            Database: response.Database,
                            IsActive: response.IsActive, Tool_x0020_Number: response.Tool_x0020_Number.trim(),
                            Tool_x0020_Description: response.Tool_x0020_Description,Sequence_x0020_Number: response.Sequence_x0020_Number,
                            Sequence_x0020_Description: response.Sequence_x0020_Description,
                        },
                        SaveUpdateText: 'Update',
                        showLabel: false,
                        addNewTool: true
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
    private resetToolForm = () => {
        this.setState({
            formData: {
                Tool_x0020_Number: '', Tool_x0020_Description: '',
                Database: '',Sequence_x0020_Number: '',Sequence_x0020_Description: '',
                IsActive: true,
            }, SaveUpdateText: 'Submit', addNewTool: false, showLabel: false
        });
        //  this.props.history.push('/Tools');
        () => this.props.history.push('/Tools');
    }
    private cancelHandler = () => {
        this.resetToolForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetToolForm();
    }
    private addNewToolMaster = () => {
        this.setState({ addNewTool: true });
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
        var ToolsData = formdata.Tools;
        var excelData = formdata.ImportedExcelData;
        if (excelData.length) {   //To remove duplicate records from Excel data
            let jsonObject = excelData.map(JSON.stringify);
            let uniqueSet: any = new Set(jsonObject);
            excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
        }

        for (var i = excelData.length - 1; i >= 0; i--) {
            for (var j = 0; j < ToolsData.length; j++) {
                ToolsData[j].Database=ToolsData[j].Database!=null?ToolsData[j].Database:"";
                if (excelData[i] && (excelData[i]["Tool Number"].toLowerCase().trim() == ToolsData[j].Tool_x0020_Number.toLowerCase().trim()) && (excelData[i]["Tool Description"].toLowerCase().trim() == ToolsData[j].Tool_x0020_Description.toLowerCase().trim())&& (excelData[i]["Database"].toLowerCase().trim() == ToolsData[j].Database.toLowerCase().trim())&& (excelData[i]["Sequence Number"].toLowerCase().trim() == ToolsData[j].Sequence_x0020_Number.toLowerCase().trim())&& (excelData[i]["Sequence Description"].toLowerCase().trim() == ToolsData[j].Sequence_x0020_Description.toLowerCase().trim())) {
                    if (ToolsData[j].IsActive == excelData[i].Status) {
                        excelData.splice(i, 1);
                    } else if (ToolsData[j].IsActive != excelData[i].Status) {
                        ToolsData[j].IsActive = excelData[i].Status == "Active" ? true : false;
                        statusChangedRec.push(ToolsData[j]);
                        excelData.splice(i, 1);
                    }
                }
            }
        }
        // console.log(statusChangedRec);
        if (excelData.length) {
            excelData.forEach(item => {
                var obj = {};
                obj["Tool_x0020_Description"] = item["Tool Description"].trim();
                obj["Tool_x0020_Number"] = item["Tool Number"].trim();
                obj["Sequence_x0020_Description"] = item["Sequence Description"].trim();
                obj["Sequence_x0020_Number"] = item["Sequence Number"].trim();
                obj["Database"] = item["Database"].trim();
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

    public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
        statusChangedData.forEach(element => {
            sp.web.lists.getByTitle('Tools').items.getById(element.Id).update(element).then((res) => {

            }).then((res) => {
                if (!nonDuplicateRec.length) {
                    this.loadListData();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Tools updated successfully',
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
            let list = await sp.web.lists.getByTitle("Tools");
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
                                    modalText: 'Tools uploaded successfully',
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
            modalText: 'Invalid Tools file selected',
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
                name: "Tool Description",
                selector: "Tool_x0020_Description",
            },
            {
                name: "Tool Number",
                selector: "Tool_x0020_Number",
            },
            {
                name: "Sequence Description",
                selector: "Sequence_x0020_Description",
            },
            {
                name: "Sequence Number",
                selector: "Sequence_x0020_Number",
            },
            {
                name: "Database",
                selector: "Database",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/Tools/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id'
            },
            
            {
                name: "Tool Description",
                //selector: "Title",
                selector: (row, i) => row.Tool_x0020_Description,
                sortable: true,
                header: 'Tool Description',
                dataKey: 'Tool_x0020_Description'
            },
            {
                name: "Tool Number",

                selector: (row, i) => row.Tool_x0020_Number,
                sortable: true,
                header: 'Tool Number',
                dataKey: 'Tool_x0020_Number'
            },
            {
                name: "Sequence Description",
                //selector: "Title",
                selector: (row, i) => row.Sequence_x0020_Description,
                sortable: true,
                header: 'Sequence Description',
                dataKey: 'Sequence_x0020_Description'
            },
            {
                name: "Sequence Number",

                selector: (row, i) => row.Sequence_x0020_Number,
                sortable: true,
                header: 'Sequence Number',
                dataKey: 'Sequence_x0020_Number'
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
                            <div className='title'>Tools
                                {this.state.addNewTool &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewTool? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2" id="">
                                            <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Tool_x0020_Description", "Tool_x0020_Number","Sequence_x0020_Description","Sequence_x0020_Number","Database","Status"]} filename="Tools" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewToolMaster}>Add</button>
                                        </div>
                                    </div>
                                    <div className="c-v-table table-head-1st-td">
                                        <div className="light-box border-box-shadow m-2">
                                            <div className={this.state.addNewTool ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">

                                                        {}

                                                        <InputText
                                                            type='text'
                                                            label={"Tool Description"}
                                                            name={"Tool_x0020_Description"}
                                                            value={this.state.formData.Tool_x0020_Description || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.ToolDescription}
                                                            maxlength={250}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        
                                                        <InputText
                                                            type='text'
                                                            label={"Sequence Description"}
                                                            name={"Sequence_x0020_Description"}
                                                            value={this.state.formData.Sequence_x0020_Description || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.SequenceDescription}
                                                            maxlength={250}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        {}
                                                        <InputText
                                                            type='text'
                                                            label={"Tool Number"}
                                                            name={"Tool_x0020_Number"}
                                                            value={this.state.formData.Tool_x0020_Number || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.ToolNumber}
                                                            maxlength={50}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        <InputText
                                                            type='text'
                                                            label={"Sequence Number"}
                                                            name={"Sequence_x0020_Number"}
                                                            value={this.state.formData.Sequence_x0020_Number || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.SequenceNumber}
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
                                                        <InputCheckBox
                                                            label={"Is Active"}
                                                            name={"IsActive"}
                                                            checked={this.state.formData.IsActive}
                                                            onChange={this.handleChange}
                                                            isforMasters={true}
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
                                        <TableGenerator columns={columns} data={this.state.Tools} fileName={'Tools'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
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

export default Tools;