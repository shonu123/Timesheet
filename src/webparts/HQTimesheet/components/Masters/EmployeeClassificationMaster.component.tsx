import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Navigate, redirect } from 'react-router-dom';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import InputText from '../Shared/InputText';
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';

interface EmployeeClassificationProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface EmployeeClassificationState {

}

class EmployeeClassification extends Component<EmployeeClassificationProps, EmployeeClassificationState> {
    private siteURL: string;
    private EmployeeClassification;
    constructor(props: EmployeeClassificationProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.EmployeeClassification = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {

        formData: {
            Title: '',
            PTO: false,
            IsActive: true,
        },
        EmpClassificationObj: [],
        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewEmpClassification: false,
        isNewform: true,
        isRedirect: false,
        isPageAccessable:true,
        ExportExcelData: [],
        showToaster: false,
    };

    public componentDidMount() {
        highlightCurrentNav("EmployeeClassificationMaster");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentDidUpdate = () => {
        if (this.state.isRedirect) {
            this.loadListData();
        }
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    Title: '',
                    PTO: false,
                    IsActive: true,
                },
                SaveUpdateText: 'Submit',
                addNewEmpClassification: false
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
    private _getPeoplePickerItems(items, name) {
        let values = { results: [] };
        let formData = { ...this.state.formData }
        if (items.length > 0) {
            let multiple = { results: [] }
            for (const user of items) {
                multiple.results.push(user.id)
            }
            values = multiple
        }
        formData['DelegateToId'] = values
        this.setState({ formData })
    }

    private handleSubmit = (event) => {
        event.preventDefault();
        this.setState({ loading: true });
        let data = {
            EmployeeClassification: { val: this.state.formData.Title, required: true, Name: 'Employee Classification', Type: ControlType.string, Focusid: this.EmployeeClassification },
        };
        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.checkDuplicates(formdata, id);
        }
        else {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    private checkDuplicates = (formData, id) => {
        let EmployeeClassificationList = 'EmployeeClassification';
        let filterString = ''

        try {
            if (id == 0)
                filterString = `Title eq '${formData.Title.replace(/'/g, "''")}' and IsActive eq '1'`;
            else
                filterString = `Title eq '${formData.Title.replace(/'/g, "''")}' and  IsActive eq '1' and Id ne ` + id;
            //filterString=encodeURIComponent(filterString);Not worked
            //filterString=filterString.replace(/'/g, "%27%27");Not worked
            sp.web.lists.getByTitle(EmployeeClassificationList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ loading: false });
                        customToaster('toster-error', ToasterTypes.Error, 'Duplicate record is not accepted', 4000)
                    }
                    else {
                        if (id > 0) {                       //update existing record
                            sp.web.lists.getByTitle(EmployeeClassificationList).items.getById(id).update(formData).then((res) => {
                                customToaster('toster-success', ToasterTypes.Success, 'Employee Classification updated successfully.', 2000)
                                this.resetEmpClassificationMasterForm();
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Employee Classification updated successfully',
                                    showHideModal: false,
                                    isSuccess: true,
                                    loading: false,
                                    isRedirect: false,
                                    addNewEmpClassification: false
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                sp.web.lists.getByTitle(EmployeeClassificationList).items.add(formData)
                                    .then((res) => {
                                        customToaster('toster-success', ToasterTypes.Success, 'Employee Classification added successfully', 2000)
                                        this.resetEmpClassificationMasterForm();
                                        this.setState({ showHideModal: false, addNewEmpClassification: false, loading: false, isRedirect: true });
                                        //  this.setState({
                                        //      modalTitle: 'Success',
                                        //      modalText: 'Client submitted successfully',
                                        //     showHideModal: false,
                                        //     isSuccess: true,
                                        //      isRedirect: false
                                        //  });
                                    })
                                    .catch((err) => {
                                        console.log('Failed to add');
                                        customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                                        this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewEmpClassification: false });
                                        // this.setState({
                                        //     loading: false,
                                        //     modalTitle: 'Error',
                                        //     modalText: 'Sorry! something went wrong',
                                        //     showHideModal: false,
                                        //     isSuccess: false,
                                        //     isRedirect: false
                                        // });
                                    });
                            }
                            catch (e) {
                                console.log(e);
                                this.setState({
                                    loading: false,
                                    modalTitle: 'Error',
                                    modalText: 'Sorry! something went wrong',
                                    showHideModal: true,
                                    isSuccess: false,
                                    isRedirect: false
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
        this.setState({ isRedirect: false })
        try{
            let [EmpClassificationData, groups] = await Promise.all([
                sp.web.lists.getByTitle('EmployeeClassification').items.select('*').orderBy("Title", false).getAll(),
                sp.web.currentUser.groups(),
            ])
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
                EmpClassificationData.sort((a, b) => b.Id - a.Id);
                let ExcelData = []
                let Data = [];
                for (const d of EmpClassificationData) {
                    ExcelData.push({
                        EmployeeClassification: d.Title,
                        PTO: d.PTO ? "Yes" : "No",
                        IsActive: d.IsActive ? "Active" : "In-Active",
                    })

                    Data.push({
                        Id: d.Id,
                        EmployeeClassification: d.Title,
                        PTO: d.PTO,
                        IsActive: d.IsActive ? "Active" : "In-Active",
                    })
                }
                let pageAccessable = false;
                if (userGroups.includes('Timesheet Administrators')) {
                    pageAccessable = true;
                }
                else {
                    pageAccessable = false;
                }
                this.setState({
                    EmpClassificationObj: Data,
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    ExportExcelData: ExcelData, showToaster: true,isPageAccessable:pageAccessable
                });
        }
        catch (e) {
            console.log('Failed to fetch data.', e);
            this.setState({
                loading: false,
                modalTitle: 'Error',
                modalText: 'Sorry! something went wrong',
                isSuccess: false
            });
        }
    }
    private async onEditClickHandler(id) {
        try {
            let filterQuery = "ID eq '" + id + "'"
            let selectQuery = "*"
            var data = await sp.web.lists.getByTitle('EmployeeClassification').items.filter(filterQuery).select(selectQuery).get();
            let response = data[0]
            let DelegateToIds = { results: [] }
            let DelegateToEmails = []
            this.setState({
                formData:
                {
                    Title: response.Title,
                    PTO: response.PTO,
                    IsActive: response.IsActive,
                },
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewEmpClassification: true,
                loading:false
            });
            setTimeout(()=>{document.getElementById("txtEmployeeClassification").scrollIntoView({ behavior: 'smooth', block: 'start' })},300);
            setTimeout(()=>{document.getElementById("txtEmployeeClassification").focus()},300);
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetEmpClassificationMasterForm = () => {
        this.setState({
            formData: {
                Title: '',
                PTO: false,
                IsActive: true,
            },
            SaveUpdateText: 'Submit', addNewEmpClassification: false, isRedirect: true
        });
    }

    private handleRowClicked = (row) => {
        this.setState({loading:true});
        window.location.hash = `#/EmployeeClassificationMaster/${row.Id}`;
        this.props.match.params.id = row.Id
        this.onEditClickHandler(row.Id)
    }

    private cancelHandler = () => {
        this.resetEmpClassificationMasterForm();
    }

    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.resetEmpClassificationMasterForm();
    }
    private addNewEmpClassificationMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewEmpClassification: true, showLabel: false, formData: formdata });
        setTimeout(()=>{document.getElementById('txtEmployeeClassification')?document.getElementById('txtEmployeeClassification').focus():''},300);
    }
    public render() {
        let ExportExcelreportColumns = [
            {
                name: "Employee Classification",
                selector: "EmployeeClassification",
            },
            {
                name: "PTO",
                selector: "PTO",
            },
            {
                name: "Status",
                selector: "IsActive",
            }
        ];
        const columns = [
            {
                name: "Edit",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/EmployeeClassificationMaster/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id',
                width: '100px'
            },

            {
                name: "Employee Classification",
                selector: (row, i) => row.EmployeeClassification,
                sortable: true,
                header: 'Employee Classification',
                dataKey: 'EmployeeClassification'
            },
            {
                name: "PTO",
                selector: (row, i) => row.PTO ? "Yes" : "No",
                sortable: true,
            },
            {
                name: "Status",
                selector: (row, i) => row.IsActive,
                sortable: true,
            },
        ];
        if (this.state.isRedirect) {
            return (<Navigate to={'/EmployeeClassificationMaster'} />);
        }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL+"/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        return (
            <React.Fragment>
                {this.state.loading && <Loader />}
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className='title'>Employee Classification
                                {this.state.addNewEmpClassification &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>
                            <div className="after-title"></div>
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewEmpClassification ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <button type="button" id="btnSubmit" title='Add New Employee Classification' className="SubmitButtons btn" onClick={this.addNewEmpClassificationMaster}>
                                                <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="c-v-table EmpClassificationForm">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewEmpClassification ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                        <InputText
                                                            type='text'
                                                            label={"Employee Classification"}
                                                            name={"Title"}
                                                            value={this.state.formData.Title || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.EmployeeClassification}
                                                            maxlength={250}
                                                            onBlur={this.handleonBlur}
                                                            id={"txtEmployeeClassification"}
                                                        />

                                                        <div className="col-md-3">
                                                            <div className="light-text" >
                                                                <InputCheckBox
                                                                    label={"PTO"}
                                                                    name={"PTO"}
                                                                    checked={this.state.formData.PTO}
                                                                    onChange={this.handleChange}
                                                                    isforMasters={false}
                                                                    isdisable={false}
                                                                    id='chkPTO'
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="light-text" >
                                                                <InputCheckBox
                                                                    label={"Is Active"}
                                                                    name={"IsActive"}
                                                                    checked={this.state.formData.IsActive}
                                                                    onChange={this.handleChange}
                                                                    isforMasters={false}
                                                                    isdisable={false}
                                                                    id='chkIsActive'
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row mx-1" id="">
                                                    <div className="col-sm-12 text-center my-2" id="">
                                                        <button type="button" onClick={this.handleSubmit} id="btnSubmit" className="SubmitButtons btn" title={this.state.SaveUpdateText}>{this.state.SaveUpdateText}</button>
                                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.cancelHandler} title='Cancel'>Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="c-v-table">
                                        <TableGenerator columns={columns} data={this.state.EmpClassificationObj} fileName={'EmployeeClassification'} showExportExcel={this.state.EmpClassificationObj.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.ExportExcelData} LargeWidthColumns={["EmployeeClassification"]} onRowClick={this.handleRowClicked}></TableGenerator>
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
export default EmployeeClassification;