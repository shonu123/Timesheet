import * as React from 'react';
import { Component } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faEdit } from '@fortawesome/free-solid-svg-icons';
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
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';
import { faXmark, faEdit, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
interface HolidaysListProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface HolidaysListState {
    formData: {
        ClientName : string,
        HolidayName: string,
        HolidayDate: Date,
        Year:string,
    };
    SaveUpdateText: string;
    ClientsObj: any[];
    HolidayListObj : any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewClient: boolean;
    isNewform: boolean;
    ImportedExcelData: any;
    isRedirect: boolean;
}

class HolidaysList extends Component<HolidaysListProps, HolidaysListState> {
    private siteURL: string;
    private Client;
    private Holiday;
    private Date ;
    constructor(props: HolidaysListProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Client = React.createRef();
        this.Holiday = React.createRef();
        this.Date = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;

        this.state = {
            
            formData: {
                ClientName : '',
                HolidayName:'',
                HolidayDate: new Date(),
                Year:'',
            },
            SaveUpdateText: 'Submit',
            ClientsObj: [],
            HolidayListObj: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewClient: false,
            isNewform: true,
            ImportedExcelData: [],
            isRedirect: false,
        };

    }

    public componentDidMount() {
        highlightCurrentNav("HolidayMaster");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentDidUpdate = () => {
        if (this.state.isRedirect) {
            this.setState({isRedirect:false})
            this.loadListData();
        }
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    ClientName : '',
                    HolidayName: '',
                    HolidayDate: new Date(),
                    Year:'',
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
    private UpdateDate = (dateprops) => {
        let formData = {...this.state.formData}
        console.log(dateprops)
        let date = new Date()
        if(dateprops[0]!= null){
            date = new Date(dateprops[0])
        }
        // formData['HolidayDate'] = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        formData['HolidayDate'] = date
        this.setState({ formData });

    }

    private handleSubmit = (event) => {
        event.preventDefault();
        // this.setState({ loading: true });
        let data = {
            Clinet: { val: this.state.formData.ClientName, required: true, Name: 'Client', Type: ControlType.string, Focusid: this.Client },
            HolidayName: { val: this.state.formData.HolidayName, required: true, Name: 'Holiday Name', Type: ControlType.string, Focusid: this.Holiday },
            Date: { val: this.state.formData.HolidayDate, required: true, Name: 'Holiday Date', Type: ControlType.date, Focusid: this.Date },
        };

        const formdata = { ...this.state.formData };
        const id = this.props.match.params.id ? this.props.match.params.id : 0;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.checkDuplicates(formdata, id);
        } else {
            // this.setState({ showLabel: true, errorMessage: isValid.message });
            customToaster('toster-error',ToasterTypes.Error,isValid.message,4000)
        }
    }

    private checkDuplicates = (formData, id) => {
        let HolidaysList = 'HolidaysList';
        formData['Year'] = new Date(formData.HolidayDate).getFullYear()+""
        this.setState({formData})
        var filterString;
        let date = new Date(formData.HolidayDate)
        let prevDate = addDays(new Date(date), -1);
        let nextDate = addDays(new Date(date), 1);
        let prev = `${prevDate.getMonth() + 1}/${prevDate.getDate()}/${prevDate.getFullYear()}`
        let next = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`

        let filterQuery = "HolidayDate gt '" + prev + "' and HolidayDate lt '" + next + "'";

        try {
            if (id == 0)
                filterString = `ClientName eq '${formData.ClientName}' and ${filterQuery}`;
            else
                filterString = `ClientName eq '${formData.ClientName}' and ${filterQuery} and Id ne ` + id;
            sp.web.lists.getByTitle(HolidaysList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        let date = new Date(formData.HolidayDate)
                        let dateSelected = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                        // this.setState({ showLabel: true, errorMessage:  });
                        customToaster('toster-error',ToasterTypes.Error,'A holiday already exists on '+dateSelected+' for '+this.state.formData.ClientName,4000)

                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);

                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle(HolidaysList).items.getById(id).update(formData).then((res) => {
                                // this.resetHolidayMasterForm();
                                // toast.success('updated successfully');
                                customToaster('toster-success',ToasterTypes.Success,'updated successfully',2000)
                                this.resetHolidayMasterForm();
                                this.setState({ showHideModal: false,isRedirect:true});
                                // this.setState({
                                //     modalTitle: 'Success',
                                //     modalText: 'Holiday updated successfully',
                                //     showHideModal: false,
                                //     isSuccess: true,
                                //     isRedirect: false
                                // });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle(HolidaysList).items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.resetHolidayMasterForm();
                                        // toast.success('submitted successfully');
                                        customToaster('toster-success',ToasterTypes.Success,'submitted successfully',2000)
                                        this.resetHolidayMasterForm();
                                        this.setState({ showHideModal: false,isRedirect:true});
                                        // this.setState({
                                        //     modalTitle: 'Success',
                                        //     modalText: 'HolidaysList submitted successfully',
                                        //     showHideModal: false,
                                        //     isSuccess: true,
                                        //     isRedirect: false
                                        // });
                                    })
                                    .catch((err) => {
                                        console.log('Failed to add');
                                        // toast.error('Sorry! something went wrong');
                                        customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
                                        this.resetHolidayMasterForm();
                                        this.setState({ showHideModal: false,isRedirect:true});
                                        // this.setState({
                                        //     loading: false,
                                        //     modalTitle: 'Error',
                                        //     modalText: 'Sorry! something went wrong',
                                        //     showHideModal: true,
                                        //     isSuccess: false,
                                        //     isRedirect: false
                                        // });
                                    });
                            }
                            catch (e) {
                                console.log(e);
                                // toast.error('Sorry! something went wrong');
                                customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
                                this.setState({ showHideModal: false,isRedirect:true});
                                // this.setState({
                                //     loading: false,
                                //     modalTitle: 'Error',
                                //     modalText: 'Sorry! something went wrong',
                                //     showHideModal: true,
                                //     isSuccess: false,
                                //     isRedirect: false
                                // });
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
        var Clients = await  sp.web.lists.getByTitle('Client').items.filter("IsActive eq 1").select('*').orderBy('Title').get()
        this.setState({ClientsObj : Clients,isRedirect:false})
        console.log(Clients);
        
        sp.web.lists.getByTitle('HolidaysList').items.select('Title,*').orderBy("Id", false).getAll()
            .then((response) => {
                response.sort((a, b) => b.Id - a.Id);
                this.setState({
                    HolidayListObj: response.map(o => ({
                        Id: o.Id, ClientName: o.ClientName, HolidayName: o.HolidayName,
                         HolidayDate: `${new Date(o.HolidayDate).getMonth() + 1}/${new Date(o.HolidayDate).getDate()}/${new Date(o.HolidayDate).getFullYear()}`
                    })),
                    SaveUpdateText: 'Submit',
                    showLabel: false,
                    loading: false
                });
                // setTimeout(() => {
                //     this.setState({loading: false})
                //   }, 100);
            }).catch(err => {
                console.log('Failed to fetch data.');
                this.setState({
                    loading: false,
                    modalTitle: 'Error',
                    modalText: 'Sorry! something went wrong',
                    showHideModal: true,
                    isSuccess: false
                });
            });
    }
    private async onEditClickHandler(id) {
        console.log('edit clicked', id);

        try {
            var response = await sp.web.lists.getByTitle('HolidaysList').items.getById(id).get();

            this.setState({
                formData:
                 {
                  ClientName: response.ClientName,
                  HolidayName: response.HolidayName,
                  HolidayDate: response.HolidayDate, 
                  Year: response.Year
                },
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewClient: true
            });
            // .then((response) => {
            //     })
            //     .catch(e => {
            //         console.log('Failed to fetch :' + e);
            //     });
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetHolidayMasterForm = () => {
        this.setState({
            formData: {
                ClientName : '',
                HolidayName: '',
                // HolidayDate:`${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`,
                HolidayDate: new Date(),
                Year:'',
            }, SaveUpdateText: 'Submit', addNewClient: false,
        });
        // () => this.props.history.push('/HolidayMaster');
    }
    private cancelHandler = () => {
        this.resetHolidayMasterForm();
        this.setState({isRedirect:true})
    }
    public handleClose = () => {
        this.resetHolidayMasterForm();
        this.setState({ showHideModal: false,isRedirect:true});
    }
    private addNewHolidayMaster = () => {
        var formdata = { ...this.state.formData };
        // formdata.Company = this.Company;
        this.setState({ addNewClient: true, showLabel: false, formData: formdata });
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
        var HolidayListData = formdata.HolidayListObj;
        var excelData = formdata.ImportedExcelData;

        if (excelData.length) {   //To remove duplicate records from Excel data
            let jsonObject = excelData.map(JSON.stringify);
            let uniqueSet: any = new Set(jsonObject);
            excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
        }
        try {
            for (var i = excelData.length - 1; i >= 0; i--) {
                for (var j = 0; j < HolidayListData.length; j++) {
                   // VendorsData[j].Title= VendorsData[j].Title!=null?VendorsData[j].Title:"";
                   HolidayListData[j].ClientName=HolidayListData[j].ClientName!=null?HolidayListData[j].ClientName:"";

                    if (excelData[i] && (excelData[i]["Client Name"].toLowerCase().trim() == HolidayListData[j].ClientName.toLowerCase().trim()) &&(excelData[i]["Holiday Name"].toLowerCase().trim() == HolidayListData[j].HolidayName.toLowerCase().trim())) {

                        let excelDataDate = `${new Date(excelData[i]["Holiday Date"]).getMonth() + 1}/${new Date(excelData[i]["Holiday Date"]).getDate()}/${new Date(excelData[i]["Holiday Date"]).getFullYear()}`
                        let holidayListDate =`${new Date(HolidayListData[j].HolidayDate).getMonth() + 1}/${new Date(HolidayListData[j].HolidayDate).getDate()}/${new Date(HolidayListData[j].HolidayDate).getFullYear()}`

                         if (excelDataDate == holidayListDate) {
                            excelData.splice(i, 1);
                         } 
                         else if (excelDataDate != holidayListDate) {
                            HolidayListData[j].HolidayDate = excelDataDate;
                                statusChangedRec.push(HolidayListData[j]);
                                excelData.splice(i, 1);
                         }
                    }
                }
            }
            if (excelData.length) {
                excelData.forEach(item => {
                    var obj = {};
                    obj["ClientName"] = item["Client Name"].trim();
                    obj["HolidayName"] = item["Holiday Name"].trim();
                    obj["HolidayDate"] = new Date(item["Holiday Date"].trim());
                    obj["Year"] = `${new Date(obj["HolidayDate"]).getFullYear()}`,
                    nonDuplicateRec.push(obj);
                });
            } else if (!excelData.length && !statusChangedRec.length) {
                this.resetImportField();
                // toast.error('No new records found')
                customToaster('toster-warning',ToasterTypes.Warning,'No new records found',3000)
                // toast('No new records found', {
                //     // duration: 4000,
                //     // position: 'top-center',
                  
                //     // Styling
                //     style: {color:'#e5a05b'},
                //     // className: '',
                  
                //     // Custom Icon
                //     icon: '⚠️',
                // })
                
                this.setState({
                    loading: false,
                    // modalTitle: 'Alert',
                    // modalText: 'No new records found',
                    // showHideModal: true,
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
        catch (e) {
            console.log(e);
            // toast.error('Sorry! something went wrong')
            customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            this.setState({
                loading: false,
                // modalTitle: 'Error',
                // modalText: 'Sorry! something went wrong',
                // showHideModal: true,
                isSuccess: false
            });
        }
    }

    public updateImportExceldata = async (nonDuplicateRec, statusChangedData) => {
        statusChangedData.forEach(element => {
            sp.web.lists.getByTitle('HolidaysList').items.getById(element.Id).update(element).then((res) => {

            }).then((res) => {
                if (!nonDuplicateRec.length) {
                    // toast.success('Holidays updated successfully')
                    customToaster('toster-success',ToasterTypes.Success,'Holidays updated successfully',2000)
                    this.setState({
                        // modalTitle: 'Success',
                        // modalText: 'Holiday updated successfully',
                        // showHideModal: true,
                        isSuccess: true
                    });
                    this.resetImportField();
                    console.log(res);
                    this.loadListData();
                }else{
                    this.loadListData();
                }
            }).catch((err) => {
                console.log('Failed to add', err);
            });
        });
       //
    }

    public insertImportedExcelData = async (data) => {
        let failedrecords: any = [];
        try {
            this.setState({ loading: true });
            let list = await sp.web.lists.getByTitle("HolidaysList");
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
                                    toast.error('Failed to add');
                                    customToaster('toster-error',ToasterTypes.Error,'Failed to add',4000)
                                }
                                if (index == splitSize - 1) {
                                    this.loadListData();
                                    toast.success('Holidays uploaded successfully');
                                    customToaster('toster-success',ToasterTypes.Success,'Holidays uploaded successfully',2000)
                                    this.setState({
                                        // modalTitle: 'Success',
                                        // modalText: 'Holidays uploaded successfully',
                                        // showHideModal: true,
                                        isSuccess: true,
                                    });
                                    this.resetImportField();
                                }
                            })
                            .catch((err) => {
                                console.log('Failed to add');
                                console.log(err);
                                failedrecords.push(err);
                            });
                    });
               

            }
        }
        catch (e) {
            console.log(e);
            // toast.error('Sorry! something went wrong');
            customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            this.setState({
                loading: false,
                // modalTitle: 'Alert',
                // modalText: 'Error occured',
                // showHideModal: true,
                isSuccess: false
            });
        }
    }

    public resetImportField = () => {
        // var fileEle = document.getElementById("inputFile");
        (document.getElementById("inputFile") as HTMLInputElement).value = '';
    }
    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }
    public ErrorFileSelect = () => {
        this.resetImportField();
        // toast.error('Sorry! something went wrong');
        customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
        this.setState({
            loading: false,
            // modalTitle: 'Alert',
            // modalText: 'Invalid Holiday List file selected. File name sholud be Holidays List',
            // showHideModal: true,
            isSuccess: false
        });
    }
    public render() {
        let ExportExcelreportColumns = [
            {
                name: "Edit",
                selector: "Id",
            },
            {
                name: "Client Name",
                selector: "ClientName",
            },
            {
                name: "Holiday Name",
                selector: "HolidayName",
            },
            {
                name: "Holiday Date",
                selector: "HolidayDate",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/HolidayMaster/${record.Id}`}>
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
                name: "Holiday Name",
                //selector: "Vendor_x0020_Number",                
                selector: (row, i) => row.HolidayName,
                sortable: true,
                header: 'Holiday Name',
                dataKey: 'HolidayName'
            },
            {
                name: "Holiday Date",
                //selector: "Database",
                selector: (row, i) => row.HolidayDate,
                sortable: true,
                header: 'Holiday Date',
                dataKey: 'HolidayDate'
            },
           
        ];
        if(this.state.isRedirect){
                // let url = `/HolidayMaster/`
                //  let url = `/`
                return (<Navigate to={'/HolidayMaster'} />);
                // return redirect(url);
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
                                <div className='title'>Holidays
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
                                                <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Client Name", "Holiday Name", "Holiday Date"]} filename="Holidays List" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                                                {/* <button type="button" id="btnSubmit" className="add-button btn" onClick={this.addNewHolidayMaster}> */}
                                                <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewHolidayMaster}>
                                                    <span className='' id='addHoliday'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="c-v-table holiadyForm">
                                            <div className="light-box border-box-shadow mx-2">
                                                <div className={this.state.addNewClient ? '' : 'activediv'}>
                                                    <div className="my-2">

                                                        

                                                        <div className="row pt-2 px-2">
                                                            {/* <InputText
                                                                type='text'
                                                                label={"Client Name"}
                                                                name={"ClientName"}
                                                                value={this.state.formData.ClientName || ''}
                                                                isRequired={true}
                                                                onChange={this.handleChange}
                                                                refElement={this.Client}
                                                                maxlength={250}
                                                                onBlur={this.handleonBlur}
                                                            /> */}
                                                            <div className="col-md-4">
                                                                <div className="light-text">
                                                                    <label>Client<span className="mandatoryhastrick">*</span></label>
                                                                    <select className="form-control" required={true} name="ClientName" title="ClientName" value={this.state.formData.ClientName} onChange={this.handleChange} ref={this.Client}>
                                                                        <option value=''>None</option>
                                                                        {this.state.ClientsObj.map((option) => (
                                                                    <option value={option.Title} selected={option.Title ==this.state.formData.ClientName}>{option.Title}</option>
                                                                ))}
                                                                    </select>
                                                                </div>
                                                            </div>                                                            


                                                            <InputText
                                                                type='text'
                                                                label={"Holiday Name"}
                                                                name={"HolidayName"}
                                                                value={this.state.formData.HolidayName || ''}
                                                                isRequired={true}
                                                                onChange={this.handleChange}
                                                                refElement={this.Holiday}
                                                                maxlength={50}
                                                                onBlur={this.handleonBlur}
                                                            />
                                                            {/* <InputText
                                                                type='text'
                                                                label={"Currency"}
                                                                name={"Currency"}
                                                                value={this.state.formData.Currency || ''}
                                                                isRequired={true}
                                                                onChange={this.handleChange}
                                                                refElement={this.inputCurrency}
                                                                maxlength={50}
                                                                onBlur={this.handleonBlur}
                                                            /> */}

                                                            <div className="col-md-4">
                                                                <div className="light-text">
                                                                <label className="z-in-9">Holiday Date<span className="mandatoryhastrick">*</span></label>
                                                                    <div className="custom-datepicker" id="divDateofJoining">
                                                        
                                                                <DatePicker onDatechange={this.UpdateDate} selectedDate={new Date(this.state.formData.HolidayDate)}/>
                                                                </div>
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
                                            <TableGenerator columns={columns} data={this.state.HolidayListObj} fileName={'Holidays List'}showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns} ></TableGenerator>
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

export default HolidaysList;