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
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';

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
            IsActive: true
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
                }, SaveUpdateText: 'Submit', addNewClient: false
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


    private handleSubmit = (event) => {
        event.preventDefault();
        // this.setState({ loading: true });
        let data = {
            Clinet: { val: this.state.formData.Title, required: true, Name: 'Client Name', Type: ControlType.string, Focusid: this.Client },
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
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record is not accepted'});
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);

                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle(ClientList).items.getById(id).update(formData).then((res) => {
                                // this.resetHolidayMasterForm();
                                toast.success('updated successfully');
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Client updated successfully',
                                    showHideModal: false,
                                    isSuccess: true,
                                    isRedirect: false
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle(ClientList).items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.resetHolidayMasterForm();
                                        toast.success('updated successfully');
                                        this.setState({ showHideModal: false,isRedirect:true});
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
                                        toast.error('Sorry! something went wrong');
                                        this.setState({ showHideModal: false,isRedirect:true});
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
        
        sp.web.lists.getByTitle('Client').items.select('*').orderBy("Title", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                let ExcelData = []
                for (const d of response) {
                    ExcelData.push({
                       ClientName: d.Title,
                       IsActive: d.IsActive?"Active":"In-Active",
                    })
                }
                this.setState({
                    ClientsObj: response.map(o => ({
                        Id: o.Id, ClientName: o.Title, IsActive: o.IsActive,
                    })),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false,
                    ExportExcelData : ExcelData,
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
        console.log('edit clicked', id);

        try {
            var response = await sp.web.lists.getByTitle('Client').items.getById(id).get();

            this.setState({
                formData:
                 {
                    Title: response.Title,
                  IsActive: response.IsActive
                },
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
                IsActive: true
            }, SaveUpdateText: 'Submit', addNewClient: false,isRedirect:true
        });
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
                name: "Status",
                selector: "IsActive",
            },
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
                name: "Status",
                //selector: "Database",
                selector: (row, i) => row.IsActive?"Active":"In-Active",
                sortable: true,
                header: 'Holiday Date',
                dataKey: 'HolidayDate'
            },
           
        ];
        if(this.state.isRedirect){
                return (<Navigate to={'/ClientMaster'} />);
        }
            return (
                <React.Fragment>
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

                                {this.state.loading && <Loader />}


                                <div className="row justify-content-md-left">
                                    <div className="col-12 col-md-12 col-lg-12">

                                        <div className={this.state.addNewClient ? 'mx-2 activediv' : 'mx-2'}>
                                            <div className="text-right pt-2">
                                                <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewClientMaster}>
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
                                                            />

                                                            
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
                                        <Toaster />  
                                        <div className="c-v-table table-head-1st-td">
                                            <TableGenerator columns={columns} data={this.state.ClientsObj} fileName={'Clients'}showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ExportExcelCustomisedData={this.state.ExportExcelData}></TableGenerator>
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