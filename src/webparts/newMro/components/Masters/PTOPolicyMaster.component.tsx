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
import { ToasterTypes } from '../../Constants/Constants';
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

interface PTOPolicyProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface PTOPolicyState {

}

class PTOPolicy extends Component<PTOPolicyProps, PTOPolicyState> {
    private siteURL: string;
    private Policy;
    private YearsOfExperience;
    private HoursPerMonth;
    private Comments;
    constructor(props: PTOPolicyProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Policy = React.createRef();
        this.YearsOfExperience = React.createRef();
        this.HoursPerMonth = React.createRef();
        this.Comments = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
        formData: {
            Title: '',
            YearsOfExperience: '',
            HoursPerMonth: '',
            IsActive: true,
            CommentsHistory:[],
        },
        Comments:'',
        PTOPolicyData: [],
        ExportExcelData: [],
        PolicyObject:[],

        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewPTOPolicy: false,
        isNewform: true,
        isRedirect: false,
        isPageAccessable:true,
        showToaster: false,
    };

    public componentDidMount() {
        highlightCurrentNav("PTOPolicyMaster");
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
                    YearsOfExperience: '',
                    HoursPerMonth: '',
                    IsActive: true,
                    CommentsHistory:[],
                },
                Comments:'',
                SaveUpdateText: 'Submit',
                addNewPTOPolicy: false,   
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value;
        let value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        if (name == 'YearsOfExperience') {

            value =value.includes("-")?value.match(/\d{0,2}(\-\d{0,2})?/)[0]:value.includes("+")?value.match(/\d{0,2}(\+)?/)[0]:value.match(/\d{0,2}(\-\d{0,2})?/)[0]; //To match expression as YY-YY or YY+
        }
        else if(name == 'Comments')
        {
            this.setState({ Comments:value });   
        }
        else if (name == 'HoursPerMonth') {
            value = value.match(/\d{0,3}(\.\d{0,5})?/)[0];
        }
        name == 'Comments'?'':formData[name] = value;
        this.setState({ formData });
    }
    private handleSubmit = (event) => {
        event.preventDefault();
        this.setState({ loading: true });
        let data = {
            Title: { val: this.state.formData.Title, required: true, Name: 'Policy', Type: ControlType.string, Focusid: this.Policy },
            YearsOfExperience: { val: this.state.formData.YearsOfExperience, required: true, Name: 'Years of Experience', Type: ControlType.string,Focusid:this.YearsOfExperience },
            HoursPerMonth: { val: this.state.formData.HoursPerMonth, required: true, Name: 'Hours Per Month', Type: ControlType.string, Focusid: this.HoursPerMonth },
        };
        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            if(id>0 && this.state.Comments.trim()=='')
            {
                let errMsg = 'Comments cannot be blank.';
                customToaster('toster-error', ToasterTypes.Error, errMsg, 4000);
                document.getElementById('txtComments').focus();
                document.getElementById('txtComments').classList.add('mandatory-FormContent-focus'); 
                this.setState({ loading: false });      
             }
             else{
                this.state.formData.CommentsHistory.push({"User": this.props.spContext.userDisplayName,"Date": new Date().toISOString(),"Comments": this.state.Comments.trim()});
                 this.checkDuplicates(formdata, id);
             }
        }
        else {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    private checkDuplicates = (formData, id) => {
        let PTOPloicyList = 'Policy';
        let filterString = ''
        try {
            if (id == 0)
                filterString = `Title eq '${formData.Title}' and YearsOfExperience eq '${formData.YearsOfExperience}' and IsActive eq '1'`;
            else
                filterString = filterString = `Title eq '${formData.Title}' and YearsOfExperience eq '${formData.YearsOfExperience}' and IsActive eq '1' and Id ne ` + id;
            sp.web.lists.getByTitle(PTOPloicyList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ loading: false });
                        customToaster('toster-error', ToasterTypes.Error, 'Duplicate record is not accepted', 4000)
                    }
                    else if( (!formData.YearsOfExperience.includes("-") && !formData.YearsOfExperience.includes("+")) || formData.YearsOfExperience=='-' || formData.YearsOfExperience=='+' || formData.YearsOfExperience.charAt(0)=='-' || formData.YearsOfExperience.charAt(0)=='+' || formData.YearsOfExperience.charAt(formData.YearsOfExperience.length-1)=='-') //To format the YearsOfExperience
                    {
                        this.setState({ loading: false });
                        document.getElementById("txtYearsOfExperience").focus();
                        document.getElementById("txtYearsOfExperience").classList.add('mandatory-FormContent-focus');
                        customToaster('toster-error', ToasterTypes.Error, 'Please enter Years of Experience in the correct format (e.g., 0-5 or 7+)', 4000);
                    }
                    else if(formData.YearsOfExperience.includes("-") && parseInt(formData.YearsOfExperience.split('-')[0])>parseInt(formData.YearsOfExperience.split('-')[1])) //To format the YearsOfExperience
                    {
                        this.setState({ loading: false });
                        document.getElementById("txtYearsOfExperience").focus();
                        document.getElementById("txtYearsOfExperience").classList.add('mandatory-FormContent-focus');
                        customToaster('toster-error', ToasterTypes.Error, 'Min year cannot be greater than Max year', 4000);
                    }
                    else {
                        this.InsertorUpdatedata(formData, id, PTOPloicyList);
                    }
                });
        }
        catch (e) {
            this.onError();
            console.log(e);
        }
    }
    // this function is used save data in the list
    private async InsertorUpdatedata(formdata, ItemId, PTOPolicyList) {
        formdata['CommentsHistory'] = JSON.stringify(formdata.CommentsHistory);
        if (ItemId > 0) {    //update existing record
            sp.web.lists.getByTitle(PTOPolicyList).items.getById(ItemId).update(formdata).then((res) => {
                customToaster('toster-success', ToasterTypes.Success, 'Policy updated successfully.', 2000)
                    this.resetPolicyMasterForm();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Policy updated successfully',
                        showHideModal: false,
                        isSuccess: true,
                        loading: false,
                        isRedirect: false,
                        addNewPTOPolicy: false
                    });
            },(error) => {
                console.log(error);
            });
        }
        else {                             //Add New record
            sp.web.lists.getByTitle(PTOPolicyList).items.add(formdata)
                .then((res) => {
                    customToaster('toster-success', ToasterTypes.Success, 'Policy added successfully', 2000)
                    this.resetPolicyMasterForm();
                    this.setState({ showHideModal: false, addNewPTOPolicy: false, loading: false, isRedirect: true });
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Policy added successfully',
                        showHideModal: false,
                        isSuccess: true,
                        isRedirect: false
                    });
                })
                .catch((err) => {
                    console.log('Failed to add');
                    customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewPTOPolicy: false });
                });
        }
    }
    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }
    private async loadListData() {
        this.setState({ isRedirect: false })
        try {
            let [Policies,Policy, groups] = await Promise.all([
                sp.web.lists.getByTitle('Policy').items.select('Title,YearsOfExperience,HoursPerMonth,*').orderBy("Title", false).getAll(),
                sp.web.lists.getByTitle('AllPolicies').items.filter("IsActive eq 1").select('*').orderBy('Title').getAll(),
                sp.web.currentUser.groups(),
            ])
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            let ExcelData = []
            let Data = [];
            if (Policies.length) {
                Policies.sort((a, b) => b.Id - a.Id);

                for (const d of Policies) {
                    ExcelData.push({
                        Id: d.Id,
                        Title: d.Title,
                        YearsOfExperience:d.YearsOfExperience,
                        HoursPerMonth:d.HoursPerMonth,
                        IsActive: d.IsActive ? "Active" : "In-Active"
                    })

                    Data.push({
                        Id: d.Id,
                        Title: d.Title,
                        YearsOfExperience:d.YearsOfExperience,
                        HoursPerMonth:d.HoursPerMonth,
                        IsActive: d.IsActive ? "Active" : "In-Active"
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
            this.setState({
                PTOPolicyData: Data,
                PolicyObject:Policy,
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
    private async onEditClickHandler(id) {
        try {
            let filterQuery = "ID eq '" + id + "'";
            let selectQuery = "Title,YearsOfExperience,HoursPerMonth,*";
            var data = await sp.web.lists.getByTitle('Policy').items.filter(filterQuery).select(selectQuery).get();
            this.setState({
                formData:
                {
                    Title: data[0].Title,
                    YearsOfExperience: data[0].YearsOfExperience,
                    HoursPerMonth: data[0].HoursPerMonth.toString(),
                    IsActive: data[0].IsActive,
                    CommentsHistory:[null,undefined,''].includes(data[0].CommentsHistory)?[]:JSON.parse(data[0].CommentsHistory),
                },
                Comments:'',
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewPTOPolicy: true,
                loading:false
            });
            setTimeout(()=>{document.getElementById("txtYearsOfExperience").scrollIntoView({ behavior: 'smooth', block: 'start' })},300);
            setTimeout(()=>{document.getElementById("txtYearsOfExperience").focus()},300);
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetPolicyMasterForm = () => {
        this.setState({
            formData: {
                Title: '',
                YearsOfExperience: '',
                HoursPerMonth: '',
                IsActive: true,
                CommentsHistory:[],
            },
           Comments:'', SaveUpdateText: 'Submit', addNewPTOPolicy: false, isRedirect: true
        });
    }
    private handleRowClicked = (row) => {
        this.setState({loading:true});
        window.location.hash = `#/PTOPolicyMaster/${row.Id}`;
        this.props.match.params.id = row.Id;
        this.onEditClickHandler(row.Id);
    }
    private bindComments = () => {
        let body = [];
        if (this.state.formData.CommentsHistory.length > 0) {
            var History = this.state.formData.CommentsHistory;
            for (let i = History.length - 1; i >= 0; i--) {
                body.push(<tr>
                    {/* <td className="" >{History[i]["Role"]}</td> */}
                    <td className="" >{History[i]["User"]}</td>
                    <td className="" >{(new Date(History[i]["Date"]).getMonth() < 9 ? "0" + (new Date(History[i]["Date"]).getMonth() + 1) : new Date(History[i]["Date"]).getMonth() + 1) + "/" + (new Date(History[i]["Date"]).getDate() <= 9 ? "0" + new Date(History[i]["Date"]).getDate() : new Date(History[i]["Date"]).getDate()) + "/" + new Date(History[i]["Date"]).getFullYear()}  {"  " + new Date(History[i]["Date"]).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1]}</td>
                    <td className="" >{History[i]["Comments"]}</td>
                </tr>)
            }
        }
        return body;
    }
    private handleonBlur = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value.trim();
        const value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        formData[name] = value;
        this.setState({ formData });
    }
    private cancelHandler = () => {
        this.resetPolicyMasterForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.resetPolicyMasterForm();
    }
    private addNewPolicyMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewPTOPolicy: true, showLabel: false, formData: formdata });
        setTimeout(()=>{document.getElementById('Policy')?document.getElementById('Policy').focus():''},300);
    }
    public render() {
        const columns = [
            {
                name: "Edit",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/PTOPolicyMaster/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Policy",
                selector: (row, i) => row.Title,
                sortable: true,
            },
            {
                name: "Years of Experience",
                selector: (row, i) => row.YearsOfExperience,
                sortable: true,
            },
            {
                name: "Hours Per Month",
                selector: (row, i) => row.HoursPerMonth,
                sortable: true,
            },
            {
                name: "Status",
                selector: (row, i) => row.IsActive,
                sortable: true,
            },
        ];
        const ExcelColumns = [
            {
                name: "Policy",
                selector:"Title",
                sortable: true,
            },
            {
                name: "Years of Experience",
                selector:"YearsOfExperience",
                sortable: true,
            },
            {
                name: "Hours Per Month",
                selector: "HoursPerMonth",
                sortable: true,
            },
            {
                name: "Status",
                selector: 'IsActive',
                sortable: true,
            },
        ];
        if (this.state.isRedirect) {
            return (<Navigate to={'/PTOPolicyMaster'} />);
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
                            <div className='title'>PTO Policy
                                {this.state.addNewPTOPolicy &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>
                            <div className="after-title"></div>
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewPTOPolicy ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <button type="button" id="btnSubmit" title='Add New Policy' className="SubmitButtons btn" onClick={this.addNewPolicyMaster}>
                                                <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="c-v-table PolicyFrom">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewPTOPolicy ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                        <div className="col-md-3">
                                                                <div className="light-text">
                                                                    <label>Policy<span className="mandatoryhastrick">*</span></label>
                                                                    <select className="form-control" name="Title" title="Policy" id='Policy' disabled={this.props.match.params.id ? true : false} onChange={this.handleChange} value={this.state.formData.Title} ref={this.Policy}>
                                                                    <option value=''>None</option>
                                                                    {this.state.PolicyObject.map((option) => (
                                                                        <option value={option.Title} selected={option.Title == this.state.formData.Title}>{option.Title}</option>
                                                                    ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        <div className="col-md-3">
                                                            <div className='light-text'>
                                                                <label>Years Of Experience<span className="mandatoryhastrick">*</span>
                                                                </label>
                                                                <input className="form-control" type={"text"} title={"Years Of Experience"} placeholder="e.g., 0-5 or 7+" value={this.state.formData.YearsOfExperience || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"YearsOfExperience"} ref={this.YearsOfExperience} autoComplete="off"  maxLength={10} id={"txtYearsOfExperience"}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                         <div className='light-text'>
                                                                <label>Hours Per Month<span className="mandatoryhastrick">*</span>
                                                                </label>
                                                                <input className="form-control" type={"text"} title={"Hours Per Month"} placeholder="e.g., 15.15" value={this.state.formData.HoursPerMonth || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"HoursPerMonth"} ref={this.HoursPerMonth} autoComplete="off"  maxLength={10} id={"txtHoursPerMonth"}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="light-text" id='chkIsActive'>
                                                                <InputCheckBox
                                                                    label={"Is Active"}
                                                                    name={"IsActive"}
                                                                    checked={this.state.formData.IsActive}
                                                                    onChange={this.handleChange}
                                                                    isforMasters={false}
                                                                    isdisable={false}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="light-text height-auto m-2 mt-3">
                                                        <label className="floatingTextarea2 top-11">Comments{this.props.match.params.id > 0 && <span className="mandatoryhastrick">*</span>}</label>
                                                        <textarea className="position-static form-control requiredinput" onChange={this.handleChange} value={this.state.Comments} id="txtComments" ref={this.Comments} name="Comments"></textarea>
                                                    </div>
                                                </div>
                                                <div className="row mx-1" id="">
                                                    <div className="col-sm-12 text-center my-2" id="">
                                                        <button type="button" onClick={this.handleSubmit} id="btnSubmit" className="SubmitButtons btn" title={this.state.SaveUpdateText}>{this.state.SaveUpdateText}</button>
                                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.cancelHandler} title='Cancel'>Cancel</button>
                                                    </div>
                                                </div>
                                                {this.state.formData.CommentsHistory.length > 0 ? <><div className="light-box m-1 p-2 pt-3">
                                                    <h4>History</h4>
                                                    <div className='divActionHistory'>
                                                        <table className="table table-bordered m-0 timetable">
                                                            <thead className='ActionHistoryHead'>
                                                                <tr>
                                                                    {/* <th className="">Action By</th> */}
                                                                    <th className="" style={{ width: '250px' }}>Action By</th>
                                                                    <th className="" style={{ width: '250px' }}>Date & Time (EST)</th>
                                                                    <th className="">Comments</th>

                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {this.bindComments()}

                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div></> : ""
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    {this.state.showToaster && <Toaster />}
                                    {!this.state.addNewPTOPolicy && <div className="c-v-table">
                                        <TableGenerator columns={columns} data={this.state.PTOPolicyData} fileName={'Policies'} showExportExcel={this.state.PTOPolicyData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExportExcelData} onRowClick={this.handleRowClicked}></TableGenerator>
                                    </div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}
export default PTOPolicy;