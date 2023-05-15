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
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "../Shared/Menuhandler";
import { Web } from '@pnp/sp/webs';

export interface NotificationsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface NotificationsState {
    formData: {
        ReminderOne: number,
        ReminderTwo: number,
        Escalation: number,
    };
    SaveUpdateText: string;
    Notifications: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewNotifications: boolean;
}

class Notifications extends Component<NotificationsProps, NotificationsState> {
    private siteURL: string;
    private ReminderOne;
    private ReminderTwo;
    private Escalation;
    private oweb;
    constructor(props: NotificationsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.ReminderOne = React.createRef();
        this.ReminderTwo = React.createRef();
        this.Escalation = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.state = {
            formData: {
                ReminderOne: null,
                ReminderTwo: null,
                Escalation: null,
            },
            SaveUpdateText: 'Submit',
            Notifications: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewNotifications: false,
        };

        if (this.siteURL.includes('mayco')) {
            this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        } else {
            this.oweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
        }
    }

    public componentDidMount() {
        highlightCurrentNav("Notifications");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({ formData: { ReminderOne: null,
                ReminderTwo: null,
                Escalation: null, }, SaveUpdateText: 'Submit', addNewNotifications: false });
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

        let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
        let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');

        formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
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
            ReminderOne: { val: this.state.formData.ReminderOne, required: true, Name: 'Reminder One', Type: ControlType.number, Focusid: this.ReminderOne },
            ReminderTwo: { val: this.state.formData.ReminderTwo, required: true, Name: 'Reminder Two', Type: ControlType.number, Focusid: this.ReminderTwo },
            Escalation: { val: this.state.formData.Escalation, required: true, Name: 'Escalation', Type: ControlType.number, Focusid: this.Escalation }
        };

        const formData = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.updateFormData(formData, id);
        } else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }

    private updateFormData = (formData, id) => {
        this.setState({ loading: true });
        if (id > 0) {                       //update existing record
            try {
            sp.web.lists.getByTitle('Notifications').items.getById(id).update(formData).then((res) => {
                this.setState({
                    modalTitle: 'Success',
                    modalText: 'Notifications updated successfully',
                    showHideModal: true,
                    isSuccess: true
                });
            });
            }catch (e) {
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

    

    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }

    private async loadListData() {
        sp.web.lists.getByTitle('Notifications').items.select("*").orderBy("Id", false).get()
            .then((response) => {
                this.setState({
                    Notifications: response.map(o => ({ Id: o.Id, ReminderOne: o.ReminderOne, ReminderTwo: o.ReminderTwo,Escalation: o.Escalation})),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false
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
            sp.web.lists.getByTitle('Notifications').items.getById(id).get()
                .then((response) => {
                    this.setState({
                        formData: { ReminderOne: response.ReminderOne, ReminderTwo: response.ReminderTwo, Escalation: response.Escalation},
                        SaveUpdateText: 'Update',
                        showLabel: false,
                        addNewNotifications: true
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
    private resetNotificationsForm = () => {
        this.setState({ formData: { ReminderOne: null,ReminderTwo: null,Escalation: null}, SaveUpdateText: 'Submit', addNewNotifications: false, showLabel: false });
        // this.props.history.push('/Notifications');
        ()=>this.props.history.push('/Notifications');
    }
    private cancelHandler = () => {
        this.resetNotificationsForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetNotificationsForm();
    }
    



    

 



    public resetImportField = () => {
        // var fileEle = document.getElementById("inputFile");
        (document.getElementById("inputFile") as HTMLInputElement).value = '';
    }


    public render() {
        let ExportExcelreportColumns = [
            {
                name: "Edit",
                selector: "Id",
            },
            {
                name: "Reminder One",
                selector: "ReminderOne",
            },
            {
                name: "Reminder Two",
                selector: "ReminderTwo",
            },
            {
                name: "Escalation",
                selector: "Escalation",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/Notifications/${record.Id}`}>
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
                name: "Reminder One",
                //selector: "ReminderOne",
                selector: (row, i) => row.ReminderOne,
                sortable: true,
                header: 'Reminder One',
                dataKey: 'ReminderOne'
            },
            {
                name: "Reminder Two",
                //selector: "ReminderTwo",
                selector: (row, i) => row.ReminderTwo,
                sortable: true,
                header: 'Reminder Two',
                dataKey: 'ReminderTwo'
            },
            {
                name: "Escalation",
                //selector: "Escalation",
                selector: (row, i) => row.Escalation,
                sortable: true,
                header: 'Escalation',
                dataKey: 'Escalation'
            }
        ];

        return (
            <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className='title'>Notifications
                                {this.state.addNewNotifications &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    {/* <div className={this.state.addNewBuyer ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2" id="">
                                            <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Buyer Name", "Buyer Code", "Status"]} filename="Buyers" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewBuyerMaster}>Add</button>
                                        </div>
                                    </div> */}
                                    <div className="c-v-table">
                                        <div className="light-box border-box-shadow m-2">
                                            <div className={this.state.addNewNotifications ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">



                                                        <InputText
                                                            type='text'
                                                            label={"Reminder One"}
                                                            name={"ReminderOne"}
                                                            value={this.state.formData.ReminderOne || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChangeNumber}
                                                            refElement={this.ReminderOne}
                                                            maxlength={3}
                                                            onBlur={this.handleonBlur}
                                                        />


                                                        <InputText
                                                            type='text'
                                                            label={"Reminder Two"}
                                                            name={"ReminderTwo"}
                                                            value={this.state.formData.ReminderTwo || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChangeNumber}
                                                            refElement={this.ReminderTwo}
                                                            maxlength={3}
                                                            onBlur={this.handleonBlur}
                                                        />
                                                        <InputText
                                                            type='text'
                                                            label={"Escalation"}
                                                            name={"Escalation"}
                                                            value={this.state.formData.Escalation || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChangeNumber}
                                                            refElement={this.Escalation}
                                                            maxlength={3}
                                                            onBlur={this.handleonBlur}
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
                                        <TableGenerator columns={columns} data={this.state.Notifications} fileName={'Notifications'} showExportExcel={false} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
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

export default Notifications;