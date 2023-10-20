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
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "../Shared/Menuhandler";
import { Web } from '@pnp/sp/webs';
import { Item } from '@pnp/sp/items';	

export interface PlantProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface PlantState {
    formData: {
        Title: string,
        Status: boolean,
        Plant_x0020_Code: number,
        Database : string
    };
    SaveUpdateText: string;
    Plants: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewPlant: boolean;
    ImportedExcelData: any;
}

class Plant extends Component<PlantProps, PlantState> {
    private siteURL: string;
    private PlantName;
    private PlantCode;
    private Database;
    private oweb;
    private Status;
    constructor(props: PlantProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        this.PlantName = React.createRef();
        this.PlantCode = React.createRef();
        this.Database = React.createRef();
        this.Status = React.createRef();
        this.state = {
            formData: {
                Title: '',
                Status: true,
                Plant_x0020_Code: null,
                Database : ''
            },
            SaveUpdateText: 'Submit',
            Plants: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewPlant: false,
            ImportedExcelData: [],
        };
    }

    public componentDidMount() {
        highlightCurrentNav("Plants");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({ formData: { Title: '',Database: '', 
            Status: true,	
            Plant_x0020_Code: null }, SaveUpdateText: 'Submit', addNewPlant: false });
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
            PlantName: { val: this.state.formData.Title, required: true, Name: 'Plant Name', Type: ControlType.string, Focusid: this.PlantName },
            PlantCode: { val: this.state.formData.Plant_x0020_Code, required: true, Name: 'Plant Code', Type: ControlType.string, Focusid: this.PlantCode },
            Database: { val: this.state.formData.Database, required: true, Name: 'Database', Type: ControlType.string, Focusid: this.Database }
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
        let PlantsList = 'Plant';
        var filterString;
        try {
            if (id == 0)
                filterString = `(Plant_x0020_Code eq '${formData.Plant_x0020_Code}' or Title eq '${formData.Title}')`;
            else
                filterString = `(Plant_x0020_Code eq '${formData.Plant_x0020_Code}' or Title eq '${formData.Title}') and Id ne ` + id;
                this.oweb.lists.getByTitle(PlantsList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);
                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            this.oweb.lists.getByTitle('Plant').items.getById(id).update(formData).then((res) => {
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Plant updated successfully',
                                    showHideModal: true,
                                    isSuccess: true
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                this.oweb.lists.getByTitle('Plant').items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.loadListData();
                                        this.resetPlantForm();
                                        this.setState({
                                            modalTitle: 'Success',
                                            modalText: 'Plant submitted successfully',
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

    private loadListData = () => {
        this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Id", false).get()
            .then((response) => {
                this.setState({
                    Plants: response.map(o => ({ Id: o.Id, Plant: o.Title,
                        Status: o.Status == true ? 'Active' : 'In-Active',
                        Plant_x0020_Code: o.Plant_x0020_Code,
                        Database : o.Database
                    })),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
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
            this.oweb.lists.getByTitle('Plant').items.getById(id).get()
                .then((response) => {
                    this.setState({
                        formData: { Title: response.Title,Database: response.Database, 
                             Status: response.Status,
                             Plant_x0020_Code: response.Plant_x0020_Code != null ? response.Plant_x0020_Code.trim():'' },
                        SaveUpdateText: 'Update',
                        showLabel: false,
                        addNewPlant: true
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
    private resetPlantForm = () => {
        this.setState({ formData: { Title: '',Database: '',
         Status: true, 
         Plant_x0020_Code: null }, SaveUpdateText: 'Submit', addNewPlant: false, showLabel: false });
       // this.props.history.push('/Plants');
       ()=> this.props.history.push('/Plants');
    }
    private cancelHandler = () => {
        this.resetPlantForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetPlantForm();
    }
    private addNewPlantMaster = () => {
        this.setState({ addNewPlant: true });
    }

    public insertImportedExcelData = async (data) => {
        try {
            this.setState({ loading: true });
            let list = await this.oweb.lists.getByTitle("Plant");
            const entityTypeFullName = await list.getListItemEntityTypeFullName();
            let batch = sp.web.createBatch();

            data.forEach((obj) => {
                list.items.inBatch(batch).add({ ...obj }, entityTypeFullName);
            });

            await batch.execute()
                .then((res) => {
                    this.loadListData();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Plants uploaded successfully',
                        showHideModal: true,
                        isSuccess: true,
                    });
                    this.resetImportField();
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

    public resetImportField = () => {
        // var fileEle = document.getElementById("inputFile");
        (document.getElementById("inputFile") as HTMLInputElement).value = '';
    }

    public ErrorFileSelect = () => {
        this.resetImportField();
        this.setState({
            loading: false,
            modalTitle: 'Alert',
            modalText: 'Invalid Plants file selected',
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
            {
                name: "Plant Name",
                selector: "Plant",
            },
            {
                name: "Plant Code",
                selector: "Plant_x0020_Code",
            },
            {
                name: "Database",
                selector: "Database",
            },
            {
                name: "Status",
                selector: "Status",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/Plants/${record.Id}`}>
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
                name: "Plant Name",
                //selector: "Plant",
                selector: (row, i) => row.Plant,
                sortable: true,
                header: 'Plant',
                dataKey: 'Plant'
            },
            {
                name: "Plant Code",
                //selector: "Plant_x0020_Code",
                selector: (row, i) => row.Plant_x0020_Code,
                sortable: true,
                header: 'Plant Code',
                dataKey: 'Plant_x0020_Code'
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
                name: "Status",
                //selector: "Status",
                selector: (row, i) => row.Status,
                sortable: true,
                header: 'Status',
                dataKey: 'Status'
            }
        ];

        return (
            <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className='title'>Plants
                                {this.state.addNewPlant &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                            </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-9">

                                    <div className={this.state.addNewPlant ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2" id="">

                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewPlantMaster}>Add</button>
                                        </div>
                                    </div>
                                    <div className="light-box border-box-shadow m-2">
                                        <div className={this.state.addNewPlant ? '' : 'activediv'}>
                                            <div className="my-2">
                                                <div className="row pt-2 px-2">
                                                    <InputText
                                                        type='text'
                                                        label={"Plant Name"}
                                                        name={"Title"}
                                                        value={this.state.formData.Title || ''}
                                                        isRequired={true}
                                                        onChange={this.handleChange}
                                                        refElement={this.PlantName}
                                                        maxlength={250}
                                                        onBlur={this.handleonBlur}
                                                    />

                                                    <InputText
                                                        type='text'
                                                        label={"Plant Code"}
                                                        name={"Plant_x0020_Code"}
                                                        value={this.state.formData.Plant_x0020_Code || ''}
                                                        isRequired={true}
                                                        onChange={this.handleChange}
                                                        refElement={this.PlantCode}
                                                        maxlength={50}
                                                        onBlur={this.handleonBlur}
                                                    />

                                                    <InputText
                                                        type='text'
                                                        label={"Database"}
                                                        name={"Database"}
                                                        value={this.state.formData.Database || ''}
                                                        isRequired={true}
                                                        onChange={this.handleChange}
                                                        refElement={this.Database}
                                                        maxlength={50}
                                                        onBlur={this.handleonBlur}
                                                    />

                                                    <InputCheckBox
                                                        label={"Status"}
                                                        name={"Status"}
                                                        checked={this.state.formData.Status}
                                                        onChange={this.handleChange}
                                                        isforMasters={true}
                                                        isdisable={false}
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
                                    <div className="light-box border-box-shadow m-2">
                                        <div className="">
                                            <div className="table-head-1st-td">
                                                <TableGenerator columns={columns} data={this.state.Plants} fileName={'Plants'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
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

export default Plant;