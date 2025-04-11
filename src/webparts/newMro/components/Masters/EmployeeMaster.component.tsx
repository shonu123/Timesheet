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
import SearchableDropdown from '../Shared/SearchableDropdown';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ImportExcel from '../Shared/ImportExcel';
import DatePicker from "../Shared/DatePickerField";
import { addDays } from 'office-ui-fabric-react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import ModalPopUpConfirm from '../Shared/ModalPopUpConfirm';

interface EmployeeProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
interface EmployeeState {

}

class Employee extends Component<EmployeeProps, EmployeeState> {
    private siteURL: string;
    private EmployeeClassification;
    private Comments;
    constructor(props: EmployeeProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.EmployeeClassification = React.createRef();
        this.Comments = React.createRef();
        this.siteURL = this.props.spContext.webAbsoluteUrl;
    }
    public state = {
        formData: {
            EmployeeId: null,
            DateOfJoining: new Date(),
            EmployeeClassification: '',
            Policy: 'None',
            Hours: '',
            EligibleforPTO: false,
            IsActive: true,
            CommentsHistory:[],

        },
        currentTab:1,
        FileName:"Active Employees",
        showInactiveTab:true,

        Comments:'',
        Experience:'',
        EmployeesData: [],
        ExportExcelData: [],
        EmployeeClassificationObject: [],
        PolicyObject:[],
        PreviousPTOBalance:0,
        PreviousPTOAfterDeduction:0,
        PreviousEligibleforPTO:false,

        showConfirmPopup:false,
        ConfirmPopupMessage:'',
        SaveUpdateText: 'Submit',
        showLabel: false,
        errorMessage: '',
        loading: false,
        showHideModal: false,
        modalText: '',
        modalTitle: '',
        isSuccess: true,
        addNewEmployee: false,
        isNewform: true,
        isRedirect: false,
        isPageAccessable:true,
        showToaster: false,
        EmployeeEmail: ''
    };

