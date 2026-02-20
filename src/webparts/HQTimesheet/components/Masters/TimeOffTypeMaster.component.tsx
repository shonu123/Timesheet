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
import InputCheckBox from '../Shared/InputCheckBox';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import DateUtilities from '../../Utilities/DateUtilities';

interface TimeOffTypeProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface TimeOffTypeState {

}

class TimeOffType extends Component<TimeOffTypeProps, TimeOffTypeState> {
    private siteURL: string;
    private TimeOffType;
    private Comments;
    constructor(props: TimeOffTypeProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.TimeOffType = React.createRef();
        this.Comments = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
        formData: {
            Title: '',
            IsEligibleforPTO:false,
            IsActive: true,
            CommentsHistory:[],
        },
        Comments:'',
        TimeOffTypeData: [],
        ExportExcelData: [],

        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewTimeOffType: false,
        isNewform: true,
        isRedirect: false,
        isPageAccessable:true,
        showToaster: false,
    };

    public componentDidMount() {
        highlightCurrentNav("TimeOffTypeMaster");
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
                    IsEligibleforPTO:false,
                    IsActive: true,
                    CommentsHistory:[],
                },
                Comments:'',
                SaveUpdateText: 'Submit',
                addNewTimeOffType: false,   
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        let inputvalue = event.target.value;
        let value = event.target.type == 'checkbox' ? event.target.checked : inputvalue
        if(name == 'Comments')
        {
            this.setState({ Comments:value });   
        }
        name == 'Comments'?'':formData[name] = value;
        this.setState({ formData });
    }
    private handleSubmit = (event) => {
        event.preventDefault();
        this.setState({ loading: true });
        let data = {
            Title: { val: this.state.formData.Title, required: true, Name: 'Time Off Type', Type: ControlType.string, Focusid: this.TimeOffType },
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
                 this.checkDuplicates(formdata, id);
             }
        }
        else {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    private checkDuplicates = (formData, id) => {
        let TimeOffTypeList = 'TimeOffTypes';
        let filterString = '';
        try {
            if (id == 0)
                filterString = `Title eq '${formData.Title.replace(/'/g,"''")}' and IsActive eq '1'`;
            else
                filterString = filterString = `Title eq '${formData.Title.replace(/'/g,"''")}' and IsActive eq '1' and Id ne ` + id;
            sp.web.lists.getByTitle(TimeOffTypeList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ loading: false });
                        customToaster('toster-error', ToasterTypes.Error, 'Duplicate record is not accepted', 4000)
                    }
                    else {
                       formData.CommentsHistory.push({"User": this.props.spContext.userDisplayName,"Date": new Date().toISOString(),"Comments": this.state.Comments.trim()});
                        this.InsertorUpdatedata(formData, id, TimeOffTypeList);
                    }
                });
        }
        catch (e) {
            this.onError();
            console.log(e);
        }
    }
    // this function is used save data in the list
    private async InsertorUpdatedata(formdata, ItemId, TimeOffTypeList) {
        formdata['CommentsHistory'] = JSON.stringify(formdata.CommentsHistory);
        if (ItemId > 0) {    //update existing record
            sp.web.lists.getByTitle(TimeOffTypeList).items.getById(ItemId).update(formdata).then((res) => {
                customToaster('toster-success', ToasterTypes.Success, 'Time Off Type updated successfully.', 2000)
                    this.resetTimeOffTypeMasterForm();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Time Off Type updated successfully',
                        showHideModal: false,
                        isSuccess: true,
                        loading: false,
                        isRedirect: false,
                        addNewTimeOffType: false
                    });
            },(error) => {
                console.log(error);
            });
        }
        else {                             //Add New record
            sp.web.lists.getByTitle(TimeOffTypeList).items.add(formdata)
                .then((res) => {
                    customToaster('toster-success', ToasterTypes.Success, 'Time Off Type added successfully', 2000)
                    this.resetTimeOffTypeMasterForm();
                    this.setState({ showHideModal: false, addNewTimeOffType: false, loading: false, isRedirect: true });
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Time Off Type added successfully',
                        showHideModal: false,
                        isSuccess: true,
                        isRedirect: false
                    });
                })
                .catch((err) => {
                    console.log('Failed to add');
                    customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewTimeOffType: false });
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
            let [TimeOffTypes, groups] = await Promise.all([
                sp.web.lists.getByTitle('TimeOffTypes').items.select('Title,*').orderBy("Title", false).getAll(),
                sp.web.currentUser.groups(),
            ])
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            let ExcelData = [];
            let Data = [];
            if (TimeOffTypes.length) {
                TimeOffTypes.sort((a, b) => b.Id - a.Id);

                for (const d of TimeOffTypes) {
                    ExcelData.push({
                        Id: d.Id,
                        Title: d.Title,
                        IsEligibleforPTO: d.IsEligibleforPTO ? "Yes" : "No",
                        IsActive: d.IsActive ? "Active" : "In-Active"
                    })

                    Data.push({
                        Id: d.Id,
                        Title: d.Title,
                        IsEligibleforPTO: d.IsEligibleforPTO ? "Yes" : "No",
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
                TimeOffTypeData: Data,
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
            let selectQuery = "Title,*";
            var data = await sp.web.lists.getByTitle('TimeOffTypes').items.filter(filterQuery).select(selectQuery).get();
            this.setState({
                formData:
                {
                    Title: data[0].Title,
                    IsEligibleforPTO: data[0].IsEligibleforPTO,
                    IsActive: data[0].IsActive,
                    CommentsHistory:[null,undefined,''].includes(data[0].CommentsHistory)?[]:JSON.parse(data[0].CommentsHistory),
                },
                Comments:'',
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewTimeOffType: true,
                loading:false
            });
            setTimeout(()=>{document.getElementById("chkIsEligibleforPTO").scrollIntoView({ behavior: 'smooth', block: 'start' })},300);
            setTimeout(()=>{document.getElementById("chkIsEligibleforPTO").focus()},300);
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetTimeOffTypeMasterForm = () => {
        this.setState({
            formData: {
                Title: '',
                IsEligibleforPTO:false,
                IsActive: true,
                CommentsHistory:[],
            },
           Comments:'', SaveUpdateText: 'Submit', addNewTimeOffType: false, isRedirect: true
        });
    }
    private handleRowClicked = (row) => {
        this.setState({loading:true});
        window.location.hash = `#/TimeOffTypeMaster/${row.Id}`;
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
                    <td className="" >{DateUtilities.getDateMMDDYYYY(History[i]["Date"])}  {"  " + new Date(History[i]["Date"]).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1]}</td>
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
        this.resetTimeOffTypeMasterForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.resetTimeOffTypeMasterForm();
    }
    private addNewTimeOffTypeMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewTimeOffType: true, showLabel: false, formData: formdata });
        setTimeout(()=>{document.getElementById('txtTimeOffType')?document.getElementById('txtTimeOffType').focus():''},300);
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/TimeOffTypeMaster/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Time Off Type",
                selector: (row, i) => row.Title,
                sortable: true,
            },
            {
                name: "Eligible for PTO",
                selector: (row, i) => row.IsEligibleforPTO,
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
                name: "Time Off Type",
                selector:"Title",
                sortable: true,
            },
            {
                name: "Eligible for PTO",
                selector: 'IsEligibleforPTO',
                sortable: true,
            },
            {
                name: "Status",
                selector: 'IsActive',
                sortable: true,
            },
        ];
        const searchKeys=['Title','IsEligibleforPTO','IsActive'];
        if (this.state.isRedirect) {
            return (<Navigate to={'/TimeOffTypeMaster'} />);
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
                            <div className='title'>Time Off Type
                                {this.state.addNewTimeOffType &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>
                            <div className="after-title"></div>
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewTimeOffType ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <button type="button" id="btnSubmit" title='Add New Time Off Type' className="SubmitButtons btn" onClick={this.addNewTimeOffTypeMaster}>
                                                <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="c-v-table TimeOffTypeFrom">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewTimeOffType ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">
                                                    <div className="col-md-3">
                                                            <div className='light-text'>
                                                                <label>Time Off Type<span className="mandatoryhastrick">*</span>
                                                                </label>
                                                                <input className="form-control" type={"text"} title={"Time Off Type"} placeholder="" value={this.state.formData.Title || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"Title"} ref={this.TimeOffType} autoComplete="off"  maxLength={250} id={"txtTimeOffType"} disabled={this.props.match.params.id>0}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="light-text" >
                                                                <InputCheckBox
                                                                    label={"Is Eligible for PTO"}
                                                                    name={"IsEligibleforPTO"}
                                                                    checked={this.state.formData.IsEligibleforPTO}
                                                                    onChange={this.handleChange}
                                                                    isforMasters={false}
                                                                    isdisable={false}
                                                                    id='chkIsEligibleforPTO'
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
                                    {!this.state.addNewTimeOffType && <div className="c-v-table">
                                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.TimeOffTypeData} fileName={'Time Off Types'} showExportExcel={this.state.TimeOffTypeData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExportExcelData} onRowClick={this.handleRowClicked}></TableGenerator>
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
export default TimeOffType;