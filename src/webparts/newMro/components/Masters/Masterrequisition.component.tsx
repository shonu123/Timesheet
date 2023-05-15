import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import MasterRequisitionList from './MasterRequisitionList.component';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import Loader from '../Shared/Loader';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { Web } from '@pnp/sp/webs';

export interface MasterRequisitionProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MasterRequisitionState {
}

class MasterRequisition extends React.Component<MasterRequisitionProps, MasterRequisitionState> {
    private siteURL: string;
    private sitecollectionURL: string;
    private selectedPlant: any = {};
    private userContext: any = {};
    private Company;
    private Plant;
    private buyercode;
    private ddlProjectCode;
    private ddlCommodityCategory;
    private description;

    public state = {
        formData: {
            Plant: '',
            Company: '',
            BuyerCode: '',
            CommodityCategoryCode: '',
            ProjectCode: '',
            Description: '',
        },
        RequisitionerUserId:null,
        Requisitioner: '',
        ProjectCode: [],
        CommodityCategory: [],
        plants: [],
        requisitionData: [],
        RequisitionerEmail: '',
        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewRequisitioner: false,
        isEdit: false,
        Buyers:[],
        Companys:['Mayco','jvis'],
    };

    constructor(props: MasterRequisitionProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.userContext = this.props.spContext;
        this.sitecollectionURL = this.props.spContext.siteAbsoluteUrl + "/Mayco";
        //console.log('current siteurl', this.siteURL);
        sp.setup({
            spfxContext: this.props.context
        });
        this.Company = React.createRef();
        this.Plant = React.createRef();
        this.buyercode = React.createRef();
        this.ddlProjectCode = React.createRef();
        this.ddlCommodityCategory = React.createRef();
        this.description = React.createRef();
    }
    public componentDidMount() {
        this.setState({ loading: true });
        this.GetMasterListData(); 
    }


    //#region  handle Evnts
    private handleChange = (event) => {
        const formData = { ...this.state.formData };
        const { name } = event.target;
        const value = event.target.value;
        formData[name] = value != 'None' ? value : null;
        this.setState({ formData});
    }



    private handileCompnaychange =(event) =>{
        const formData = { ...this.state.formData };
        let name =event.target.name;
        let value = event.target.value;
        formData[name] = event.target.value !='None'?event.target.value:'';
        //let Plants;
        let oweb;
        if(value == 'Mayco')
        oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        else
        oweb = Web(this.props.spContext.siteAbsoluteUrl + "/jvis");
        oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get().then((res) => {
           let Plants=value != ''?res:[];
            this.setState({formData,plants:Plants});
        }, (Error) => {
            console.log(Error);
            //this.onError();
        });

    }

    private _getPeoplePickerItems(items,name) {
        let RequisitionerUserId= null;
        if(items.length>0){
            RequisitionerUserId=items[0].id;
        }
        else{
            RequisitionerUserId=null;
        }
        this.setState({RequisitionerUserId:RequisitionerUserId});
    }

    private addNewRequisitioner = () => {
        this.setState({ addNewRequisitioner: true });
    }

