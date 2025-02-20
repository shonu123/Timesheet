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
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes,StatusType } from '../../Constants/Constants';
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

interface EmployeePTOCreditProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface EmployeePTOCreditState {

}

class EmployeePTOCredit extends Component<EmployeePTOCreditProps, EmployeePTOCreditState> {
    private siteURL: string;
    private Employee;
    private TimeOffType;
    private Hours;
    constructor(props: EmployeePTOCreditProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Employee = React.createRef();
        this.TimeOffType = React.createRef();
        this.Hours = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
        formData: {
            EmployeeId: null,
            TimeOffType: '',
            Hours: '',
            Comments:''
        },
        PTOCreditData: [],
        ExportExcelData: [],
        EmployeesObject: [],

        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewPTOCredit: false,
        isNewform: true,
        isRedirect: false,
        isPageAccessable:true,
        showToaster: false,
    };

    public componentDidMount() {
        highlightCurrentNav("EmployeePTOCreditMaster");
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
                    EmployeeId: null,
                    TimeOffType: '',
                    Hours: '',
                    Comments:''
                },
                SaveUpdateText: 'Submit',
                addNewPTOCredit: false,   
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value;
        let value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
       if(name=='Hours')
        {
                value = value.match(/\d{0,3}(\.\d{0,5})?/)[0];
        }
        formData[name] = value;
        this.setState({ formData });
    }
    private UpdateDate = (dateprops) => {
        let formData = this.state.formData;
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        formData['DateOfJoining'] = date;
        this.setState({ formData: formData });

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
        let formdata = this.state.formData;
        let value = null;
        let values = { results: [] };
        if (items.length > 0) {
            if (['EmployeeId'].includes(name))
                value = items[0].id;
            // else if (['ReportingManagerId', 'ReviewerId', 'NotifierId'].includes(name)) {
            //     let multiple = { results: [] }
            //     for (const user of items) {
            //         multiple.results.push(user.id)
            //     }
            //     values = multiple;
            // }
        }
        else {
            value = null;
        }
        // name == 'EmployeeId' ? this.setState({ EmployeeId: value }) : name == 'ReportingManagerId' ? this.setState({ ReportingManagerId: values }) : name == 'ApproverId' ? this.setState({ ApproverId: values }) : name == 'ReviewerId' ? this.setState({ ReviewerId: values }) : ''
        formdata['EmployeeId'] = value;
        name == 'EmployeeId' ? this.setState({ formData: formdata }) : ''
    }
    private handleSubmit = (event) => {
        event.preventDefault();
        this.setState({ loading: true });
        let data = {
            Employee: { val: this.state.formData.EmployeeId, required: true, Name: 'Employee', Type: ControlType.string, Focusid: this.Employee },
            TimeOffType: { val: this.state.formData.TimeOffType, required: true, Name: 'Time Off Type', Type: ControlType.string,Focusid: this.TimeOffType },
            Hours: { val: this.state.formData.Hours, required: true, Name: 'Hours', Type: ControlType.string,Focusid:this.Hours},
        };
        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
                this.CreditPTOToEmployee(formdata, id);
        }
        else {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    // this function is used save data in the list
    private async CreditPTOToEmployee(formdata, ItemId) {
      let  EmployeePTOList='EmployeePTO';
      let  PTOTransactions='PTOTransactions';
       let  PTOfilterQuery='Employee/ID eq ' + formdata.EmployeeId+' and Year eq '+new Date().getFullYear();
        let [EmpPTORecord] = await Promise.all([
            sp.web.lists.getByTitle(EmployeePTOList).items.filter(PTOfilterQuery).select('Employee/ID,Employee/Title,*').expand('Employee').get(),
        ])
        let EmpPTOData = {
            PTOGranted:(parseInt(formdata.Hours)+parseInt(EmpPTORecord[0].PTOGranted)).toString(),
            PTOBalance: (parseInt(formdata.Hours)+parseInt(EmpPTORecord[0].PTOBalance)).toString(),
            PTOBalanceAfterDeduction:(parseInt(formdata.Hours)+parseInt(EmpPTORecord[0].PTOBalanceAfterDeduction)).toString(),
        }
        let PTOTransaction={
            EmployeeId:this.state.formData.EmployeeId,
            TransactionType:this.state.formData.TimeOffType,
            PostedOn:new Date(),
            Hours:this.state.formData.Hours.toString(),
            Reason:this.state.formData.Comments,
            Year:new Date().getFullYear().toString()
        }

        if (EmpPTORecord.length) {
            sp.web.lists.getByTitle(EmployeePTOList).items.getById(EmpPTORecord[0].ID).update(EmpPTOData).then((EmpPTOres) => {
                //console.log("EmployeePTO Updated successfully");
                sp.web.lists.getByTitle(PTOTransactions).items.add(PTOTransaction).then((PTOTranRes) => {
                    //console.log("PTOtransaction added successfully");
                customToaster('toster-success', ToasterTypes.Success, 'PTO credited successfully', 2000)
                this.PTOCreditMasterForm();
                this.setState({ showHideModal: false, addNewPTOCredit: false, loading: false, isRedirect: true });
                this.setState({
                    modalTitle: 'Success',
                    modalText: 'PTO credited successfully',
                    showHideModal: false,
                    isSuccess: true,
                    isRedirect: false
                });
            }, (error) => {
                console.log("Failed add PTOTransaction" ,error);
                customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
            });
        },(error) => {
            console.log("Failed add update EmployeePTOData" ,error);
            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
        });
            
        }
    }
    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }
    private async loadListData() {
        this.setState({ isRedirect: false });
        let ExcludedTransactionTypeArr=[StatusType.Submit,StatusType.Approved,StatusType.ManagerReject,StatusType.ReviewerReject,StatusType.Revoke,'Granted','Opening PTO Balance'];
        let PTOTransactionsFilterQuery='';
        ExcludedTransactionTypeArr.forEach(Type=>{
            if(Type=='Opening PTO Balance')
            PTOTransactionsFilterQuery+=`TransactionType ne '${Type}'`;
            else
            PTOTransactionsFilterQuery+=`TransactionType ne '${Type}' and `;
        });
        try {
            let [Employees, PTOTransations, groups] = await Promise.all([
                sp.web.lists.getByTitle('Employees').items.top(3000).expand('Employee').filter('IsActive eq 1 and EligibleforPTO eq 1').select('Employee/Title,Employee/Id,*').orderBy("Employee/Title", false).getAll(),
                sp.web.lists.top(5000).getByTitle('PTOTransactions').items.filter(PTOTransactionsFilterQuery).expand('Employee').select('Employee/Id,Employee/Title,*').getAll(),
                sp.web.currentUser.groups(),
            ])
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            let ExcelData = []
            let Data = [];
            if (PTOTransations.length) {
                PTOTransations.sort((a, b) => b.Id - a.Id);

                for (const d of PTOTransations) {
                    let PostedOn = new Date(d.PostedOn.split('-')[1] + '/' + d.PostedOn.split('-')[2].split('T')[0] + '/' + d.PostedOn.split('-')[0]);
                    ExcelData.push({
                        Id: d.Id,
                        Employee: d.Employee.Title,
                        TimeOffType :d.TransactionType,
                        Hours: d.Hours,
                        Comments: d.Reason,
                        PostedOn :`${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`
                    })

                    Data.push({
                        Id: d.Id,
                        Employee: d.Employee.Title,
                        TimeOffType :d.TransactionType,
                        Hours: d.Hours,
                        Comments: d.Reason,
                        PostedOn :`${PostedOn.getMonth() + 1}/${PostedOn.getDate()}/${PostedOn.getFullYear()}`
                    })
                }
            }
            let pageAccessable = false;
            if (userGroups.includes('Timesheet Administrators')) {
                pageAccessable = true;
            }
            else {
                pageAccessable = false;
            }
            Employees.sort((a,b)=>a.Employee.Title.localeCompare(b.Employee.Title))
            this.setState({
                PTOCreditData: Data,
                EmployeesObject: Employees,
                SaveUpdateText: 'Submit',
                showLabel: false,
                loading: false,
                ExportExcelData: ExcelData, showToaster: true,isPageAccessable:pageAccessable
            });

        }
        catch (e) {
            this.onError();
            console.log(e);
        }
    }
    private PTOCreditMasterForm = () => {
        this.setState({
            formData: {
                EmployeeId: null,
                TimeOffType: '',
                Hours: '',
                Comments:''
            },
            SaveUpdateText: 'Submit', addNewPTOCredit: false, EmployeeEmail: '', isRedirect: true
        });
    }
    private cancelHandler = () => {
        this.PTOCreditMasterForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.PTOCreditMasterForm();
    }
    private addNewPTOCreditMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewPTOCredit: true, showLabel: false, formData: formdata });
    }
    public render() {
        const columns = [
            {
                name: "Employee",
                selector: (row, i) => row.Employee,
                width:'250px',
                sortable: true,
            },
            {
                name: "Time Off Type",
                selector: (row, i) => row.TimeOffType,
                width:'250px',
                sortable: true,
            },
            {
                name: "Hours",
                selector: (row, i) => row.Hours,
                width:'70px',
                sortable: true,
            },
            {
                name: "Posted On",
                selector: (row, i) => row.PostedOn,
                width:'150px',
                sortable: true,
            },
            {
                name: "Comments",
                selector: (row, i) => row.Comments,
                sortable: true,
            },
        ];
        const ExcelColumns = [
            {
                name: "Employee",
                selector: "Employee",
                sortable: true,
            },
            {
                name: "Time Off Type",
                selector: "TimeOffType",
                sortable: true,
            },
            {
                name: "Hours",
                selector: "row.Hours",
                sortable: true,
            },
            {
                name: "Posted On",
                selector:"PostedOn",
                sortable: true,
            },
            {
                name: "Comments",
                selector: "Comments",
                sortable: true,
            },
        ];
        if (this.state.isRedirect) {
            return (<Navigate to={'/EmployeePTOCreditMaster'} />);
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
                            <div className='title'>Employee PTO Credit
                                {this.state.addNewPTOCredit &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>
                            <div className="after-title"></div>
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewPTOCredit ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <button type="button" id="btnSubmit" title='Add New PTO Credit' className="SubmitButtons btn" onClick={this.addNewPTOCreditMaster}>
                                                <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="c-v-table EmployeeFrom">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewPTOCredit ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                        <div className="col-md-3">
                                                        <div className="light-text">
                                                                <label>Employee<span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="EmployeeId" title="Employee" id='Employee' ref={this.Employee} onChange={this.handleChange}>
                                                                    <option value=''>None</option>
                                                                    {this.state.EmployeesObject.map((option) => (
                                                                        <option value={option.Employee.Id} selected={option.Employee.Id == this.state.formData.EmployeeId}>{option.Employee.Title}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className='light-text'>
                                                                <label>Time Off Type<span className="mandatoryhastrick">*</span>
                                                                </label>
                                                                <input className="form-control" type={"text"} title={"Time Off Type"} placeholder="" value={this.state.formData.TimeOffType || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"TimeOffType"} ref={this.TimeOffType} autoComplete="off"  maxLength={250} id={"txtTimeOffType"}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                         <div className='light-text'>
                                                                <label>Hours<span className="mandatoryhastrick">*</span>
                                                                </label>
                                                                <input className="form-control" type={"text"} title={"Hours"} placeholder="e.g., 15.15" value={this.state.formData.Hours || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"Hours"} ref={this.Hours} autoComplete="off"  maxLength={10} id={"txtHours"}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="light-text height-auto m-2 mt-3">
                                                <label className="floatingTextarea2 top-11">Comments</label>
                                                <textarea className="position-static form-control requiredinput"  onChange={this.handleChange} value={this.state.formData.Comments}  id="txtComments" name="Comments" disabled={false}></textarea>
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
                                    {this.state.showToaster && <Toaster />}
                                    <div className="c-v-table table-head-1st-td">
                                        <TableGenerator columns={columns} data={this.state.PTOCreditData} fileName={'EmployeePTOCredits'} showExportExcel={this.state.PTOCreditData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExportExcelData}></TableGenerator>
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
export default EmployeePTOCredit;