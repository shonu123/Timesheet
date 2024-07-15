import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit,faPlus } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Navigate,redirect } from 'react-router-dom';
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

interface ClientProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface ClientState {

}

class Clients extends Component<ClientProps, ClientState> {
    private siteURL: string;
    private Client;
    constructor(props: ClientProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Client = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
            
        formData: {
            Title : '',
            IsActive: true,
            Comments: '',
            AuditHistory:[],
            DelegateToId: { results: [] },
        },
        ClientsObj : [],
        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewClient: false,
        isNewform: true,
        isRedirect: false,
        ExportExcelData:[],
        showToaster:false,
        DelegateToEMail:[],
    };

    public componentDidMount() {
        highlightCurrentNav("ClientMaster");
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
                    Title : '',
                    IsActive: true,
                    Comments: '',
                    AuditHistory:[],        
                    DelegateToId: { results: [] },
                },DelegateToEMail:[],
                SaveUpdateText: 'Submit', addNewClient: false
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
        let formData = {...this.state.formData}
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
            Clinet: { val: this.state.formData.Title, required: true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client },
        };
        let pdata = {
            DelegateTo: { val: this.state.formData.DelegateToId, required: true, Name: 'Delegate To', Type: ControlType.people, Focusid: 'divDelegateTo'},
        }
        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        // isValid = isValid.status ? Formvalidator.multiplePeoplePickerValidation(pdata) : isValid
        if (isValid.status) {
            this.checkDuplicates(formdata, id);
        }
         else {
            // this.setState({ showLabel: true, errorMessage: isValid.message });
            this.setState({ loading: false });
            customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
        }
    }

    private checkDuplicates = (formData, id) => {
        let ClientList = 'Client';

        // let dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        let filterString = ''

        try {
            if (id == 0)
                filterString = `Title eq '${formData.Title}' and IsActive eq '1'`;
            else
                filterString = filterString = `Title eq '${formData.Title}' and  IsActive eq '1' and Id ne ` + id;
            sp.web.lists.getByTitle(ClientList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ loading: false });
                        // this.setState({ showLabel: true, errorMessage: 'Duplicate record is not accepted'});
                        customToaster('toster-error',ToasterTypes.Error,'Duplicate record is not accepted',4000)
                    }
                    else {
                        let History = formData.AuditHistory
                        History.push({
                            User: this.props.spContext.userDisplayName,
                            Comments: this.state.formData.Comments.trim(),
                            Date: new Date().toISOString()
                        })
                       formData.AuditHistory = JSON.stringify(History)
                       formData.Comments = formData.Comments.trim()
                        
                        // this.insertorupdateListitem(formData, HolidaysList);
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle(ClientList).items.getById(id).update(formData).then((res) => {
                                // this.resetHolidayMasterForm();
                                // toast.success('updated successfully');
                                customToaster('toster-success',ToasterTypes.Success,'Client updated successfully.',2000)
                                this.resetHolidayMasterForm();
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Client updated successfully',
                                    showHideModal: false,
                                    isSuccess: true,
                                    loading: false,
                                    isRedirect: false,
                                    addNewClient: false
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                // this.setState({ loading: true });
                                sp.web.lists.getByTitle(ClientList).items.add(formData)
                                    .then((res) => {
                                        customToaster('toster-success',ToasterTypes.Success,'Client added successfully',2000)
                                        this.resetHolidayMasterForm();
                                        // toast.success('updated successfully');
                                        this.setState({ showHideModal: false,addNewClient: false,loading:false,isRedirect:true});
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
                                        // toast.error('Sorry! something went wrong');
                                        customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
                                        this.setState({ showHideModal: false,isRedirect:true,loading:false,addNewClient:false});
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
        // var Clients = await  sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get()
        this.setState({isRedirect:false})
        // console.log(Clients);
        
        sp.web.lists.getByTitle('Client').items.select('DelegateTo/Title,*').expand('DelegateTo').orderBy("Title", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                let ExcelData = []
                let Data = [];
                for (const d of response) {
                    let delegateToString = ""
                    let delegateToStringExcel = "";
                    if(d.DelegateTo!=undefined){
                        d.DelegateTo.sort((a, b) => a.Title.localeCompare(b.Title));
                    if(d.DelegateTo.length>0)
                        {
                            for(let r of d.DelegateTo){
                                delegateToString += "<div>"+r.Title+"</div>"
                                delegateToStringExcel += r.Title+"\n"
                            }
                            // ExcelRm = ExcelRm.substring(0, ExcelRm.lastIndexOf("\n"));
                        }
                    }
                    ExcelData.push({
                       ClientName: d.Title,
                       IsActive: d.IsActive?"Active":"In-Active",
                       Comments: d.Comments,
                       DelegateTo:delegateToStringExcel,
                    })
                
                Data.push({
                    Id: d.Id, 
                    ClientName: d.Title, 
                    IsActive: d.IsActive,
                    Comments: d.Comments,
                    DelegateTo:delegateToString,
                })
            }
                this.setState({
                    ClientsObj: Data,
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    ExportExcelData : ExcelData,showToaster:true,
                });
   
                // setTimeout(() => {
                    // this.setState({loading: false})
                //   }, 100);
            }).catch(err => {
                console.log('Failed to fetch data.');
                this.setState({
                    loading: false,
                    modalTitle: 'Error',
                    modalText: 'Sorry! something went wrong',
                    // showHideModal: true,
                    isSuccess: false
                });
            });
    }
    private async onEditClickHandler(id) {
        // console.log('edit clicked', id);
        // DelegateTo/Title
        try {
            let filterQuery = "ID eq '" + id + "'"
            let selectQuery = "DelegateTo/ID,DelegateTo/EMail,*"
            // let Year = new Date().getFullYear()+"";
            var data = await sp.web.lists.getByTitle('Client').items.filter(filterQuery).select(selectQuery).expand('DelegateTo').get()
               let response = data[0]
            // var response = await sp.web.lists.getByTitle('Client').items.getById(id).get();
        let DelegateToIds = { results: [] }
        let DelegateToEmails = []
        if(data[0].DelegateTo!=undefined){
            if (data[0].DelegateTo.length > 0) {
                for (const user of data[0].DelegateTo) {
                    DelegateToEmails.push(user.EMail)
                    DelegateToIds.results.push(user.ID)
                }
            }
        }
        document.getElementById("txtClientName").scrollIntoView({behavior: 'smooth', block: 'start'});
        document.getElementById("txtClientName").focus();
            this.setState({
                formData:
                 {
                    Title: response.Title,
                  IsActive: response.IsActive,
                  Comments: response.Comments,
                  AuditHistory: JSON.parse(response.AuditHistory),
                  DelegateToId: DelegateToIds
                },
                DelegateToEMail:DelegateToEmails,
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewClient: true
            });
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetHolidayMasterForm = () => {
        this.setState({
            formData: {
                Title : '',
                IsActive: true,
                Comments: '',
                AuditHistory:[],    
                DelegateToId: {results:[]}
            },DelegateToEmail:[],
            SaveUpdateText: 'Submit', addNewClient: false,isRedirect:true
        });
    }

    private  handleRowClicked = (row) => {
        window.location.hash=`#/ClientMaster/${row.Id}`;
        this.props.match.params.id = row.Id
        this.onEditClickHandler(row.Id)
      }
      
    private cancelHandler = () => {
        this.resetHolidayMasterForm();
    }

    public handleClose = () => {
        this.setState({ showHideModal: false});
        this.resetHolidayMasterForm();
    }

    private addNewClientMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewClient: true, showLabel: false, formData: formdata });
    }

    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }

    public render() {
        let ExportExcelreportColumns = [
            {
                name: "Client Name",
                selector: "ClientName",
            },
            {
                name: "Delegate To",
                selector: "DelegateTo"
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/ClientMaster/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id',


            },
           
            {
                name: "Client Name",
                //selector: "Title",
                selector: (row, i) => row.ClientName,
                sortable: true,
                header: 'Client Name',
                dataKey: 'ClientName'
            },
            {
                name: "Delegate To",
                selector: (row, i) => row.DelegateTo,
                sortable: true,
                width: '250px',
                cell: row => <div className='divReviewers' dangerouslySetInnerHTML={{ __html: row.DelegateTo }} />
            },

            {
                name: "Status",
                //selector: "Database",
                selector: (row, i) => row.IsActive?"Active":"In-Active",
                sortable: true,
                header: 'Holiday Date',
                dataKey: 'HolidayDate'
            },
            {
                name: "Comments",
                //selector: "Database",
                selector: (row, i) => row.Comments,
                sortable: true,
                header: 'Comments',
                dataKey: 'Comments'
            }, 

           
        ];
        if(this.state.isRedirect){
                return (<Navigate to={'/ClientMaster'} />);
        }
            return (
                <React.Fragment>
                    {this.state.loading && <Loader />}
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    <div id="content" className="content p-2 pt-2">
                        {/* <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
                            <div className="menu-icon">
                                <span>
                                </span>
                                <span>
                                </span>
                                <span>
                                </span>
                            </div>
                        </div> */}
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className='title'>Clients
                                    {this.state.addNewClient &&
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    }
                                </div>

                                <div className="after-title"></div>

                                


                                <div className="row justify-content-md-left">
                                    <div className="col-12 col-md-12 col-lg-12">

                                        <div className={this.state.addNewClient ? 'mx-2 activediv' : 'mx-2'}>
                                            <div className="text-right pt-2">
                                                <button type="button" id="btnSubmit" title='Add New Client' className="SubmitButtons btn" onClick={this.addNewClientMaster}>
                                                <span className='' id='addClient'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="c-v-table clientForm">
                                            <div className="light-box border-box-shadow mx-2">
                                                <div className={this.state.addNewClient ? '' : 'activediv'}>
                                                    <div className="my-2">
                                                        <div className="row pt-2 px-2">
                                                            <InputText
                                                                type='text'
                                                                label={"Client Name"}
                                                                name={"Title"}
                                                                value={this.state.formData.Title || ''}
                                                                isRequired={true}
                                                                onChange={this.handleChange}
                                                                refElement={this.Client}
                                                                maxlength={250}
                                                                onBlur={this.handleonBlur}
                                                                id={"txtClientName"}
                                                            />


                                                    <div className="col-md-3">
                                                        <div className="light-text">
                                                            <label className='lblPeoplepicker'>Delegate To {/*<span className="mandatoryhastrick">*</span>*/}</label>
                                                            <div className="custom-peoplepicker" id="divDelegateTo">
                                                                <PeoplePicker
                                                                    context={this.props.context}
                                                                    titleText="Delegate To"
                                                                    personSelectionLimit={10}
                                                                    showtooltip={false}
                                                                    defaultSelectedUsers={this.state.DelegateToEMail}
                                                                    onChange={(e) => this._getPeoplePickerItems(e, 'DelegateToId')}
                                                                    ensureUser={true}
                                                                    required={true}
                                                                    principalTypes={[PrincipalType.User]} placeholder=""
                                                                    resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                            </div>
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
                                                        <div className="media-px-12,col-md-9">
                                                    <div className="light-text height-auto">
                                                        <label className="floatingTextarea2 top-11">Comments</label>
                                                        <textarea className="position-static form-control requiredinput mt-3" onChange={this.handleChange} value={this.state.formData.Comments} maxLength={500} id="txtComments" name="Comments" disabled={false} title='Comments'></textarea>
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
                                        {this.state.showToaster&&<Toaster /> }
                                        <div className="c-v-table table-head-1st-td">
                                            <TableGenerator columns={columns} data={this.state.ClientsObj} fileName={'Clients'}showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={"DelegateTo"} onRowClick={this.handleRowClicked}></TableGenerator>
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

export default Clients;