    public componentDidMount() {
        highlightCurrentNav("EmployeeMaster");
        this.setState({ loading: true });
        this.loadListData(this.state.currentTab);
    }
    public componentDidUpdate = () => {
        if (this.state.isRedirect) {
            this.loadListData(this.state.currentTab);
        }
        //for highlight Active tab ,when form open and click on top navigation Employee Matrix
        if (this.state.currentTab == 1)
            document.getElementById('Active-tab')?document.getElementById('Active-tab').classList.add('active'):'';
        else if(this.state.currentTab == 0)
        document.getElementById('In-Active-tab')?document.getElementById('In-Active-tab').classList.add('active'):'';
        else if(this.state.currentTab == -1)
        document.getElementById('PTOEligible-tab')?document.getElementById('PTOEligible-tab').classList.add('active'):'';
    }
    public componentWillReceiveProps(newProps) {
        if (newProps.match.params.id == undefined)
            this.setState({
                formData: {
                    EmployeeId: null,
                    DateOfJoining: new Date(),
                    EmployeeClassification: '',
                    Policy: 'None',
                    Hours: '',
                    EligibleforPTO: false,
                    IsActive: true,
                    CommentsHistory:[],
                },
                Comments:'',
                Experience:'',
                SaveUpdateText: 'Submit',
                addNewEmployee: false,   
                EmployeeEmail: ''
            });
    }
    private handleChange = async (event,actionMeta?) => {
        const formData = { ...this.state.formData };
        // const { name } = event.target;
        // let inputvalue = event.target.value;
        // let value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        let  name,inputvalue,value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if(![null, undefined].includes(event) && event.target != undefined)
        {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        }
        else if(actionMeta!= undefined)
        {
            name = actionMeta.name;
            value =actionMeta.action =='clear'?'': event.value; 
        }
        if (name == 'EmployeeClassification') {
            let SelectedCalssification = this.state.EmployeeClassificationObject.find((option) => option.Title == value)
            if (SelectedCalssification != undefined) {
                formData['EligibleforPTO'] = SelectedCalssification.PTO;
                formData['Policy'] = 'None';
                formData['Hours'] = '';
                this.setState({ formData: formData });
            }
            else {
                formData['EligibleforPTO'] = false;
                formData['Policy'] = 'None';
                formData['Hours'] = '';
                this.setState({ formData: formData });
            }
        }
        else if(name == 'Comments')
        {
            this.setState({ Comments:value });   
        }
        else if(name == 'Policy')
        {
            //This can be for binding current month credited hours on change of Policy
            let isDOJInCurrMonth=false;
            if(`${formData.DateOfJoining.getMonth()+1}/${formData.DateOfJoining.getFullYear()}`==`${new Date().getMonth()+1}/${new Date().getFullYear()}`)
            isDOJInCurrMonth=true;
            let PTOHoursToGrant =isDOJInCurrMonth? await this.getHoursToBeGrant(formData.DateOfJoining,value):0; 
            formData['Hours'] = PTOHoursToGrant.toString();   
        }
        else if(name=='Hours')
        {
            value = value.match(/\d{0,3}(\.\d{0,4})?/)[0];
        }
        name == 'Comments'?'':formData[name] = value;
        this.setState({ formData });
    }
    private UpdateDate = (dateprops) => {
        let formData = this.state.formData;
        let date = new Date()
        if (dateprops[0] != null) {
            date = new Date(dateprops[0])
        }
        formData['DateOfJoining'] = date;
        let ExpInDays=this.getExpInDays(date);
        let ExpInYearMonth=this.getExpYearMonthFormate(ExpInDays,date);
        // formData['EmployeeClassification'] = '';
        // formData['Policy'] = 'None';
        // formData['Hours'] = '';
        this.setState({ formData: formData,Experience:ExpInYearMonth });

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
    private checkDuplicates = async (formData, id) => {
        let EmployeeList = 'Employees';
        let filterString = '';
        let isDulicated=false;
        try {
            if (id == 0)
                filterString = `EmployeeId eq '${formData.EmployeeId}' and IsActive eq '1'`;
            else
                filterString = `EmployeeId eq '${formData.EmployeeId}' and  IsActive eq '1' and Id ne ` + id;
          await  sp.web.lists.getByTitle(EmployeeList).items.filter(filterString).get().
                then((response: any[]) => {
                    if (response.length > 0) {
                        isDulicated=true;
                        // this.setState({ loading: false });
                        // customToaster('toster-error', ToasterTypes.Error, 'Duplicate record is not accepted', 4000)
                    }
                    // else {
                    //     this.InsertorUpdatedata(formData, id, EmployeeList);
                    // }
                });
        }
        catch (e) {
            this.onError();
            console.log(e);
        }
        return isDulicated;
    }
    // this function is used save data in the list
    private showConfirmSubmitOrUpdate = async (event) => {
        //new condition for instance action without refreshing
            // if ([null, undefined, ""].includes(this.state.trFormdata.Comments.trim())) {
            //     customToaster('toster-error', ToasterTypes.Error, 'Comments cannot be blank.', 4000)
            //     document.getElementById("txtComments").focus();
            //     document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
            // }
            // else {
            //     this.setState({ showConfirmPopup: true, ConfirmPopupMessage: 'Are you sure you want to Submit?'});
            // }
            //event.preventDefault();
            //this.setState({ loading: true });
            let data = {
                Employee: { val: this.state.formData.EmployeeId, required: true, Name: 'Employee', Type: ControlType.people, Focusid: 'divEmployee' },
                DateOfJoining: { val: this.state.formData.DateOfJoining, required: true, Name: 'Date Of Joining', Type: ControlType.date },
                EmployeeClassification: { val: this.state.formData.EmployeeClassification, required: true, Name: 'Employee Classification', Type: ControlType.reactSelect, Focusid: 'EmployeeClassification'},
            };
            const formdata = { ...this.state.formData };
            const id = this.props.match.params.id ? this.props.match.params.id : 0;
    
            let isValid = Formvalidator.checkValidations(data);
            if (isValid.status) {
                if (this.state.formData.EligibleforPTO && this.state.formData.Policy == 'None') {
                    let errMsg = 'Policy cannot be blank.';
                    customToaster('toster-error', ToasterTypes.Error, errMsg, 4000);
                    document.getElementById('Policy').focus();
                    document.getElementById('Policy').classList.add('mandatory-FormContent-focus');
                    //this.setState({ loading: false });
                }
                // else if(id>0 && this.state.Comments.trim()=='')
                // {
                //     let errMsg = 'Comments cannot be blank.';
                //     customToaster('toster-error', ToasterTypes.Error, errMsg, 4000);
                //     document.getElementById('txtComments').focus();
                //     document.getElementById('txtComments').classList.add('mandatory-FormContent-focus'); 
                //     //this.setState({ loading: false });      
                //  }
                else {
                   let isDuplicated=await this.checkDuplicates(formdata, id);
                   if(isDuplicated)
                   {
                     //this.setState({ loading: false });
                     customToaster('toster-error', ToasterTypes.Error, 'Duplicate record is not accepted', 4000)
                   }
                   else{
                     let PreviousPTOHours=this.state.PreviousPTOAfterDeduction;
                     let UpdatedPTOHours=Number(this.state.formData.Hours);
                     let PreviousEligibleforPTO=this.state.PreviousEligibleforPTO;
                     let UpdatedEligibleforPTO=this.state.formData.EligibleforPTO;
                        //   if(![0,''].includes(this.state.formData.Hours))
                        //   {
                        //     this.setState({ showConfirmPopup: true, ConfirmPopupMessage: `'${this.state.formData.Hours}' PTO hours will be credited . Are you sure you want to ${this.state.SaveUpdateText.toLowerCase()}?`});
                        //   }
                        //   if(PreviousPTOHours!=UpdatedPTOHours || (PreviousEligibleforPTO!=UpdatedEligibleforPTO && id>0))
                          if(PreviousPTOHours!=UpdatedPTOHours)
                          {
                            let PopupMessage=''; 
                            // if((PreviousEligibleforPTO!=UpdatedEligibleforPTO && id>0))
                            // {
                            //     PopupMessage=`'Is Employee Eligible for PTO' updated`;
                            //    if(PreviousPTOHours!=UpdatedPTOHours)
                            //    PopupMessage+=` and `;
                            // }

                            if(UpdatedPTOHours-PreviousPTOHours>0)
                            PopupMessage+=`'${parseFloat((UpdatedPTOHours-PreviousPTOHours).toFixed(4))}' PTO hours will be credited . Are you sure you want to ${this.state.SaveUpdateText.toLowerCase()}?`;
                            else if(UpdatedPTOHours-PreviousPTOHours<0)
                            PopupMessage+=`'${parseFloat((PreviousPTOHours-UpdatedPTOHours).toFixed(4))}' PTO hours will be deducted . Are you sure you want to ${this.state.SaveUpdateText.toLowerCase()}?`;
                            else
                            PopupMessage+=`. Are you sure you want to ${this.state.SaveUpdateText.toLowerCase()}?`;

                            this.setState({ showConfirmPopup: true, ConfirmPopupMessage: PopupMessage });
                          }
                          else{
                            this.state.formData.CommentsHistory.push({"User": this.props.spContext.userDisplayName,"Date": new Date().toISOString(),"Comments": this.state.Comments.trim()});
                            this.setState({ loading: true });
                            this.InsertorUpdatedata();
                          }
                   }
                }
            }
            else {
                this.setState({ loading: false });
                customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            }
    }
    private handleSubmitUpdate=()=>{
        this.state.formData.CommentsHistory.push({"User": this.props.spContext.userDisplayName,"Date": new Date().toISOString(),"Comments": this.state.Comments.trim()});
        this.setState({ loading: true,showConfirmPopup:false,ConfirmPopupMessage:'' });
        this.InsertorUpdatedata();
    }
    private async InsertorUpdatedata() {
       let formdata=this.state.formData;
       let ItemId=this.props.match.params.id ? this.props.match.params.id : 0;
       let EmployeeList='Employees';
       let  PTOfilterQuery='Employee/ID eq '+ formdata.EmployeeId+' and Year eq '+(new Date().getFullYear());
        let [EmpPTORecord, EmpApprovalMatrixRecords] = await Promise.all([
            sp.web.lists.getByTitle('EmployeePTO').items.filter(PTOfilterQuery).select('Employee/ID,Employee/Title,*').expand('Employee').get(),
            sp.web.lists.getByTitle('EmployeeMaster').items.filter('Employee/ID eq ' + formdata.EmployeeId).select('Employee/ID,Employee/Title,*').expand('Employee').orderBy('Title').getAll()
        ])
        let DOJ = `${this.state.formData.DateOfJoining.getMonth() + 1}/${this.state.formData.DateOfJoining.getDate()}/${this.state.formData.DateOfJoining.getFullYear()}`;
      let  EmpPostData={
            EmployeeId: formdata.EmployeeId,
            DateOfJoining: this.addBrowserwrtServer(new Date(DOJ)),
            EmployeeClassification: formdata.EmployeeClassification,
            Policy: formdata.Policy,
            Hours: formdata.Hours.toString(),
            EligibleforPTO: formdata.EligibleforPTO,
            IsActive: formdata.IsActive,
            CommentsHistory:JSON.stringify(formdata.CommentsHistory),

        }
        const batchApprovalMatrix = sp.web.createBatch();
        let PreviousPTOHours=this.state.PreviousPTOAfterDeduction;
        let UpdatedPTOHours=Number(formdata.Hours);
        let EmpPTODataApprMtrx = {
            EmployeeClassification: this.state.formData.EmployeeClassification,
            Policy: this.state.formData.Policy,
            EligibleforPTO: this.state.formData.EligibleforPTO,
            IsActive: this.state.formData.IsActive,
        }
        let EmpPTOData = {
            EmployeeId: this.state.formData.EmployeeId,
            DateOfJoining: this.addBrowserwrtServer(new Date(new Date(DOJ).getMonth() + 1 + "/" + new Date(DOJ).getDate() + "/" + new Date(DOJ).getFullYear())),
            // this.addBrowserwrtServer(new Date(DOJ)),
            EmployeeClassification: this.state.formData.EmployeeClassification,
            Policy: this.state.formData.Policy,
            EligibleforPTO: this.state.formData.EligibleforPTO,
            IsActive: this.state.formData.IsActive,
            Year:new Date().getFullYear().toString()
        }
        let PTOTransactionforHours={
            EmployeeId:this.state.formData.EmployeeId,
            TransactionType: UpdatedPTOHours-PreviousPTOHours>0?"Granted":"Deducted",
            PostedOn:new Date(),
            // Hours:formdata.Hours,
            Hours: UpdatedPTOHours-PreviousPTOHours>0?(UpdatedPTOHours-PreviousPTOHours).toFixed(4):(PreviousPTOHours-UpdatedPTOHours).toFixed(4),
            PreviousPTOBalance:(PreviousPTOHours).toString(),
            CurrentPTOBalance:(UpdatedPTOHours).toString(),
            Reason:this.state.Comments,
            Year:new Date().getFullYear().toString()
        }
        if(PreviousPTOHours!=UpdatedPTOHours)
        {
            if(EmpPTORecord.length)
            {
                // EmpPTOData['PTOGranted']=(parseFloat(formdata.Hours)+([null,undefined,''].includes(EmpPTORecord[0].PTOGranted)?0:parseFloat(EmpPTORecord[0].PTOGranted))).toFixed(4);
                // EmpPTOData['PTOBalance']=(parseFloat(formdata.Hours)+([null,undefined,''].includes(EmpPTORecord[0].PTOBalance)?0:parseFloat(EmpPTORecord[0].PTOBalance))).toFixed(4);
                // EmpPTOData['PTOBalanceAfterDeduction']=(parseFloat(formdata.Hours)+([null,undefined,''].includes(EmpPTORecord[0].PTOBalanceAfterDeduction)?0:parseFloat(EmpPTORecord[0].PTOBalanceAfterDeduction))).toFixed(4);
                EmpPTOData['PTOGranted']=((UpdatedPTOHours-PreviousPTOHours)+([null,undefined,''].includes(EmpPTORecord[0].PTOGranted)?0:parseFloat(EmpPTORecord[0].PTOGranted))).toFixed(4);
                EmpPTOData['PTOBalance']=((UpdatedPTOHours-PreviousPTOHours)+([null,undefined,''].includes(EmpPTORecord[0].PTOBalance)?0:parseFloat(EmpPTORecord[0].PTOBalance))).toFixed(4);
                EmpPTOData['PTOBalanceAfterDeduction']=((UpdatedPTOHours-PreviousPTOHours)+([null,undefined,''].includes(EmpPTORecord[0].PTOBalanceAfterDeduction)?0:parseFloat(EmpPTORecord[0].PTOBalanceAfterDeduction))).toFixed(4);
            }
            else{
                EmpPTOData['PTOGranted']=formdata.Hours;
                EmpPTOData['PTOBalance']=formdata.Hours;
                EmpPTOData['PTOBalanceAfterDeduction']=formdata.Hours;
            }
           
        }
        if (ItemId > 0) {    //update existing record
            for (const Emp of EmpApprovalMatrixRecords) {
                // Queue update operation for each item in the ApprovalMatrix
                sp.web.lists.getByTitle('EmployeeMaster').items.getById(Emp.Id).inBatch(batchApprovalMatrix).update(EmpPTODataApprMtrx);
            }
            await batchApprovalMatrix.execute(); //Execute in batch
            sp.web.lists.getByTitle(EmployeeList).items.getById(ItemId).update(EmpPostData).then((res) => {
                //update EmployeePTO data
                if(EmpPTORecord.length)
                {
                sp.web.lists.getByTitle('EmployeePTO').items.getById(EmpPTORecord[0].ID).update(EmpPTOData).then((res) => 
                {
                    //console.log("EmployeePTO Record updated successfully");
                    if(PreviousPTOHours!=UpdatedPTOHours)
                    {
                        sp.web.lists.getByTitle('PTOTransactions').items.add(PTOTransactionforHours).then((EmpPTOres) => 
                        { 
                        this.onUpdateCompletion();
                    }, 
                    (error) => 
                    {
                        console.log("Failed add PTOTransaction" ,error);
                        customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    });
                    }
                    else{
                    this.onUpdateCompletion();
                }
                }, (error) => 
                {
                    console.log('Failed to update EmployeePTO');
                console.log(error);
                customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewEmployee: false });
                });
                }
                else  // if Employee is not eligible for PTO in previous year, for next year PTO Record not inserted from flow, to overcome that scenario this else condition is required 
                { 
                    if(this.state.formData.EligibleforPTO)
                    {
                    sp.web.lists.getByTitle('EmployeePTO').items.add(EmpPTOData).then((res) => 
                    {
                        //console.log("EmployeePTO Record updated successfully");
                        if(PreviousPTOHours!=UpdatedPTOHours)
                        {
                            sp.web.lists.getByTitle('PTOTransactions').items.add(PTOTransactionforHours).then((EmpPTOres) => 
                            {
                            this.onUpdateCompletion();
                        }, 
                        (error) => 
                        {
                            console.log("Failed add PTOTransaction" ,error);
                            customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                        });
                        }
                        else{
                        this.onUpdateCompletion();
                    }
                    }, (error) => 
                    {
                        console.log('Failed to add EmployeePTO');
                    console.log(error);
                    customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewEmployee: false });
                    });
                    }
                    else{
                        this.onUpdateCompletion();
                    }

                }
            }, (error) => 
            {
                console.log('Failed to update Employee');
                console.log(error);
                customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewEmployee: false });
            });
        }
        else {                             //Add New record
            //PTOBalance added for new Record based on Experience and Policy (only if DateOfJoining in the current Month)
            // let isDOJInCurrMonth=false;
            // if(`${formdata.DateOfJoining.getMonth()+1}/${formdata.DateOfJoining.getFullYear()}`==`${new Date().getMonth()+1}/${new Date().getFullYear()}`)
            // isDOJInCurrMonth=true;
            // let EmpPTODataWithHours =isDOJInCurrMonth? await this.getHoursToBeGrant(EmpPTOData):EmpPTOData;
            let currentMonthEndDate=this.getCurrMonthEndDate();
            //let Months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            let PTOTransaction={
                EmployeeId:this.state.formData.EmployeeId,
                TransactionType:UpdatedPTOHours-PreviousPTOHours>0?"Granted":"Deducted",
                PostedOn: new Date(this.addBrowserwrtServer(new Date(new Date().getMonth() + 1 + "/" + new Date().getDate() + "/" + new Date().getFullYear()))),
                From:this.addBrowserwrtServer(this.ptoTransactionFromDate(DOJ)),
                To:this.addBrowserwrtServer(currentMonthEndDate),
                // Hours:EmpPTOData["PTOBalance"],
                Hours: UpdatedPTOHours-PreviousPTOHours>0?(UpdatedPTOHours-PreviousPTOHours).toFixed(4):(PreviousPTOHours-UpdatedPTOHours).toFixed(4),
                PreviousPTOBalance:(PreviousPTOHours).toString(),
                CurrentPTOBalance:(UpdatedPTOHours).toString(),
                Reason:this.state.Comments,
                // Reason:`Monthly grant for period of ${new Date().getMonth()+1}/${new Date().getDate()}/${new Date().getFullYear()} To ${currentMonthEndDate.getMonth()+1}/${currentMonthEndDate.getDate()}/${currentMonthEndDate.getFullYear()}`,
                Year:new Date().getFullYear().toString()
            }
            sp.web.lists.getByTitle(EmployeeList).items.add(EmpPostData)
                .then((res) => {
                    //add EmployeePTO Data
                    if (!EmpPTORecord.length && this.state.formData.EligibleforPTO) {
                        sp.web.lists.getByTitle('EmployeePTO').items.add(EmpPTOData).then((EmpPTOres) => {
                            //console.log("EmployeePTO Record added successfully");
                            //below is condition to add PTO Transaction only if PTO Hours to Grant is other than 0 or empty
                            if (PreviousPTOHours!=UpdatedPTOHours) {
                                sp.web.lists.getByTitle('PTOTransactions').items.add(PTOTransaction).then((EmpPTOres) => {
                                    this.onAddCompletion();
                                },
                                    (error) => {
                                        console.log("Failed add PTOTransaction", error);
                                        customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                                    });
                            }
                            else {
                                this.onAddCompletion();
                            }
                    },(error) => {
                        console.log("Failed add EmployeePTOData" ,error);
                        customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    }); 
                    }
                    else{
                        this.onAddCompletion();
                    }
                })
                .catch((err) => {
                    console.log('Failed to add Employee');
                    customToaster('toster-error', ToasterTypes.Error, 'Sorry! something went wrong', 4000)
                    this.setState({ showHideModal: false, isRedirect: true, loading: false, addNewEmployee: false });
                });
        }
    }
    private ptoTransactionFromDate(dateOFJoining){
        const DOJ = new Date(dateOFJoining)
        if(DOJ.getMonth() === new Date().getMonth() && DOJ.getFullYear() === new Date().getFullYear()){
            return DOJ
        }
        else
        return new Date()
    }
    // onAddCompletion() onUpdateCompletion() methods are for reduce code length , on different, add and update conditions
    private onAddCompletion = () => {
        customToaster('toster-success', ToasterTypes.Success, 'Employee added successfully.', 2000)
        this.resetEmpMasterForm();
        this.setState({
            modalTitle: 'Success',
            modalText: 'Employee added successfully',
            showHideModal: false,
            isSuccess: true,
            loading: false,
            isRedirect: false,
            addNewEmployee: false,
            showConfirmPopup: false,
            ConfirmPopupMessage: ''
        });
    }
    private onUpdateCompletion = () => {
        customToaster('toster-success', ToasterTypes.Success, 'Employee updated successfully.', 2000)
                        this.resetEmpMasterForm();
                        this.setState({
                            modalTitle: 'Success',
                            modalText: 'Employee updated successfully',
                            showHideModal: false,
                            isSuccess: true,
                            loading: false,
                            isRedirect: false,
                            addNewEmployee: false,
                            showConfirmPopup:false,
                            ConfirmPopupMessage:''
                        });  
    }
    private getHoursToBeGrant =async (DateOfJoining,Policy) => {
        let ExpInDays=this.getExpInDays(DateOfJoining);
        let HoursToBeGrant=0;
        //Code for Monthly grant hours from PTOPolicy Master
        let LeapYearCount=0;
        for(let Year=DateOfJoining.getFullYear();Year<=new Date().getFullYear();Year++)
        {
            if(Year%4==0)
            LeapYearCount++;
        }
        let filterString=`Title eq '${Policy}' and IsActive eq 1`;
        try{
            await sp.web.lists.getByTitle("Policy").items.filter(filterString).getAll().
            then((PolicyRecords: any[]) => {
                    for(let PLCRecord of PolicyRecords)
                    {
                        if(PLCRecord.YearsOfExperience.includes('-'))
                        {
                            let [Min,Max]=[PLCRecord.YearsOfExperience.split('-')[0],PLCRecord.YearsOfExperience.split('-')[1]];
                            // Management require the below formate
                             if(Min==0)
                            {
                                if(ExpInDays>=parseInt(Min) && ExpInDays<=(parseInt(Max)*365+LeapYearCount))
                                {
                                    HoursToBeGrant=PLCRecord.HoursPerMonth;
                                    break;
                                }
                            }else{
                                if(ExpInDays>((parseInt(Min)-1)*365+LeapYearCount) && ExpInDays<=(parseInt(Max)*365+LeapYearCount))
                                {
                                    HoursToBeGrant=PLCRecord.HoursPerMonth;
                                    break;
                                }
                            }

                        }
                        else if(PLCRecord.YearsOfExperience.includes('+'))
                        {
                            let AboveExp=PLCRecord.YearsOfExperience.split('+')[0];
                            // Management require the below formate
                            if(ExpInDays>((parseInt(AboveExp)-1)*365+LeapYearCount))
                            {
                                HoursToBeGrant=PLCRecord.HoursPerMonth;
                                break;
                            }
                        }
                    }
            });
        }
        catch(e)
        {
            this.onError();
            console.log(e);
        }
        // EmpPTOData['PTOGranted']=HoursToBeGrant.toString();
        // EmpPTOData['PTOBalance']=HoursToBeGrant.toString();
        // EmpPTOData['PTOBalanceAfterDeduction']=HoursToBeGrant.toString();
       return HoursToBeGrant;
    }
    private getExpInDays = (DOJ) => {
        let currDate=new Date();
            currDate.setHours(0,0,0,0);
        let DOJoining=new Date(`${DOJ.getMonth() + 1}/${DOJ.getDate()}/${DOJ.getFullYear()}`);
            DOJoining.setHours(0,0,0,0);
        let ExpInDays=(currDate.getTime() - DOJoining.getTime()) / (24*60*60*1000);
       return ExpInDays;
    }
    private getExpYearMonthFormate = (ExpInDays,DateOfJoining) => {
        let ExpInYearMonth='';
        let Year=ExpInDays/365.50;
        let Month=Math.ceil((ExpInDays%365.50)/30.50);
        let Years=parseInt(Year.toString().split('.')[0])==0?'':parseInt(Year.toString().split('.')[0])==1?`${Year.toString().split('.')[0]} Year`:`${Year.toString().split('.')[0]} Years`;
        let Months=parseInt(Month.toString().split('.')[0])==0?'':parseInt(Month.toString().split('.')[0])==1?`${Month.toString().split('.')[0]} Month`:`${Month.toString().split('.')[0]} Months`;
        ExpInYearMonth = `${Years} ${Months}`;
       return ExpInYearMonth;
    }
    private getCurrMonthEndDate = () => {
        let currMonthEndDate;
        let currMonth=(new Date().getMonth())+1;
        let currYear=new Date().getFullYear();
        
            if([2].includes(currMonth)) //Feb Month
            {
                if(currYear%4==0) //LeapYear case
                currMonthEndDate=29;
                else
                currMonthEndDate=28;//Non LeapYear case
            }
            else if([4,6,9,11].includes(currMonth)) //30 days in a months
            currMonthEndDate=30;
            else if([1,3,5,7,8,10,12].includes(currMonth)) //31 days in a months
            currMonthEndDate=31;
       return new Date(`${currMonth}/${currMonthEndDate}/${currYear}`);
    }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    private onError = () => {
        this.setState({
            loading: false, modalTitle: 'Error', modalText: 'Sorry! something went wrong', showHideModal: true, isSuccess: false, errorMessage: ''
        });
    }
    private async loadListData(currentTab) {
        if(![null,undefined,''].includes(localStorage.getItem('PreviouslySelectedEmployeeTab')))
        currentTab=parseInt(localStorage.getItem('PreviouslySelectedEmployeeTab'));
        let filterQuery = `IsActive eq ${currentTab}`;
        if(currentTab==-1)
            filterQuery = `IsActive eq 1 and EligibleforPTO eq 1`; 
        this.setState({ isRedirect: false })
        try {
            let [Employees, EmployeeClassification,Policy, groups] = await Promise.all([
                sp.web.lists.getByTitle('Employees').items.top(5000).expand('Employee').select('Employee/Title,Employee/Id,*').filter(filterQuery).orderBy("Employee/Title", false).getAll(),
                sp.web.lists.getByTitle('EmployeeClassification').items.filter("IsActive eq 1").select('*').orderBy('Title').getAll(),
                sp.web.lists.getByTitle('AllPolicies').items.filter("IsActive eq 1").select('*').orderBy('Title').getAll(),
                sp.web.currentUser.groups(),
            ])
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            let ExcelData = []
            let Data = [];
            if (Employees.length) {
                Employees.sort((a, b) => b.Id - a.Id);

                for (const d of Employees) {
                    let DOJ = new Date(d.DateOfJoining.split('-')[1] + '/' + d.DateOfJoining.split('-')[2].split('T')[0] + '/' + d.DateOfJoining.split('-')[0]);
                    ExcelData.push({
                        Id: d.Id,
                        EmployeeId:d.Employee.Id,
                        Employee: d.Employee.Title,
                        DateOfJoining: `${DOJ.getMonth() + 1}/${DOJ.getDate()}/${DOJ.getFullYear()}`,
                        EmployeeClassification: [null,undefined,''].includes(d.EmployeeClassification)?'':d.EmployeeClassification,
                        Policy: [null,undefined,''].includes(d.Policy)?'':"none"==d.Policy.toLowerCase()?'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? "Yes" : "No",
                        IsActive: d.IsActive ? "Active" : "In-Active"
                    })

                    Data.push({
                        Id: d.Id,
                        EmployeeId:d.Employee.Id,
                        Employee: d.Employee.Title,
                        DateOfJoining: `${DOJ.getMonth() + 1}/${DOJ.getDate()}/${DOJ.getFullYear()}`,
                        EmployeeClassification: [null,undefined,''].includes(d.EmployeeClassification)?'':d.EmployeeClassification,
                        Policy: [null,undefined,''].includes(d.Policy)?'':"none"==d.Policy.toLowerCase()?'NA' : d.Policy,
                        EligibleforPTO: d.EligibleforPTO ? "Yes" : "No",
                        IsActive: d.IsActive ? "Active" : "In-Active"
                    })
                }
            }
            let pageAccessable = false,showInactiveTab=true;
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Timesheet HR')) {
                pageAccessable = true;
                if (userGroups.includes('Timesheet HR'))
                    showInactiveTab = false;
            }
            else {
                pageAccessable = false;
            }
            let FileName=currentTab==1?'Active Employees':currentTab==-1?'PTO Eligible Employees':currentTab==0?'In-Active Employees':'';
            this.setState({
                EmployeesData: Data,
                EmployeeClassificationObject: EmployeeClassification,
                PolicyObject: Policy,
                SaveUpdateText: 'Submit',
                showLabel: false,
                loading: false,
                ExportExcelData: ExcelData, showToaster: true,isPageAccessable:pageAccessable,showInactiveTab:showInactiveTab
            ,currentTab:currentTab,FileName:FileName});
            let items = document.querySelectorAll('.nav-link');
            items.forEach(function (item) {
                item.classList.remove('active');
            });
            if (currentTab == 1)
                document.getElementById('Active-tab')?document.getElementById('Active-tab').classList.add('active'):'';
            else if(currentTab == 0)
            document.getElementById('In-Active-tab')?document.getElementById('In-Active-tab').classList.add('active'):'';
            else if(currentTab == -1)
            document.getElementById('PTOEligible-tab')?document.getElementById('PTOEligible-tab').classList.add('active'):'';
        }
        catch (e) {
            this.onError();
            console.log(e);
        }
    }
    private async onEditClickHandler(id,EmployeeId) {
        try {
            let filterQuery = "ID eq '" + id + "'";
            let selectQuery = "Employee/Title,Employee/Id,Employee/EMail,*";
            let  PTOfilterQuery='Employee/ID eq '+ EmployeeId+' and Year eq '+(new Date().getFullYear());
            var [EmpData,EmpPTOData] =await Promise.all([
                sp.web.lists.getByTitle('Employees').items.filter(filterQuery).expand('Employee').select(selectQuery).get(),
                sp.web.lists.getByTitle('EmployeePTO').items.filter(PTOfilterQuery).select('Employee/ID,Employee/Title,*').expand('Employee').get(),
            ]) 
            // var data = await sp.web.lists.getByTitle('Employees').items.filter(filterQuery).expand('Employee').select(selectQuery).get();
            let DOJ = new Date(EmpData[0].DateOfJoining.split('-')[1] + '/' + EmpData[0].DateOfJoining.split('-')[2].split('T')[0] + '/' + EmpData[0].DateOfJoining.split('-')[0])
            let ExpInDays=this.getExpInDays(new Date(DOJ));
            let ExpInYearMonth=this.getExpYearMonthFormate(ExpInDays,new Date(DOJ));
            this.setState({
                formData:
                {
                    EmployeeId: EmpData[0].Employee.Id,
                    DateOfJoining: DOJ,
                    EmployeeClassification: EmpData[0].EmployeeClassification,
                    Policy: EmpData[0].Policy,
                    Hours: EmpPTOData.length?[null,undefined,''].includes(EmpPTOData[0].PTOBalanceAfterDeduction)?0:parseFloat(parseFloat(EmpPTOData[0].PTOBalanceAfterDeduction).toFixed(4)) :0,
                    EligibleforPTO: EmpData[0].EligibleforPTO,
                    IsActive: EmpData[0].IsActive,
                    CommentsHistory:[null,undefined,''].includes(EmpData[0].CommentsHistory)?[]:JSON.parse(EmpData[0].CommentsHistory),
                },
                Comments:'',
                PreviousPTOBalance:EmpPTOData.length? [null,undefined,''].includes(EmpPTOData[0].PTOBalance)?0:EmpPTOData[0].PTOBalance:0,
                PreviousPTOAfterDeduction:EmpPTOData.length?[null,undefined,''].includes(EmpPTOData[0].PTOBalanceAfterDeduction)?0:parseFloat(parseFloat(EmpPTOData[0].PTOBalanceAfterDeduction).toFixed(4)):0,
                PreviousEligibleforPTO:EmpData[0].EligibleforPTO,
                Experience:ExpInYearMonth,
                EmployeeEmail: EmpData[0].Employee.EMail,
                SaveUpdateText: 'Update',
                showLabel: false,
                addNewEmployee: true,
                loading:false
            });
            setTimeout(()=>{document.getElementById("divDateofJoining").scrollIntoView({ behavior: 'smooth', block: 'start' })},300);
            setTimeout(()=>{document.getElementById("divDateofJoining").getElementsByTagName('input')[0].focus()},300);
        }
        catch (e) {
            console.log('failed to fetch data for record :' + id);
        }
    }
    private resetEmpMasterForm = () => {
        this.setState({
            formData: {
                EmployeeId: null,
                DateOfJoining: new Date(),
                EmployeeClassification: '',
                Policy: 'None',
                Hours: '',
                EligibleforPTO: false,
                IsActive: true,
                CommentsHistory:[],
            },
            Comments:'',Experience:'', SaveUpdateText: 'Submit', addNewEmployee: false, EmployeeEmail: '', isRedirect: true,showToaster:false,PreviousPTOAfterDeduction:0,PreviousEligibleforPTO:false
        });
    }
    private handleRowClicked = (row) => {
        this.setState({loading:true});
        window.location.hash = `#/EmployeeMaster/${row.Id}`;
        this.props.match.params.id = row.Id;
        this.onEditClickHandler(row.Id,row.EmployeeId);
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
    private cancelHandler = () => {
        this.resetEmpMasterForm();
    }
    public handleClose = () => {
        this.setState({ showHideModal: false });
        this.resetEmpMasterForm();
    }
    private addNewEmployeeMaster = () => {
        var formdata = { ...this.state.formData };
        this.setState({ addNewEmployee: true, showLabel: false, formData: formdata });
        setTimeout(()=>{document.getElementById('divEmployee')?document.getElementById('divEmployee').getElementsByTagName('input')[0].focus():''},300);
    }
    private CloseConfirmationPopup = () => {
        this.setState({ showConfirmPopup: false, ConfirmPopupMessage: "",});
    }
    private onHandleClick = (url) => {
        let CurrentClickedTab=url =='Active'?'1':url =='In-Active'?'0':'-1';
        if(CurrentClickedTab!=localStorage.getItem('PreviouslySelectedEmployeeTab'))
        {
            this.setState({loading:true});
            let items = document.querySelectorAll('.nav-link');
            items.forEach(function(item) {
            item.classList.remove('active');
            });
            let currentTab=1;
            if (url === 'Active')
                {
                    document.getElementById('Active-tab')?document.getElementById('Active-tab').classList.add('active'):'';
                    localStorage.setItem('PreviouslySelectedEmployeeTab', '1'); 
                    currentTab=1;
                }
                else if (url === 'In-Active')
                 { 
                    document.getElementById('In-Active-tab')?document.getElementById('In-Active-tab').classList.add('active'):'';
                    localStorage.setItem('PreviouslySelectedEmployeeTab', '0'); 
                    currentTab=0;
                }
                else if (url === 'PTOEligible')
                 { 
                    document.getElementById('PTOEligible-tab')?document.getElementById('PTOEligible-tab').classList.add('active'):'';
                    localStorage.setItem('PreviouslySelectedEmployeeTab', '-1'); 
                    currentTab=-1;
                }
            this.setState({currentTab:currentTab});
            this.loadListData(currentTab);
        }
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/EmployeeMaster/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => { this.onEditClickHandler(record.Id,record.EmployeeId); }}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Employee",
                selector: (row, i) => row.Employee,
                sortable: true,
            },
            {
                name: "Date Of Joining",
                selector: (row, i) => row.DateOfJoining,
                sortable: true,
            },
            {
                name: "Employee Classification",
                selector: (row, i) => row.EmployeeClassification,
                sortable: true,
            },
            {
                name: "Policy",
                selector: (row, i) => row.Policy == 'None' ? 'NA' : row.Policy,
                sortable: true,
            },
            // {
            //     name: "Eligible for PTO",
            //     selector: (row, i) => row.EligibleforPTO,
            //     sortable: true,
            // },
            // {
            //     name: "Status",
            //     selector: (row, i) => row.IsActive,
            //     sortable: true,
            // },
        ];
        const ExcelColumns = [
            {
                name: "Employee",
                selector: 'Employee',
                sortable: true,
            },
            {
                name: "Date Of Joining",
                selector: 'DateOfJoining',
                sortable: true,
            },
            {
                name: "Employee Classification",
                selector: 'EmployeeClassification',
                sortable: true,
            },
            {
                name: "Policy",
                selector: 'Policy',
                sortable: true,
            },
            // {
            //     name: "Eligible for PTO",
            //     selector: 'EligibleforPTO',
            //     sortable: true,
            // },
            // {
            //     name: "Status",
            //     selector: 'IsActive',
            //     sortable: true,
            // },
        ];
        if([1,0].includes(this.state.currentTab))
        {
            columns.push({
                name: "Eligible for PTO",
                selector: (row, i) => row.EligibleforPTO,
                sortable: true,
            }) 
            ExcelColumns.push({
                name: "Eligible for PTO",
                selector: 'EligibleforPTO',
                sortable: true,
            })
        }
        if (this.state.isRedirect) {
            return (<Navigate to={'/EmployeeMaster'} />);
        }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL+"/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        return (
            <React.Fragment>
                {this.state.loading && <Loader />}
                <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handleClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                {<ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmPopup} isSuccess={false} onConfirm={this.handleSubmitUpdate} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm>}
                <div id="content" className="content p-2 pt-2">
                    <div className='container-fluid'>
                        <div className='FormContent'>
                            {/* <div className='title'>{this.state.addNewEmployee?'Employee':'Employees'} */}
                            <div className='title'>{'Employee Matrix'}
                                {this.state.addNewEmployee &&
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                }
                            </div>
                            <div className="after-title"></div>
                            <div className="row justify-content-md-left">
                                <div className="col-12 col-md-12 col-lg-12">

                                    {/* <div className={this.state.addNewEmployee ? 'mx-2 activediv' : 'mx-2'}>
                                        <div className="text-right pt-2">
                                            <button type="button" id="btnSubmit" title='Add New Employee' className="SubmitButtons btn" onClick={this.addNewEmployeeMaster}>
                                                <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                            </button>
                                        </div>
                                    </div> */}
                                    <div className="c-v-table EmployeeFrom">
                                        <div className="light-box border-box-shadow mx-2">
                                            <div className={this.state.addNewEmployee ? '' : 'activediv'}>
                                                <div className="my-2">
                                                    <div className="row pt-2 px-2">

                                                        <div className="col-md-3">
                                                            <div className="light-text">
                                                                <label className='lblPeoplepicker'>Employee <span className="mandatoryhastrick">*</span></label>
                                                                <div className="custom-peoplepicker" id="divEmployee">
                                                                    <PeoplePicker
                                                                        context={this.props.context}
                                                                        titleText="Employee"
                                                                        personSelectionLimit={1}
                                                                        showtooltip={false}
                                                                        disabled={this.props.match.params.id ? true : false}
                                                                        onChange={(e) => this._getPeoplePickerItems(e, 'EmployeeId')}
                                                                        ensureUser={true}
                                                                        required={true}
                                                                        defaultSelectedUsers={[this.state.EmployeeEmail]}
                                                                        principalTypes={[PrincipalType.User]} placeholder=""
                                                                        resolveDelay={1000} peoplePickerCntrlclassName={"input-peoplePicker-custom"}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="light-text div-readonly">
                                                                <label className="z-in-9">Date of Joining <span className="mandatoryhastrick">*</span></label>
                                                                <div className="custom-datepicker" id="divDateofJoining">
                                                                    <DatePicker onDatechange={this.UpdateDate} selectedDate={this.state.formData.DateOfJoining} title={"Date of Joining"} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                         <div className='light-text'>
                                                                <label>Experience</label>
                                                                <input className="form-control" type={"text"} title={"Experience"} placeholder="auto generated..." value={this.state.Experience || ''}
                                                                    required={false}   name={"Experience"}  autoComplete="off"  maxLength={10} id={"txtExperience"} disabled={true}
                                                                />
                                                            </div>
                                                           </div>
                                                        {/* <div className="col-md-3">
                                                            <div className="light-text">
                                                                <label>Employee Classification<span className="mandatoryhastrick">*</span></label>
                                                                <select className="form-control" required={true} name="EmployeeClassification" title="Employee Classification" id='EmployeeClassification' ref={this.EmployeeClassification} onChange={this.handleChange}>
                                                                    <option value=''>None</option>
                                                                    {this.state.EmployeeClassificationObject.map((option) => (
                                                                        <option value={option.Title} selected={option.Title == this.state.formData.EmployeeClassification}>{option.Title}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div> */}
                                                        <div className="col-md-3">
                                                            <div className="custom-dropdown">
                                                               <SearchableDropdown label="Employee Classification" Title="Employee Classification"  name="EmployeeClassification" id="EmployeeClassification" placeholderText="Select Classification" className="" selectedValue={this.state.formData.EmployeeClassification} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.EmployeeClassificationObject} onChange={(selectedOption,actionMeta)=>{this.handleChange(selectedOption,actionMeta)}} isRequired={true} refElement={this.EmployeeClassification} noOptionsMessage="No Employee Classification"></SearchableDropdown>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                                <div className="light-text" id='chkIsActive'>
                                                                    <InputCheckBox
                                                                        label={"Is Employee Eligible for PTO?"}
                                                                        name={"EligibleforPTO"}
                                                                        checked={this.state.formData.EligibleforPTO}
                                                                        onChange={this.handleChange}
                                                                        isforMasters={false}
                                                                        //isdisable={this.props.match.params.id ? false : true}
                                                                        isdisable={false}
                                                                    />
                                                                </div>
                                                            </div>
                                                        
                                                            <div className="col-md-3">
                                                                <div className="light-text">
                                                                    <label>Policy{this.state.formData.EligibleforPTO &&<span className="mandatoryhastrick">*</span>}</label>
                                                                    <select className="form-control" name="Policy" title="Policy" id='Policy' onChange={this.handleChange} value={this.state.formData.Policy} disabled={!this.state.formData.EligibleforPTO}>
                                                                    <option value=''>None</option>
                                                                    {this.state.PolicyObject.map((option) => (
                                                                        <option value={option.Title} selected={option.Title == this.state.formData.Policy}>{option.Title}</option>
                                                                    ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        
                                                            <div className="col-md-3">
                                                         <div className='light-text'>
                                                                <label>PTO Hours</label>
                                                                <input className="form-control" type={"text"} title={"Hours"} placeholder="e.g., 15.15" value={this.state.formData.Hours || ''}
                                                                    required={true} onChange={this.handleChange} onBlur={this.handleonBlur} name={"Hours"}  autoComplete="off" disabled={!this.state.formData.EligibleforPTO}  maxLength={10} id={"txtHours"}
                                                                />
                                                            </div>
                                                           </div>
                                                           
                                                        <div className="col-md-3">
                                                            <div className="light-text" id='chkIsActive'>
                                                                <InputCheckBox
                                                                    label={"Is Employee Active?"}
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
                                                        {/* <label className="floatingTextarea2 top-11">Comments{this.props.match.params.id > 0 && <span className="mandatoryhastrick">*</span>}</label> */}
                                                        <label className="floatingTextarea2 top-11">Comments</label>
                                                        <textarea className="position-static form-control requiredinput" onChange={this.handleChange} value={this.state.Comments} id="txtComments" ref={this.Comments} name="Comments"></textarea>
                                                    </div>
                                                </div>
                                                <div className="row mx-1" id="">
                                                    <div className="col-sm-12 text-center my-2" id="">
                                                        <button type="button" onClick={this.showConfirmSubmitOrUpdate} id="btnSubmit" className="SubmitButtons btn" title={this.state.SaveUpdateText}>{this.state.SaveUpdateText}</button>
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
                                    {!this.state.addNewEmployee &&
                                    <div>
                                             <div className="px-4 py-2"><ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">
                                                <li className="nav-item" role="presentation" onClick={() => { this.onHandleClick('Active') }} >
                                                    <a className="nav-link" id="Active-tab" data-toggle="tab" href="#/EmployeeMasterView" role="tab" aria-selected="false">Active Employees</a>
                                                </li>
                                                <li className="nav-item" role="presentation" onClick={() => { this.onHandleClick('PTOEligible') }} >
                                                    <a className="nav-link" id="PTOEligible-tab" data-toggle="tab" href="#/EmployeeMasterView" role="tab" aria-selected="false">PTO Eligible Employees</a>
                                                </li>
                                                 {this.state.showInactiveTab && <li className="nav-item" role="presentation" onClick={() => { this.onHandleClick('In-Active') }} >
                                                    <a className="nav-link" id="In-Active-tab" data-toggle="tab" href="#/EmployeeMasterView" role="tab" aria-selected="false">In-Active Employees</a>
                                                </li>}
                                            </ul></div>
                                           {[1,-1].includes(this.state.currentTab) && 
                                           <div className={this.state.addNewEmployee ? 'mx-2 activediv' : 'mx-2'}>
                                                <div className="text-right pr-3 pt-2">
                                                    <button type="button" id="btnSubmit" title='Add New Employee' className="SubmitButtons btn" onClick={this.addNewEmployeeMaster}>
                                                        <span className='' id='addEmpClassification'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> Add</span>
                                                    </button>
                                                </div>
                                    </div>}
                                        <div className="c-v-table">
                                        <TableGenerator columns={columns} data={this.state.EmployeesData} fileName={this.state.FileName} showExportExcel={this.state.EmployeesData.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExportExcelData} ExcelHeader={this.state.FileName} LargeWidthColumns={["Employee","EmployeeClassification"]} onRowClick={this.handleRowClicked}></TableGenerator>
                                    </div>
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
export default Employee;