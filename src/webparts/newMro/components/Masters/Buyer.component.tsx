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

export interface BuyerProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface BuyerState {
    formData: {
        Plant: string,
        Title: string,
        IsActive: boolean,
        Buyer_x0020_Number: number,
        Database: string,
        PlantCode: string,
        BuyerEmail: string
    };
    SaveUpdateText: string;
    buyers: any;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    addNewBuyer: boolean;
    ImportedExcelData: any;
    Plants: any;
}

class Buyer extends Component<BuyerProps, BuyerState> {
    private siteURL: string;
    private buyerName;
    private buyerNumber;
    private buyerEmail;
    private database;
    private inputPlant;
    private oweb;
    constructor(props: BuyerProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.buyerName = React.createRef();
        this.buyerNumber = React.createRef();
        this.buyerEmail = React.createRef();
        this.database = React.createRef();
        this.inputPlant = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.state = {
            formData: {
                Plant: '',
                Title: '',
                IsActive: true,
                Buyer_x0020_Number: null,
                Database: '',
                PlantCode: '',
                BuyerEmail: ''
            },
            SaveUpdateText: 'Submit',
            buyers: [],
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            addNewBuyer: false,
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
        highlightCurrentNav("Buyers");
        this.setState({ loading: true });
        this.loadListData();
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    Title: '', Plant: '', PlantCode: '',
                    Database: '',BuyerEmail:'',
                    IsActive: true, Buyer_x0020_Number: null
                }, SaveUpdateText: 'Submit', addNewBuyer: false
            });
    }
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value;
        this.setState({ formData });
    }
    // private changeplant = (event) => {
    //     const formData = { ...this.state.formData };
    //     let name = event.target.name;
    //     formData[name] = event.target.value != 'None' ? event.target.value : null;

    //     let customAttrDatabase = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-database');
    //     let customAttrPlantCode = event.currentTarget.options[event.currentTarget.selectedIndex] && event.currentTarget.options[event.currentTarget.selectedIndex].getAttribute('data-plantcode');

    //     formData['Database'] = customAttrDatabase != 'None' ? customAttrDatabase : null;
    //     formData['PlantCode'] = customAttrPlantCode != 'None' ? customAttrPlantCode : null;
    //     this.setState({ formData });
    // }
    private handleonBlur = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value.trim();
        formData[name] = value;
        this.setState({ formData });
    }
    // private handleChangeNumber = (event) => {
    //     const formData = { ...this.state.formData };
    //     const { name } = event.target;
    //     var numbervalue = event.target.value.trim();
    //     let Numberlength = numbervalue.length;
    //     if (isNaN(numbervalue[Numberlength - 1]))
    //         numbervalue = numbervalue.slice(0, -1);
    //     formData[name] = numbervalue;
    //     this.setState({ formData });
    // }

    private handleSubmit = (event) => {
        event.preventDefault();
        // this.setState({ loading: true });
        let data = {
            Plant: { val: this.state.formData.Plant, required: false, Name: 'Plant', Type: ControlType.string, Focusid: this.inputPlant },
            Database: { val: this.state.formData.Database, required: false, Name: 'Database', Type: ControlType.string, Focusid: this.database },
            buyerEmail: {val: this.state.formData.BuyerEmail, required: false, Name: 'Buyer Email', Type: ControlType.string, Focusid: this.buyerEmail},
            venderName: { val: this.state.formData.Title, required: true, Name: 'Buyer Name', Type: ControlType.string, Focusid: this.buyerName },
            venderNumber: { val: this.state.formData.Buyer_x0020_Number, required: true, Name: 'Buyer Code', Type: ControlType.string, Focusid: this.buyerNumber }
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
        let BuyersList = 'Buyers';
        var filterString;
        try {
            if (id == 0)
                filterString = `(Buyer_x0020_Number eq '${formData.Buyer_x0020_Number}') and IsActive eq '${formData.IsActive ? 1 : 0}'`;
            else
                filterString = `(Buyer_x0020_Number eq '${formData.Buyer_x0020_Number}') and IsActive ne '${formData.IsActive}' and Id ne ` + id;
            sp.web.lists.getByTitle(BuyersList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        this.setState({ showLabel: true, errorMessage: 'Duplicate record not accept' });
                    }
                    else {
                        // this.insertorupdateListitem(formData, HolidaysList);
                        this.setState({ loading: true });
                        if (id > 0) {                       //update existing record
                            //console.log(this.props);
                            sp.web.lists.getByTitle('Buyers').items.getById(id).update(formData).then((res) => {
                                this.setState({
                                    modalTitle: 'Success',
                                    modalText: 'Buyer updated successfully',
                                    showHideModal: true,
                                    isSuccess: true
                                });
                                //console.log(res);
                            });
                        }
                        else {                             //Add New record
                            try {
                                this.setState({ loading: true });
                                sp.web.lists.getByTitle('Buyers').items.add({ ...this.state.formData })
                                    .then((res) => {
                                        this.loadListData();
                                        this.resetBuyerForm();
                                        this.setState({
                                            modalTitle: 'Success',
                                            modalText: 'Buyer submitted successfully',
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


        sp.web.lists.getByTitle('Buyers').items.select("Title,*").orderBy("Id", false).getAll()
            .then((response) => {
                this.setState({
                    buyers: response.map(o => ({ Id: o.Id, Plant: o.Plant, PlantCode: o.PlantCode, Database: o.Database, Title: o.Title, IsActive: o.IsActive == true ? 'Active' : 'In-Active', Buyer_x0020_Number: o.Buyer_x0020_Number,BuyerEmail: o.BuyerEmail })),
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
            sp.web.lists.getByTitle('Buyers').items.getById(id).get()
                .then((response) => {
                    this.setState({
                        formData: {
                            Title: response.Title, Plant: response.Plant, PlantCode: response.PlantCode,
                            Database: response.Database,BuyerEmail:response.BuyerEmail,
                            IsActive: response.IsActive, Buyer_x0020_Number: response.Buyer_x0020_Number.trim()
                        },
                        SaveUpdateText: 'Update',
                        showLabel: false,
                        addNewBuyer: true
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
    private resetBuyerForm = () => {
        this.setState({
            formData: {
                Title: '', Plant: '', PlantCode: '',
                Database: '',BuyerEmail:'',
                IsActive: true, Buyer_x0020_Number: null
            }, SaveUpdateText: 'Submit', addNewBuyer: false, showLabel: false
        });
        //  this.props.history.push('/Buyers');
        () => this.props.history.push('/Buyers');
    }
    private cancelHandler = () => {
        this.resetBuyerForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
        this.resetBuyerForm();
    }
    private addNewBuyerMaster = () => {
        this.setState({ addNewBuyer: true });
    }

    public fetchImportedExcelData = (data) => {
        console.log(data);
        if (data.length > 0) {
            this.setState({ ImportedExcelData: data });
        }
    }

    public submitImportedExcelData = () => {//
        var nonDuplicateRec = [];
        var statusChangedRec = [];
        const formdata = { ...this.state };
        var BuyersData = formdata.buyers;
        var excelData = formdata.ImportedExcelData;
        if (excelData.length) {   //To remove duplicate records from Excel data
            let jsonObject = excelData.map(JSON.stringify);
            let uniqueSet: any = new Set(jsonObject);
            excelData = Array.from(uniqueSet).map((el: string) => JSON.parse(el));
        }

        for (var i = excelData.length - 1; i >= 0; i--) {
            for (var j = 0; j < BuyersData.length; j++) {
                BuyersData[j].Database=BuyersData[j].Database!=null?BuyersData[j].Database:"";
                if (excelData[i] && (excelData[i]["Buyer Code"].toLowerCase().trim() == BuyersData[j].Buyer_x0020_Number.toLowerCase().trim()) && (excelData[i]["Buyer Name"].toLowerCase().trim() == BuyersData[j].Title.toLowerCase().trim())&& (excelData[i]["Database"].toLowerCase().trim() == BuyersData[j].Database.toLowerCase().trim())) {
                    if (BuyersData[j].IsActive == excelData[i].Status) {
                        excelData.splice(i, 1);
                    } else if (BuyersData[j].IsActive != excelData[i].Status) {
                        BuyersData[j].IsActive = excelData[i].Status == "Active" ? true : false;
                        statusChangedRec.push(BuyersData[j]);
                        excelData.splice(i, 1);
                    }
                }
            }
        }
        // console.log(statusChangedRec);
        if (excelData.length) {
            excelData.forEach(item => {
                var obj = {};
                obj["Title"] = item["Buyer Name"].trim();
                obj["Plant"] = item["Plant"];
                obj["Buyer_x0020_Number"] = item["Buyer Code"].trim();
                obj["Database"] = item["Database"].trim();
                obj["IsActive"] = item.Status == "Active" ? true : false;
                obj["BuyerEmail"] = item["BuyerEmail"].trim();
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
            sp.web.lists.getByTitle('Buyers').items.getById(element.Id).update(element).then((res) => {

            }).then((res) => {
                if (!nonDuplicateRec.length) {
                    this.loadListData();
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Buyers updated successfully',
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
            let list = await sp.web.lists.getByTitle("Buyers");
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
                                    modalText: 'Buyers uploaded successfully',
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
    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }
    public ErrorFileSelect = () => {
        this.resetImportField();
        this.setState({
            loading: false,
            modalTitle: 'Alert',
            modalText: 'Invalid Buyers file selected',
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
                name: "Buyer Name",
                selector: "Title",
            },
            {
                name: "Buyer Code",
                selector: "Buyer_x0020_Number",
            },
            {
                name: "Database",
                selector: "Database",
            },
            {
                name: "Status",
                selector: "IsActive",
            },
            {
                name: "Email",
                selector: "BuyerEmail",
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/Buyers/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                header: 'Action',
                dataKey: 'Id'
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
                name: "Buyer Name",
                //selector: "Title",
                selector: (row, i) => row.Title,
                sortable: true,
                header: 'Title',
                dataKey: 'Title'
            },
            {
                name: "Buyer Code",
                // selector: "Buyer_x0020_Number",
                selector: (row, i) => row.Buyer_x0020_Number,
                sortable: true,
                header: 'Buyer Number',
                dataKey: 'Buyer_x0020_Number'
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
            },
            {
                name: "Email",
                selector: (row, i) => row.BuyerEmail,
                sortable: true,
                header: 'Email',
                dataKey: 'BuyerEmail'
            },
        ];

        return (
            <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
                        <div className="menu-icon">
                            <span>
                            </span>
                            <span>
                            </span>
                            <span>
                            </span>
                        </div>
                    </div>
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            <div className='title'>Buyers
                                {this.state.addNewBuyer &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>

                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    <div className={this.state.addNewBuyer ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2" id="">
                                            <ImportExcel ErrorFileSelect={this.ErrorFileSelect} columns={["Buyer Name", "Buyer Code","Database","Status","Email"]} filename="Buyers" onDataFetch={this.fetchImportedExcelData} submitData={this.submitImportedExcelData}></ImportExcel>

                                            <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewBuyerMaster}>Add</button>
                                        </div>
                                    </div>
                                    <div className="c-v-table table-head-1st-td">
                                        <div className="light-box border-box-shadow m-2">
                                            <div className={this.state.addNewBuyer ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">

                                                        {/* <div className="col-md-4">
                                                            <div className="light-text">
                                                                <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.changeplant} ref={this.inputPlant}>
                                                                    <option value=''>None</option>
                                                                    {this.state.Plants.map((option) => (
                                                                        <option value={option.Title} data-plantcode={option.Plant_x0020_Code} data-database={option.Database} selected={this.state.formData.Plant == option.Title}>
                                                                            {option.Plant_x0020_Code ? option.Title + " - " + option.Plant_x0020_Code : option.Title + " - "}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div> */}

                                                        <InputText
                                                            type='text'
                                                            label={"Buyer Name"}
                                                            name={"Title"}
                                                            value={this.state.formData.Title || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.buyerName}
                                                            maxlength={250}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        {/* <div className="col-md-4">
                                                        <div className="light-text">
                                                            <label>Database <span className="mandatoryhastrick">*</span></label>
                                                            <select className="form-control" required={true} name="Database" title="Database" value={this.state.formData.Database} onChange={this.handleChange} ref={this.database}>
                                                                <option value=''>None</option>
                                                                {this.state.database.map((option) => (
                                                                    <option value={option.Database} selected={this.state.formData.Database != ''}>{option.Database}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div> */}
                                                        <InputText
                                                            type='text'
                                                            label={"Buyer Code"}
                                                            name={"Buyer_x0020_Number"}
                                                            value={this.state.formData.Buyer_x0020_Number || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.buyerNumber}
                                                            maxlength={50}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        <InputText
                                                            type='text'
                                                            label={"Email"}
                                                            name={"BuyerEmail"}
                                                            value={this.state.formData.BuyerEmail || ''}
                                                            isRequired={false}
                                                            onChange={this.handleChange}
                                                            refElement={this.buyerEmail}
                                                            maxlength={60}
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
                                                            isdisable={false}
                                                        />

                                                    </div>

                                                    {/* <div className="row pt-2 px-2">
                                                        <InputText
                                                            type='text'
                                                            label={"Buyer Code"}
                                                            name={"Buyer_x0020_Number"}
                                                            value={this.state.formData.Buyer_x0020_Number || ''}
                                                            isRequired={true}
                                                            onChange={this.handleChange}
                                                            refElement={this.buyerNumber}
                                                            maxlength={50}
                                                            onBlur={this.handleonBlur}
                                                        />

                                                        <InputCheckBox
                                                            label={"Is Active"}
                                                            name={"IsActive"}
                                                            checked={this.state.formData.IsActive}
                                                            onChange={this.handleChange}
                                                        />
                                                    </div> */}
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
                                        <TableGenerator columns={columns} data={this.state.buyers} fileName={'Buyers'} showExportExcel={true} ExportExcelCustomisedColumns={ExportExcelreportColumns}></TableGenerator>
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

export default Buyer;