    private handleSubmit = event => {
        event.preventDefault();
        let data = {
            Company: { val: this.state.formData.Company, required: true, Name: 'Company', Type: ControlType.string, Focusid: this.Company },
            plant: { val: this.state.formData.Plant, required: true, Name: 'Plant', Type: ControlType.string, Focusid: this.Plant },
            Requisitioner: { val: this.state.RequisitionerUserId, required: true, Name: 'Requisitioner', Type: ControlType.people, Focusid: 'divRequisitioner' },
            buyerCode: { val: this.state.formData.BuyerCode, required: true, Name: 'Buyer', Type: ControlType.string, Focusid: this.buyercode },
            projectCode: { val: this.state.formData.ProjectCode, required: true, Name: 'Project code', Type: ControlType.string, Focusid: this.ddlProjectCode },
            commodityCategoryCode: { val: this.state.formData.CommodityCategoryCode, required: true, Name: 'Commodity category', Type: ControlType.string, Focusid: this.ddlCommodityCategory },
            description: { val: this.state.formData.Description, required: true, Name: 'Description/Reason', Type: ControlType.string, Focusid: this.description }, };

        const formdata = { ...this.state.formData,RequisitionerId:this.state.RequisitionerUserId};
        const id = this.props.match.params.id;

        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.setState({ loading: true });
            if (id > 0) {                //update existing record
                sp.web.lists.getByTitle('RequisitionMaster').items.getById(id).update(formdata).then((res) => {
                    this.setState({
                        modalTitle: 'Success',
                        modalText: 'Master Requisition updated successfully',
                        showHideModal: true,
                        isSuccess: true
                    });
                    //console.log(res);
                });

            } else {                  //Add New record
                try {
                    this.setState({ loading: true });
                    sp.web.lists.getByTitle('RequisitionMaster').items.add(formdata).then((res) => {
                         let itemId = res.data.Id;
                        // this.loadListData();
                        // this.resetMasterForm();
                        this.setState({
                            modalTitle: 'Success',
                            modalText: 'Master Requisition submitted successfully',
                            showHideModal: true,
                            isSuccess: true
                        });

                    }, (error) => {
                        console.log(error);
                    });
                }
                catch (e) {
                    console.log('Failed to add');
                    this.setState({
                        loading: false,
                        modalTitle: 'Error',
                        modalText: 'Sorry! something went wrong',
                        showHideModal: true,
                        isSuccess: false
                    });
                }

            }
        }
        else {
            this.setState({ showLabel: true, errorMessage: isValid.message });
        }
    }

    private onEditClickHandler = (id) => {
        console.log('edit clicked', id);
        try {
            sp.web.lists.getByTitle('RequisitionMaster').items.getById(id).select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/UserName', '*').expand('Requisitioner').get()
                .then((response) => {
                    let oweb;
        if(response.Company == 'Mayco')
        oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
        else
        oweb = Web(this.props.spContext.siteAbsoluteUrl + "/jvis");
        oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get().then((res) => {
           let Plants=response.Company != ''?res:[];
           this.setState({
            formData: { Plant: response.Plant, Company: response.Company, BuyerCode: response.BuyerCode, CommodityCategoryCode: response.CommodityCategoryCode, ProjectCode: response.ProjectCode, Description: response.Description },
            Requisitioner: response.Requisitioner.Title,
            SaveUpdateText: 'Update',
            RequisitionerEmail: response.Requisitioner.UserName,
            addNewRequisitioner: true,
            plants:Plants
        });
        }, (Error) => {
            console.log(Error);
            //this.onError();
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


    //#endregion
   

    //#region Load Data
    private async GetMasterListData() {
        let maycoweb = Web(this.sitecollectionURL);
        let projectCode: any = await sp.web.lists.getByTitle('ProjectCode').items.select('*').orderBy('Project_x0020_Code').get();
        let commodityCategory: any = await sp.web.lists.getByTitle('CommodityCategory').items.select('*').orderBy('Title').get();
        //let Plants: any = await maycoweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        let requisitionData:any =await sp.web.lists.getByTitle('RequisitionMaster').items.expand('Requisitioner').select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/EMail', '*').orderBy('Modified',false).get();
        var Buyers: any = await sp.web.lists.getByTitle('Buyers').items.select("*").orderBy('Title').get();
        let data =requisitionData.map(o => ({ Id: o.Id, Plant: o.Plant, Company: o.Company, Requisitioner: o.Requisitioner ? o.Requisitioner.Title : '', BuyerCode: o.BuyerCode, CommodityCategoryCode: o.CommodityCategoryCode, ProjectCode: o.ProjectCode, Description: o.Description }));

        this.setState({ ProjectCode: projectCode, CommodityCategory: commodityCategory,Buyers:Buyers , RequisitionerEmail: this.userContext.userEmail, requisitionData:data,SaveUpdateText: 'Submit',showLabel: false,loading: false,RequisitionerUserId:this.userContext.userId });
    }
    

    private loadListData = () => {
        sp.web.lists.getByTitle('RequisitionMaster').items.select('Requisitioner/Id', 'Requisitioner/Title', 'Requisitioner/EMail', '*').expand('Requisitioner').orderBy('Modified',false).get().then((response) => {
            //console.log(response);
            this.setState({
                requisitionData: response.map(o => ({ Id: o.Id, Plant: o.Plant, Company: o.Company, Requisitioner: o.Requisitioner ? o.Requisitioner.Title : '', BuyerCode: o.BuyerCode, CommodityCategoryCode: o.CommodityCategoryCode, ProjectCode: o.ProjectCode, Description: o.Description })),
                SaveUpdateText: 'Submit',
                showLabel: false,
                loading: false
            });
        }, (error) => {
            console.log(error);
        });
    }
    //#endregion

    
    private cancelHandler = () => {
        this.resetMasterForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false,addNewRequisitioner:false });
        this.loadListData();
    }
    private resetMasterForm = () => {
        this.setState({
            formData: {
                Plant: '',
                Company: '',
                RequisitionerId: null,
                BuyerCode: '',
                CommodityCategoryCode: '',
                ProjectCode: '',
                Description: ''
            },
            SaveUpdateText: 'Submit',
            addNewRequisitioner: false
        });
    }
    
    public render() {
        return (
            <React.Fragment>
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                <div id="content" className="content p-2 pt-2">
                    <div className="container-fluid">
                        <div className="FormContent">

                            <div className="title">Master Requisition
                                    <div className="mandatory-note" hidden={!this.state.addNewRequisitioner}><span className="mandatoryhastrick">*</span> indicates a required field</div>
                            </div>
                            <div className="after-title"></div>

                            {this.state.loading && <Loader />}

                            <div className='mx-2' hidden={this.state.addNewRequisitioner}>
                                <div className="text-right pt-2" id="">
                                    <button type="button" id="btnSubmit" className="SubmitButtons btn" onClick={this.addNewRequisitioner}>Add</button>
                                </div>
                            </div>

                            <div className="light-box border-box-shadow mx-2">
                                <div hidden={!this.state.addNewRequisitioner}>
                                <div>
                <div className="my-2">
                    <div className="row pt-2 px-2">
                    <div className="col-md-4">
                            <div className="light-text">
                                <label>Company <span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" required={true} name="Company" title="Company" value={this.state.formData.Company} onChange={this.handileCompnaychange} ref={this.Company}>
                                <option value=''>None</option>
                                {this.state.Companys.map((option) => (
                                    <option value={option} selected={this.state.formData.Company !=''}>{option}</option>
                                ))}
                            </select>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="light-text">
                                <label>Plant <span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.handleChange} ref={this.Plant}>
                                <option value=''>None</option>
                                {this.state.plants.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.Plant !=''}>{option.Title}</option>
                                ))}
                            </select>

                                
                            </div>
                        </div>

                        <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Requisitioner <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divRequisitioner">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={true}
                                                            disabled={this.state.isEdit}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'RequisitionerId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.RequisitionerEmail]}
                                                            principalTypes={[PrincipalType.User]} placeholder="Requisitioner"
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>
                    </div>

                    <div className="row pt-2 px-2">

                    <div className="col-md-4">
                            <div className="light-text">
                                <label>Buyer <span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" required={true} name="BuyerCode" title="Buyer" value={this.state.formData.BuyerCode} onChange={this.handleChange} ref={this.buyercode}>
                                <option value=''>None</option>
                                {this.state.Buyers.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.BuyerCode !=''}>{option.Title}</option>
                                ))}
                            </select>

                                
                            </div>
                        </div>

                        

                        {/* <div className="col-md-4">
                            <div className="light-text">
                                <label>Commodity Category Code <span className="mandatoryhastrick">*</span></label>
                                <input className="form-control requiredinput numericonly" onChange={this.handleChange} name='CommodityCategoryCode' value={this.state.formData.CommodityCategoryCode || ''} placeholder="" type="text" maxLength={255} ref={this.commodityCategoryCode} />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="light-text">
                                <label>Project Code <span className="mandatoryhastrick">*</span></label>
                                <input className="form-control" onChange={this.handleChange} name='ProjectCode' value={this.state.formData.ProjectCode || ''} placeholder="" type="text" maxLength={255} ref={this.projectcode} />
                            </div>
                        </div> */}
                        <div className="col-md-4">
                            <div className="light-text">
                                <label>Project Code <span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" name="ProjectCode" ref={this.ddlProjectCode} title="ProjectCode" onChange={this.handleChange} >
                                    <option>None</option>
                                    {this.state.ProjectCode.map((item, index) => <option key={index} value={item.Project_x0020_Code} selected={item.Project_x0020_Code == this.state.formData.ProjectCode}>{item.Project_x0020_Code}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="light-text">
                                <label>Commodity Category<span className="mandatoryhastrick">*</span></label>
                                <select className="form-control" value={this.state.formData.CommodityCategoryCode} name="CommodityCategoryCode" ref={this.ddlCommodityCategory} title="Commodity Category" onChange={this.handleChange} >
                                    <option>None</option>
                                    {this.state.CommodityCategory.map((option) => (
                                    <option value={option.Title} selected={this.state.formData.CommodityCategoryCode !=''}>{option.Title}</option>
                                ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="light-text">
                            <label className="floatingTextarea2">Description/Reason <span className="mandatoryhastrick">*</span></label>
                            <textarea className="form-control requiredinput" onChange={this.handleChange} value={this.state.formData.Description || ''} placeholder="" maxLength={500} id="txtTargetDescription" name="Description" ref={this.description}></textarea>
                        </div>
                    </div>

                </div>

                {this.state.showLabel &&
                    <div>
                        <span className='text-validator'> {this.state.errorMessage}</span>
                    </div>
                }

                <div className="row mx-1" id="">
                    <div className="col-sm-12 text-center mt-2" id="">
                        <button type="button" className="SubmitButtons btn" onClick={this.handleSubmit}>{this.state.SaveUpdateText}</button>
                        <button type="button" className="CancelButtons btn" onClick={this.cancelHandler}>Cancel</button>
                    </div>
                </div>
            </div>
                                </div>
                            </div>

                            <div className="light-box border-box-shadow mx-2">
                                <MasterRequisitionList {...this.props} MasterRequisitions={this.state.requisitionData} onEditHandler={this.onEditClickHandler}></MasterRequisitionList>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
    
}

export default MasterRequisition;