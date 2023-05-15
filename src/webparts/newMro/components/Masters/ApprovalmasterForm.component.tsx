import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType} from '../../Constants/Constants';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import { Navigate} from "react-router-dom";
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import InputText from '../Shared/InputText';
import { Web } from '@pnp/sp/webs';
import "../Shared/Menuhandler";

export interface ApprovalMasterformProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
}

export interface ApprovalMasterformState {


}

class ApprovalMasterfrom extends React.Component<ApprovalMasterformProps, ApprovalMasterformState> {
    private inputFromBudget;
    private inputToBudget;
    private inputCompany;
    private inputPlant;
    private inputDepartment;
    private siteURL: string;
    private oweb;
    private Company:string;
    constructor(props) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.inputFromBudget = React.createRef();
        this.inputToBudget = React.createRef();
        this.inputCompany = React.createRef();
        this.inputPlant = React.createRef();
        this.inputDepartment = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        if(this.siteURL.includes('mayco')){
            this.oweb = Web(this.props.spContext.siteAbsoluteUrl + "/Mayco");
            this.Company='Mayco';
            }else{
                this.oweb = this.props.spContext.siteAbsoluteUrl + "/jvis";
                this.Company ='Jvis';
            }

    }
    public state = {
        formData: {
            Company: '',
            Plant: '',
            Department:'',
            FromBudget: null,
            ToBudget: null,
            Approval1Id: null,
            Approval2Id: null,
            Approval3Id: null,
            Approval4Id: null,
            EscalationId: null,
            ReviewerId: null,
            PurchasingTeamId:null,
            InformToId:null,
            IsActive: true,
        },
        ItemID: 0,
        Approval1Email: '',
        Approval2Email: '',
        Approval3Email: '',
        Approval4Email:'',
        EscalationEmail: '',
        ReviewerEmail: '',
        PurchasingTeamEmail:'',
        InformToEmail:'',
        error: '',
        redirect: '',
        modalText: '',
        modalTitle: '',
        isSuccess: false,
        showHideModal: false,
        loading: false,
        Plants: [],
        Departments:[],
        Companys: ['Mayco', 'Jvis']
    };
    public componentDidMount() {
        highlightCurrentNav("approvalmaster");
        this.GetMasterListData();
    }
    private _getPeoplePickerItems = (event, name = '') => {
        const formData = { ...this.state.formData };
        formData[name] = event.length > 0 ? event[0].id : null;
        this.setState({ formData });
    }
    private changeInputDeatils = (event) => {
        const formData = { ...this.state.formData };
        let name = event.target.name;
        if (name != 'IsActive') {
            var numbervalue = event.target.value.trim();
            let Numberlength = numbervalue.length;
            if (isNaN(numbervalue[Numberlength - 1])) {
                numbervalue = numbervalue.slice(0, -1);
            }
            formData[name] = numbervalue;
        }
        else
            formData[name] = event.target.checked;
        this.setState({ formData });
    }

    private changeplant = (event) => {
        const formData = { ...this.state.formData };
        let name = event.target.name;
        formData[name] = event.target.value != 'None' ? event.target.value : null;
        formData['Department']='';
       this.oweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + event.target.value + "'").select("*").orderBy("Title").get().then((responce) => {  
        this.setState({ formData,Departments:responce});
    }, (Error) => {
        console.log(Error);
        this.onError();
    });  
       
    }

    private handileDeparmentchange = (event) => {
        const formData = { ...this.state.formData };
        let name = event.target.name;
        let value = event.target.value;
        formData[name] = event.target.value != 'None' ? event.target.value : null;
        this.setState({ formData});
        //let Plants;  
    }


    private SunmitData = () => {
        let data = {
            //Company: { val: this.state.formData.Company, required: true, Name: 'Company', Type: ControlType.string, Focusid: this.inputCompany },
            Plant: { val: this.state.formData.Plant, required: true, Name: 'Plant', Type: ControlType.string, Focusid: this.inputPlant },
            Department: { val: this.state.formData.Department, required: true, Name: 'Department', Type: ControlType.string, Focusid: this.inputDepartment },
            FromBudget: { val: this.state.formData.FromBudget, required: true, Name: 'From Budget', Type: ControlType.number, Focusid: this.inputFromBudget },
            ToBudget: { val: this.state.formData.ToBudget, required: true, Name: 'To Budget', Type: ControlType.number, Focusid: this.inputToBudget },
            Approval1Id: { val: this.state.formData.Approval1Id, required: true, Name: 'Approver 1', Type: ControlType.people, Focusid: 'divApproval1' },
            Approval2Id: { val: this.state.formData.Approval2Id, required: false, Name: 'Approver 2', Type: ControlType.people, Focusid: 'divApproval2' },
            Approval3Id: { val: this.state.formData.Approval3Id, required: false, Name: 'Approver 3', Type: ControlType.people, Focusid: 'divApproval3' },
            Approval4Id: { val: this.state.formData.Approval4Id, required: false, Name: 'Approver 4', Type: ControlType.people, Focusid: 'divApproval4' },
            EscalationId: { val: this.state.formData.EscalationId, required: false, Name: 'Escalation', Type: ControlType.people, Focusid: 'divEscalation' },
            InformToId: { val: this.state.formData.InformToId, required: false, Name: 'Inform To', Type: ControlType.people, Focusid: 'divInformToId' },
            PurchasingTeamId: { val: this.state.formData.EscalationId, required: false, Name: 'Purchasing Team', Type: ControlType.people, Focusid: 'divPurchasingTeam' },
            ReviewerId: { val: this.state.formData.ReviewerId, required: true, Name: 'Purchasing Manager', Type: ControlType.people, Focusid: 'divReviewer' },
        };

        const formdata = { ...this.state.formData };
        let isValid = Formvalidator.checkValidations(data);
        if (isValid.status) {
            this.checkDuplicates(formdata);


        } else {
            this.setState({ error: isValid.message });
        }
    }

    private checkDuplicates = (formData) => {
        let TrList = 'ApprovalsMatrix';
        var filterString;
        try {
            if (this.state.ItemID == 0)
                filterString = `Company eq '${formData.Company}' and Plant eq '${formData.Plant}' and  Department eq '${formData.Department}' and FromBudget eq '${formData.FromBudget}' and ToBudget eq '${formData.ToBudget}' and IsActive eq 1`;
            else
                filterString = `Company eq '${formData.Company}' and Plant eq '${formData.Plant}' and  Department eq '${formData.Department}' and FromBudget eq '${formData.FromBudget}' and ToBudget eq '${formData.ToBudget}' and IsActive eq 1 and ID ne ${this.state.ItemID}`;
            sp.web.lists.getByTitle(TrList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0)
                        this.setState({ error: 'Duplicate record not accept' });
                    else {
                        // this.insertorupdateListitem(formData, TrList);
                        this.setState({ loading: true });
                        if (this.state.ItemID == 0) {
                            try {
                                sp.web.lists.getByTitle('ApprovalsMatrix').items.add(formData)
                                    .then((res) => {
                                        this.onSucess();
                                        //console.log(res);
                                    }, (Error) => {
                                        this.onError();
                                        console.log(Error);
                                    })
                                    .catch((err) => {
                                        this.onError();
                                        console.log(err);
                                    });
                            }
                            catch (e) {
                                console.log(e);
                            }
                        } else {
                            sp.web.lists.getByTitle('ApprovalsMatrix').items.getById(this.state.ItemID).update(formData).then((res) => {
                                this.onUpdateSucess();
                                // console.log(res);
                            }, (Error) => {
                                this.onError();
                                console.log(Error);
                            }).catch((err) => {
                                this.onError();
                                console.log(err);
                            });
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

    private onSucess = () => {
        this.setState({ modalTitle: 'Success', modalText: 'Approvals submit successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0 });
    }
    private onUpdateSucess = () => {
        this.setState({ modalTitle: 'Success', modalText: 'Approvals updated successfully', showHideModal: true, loading: false, isSuccess: true, ItemID: 0 });
    }
    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, ItemID: 0
        });
    }

    private GetItemBasedData = (id) => {
        try {
            sp.web.lists.getByTitle("ApprovalsMatrix").items.getById(id).select("Id", "FromBudget", "ToBudget", "IsActive", "Approval1/EMail", "Approval1/Id", "Approval2/EMail", "Approval2/Id", "Approval3/EMail", "Approval3/Id", "Reviewer/EMail", "Reviewer/Id","Escalation/EMail","Escalation/Id").expand("Approval1", "Approval2", "Approval3", "Reviewer","Escalation").get()
                .then((response: any) => {
                    this.BindData(response);
                }).catch(e => {
                    this.onError();
                    console.log(e);
                });
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }

    private async GetMasterListData() {
        if (!this.state.loading)
            this.setState({ loading: true });
            var Plants: any = await this.oweb.lists.getByTitle('Plant').items.select("*").orderBy("Title").get();
        if (this.props.match.params.id != undefined) {
            let ItemID = this.props.match.params.id;
            let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.getById(ItemID).select("Id", "FromBudget", "ToBudget", "IsActive", "Approval1/EMail", "Approval1/Id","Approval1/Name", "Approval2/EMail", "Approval2/Id","Approval2/Name", "Approval3/EMail", "Approval3/Id","Approval3/Name","Approval4/Name","Approval4/EMail", "Approval4/Id","Escalation/Id","Escalation/Name","Escalation/EMail","PurchasingTeam/EMail","PurchasingTeam/Name", "PurchasingTeam/Id", "Reviewer/EMail","Reviewer/Name", "Reviewer/Id","InformTo/EMail","InformTo/Name", "InformTo/Id,*").expand("Approval1", "Approval2", "Approval3","Approval4", "Reviewer","Escalation","PurchasingTeam","InformTo").get();
            let company = ApprovalsMatrix['Company'];
           
            if (ApprovalsMatrix != Error) {
                let item = ApprovalsMatrix;
                const formData = { ...this.state.formData };
                formData.Company = ApprovalsMatrix['Company'];
                formData.Plant = ApprovalsMatrix['Plant'];
                formData.Department = ApprovalsMatrix['Department'];
                formData.FromBudget = ApprovalsMatrix['FromBudget'];
                formData.ToBudget = ApprovalsMatrix['ToBudget'];
                formData.Approval1Id = ApprovalsMatrix.Approval1 != undefined ? ApprovalsMatrix.Approval1.Id : null;
                formData.Approval2Id = ApprovalsMatrix.Approval2 != undefined ? ApprovalsMatrix.Approval2.Id : null;
                formData.Approval3Id = ApprovalsMatrix.Approval3 != undefined ? ApprovalsMatrix.Approval3.Id : null;
                formData.Approval4Id = ApprovalsMatrix.Approval4 != undefined ? ApprovalsMatrix.Approval4.Id : null;
                formData.EscalationId = ApprovalsMatrix.Escalation != undefined ? ApprovalsMatrix.Escalation.Id : null;
                formData.ReviewerId = ApprovalsMatrix.Reviewer != undefined ? ApprovalsMatrix.Reviewer.Id : null;
                formData.PurchasingTeamId = ApprovalsMatrix.PurchasingTeam != undefined ? ApprovalsMatrix.PurchasingTeam.Id : null;
                formData.InformToId = ApprovalsMatrix.InformTo != undefined ? ApprovalsMatrix.InformTo.Id : null;
                formData.IsActive = ApprovalsMatrix.IsActive;
                // let Approval1Email = ApprovalsMatrix.Approval1 != undefined ? ApprovalsMatrix.Approval1.EMail : null;
                // let Approval2Email = ApprovalsMatrix.Approval2 != undefined ? ApprovalsMatrix.Approval2.EMail : null;
                // let Approval3Email = ApprovalsMatrix.Approval3 != undefined ? ApprovalsMatrix.Approval3.EMail : null;
                // let ReviewerEmail = ApprovalsMatrix.Reviewer != undefined ? ApprovalsMatrix.Reviewer.EMail : null;
                let Approval1Email = ApprovalsMatrix.Approval1 != undefined ? (ApprovalsMatrix.Approval1.EMail != null ? ApprovalsMatrix.Approval1.EMail : ApprovalsMatrix.Approval1.Name): null;
                let Approval2Email = ApprovalsMatrix.Approval2 != undefined ? (ApprovalsMatrix.Approval2.EMail != null ? ApprovalsMatrix.Approval2.EMail : ApprovalsMatrix.Approval2.Name) : null;
                let Approval3Email = ApprovalsMatrix.Approval3 != undefined ? (ApprovalsMatrix.Approval3.EMail != null ? ApprovalsMatrix.Approval3.EMail : ApprovalsMatrix.Approval3.Name) : null;
                let Approval4Email = ApprovalsMatrix.Approval4 != undefined ? (ApprovalsMatrix.Approval4.EMail != null ? ApprovalsMatrix.Approval4.EMail : ApprovalsMatrix.Approval4.Name) : null;
                let EscalationEmail = ApprovalsMatrix.Escalation != undefined ? (ApprovalsMatrix.Escalation.EMail != null ? ApprovalsMatrix.Escalation.EMail : ApprovalsMatrix.Escalation.Name) : null;
                let ReviewerEmail = ApprovalsMatrix.Reviewer != undefined ? (ApprovalsMatrix.Reviewer.EMail != null ? ApprovalsMatrix.Reviewer.EMail : ApprovalsMatrix.Reviewer.Name) : null;
                let InformToEmail = ApprovalsMatrix.InformTo != undefined ? (ApprovalsMatrix.InformTo.EMail != null ? ApprovalsMatrix.InformTo.EMail : ApprovalsMatrix.InformTo.Name) : null;
                let PurchasingTeamEmail = ApprovalsMatrix.PurchasingTeam != undefined ? (ApprovalsMatrix.PurchasingTeam.EMail != null ? ApprovalsMatrix.PurchasingTeam.EMail : ApprovalsMatrix.PurchasingTeam.Name) : null;
                let Departments: any = await this.oweb.lists.getByTitle('Department').items.filter("Plant/Title eq '" + ApprovalsMatrix['Plant'] + "'").select("*").orderBy("Title").get();
                this.setState({
                    ItemID: ItemID, formData, loading: false, isEdit: true, Plants: Plants, showHideModal: false, Approval1Email: Approval1Email,
                    Approval2Email: Approval2Email, Approval3Email: Approval3Email,Approval4Email: Approval4Email,EscalationEmail: EscalationEmail,PurchasingTeamEmail:PurchasingTeamEmail, ReviewerEmail: ReviewerEmail,InformToEmail:InformToEmail,Departments:Departments
                });
            }
        } else {
            const formData = { ...this.state.formData };
            formData.Company=this.Company;
            this.setState({ loading: false, formData, isnewFormLoaded: true, ItemID: 0, isEdit: false, RequisitionerEmail: null, fileArr: [], isFormloadCompleted: true,Plants: Plants });
        }
    }

    private BindData = (response) => {
        this.setState({
            Approval1Id: response.Approval1 != undefined ? response.Approval1.Id : null,
            Approval2Id: response.Approval2 != undefined ? response.Approval2.Id : null,
            Approval3Id: response.Approval3 != undefined ? response.Approval3.Id : null,
            Approval4Id: response.Approval4 != undefined ? response.Approval4.Id : null,
            EscalationId: response.Escalation != undefined ? response.Escalation.Id : null,
            ReviewerId: response.Reviewer != undefined ? response.Reviewer.Id : null,
            Approval1Email: response.Approval1 != undefined ? response.Approval1.EMail : '',
            Approval2Email: response.Approval2 != undefined ? response.Approval2.EMail : '',
            Approval3Email: response.Approval3 != undefined ? response.Approval3.EMail : '',
            EscalationEmail: response.Escalation != undefined ? response.Escalation.EMail : '',
            PurchasingTeamEmail: response.Escalation != undefined ? response.PurchasingTeamEmail.EMail : '',
            ReviewerEmail: response.Reviewer != undefined ? response.Reviewer.EMail : '',
            FromBudget: response.FromBudget,
            ToBudget: response.ToBudget,
            ItemID: response.Id,
            IsActive: response.IsActive,
            loading: false
        });
    }

    private handleClose = () => {
        this.setState({ showHideModal: false, redirect: "/approvalmaster" });
    }

    public render() {
        if (this.state) {
            if (this.state.redirect) {
                let url = `/approvalmaster`;
                return <Navigate to={url} />;
            }
            else {
                return (

                    <React.Fragment>
                        {this.state.loading && <Loader />}
                        <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>

                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Add/Edit Approval
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>

                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Company <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Company" title="Company" value={this.state.formData.Company}  ref={this.inputCompany} disabled>
                                                        <option value=''>None</option>
                                                        {this.state.Companys.map((option) => (
                                                            <option value={option} selected={this.state.formData.Company != ''}>{option}</option>
                                                        ))}
                                                    </select>


                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Plant <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Plant" title="Plant" value={this.state.formData.Plant} onChange={this.changeplant} ref={this.inputPlant}>
                                                        <option value=''>None</option>
                                                        {this.state.Plants.map((option) => (
                                                            <option value={option.Title}  data-database ={option.Database} selected={this.state.formData.Plant != ''}>{option.Title}</option>
                                                        ))}
                                                    </select>


                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>Department <span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" required={true} name="Department" title="Department" value={this.state.formData.Department} onChange={this.handileDeparmentchange} ref={this.inputDepartment}>
                                                        <option value=''>None</option>
                                                        {this.state.Departments.map((option) => (
                                                            <option value={option.Title} selected={this.state.formData.Department != ''}>{option.Title}</option>
                                                        ))}
                                                    </select>



                                                </div>
                                            </div>

                                        </div>
                                        
                                        <div className="row pt-2 px-2">

                                            {/* <InputText
                                                type='text'
                                                label={"From Budget"}
                                                name={"FromBudget"}
                                                value={this.state.formData.FromBudget || ''}
                                                isRequired={true}
                                                onChange={this.changeInputDeatils}
                                                refElement={this.inputFromBudget}
                                                maxlength={10}
                                                onBlur={this.changeInputDeatils}
                                            /> */}

                                            <div className="col-md-4">
                                                <div className="light-text">
                                                    <label>From Budget </label>
                                                    <input maxLength={10} className="form-control" required={true} placeholder="" type="text" name="FromBudget" title="FromBudget" value={this.state.formData.FromBudget } onChange={this.changeInputDeatils} ref={this.inputFromBudget}  />
                                                </div>
                                            </div>



                                            <InputText
                                                type='text'
                                                label={"To Budget"}
                                                name={"ToBudget"}
                                                value={this.state.formData.ToBudget || ''}
                                                isRequired={true}
                                                onChange={this.changeInputDeatils}
                                                refElement={this.inputToBudget}
                                                maxlength={10}
                                                onBlur={this.changeInputDeatils}
                                            />

                                            <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Approver 1 <span className="mandatoryhastrick">*</span></label>
                                                    <div className="custom-peoplepicker" id="divApproval1">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'Approval1Id')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.Approval1Email]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row pt-2 px-2">

                                            <div className="col-md-4">
                                                <div className='light-text height-calc'>
                                                    <label>Approver 2 </label>
                                                    <div className="custom-peoplepicker" id="divApproval2">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            // disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'Approval2Id')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.Approval2Email]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Approver 3 </label>
                                                    <div className="custom-peoplepicker" id="divApproval3">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'Approval3Id')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.Approval3Email]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Approver 4 </label>
                                                    <div className="custom-peoplepicker" id="divApproval4">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'Approval4Id')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.Approval4Email]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            
                                        </div>
                                    <div className="row pt-2 px-2">

                                    <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Escalation </label>
                                                    <div className="custom-peoplepicker" id="divEscalation">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'EscalationId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.EscalationEmail]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className='light-text height-calc'>
                                                    <label>Purchasing Manager
                                                        <span className="mandatoryhastrick"> *</span>
                                                    </label>
                                                    <div className="custom-peoplepicker" id="divReviewer">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'ReviewerId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.ReviewerEmail]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Purchasing Team <span className="mandatoryhastrick">*</span> </label>
                                                    <div className="custom-peoplepicker" id="divPurchasingTeam">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'PurchasingTeamId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.PurchasingTeamEmail]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="light-text height-calc">
                                                    <label>Inform To  </label>
                                                    <div className="custom-peoplepicker" id="divInformTo">
                                                        <PeoplePicker
                                                            context={this.props.context}
                                                            titleText=""
                                                            personSelectionLimit={1}
                                                            showtooltip={false}
                                                            //disabled={false}
                                                            onChange={(e) => this._getPeoplePickerItems(e, 'InformToId')}
                                                            showHiddenInUI={false}
                                                            ensureUser={true}
                                                            required={true}
                                                            defaultSelectedUsers={[this.state.InformToEmail]}
                                                            principalTypes={[PrincipalType.User,PrincipalType.SharePointGroup]}
                                                            resolveDelay={1000} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row pt-2 px-2">
                                        <div className="col-md-4">
                                            <div className="media-px-4">
                                                <div className='row mt-3'>
                                                    <label className="col-sm-3 col-form-label p-0">Is Active</label>
                                                    <div className="col-sm-7">
                                                        <input type="checkbox" checked={this.state.formData.IsActive} onChange={this.changeInputDeatils} name="IsActive"></input>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>


                                <span className="text-validator" id="spanErrorMessage">{this.state.error}</span>
                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center mt-2" id="">
                                        <button type="button" id="btnSubmit" autoFocus={false} className="SubmitButtons btn" onClick={this.SunmitData}>Submit</button>
                                        <button type="button" id="btnCancel" className="CancelButtons btn" onClick={this.handleClose}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            }
        } else {
            return (<div>

            </div>);
        }
    }
}

export default ApprovalMasterfrom;