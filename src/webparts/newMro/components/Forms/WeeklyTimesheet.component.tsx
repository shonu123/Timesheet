import * as React from 'react';
import { Component, lazy } from 'react';
import Loader from '../Shared/Loader';
import ModalPopUp from '../Shared/ModalPopUp';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, StatusType } from '../../Constants/Constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Navigate } from 'react-router-dom';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import { Web } from '@pnp/sp/webs';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import InputCheckBox from '../Shared/InputCheckBox';
import SearchableDropdown from '../Shared/SearchableDropdown';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import CustomDatePicker from "../Shared/DatePicker";
import { addDays } from 'office-ui-fabric-react';
import '../../CSS/WeeklyTimesheet.css'
import ModalPopUpConfirm from '../Shared/ModalPopUpConfirm';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import ExportToPDF from '../Shared/ExportPDF';
import DateUtilities from '../../Utilities/DateUtilities';
const PTOFormModal = lazy(() => import('../Shared/TimeOffFormModal'));

export interface WeeklyTimesheetProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface WeeklyTimesheetState {
    trFormdata: {
        ClientName: string,
        Name: string,
        WeekStartDate: Date,
        WeeklyItemsData: any,
        OTItemsData: any,
        BillableSubTotal: any,
        SynergyOfficeHrs: any,
        SynergyHolidayHrs: any,
        ClientHolidayHrs: any,
        PTOHrs: any,
        //PTONewHrs:any,
        NonBillableSubTotal: any,
        Total: any,
        Pendingwith: any,
        Comments: any,
        CommentsHistoryData: Array<Object>;
        DateSubmitted: Date,
        SuperviserNames: any,
        Status: string
        WeeklyItemsTotalTime: string,
        WeeklySubTotalHrs: any,
        OTSubTotalHrs: any,
        OTItemsTotalTime: string,
        SuperviserIds: any,
        DelegateToIds: any,
        ReviewerIds: any,
        NotifierIds: any,
        DateOfJoining: Date,
        IsDescriptionMandatory: boolean,
        IsProjectCodeMandatory: boolean,
        WeekStartDay: string,
        HolidayType: string,
        PTOApplied: string,
        PTOBalance: string,
        PTOBalanceAfterDeduction: string,
        PTOAvailed: string,
        //CurrentAvailablePTO:string,
        EligibleforPTO: boolean,
        EmployeeID: any,

        ReportingManagersEmail: any,
        DelegatedRMEmails: any,
        DelegateToEmails: any,
        ReviewersEmail: any,
        NotifiersEmail: any,
        IsClientApprovalNeeded: boolean,
        IsClientApprovalNeededUI: boolean,
        Revised: boolean,
        IsSubmitted: boolean,
        IsDelegated: boolean

    },
    AllSubmittedTimesheetsOfEmployee: any,
    Delegations: any,
    ClientNames: any,
    EmployeePTO: any,
    EmployeeMasterData: any,
    ClientMasterData: any,
    HolidaysList: any,
    SynergyHolidaysList: any,
    SuperviserNames: any,
    DelegateTo: any,
    Reviewers: any,
    Notifiers: any,
    currentWeeklyRowsCount: any,
    currentOTRowsCount: any,
    ItemID: any,
    userRole: string,
    EmployeeEmail: any,
    PDFData: any,
    PDFFileName: any,
    //-------------------------------------
    SaveUpdateText: string;
    showLabel: boolean;
    errorMessage: string;
    loading: boolean;
    showHideModal: boolean;
    redirect: boolean,
    modalText: string;
    modalTitle: string;
    isSuccess: boolean;
    isNewform: boolean;
    isSubmitted: boolean;
    showBillable: boolean;
    showNonBillable: boolean;
    showApproveRejectbtn: boolean;
    showSubmitSavebtn: boolean;
    showRevokebtn: boolean;
    IsReviewer: boolean;
    showPTO: boolean;
    isRecordAcessable: boolean;
    UserGoups: any;
    showConfirmDeletePopup: boolean;
    ConfirmPopupMessage: string;
    ActionToasterMessage: string;
    ActionButtonId: any;
    RowType: string;
    rowCount: string;
    isAdmin: boolean;
    IsCurrUserReviewer: boolean;
    AllEmpMasterData: any;
    onBehalf: boolean;
    currentUserId: number;
    EmployeesObj: any;
    weeks: any;
    Months: any,
    showToaster: boolean;
    showPDFButton: boolean;
    PTOTransactions: any
    PTOTransactionsListData: any
    // PTOFormModal
    isPTOFormModalVisible: boolean
    ptoFormData: any
    totalPTOFormData: any
    timeOffTypes: any
    UPTOTypes: any
    isTimeOffEdit: boolean;
    showClickHereLink: boolean;
    TimeOffRec: any;
    EmpMatrixRec: any
}

class WeeklyTimesheet extends Component<WeeklyTimesheetProps, WeeklyTimesheetState> {
    private siteURL: string;
    private oweb;
    private currentUser: string;
    private currentUserId: number;
    private listName = 'WeeklyTimeSheet';
    private Client;
    private EmployeeDropdown;
    private Comments;
    private WeekHeadings = [];
    private WeekNames = [];
    private weekStartDate;
    constructor(props: WeeklyTimesheetProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        this.currentUser = this.props.spContext.userDisplayName;
        this.currentUserId = this.props.spContext.userId;
        this.Client = React.createRef();
        this.Comments = React.createRef();
        this.weekStartDate = React.createRef();
        this.EmployeeDropdown = React.createRef();


        this.state = {

            trFormdata: {
                ClientName: '',
                Name: this.currentUser,
                WeekStartDate: null,
                WeeklyItemsData: [],
                OTItemsData: [],
                BillableSubTotal: [],
                SynergyOfficeHrs: [],
                SynergyHolidayHrs: [],
                ClientHolidayHrs: [],
                PTOHrs: [],
                //PTONewHrs:[],
                NonBillableSubTotal: [],
                Total: [],
                Pendingwith: '',
                Comments: '',
                CommentsHistoryData: [],
                DateSubmitted: new Date(),
                SuperviserNames: [],
                Status: StatusType.Save,
                WeeklyItemsTotalTime: '0',
                OTItemsTotalTime: '0',
                WeeklySubTotalHrs: [],
                OTSubTotalHrs: [],
                SuperviserIds: [],
                DelegateToIds: [],
                ReviewerIds: [],
                NotifierIds: [],
                DateOfJoining: new Date(),
                IsDescriptionMandatory: false,
                IsProjectCodeMandatory: false,
                WeekStartDay: '',
                HolidayType: '',
                PTOApplied: '0.00',
                PTOBalance: '0.00',
                PTOBalanceAfterDeduction: '0.00',
                PTOAvailed: '0.00',
                //CurrentAvailablePTO:'',
                EligibleforPTO: false,
                EmployeeID: 0,

                ReportingManagersEmail: [],
                DelegatedRMEmails: [],
                DelegateToEmails: [],
                ReviewersEmail: [],
                NotifiersEmail: [],
                IsClientApprovalNeeded: false,
                IsClientApprovalNeededUI: false,
                Revised: false,
                IsSubmitted: false,
                IsDelegated: false
            },
            AllSubmittedTimesheetsOfEmployee: [],
            Delegations: [],
            ClientNames: [],
            EmployeePTO: [],
            EmployeeMasterData: [],
            ClientMasterData: [],
            HolidaysList: [],
            SynergyHolidaysList: [],
            SuperviserNames: [],
            DelegateTo: [],
            Reviewers: [],
            Notifiers: [],
            currentWeeklyRowsCount: 1,
            currentOTRowsCount: 1,
            ItemID: 0,
            userRole: "",
            EmployeeEmail: [],
            PDFData: [],
            PDFFileName: '',
            //---------------------------------------------------   
            SaveUpdateText: StatusType.Save,
            showLabel: false,
            errorMessage: '',
            loading: false,
            showHideModal: false,
            redirect: false,
            modalText: '',
            modalTitle: '',
            isSuccess: true,
            isNewform: true,
            isSubmitted: false,
            showBillable: true,
            showNonBillable: true,
            showApproveRejectbtn: false,
            showSubmitSavebtn: false,
            showRevokebtn: false,
            ConfirmPopupMessage: '',
            ActionToasterMessage: "",
            ActionButtonId: '',
            IsReviewer: false,
            showPTO: false,
            isRecordAcessable: true,
            UserGoups: [],
            showConfirmDeletePopup: false,
            RowType: "",
            rowCount: "",
            showPDFButton: false,
            onBehalf: false,
            currentUserId: this.props.spContext.userId,
            EmployeesObj: [],
            isAdmin: false,
            IsCurrUserReviewer: false,
            AllEmpMasterData: [],
            weeks: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            showToaster: false,
            PTOTransactions: [],
            PTOTransactionsListData: [],
            // PTOFormModal starts
            isPTOFormModalVisible: false,
            ptoFormData: [],
            totalPTOFormData: {},
            timeOffTypes: [],
            UPTOTypes: [],
            isTimeOffEdit: false,
            showClickHereLink: false,
            TimeOffRec: [],
            EmpMatrixRec: []
        };
        this.oweb = Web(this.props.spContext.webAbsoluteUrl);
        // for first row of weekly and OT hrs
        const trFormdata = { ...this.state.trFormdata };
        trFormdata.WeeklyItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.OTItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.BillableSubTotal.push({ Type: "Billable Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.SynergyOfficeHrs.push({ Type: "Office Hours", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.SynergyHolidayHrs.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.ClientHolidayHrs.push({ Type: "Holiday", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.PTOHrs.push({ Type: "Time Off", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', PTOBalance: '0.00', PTOAfterDeduction: '0.00', Total: '0.00', });
        trFormdata.NonBillableSubTotal.push({ Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.WeeklySubTotalHrs.push({ Type: "Billable", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.OTSubTotalHrs.push({ Type: "OT", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.Total.push({ Type: "Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });

        this.WeekHeadings.push({
            "Mon": "",
            "MonDate": '',
            "IsMonJoined": true,
            "IsDay1Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay1SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Tue": "",
            "TueDate": "",
            "IsTueJoined": true,
            "IsDay2Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay2SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Wed": "",
            "WedDate": '',
            "IsWedJoined": true,
            "IsDay3Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay3SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Thu": "",
            "ThuDate": '',
            "IsThuJoined": true,
            "IsDay4Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay4SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Fri": "",
            "FriDate": '',
            "IsFriJoined": true,
            "IsDay5Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay5SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Sat": "",
            "SatDate": '',
            "IsSatJoined": true,
            "IsDay6Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay6SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
            "Sun": "",
            "SunDate": '',
            "IsSunJoined": true,
            "IsDay7Holiday": this.IsHoliday(trFormdata.WeekStartDate, trFormdata.HolidayType),
            "IsDay7SynergyHoliday": this.IsHoliday(trFormdata.WeekStartDate, "synergy"),
        })
        this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri", "day6": "Sat", "day7": "Sun", "dayCode": "Monday" });
        this.setState({ trFormdata });
    }
    public componentDidMount() {
        highlightCurrentNav("weeklytimesheet");
        this.setState({ loading: true });
        this.loadWeeklyTimeSheetData(this.state.currentUserId);
        if (this.props.match.params.id != undefined)
            this.props.match.params.id = this.props.match.params.id.split('&')[0];
    }
    //functions related to  initial loading
    private async loadWeeklyTimeSheetData(currentUserId, IsCalledFromHApply_Func?) {
        this.setState({ PTOTransactions: [] })
        var ClientNames: any;
        let userID = this.props.spContext.userId;
        let EmpfilterQuery = `Employee/Id eq '${currentUserId}' and  IsActive eq 1`;
        let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let [clientMaster, groups, AllSubmittedTimesheetsOfEmployee, Delegations, EmpMatrixRec] = await Promise.all([
            this.oweb.lists.getByTitle('Client').items.filter("IsActive eq 1").select("Title,DelegateTo/Id,DelegateTo/EMail,*").expand("DelegateTo").orderBy("Title", true).getAll(),
            sp.web.currentUser.groups(),
            this.oweb.lists.getByTitle(this.listName).items.filter("InitiatorId eq '" + currentUserId + "' and (Status eq '" + StatusType.Submit + "' or Status eq '" + StatusType.ManagerApprove + "' or Status eq '" + StatusType.Approved + "')").select('Initiator/Id,Initiator/Title,ClientName,WeekStartDate,Status').expand("Initiator").orderBy("WeekStartDate", false).getAll(),
            this.oweb.lists.getByTitle('Delegations').items.select('Authorizer/Id,Authorizer/EMail,DelegateTo/Id,DelegateTo/EMail,From,To').expand("Authorizer,DelegateTo").getAll(),
            this.oweb.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll()

        ]);
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title);
        }
        let trFormdata = this.state.trFormdata;
        trFormdata['Name'] = this.currentUser;
        AllSubmittedTimesheetsOfEmployee.sort((a, b) => {
            const dateA = new Date(a.WeekStartDate).getTime();
            const dateB = new Date(b.WeekStartDate).getTime();
            return dateB - dateA;
        });
        if (this.props.match.params.id != undefined) {
            this.setState({ ItemID: this.props.match.params.id });
            ClientNames = await this.getItemData(this.props.match.params.id, Delegations);
        }
        else {
            ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(`Employee/Id eq '${currentUserId}' and EmpMatrixID eq '${EmpMatrixRec.length ? EmpMatrixRec[0].Id : 0}'`).select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").expand("Employee,ReportingManager,Reviewers,Notifiers").orderBy("ClientName", true).getAll();

            if (userGroups.includes('Timesheet Members')) {
                this.setState({ isSubmitted: false, loading: false });
            }
            else {
                this.setState({ isSubmitted: true, loading: false });
            }
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
                this.setState({ isAdmin: true, isSubmitted: false })
            }
            this.setState({ EmpMatrixRec: EmpMatrixRec });
        }

        if (ClientNames.length < 1 && !this.state.isAdmin) {
            this.setState({ modalTitle: 'Invalid Employee configuration', modalText: 'Employee not configured in Approval Matrix,Please contact Administrator', isSuccess: false, showHideModal: true, loading: false, isSubmitted: true });
            return false;
        }
        this.setState({ EmployeeEmail: [], ClientNames: [], EmployeeMasterData: [], SuperviserNames: [], Reviewers: [], Notifiers: [] });
        ClientNames.length ? this.state.EmployeeEmail.push(ClientNames[0].Employee.EMail) : '';

        ClientNames.filter(item => {
            this.state.EmployeeMasterData.push({ "ClientName": item.ClientName, "DOJ": DateUtilities.GetDateMMDDYYYYAsInList(item.DateOfJoining), "IsDescriptionMandatory": item.MandatoryDescription, "IsProjectCodeMandatory": item.MandatoryProjectCode, "WeekStartDay": item.WeekStartDay, "HolidayType": item.HolidayType, "EmployeeClassification": item.EmployeeClassification, "EligibleforPTO": item.EligibleforPTO, "EmployeeID": item.Employee.Id, "IsActive": item.IsActive })
            if (item.hasOwnProperty("ReportingManager"))
                item.ReportingManager.map(i => (this.state.SuperviserNames.push({ "ClientName": item.ClientName, "ReportingManager": i.Title, "ReportingManagerId": i.Id, "ReportingManagerEmail": i.EMail, "IsActive": item.IsActive })));
            if (item.hasOwnProperty("Reviewers"))
                item.Reviewers.map(i => (this.state.Reviewers.push({ "ClientName": item.ClientName, "ReviewerId": i.Id, "ReviewerEmail": i.EMail, "IsActive": item.IsActive })));
            if (item.hasOwnProperty("Notifiers"))
                item.Notifiers.map(i => (this.state.Notifiers.push({ "ClientName": item.ClientName, "NotifierId": i.Id, "NotifierEmail": i.EMail })));
        });
        let isApproved = false;//new Condition for binding inactive Clients also when the status is Submit/Approved/ManagerReject/ReviewerReject
        for (let obj of trFormdata.CommentsHistoryData) {
            if (obj['Action'] == StatusType.Approved) {
                isApproved = true;
                break;
            }
        }
        if (isApproved) {
            ClientNames.filter(employeeItem => {
                this.state.ClientNames.push(employeeItem.ClientName);
            });
        }
        else {
            ClientNames.filter(employeeItem => {//to filter only active client names
                let isActiveInClientMaster = clientMaster.some(ClientItem => ClientItem.Title == employeeItem.ClientName);
                if (isActiveInClientMaster && employeeItem.IsActive) {
                    this.state.ClientNames.push(employeeItem.ClientName);
                }
            });
            if (this.state.ClientNames < 1 && !this.state.isAdmin) {
                this.setState({ modalTitle: 'Invalid Employee configuration', modalText: 'Employee not configured in Approval Matrix,Please contact Administrator', isSuccess: false, showHideModal: true, loading: false, isSubmitted: true });
                return false;
            }
            if (!this.state.ClientNames.includes(trFormdata.ClientName))
                trFormdata.ClientName = '';
        }
        this.state.ClientNames.sort();
        //For getting Dateofjoining,DescriptionMandatory,ProjectCOde Mandatory,WeekStartday of selected client
        let currentEmployeePTO = [];
        for (var item of this.state.EmployeeMasterData) {
            if (item.ClientName.toLowerCase() == trFormdata.ClientName.toLowerCase()) {
                trFormdata.DateOfJoining = new Date(item.DOJ);
                trFormdata.IsDescriptionMandatory = item.IsDescriptionMandatory;
                trFormdata.IsProjectCodeMandatory = item.IsProjectCodeMandatory;
                trFormdata.WeekStartDay = item.WeekStartDay;
                trFormdata.HolidayType = item.HolidayType;
                if ([null, undefined, 0, ''].includes(this.state.ItemID) || ![StatusType.Submit, toString(), StatusType.ManagerApprove, StatusType.Approved].includes(trFormdata.Status)) //if Item exists and status is Submit/ManagerApprove/Approve,then hide PTO columns based on WeeklyTimesheet Data otherwise based on Employee Master Data
                    trFormdata.EligibleforPTO = item.EligibleforPTO;
                currentEmployeePTO = await this.getLatestPTOData(item.EmployeeID, trFormdata.WeekStartDate);
                if (currentEmployeePTO.length) {
                    trFormdata.EmployeeID = currentEmployeePTO[0].ID;
                    trFormdata.PTOApplied = [null, undefined].includes(currentEmployeePTO[0].PTOApplied) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOApplied).toFixed(4);
                    trFormdata.PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalance) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalance).toFixed(4);
                    trFormdata.PTOBalanceAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4);
                    trFormdata.PTOAvailed = [null, undefined].includes(currentEmployeePTO[0].PTOAvailed) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOAvailed).toFixed(4);
                    if (trFormdata.EligibleforPTO && ![StatusType.ManagerApprove, StatusType.Approved, StatusType.Submit.toString()].includes(trFormdata.Status)) {
                        trFormdata.PTOHrs[0].PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString();
                        trFormdata.PTOHrs[0].PTOAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(trFormdata.PTOHrs[0].Total)).toFixed(4)).toString();
                    }
                }

                break;
            }
        }
        let WeekStartDate = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate));
        let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateOfJoining));
        this.WeekHeadings = [];
        this.WeekHeadings.push({
            "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsMonJoined": WeekStartDate < DateOfjoining,
            "IsDay1Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay1SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsTueJoined": WeekStartDate < DateOfjoining,
            "IsDay2Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay2SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsWedJoined": WeekStartDate < DateOfjoining,
            "IsDay3Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay3SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsThuJoined": WeekStartDate < DateOfjoining,
            "IsDay4Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay4SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsFriJoined": WeekStartDate < DateOfjoining,
            "IsDay5Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay5SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Sat": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "SatDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsSatJoined": WeekStartDate < DateOfjoining,
            "IsDay6Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay6SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            "Sun": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
            "SunDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
            "IsSunJoined": WeekStartDate < DateOfjoining,
            "IsDay7Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
            "IsDay7SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
        })

        this.setState({ UserGoups: userGroups, AllSubmittedTimesheetsOfEmployee: AllSubmittedTimesheetsOfEmployee, Delegations: Delegations, EmployeePTO: currentEmployeePTO, trFormdata, ClientNames: this.state.ClientNames, ClientMasterData: clientMaster, EmployeeEmail: this.state.EmployeeEmail, currentUserId: ClientNames.length ? ClientNames[0].Employee.Id : this.props.spContext.userId, showToaster: true });
        let TimeOffRecData = await this.checkTimeOffRecIsExists(trFormdata); // for binding Time Off row data with TimeOffRequest data
        this.setState({ TimeOffRec: TimeOffRecData.TimeOff, PTOTransactionsListData: TimeOffRecData.PTOTransactions });
        this.showApproveAndRejectButton(trFormdata);
        if (this.state.ClientNames.length == 1 && this.props.match.params.id == undefined) {
            trFormdata.ClientName = this.state.ClientNames[0];
            this.handleClientChange(this.state.ClientNames[0]);
        }
        //For getting Reporting Manager names
        if (this.props.match.params.id == undefined) {
            trFormdata.SuperviserNames = [];
            for (var item of this.state.SuperviserNames) {
                if (item.IsActive && item.ClientName.toLowerCase() == trFormdata.ClientName.toLowerCase()) {
                    trFormdata.SuperviserNames.push(item.ReportingManager);

                }
            }
        }
        this.GetHolidayMasterDataByClientName(trFormdata.WeekStartDate, trFormdata.HolidayType, trFormdata);
        if (!IsCalledFromHApply_Func)
            this.FocusToFirstInteractiveControl();

    }
    private async getLatestPTOData(EmployeeId, WeekStartDate) {
        let EmployeePTO = [];
        if (WeekStartDate != null) {
            try {
                let filterQuery = "Employee/Id eq " + EmployeeId + " and Year eq " + WeekStartDate.getFullYear() + " and IsActive eq 1";
                await this.oweb.lists.getByTitle('EmployeePTO').items.filter(filterQuery).select('Employee/Id,Employee/EMail,*').expand("Employee").getAll()
                    .then((response) => {
                        EmployeePTO = response;
                    }, (error) => {
                        this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                        console.log(error);
                    });
            }
            catch (e) {
                console.log('Failed to get PTO Data');
                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
            }
        }
        return EmployeePTO;
    }
    private async getItemData(TimesheetID, DelegationsData) {
        var ClientNames: any;
        let filterQuery = "ID eq '" + TimesheetID + "'";
        let selectQuery = "Initiator/EMail,Initiator/Id,Reviewers/EMail,Reviewers/Id,ReportingManager/EMail,ReportingManager/Id,DelegateTo/EMail,Notifiers/EMail,*";
        let [data, PTOTranscationsData] = await Promise.all([
            sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select(selectQuery).expand("Initiator,Reviewers,ReportingManager,DelegateTo,Notifiers").get(),
            sp.web.lists.getByTitle('PTOTransactions').items.top(2000).filter("TimesheetID eq '" + TimesheetID + "' and IsActive eq '1'").select('*').getAll()
        ])
        if (data.length == 0) {   //for deleted or not founded record
            this.setState({ ActionToasterMessage: 'Success-Invalid', redirect: true });
            return false;
        }
        const trFormdata = this.state.trFormdata;
        trFormdata.ClientName = data[0].ClientName;
        trFormdata.Name = data[0].Name;
        let WS = DateUtilities.GetDateMMDDYYYYAsInList(data[0].WeekStartDate);
        let DS = DateUtilities.GetDateMMDDYYYYAsInList(data[0].DateSubmitted);
        trFormdata.WeekStartDate = new Date(WS);
        trFormdata.DateSubmitted = new Date(DS);
        trFormdata.WeeklyItemsData = JSON.parse(data[0].WeeklyHrs);
        trFormdata.OTItemsData = JSON.parse(data[0].OverTimeHrs);
        trFormdata.BillableSubTotal = JSON.parse(data[0].BillableSubtotalHrs);
        trFormdata.SynergyOfficeHrs = JSON.parse(data[0].SynergyOfficeHrs);
        trFormdata.SynergyHolidayHrs = JSON.parse(data[0].SynergyHolidayHrs);
        trFormdata.ClientHolidayHrs = JSON.parse(data[0].ClientHolidayHrs);
        trFormdata.PTOHrs = JSON.parse(data[0].PTOHrs);
        trFormdata.EligibleforPTO = [null, undefined].includes(data[0].EligibleforPTO) ? false : data[0].EligibleforPTO;
        trFormdata.WeeklyItemsTotalTime = data[0].WeeklyTotalHrs;
        trFormdata.OTItemsTotalTime = data[0].OTTotalHrs;
        trFormdata.WeeklySubTotalHrs = JSON.parse(data[0].WeeklySubTotalHrs)
        trFormdata.OTSubTotalHrs = JSON.parse(data[0].OTSubTotalHrs)
        trFormdata.NonBillableSubTotal = JSON.parse(data[0].NonBillableSubTotalHrs);
        trFormdata.Total = JSON.parse(data[0].TotalHrs);
        trFormdata.Status = data[0].Status;
        trFormdata.CommentsHistoryData = JSON.parse(data[0].CommentsHistory);
        trFormdata.Status == StatusType.Save ? trFormdata.Comments = data[0].Comments == null ? '' : data[0].Comments : trFormdata.Comments = '';
        trFormdata.SuperviserNames = JSON.parse(data[0].SuperviserName);
        trFormdata.Pendingwith = data[0].PendingWith;
        trFormdata.IsClientApprovalNeeded = data[0].IsClientApprovalNeed;//value from the list
        trFormdata.IsClientApprovalNeededUI = false;//default value as false
        trFormdata.Revised = data[0].Revised;
        trFormdata.IsSubmitted = data[0].IsSubmitted;
        let EmpEmail = [];
        let RMEmail = [];
        let RMId = [];
        let DelToEmail = [];
        let ReviewEmail = [];
        let ReviewId = [];
        let NotifyEmail = [];
        EmpEmail.push(data[0].Initiator.EMail);
        let EmpId = data[0].Initiator.Id;
        if (data[0].hasOwnProperty("ReportingManager")) {
            trFormdata.DelegateToEmails = [];
            trFormdata.DelegatedRMEmails = [];
            let Delegations = DelegationsData.filter(i => ![undefined, null, ''].includes(i.Authorizer));
            data[0].ReportingManager.map(i => {
                RMEmail.push(i.EMail);
                RMId.push(i.Id);
                //code for automated delegation for reporting manager
                if (trFormdata.Pendingwith == "Manager") {
                    for (let j in Delegations) {
                        let From = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].From));
                        let To = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].To));
                        let FromDate = new Date(DateUtilities.getDateMMDDYYYY(From));
                        let ToDate = new Date(DateUtilities.getDateMMDDYYYY(To));
                        let Today = new Date(DateUtilities.getDateMMDDYYYY(new Date()));
                        if (i.Id == Delegations[j].Authorizer.Id && (Today >= FromDate && Today <= ToDate)) {
                            trFormdata.IsDelegated = true;
                            trFormdata.DelegateToEmails.push(Delegations[j].DelegateTo.EMail);
                            trFormdata.DelegateToIds.push(Delegations[j].DelegateTo.Id);
                            trFormdata.DelegatedRMEmails.push(Delegations[j].Authorizer.EMail);
                            break;
                        }
                    }
                }
            });
        }
        if (data[0].hasOwnProperty("DelegateTo"))
            data[0].DelegateTo.map(i => (DelToEmail.push(i.EMail)));
        if (data[0].hasOwnProperty("Reviewers")) {
            let Delegations = DelegationsData.filter(i => ![undefined, null, ''].includes(i.Authorizer));
            data[0].Reviewers.map(i => {
                ReviewEmail.push(i.EMail);
                ReviewId.push(i.Id);
                //code for automated delegation for reviewer
                if (trFormdata.Pendingwith == "Reviewer") {
                    for (let j in Delegations) {
                        let From = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].From));
                        let To = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].To));
                        let FromDate = new Date(DateUtilities.getDateMMDDYYYY(From));
                        let ToDate = new Date(DateUtilities.getDateMMDDYYYY(To));
                        let Today = new Date(DateUtilities.getDateMMDDYYYY(new Date()));
                        if (i.Id == Delegations[j].Authorizer.Id && (Today >= FromDate && Today <= ToDate)) {
                            trFormdata.IsDelegated = true;
                            trFormdata.DelegateToEmails.push(Delegations[j].DelegateTo.EMail);
                            trFormdata.DelegateToIds.push(Delegations[j].DelegateTo.Id);
                            trFormdata.DelegatedRMEmails.push(Delegations[j].Authorizer.EMail);
                            break;
                        }
                    }
                }
            });
        }
        if (data[0].hasOwnProperty("Notifiers"))
            data[0].Notifiers.map(i => (NotifyEmail.push(i.EMail)));
        if (trFormdata.CommentsHistoryData == null)
            trFormdata.CommentsHistoryData = [];

        trFormdata.ReportingManagersEmail = RMEmail;
        trFormdata.SuperviserIds = RMId;
        //trFormdata.DelegateToEmails = DelToEmail;
        trFormdata.ReviewersEmail = ReviewEmail;
        trFormdata.ReviewerIds = ReviewId;
        trFormdata.NotifiersEmail = NotifyEmail;
        trFormdata.WeekStartDay = this.state.weeks[trFormdata.WeekStartDate.getDay()];
        this.WeekNames = [];
        switch (trFormdata.WeekStartDay) {
            case "Monday":
                this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri", "day6": "Sat", "day7": "Sun", "dayCode": "Monday" });
                break;
            case "Tuesday":
                this.WeekNames.push({ "day1": "Tue", "day2": "Wed", "day3": "Thu", "day4": "Fri", "day5": "Sat", "day6": "Sun", "day7": "Mon", "dayCode": "Tuesday" });
                break;
            case "Wednesday":
                this.WeekNames.push({ "day1": "Wed", "day2": "Thu", "day3": "Fri", "day4": "Sat", "day5": "Sun", "day6": "Mon", "day7": "Tue", "dayCode": "Wednesday" });
                break;
            case "Thursday":
                this.WeekNames.push({ "day1": "Thu", "day2": "Fri", "day3": "Sat", "day4": "Sun", "day5": "Mon", "day6": "Tue", "day7": "Wed", "dayCode": "Thursday" });
                break;
            case "Friday":
                this.WeekNames.push({ "day1": "Fri", "day2": "Sat", "day3": "Sun", "day4": "Mon", "day5": "Tue", "day6": "Wed", "day7": "Thu", "dayCode": "Friday" });
                break;
            case "Saturday":
                this.WeekNames.push({ "day1": "Sat", "day2": "Sun", "day3": "Mon", "day4": "Tue", "day5": "Wed", "day6": "Thu", "day7": "Fri", "dayCode": "Saturday" });
                break;
            case "Sunday":
                this.WeekNames.push({ "day1": "Sun", "day2": "Mon", "day3": "Tue", "day4": "Wed", "day5": "Thu", "day6": "Fri", "day7": "Sat", "dayCode": "Sunday" });
                break;
        }
        let formatedFilename = 'Weekly Timesheet Report - ' + trFormdata.ClientName + ' (' + (DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate)) + ')';

        let PTOTransactions = this.mapDatesToHours(trFormdata.PTOHrs, trFormdata.WeekStartDate)

        this.setState({ trFormdata: trFormdata, PTOTransactions: PTOTransactions, currentWeeklyRowsCount: trFormdata.WeeklyItemsData.length, currentOTRowsCount: trFormdata.OTItemsData.length, EmployeeEmail: EmpEmail, currentUserId: EmpId, loading: false, showBillable: false, showNonBillable: false, PDFData: data, PDFFileName: formatedFilename });
        if ([StatusType.Submit, StatusType.Approved, StatusType.ManagerApprove].includes(data[0].Status)) {
            this.setState({ isSubmitted: true });
        }
        else if ([StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.Save, StatusType.Revoke].includes(data[0].Status)) {
            this.setState({ isSubmitted: false });
            if (trFormdata.EligibleforPTO)//Below is to get Latest PTO after Revoke
            {
                trFormdata.PTOHrs[0].PTOBalance = [null, undefined].includes(trFormdata.PTOBalanceAfterDeduction) ? '0.00' : parseFloat(parseFloat(trFormdata.PTOBalanceAfterDeduction).toFixed(4)).toString();
                trFormdata.PTOHrs[0].PTOAfterDeduction = [null, undefined].includes(trFormdata.PTOBalanceAfterDeduction) ? '0.00' : parseFloat((parseFloat(trFormdata.PTOBalanceAfterDeduction) - parseFloat(trFormdata.PTOHrs[0].Total)).toFixed(4)).toString();
            }
        }
        if ([StatusType.ReviewerReject, StatusType.Save].includes(data[0].Status)) {
            //Condition for Reviewer reject / Manager reject scenarios changed to save
            if (trFormdata.Revised && !data[0].IsClientApprovalNeed) {
                this.setState({ showBillable: false })
                if (trFormdata.CommentsHistoryData[trFormdata.CommentsHistoryData.length - 1]['Role'] == "Reviewer") {
                    if (data[0].IsClientApprovalNeed)
                        this.setState({ showBillable: false })
                    else
                        this.setState({ showBillable: true })
                }
            }
            else if (trFormdata.Revised) {
                if (data[0].IsClientApprovalNeed)
                    this.setState({ showBillable: false })
                else
                    this.setState({ showBillable: true })
            }
        }
        let groups = await sp.web.currentUser.groups();
        //------new-----
        let userGroups = []
        for (const grp of groups) {
            userGroups.push(grp.Title)
        }
        let showPDF = false;
        if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
            if (![StatusType.Save.toString(), StatusType.Revoke.toString()].includes(this.state.trFormdata.Status))
                showPDF = true;
        }
        let EmpfilterQuery = `Employee/Id eq '${EmpId}' and  IsActive eq 1`;
        let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let EmpMatrixRec = await this.oweb.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll()

        this.setState({ UserGoups: userGroups, showPDFButton: showPDF, EmpMatrixRec: EmpMatrixRec });

        this.showApproveAndRejectButton(trFormdata);
        this.userAccessableRecord(trFormdata);

        ClientNames = await this.oweb.lists.getByTitle('EmployeeMaster').items.filter(`Employee/Id eq '${data[0].InitiatorId}' and EmpMatrixID eq '${EmpMatrixRec.length ? EmpMatrixRec[0].Id : 0}'`).select("ClientName ,DateOfJoining,Employee/Title,Employee/Id,Employee/EMail,ReportingManager/Id,Reviewers/Id,Notifiers/Id,ReportingManager/Title,Reviewers/Title,Notifiers/Title,ReportingManager/EMail,Reviewers/EMail,Notifiers/EMail,*").orderBy("ClientName", true).expand("Employee,ReportingManager,Reviewers,Notifiers").getAll();

        return ClientNames;
    }
    private async getItemStatusBeforeActionPerform(TimesheetID) {
        let filterQuery = "ID eq '" + TimesheetID + "'";
        let data = await sp.web.lists.getByTitle(this.listName).items.filter(filterQuery).select('Status').get();
        if (data.length == 1)
            return data[0].Status;
        else
            return this.state.trFormdata.Status;

    }
    // Functions related to OnBehalf functionality.
    private async getAllEmployees() {
        let selectQuery = "Employee/ID,Employee/Title"

        let employees = await sp.web.lists.getByTitle('EmployeeMaster').items.filter("IsActive eq 1").expand('Employee').select(selectQuery).orderBy('Employee/Title', true).getAll()
        let EmpNames = []
        let EmpObj = []
        for (const name of employees) {
            if (!EmpNames.includes(name.Employee.Title)) {
                EmpNames.push(name.Employee.Title)
                EmpObj.push({ ID: name.Employee.ID, Title: name.Employee.Title })
            }
        }
        EmpObj.sort((a, b) => a.Title.localeCompare(b.Title));
        this.setState({ EmployeesObj: EmpObj, loading: false, ClientNames: [] })

    }
    private handleApplyingfor = async (event, actionMeta?) => {
        this.setState({ loading: true });
        let name, inputvalue, value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if (![null, undefined].includes(event) && event.target != undefined) {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        }
        else if (actionMeta != undefined) {
            name = actionMeta.name;
            value = actionMeta.action == 'clear' ? name == 'Employee' ? '-1' : '' : event.value;
        }
        let trFormdata = { ...this.state.trFormdata }
        if (name == 'Applying') {
            if (value == 'Self') {
                this.currentUser = this.props.spContext.userDisplayName;
                trFormdata['ClientName'] = '';
                trFormdata['Name'] = this.currentUser;
                trFormdata.WeekStartDate = null;
                this.setState({ onBehalf: false, ClientNames: [], loading: true, trFormdata });
                this.loadWeeklyTimeSheetData(this.props.spContext.userId);
            }
            else {
                trFormdata.Name = '';
                trFormdata.ClientName = '';
                trFormdata.WeekStartDate = null;
                this.setState({ trFormdata, onBehalf: true, isSubmitted: true, ClientNames: [], currentUserId: -1, loading: true });
                this.getAllEmployees();
            }

        }
        else {
            this.setState({ loading: true });
            if (value == '-1') {
                trFormdata.ClientName = '';
                trFormdata.WeekStartDate = null;
                this.setState({ trFormdata, currentUserId: -1, isSubmitted: true, ClientNames: [], loading: false });
                this.currentUser = this.props.spContext.userDisplayName;
            }
            else {
                let trFormdata = { ...this.state.trFormdata }
                trFormdata['ClientName'] = '';
                trFormdata.WeekStartDate = null;
                trFormdata['Name'] = event.label;
                this.currentUser = event.label;
                this.setState({ currentUserId: parseInt(value), ClientNames: [], trFormdata });
                this.loadWeeklyTimeSheetData(parseInt(value), true);
            }
        }
        //changes by Ganesh in this method:Clear the fields and validate record.
        this.ClearTimesheetControls(trFormdata);
    }
    //functions related to calculation
    private WeekStartDateChange = (dateprops) => {
        this.setState({ loading: true, PTOTransactions: [] })
        let date = new Date()
        if (dateprops == null) {
            date = dateprops;
        }
        else {
            date = new Date(dateprops);
        }
        const Formdata = { ...this.state.trFormdata };
        Formdata.SuperviserNames = [];
        for (var item of this.state.SuperviserNames) {
            if (item.IsActive && item.ClientName.toLowerCase() == Formdata.ClientName.toLowerCase()) {
                Formdata.SuperviserNames.push(item.ReportingManager);

            }
        }
        Formdata.WeekStartDate = date;
        this.GetHolidayMasterDataByClientName(date, Formdata.HolidayType, Formdata);
        this.validateDuplicateRecord(date, Formdata.ClientName, Formdata);

    }
    private handleClientChange = async (event, actionMeta?, isAlreadyCalledFromHCC_Func?) => {
        this.setState({ loading: true })
        let clientVal = [null, undefined].includes(event) ? '' : event.value != undefined ? actionMeta != undefined && actionMeta.action == 'clear' ? '' : event.value : event;
        const Formdata = { ...this.state.trFormdata };
        Formdata.ClientName = clientVal;
        Formdata.SuperviserNames = [];
        Formdata.SuperviserIds = [];
        Formdata.ReviewerIds = [];
        Formdata.NotifierIds = [];
        if (clientVal == 'None') {
            this.setState({ showBillable: true, showNonBillable: true, showPTO: false, isTimeOffEdit: false, showClickHereLink: false, TimeOffRec: [] })
        }
        else {
            for (var item of this.state.SuperviserNames) {
                if (item.IsActive && item.ClientName.toLowerCase() == clientVal.toLowerCase()) {
                    Formdata.SuperviserNames.push(item.ReportingManager);

                }
            }
            this.setState({ showBillable: false, showNonBillable: false });
        }
        //For getting Dateofjoining,DescriptionMandatory,ProjectCode Mandatory,WeekStartday of selected client
        for (var item of this.state.EmployeeMasterData) {
            if (item.ClientName.toLowerCase() == clientVal.toLowerCase()) {
                Formdata.DateOfJoining = new Date(item.DOJ);
                Formdata.IsDescriptionMandatory = item.IsDescriptionMandatory;
                Formdata.IsProjectCodeMandatory = item.IsProjectCodeMandatory;
                Formdata.WeekStartDay = item.WeekStartDay;
                Formdata.HolidayType = item.HolidayType;
                Formdata.EligibleforPTO = item.EligibleforPTO;
                let currentEmployeePTO = await this.getLatestPTOData(item.EmployeeID, Formdata.WeekStartDate);
                if (currentEmployeePTO.length) {
                    Formdata.EmployeeID = currentEmployeePTO[0].ID;
                    Formdata.PTOApplied = [null, undefined].includes(currentEmployeePTO[0].PTOApplied) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOApplied).toFixed(4);
                    Formdata.PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalance) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalance).toFixed(4);
                    Formdata.PTOBalanceAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4);
                    Formdata.PTOAvailed = [null, undefined].includes(currentEmployeePTO[0].PTOAvailed) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOAvailed).toFixed(4);
                    if (Formdata.EligibleforPTO && ![StatusType.ManagerApprove, StatusType.Approved, StatusType.Submit.toString()].includes(Formdata.Status)) {
                        Formdata.PTOHrs[0].PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString();
                        Formdata.PTOHrs[0].PTOAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(Formdata.PTOHrs[0].Total)).toFixed(4)).toString();
                    }
                }
                this.WeekNames = [];
                switch (Formdata.WeekStartDay) {
                    case "Monday":
                        this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri", "day6": "Sat", "day7": "Sun", "dayCode": "Monday" });
                        break;
                    case "Tuesday":
                        this.WeekNames.push({ "day1": "Tue", "day2": "Wed", "day3": "Thu", "day4": "Fri", "day5": "Sat", "day6": "Sun", "day7": "Mon", "dayCode": "Tuesday" });
                        break;
                    case "Wednesday":
                        this.WeekNames.push({ "day1": "Wed", "day2": "Thu", "day3": "Fri", "day4": "Sat", "day5": "Sun", "day6": "Mon", "day7": "Tue", "dayCode": "Wednesday" });
                        break;
                    case "Thursday":
                        this.WeekNames.push({ "day1": "Thu", "day2": "Fri", "day3": "Sat", "day4": "Sun", "day5": "Mon", "day6": "Tue", "day7": "Wed", "dayCode": "Thursday" });
                        break;
                    case "Friday":
                        this.WeekNames.push({ "day1": "Fri", "day2": "Sat", "day3": "Sun", "day4": "Mon", "day5": "Tue", "day6": "Wed", "day7": "Thu", "dayCode": "Friday" });
                        break;
                    case "Saturday":
                        this.WeekNames.push({ "day1": "Sat", "day2": "Sun", "day3": "Mon", "day4": "Tue", "day5": "Wed", "day6": "Thu", "day7": "Fri", "dayCode": "Saturday" });
                        break;
                    case "Sunday":
                        this.WeekNames.push({ "day1": "Sun", "day2": "Mon", "day3": "Tue", "day4": "Wed", "day5": "Thu", "day6": "Fri", "day7": "Sat", "dayCode": "Sunday" });
                        break;
                }
                break;
            }
        }
        //Condition for binding not submitted week of consecutive Submitted Week :start
        let EnabledWeekStartDates = [];
        let currentWeekStartDate = this.getCurrentWeekStartDate(Formdata.WeekStartDay);
        for (let i = 1; i <= 5; i++) {
            EnabledWeekStartDates.push(currentWeekStartDate.toDateString());
            currentWeekStartDate = addDays(new Date(currentWeekStartDate), -7);
        }
        //for filter Client wise submitted timesheets
        let ClientWiseSubmittedTimesheetsOfEmp = [];
        for (let j in this.state.AllSubmittedTimesheetsOfEmployee) {
            if (this.state.AllSubmittedTimesheetsOfEmployee[j].ClientName === Formdata.ClientName)
                ClientWiseSubmittedTimesheetsOfEmp.push(this.state.AllSubmittedTimesheetsOfEmployee[j]);

        }
        if (ClientWiseSubmittedTimesheetsOfEmp.length > 0) {
            //for latest submitted week
            let nextWeekOfLatestSubmitted = addDays(new Date(DateUtilities.GetDateMMDDYYYYAsInList(ClientWiseSubmittedTimesheetsOfEmp[0].WeekStartDate)), 7);
            if (EnabledWeekStartDates.includes(nextWeekOfLatestSubmitted.toDateString()))
                Formdata.WeekStartDate = isAlreadyCalledFromHCC_Func != 'yes' ? nextWeekOfLatestSubmitted : Formdata.WeekStartDate;
            else
                isAlreadyCalledFromHCC_Func != 'yes' ? Formdata.WeekStartDate = null : '';
        }
        else {
            isAlreadyCalledFromHCC_Func != 'yes' ? Formdata.WeekStartDate = null : '';
        }
        //Condition for binding not submitted week of consecutive Submitted Week :end

        //For restricting  of incorrect WeekstarDay binding in DatePicker
        this.GetHolidayMasterDataByClientName(Formdata.WeekStartDate, Formdata.HolidayType, Formdata);
        this.validateDuplicateRecord(Formdata.WeekStartDate, clientVal, Formdata, isAlreadyCalledFromHCC_Func);

    }
    private handleChange = (event) => {
        const formData = { ...this.state.trFormdata };
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value != 'None' ? value : null;
        this.setState({ trFormdata: formData });
    }
    private changeTime = (event) => {
        const trFormdata = { ...this.state.trFormdata };
        let value = event.target.value;

        let index = parseInt(event.target.id.split("_")[0]);
        let prop = event.target.id.split("_")[1];
        let rowType = event.target.id.split("_")[2];
        if (!["Description", "ProjectCode", "Total"].includes(prop)) {
            value = rowType == "PTOHrs" ? value.match(/\d{0,5}(\.\d{0,4})?/)[0] : value.match(/\d{0,5}(\.\d{0,2})?/)[0];
            if (parseFloat(value) > 24.00) {
                return false;
            }
        }
        //FOR ROW WISE CALCULATION
        let TotalRowMins = 0;
        if (rowType == "weekrow") {
            trFormdata.WeeklyItemsData[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.WeeklyItemsData[index]).forEach(key => {
                let val = trFormdata.WeeklyItemsData[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                if (!["Description", "ProjectCode", "Total"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })
            trFormdata.WeeklyItemsData[index]["Total"] = TotalRowMins.toFixed(2);
        }
        else if (rowType == "otrow") {
            trFormdata.OTItemsData[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.OTItemsData[index]).forEach(key => {
                let val = trFormdata.OTItemsData[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                if (!["Description", "ProjectCode", "Total"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })
            trFormdata.OTItemsData[index]["Total"] = TotalRowMins.toFixed(2);
        }
        else if (rowType == "SynOffcHrs") {
            trFormdata.SynergyOfficeHrs[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.SynergyOfficeHrs[index]).forEach(key => {
                let val = trFormdata.SynergyOfficeHrs[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })
            trFormdata.SynergyOfficeHrs[index]["Total"] = TotalRowMins.toFixed(2);
        }
        else if (rowType == "SynHldHrs") {
            trFormdata.SynergyHolidayHrs[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.SynergyHolidayHrs[index]).forEach(key => {
                let val = trFormdata.SynergyHolidayHrs[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : value;
                if (!["Description", "ProjectCode", "Total", , "Type"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })
            trFormdata.SynergyHolidayHrs[index]["Total"] = TotalRowMins.toFixed(2);
        }
        else if (rowType == "ClientHldHrs") {
            if (parseFloat(value) > 8.00) {
                return false;
            }
            trFormdata.ClientHolidayHrs[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.ClientHolidayHrs[index]).forEach(key => {
                let val = trFormdata.ClientHolidayHrs[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })
            trFormdata.ClientHolidayHrs[index]["Total"] = TotalRowMins.toFixed(2);
        }
        else if (rowType == "PTOHrs") {
            if (parseFloat(value) > 8.00) {
                return false;
            }
            trFormdata.PTOHrs[index][prop] = value.toString();
            this.setState({ trFormdata });
            Object.keys(trFormdata.PTOHrs[index]).forEach(key => {
                let val = trFormdata.PTOHrs[index][key].toString();
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                if (!["Description", "ProjectCode", "Total", "Type", "PTOBalance", "PTOAfterDeduction"].includes(key)) {
                    TotalRowMins = TotalRowMins + (parseFloat(val));
                }
            })

            let PTOAfterDeduction = parseFloat(trFormdata.PTOBalanceAfterDeduction) - TotalRowMins; //Change After Demo PTO included into TO
            trFormdata.PTOHrs[index]["PTOAfterDeduction"] = parseFloat(PTOAfterDeduction.toFixed(4)).toString(); //Change After Demo PTO included into TO
            trFormdata.PTOHrs[index]["Total"] = parseFloat(TotalRowMins.toFixed(4)).toString();
            const dateKey = event.target.getAttribute('data-date')

            const existingTransaction = this.state.PTOTransactions.find(transaction => transaction[dateKey] !== undefined);

            if (existingTransaction) {
                // Update the existing value
                existingTransaction[dateKey] = value;
            } else {
                // Push new object
                this.state.PTOTransactions.push({ [dateKey]: value });
            }
        }
        this.setState({ trFormdata });
        //FOR COLUMN WISE CALCULATION
        let WeeklyTotal = 0;
        let [Total] = [0];
        let [WeekTotal, OTTotal] = [0, 0];
        //BILLABLE SUB TOTAL COLUMN WISE
        // to iterate Weekly hrs
        for (var item of trFormdata.WeeklyItemsData) {
            //For weekly calculation
            let val = item[prop].toString();;
            [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
            WeeklyTotal = WeeklyTotal + (parseFloat(val));
            //For total calculation
            let TotalVal = item.Total.toString();
            [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
            Total = Total + (parseFloat(TotalVal));
            WeekTotal = WeekTotal + (parseFloat(TotalVal));
        }
        trFormdata.WeeklyItemsTotalTime = WeeklyTotal.toFixed(2).toString();
        // to iterate OT hrs
        for (var item of trFormdata.OTItemsData) {
            //For weekly calculation
            let val = item[prop].toString();
            [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
            WeeklyTotal = WeeklyTotal + (parseFloat(val));
            //For total calculation
            let TotalVal = item.Total.toString();
            [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
            Total = Total + (parseFloat(TotalVal));
            OTTotal = OTTotal + (parseFloat(TotalVal));
        }
        trFormdata.OTItemsTotalTime = OTTotal.toFixed(2).toString();

        if (!["Description", "ProjectCode"].includes(prop))
            trFormdata.BillableSubTotal[0][prop] = WeeklyTotal.toFixed(2).toString();
        trFormdata.BillableSubTotal[0]["Total"] = Total.toFixed(2).toString();

        // NON BILLABLE SUBTOTAL COLUMN WISE
        WeeklyTotal = 0;
        [Total] = [0];
        let NonBillableColValue = trFormdata.SynergyOfficeHrs[0][prop].toString();
        [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
        let TotalVal = trFormdata.SynergyOfficeHrs[0]["Total"];
        [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal = TotalVal.toString();
        WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
        Total = Total + (parseFloat(TotalVal));

        NonBillableColValue = trFormdata.SynergyHolidayHrs[0][prop].toString();
        [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
        TotalVal = trFormdata.SynergyHolidayHrs[0]["Total"].toString();
        [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
        WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
        Total = Total + (parseFloat(TotalVal));

        NonBillableColValue = trFormdata.ClientHolidayHrs[0][prop].toString();
        [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
        TotalVal = trFormdata.ClientHolidayHrs[0]["Total"].toString();
        [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
        WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
        Total = Total + (parseFloat(TotalVal));

        NonBillableColValue = trFormdata.PTOHrs[0][prop].toString();
        [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
        TotalVal = trFormdata.PTOHrs[0]["Total"].toString();
        [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
        WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
        Total = Total + (parseFloat(TotalVal));

        if (!["Description", "ProjectCode"].includes(prop))
            trFormdata.NonBillableSubTotal[0][prop] = WeeklyTotal.toFixed(4).toString();
        trFormdata.NonBillableSubTotal[0]["Total"] = Total.toFixed(4).toString();
        //GRAND TOTAL COLUMN WISE
        WeeklyTotal = 0;
        [Total] = [0];
        if (!["Description", "ProjectCode"].includes(prop)) {
            let TotalColVal = trFormdata.BillableSubTotal[0][prop].toString();
            [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
            let BillableTotalVal = trFormdata.BillableSubTotal[0]["Total"].toString();
            [undefined, null, "", "."].includes(BillableTotalVal.trim()) ? BillableTotalVal = "0" : BillableTotalVal;
            WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));
            Total = Total + (parseFloat(BillableTotalVal));

            TotalColVal = trFormdata.NonBillableSubTotal[0][prop].toString();
            [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
            BillableTotalVal = trFormdata.NonBillableSubTotal[0]["Total"].toString();
            [undefined, null, "", "."].includes(BillableTotalVal.trim()) ? BillableTotalVal = "0" : BillableTotalVal;
            WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));
            Total = Total + (parseFloat(BillableTotalVal));
        }
        if (!["Description", "ProjectCode"].includes(prop)) {

            trFormdata.Total[0][prop] = parseFloat(WeeklyTotal.toFixed(4)).toString();
            trFormdata.Total[0]["Total"] = parseFloat(Total.toFixed(4)).toString();
            if (parseFloat(trFormdata.Total[0][prop]) >= 8)
                document.getElementById("Total" + prop).classList.remove('mandatory-8hourstotal');
        } else {
            trFormdata.Total[0][prop] = trFormdata.Total[0][prop];
            trFormdata.Total[0]["Total"] = trFormdata.Total[0]["Total"];
        }
        this.setState({ trFormdata });
    }
    private calculateTimeWhenRemoveRow = (Data, DataAfterRemovedObject, RowType) => {
        const trFormdata = Data;
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total"];
        //FOR COLUMN WISE CALCULATION
        for (var prop of TableColumns) {
            let [WeeklyTotal] = [0, 0, 0];
            if (RowType.toLowerCase() == "weekrow")  //When Weekly items removed 
            {

                //BILLABLE SUB TOTAL COLUMN WISE
                // to iterate Weekly hrs
                for (var item of DataAfterRemovedObject) {
                    let val = item[prop].toString();
                    [undefined, null, "", "."].includes(val) ? val = "0" : val;
                    WeeklyTotal = WeeklyTotal + (parseFloat(val));
                }
                // to iterate OT hrs
                for (var item of trFormdata.OTItemsData) {
                    let val = item[prop].toString();
                    [undefined, null, "", "."].includes(val) ? val = "0" : val;
                    WeeklyTotal = WeeklyTotal + (parseFloat(val));
                }
            }
            else {      //When OT items removed 

                //BILLABLE SUB TOTAL COLUMN WISE
                // to iterate Weekly hrs
                for (var item of trFormdata.WeeklyItemsData) {
                    let val = item[prop].toString();
                    [undefined, null, "", "."].includes(val) ? val = "0" : val;
                    WeeklyTotal = WeeklyTotal + (parseFloat(val));
                }
                // to iterate OT hrs
                for (var item of DataAfterRemovedObject) {
                    let val = item[prop].toString();
                    [undefined, null, "", "."].includes(val) ? val = "0" : val;
                    WeeklyTotal = WeeklyTotal + (parseFloat(val));
                }

            }
            trFormdata.BillableSubTotal[0][prop] = WeeklyTotal.toFixed(2).toString();
            //GRAND TOTAL COLUMN WISE
            WeeklyTotal = 0;
            let TotalColVal = trFormdata.BillableSubTotal[0][prop].toString();
            [undefined, null, "", "."].includes(TotalColVal) ? TotalColVal = "0" : TotalColVal;
            WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));

            TotalColVal = trFormdata.NonBillableSubTotal[0][prop].toString();
            [undefined, null, "", "."].includes(TotalColVal) ? TotalColVal = "0" : TotalColVal;
            WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));

            trFormdata.Total[0][prop] = WeeklyTotal.toFixed(2).toString();
        }
        return trFormdata;
    }
    private CloseConfirmationPopup = () => {
        this.setState({ showConfirmDeletePopup: false, ConfirmPopupMessage: "", ActionButtonId: "", redirect: false });
    }
    private RemoveCurrentRow = () => {
        let RowType = this.state.RowType;
        let rowCount = parseInt(this.state.rowCount);
        let count;
        if (RowType.toLowerCase() == "weekrow") {
            let trFormdata = { ...this.state.trFormdata };
            let tempItemsData = trFormdata.WeeklyItemsData;
            trFormdata.WeeklyItemsData = [];
            let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
            count = WeeklyRowsCount - 1;
            for (var i = 0; i < tempItemsData.length; i++) {
                if (i != rowCount)
                    trFormdata.WeeklyItemsData.push(tempItemsData[i]);
            }
            trFormdata = this.calculateTimeWhenRemoveRow(trFormdata, trFormdata.WeeklyItemsData, RowType);
            this.setState({ trFormdata, currentWeeklyRowsCount: count, showConfirmDeletePopup: false });

        }
        else {
            let trFormdata = { ...this.state.trFormdata };
            let tempItemsData = trFormdata.OTItemsData;
            trFormdata.OTItemsData = [];
            let OTRowsCount = this.state.currentOTRowsCount;
            count = OTRowsCount - 1;
            for (var i = 0; i < tempItemsData.length; i++) {
                if (i != rowCount)
                    trFormdata.OTItemsData.push(tempItemsData[i]);
            }
            trFormdata = this.calculateTimeWhenRemoveRow(trFormdata, trFormdata.OTItemsData, RowType);
            this.setState({ trFormdata, currentOTRowsCount: count, showConfirmDeletePopup: false });
        }
    }
    private CreateWeeklyHrsRow = () => {
        const trFormdata = { ...this.state.trFormdata };
        let isValid = { status: true, message: '' };
        for (let i in trFormdata.WeeklyItemsData) {

            if (parseFloat(trFormdata.WeeklyItemsData[i].Total) == 0) {
                isValid.message = "Total working hours in a week cannot be 0 .";
                isValid.status = false;
                document.getElementById(i + "_Total_weekrow").focus();
                document.getElementById(i + "_Total_weekrow").classList.add('mandatory-FormContent-focus');
                break;
            }
        }
        if (isValid.status) {
            for (let i in trFormdata.WeeklyItemsData) {
                document.getElementById(i + "_Total_weekrow").classList.remove('mandatory-FormContent-focus');
            }

            let WeeklyRowsCount = this.state.currentWeeklyRowsCount;
            let count = WeeklyRowsCount + 1;
            let newObj = { Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00' };
            trFormdata.WeeklyItemsData.push(newObj);
            this.setState({ trFormdata, currentWeeklyRowsCount: count, showLabel: true, errorMessage: "" });
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    private CreateOTHrsRow = () => {
        const trFormdata = { ...this.state.trFormdata };
        let isValid = { status: true, message: '' };
        for (let i in trFormdata.OTItemsData) {
            if (parseFloat(trFormdata.OTItemsData[i].Total) == 0) {
                isValid.message = "Total working hours in a week cannot be 0 .";
                isValid.status = false;
                document.getElementById(i + "_Total_otrow").focus();
                document.getElementById(i + "_Total_otrow").classList.add('mandatory-FormContent-focus');
                break;
            }
        }
        if (isValid.status) {
            for (let i in trFormdata.OTItemsData) {
                document.getElementById(i + "_Total_otrow").classList.remove('mandatory-FormContent-focus');
            }
            let OTRowsCount = this.state.currentOTRowsCount;
            let count = OTRowsCount + 1;
            let newObj = { Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00' };

            trFormdata.OTItemsData.push(newObj);
            this.setState({ trFormdata, currentOTRowsCount: count, showLabel: false, errorMessage: "" });
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    //functions related to confirmation popup
    private showConfirmDeleteRow = (event) => {
        this.setState({ showConfirmDeletePopup: true, ConfirmPopupMessage: 'Are you sure you want to delete this row?' });
        let TypeofRow = event.currentTarget.id.split("_")[1];
        let CountOfRow = event.currentTarget.id.split("_")[0];
        this.setState({ RowType: TypeofRow, rowCount: CountOfRow })
    }
    private showConfirmSubmit = async (event) => {
        //new condition for instance action without refreshing
        var itemStatus = await this.getItemStatusBeforeActionPerform(this.state.ItemID);
        //Inside ternary condition is needed for : after Rejected/Revoked, then save no need to show action modified toaster
        if ([StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.Revoke.toString()].includes(this.state.trFormdata.Status) ? (itemStatus == this.state.trFormdata.Status || itemStatus == StatusType.Save) : itemStatus == this.state.trFormdata.Status) {
            let data = {};
            // new onbehalf changes
            { this.state.onBehalf ? data['Employee'] = { val: this.state.currentUserId, required: true, Name: 'Employee', Type: ControlType.reactSelect, Focusid: 'Employee' } : '' }
            data['ClientName'] = { val: this.state.trFormdata.ClientName, required: true, Name: 'Client Name', Type: ControlType.reactSelect, Focusid: 'Client' }
            data['WeeklyStartDate'] = { val: this.state.trFormdata.WeekStartDate, required: true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid: "divWeekStartDate" }
            var formdata = { ...this.state.trFormdata };
            let isValid = Formvalidator.checkValidations(data);
            if (isValid.status) {
                isValid = this.validateTimeControls(formdata, "Submit");
            }
            if (isValid.status) {
                let CurrWeekStartDate = this.getCurrentWeekStartDate(formdata.WeekStartDay);
                let submitConfirmMsg = "Are you sure you want to submit";
                //for applying with negative PTOBalance
                let LessPTOMsg = '';
                if (this.state.trFormdata.EligibleforPTO && parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction) < 0) {
                    let LOPHours = parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction.split('.')[0]) < 0 ? -(parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction)) : '';
                    LessPTOMsg = ` with ${LOPHours} hours of unpaid Time Off`;
                }
                if (DateUtilities.getDateMMDDYYYY(formdata.WeekStartDate) == DateUtilities.getDateMMDDYYYY(CurrWeekStartDate))
                    submitConfirmMsg += ' for current week' + (parseFloat(formdata.Total[0].Total) == 0 ? " with '0' hours" : LessPTOMsg) + '?';
                else
                    submitConfirmMsg += (parseFloat(formdata.Total[0].Total) == 0 ? " with '0' hours" : LessPTOMsg) + '?';
                this.setState({ showConfirmDeletePopup: true, ConfirmPopupMessage: submitConfirmMsg, ActionButtonId: event.target.id });
            }
            else {
                customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            }
        }
        else {
            //Info message for action not completed
            this.setState({ ActionToasterMessage: 'Success-' + StatusType.RecordModified, loading: false, redirect: true })

        }

    }
    private showConfirmApprove = async (event) => {
        //new condition for instance action without refreshing
        var itemStatus = await this.getItemStatusBeforeActionPerform(this.state.ItemID);
        //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR
        let IsReportingManagerReviewerSame = this.checkIsManagerReviewerSame(this.state.trFormdata);
        if (this.state.TimeOffRec.length && !this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm) // restrict if timeoff utilized, for both PTO and Non PTO employees
        {
            let HoldMsg = "'Time off request' pending with HR approval. Cannot approve";
            // if(!this.state.trFormdata.EligibleforPTO)
            //   HoldMsg="'Bereavement (BV)' time off request pending with HR approval. Cannot approve"; 

            if (this.state.trFormdata.Pendingwith == "Manager") {
                if (IsReportingManagerReviewerSame && this.state.TimeOffRec[0].Status != StatusType.Approved) {
                    customToaster('toster-warning', ToasterTypes.Warning, HoldMsg, 4000);
                    return false;
                }
            }
            else {
                if (this.state.trFormdata.Pendingwith == "Reviewer" && this.state.TimeOffRec[0].Status != StatusType.Approved) {
                    customToaster('toster-warning', ToasterTypes.Warning, HoldMsg, 4000);
                    return false;
                }
            }
        }

        if (itemStatus == this.state.trFormdata.Status) {
            this.setState({ showConfirmDeletePopup: true, ConfirmPopupMessage: 'Are you sure you want to approve?', ActionButtonId: event.target.id });
        }
        else {
            //Info message for action not completed
            this.setState({ ActionToasterMessage: 'Success-' + StatusType.RecordModified, loading: false, redirect: true });
        }
    }
    private showConfirmReject = async (event) => {
        //new condition for instance action without refreshing
        var itemStatus = await this.getItemStatusBeforeActionPerform(this.state.ItemID);
        if (itemStatus == this.state.trFormdata.Status) {
            if ([null, undefined, ""].includes(this.state.trFormdata.Comments.trim())) {
                customToaster('toster-error', ToasterTypes.Error, 'Comments cannot be blank.', 4000)
                document.getElementById("txtComments").focus();
                document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
            }
            else {

                this.setState({ showConfirmDeletePopup: true, ConfirmPopupMessage: 'Are you sure you want to reject?', ActionButtonId: event.target.id });
            }
        }
        else {
            //Info message for action not completed
            this.setState({ ActionToasterMessage: 'Success-' + StatusType.RecordModified, loading: false, redirect: true })
        }

    }
    private showConfirmRevoke = async (event) => {
        //new condition for instance action without refreshing
        var itemStatus = await this.getItemStatusBeforeActionPerform(this.state.ItemID);
        if (itemStatus == this.state.trFormdata.Status) {
            if ([null, undefined, ""].includes(this.state.trFormdata.Comments.trim())) {
                customToaster('toster-error', ToasterTypes.Error, 'Comments cannot be blank.', 4000)
                document.getElementById("txtComments").focus();
                document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
            }
            else {
                this.setState({ showConfirmDeletePopup: true, ConfirmPopupMessage: 'Are you sure you want to revoke?', ActionButtonId: event.target.id });
            }
        }
        else {
            //Info message for action not completed
            this.setState({ ActionToasterMessage: 'Success-' + StatusType.RecordModified, loading: false, redirect: true })
        }


    }
    //functions related to CRUD operations
    private handleSubmitorSave = async () => {
        this.setState({ showConfirmDeletePopup: false })
        let Action = this.state.ActionButtonId == "btnSubmit" ? this.state.ActionButtonId : "btnSave";
        let data = {};
        // new onbehalf changes
        { this.state.onBehalf ? data['Employee'] = { val: this.state.currentUserId, required: true, Name: 'Employee', Type: ControlType.reactSelect, Focusid: 'Employee' } : '' }
        data['ClientName'] = { val: this.state.trFormdata.ClientName, required: true, Name: 'Client Name', Type: ControlType.reactSelect, Focusid: 'Client' }
        data['WeeklyStartDate'] = { val: this.state.trFormdata.WeekStartDate, required: true, Name: 'Weekly Start Date', Type: ControlType.date, Focusid: "divWeekStartDate" }
        var formdata = { ...this.state.trFormdata };
        var id = this.props.match.params.id ? this.props.match.params.id : 0;

        formdata = this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        this.setState({ trFormdata: formdata })
        let isValid = Formvalidator.checkValidations(data);
        if (Action == "btnSave") {
            if (isValid.status) {
                isValid = this.validateTimeControls(formdata, "Save");
            }
        }
        if (isValid.status) {
            if ([undefined, 0, '0'].includes(this.state.ItemID)) //get Emails from EmployeeMaster if ItemID does not exists,if ItemID exists get emails from WeeklyTimesheet item
                formdata = this.GetRequiredEmails(formdata.ClientName, formdata);
            formdata = this.ClearInvalidDots(formdata);
            this.setState({ trFormdata: formdata })
            // to trim description & project code
            formdata.WeeklyItemsData.forEach(item => { item.ProjectCode = item.ProjectCode.trim(); item.Description = item.Description.trim() });
            formdata.OTItemsData.forEach(item => { item.ProjectCode = item.ProjectCode.trim(); item.Description = item.Description.trim() });
            formdata.SynergyOfficeHrs.forEach(item => { item.ProjectCode = item.ProjectCode.trim(); item.Description = item.Description.trim() });
            formdata.ClientHolidayHrs.forEach(item => { item.ProjectCode = item.ProjectCode.trim(); item.Description = item.Description.trim() });
            formdata.PTOHrs.forEach(item => { item.ProjectCode = item.ProjectCode.trim(); item.Description = item.Description.trim() });
            formdata.Comments = formdata.Comments.trim();
            var postObject = {
                Name: formdata.Name,
                ClientName: formdata.ClientName,
                WeekStartDate: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(formdata.WeekStartDate))),
                WeeklyHrs: JSON.stringify(formdata.WeeklyItemsData),
                OverTimeHrs: JSON.stringify(formdata.OTItemsData),
                BillableSubtotalHrs: JSON.stringify(formdata.BillableSubTotal),
                SynergyOfficeHrs: JSON.stringify(formdata.SynergyOfficeHrs),
                SynergyHolidayHrs: JSON.stringify(formdata.SynergyHolidayHrs),
                ClientHolidayHrs: JSON.stringify(formdata.ClientHolidayHrs),
                PTOHrs: JSON.stringify(formdata.PTOHrs),
                EligibleforPTO: formdata.EligibleforPTO,
                NonBillableSubTotalHrs: JSON.stringify(formdata.NonBillableSubTotal),
                TotalHrs: JSON.stringify(formdata.Total),
                SuperviserName: JSON.stringify(formdata.SuperviserNames),
                InitiatorId: this.state.currentUserId,
                BillableTotalHrs: formdata.BillableSubTotal[0].Total,
                NonBillableTotalHrs: formdata.NonBillableSubTotal[0].Total,
                GrandTotal: formdata.Total[0].Total,
                WeeklyTotalHrs: formdata.WeeklyItemsTotalTime,
                OTTotalHrs: formdata.OTItemsTotalTime,
                WeeklySubTotalHrs: JSON.stringify(formdata.WeeklySubTotalHrs),
                OTSubTotalHrs: JSON.stringify(formdata.OTSubTotalHrs),
                ReportingManagerId: { "results": formdata.SuperviserIds },
                ReviewersId: { "results": formdata.ReviewerIds },
                NotifiersId: { "results": formdata.NotifierIds },
                Comments: formdata.Comments,
                Revised: formdata.Revised,
                //Below are required for accurate reports of Weekly and Bi-Weekly (post implementation of Time Off Request form)
                PTOSubTotal: JSON.stringify(this.state.totalPTOFormData.PTOSubTotal),
                TOSubTotal: JSON.stringify(this.state.totalPTOFormData.TOSubTotal),
                EmpMatrixID: this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id.toString() : '0'
            }
            if (Action.toLowerCase() == "btnsave") {
                postObject['Status'] = StatusType.Save;
                postObject['PendingWith'] = "Initiator";
                postObject['AssignedToId'] = { "results": [this.state.currentUserId] };
            }
            else if (Action.toLowerCase() == "btnsubmit") {

                if (formdata.IsSubmitted) {
                    let user = "Initiator";
                    user = this.state.EmployeeEmail != this.props.spContext.userEmail ? "Administator" : user
                    formdata.CommentsHistoryData.push({ "Action": "Re-Submitted", "Role": user, "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments, "Date": new Date().toISOString() })
                }
                else {
                    let user = "Initiator"
                    user = this.state.onBehalf ? "Administrator" : user
                    formdata.CommentsHistoryData.push({ "Action": StatusType.Submit, "Role": user, "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments, "Date": new Date().toISOString() })
                }
                postObject['IsSubmitted'] = true;
                if (this.state.ItemID == 0) {
                    postObject['Status'] = StatusType.Submit;
                    postObject['PendingWith'] = "Manager";
                    postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                    postObject['AssignedToId'] = { "results": formdata.SuperviserIds };
                }
                else {
                    if (formdata.IsClientApprovalNeeded) {
                        postObject['Status'] = StatusType.Submit;
                        postObject['PendingWith'] = "Manager";
                        postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                        postObject['AssignedToId'] = { "results": formdata.SuperviserIds };
                    }
                    else {
                        if (StatusType.Save == formdata.Status || StatusType.Revoke == formdata.Status || StatusType.ManagerReject == formdata.Status) {
                            postObject['Status'] = StatusType.Submit;
                            postObject['PendingWith'] = "Manager";
                            postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                            postObject['AssignedToId'] = { "results": formdata.SuperviserIds };
                            //Condition for Reviewer reject / Manager reject scenarios changed to save
                            if (formdata.CommentsHistoryData.length > 2) {
                                if (formdata.CommentsHistoryData[formdata.CommentsHistoryData.length - 2]['Role'] == "Reviewer") {
                                    postObject['Status'] = StatusType.ManagerApprove;
                                    postObject['PendingWith'] = "Reviewer";
                                    postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                                    postObject['AssignedToId'] = { "results": formdata.ReviewerIds };
                                }
                                else if (formdata.CommentsHistoryData[formdata.CommentsHistoryData.length - 2]['Role'] == "HR" && formdata.EligibleforPTO) {
                                    postObject['Status'] = StatusType.ReviewerApprove;
                                    postObject['PendingWith'] = "HR";
                                    postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                                    postObject['AssignedToId'] = { "results": [] };
                                } else {
                                    postObject['Status'] = StatusType.Submit;
                                    postObject['PendingWith'] = "Manager";
                                    postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                                    postObject['AssignedToId'] = { "results": formdata.SuperviserIds };
                                }
                            }
                        }
                        else if (StatusType.ReviewerReject == formdata.Status) {
                            postObject['Status'] = StatusType.ManagerApprove;
                            postObject['PendingWith'] = "Reviewer";
                            postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                            postObject['AssignedToId'] = { "results": formdata.ReviewerIds };
                        }
                        else if (StatusType.HRReject == formdata.Status && formdata.EligibleforPTO) {
                            postObject['Status'] = StatusType.ReviewerApprove;
                            postObject['PendingWith'] = "HR";
                            postObject['DateSubmitted'] = this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date())));
                            postObject['AssignedToId'] = { "results": [] };
                        }
                    }
                }
            }
            postObject["CommentsHistory"] = JSON.stringify(formdata.CommentsHistoryData),
                this.setState({ errorMessage: '', trFormdata: formdata });
            this.InsertorUpdatedata(postObject, formdata);
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
        }
    }
    private GetRequiredEmails = (ClientName, formdata) => {
        let clientVal = ClientName;
        const Formdata = formdata;
        Formdata.ClientName = clientVal;
        Formdata.SuperviserNames = [];
        Formdata.SuperviserIds = [];
        Formdata.ReviewerIds = [];
        Formdata.NotifierIds = [];
        let RMEmail = [];
        let ReviewEmail = [];
        let NotifyEmail = [];
        for (var item of this.state.SuperviserNames) {
            if (item.IsActive && item.ClientName.toLowerCase() == clientVal.toLowerCase()) {
                Formdata.SuperviserNames.push(item.ReportingManager);
                Formdata.SuperviserIds.push(item.ReportingManagerId);
                RMEmail.push(item.ReportingManagerEmail)
            }
        }
        for (var item of this.state.Reviewers) {
            if (item.IsActive && item.ClientName.toLowerCase() == clientVal.toLowerCase()) {
                Formdata.ReviewerIds.push(item.ReviewerId);
                ReviewEmail.push(item.ReviewerEmail)
            }
        }
        for (var item of this.state.Notifiers) {
            if (item.ClientName.toLowerCase() == clientVal.toLowerCase()) {
                Formdata.NotifierIds.push(item.NotifierId);
                NotifyEmail.push(item.NotifierEmail);
            }
        }
        Formdata.ReportingManagersEmail = RMEmail;
        Formdata.ReviewersEmail = ReviewEmail;
        Formdata.NotifierEmail = NotifyEmail;
        return Formdata;
    }
    private Calculate_Indvidual_OT_Weekly_TotalTime = (Formdata) => {
        const formdata = Formdata;
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total"];
        for (var prop of TableColumns) {
            let [WeeklyTotal, OTTotal] = [0, 0];
            //WEEKLY SUB TOTAL COLUMN WISE
            for (var item of formdata.WeeklyItemsData) {
                let val = item[prop].toString();
                [undefined, null, "", "."].includes(val) ? val = "0" : val;
                WeeklyTotal = WeeklyTotal + (parseFloat(val));
            }
            //OT SUB TOTAL COLUMN WISE      
            for (var item of formdata.OTItemsData) {
                let val = item[prop].toString();
                [undefined, null, "", "."].includes(val) ? val = "0" : val;
                OTTotal = OTTotal + (parseFloat(val));
            }
            formdata.WeeklySubTotalHrs[0][prop] = WeeklyTotal.toFixed(2).toString();
            formdata.OTSubTotalHrs[0][prop] = OTTotal.toFixed(2).toString();
        }
        formdata.WeeklyItemsTotalTime = formdata.WeeklySubTotalHrs[0]["Total"];
        formdata.OTItemsTotalTime = formdata.OTSubTotalHrs[0]["Total"];
        return formdata;
    }
    private handleApprove = async () => {
        this.setState({ showConfirmDeletePopup: false });
        var formdata = { ...this.state.trFormdata };
        formdata = this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        var postObject = {};
        switch (formdata.Status) {
            case StatusType.Submit:
                let IsReportingManagerReviewerSame = this.checkIsManagerReviewerSame(formdata);
                // //condition for: if RM, Reviewer same, but Rm delegated ,if delegated manager approve status is directly approved. 27/06/2024
                if (IsReportingManagerReviewerSame) {
                    formdata.CommentsHistoryData.push({ "Action": StatusType.Approved, "Role": "Reviewer", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() });
                    let [Status, PendingWith] = [StatusType.Approved, "NA"];
                    if (this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && formdata.EligibleforPTO && !this.state.UserGoups.includes('Timesheet HR')) {
                        [Status, PendingWith] = [StatusType.ReviewerApprove, "HR"];
                    }
                    postObject['Status'] = Status;
                    postObject['PendingWith'] = PendingWith;
                    postObject['AssignedToId'] = { "results": [] };
                    break;
                } else {
                    formdata.CommentsHistoryData.push({ "Action": StatusType.Approved, "Role": "Manager", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() });
                    postObject['Status'] = StatusType.ManagerApprove;
                    postObject['PendingWith'] = "Reviewer";
                    postObject['AssignedToId'] = { "results": formdata.ReviewerIds };
                    break;
                }
            case StatusType.ManagerApprove:
                formdata.CommentsHistoryData.push({ "Action": StatusType.Approved, "Role": "Reviewer", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
                let [Status, PendingWith] = [StatusType.Approved, "NA"];
                if (this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && formdata.EligibleforPTO && !this.state.UserGoups.includes('Timesheet HR')) {
                    [Status, PendingWith] = [StatusType.ReviewerApprove, "HR"];
                }
                postObject['Status'] = Status;
                postObject['PendingWith'] = PendingWith;
                postObject['AssignedToId'] = { "results": [] };
                break;
            case StatusType.ReviewerApprove:
                formdata.CommentsHistoryData.push({ "Action": StatusType.Approved, "Role": "HR", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
                postObject['Status'] = StatusType.Approved;
                postObject['PendingWith'] = "NA";
                postObject['AssignedToId'] = { "results": [] };
                break;
        }
        //to avoid data miss match of TimeOffRec and timesheet timeoff in email
        postObject["BillableSubtotalHrs"] = JSON.stringify(formdata.BillableSubTotal);
        postObject["NonBillableSubTotalHrs"] = JSON.stringify(formdata.NonBillableSubTotal);
        postObject["TotalHrs"] = JSON.stringify(formdata.Total);
        postObject["PTOHrs"] = JSON.stringify(formdata.PTOHrs);
        postObject["BillableTotalHrs"] = formdata.BillableSubTotal[0].Total;
        postObject["NonBillableTotalHrs"] = formdata.NonBillableSubTotal[0].Total;
        postObject["GrandTotal"] = formdata.Total[0].Total;

        postObject["CommentsHistory"] = JSON.stringify(formdata.CommentsHistoryData),
            this.setState({ errorMessage: '', trFormdata: formdata });
        this.InsertorUpdatedata(postObject, formdata);
    }
    private handleRevoke = async () => {
        this.setState({ showConfirmDeletePopup: false })
        var formdata = { ...this.state.trFormdata };
        formdata = this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        var postObject = {};
        let user = "Initiator";
        user = this.state.EmployeeEmail != this.props.spContext.userEmail ? "Administator" : user;
        formdata.CommentsHistoryData.push({ "Action": StatusType.Revoke, "Role": user, "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
        postObject['Status'] = StatusType.Revoke;
        postObject['PendingWith'] = "Initiator";
        postObject['AssignedToId'] = { "results": [this.state.currentUserId] };
        postObject['IsClientApprovalNeed'] = false;
        if (formdata.Status == StatusType.ManagerApprove)
            postObject['Revised'] = true;

        //to avoid data miss match of TimeOffRec and timesheet timeoff in email
        postObject["BillableSubtotalHrs"] = JSON.stringify(formdata.BillableSubTotal);
        postObject["NonBillableSubTotalHrs"] = JSON.stringify(formdata.NonBillableSubTotal);
        postObject["TotalHrs"] = JSON.stringify(formdata.Total);
        postObject["PTOHrs"] = JSON.stringify(formdata.PTOHrs);
        postObject["BillableTotalHrs"] = formdata.BillableSubTotal[0].Total;
        postObject["NonBillableTotalHrs"] = formdata.NonBillableSubTotal[0].Total;
        postObject["GrandTotal"] = formdata.Total[0].Total;

        postObject["CommentsHistory"] = JSON.stringify(formdata.CommentsHistoryData),
            this.setState({ errorMessage: '', trFormdata: formdata });
        this.InsertorUpdatedata(postObject, formdata);
    }
    private handleReject = async () => {
        this.setState({ showConfirmDeletePopup: false })
        var formdata = { ...this.state.trFormdata };
        formdata = this.Calculate_Indvidual_OT_Weekly_TotalTime(formdata);
        var postObject = {};
        if (formdata.Status == StatusType.Submit) {
            formdata.CommentsHistoryData.push({ "Action": StatusType.Reject, "Role": "Manager", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
            postObject['Status'] = StatusType.ManagerReject;
        }
        else if (formdata.Status == StatusType.ManagerApprove) {
            formdata.CommentsHistoryData.push({ "Action": StatusType.Reject, "Role": "Reviewer", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
            postObject['Status'] = StatusType.ReviewerReject;
            postObject['Revised'] = true;
        }
        else if (formdata.Status == StatusType.ReviewerApprove) {
            formdata.CommentsHistoryData.push({ "Action": StatusType.Reject, "Role": "HR", "User": this.props.spContext.userDisplayName, "Comments": this.state.trFormdata.Comments.trim(), "Date": new Date().toISOString() })
            postObject['Status'] = StatusType.HRReject;
            postObject['Revised'] = true;
        }
        postObject['PendingWith'] = "Initiator";
        postObject['AssignedToId'] = { "results": [this.state.currentUserId] };

        //to avoid data miss match of TimeOffRec and timesheet timeoff in email
        postObject["BillableSubtotalHrs"] = JSON.stringify(formdata.BillableSubTotal);
        postObject["NonBillableSubTotalHrs"] = JSON.stringify(formdata.NonBillableSubTotal);
        postObject["TotalHrs"] = JSON.stringify(formdata.Total);
        postObject["PTOHrs"] = JSON.stringify(formdata.PTOHrs);
        postObject["BillableTotalHrs"] = formdata.BillableSubTotal[0].Total;
        postObject["NonBillableTotalHrs"] = formdata.NonBillableSubTotal[0].Total;
        postObject["GrandTotal"] = formdata.Total[0].Total;

        postObject["CommentsHistory"] = JSON.stringify(formdata.CommentsHistoryData),
            postObject['IsClientApprovalNeed'] = formdata.IsClientApprovalNeededUI;
        this.setState({ errorMessage: '', trFormdata: formdata });
        this.InsertorUpdatedata(postObject, formdata);
    }
    private handleCancel = async () => {
        this.setState({ redirect: true, showHideModal: false, ItemID: 0, errorMessage: '', loading: false, showToaster: false });
    }
    private InsertorUpdatedata(formdata, formObject) {
        this.setState({ loading: true });
        let tableContent;
        if (formObject.ClientName.toLowerCase().includes("synergy")) {
            tableContent = [formObject.SynergyOfficeHrs, formObject.PTOHrs, formObject.ClientHolidayHrs, formObject.Total]
        }
        else {
            tableContent = [formObject.WeeklySubTotalHrs, formObject.OTSubTotalHrs, formObject.PTOHrs, formObject.ClientHolidayHrs, formObject.Total]
        }
        let sub = '';
        let SubjectLabel = '';
        let emaildetails = {};
        let To = [];
        let CC = [];
        //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
        // let PTOHrs=formObject.PTOHrs[0].Total;
        // if(parseFloat(formObject.PTOHrs[0].PTOAfterDeduction)<0)
        // PTOHrs=parseFloat(formObject.PTOHrs[0].Total)+parseFloat(formObject.PTOHrs[0].PTOAfterDeduction);// Code for PTO:Calculating PTOHrs considering from Timeoff Hrs 
        let TransactionsData = [];
        let PTOHrs = this.state.totalPTOFormData.PTOTotal;
        if ((parseFloat(formObject.PTOHrs[0].Total) != 0 || !this.state.totalPTOFormData.IsActive)) {
            TransactionsData = this.calculatePTOTransactions(formObject.PTOHrs[0].PTOAfterDeduction, this.state.PTOTransactions);
        }
        if (this.state.ItemID != 0) { //update existing record
            sp.web.lists.getByTitle(this.listName).items.getById(this.state.ItemID).update(formdata).then(async (res) => {
                if (StatusType.Save == formdata.Status) {
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0) //update Time and transactions only if timeoff entered
                    {
                        await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                        // to avoid duplicate timeoffrec while without leaving timesheet form
                        if (!this.state.TimeOffRec.length) {
                            let TimeOffRecData = await this.checkTimeOffRecIsExists(formObject); // for binding Time Off row data with TimeOffRequest data
                            this.setState({ TimeOffRec: TimeOffRecData.TimeOff, PTOTransactionsListData: TimeOffRecData.PTOTransactions });
                        }
                    }
                    customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet saved successfully', 2000);
                    //this.getItemData(this.state.ItemID, this.state.Delegations);
                    this.setState({ loading: false });
                }
                else if (StatusType.Revoke == formdata.Status) {
                    // Code for PTO Addition after Revoke start
                    if (formObject.EligibleforPTO && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                        //Below is for : after revoke, postData to EmployeePTO
                        let PTOData = {
                            PTOBalanceAfterDeduction: (parseFloat(formObject.PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4),
                        }
                        if (formObject.Status == StatusType.Approved) //calculations for Revoked after reviewer Approve 
                        {
                            PTOData['PTOBalance'] = (parseFloat(formObject.PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4);
                            PTOData['PTOAvailed'] = (parseFloat(formObject.PTOAvailed) - parseFloat(PTOHrs)).toFixed(4);
                        }
                        else if ([StatusType.Submit, StatusType.ManagerApprove].includes(formObject.Status))//calculations for Revoked after manager Approve[but currently Revoke is not provided after manager approve. future purpose included this status also] or submit
                        {
                            PTOData['PTOApplied'] = (parseFloat(formObject.PTOApplied) - parseFloat(PTOHrs)).toFixed(4);
                        }
                        //COMMENTED TO  STOP PTO CONSIDERATION FROM TIMESHEET FORM
                        if (this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && [StatusType.Submit].includes(this.state.TimeOffRec[0].Status)) //if TimeOffRec exists for week and Staus is in Submit state, then only Revoke the TimeOffRequest
                        {
                            //Below is for : after revoke, form is not get reloaded, so to get updated PTO balance
                            formObject.PTOBalanceAfterDeduction = (parseFloat(formObject.PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4);
                            if (formObject.Status == StatusType.Approved) //calculations for Revoked after reviewer Approve 
                            {
                                formObject.PTOBalance = (parseFloat(formObject.PTOBalance) + parseFloat(PTOHrs)).toFixed(4);
                                formObject.PTOAvailed = (parseFloat(formObject.PTOAvailed) - parseFloat(PTOHrs)).toFixed(4);
                            }
                            else if ([StatusType.Submit, StatusType.ManagerApprove].includes(formObject.Status))//calculations for Revoked after manager Approve[but currently Revoke is not provided after manager approve. future purpose included this status also] or submit
                            {
                                formObject.PTOApplied = (parseFloat(formObject.PTOApplied) - parseFloat(PTOHrs)).toFixed(4);
                            }
                            //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                            await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {
                            }, (error) => {
                                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                                console.log(error);
                            });
                        }
                    }
                    //Code for PTO Addition after Revoke end
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0 && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && [StatusType.Submit].includes(this.state.TimeOffRec[0].Status)) {
                        await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                    }
                    this.setState({ loading: false, trFormdata: formObject });
                    customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet ' + StatusType.Revoke.toLowerCase() + ' successfully', 2000);
                    this.getItemData(this.state.ItemID, this.state.Delegations);
                }
                else if (StatusType.Submit == formdata.Status) {
                    // Code for PTO Deduction after Submit start
                    if (formObject.EligibleforPTO && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                        let PTOData = {
                            PTOBalanceAfterDeduction: (parseFloat(formObject.PTOBalanceAfterDeduction) - parseFloat(PTOHrs)).toFixed(4),
                            PTOApplied: (parseFloat(formObject.PTOApplied) + parseFloat(PTOHrs)).toFixed(4)
                        }
                        if (!this.state.TimeOffRec.length || [StatusType.Save, StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject, StatusType.Revoke].includes(this.state.TimeOffRec[0].Status)) //if TimeOffRec not exists for week / TimeOffRequest stauts is save/Revoke/Reject ,then only deduct the PTO data
                        {
                            await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {
                            }, (error) => {
                                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                                console.log(error);
                            });
                        }
                    }
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0) //update Time and transactions only if timeoff entered
                    {
                        if (this.state.PTOTransactionsListData.length) {
                            let exsistingData = [];
                            for (let row of this.state.PTOTransactionsListData) {

                                let ddfrmt = row.PostedOn.split('T')[0];
                                ddfrmt = DateUtilities.getDateMMDDYYYY(ddfrmt);
                                exsistingData.push({
                                    ID: row.ID,
                                    DayDate: ddfrmt,
                                    Hours: parseFloat(row.Hours),
                                    TimeOffTypes: [null, undefined, ''].includes(row.TimeOffTypes) ? [] : JSON.parse(row.TimeOffTypes),
                                    PreviousPTOBalance: parseFloat(row.PreviousPTOBalance),
                                    CurrentPTOBalance: parseFloat(row.CurrentPTOBalance),
                                })
                            }

                            let postData = this.getPTOTransactionsData(exsistingData, TransactionsData)
                            // TimeOffFormRequest post Object: START
                            await this.AddTimeOffRequestAndTransactions(postData, formdata, formObject);
                            // TimeOffFormRequest post Object: END
                        }
                        else {
                            // now applied for pto previously did not apply
                            // TimeOffFormRequest post Object: START
                            await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                            // TimeOffFormRequest post Object: END
                        }
                    }
                    //Code for PTO Deduction after Submit end
                    this.setState({ ActionToasterMessage: 'Success-' + StatusType.Submit, loading: false, redirect: true });

                }
                else if ([StatusType.ReviewerReject, StatusType.HRReject, StatusType.Save].includes(formObject.Status))  //submitted after Reviewer Reject or Reviewer reject->save but client Approval not needed or not depends on IsClientApprovalNeeded
                {
                    // Code for PTO Deduction after Submit start
                    if (formObject.EligibleforPTO && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                        let PTOData = {
                            PTOBalanceAfterDeduction: (parseFloat(formObject.PTOBalanceAfterDeduction) - parseFloat(PTOHrs)).toFixed(4),
                            PTOApplied: (parseFloat(formObject.PTOApplied) + parseFloat(PTOHrs)).toFixed(4)
                        }
                        if (!this.state.TimeOffRec.length || [StatusType.Save, StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject, StatusType.Revoke].includes(this.state.TimeOffRec[0].Status)) //if TimeOffRec not exists for week / TimeOffRequest stauts is save/Revoke/Reject ,then only deduct the PTO data
                        {
                            await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {

                            }, (error) => {
                                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
                                console.log(error);
                            });
                        }
                    }
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0) //update Time and transactions only if timeoff entered
                    {
                        if (this.state.PTOTransactionsListData.length) {
                            let exsistingData = [];
                            for (let row of this.state.PTOTransactionsListData) {

                                let ddfrmt = row.PostedOn.split('T')[0];
                                ddfrmt = DateUtilities.getDateMMDDYYYY(ddfrmt);
                                exsistingData.push({
                                    ID: row.ID,
                                    DayDate: ddfrmt,
                                    Hours: parseFloat(row.Hours),
                                    TimeOffTypes: [null, undefined, ''].includes(row.TimeOffTypes) ? [] : JSON.parse(row.TimeOffTypes),
                                    PreviousPTOBalance: parseFloat(row.PreviousPTOBalance),
                                    CurrentPTOBalance: parseFloat(row.CurrentPTOBalance),
                                })
                            }

                            let postData = this.getPTOTransactionsData(exsistingData, TransactionsData)
                            // TimeOffFormRequest post Object: START
                            await this.AddTimeOffRequestAndTransactions(postData, formdata, formObject);
                            // TimeOffFormRequest post Object: END
                        }
                        else {
                            // now applied for pto previously did not apply
                            // TimeOffFormRequest post Object: START
                            await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                            // TimeOffFormRequest post Object: END
                        }
                    }
                    //Code for PTO Deduction after Submit end
                    this.setState({ ActionToasterMessage: 'Success-' + StatusType.Submit, loading: false, redirect: true });

                }
                else if ([StatusType.ManagerApprove, StatusType.ReviewerApprove, StatusType.Approved].includes(formdata.Status)) {
                    if (formdata.Status == StatusType.Approved) {
                        // Code for PTO Deduction after approve start
                        if (formObject.EligibleforPTO && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                            let PTOData = {
                                PTOBalance: (parseFloat(formObject.PTOBalance) - parseFloat(PTOHrs)).toFixed(4),
                                PTOApplied: (parseFloat(formObject.PTOApplied) - parseFloat(PTOHrs)).toFixed(4),
                                PTOAvailed: (parseFloat(formObject.PTOAvailed) + parseFloat(PTOHrs)).toFixed(4),
                            }
                            //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                            await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {
                                //console.log("PTO updated successfully.");
                            }, (error) => {
                                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                                console.log(error);
                            });
                        }
                        //Code for PTO Deduction after approve end

                    }
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0 && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && [StatusType.ReviewerApprove, StatusType.Approved].includes(formdata.Status) && ![StatusType.Approved].includes(this.state.TimeOffRec[0].Stauts))//incase after final approval, admin revokedtimesheet ,corresponding timeoff rec is still approved, so last condition added, if not approved then only approve timeoff rec
                    {
                        await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                    }
                    this.setState({ ActionToasterMessage: 'Success-' + StatusType.Approved, loading: false, redirect: true });
                }
                else if ([StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject].includes(formdata.Status)) {
                    // Code for PTO Addition after Reject start
                    if (formObject.EligibleforPTO && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                        let PTOData = {
                            PTOBalanceAfterDeduction: (parseFloat(formObject.PTOBalanceAfterDeduction) + parseFloat(PTOHrs)).toFixed(4),
                            PTOApplied: (parseFloat(formObject.PTOApplied) - parseFloat(PTOHrs)).toFixed(4)
                        }
                        //COMMENTED TO STOP PTO CONSIDERATION FROM TIMESHEET FORM
                        await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {
                            //console.log("PTO updated successfully.");
                        }, (error) => {
                            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                            console.log(error);
                        });
                    }
                    if (parseFloat(formObject.PTOHrs[0].Total) != 0 && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm) {
                        await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                    }
                    //Code for PTO Addition after Reject end
                    this.setState({ ActionToasterMessage: 'Success-' + StatusType.Reject, loading: false, redirect: true });
                }
            }, (error) => {
                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
                console.log(error);
            });
        }
        else {   //Add New record
            try {
                this.setState({ loading: true });
                let TransactionsData = [];
                sp.web.lists.getByTitle(this.listName).items.add(formdata).then(async (res) => {
                    let ItemID = res.data.Id;
                    if (StatusType.Save == formdata.Status) {
                        if (parseFloat(formObject.PTOHrs[0].Total) != 0) {
                            await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                            // to avoid duplicate timeoffrec while without leaving timesheet form
                           setTimeout(async ()=>{ if (!this.state.TimeOffRec.length) {
                                let TimeOffRecData = await this.checkTimeOffRecIsExists(formObject); // for binding Time Off row data with TimeOffRequest data
                                this.setState({ TimeOffRec: TimeOffRecData.TimeOff, PTOTransactionsListData: TimeOffRecData.PTOTransactions });
                            }},1000);
                        }
                        customToaster('toster-success', ToasterTypes.Success, 'Weekly timesheet saved successfully', 2000)
                        this.setState({ ItemID: ItemID, loading: false });
                    }
                    else if (StatusType.Submit == formdata.Status) {
                        // Code for PTO Deduction after Submit start
                        if (formObject.EligibleforPTO && parseFloat(formObject.PTOHrs[0].Total) != 0 && parseFloat(PTOHrs) > 0) {
                            let PTOData = {
                                PTOBalanceAfterDeduction: (parseFloat(formObject.PTOBalanceAfterDeduction) - parseFloat(PTOHrs)).toFixed(4),
                                PTOApplied: (parseFloat(formObject.PTOApplied) + parseFloat(PTOHrs)).toFixed(4)
                            }
                            TransactionsData = this.calculatePTOTransactions(formObject.PTOHrs[0].PTOAfterDeduction, this.state.PTOTransactions);
                            if (!this.state.TimeOffRec.length || [StatusType.Save, StatusType.ManagerReject, StatusType.HRReject, StatusType.Revoke].includes(this.state.TimeOffRec[0].Status)) //if TimeOffRec not exists for week / TimeOffRequest stauts is save/Revoke/Reject ,then only deduct the PTO data
                            {
                                await sp.web.lists.getByTitle('EmployeePTO').items.getById(formObject.EmployeeID).update(PTOData).then((PTODedcRes) => {
                                }, (error) => {
                                    this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                                    console.log(error);
                                });
                            }
                        }
                        if (parseFloat(formObject.PTOHrs[0].Total) != 0) {
                            await this.AddTimeOffRequestAndTransactions(TransactionsData, formdata, formObject);
                        }
                        //Code for PTO Deduction after Submit end
                        this.setState({ ActionToasterMessage: 'Success-' + StatusType.Submit, loading: false, redirect: true });
                    }
                }, (error) => {
                    console.log(error);
                    this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
                });
            }
            catch (e) {
                console.log('Failed to add');
                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
            }

        }
    }
    private checkIsManagerReviewerSame = (formdata) => {
        let IsReportingManagerReviewerSame = false;
        //for (let RM of formdata.ReportingManagersEmail) { commented on 26/06/2024 bug if RM exists in Reviewer , but another RM perform action  but in email shown as action performed by reviewer
        let currentActioner = this.props.spContext.userEmail;
        for (let Rew of formdata.ReviewersEmail) {
            if (currentActioner == Rew) {
                IsReportingManagerReviewerSame = true;
                break;
            }

        }
        //condition for: if RM, Reviewer same, but Rm delegated ,if delegated manager approve status is directly approved. 27/06/2024
        if (!IsReportingManagerReviewerSame && formdata.IsDelegated) {
            let DelegatedRM;
            let Delegations = this.state.Delegations.filter(i => ![undefined, null, ''].includes(i.Authorizer));
            for (let i in Delegations) {
                if (Delegations[i].DelegateTo.EMail == currentActioner) {
                    DelegatedRM = Delegations[i].Authorizer.EMail;
                    break;
                }
            }
            for (let Rew of formdata.ReviewersEmail) {
                // if (DelegatedRM == Rew && DelegatedRM == currentActioner) { //no need to compare && DelegatedRM == currentActioner , this bug identified when  ticket ID #938  raised by Mercedes
                if (DelegatedRM == Rew) {
                    IsReportingManagerReviewerSame = true;
                    break;
                }
            }
        }

        return IsReportingManagerReviewerSame;
    }
    //new function to integrating TimeOffRequest form into timesheet form
    private AddTimeOffRequestAndTransactions = async (TransactionsData, formdata, formObject) => {
        let Status = formdata.Status;
        if (formObject.CommentsHistoryData.length > 2 && ((formObject.CommentsHistoryData[formObject.CommentsHistoryData.length - 2]['Role'] == "Reviewer" && [StatusType.ReviewerReject, StatusType.Save].includes(formObject.Status)) || (formObject.CommentsHistoryData[formObject.CommentsHistoryData.length - 2]['Role'] == "HR" && [StatusType.HRReject, StatusType.Save].includes(formObject.Status)))) //condition1 : if Timesheet rejected by reviewer witout client approval need, after that resubmitted . in this case Status is updated as Submitted
        //condition2 : if Timesheet rejected by HR witout reviewer approval need, after that resubmitted . in this case Status is updated as Submitted
        {
            Status = StatusType.Submit;
        }
        let TimeOffFormRequestPostObj = await this.getTimeOffRequestPostObj(Status);
        if (!this.state.TimeOffRec.length && this.state.totalPTOFormData.IsActive) //if TimeoffRec did not exists, Add TimeOffRequest and add transactions,only if status is submitted
        {
            sp.web.lists.getByTitle('TimeOffEmployees').items.add(TimeOffFormRequestPostObj).then(TimeOffRecResp => {
                const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO
                if ([StatusType.Submit].includes(Status)) {
                    for (const row of TransactionsData) {
                        let PTOTransaction = {
                            ClientName: formObject.ClientName,
                            TimeOffID: TimeOffRecResp.data.Id.toString(),
                            EmployeeId: this.state.currentUserId,
                            TransactionType: Status,
                            PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            SubmittedDate: this.addBrowserwrtServer(new Date()),
                            From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            Hours: parseFloat(row['Hours']).toFixed(4),
                            TimeOffTypes: JSON.stringify(row['TimeOffTypes']),
                            PreviousPTOBalance: parseFloat(row['PreviousPTOBalance']).toFixed(4),
                            CurrentPTOBalance: parseFloat(row['CurrentPTOBalance']).toFixed(4),
                            Reason: [StatusType.Submit, StatusType.Save].includes(Status) ? this.state.totalPTOFormData.TOComments : '',
                            Year: new Date(row['DayDate']).getFullYear().toString(),
                            IsActive: true,
                            EmpMatrixID: this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id.toString() : '0'
                        }
                        sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOTransactionBatch).add(PTOTransaction);
                    }
                    Promise.all([PTOTransactionBatch.execute()]).then((PTOTranc) => {
                        //console.log("PTO transaction added successfully.");
                        //   alert('PTOTransaction Added')
                    }, (error) => {
                        this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
                        console.log(error);
                    });
                }
            }, (error) => {
                console.log('Error while adding time Off Record' + error);
            });
        }
        else {  //if TimeoffRec exists, update TimeOffRequest and add transactions,only if status is submitted
            if ([StatusType.Save, StatusType.Revoke, StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject].includes(this.state.TimeOffRec[0].Status) || ([StatusType.Revoke].includes(Status) && [StatusType.Submit].includes(this.state.TimeOffRec[0].Status)) || ([StatusType.ManagerReject, StatusType.ReviewerApprove, StatusType.ReviewerReject, StatusType.HRReject, StatusType.Approved].includes(formdata.Status) && this.state.TimeOffRec.length && this.state.TimeOffRec[0].IsSubmittedFromTimesheetForm))  //condition1: if Time Off Request Status is in Save/Revoked , then only save/Submit the TimeOffRequest. condition2: if Time Off Request Status is in Submit , then only Revoke the TimeOffRequest condition3: ManagerReject/ReviewerApprove/ReviewerReject/HRApprove only if tiemoff submitted from timeshet form.
            {
                const PTOTransactionBatch = await this.getTimeOffAndtransactionBatchCalls(TimeOffFormRequestPostObj, Status, formObject, TransactionsData);

                Promise.all([PTOTransactionBatch.execute()]).then((PTOTranc) => {
                }, (error) => {
                    this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
                    console.log(error);
                });
            }
        }
    }
    //TimeOffRequest form integration related
    private getTimeOffAndtransactionBatchCalls = (TimeOffFormRequestPostObj, Status, formObject, TransactionsData) => {
        const PTOTransactionBatch = sp.web.createBatch(); // Regarding PTO
        sp.web.lists.getByTitle('TimeOffEmployees').items.getById(this.state.TimeOffRec[0].Id).inBatch(PTOTransactionBatch).update(TimeOffFormRequestPostObj);
        if ([StatusType.Submit].includes(Status)) {
            for (const row of TransactionsData) {
                let PTOTransaction = {
                    ClientName: formObject.ClientName,
                    TimeOffID: this.state.TimeOffRec[0].Id.toString(),
                    EmployeeId: this.state.currentUserId,
                    TransactionType: Status,
                    PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                    SubmittedDate: this.addBrowserwrtServer(new Date()),
                    From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                    To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                    Hours: parseFloat(row['Hours']).toFixed(4),
                    TimeOffTypes: JSON.stringify(row['TimeOffTypes']),
                    PreviousPTOBalance: parseFloat(row['PreviousPTOBalance']).toFixed(4),
                    CurrentPTOBalance: parseFloat(row['CurrentPTOBalance']).toFixed(4),
                    Reason: [StatusType.Submit, StatusType.Save].includes(Status) ? this.state.totalPTOFormData.TOComments : '',
                    Year: new Date(row['DayDate']).getFullYear().toString(),
                    IsActive: row['IsActive'],
                    EmpMatrixID: this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id.toString() : '0'
                }
                if (row['ID'] > 0)
                    sp.web.lists.getByTitle('PTOTransactions').items.getById(row.ID).inBatch(PTOTransactionBatch).update(PTOTransaction);
                else
                    sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOTransactionBatch).add(PTOTransaction);
            }
        }
        else {
            for (const row of this.state.PTOTransactionsListData) {
                let Transaction = {
                    TransactionType: Status,
                    IsActive: this.state.totalPTOFormData.IsActive //To update PTO transactions as inactive , if TOR form Reset
                }
                sp.web.lists.getByTitle('PTOTransactions').items.getById(row.Id).inBatch(PTOTransactionBatch).update(Transaction);
            }
        }
        return PTOTransactionBatch;
    }
    private getTimeOffRequestPostObj = async (Status) => {
        let SynergyManagerIds = await this.getSynergyManagerIds();
        //update comments history if status is Submit/Revoke
        let commentsObj = [], postObj;
        if (this.state.TimeOffRec.length && ![null, undefined, ''].includes(this.state.TimeOffRec[0]['CommentsHistory']))
            commentsObj = JSON.parse(this.state.TimeOffRec[0]['CommentsHistory']);
        let HistoryStatus = [StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject].includes(Status) ? StatusType.Reject : [StatusType.ReviewerApprove, StatusType.Approved].includes(Status) ? StatusType.Approved : Status;
        let HistoryRole = [StatusType.ManagerReject].includes(Status) ? 'Manager' : [StatusType.ReviewerReject, StatusType.ReviewerApprove].includes(Status) ? 'Reviewer' : [StatusType.HRReject, StatusType.Approved].includes(Status) ? 'HR' : 'Initiator';
        if (![StatusType.Save].includes(Status))
            commentsObj.push({ Action: HistoryStatus, Role: HistoryRole, User: this.props.spContext.userDisplayName, Comments: [StatusType.Submit, StatusType.Save].includes(Status) ? this.state.totalPTOFormData.TOComments : '', Date: new Date().toISOString() });
        postObj = {
            EmployeeId: this.state.currentUserId,
            From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.trFormdata.WeekStartDate))),
            To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(addDays(this.state.trFormdata.WeekStartDate, 6)))),
            PTOAvailableBalance: this.state.trFormdata.PTOHrs[0].PTOBalance.toString(),
            PreviousPTOBalance: this.state.trFormdata.PTOHrs[0].PTOBalance.toString(),
            CurrentPTOBalance: this.state.trFormdata.PTOHrs[0].PTOAfterDeduction.toString(),
            CommentsHistory: JSON.stringify(commentsObj),
            Status: Status,
            PendingWith: Status == StatusType.Submit ? "Manager" : "Initiator",
            SynergyManagerId: SynergyManagerIds,
            IsSubmitted: Status == StatusType.Submit ? true : false,
            //TO table related
            // TimeOffRows: JSON.stringify(this.state.totalPTOFormData.TimeOffData),
            // PTOSubTotal: JSON.stringify(this.state.totalPTOFormData.PTOSubTotal),
            // TOSubTotal: JSON.stringify(this.state.totalPTOFormData.TOSubTotal),
            // Total: JSON.stringify(this.state.totalPTOFormData.Total),
            TimeOffRows: JSON.stringify(this.convertShrtDayToFullDateObj(this.state.trFormdata.WeekStartDate, this.state.totalPTOFormData.TimeOffData)),
            PTOSubTotal: JSON.stringify(this.convertShrtDayToFullDateObj(this.state.trFormdata.WeekStartDate, this.state.totalPTOFormData.PTOSubTotal)),
            TOSubTotal: JSON.stringify(this.convertShrtDayToFullDateObj(this.state.trFormdata.WeekStartDate, this.state.totalPTOFormData.TOSubTotal)),
            Total: JSON.stringify(this.convertShrtDayToFullDateObj(this.state.trFormdata.WeekStartDate, this.state.totalPTOFormData.Total)),
            PTOTotal: this.state.totalPTOFormData.PTOTotal.toString(),
            TOTotal: this.state.totalPTOFormData.TOTotal.toString(),
            TotalHours: (this.state.totalPTOFormData.PTOTotal + this.state.totalPTOFormData.TOTotal).toString(),
            EligibleforPTO: this.state.trFormdata.EligibleforPTO,
            IsActive: this.state.totalPTOFormData.IsActive,
            EmpMatrixID: this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id.toString() : '0',
            IsSubmittedFromTimesheetForm: true,
            Comments: [StatusType.Submit, StatusType.Save].includes(Status) ? this.state.totalPTOFormData.TOComments : '',
        }
        // If Timesheet Revoked, update the TimeOffRequest also only if TimeOffRequest status is in submit state
        if ([StatusType.Revoke].includes(Status)) {
            let PrevBalance = parseFloat((parseFloat(this.state.trFormdata.PTOBalanceAfterDeduction) - parseFloat(this.state.totalPTOFormData.PTOTotal)).toFixed(4)).toString();//accurate Previous and current balances for mail
            postObj = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: Status,
                PendingWith: "Initiator",
                PreviousPTOBalance: PrevBalance,
                CurrentPTOBalance: parseFloat((parseFloat(PrevBalance) + parseFloat(this.state.totalPTOFormData.PTOTotal)).toFixed(4)).toString()
            }
            //below are for : after revoke form didnot get reloaded , to get updated status&comments history
            this.state.TimeOffRec[0].Status = StatusType.Revoke;
            this.state.TimeOffRec[0].CommentsHistory = JSON.stringify(commentsObj);
        }
        else if ([StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.HRReject].includes(Status)) {
            let PrevBalance = parseFloat((parseFloat(this.state.trFormdata.PTOBalanceAfterDeduction) - parseFloat(this.state.totalPTOFormData.PTOTotal)).toFixed(4)).toString();//accurate Previous and current balances for mail
            postObj = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: Status,
                PendingWith: "Initiator",
                PreviousPTOBalance: PrevBalance,
                CurrentPTOBalance: parseFloat((parseFloat(PrevBalance) + parseFloat(this.state.totalPTOFormData.PTOTotal)).toFixed(4)).toString()
            }
        }
        else if ([StatusType.ReviewerApprove, StatusType.Approved].includes(Status)) {
            postObj = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: [StatusType.ReviewerApprove].includes(Status) ? StatusType.ReviewerApprove : Status,
                PendingWith: [StatusType.ReviewerApprove].includes(Status) ? "HR" : "NA",
            }
        }

        return postObj;
    }
    private getSynergyManagerIds = async () => {
        let userID = this.state.currentUserId;
        let EmpfilterQuery = "Employee/Id eq '" + userID + "' and  IsActive eq '1'";
        let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let SynergyManagerIds = { results: [] };
        try {
            let EmpMatrixData = await sp.web.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll();
            if (EmpMatrixData.length) {
                if (![null, undefined, ''].includes(EmpMatrixData[0].SynergyManager) && EmpMatrixData[0].SynergyManager.length > 0) {
                    for (const user of EmpMatrixData[0].SynergyManager) {
                        SynergyManagerIds.results.push(user.ID);
                    }
                }
            }
            return SynergyManagerIds;
        }
        catch (e) {
            console.log('Failed to get SynergyManagerIds' + e);
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
        }
    }
    // PTO Transaction data functions STARTS
    private calculatePTOTransactions(PTOAfterDeduction, PTOTransactions) {
        PTOAfterDeduction = parseFloat(PTOAfterDeduction)
        var weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        // Calculate the original total balance
        const totalHoursApplied = PTOTransactions.reduce((sum, transaction) => {
            const hours = transaction[Object.keys(transaction)[0]] // Get the hours for each transaction
            if (hours != '')
                return sum + parseFloat(hours);
            else
                return sum;
        }, 0);

        const totalBalance = PTOAfterDeduction + totalHoursApplied; // Calculate total balance
        let remainingBalance = parseFloat(totalBalance.toFixed(4)); // Start with the total balance
        const adjustedTransactions = []; // This will hold the final transactions

        for (const transaction of PTOTransactions) {
            const date = Object.keys(transaction)[0]; // Get the date key
            const hoursRequested = parseFloat(transaction[date]); // Get the requested hours
            // Determine how many hours can be applied
            let hoursToApply = Math.min(hoursRequested, remainingBalance);
            hoursToApply = parseFloat(hoursToApply.toFixed(4))
            // If there are hours to apply, add to the adjusted transactions
            let TimeOffTypes = []; // to insert timeofftypes which are eligible for PTO in the PTO transactions
            if (hoursToApply > 0) {
                this.state.totalPTOFormData.TimeOffData.forEach(TORow => {
                    let weekday = new Date(date).getDay();
                    if (TORow.IsPTOEligible && !TimeOffTypes.includes(TORow.TimeOffType) && TORow[weeks[weekday]] != '' && parseFloat(TORow[weeks[weekday]]) > 0) {
                        TimeOffTypes.push(TORow.TimeOffType);
                    }
                }
                )
                adjustedTransactions.push({ ID: 0, 'DayDate': date, Hours: hoursToApply, TimeOffTypes: TimeOffTypes, PreviousPTOBalance: remainingBalance, CurrentPTOBalance: remainingBalance - hoursToApply, IsActive: true });
                remainingBalance -= hoursToApply; // Deduct the applied hours from the balance
            }

            // If the balance goes to zero or negative, we can stop processing further
            if (remainingBalance <= 0) {
                break;
            }
        }

        return adjustedTransactions; // Return the adjusted transactions
    }
    private mapDatesToHours = (data, date) => {
        // Parse the input date
        const startDate = new Date(date);

        // Get the day of the week for the start date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const startDay = startDate.getDay(); // This gives you the day of the week for the start date

        // Create an array to hold the results
        const result = [];

        // Define the mapping of days to the object properties
        const daysMapping = {
            0: 'Sun', // Sunday
            1: 'Mon', // Monday
            2: 'Tue', // Tuesday
            3: 'Wed', // Wednesday
            4: 'Thu', // Thursday
            5: 'Fri', // Friday
            6: 'Sat'  // Saturday
        };

        // Loop through the days of the week starting from the given date
        for (let i = 0; i < 7; i++) {
            // Calculate the current date
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i); // Increment the date

            // Get the day of the week for the current date
            const dayOfWeek = currentDate.getDay();
            // (startDay + i) % 7; // Wrap around the week

            // Get the corresponding property name
            const dayKey = daysMapping[dayOfWeek];

            // Get the value from the data object
            const value = [null, undefined, ''].includes(data[0][dayKey]) ? 0 : parseFloat(data[0][dayKey]);; // Assuming data is an array with one object

            // If there is a value, add it to the result
            if (value > 0) {
                result.push({
                    [DateUtilities.getDateMMDDYYYY(currentDate)]: value
                });
            }
        }
        return result;
    };
    private getPTOTransactionsData = (existingArray, newArray) => {
        const combinedArray = [];

        // Create a map for existing array for quick lookup
        const existingArrayMap = new Map();
        existingArray.forEach(item => {
            existingArrayMap.set(item.DayDate, { ...item, IsActive: true }); // Initialize with IsActive true
        });

        // Update existing entries and add new entries
        newArray.forEach(item => {
            const formattedDate = item.DayDate; // Use the date directly

            if (existingArrayMap.has(formattedDate)) {
                // Update existing entry
                const existingEntry = existingArrayMap.get(formattedDate);
                existingEntry.Hours = item.Hours; // Update hours
                existingEntry.TimeOffTypes = item.TimeOffTypes; // Update TimeOffTypes
                existingEntry.PreviousPTOBalance = item.PreviousPTOBalance,
                    existingEntry.CurrentPTOBalance = item.CurrentPTOBalance,
                    combinedArray.push(existingEntry); // Add updated entry to combined array
            } else {
                // Add new entry with ID 0
                combinedArray.push({
                    ID: 0,
                    DayDate: item.DayDate,
                    Hours: item.Hours,
                    TimeOffTypes: item.TimeOffTypes,
                    PreviousPTOBalance: item.PreviousPTOBalance,
                    CurrentPTOBalance: item.CurrentPTOBalance,
                    IsActive: true
                });
            }
        });

        // Mark entries in existing array as inactive if not present in new array
        existingArrayMap.forEach((value, key) => {
            if (!newArray.some(item => item.DayDate === key)) {
                value.IsActive = false; // Mark as inactive
                combinedArray.push(value); // Add inactive entry to combined array
            }
        });

        return combinedArray;
    };
    // PTO Transaction data functions ENDS
    private async validateDuplicateRecord(date, ClientName, trFormdata, isAlreadyCalledFromHCC_Func?) {
        let filterQuery = '';
        let ExistRecordData = [];
        let ClientNames = [];
        if (![null, "", undefined].includes(date)) {
            let prevDate = addDays(new Date(date), -1);
            let nextDate = addDays(new Date(date), 1);
            let prev = DateUtilities.getDateMMDDYYYY(prevDate);
            let next = DateUtilities.getDateMMDDYYYY(nextDate);
            filterQuery = `WeekStartDate gt '${prev}' and WeekStartDate lt '${next}' and ClientName eq '${ClientName}' and Initiator/ID eq '${this.state.currentUserId}' and EmpMatrixID eq '${this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id : 0}'`;
            let selectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,Reviewers/Id,ReportingManager/Id,ReportingManager/EMail,DelegateTo/EMail,Notifiers/EMail,*";
            ExistRecordData = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterQuery).select(selectQuery).expand('Initiator,Reviewers,ReportingManager,DelegateTo,Notifiers').get();
            //  console.log(ExistRecordData);
        }
        if (ExistRecordData.length >= 1) {
            let PTOTranscationsData = await sp.web.lists.getByTitle('PTOTransactions').items.filter("TimesheetID eq '" + ExistRecordData[0].ID + "' and IsActive eq '1'").select('*').get()

            trFormdata.ClientName = ExistRecordData[0].ClientName;
            trFormdata.Name = ExistRecordData[0].Name;
            let WS = DateUtilities.GetDateMMDDYYYYAsInList(ExistRecordData[0].WeekStartDate);
            let DS = DateUtilities.GetDateMMDDYYYYAsInList(ExistRecordData[0].DateSubmitted);
            trFormdata.WeekStartDate = new Date(WS);
            trFormdata.DateSubmitted = new Date(DS);
            trFormdata.WeeklyItemsData = JSON.parse(ExistRecordData[0].WeeklyHrs);
            trFormdata.OTItemsData = JSON.parse(ExistRecordData[0].OverTimeHrs);
            trFormdata.BillableSubTotal = JSON.parse(ExistRecordData[0].BillableSubtotalHrs);
            trFormdata.SynergyOfficeHrs = JSON.parse(ExistRecordData[0].SynergyOfficeHrs);
            trFormdata.SynergyHolidayHrs = JSON.parse(ExistRecordData[0].SynergyHolidayHrs);
            trFormdata.ClientHolidayHrs = JSON.parse(ExistRecordData[0].ClientHolidayHrs);
            trFormdata.PTOHrs = JSON.parse(ExistRecordData[0].PTOHrs);
            trFormdata.EligibleforPTO = [null, undefined].includes(ExistRecordData[0].EligibleforPTO) ? false : ExistRecordData[0].EligibleforPTO;
            trFormdata.WeeklyItemsTotalTime = ExistRecordData[0].WeeklyTotalHrs;
            trFormdata.OTItemsTotalTime = ExistRecordData[0].OTTotalHrs;
            trFormdata.WeeklySubTotalHrs = JSON.parse(ExistRecordData[0].WeeklySubTotalHrs)
            trFormdata.OTSubTotalHrs = JSON.parse(ExistRecordData[0].OTSubTotalHrs)
            trFormdata.NonBillableSubTotal = JSON.parse(ExistRecordData[0].NonBillableSubTotalHrs);
            trFormdata.Total = JSON.parse(ExistRecordData[0].TotalHrs);
            trFormdata.Status = ExistRecordData[0].Status;
            trFormdata.CommentsHistoryData = JSON.parse(ExistRecordData[0].CommentsHistory);
            trFormdata.Status == StatusType.Save ? trFormdata.Comments = ExistRecordData[0].Comments == null ? '' : ExistRecordData[0].Comments : trFormdata.Comments = '';
            trFormdata.SuperviserNames = JSON.parse(ExistRecordData[0].SuperviserName);
            trFormdata.Pendingwith = ExistRecordData[0].PendingWith;
            trFormdata.IsClientApprovalNeeded = ExistRecordData[0].IsClientApprovalNeed;
            trFormdata.IsClientApprovalNeededUI = false;
            trFormdata.Revised = ExistRecordData[0].Revised;
            trFormdata.IsSubmitted = ExistRecordData[0].IsSubmitted;
            let EmpEmail = [];
            let RMEmail = [];
            let RMId = [];
            let DelToEmail = [];
            let ReviewEmail = [];
            let ReviewId = [];
            let NotifyEmail = [];
            EmpEmail.push(ExistRecordData[0].Initiator.EMail);
            let EmpId = ExistRecordData[0].Initiator.ID;
            if (ExistRecordData[0].hasOwnProperty("ReportingManager")) {
                trFormdata.DelegateToEmails = [];
                trFormdata.DelegatedRMEmails = [];
                let Delegations = this.state.Delegations.filter(i => ![undefined, null, ''].includes(i.Authorizer));
                ExistRecordData[0].ReportingManager.map(i => {
                    RMEmail.push(i.EMail);
                    RMId.push(i.Id);
                    //code for automated delegation for reporting manager 
                    if (trFormdata.Pendingwith == "Manager") {
                        for (let j in Delegations) {
                            let From = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].From));
                            let To = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].To));
                            let FromDate = new Date(DateUtilities.getDateMMDDYYYY(From));
                            let ToDate = new Date(DateUtilities.getDateMMDDYYYY(To));
                            let Today = new Date(DateUtilities.getDateMMDDYYYY(new Date()));
                            if (i.Id == Delegations[j].Authorizer.Id && (Today >= FromDate && Today <= ToDate)) {
                                trFormdata.IsDelegated = true;
                                trFormdata.DelegateToEmails.push(Delegations[j].DelegateTo.EMail);
                                trFormdata.DelegateToIds.push(Delegations[j].DelegateTo.Id);
                                trFormdata.DelegatedRMEmails.push(Delegations[j].Authorizer.EMail);
                                break;
                            }
                        }
                    }
                });
            }
            if (ExistRecordData[0].hasOwnProperty("DelegateTo"))
                ExistRecordData[0].DelegateTo.map(i => (DelToEmail.push(i.EMail)));
            if (ExistRecordData[0].hasOwnProperty("Reviewers")) {
                let Delegations = this.state.Delegations.filter(i => ![undefined, null, ''].includes(i.Authorizer));
                ExistRecordData[0].Reviewers.map(i => {
                    ReviewEmail.push(i.EMail);
                    ReviewId.push(i.Id);
                    //code for automated delegation for reviewer
                    if (trFormdata.Pendingwith == "Reviewer") {
                        for (let j in Delegations) {
                            let From = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].From));
                            let To = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Delegations[j].To));
                            let FromDate = new Date(DateUtilities.getDateMMDDYYYY(From));
                            let ToDate = new Date(DateUtilities.getDateMMDDYYYY(To));
                            let Today = new Date(DateUtilities.getDateMMDDYYYY(new Date()));
                            if (i.Id == Delegations[j].Authorizer.Id && (Today >= FromDate && Today <= ToDate)) {
                                trFormdata.IsDelegated = true;
                                trFormdata.DelegateToEmails.push(Delegations[j].DelegateTo.EMail);
                                trFormdata.DelegateToIds.push(Delegations[j].DelegateTo.Id);
                                trFormdata.DelegatedRMEmails.push(Delegations[j].Authorizer.EMail);
                                break;
                            }
                        }
                    }
                });
            }
            if (ExistRecordData[0].hasOwnProperty("Notifiers"))
                ExistRecordData[0].Notifiers.map(i => (NotifyEmail.push(i.EMail)));
            if (trFormdata.CommentsHistoryData == null)
                trFormdata.CommentsHistoryData = [];

            trFormdata.ReportingManagersEmail = RMEmail;
            trFormdata.SuperviserIds = RMId;
            // trFormdata.DelegateToEmails = DelToEmail;
            trFormdata.ReviewersEmail = ReviewEmail;
            trFormdata.ReviewerIds = ReviewId;
            trFormdata.NotifiersEmail = NotifyEmail;
            let formatedFilename = 'Weekly Timesheet Report - ' + trFormdata.ClientName + ' (' + (DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate)) + ')';

            let showPDF = false;
            if (this.state.isAdmin) {
                if (![StatusType.Save.toString(), StatusType.Revoke.toString()].includes(this.state.trFormdata.Status))
                    showPDF = true;
            }
            let isApproved = false;//new Condition for binding inactive Clients also when the status is Submit/Approved/ManagerReject/ReviewerReject
            for (let obj of trFormdata.CommentsHistoryData) {
                if (obj['Action'] == StatusType.Approved) {
                    isApproved = true;
                    break;
                }
            }
            if (isApproved) {
                this.state.EmployeeMasterData.filter(employeeItem => {
                    ClientNames.push(employeeItem.ClientName);
                });
            }
            else {
                this.state.EmployeeMasterData.filter(employeeItem => {//to filter only active client names
                    let isActiveInClientMaster = this.state.ClientMasterData.some(ClientItem => ClientItem.Title == employeeItem.ClientName);
                    if (isActiveInClientMaster && employeeItem.IsActive) {
                        ClientNames.push(employeeItem.ClientName);
                    }
                });
            }
            this.state.ClientNames.sort();


            let PTOTransactions = this.mapDatesToHours(trFormdata.PTOHrs, trFormdata.WeekStartDate)
            this.setState({ trFormdata: trFormdata, PTOTransactions: PTOTransactions, currentWeeklyRowsCount: trFormdata.WeeklyItemsData.length, currentOTRowsCount: trFormdata.OTItemsData.length, ItemID: ExistRecordData[0].ID, EmployeeEmail: EmpEmail, currentUserId: EmpId, errorMessage: '', loading: false, showBillable: false, showNonBillable: false, PDFData: ExistRecordData, PDFFileName: formatedFilename, showPDFButton: showPDF, ClientNames: ClientNames });
            if ([StatusType.Submit, StatusType.Approved, StatusType.ManagerApprove].includes(ExistRecordData[0].Status)) {
                this.setState({ isSubmitted: true });
            }
            else if ([StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.Save, StatusType.Revoke].includes(ExistRecordData[0].Status)) {
                this.setState({ isSubmitted: false });
            }
            if ([StatusType.ReviewerReject, StatusType.Save].includes(ExistRecordData[0].Status)) {
                //Condition for Reviewer reject / Manager reject scenarios changed to save
                if (trFormdata.Revised && !ExistRecordData[0].IsClientApprovalNeed) {
                    this.setState({ showBillable: false })
                    if (trFormdata.CommentsHistoryData[trFormdata.CommentsHistoryData.length - 1]['Role'] == "Reviewer") {
                        if (ExistRecordData[0].IsClientApprovalNeed)
                            this.setState({ showBillable: false })
                        else
                            this.setState({ showBillable: true })
                    }
                }
                else if (trFormdata.Revised) {
                    if (ExistRecordData[0].IsClientApprovalNeed)
                        this.setState({ showBillable: false })
                    else
                        this.setState({ showBillable: true })
                }
            }
            //For getting Dateofjoining,DescriptionMandatory,ProjectCode Mandatory,WeekStartday of selected client
            for (var item of this.state.EmployeeMasterData) {
                if (item.ClientName.toLowerCase() == trFormdata.ClientName.toLowerCase()) {
                    trFormdata.DateOfJoining = new Date(item.DOJ);
                    trFormdata.IsDescriptionMandatory = item.IsDescriptionMandatory;
                    trFormdata.IsProjectCodeMandatory = item.IsProjectCodeMandatory;
                    trFormdata.WeekStartDay = item.WeekStartDay;
                    trFormdata.HolidayType = item.HolidayType;
                    if ([null, undefined, 0, ''].includes(this.state.ItemID) || ![StatusType.Submit, StatusType.ManagerApprove, StatusType.Approved].includes(trFormdata.Status)) //if Item exists and status is Submit/ManagerApprove/Approve,then hide PTO columns based on WeeklyTimesheet Data otherwise based on Employee Master Data
                        trFormdata.EligibleforPTO = item.EligibleforPTO;
                    let currentEmployeePTO = await this.getLatestPTOData(item.EmployeeID, trFormdata.WeekStartDate);
                    if (currentEmployeePTO.length) {
                        trFormdata.EmployeeID = currentEmployeePTO[0].ID;
                        trFormdata.PTOApplied = [null, undefined].includes(currentEmployeePTO[0].PTOApplied) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOApplied).toFixed(4);
                        trFormdata.PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalance) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalance).toFixed(4);
                        trFormdata.PTOBalanceAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4);
                        trFormdata.PTOAvailed = [null, undefined].includes(currentEmployeePTO[0].PTOAvailed) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOAvailed).toFixed(4);
                        if (trFormdata.EligibleforPTO && ![StatusType.ManagerApprove, StatusType.Approved, StatusType.Submit.toString()].includes(trFormdata.Status)) {
                            trFormdata.PTOHrs[0].PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString();
                            trFormdata.PTOHrs[0].PTOAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(trFormdata.PTOHrs[0].Total)).toFixed(4)).toString();
                        }
                    }
                    break;
                }
            }
            let WeekStartDate = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate));
            let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateOfJoining));
            this.WeekHeadings = [];
            this.WeekHeadings.push({
                "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsMonJoined": WeekStartDate < DateOfjoining,
                "IsDay1Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay1SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsTueJoined": WeekStartDate < DateOfjoining,
                "IsDay2Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay2SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsWedJoined": WeekStartDate < DateOfjoining,
                "IsDay3Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay3SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsThuJoined": WeekStartDate < DateOfjoining,
                "IsDay4Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay4SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsFriJoined": WeekStartDate < DateOfjoining,
                "IsDay5Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay5SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Sat": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "SatDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsSatJoined": WeekStartDate < DateOfjoining,
                "IsDay6Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay6SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Sun": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "SunDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsSunJoined": WeekStartDate < DateOfjoining,
                "IsDay7Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay7SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            })
        }
        else {
            trFormdata.ClientName = trFormdata.ClientName;
            trFormdata.Name = trFormdata.Name;
            trFormdata.WeekStartDate = trFormdata.WeekStartDate;
            trFormdata.DateSubmitted = new Date();
            trFormdata.WeeklyItemsData = [];
            trFormdata.OTItemsData = [];
            trFormdata.BillableSubTotal = [];
            trFormdata.SynergyOfficeHrs = [];
            trFormdata.SynergyHolidayHrs = [];
            trFormdata.ClientHolidayHrs = [];
            trFormdata.PTOHrs = [];
            //trFormdata.PTONewHrs = [];
            trFormdata.WeeklyItemsTotalTime = "0";
            trFormdata.OTItemsTotalTime = "0";
            trFormdata.WeeklySubTotalHrs = [];
            trFormdata.OTSubTotalHrs = [];
            trFormdata.NonBillableSubTotal = [];
            trFormdata.WeeklySubTotalHrs = [];
            trFormdata.OTSubTotalHrs = [];
            trFormdata.Total = [];
            trFormdata.Status = StatusType.Save;
            trFormdata.CommentsHistoryData = [];
            trFormdata.Comments = "";
            trFormdata.SuperviserNames = trFormdata.SuperviserNames;
            trFormdata.Pendingwith = "NA";
            trFormdata.WeeklyItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
            trFormdata.OTItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
            trFormdata.BillableSubTotal.push({ Type: "Billable Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
            trFormdata.SynergyOfficeHrs.push({ Type: "Office Hours", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
            trFormdata.SynergyHolidayHrs.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0', });
            trFormdata.ClientHolidayHrs.push({ Type: "Holiday", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
            trFormdata.PTOHrs.push({ Type: "Time Off", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', PTOBalance: '0.00', PTOAfterDeduction: '0.00', Total: '0.00', });
            trFormdata.PTOHrs[0].PTOBalance = trFormdata.PTOBalanceAfterDeduction;
            trFormdata.PTOHrs[0].PTOAfterDeduction = trFormdata.PTOBalanceAfterDeduction;
            trFormdata.NonBillableSubTotal.push({ Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
            trFormdata.WeeklySubTotalHrs.push({ Type: "Billable", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
            trFormdata.OTSubTotalHrs.push({ Type: "OT", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
            trFormdata.Total.push({ Type: "Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
            trFormdata.ReportingManagersEmail = [];
            trFormdata.DelegateToEmails = [];
            trFormdata.ReviewersEmail = [];
            trFormdata.NotifiersEmail = [];
            trFormdata.IsClientApprovalNeeded = false;
            trFormdata.IsClientApprovalNeededUI = false;
            trFormdata.Revised = false;
            trFormdata.IsSubmitted = false;
            trFormdata.IsDelegated = false;

            //For getting Dateofjoining,DescriptionMandatory,ProjectCOde Mandatory,WeekStartday of selected client
            for (var item of this.state.EmployeeMasterData) {
                if (item.ClientName.toLowerCase() == trFormdata.ClientName.toLowerCase()) {
                    trFormdata.DateOfJoining = new Date(item.DOJ);
                    trFormdata.IsDescriptionMandatory = item.IsDescriptionMandatory;
                    trFormdata.IsProjectCodeMandatory = item.IsProjectCodeMandatory;
                    trFormdata.WeekStartDay = item.WeekStartDay;
                    trFormdata.HolidayType = item.HolidayType;
                    trFormdata.EligibleforPTO = item.EligibleforPTO;
                    let currentEmployeePTO = await this.getLatestPTOData(item.EmployeeID, trFormdata.WeekStartDate);
                    if (currentEmployeePTO.length) {
                        trFormdata.EmployeeID = currentEmployeePTO[0].ID;
                        trFormdata.PTOApplied = [null, undefined].includes(currentEmployeePTO[0].PTOApplied) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOApplied).toFixed(4);
                        trFormdata.PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalance) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalance).toFixed(4);
                        trFormdata.PTOBalanceAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4);
                        trFormdata.PTOAvailed = [null, undefined].includes(currentEmployeePTO[0].PTOAvailed) ? '0.00' : parseFloat(currentEmployeePTO[0].PTOAvailed).toFixed(4);

                        if (trFormdata.EligibleforPTO && ![StatusType.ManagerApprove, StatusType.Approved, StatusType.Submit.toString()].includes(trFormdata.Status)) {
                            trFormdata.PTOHrs[0].PTOBalance = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat(parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString();
                            trFormdata.PTOHrs[0].PTOAfterDeduction = [null, undefined].includes(currentEmployeePTO[0].PTOBalanceAfterDeduction) ? '0.00' : parseFloat((parseFloat(currentEmployeePTO[0].PTOBalanceAfterDeduction) - parseFloat(trFormdata.PTOHrs[0].Total)).toFixed(4)).toString();
                        }
                    }
                    break;
                }
            }
            let WeekStartDate = ([null, undefined, ''].includes(trFormdata.WeekStartDate) ? new Date() : new Date(DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate)));
            let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateOfJoining));
            this.WeekHeadings = [];
            if (trFormdata.WeekStartDate == null) {
                this.WeekHeadings.push({
                    "Mon": "",
                    "MonDate": '',
                    "IsMonJoined": true,
                    "IsDay1Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay1SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Tue": "",
                    "TueDate": '',
                    "IsTueJoined": true,
                    "IsDay2Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay2SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Wed": "",
                    "WedDate": '',
                    "IsWedJoined": true,
                    "IsDay3Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay3SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Thu": "",
                    "ThuDate": '',
                    "IsThuJoined": true,
                    "IsDay4Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay4SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Fri": "",
                    "FriDate": '',
                    "IsFriJoined": true,
                    "IsDay5Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay5SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Sat": "",
                    "SatDate": '',
                    "IsSatJoined": true,
                    "IsDay6Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay6SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Sun": "",
                    "SunDate": '',
                    "IsSunJoined": true,
                    "IsDay7Holiday": { isHoliday: false, HolidayName: "" },
                    "IsDay7SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                })
            }
            else {
                this.WeekHeadings.push({
                    "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsMonJoined": WeekStartDate < DateOfjoining,
                    "IsDay1Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay1SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsTueJoined": WeekStartDate < DateOfjoining,
                    "IsDay2Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay2SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsWedJoined": WeekStartDate < DateOfjoining,
                    "IsDay3Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay3SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsThuJoined": WeekStartDate < DateOfjoining,
                    "IsDay4Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay4SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsFriJoined": WeekStartDate < DateOfjoining,
                    "IsDay5Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay5SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Sat": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "SatDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsSatJoined": WeekStartDate < DateOfjoining,
                    "IsDay6Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay6SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                    "Sun": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                    "SunDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                    "IsSunJoined": WeekStartDate < DateOfjoining,
                    "IsDay7Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                    "IsDay7SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                })
            }
            this.state.EmployeeMasterData.filter(employeeItem => { //to filter only active client names
                let isActiveInClientMaster = this.state.ClientMasterData.some(ClientItem => ClientItem.Title == employeeItem.ClientName);
                if (isActiveInClientMaster && employeeItem.IsActive) {
                    ClientNames.push(employeeItem.ClientName);
                }
            });
            ClientNames.sort();
            this.setState({ trFormdata: trFormdata, currentWeeklyRowsCount: trFormdata.WeeklyItemsData.length, currentOTRowsCount: trFormdata.OTItemsData.length, ItemID: 0, EmployeeEmail: this.state.EmployeeEmail, currentUserId: this.state.currentUserId, isSubmitted: false, errorMessage: '', showBillable: false, loading: false, showPDFButton: false, ClientNames: ClientNames, ptoFormData: [], totalPTOFormData: {} });

            if (ClientNames.length == 1 && isAlreadyCalledFromHCC_Func != 'yes') // isAlreadyCalledFromHCC_Func is required for handle inactiveclient timesheet subitted and  then onchange of Week Start Date get the active client  all data.
                this.handleClientChange(ClientNames[0], undefined, 'yes');
        }
        let TimeOffRecData = await this.checkTimeOffRecIsExists(trFormdata); // for binding Time Off row data with TimeOffRequest data
        this.setState({ TimeOffRec: TimeOffRecData.TimeOff, PTOTransactionsListData: TimeOffRecData.PTOTransactions });
        //code for automated delegation for reporting manager
        //same code goes here if email flow depends on is delegated,DelegteTo fields
        this.showApproveAndRejectButton(trFormdata);
        //To remove mandatory-FormContent-focus
        this.RemoveAll_mandatory_FormContent_focus(trFormdata);
    }
    // Functions to fetch TimeOffRecord data :START
    private checkTimeOffRecIsExists = async (trFormdata) => {
        let totalPTOFormData = {}, TimeOff = [], PTOTransactions = [], TimeOffRecPTOBalance = this.state.trFormdata.PTOBalanceAfterDeduction;
        if (!(trFormdata.WeekStartDate == null)) {
            TimeOff = await this.getTimeOffItemDataByFromDate(trFormdata.WeekStartDate);
            if (TimeOff.length) {
                PTOTransactions = await sp.web.lists.getByTitle('PTOTransactions').items.top(2000).filter("TimeOffID eq '" + TimeOff[0].Id + "' and IsActive eq '1'").select('*').getAll()// to update transactions if revoked
                totalPTOFormData = {
                    TimeOffData: this.convertFullDateToShrtDayObj(trFormdata.WeekStartDate, JSON.parse(TimeOff[0].TimeOffRows)),
                    PTOSubTotal: this.convertFullDateToShrtDayObj(trFormdata.WeekStartDate, JSON.parse(TimeOff[0].PTOSubTotal)),
                    TOSubTotal: this.convertFullDateToShrtDayObj(trFormdata.WeekStartDate, JSON.parse(TimeOff[0].TOSubTotal)),
                    Total: this.convertFullDateToShrtDayObj(trFormdata.WeekStartDate, JSON.parse(TimeOff[0].Total)),
                    PTOTotal: [null, undefined, ''].includes(TimeOff[0].PTOTotal) ? 0 : parseFloat(TimeOff[0].PTOTotal),
                    TOTotal: [null, undefined, ''].includes(TimeOff[0].TOTotal) ? 0 : parseFloat(TimeOff[0].TOTotal),
                    IsActive: TimeOff[0].IsActive,
                    TOComments: TimeOff[0].Comments
                }
                TimeOffRecPTOBalance = [null, undefined, ''].includes(TimeOff[0].PTOAvailableBalance) ? this.state.trFormdata.PTOBalanceAfterDeduction : parseFloat(TimeOff[0].PTOAvailableBalance).toFixed(4);
            }
        }
        await this.bindPTOFormData(totalPTOFormData, TimeOffRecPTOBalance, TimeOff);
        return { TimeOff: TimeOff, PTOTransactions: PTOTransactions };
    }
    private getTimeOffItemDataByFromDate = async (FromDate) => {
        let TimeOff = [];
        if (![null, "", undefined].includes(FromDate)) {
            let prevDate = addDays(new Date(FromDate), -1);
            let nextDate = addDays(new Date(FromDate), 1);
            let prev = DateUtilities.getDateMMDDYYYY(prevDate);
            let next = DateUtilities.getDateMMDDYYYY(nextDate);
            let StatusfilterQuery = `(Status ne '${StatusType.Withdraw}')`;
            let WeekEndDate = DateUtilities.getDateMMDDYYYY(addDays(new Date(FromDate), 6));
            let filterQuery = `(From le '${WeekEndDate}' and To ge '${prev}' and Employee/ID eq '${this.state.currentUserId}' and EmpMatrixID eq '${this.state.EmpMatrixRec.length ? this.state.EmpMatrixRec[0].Id : 0}' and IsActive eq 1) and ${StatusfilterQuery}`;
            let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
            try {
                TimeOff = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').getAll();
                if (TimeOff.length == 1 && TimeOff[0].IsSubmittedFromTimesheetForm)
                    return TimeOff;
                else {
                    let filteredWeekTOR = this.mapTimeOffDataToTimesheet(TimeOff, FromDate);
                    return filteredWeekTOR;
                }
            }
            catch (e) {
                console.log('Failed to get PTO Data');
                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
            }
        }

    }
    private mapTimeOffDataToTimesheet(timeOffRequests: any[], timesheetWeekStartDate: any) {
        const weekStart = new Date(timesheetWeekStartDate);
        const weekDays: string[] = [];
        try {
            // Build array of dates in the week (Mon–Fri)
            for (let i = 0; i < 5; i++) {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                weekDays.push(DateUtilities.getDateMMDDYYYY(d)); // e.g. '10/06/2025'
            }

            const matchedRequests = timeOffRequests.filter(req => {
                const from = new Date(DateUtilities.GetDateMMDDYYYYAsInList(req.From));
                const to = new Date(DateUtilities.GetDateMMDDYYYYAsInList(req.To));
                // check if the TOR overlaps with the timesheet week
                return to >= weekStart && from <= new Date(addDays(weekStart, 6));
            });

            if (matchedRequests.length === 0) return [];
            // Below Status is for holding HR approval ,if corresponding TOR is not approved
            let Status = matchedRequests[0].Status;
            if (matchedRequests.length > 1) {
                let fiteredTO = matchedRequests.find(i => ![StatusType.Approved, StatusType.Revoke].includes(i.Status));
                if (fiteredTO)
                    Status = fiteredTO.Status;
            }

            // --- NEW LOGIC: merge all TimeOffRows into one combined weekly record ---
            const allTimeOffRows = matchedRequests.flatMap(req => {
                const rows = typeof req.TimeOffRows === "string"
                    ? JSON.parse(req.TimeOffRows)
                    : Array.isArray(req) ? req : [req];
                return rows;
            });

            // Filter and aggregate across all records
            const filteredTimeOffRows = allTimeOffRows.map(row => {
                const filteredRow: any = {
                    TimeOffType: row.TimeOffType,
                    IsPTOEligible: row.IsPTOEligible,
                    Total: 0
                };

                weekDays.forEach(dayKey => {
                    const value = row[dayKey] || "";
                    if (value && !isNaN(Number(value))) {
                        filteredRow[dayKey] = Number(value);
                        filteredRow.Total += Number(value);
                    }
                });

                return filteredRow;
            });

            // --- Aggregate same TimeOffType across multiple requests ---
            const mergedRows: any[] = [];
            filteredTimeOffRows.forEach(row => {
                const existing = mergedRows.find(
                    r => r.TimeOffType === row.TimeOffType && r.IsPTOEligible === row.IsPTOEligible
                );
                if (existing) {
                    weekDays.forEach(day => {
                        existing[day] = (existing[day] || 0) + (row[day] || 0);
                    });
                    existing.Total += row.Total;
                } else {
                    mergedRows.push({ ...row });
                }
            });

            // --- Split PTO and TO ---
            const PTORows = mergedRows.filter(r => r.IsPTOEligible);
            const TORows = mergedRows.filter(r => !r.IsPTOEligible);

            const sumByDate = (rows: any[]) => {
                const totals: Record<string, number> = {};
                rows.forEach(r => {
                    weekDays.forEach(day => {
                        if (r[day]) totals[day] = (totals[day] || 0) + r[day];
                    });
                });
                return totals;
            };

            const ptoByDate = sumByDate(PTORows);
            const toByDate = sumByDate(TORows);
            const totalByDate: Record<string, number> = {};
            weekDays.forEach(day => {
                totalByDate[day] = (ptoByDate[day] || 0) + (toByDate[day] || 0);
            });

            const usedPTOThisWeek = Object.values(ptoByDate).reduce((a, b) => a + b, 0);
            const usedTOThisWeek = Object.values(toByDate).reduce((a, b) => a + b, 0);
            const prevBalance = parseFloat(matchedRequests[0]?.PreviousPTOBalance || "0");
            const currentBalance = prevBalance - usedPTOThisWeek;

            const result = [{
                ...matchedRequests[0],
                From: weekStart.toISOString(),
                To: new Date(addDays(weekStart, 6)).toISOString(),
                Status: Status,
                TimeOffRows: JSON.stringify(mergedRows),
                PTOSubTotal: JSON.stringify([{
                    Type: "Paid Time Off",
                    Total: usedPTOThisWeek.toString(),
                    ...ptoByDate
                }]),
                TOSubTotal: JSON.stringify([{
                    Type: "Time Off",
                    Total: usedTOThisWeek.toString(),
                    ...toByDate
                }]),
                Total: JSON.stringify([{
                    Type: "Total",
                    Total: (usedPTOThisWeek + usedTOThisWeek).toString(),
                    ...totalByDate
                }]),
                PTOTotal: usedPTOThisWeek.toString(),
                TOTotal: usedTOThisWeek.toString(),
                TotalHours: (usedPTOThisWeek + usedTOThisWeek).toFixed(4),
                PreviousPTOBalance: prevBalance.toFixed(4),
                CurrentPTOBalance: currentBalance.toFixed(4),
                PTOAvailableBalance: prevBalance.toFixed(4),
            }];
            return result;
        }
        catch (e) {
            console.log('Failed to map TOR Data to Timesheet');
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
        }
    }

    // Functions to fetch TimeOffRecord data :END
    private ClearTimesheetControls = (trFormdata) => {

        trFormdata.ClientName = "";
        trFormdata.Name == "" ? trFormdata.Name = "" : trFormdata.Name = trFormdata.Name;
        trFormdata.WeekStartDate = null;
        trFormdata.DateSubmitted = new Date();
        trFormdata.WeeklyItemsData = [];
        trFormdata.OTItemsData = [];
        trFormdata.BillableSubTotal = [];
        trFormdata.SynergyOfficeHrs = [];
        trFormdata.SynergyHolidayHrs = [];
        trFormdata.ClientHolidayHrs = [];
        trFormdata.PTOApplied = '0.00';
        trFormdata.PTOBalance = '0.00';
        trFormdata.PTOBalanceAfterDeduction = '0.00';
        trFormdata.PTOHrs = [];
        trFormdata.EligibleforPTO = false;
        trFormdata.EmployeeID = 0;
        trFormdata.WeeklyItemsTotalTime = "0";
        trFormdata.OTItemsTotalTime = "0";
        trFormdata.WeeklySubTotalHrs = [];
        trFormdata.OTSubTotalHrs = [];
        trFormdata.NonBillableSubTotal = [];
        trFormdata.WeeklySubTotalHrs = [];
        trFormdata.OTSubTotalHrs = [];
        trFormdata.Total = [];
        trFormdata.Status = StatusType.Save;
        trFormdata.CommentsHistoryData = [];
        trFormdata.Comments = "";
        trFormdata.SuperviserNames = [];
        trFormdata.Pendingwith = "NA";
        trFormdata.WeeklyItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.OTItemsData.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.BillableSubTotal.push({ Type: "Billable Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.SynergyOfficeHrs.push({ Type: "Office Hours", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.SynergyHolidayHrs.push({ Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.ClientHolidayHrs.push({ Type: "Holiday", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', Total: '0.00', });
        trFormdata.PTOHrs.push({ Type: "Time Off", Description: '', ProjectCode: '', Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '', PTOBalance: '0.00', PTOAfterDeduction: '0.00', Total: '0.00', });
        trFormdata.NonBillableSubTotal.push({ Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.WeeklySubTotalHrs.push({ Type: "Billable", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.OTSubTotalHrs.push({ Type: "OT", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.Total.push({ Type: "Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.000', Fri: '0.00', Sat: '0.00', Sun: '0.00', Total: '0.00', });
        trFormdata.ReportingManagersEmail = [];
        trFormdata.DelegatedRMEmails = [];
        trFormdata.DelegateToEMails = [];
        trFormdata.ReviewersEmail = [];
        trFormdata.NotifiersEmail = [];
        trFormdata.IsClientApprovalNeeded = false;
        trFormdata.IsClientApprovalNeededUI = false;
        trFormdata.Revised = false;
        trFormdata.IsSubmitted = false;
        trFormdata.IsDelegated = false;

        let WeekStartDate = ([null, undefined, ''].includes(trFormdata.WeekStartDate) ? new Date() : new Date(DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate)));
        let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateOfJoining));
        this.WeekHeadings = [];
        this.WeekHeadings.push({
            "Mon": "",
            "MonDate": "",
            "IsMonJoined": true,
            "IsDay1Holiday": { isHoliday: false, HolidayName: "" },
            "Tue": "",
            "TueDate": '',
            "IsTueJoined": true,
            "IsDay2Holiday": { isHoliday: false, HolidayName: "" },
            "Wed": "",
            "WedDate": '',
            "IsWedJoined": true,
            "IsDay3Holiday": { isHoliday: false, HolidayName: "" },
            "Thu": "",
            "ThuDate": '',
            "IsThuJoined": true,
            "IsDay4Holiday": { isHoliday: false, HolidayName: "" },
            "Fri": "",
            "FriDate": '',
            "IsFriJoined": true,
            "IsDay5Holiday": { isHoliday: false, HolidayName: "" },
            "Sat": "",
            "SatDate": '',
            "IsSatJoined": true,
            "IsDay6Holiday": { isHoliday: false, HolidayName: "" },
            "Sun": "",
            "IsSunJoined": true,
            "IsDay7Holiday": { isHoliday: false, HolidayName: "" },
        })

        this.setState({
            trFormdata: trFormdata, currentWeeklyRowsCount: trFormdata.WeeklyItemsData.length, currentOTRowsCount: trFormdata.OTItemsData.length, ItemID: 0, EmployeeEmail: this.state.EmployeeEmail, isSubmitted: true, errorMessage: '', showBillable: false, showPTO: false, isTimeOffEdit: false, showClickHereLink: false, ptoFormData: [],
            totalPTOFormData: {}, loading: false
        });

        this.showApproveAndRejectButton(trFormdata);
        //To remove mandatory-FormContent-focus
        this.RemoveAll_mandatory_FormContent_focus(trFormdata);
    }
    private handlefullClose = () => {

        this.setState({ redirect: true, ItemID: 0, showHideModal: false, errorMessage: '', loading: false });
    }
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    private removeBrowserwrtServer(date) {
        if (date != '') {
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() - ((this.props.spContext.webTimeZoneData.Bias + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    private showApproveAndRejectButton(trFormdata) {
        //let value = trFormdata.Status != StatusType.Save ? true : false;
        this.setState({ showPTO: false });
        let value = ![StatusType.Save, StatusType.Revoke, StatusType.ManagerReject, StatusType.ReviewerReject].includes(trFormdata.Status) ? true : false;
        let userGroups = this.state.UserGoups;
        let currUserId = this.props.spContext.userId;
        let isAdmin = false;
        let showClickHereLink = false;
        let userEmail = this.props.spContext.userEmail;

        if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins')) {
            isAdmin = true;
        }
        //for show/hide of SubmitSave Revoke buttons
        let managerApprove = StatusType.ManagerApprove.toString()
        let ReviewerApprove = StatusType.ReviewerApprove.toString()
        let Approve = StatusType.Approved.toString()
        let submit = StatusType.Submit.toString()
        if (currUserId == this.state.currentUserId || isAdmin) {
            if (trFormdata.EligibleforPTO) //to show PTO columns only for current employee/Admin/Reviewer
                this.setState({ showPTO: true });
            // if (![Approve, submit].includes(trFormdata.Status)) 
            //     this.setState({ showSubmitSavebtn: true})
            // else
            //     this.setState({ showSubmitSavebtn: false})

            // if ([Approve,submit].includes(trFormdata.Status))
            //     this.setState({showRevokebtn: true })
            // else
            //     this.setState({showRevokebtn:false })
            if (![managerApprove, ReviewerApprove, Approve, submit].includes(trFormdata.Status)) {
                let isTimeOffEdit = false;
                if (![null, undefined, ''].includes(trFormdata.WeekStartDate)) {
                    showClickHereLink = true;
                    if (!this.state.TimeOffRec.length) {
                        isTimeOffEdit = true;
                    }
                    else if ([StatusType.Save, StatusType.HRReject, StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.Revoke].includes(trFormdata.Status) && [StatusType.Save, StatusType.HRReject, StatusType.ManagerReject, StatusType.ReviewerReject, StatusType.Revoke].includes(this.state.TimeOffRec[0].Status)) {
                        isTimeOffEdit = true;
                    }

                }
                this.setState({ showSubmitSavebtn: true, isTimeOffEdit: isTimeOffEdit, showClickHereLink: showClickHereLink });
            }
            else {
                if (userEmail.toLowerCase().includes('synergy') && this.state.TimeOffRec.length)
                    showClickHereLink = true;
                this.setState({ showSubmitSavebtn: false, isTimeOffEdit: false, showClickHereLink: showClickHereLink });
            }

            let daysBetweenSubmitted_CurrDate = Math.ceil(Math.abs((new Date(DateUtilities.getDateMMDDYYYY(new Date())).getTime() - new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateSubmitted)).getTime())) / (24 * 60 * 60 * 1000));

            if ([submit].includes(trFormdata.Status) && daysBetweenSubmitted_CurrDate <= 30)
                this.setState({ showRevokebtn: true })
            else
                this.setState({ showRevokebtn: false })

            if (isAdmin)  //to show revoke button only for admin or Dashboard admin if status is Submit/Approved
            {
                if ([Approve, submit].includes(trFormdata.Status))
                    this.setState({ showRevokebtn: true })
                else
                    this.setState({ showRevokebtn: false })
            }
        }
        else {
            if (userEmail.toLowerCase().includes('synergy') && this.state.TimeOffRec.length)
                showClickHereLink = true;
            this.setState({ showSubmitSavebtn: false, showRevokebtn: false, showClickHereLink: showClickHereLink });
        }
        if (value) {
            // let RMEmails = trFormdata.ReportingManagersEmail;
            // let DelToEmails = trFormdata.DelegateToEmails;
            // let RevEmails = trFormdata.ReviewersEmail;
            let RMIds = trFormdata.SuperviserIds;
            let RevIds = trFormdata.ReviewerIds;
            let DelToIds = trFormdata.DelegateToIds;
            let NotDlgRM = [];
            let showPTO = false;
            // To filter not delegated reporting managers :this loop can be uncomment to show Approve/reject btns only to RM/reviewers who are not delegated ,i.e delegated RM/Reviewer not able to see Approve/Reject
            // for (let i in trFormdata.ReportingManagersEmail) {
            //     let isNotDlg=true;
            //     for (let j in trFormdata.DelegatedRMEmails) {
            //         if(trFormdata.ReportingManagersEmail[i]==trFormdata.DelegatedRMEmails[j])
            //         {
            //             isNotDlg=false;
            //             break;
            //         }
            //     }
            //     if(isNotDlg)
            //     {
            //         NotDlgRM.push(trFormdata.ReportingManagersEmail[i]);
            //     }
            // }
            if (currUserId == this.state.currentUserId) {
                value = false;
            }
            if (trFormdata.IsDelegated) {
                if (DelToIds.includes(currUserId)) {
                    if (trFormdata.Pendingwith == "Manager") {
                        value = true;
                        this.setState({ showApproveRejectbtn: value, IsReviewer: false })
                        return false;
                    }
                    else value = false;
                    //added on 26/06/2024 delegation applicable for Reviewer also
                    if (trFormdata.Pendingwith == "Reviewer") {
                        value = true;
                        showPTO = trFormdata.EligibleforPTO;
                        // //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR
                        // if(this.state.TimeOffRec.length && this.state.TimeOffRec[0].Status!=StatusType.Approved)
                        // {
                        //     isApproveRejectBtnDisabled = true;  
                        //    customToaster('toster-warning', ToasterTypes.Warning,"'time off request' pending with HR approval. Cannot approve/reject", 4000); 
                        // }
                        this.setState({ showApproveRejectbtn: value, showPTO: showPTO, IsReviewer: true });
                        return false;
                    }
                    else value = false;
                }
                else {
                    //if (NotDlgRM.includes(userEmail)) { this condition is for to show approve/reject buttons only those RM are not delegated
                    if (RMIds.includes(currUserId)) {   //this condition is for to show approve/reject buttons to All RM irrespective of delegation
                        if (trFormdata.Pendingwith == "Manager") {
                            value = true;
                            this.setState({ showApproveRejectbtn: value, IsReviewer: false })
                            return false;
                        }
                        else value = false;
                    } else value = false;
                    //added on 26/06/2024 delegation applicable for Reviewer also
                    if (RevIds.includes(currUserId)) {
                        // if (this.state.trFormdata.Pendingwith == "NA") {
                        if (trFormdata.Pendingwith == "Reviewer") {
                            value = true;
                            showPTO = trFormdata.EligibleforPTO;
                            //     //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR
                            // if(this.state.TimeOffRec.length && this.state.TimeOffRec[0].Status!=StatusType.Approved)
                            //     {
                            //         isApproveRejectBtnDisabled = true;  
                            //        customToaster('toster-warning', ToasterTypes.Warning,"'time off request' pending with HR approval. Cannot approve/reject", 4000); 
                            //     }
                            this.setState({ showApproveRejectbtn: value, showPTO: showPTO, IsReviewer: true })
                            return false;
                        }
                        else value = false;
                    } else value = false;
                }
            }
            else {
                if (RMIds.includes(currUserId)) {
                    if (trFormdata.Pendingwith == "Manager") {
                        value = true;
                        this.setState({ showApproveRejectbtn: value, IsReviewer: false })
                        return false;
                    }
                    else {
                        value = false
                    }
                }
                //added on 26/06/2024 delegation applicable for Reviewer also
                if (RevIds.includes(currUserId)) {
                    // if (this.state.trFormdata.Pendingwith == "NA") {
                    if (trFormdata.Pendingwith == "Reviewer") {
                        value = true;
                        showPTO = trFormdata.EligibleforPTO;
                        // //HOLDING THE REVIEWER FROM APPROVING THE TIMESHEET IF CORRESPONDING TimeOffRec is not approved by HR
                        // if(this.state.TimeOffRec.length && this.state.TimeOffRec[0].Status!=StatusType.Approved)
                        //     {
                        //         isApproveRejectBtnDisabled = true;  
                        //        customToaster('toster-warning', ToasterTypes.Warning,"'time off request' pending with HR approval. Cannot approve/reject", 4000); 
                        //     }
                        this.setState({ showApproveRejectbtn: value, showPTO: showPTO, IsReviewer: true });
                        return false;
                    }
                    else {
                        value = false;
                    }
                }
                if (userGroups.includes('Timesheet HR')) {
                    if (trFormdata.Pendingwith == "HR") {
                        value = true;
                        showPTO = trFormdata.EligibleforPTO;
                        this.setState({ showApproveRejectbtn: value, showPTO: showPTO });
                        return false;
                    }
                    else {
                        value = false;
                    }
                }
            }
            //commented on 26/06/2024 delegation applicable for Reviewer also
            // if (RevEmails.includes(userEmail)) {
            //     // if (this.state.trFormdata.Pendingwith == "NA") {
            //     if (trFormdata.Pendingwith == "Reviewer") {
            //         value = true;
            //         this.setState({ showApproveRejectbtn: value, IsReviewer: true })
            //         return false;
            //     }
            //     else {
            //         value = false
            //     }
            // }
            if (!RMIds.includes(currUserId)) {
                if (!RevIds.includes(currUserId)) {
                    if (!DelToIds.includes(currUserId))
                        value = false;
                }
            }
            this.setState({ showApproveRejectbtn: value, IsReviewer: false });
        }
        else {
            this.setState({ showApproveRejectbtn: value, IsReviewer: false });
        }
    }
    private FocusToFirstInteractiveControl() {
        if (this.state.UserGoups.includes('Timesheet Administrators') || this.state.UserGoups.includes('Dashboard Admins')) {
            setTimeout(() => { document.getElementById('Applying') ? document.getElementById('Applying').focus() : '' }, 300);
        }
        else {
            if (this.state.ClientNames.length > 1) {
                document.getElementById('Client').getElementsByTagName('input')[0].focus();
            }
            else {
                document.getElementById('divWeekStartDate').getElementsByTagName('input')[0].focus();
            }
        }
    }

    private userAccessableRecord(trFormdata) {  // commented old function and same impleted with comparing IDs , bug arised in PROD on 2/May/2025
        let currentUserId = this.props.spContext.userId;
        let userId = this.state.currentUserId;
        let SuperviserIds = trFormdata.SuperviserIds;
        let ReviewerIds = trFormdata.ReviewerIds;
        let DelegateToIds = trFormdata.DelegateToIds;
        let NotifierIds = trFormdata.NotifierIds;
        let userGroups = this.state.UserGoups;
        let isAccessable = false;
        if ([userId == currentUserId, SuperviserIds.includes(currentUserId), ReviewerIds.includes(currentUserId), DelegateToIds.includes(currentUserId), NotifierIds.includes(currentUserId), userGroups.includes('Timesheet Administrators'), userGroups.includes('Dashboard Admins'), userGroups.includes('Timesheet HR')].includes(true)) {
            isAccessable = true;
        }
        this.setState({ isRecordAcessable: isAccessable });
    }
    //function related to custom Validation
    private validateTimeControls(formdata, Action) {
        let isValid = { status: true, message: '' };
        let val;
        let Time;
        var isAllDaysEmpty;
        var isAllDaysTimeOff;
        var weeks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for (let key in formdata.Total[0]) {
            val = formdata.Total[0][key];
            let DayTime = 0;
            if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                DayTime = parseFloat(val);
                if (DayTime > 24) {
                    isValid.message = "Total working hours in a day must not exceed 24 hours.";
                    isValid.status = false;
                    document.getElementById("Total" + key).focus();
                    document.getElementById("Total" + key).classList.add('mandatory-FormContent-focus');
                    return isValid;
                }
            }
        }
        if (formdata.ClientName.toLowerCase().includes("synergy")) {
            for (let key in formdata.SynergyOfficeHrs[0]) //validation for invalid dots of Synergy Office Hrs 
            {
                if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                    if (formdata.SynergyOfficeHrs[0][key] == ".") {
                        isValid.message = "Please enter valid hours.";
                        isValid.status = false;
                        let control = document.getElementById(0 + "_" + key + "_SynOffcHrs") as HTMLInputElement;
                        if (!control.disabled) {
                            document.getElementById(0 + "_" + key + "_SynOffcHrs").focus();
                            document.getElementById(0 + "_" + key + "_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                    }
                }
            }
        }
        else if (!formdata.ClientName.toLowerCase().includes("synergy")) {
            for (let i in formdata.WeeklyItemsData) {
                for (let key in formdata.WeeklyItemsData[i]) //validation for  invalid dots of Weekly Hrs 
                {
                    if (!["Description", "ProjectCode", "Total"].includes(key)) {
                        if (formdata.WeeklyItemsData[i][key] == ".") {
                            isValid.message = "Please enter valid hours.";
                            isValid.status = false;
                            let control = document.getElementById(i + "_" + key + "_weekrow") as HTMLInputElement;
                            if (!control.disabled) {
                                document.getElementById(i + "_" + key + "_weekrow").focus();
                                document.getElementById(i + "_" + key + "_weekrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                        }
                    }
                }
            }
            for (let i in formdata.OTItemsData) {
                for (let key in formdata.OTItemsData[i]) //validation for  invalid dots of OT Hrs 
                {
                    if (!["Description", "ProjectCode", "Total"].includes(key)) {
                        if (formdata.OTItemsData[i][key] == ".") {
                            isValid.message = "Please enter valid hours.";
                            isValid.status = false;
                            let control = document.getElementById(i + "_" + key + "_otrow") as HTMLInputElement;
                            if (!control.disabled) {
                                document.getElementById(i + "_" + key + "_otrow").focus();
                                document.getElementById(i + "_" + key + "_otrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                        }
                    }
                }
            }
        }
        for (let key in formdata.ClientHolidayHrs[0]) //validation for invalid dots of ClientHoliday Hrs 
        {
            if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                if (formdata.ClientHolidayHrs[0][key] == ".") {
                    isValid.message = "Please enter valid hours.";
                    isValid.status = false;
                    let control = document.getElementById(0 + "_" + key + "_ClientHldHrs") as HTMLInputElement;
                    if (!control.disabled) {
                        document.getElementById(0 + "_" + key + "_ClientHldHrs").focus();
                        document.getElementById(0 + "_" + key + "_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                        return isValid;
                    }
                }
            }
        }
        for (let key in formdata.PTOHrs[0]) //validation for invalid dots of PTO Hrs 
        {
            if (!["Description", "ProjectCode", "Total", "Type", "PTOBalance", "PTOAfterDeduction"].includes(key)) {
                if (formdata.PTOHrs[0][key] == ".") {
                    isValid.message = "Please enter valid hours.";
                    isValid.status = false;
                    let control = document.getElementById(0 + "_" + key + "_PTOHrs") as HTMLInputElement;
                    if (!control.disabled) {
                        document.getElementById(0 + "_" + key + "_PTOHrs").focus();
                        document.getElementById(0 + "_" + key + "_PTOHrs").classList.add('mandatory-FormContent-focus');
                        return isValid;
                    }
                }
            }
        }

        if (Action == "Submit") {
            isAllDaysTimeOff = true;
            let EmptyTimeOffKey = '';
            for (let key in formdata.PTOHrs[0]) //validation if entire row is time off Hrs 
            {
                if (!["Description", "ProjectCode", "Total", "Type", "Sat", "Sun", "PTOBalance", "PTOAfterDeduction"].includes(key)) {
                    if (formdata.PTOHrs[0][key] == "" || parseFloat(formdata.PTOHrs[0][key]) == 0) {
                        isAllDaysTimeOff = false;
                        break;
                    }
                }
            }
            for (let key in formdata.PTOHrs[0]) //validation if  time off Hrs empty and Holiday Hrs empty
            {
                if (!["Description", "ProjectCode", "Total", "Type", "Sat", "Sun", "PTOBalance", "PTOAfterDeduction"].includes(key)) {
                    if ((formdata.PTOHrs[0][key] == "" || parseFloat(formdata.PTOHrs[0][key]) == 0) && (formdata.ClientHolidayHrs[0][key] == "" || parseFloat(formdata.ClientHolidayHrs[0][key]) == 0)) {
                        EmptyTimeOffKey = key;
                        break;
                    }
                }
            }
            if (formdata.ClientName.toLowerCase().includes("synergy")) {
                // if all days not time off in a week and if not time off day is also not holiday
                if (!isAllDaysTimeOff && (formdata.ClientHolidayHrs[0][EmptyTimeOffKey] == "" || parseFloat(formdata.ClientHolidayHrs[0][EmptyTimeOffKey]) == 0)) {
                    if (formdata.SynergyOfficeHrs[0].Description.trim() == "" && formdata.IsDescriptionMandatory) {
                        isValid.message = "Description cannot be blank.";
                        isValid.status = false;
                        document.getElementById("0_Description_SynOffcHrs").focus();
                        document.getElementById("0_Description_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                        return isValid;
                    }
                    else if (formdata.SynergyOfficeHrs[0].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory) {
                        isValid.message = "Project Code cannot be blank.";
                        isValid.status = false;
                        document.getElementById("0_ProjectCode_SynOffcHrs").focus();
                        document.getElementById("0_ProjectCode_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                        return isValid;
                    }
                    isAllDaysEmpty = true;
                    for (let key in formdata.SynergyOfficeHrs[0]) //validation if entire row Empty of  Synergy Office Hrs 
                    {
                        if (!["Description", "ProjectCode", "Total", "Type"].includes(key)) {
                            if (formdata.SynergyOfficeHrs[0][key] != "") {
                                isAllDaysEmpty = false;
                                break;
                            }
                        }
                    }
                    if (isAllDaysEmpty) {
                        // isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                        isValid.message = "Hours cannot be blank, Please provide valid hours.";
                        isValid.status = false;
                        for (let day of weeks) {
                            let control = document.getElementById("0_" + day + "_SynOffcHrs") as HTMLInputElement;
                            if (!control.disabled) {
                                document.getElementById("0_" + day + "_SynOffcHrs").focus();
                                document.getElementById("0_" + day + "_SynOffcHrs").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                        }
                    }
                }
            }
            else if (!formdata.ClientName.toLowerCase().includes("synergy")) {
                // if all days not time off in a week and if not time off day is also not holiday
                if (!isAllDaysTimeOff && (formdata.ClientHolidayHrs[0][EmptyTimeOffKey] == "" || parseFloat(formdata.ClientHolidayHrs[0][EmptyTimeOffKey]) == 0)) {
                    for (let i in formdata.WeeklyItemsData) {
                        if (formdata.WeeklyItemsData[i].Description.trim() == "" && formdata.IsDescriptionMandatory) {
                            isValid.message = "Description cannot be blank.";
                            isValid.status = false;
                            document.getElementById(i + "_Description_weekrow").focus();
                            document.getElementById(i + "_Description_weekrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        else if (formdata.WeeklyItemsData[i].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory) {
                            isValid.message = "Project Code cannot be blank.";
                            isValid.status = false;
                            document.getElementById(i + "_ProjectCode_weekrow").focus();
                            document.getElementById(i + "_ProjectCode_weekrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        isAllDaysEmpty = true;
                        for (let key in formdata.WeeklyItemsData[i]) //validation if entire row Empty of Weekly Hrs 
                        {
                            if (!["Description", "ProjectCode", "Total"].includes(key)) {
                                if (formdata.WeeklyItemsData[i][key] != "") {
                                    isAllDaysEmpty = false;
                                    break;
                                }
                            }
                        }
                        if (isAllDaysEmpty) {
                            // isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                            isValid.message = "Hours cannot be blank, Please provide valid hours.";
                            isValid.status = false
                            for (let day of weeks) {
                                let control = document.getElementById(i + "_" + day + "_weekrow") as HTMLInputElement;
                                if (!control.disabled) {
                                    document.getElementById(i + "_" + day + "_weekrow").focus();
                                    document.getElementById(i + "_" + day + "_weekrow").classList.add('mandatory-FormContent-focus');
                                    return isValid;
                                }
                            }
                        }
                    }
                    for (let i in formdata.OTItemsData) {
                        if (formdata.OTItemsData[i].Description.trim() == "" && formdata.IsDescriptionMandatory && parseFloat(formdata.OTItemsData[i].Total) != 0) {
                            isValid.message = "Description cannot be blank.";
                            isValid.status = false;
                            document.getElementById(i + "_Description_otrow").focus();
                            document.getElementById(i + "_Description_otrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        else if (formdata.OTItemsData[i].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory && parseFloat(formdata.OTItemsData[i].Total) != 0) {
                            isValid.message = "Project Code cannot be blank.";
                            isValid.status = false;
                            document.getElementById(i + "_ProjectCode_otrow").focus();
                            document.getElementById(i + "_ProjectCode_otrow").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        if (formdata.OTItemsData.length > 1)//validation if entire row Empty of OT Hrs And OT rows greater than 1 
                        {
                            isAllDaysEmpty = true;
                            for (let key in formdata.OTItemsData[i]) {
                                if (!["Description", "ProjectCode", "Total"].includes(key)) {
                                    if (formdata.OTItemsData[i][key] != "") {
                                        isAllDaysEmpty = false;
                                        break;
                                    }
                                }
                            }
                            if (isAllDaysEmpty) {
                                // isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                                isValid.message = "Hours cannot be blank, Please provide valid hours.";
                                isValid.status = false;
                                for (let day of weeks) {
                                    let control = document.getElementById(i + "_" + day + "_otrow") as HTMLInputElement;
                                    if (!control.disabled) {
                                        document.getElementById(i + "_" + day + "_otrow").focus();
                                        document.getElementById(i + "_" + day + "_otrow").classList.add('mandatory-FormContent-focus');
                                        return isValid;
                                    }
                                }

                            }
                        }
                    }
                }
                else if (isAllDaysTimeOff) {
                    if (formdata.WeeklyItemsData.length > 1) {
                        for (let i in formdata.WeeklyItemsData) {
                            if (formdata.WeeklyItemsData[i].Description.trim() == "" && formdata.IsDescriptionMandatory) {
                                isValid.message = "Description cannot be blank.";
                                isValid.status = false;
                                document.getElementById(i + "_Description_weekrow").focus();
                                document.getElementById(i + "_Description_weekrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                            else if (formdata.WeeklyItemsData[i].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory) {
                                isValid.message = "Project Code cannot be blank.";
                                isValid.status = false;
                                document.getElementById(i + "_ProjectCode_weekrow").focus();
                                document.getElementById(i + "_ProjectCode_weekrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                            isAllDaysEmpty = true;
                            for (let key in formdata.WeeklyItemsData[i]) //validation if entire row Empty of Weekly Hrs 
                            {
                                if (!["Description", "ProjectCode", "Total"].includes(key)) {
                                    if (formdata.WeeklyItemsData[i][key] != "") {
                                        isAllDaysEmpty = false;
                                        break;
                                    }
                                }
                            }
                            if (isAllDaysEmpty) {
                                // isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                                isValid.message = "Hours cannot be blank, Please provide valid hours.";
                                isValid.status = false
                                for (let day of weeks) {
                                    let control = document.getElementById(i + "_" + day + "_weekrow") as HTMLInputElement;
                                    if (!control.disabled) {
                                        document.getElementById(i + "_" + day + "_weekrow").focus();
                                        document.getElementById(i + "_" + day + "_weekrow").classList.add('mandatory-FormContent-focus');
                                        return isValid;
                                    }
                                }
                            }
                        }
                    }
                    if (formdata.OTItemsData.length > 1) {
                        for (let i in formdata.OTItemsData) {
                            if (formdata.OTItemsData[i].Description.trim() == "" && formdata.IsDescriptionMandatory && parseFloat(formdata.OTItemsData[i].Total) != 0) {
                                isValid.message = "Description cannot be blank.";
                                isValid.status = false;
                                document.getElementById(i + "_Description_otrow").focus();
                                document.getElementById(i + "_Description_otrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                            else if (formdata.OTItemsData[i].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory && parseFloat(formdata.OTItemsData[i].Total) != 0) {
                                isValid.message = "Project Code cannot be blank.";
                                isValid.status = false;
                                document.getElementById(i + "_ProjectCode_otrow").focus();
                                document.getElementById(i + "_ProjectCode_otrow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                            if (formdata.OTItemsData.length > 1)//validation if entire row Empty of OT Hrs And OT rows greater than 1 
                            {
                                isAllDaysEmpty = true;
                                for (let key in formdata.OTItemsData[i]) {
                                    if (!["Description", "ProjectCode", "Total"].includes(key)) {
                                        if (formdata.OTItemsData[i][key] != "") {
                                            isAllDaysEmpty = false;
                                            break;
                                        }
                                    }
                                }
                                if (isAllDaysEmpty) {
                                    // isValid.message = "Hours cannot be blank, Please provide atleast 0.";
                                    isValid.message = "Hours cannot be blank, Please provide valid hours.";
                                    isValid.status = false;
                                    for (let day of weeks) {
                                        let control = document.getElementById(i + "_" + day + "_otrow") as HTMLInputElement;
                                        if (!control.disabled) {
                                            document.getElementById(i + "_" + day + "_otrow").focus();
                                            document.getElementById(i + "_" + day + "_otrow").classList.add('mandatory-FormContent-focus');
                                            return isValid;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (formdata.ClientName.toLowerCase() != "") {
                    if (parseFloat(formdata.ClientHolidayHrs[0].Total) != 0) {
                        if (formdata.ClientHolidayHrs[0].Description.trim() == "" && formdata.IsDescriptionMandatory) {
                            isValid.message = "Description cannot be blank.";
                            isValid.status = false;
                            document.getElementById("0_Description_ClientHldHrs").focus();
                            document.getElementById("0_Description_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        else if (formdata.ClientHolidayHrs[0].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory) {
                            isValid.message = "Project Code cannot be blank.";
                            isValid.status = false;
                            document.getElementById("0_ProjectCode_ClientHldHrs").focus();
                            document.getElementById("0_ProjectCode_ClientHldHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                    }
                    if (parseFloat(formdata.PTOHrs[0].Total) != 0) {
                        if (formdata.PTOHrs[0].Description.trim() == "" && formdata.IsDescriptionMandatory) {
                            isValid.message = "Description cannot be blank.";
                            isValid.status = false;
                            document.getElementById("0_Description_PTOHrs").focus();
                            document.getElementById("0_Description_PTOHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                        else if (formdata.PTOHrs[0].ProjectCode.trim() == "" && formdata.IsProjectCodeMandatory) {
                            isValid.message = "Project Code cannot be blank.";
                            isValid.status = false;
                            document.getElementById("0_ProjectCode_PTOHrs").focus();
                            document.getElementById("0_ProjectCode_PTOHrs").classList.add('mandatory-FormContent-focus');
                            return isValid;
                        }
                    }
                }
            }
            val = formdata.Total[0].Total;
            Time = parseFloat(val);  //0 hours allow commented and  minimum 40 hours validation updated after TimeOffRequest form demo on 16th May 2025
            if (Time == 0 && formdata.Comments.trim() == "") {
                isValid.message = "'Comments' required for '0' hours.";
                isValid.status = false;
                document.getElementById("txtComments").focus();
                document.getElementById("txtComments").classList.add('mandatory-FormContent-focus');
                return isValid;
            }
            // Below 40 hours validation is commented on Dec/05/2025 after Time Off Release
            // if (Time < 40) {
            //     if (formdata.WeekStartDate < formdata.DateOfJoining)   //If Date of joining falls in the week range , Before DOJ hours have to exclude for validation.
            //     {
            //         let daysBetweenDOJ_WeekStartDate = Math.ceil(Math.abs((new Date(formdata.DateOfJoining).getTime() - new Date(formdata.WeekStartDate).getTime())) / (24 * 60 * 60 * 1000));
            //         let hours = (5 - daysBetweenDOJ_WeekStartDate) * 8;
            //         if (Time < hours) {
            //             isValid.message = "Total hours in a day cannot be less than 8.";
            //             isValid.status = false;
            //             // to highlight days , which total hours are less than 8 and days above or equals to DOJ
            //             let isFirstControlFocussed = true;
            //             let weekIndexes = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            //             for (let Inkey in formdata.Total[0]) {
            //                 let [DayTotal] = [formdata.Total[0][Inkey]];
            //                 if ((DayTotal) < 8 && weekIndexes.indexOf(Inkey) >= new Date(formdata.DateOfJoining).getDay()) {
            //                     if (!["Total", "Sat", "Sun"].includes(Inkey)) {
            //                         document.getElementById("Total" + Inkey).classList.add('mandatory-8hourstotal');
            //                         if (isFirstControlFocussed) {
            //                             // if Holiday , focus to holiday control, other wise if Synergy client focus to office hours row, else focus to weekrow
            //                             let rowTypeClass = this.WeekHeadings[0]['IsDay' + (weeks.indexOf(Inkey) + 1) + 'Holiday']['isHoliday'] ? '_ClientHldHrs' : formdata.ClientName.toLowerCase().includes("synergy") ? '_SynOffcHrs' : '_weekrow';
            //                             document.getElementById("0_" + Inkey + rowTypeClass).focus();
            //                             isFirstControlFocussed = false;
            //                         }
            //                     }
            //                 }
            //             }
            //             return isValid;
            //         }
            //     }
            //     else { //If Date of joining does not falls in the week range , consider 5 days hours 5*8=40 for validation.
            //         isValid.message = "Total hours in a day cannot be less than 8.";
            //         isValid.status = false;
            //         // to highlight days , which total hours are less than 8
            //         let isFirstControlFocussed = true;
            //         for (let Inkey in formdata.Total[0]) {
            //             let [DayTotal] = [formdata.Total[0][Inkey]];
            //             if ((DayTotal) < 8) {
            //                 if (!["Total", "Sat", "Sun"].includes(Inkey)) {
            //                     document.getElementById("Total" + Inkey).classList.add('mandatory-8hourstotal');
            //                     if (isFirstControlFocussed) {
            //                         // if Holiday , focus to holiday control, other wise if Synergy client focus to office hours row, else focus to weekrow
            //                         let rowTypeClass = this.WeekHeadings[0]['IsDay' + (weeks.indexOf(Inkey) + 1) + 'Holiday']['isHoliday'] ? '_ClientHldHrs' : formdata.ClientName.toLowerCase().includes("synergy") ? '_SynOffcHrs' : '_weekrow';
            //                         document.getElementById("0_" + Inkey + rowTypeClass).focus();
            //                         isFirstControlFocussed = false;
            //                     }
            //                 }
            //             }
            //         }
            //         return isValid;
            //     }
            // }
            //if isValid true remove all 'mandatory-FormContent-focus' classes
            this.RemoveAll_mandatory_FormContent_focus(formdata);
            return isValid;
        }
        this.RemoveAll_mandatory_FormContent_focus(formdata);
        return isValid;
    }
    private ClearInvalidDots = (Formdata) => {
        const formdata = Formdata;
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for (var prop of TableColumns) {
            let val;
            //WeeklyHrs row
            for (var index in formdata.WeeklyItemsData) {
                val = parseFloat(formdata.WeeklyItemsData[index][prop].toString());
                formdata.WeeklyItemsData[index][prop] = Number.isNaN(val) ? '' : parseFloat(formdata.WeeklyItemsData[index][prop].toString()).toString();
            }
            //OverTimeHrs row
            for (var index in formdata.OTItemsData) {
                val = parseFloat(formdata.OTItemsData[index][prop].toString());
                formdata.OTItemsData[index][prop] = Number.isNaN(val) ? '' : parseFloat(formdata.OTItemsData[index][prop].toString()).toString();
            }
            //SynergyOfficeHrs row
            val = parseFloat(formdata.SynergyOfficeHrs[0][prop].toString());
            formdata.SynergyOfficeHrs[0][prop] = Number.isNaN(val) ? '' : parseFloat(formdata.SynergyOfficeHrs[0][prop].toString()).toString();
            //ClientHolidayHrs row
            val = parseFloat(formdata.ClientHolidayHrs[0][prop].toString());
            formdata.ClientHolidayHrs[0][prop] = Number.isNaN(val) ? '' : parseFloat(formdata.ClientHolidayHrs[0][prop].toString()).toString();
            //PTOHrs row
            val = parseFloat(formdata.PTOHrs[0][prop].toString());
            formdata.PTOHrs[0][prop] = Number.isNaN(val) ? '' : parseFloat(formdata.PTOHrs[0][prop].toString()).toString();
        }
        return formdata;
    }
    private RemoveAll_mandatory_FormContent_focus = (formdata) => {
        if (formdata.ClientName != '') {
            if (!formdata.ClientName.toLowerCase().includes("synergy")) {
                for (let i in formdata.WeeklyItemsData) {
                    for (let key in formdata.WeeklyItemsData[i]) {
                        document.getElementById(i + "_" + key + "_weekrow") == null ? '' : document.getElementById(i + "_" + key + "_weekrow").classList.remove('mandatory-FormContent-focus');
                    }
                }
                for (let i in formdata.OTItemsData) {
                    for (let key in formdata.OTItemsData[i]) {
                        document.getElementById(i + "_" + key + "_otrow") == null ? '' : document.getElementById(i + "_" + key + "_otrow").classList.remove('mandatory-FormContent-focus');
                    }
                }
            }
            else {
                for (let key in formdata.SynergyOfficeHrs[0]) {
                    if (!["Total", "Type"].includes(key)) {
                        document.getElementById(0 + "_" + key + "_SynOffcHrs") == null ? '' : document.getElementById(0 + "_" + key + "_SynOffcHrs").classList.remove('mandatory-FormContent-focus');
                    }
                }
            }
        }
        for (let key in formdata.ClientHolidayHrs[0]) {
            if (!["Total", "Type"].includes(key)) {
                document.getElementById(0 + "_" + key + "_ClientHldHrs").classList.remove('mandatory-FormContent-focus');
            }
        }
        for (let key in formdata.PTOHrs[0]) {
            if (!["Total", "Type", "PTOBalance", "PTOAfterDeduction", "Description", "ProjectCode"].includes(key)) {
                document.getElementById(0 + "_" + key + "_PTOHrs").classList.remove('mandatory-FormContent-focus');
            }
        }
        Object.keys(formdata.Total[0]).forEach(key => {
            if (!["Total", "Description", "ProjectCode", "Type"].includes(key))
                document.getElementById("Total" + key).classList.remove('mandatory-FormContent-focus', 'mandatory-8hourstotal');
        })
        document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
        document.getElementById("txtComments").classList.remove('mandatory-FormContent-focus');
        document.getElementById("Client").classList.remove('mandatory-FormContent-focus');
        document.getElementById("dateWeeklyTimesheet").classList.remove('mandatory-FormContent-focus');
    }
    //Functions related to HolidayMaster
    private GetHolidayMasterDataByClientName = async (WeekStartDate, selectedClientName, trFormdata) => {
        let Start = addDays(new Date(WeekStartDate), -1);
        let End = addDays(new Date(WeekStartDate), 7);
        let WeekStart = DateUtilities.getDateMMDDYYYY(Start);
        let WeekEnd = DateUtilities.getDateMMDDYYYY(End);
        let filterQuery = "ClientName eq '" + selectedClientName + "' and HolidayDate gt '" + WeekStart + "' and HolidayDate lt '" + WeekEnd + "' and IsActive eq 1";
        let selectQuery = "ClientName,HolidayName,HolidayDate,Year,*";
        let HolidaysListData = await sp.web.lists.getByTitle('HolidaysList').items.filter(filterQuery).select(selectQuery).getAll();
        // console.log(HolidaysListData);
        if (HolidaysListData.length >= 1) {
            let HolidayData = [];
            HolidaysListData.filter(item => {
                HolidayData.push({ "ClientName": item.ClientName, "HolidayName": item.HolidayName, "HolidayDate": DateUtilities.GetDateMMDDYYYYAsInList(item.HolidayDate) })
            });
            this.setState({ HolidaysList: HolidayData })
            let WeekStartDate = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.WeekStartDate));
            let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(trFormdata.DateOfJoining));
            this.WeekHeadings = [];
            this.WeekHeadings.push({
                "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsMonJoined": WeekStartDate < DateOfjoining,
                "IsDay1Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay1SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsTueJoined": WeekStartDate < DateOfjoining,
                "IsDay2Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay2SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsWedJoined": WeekStartDate < DateOfjoining,
                "IsDay3Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay3SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsThuJoined": WeekStartDate < DateOfjoining,
                "IsDay4Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay4SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "IsFriJoined": WeekStartDate < DateOfjoining,
                "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsDay5Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay5SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Sat": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "SatDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsSatJoined": WeekStartDate < DateOfjoining,
                "IsDay6Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay6SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
                "Sun": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "SunDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsSunJoined": WeekStartDate < DateOfjoining,
                "IsDay7Holiday": this.IsHoliday(WeekStartDate, trFormdata.HolidayType),
                "IsDay7SynergyHoliday": this.IsHoliday(WeekStartDate, "synergy"),
            })
        }
        this.setState({ trFormdata: trFormdata })
    }
    private IsHoliday = (CurrentWeekDay, ClientName) => {
        let HolidayData = { isHoliday: false, HolidayName: "" };
        let WeekDay = new Date(CurrentWeekDay);
        let Day = DateUtilities.getDateMMDDYYYY(WeekDay);
        for (var item of this.state.HolidaysList) {
            let Holiday = DateUtilities.getDateMMDDYYYY(item.HolidayDate);
            if (Holiday == Day) {
                HolidayData.isHoliday = true;
                HolidayData.HolidayName = item.HolidayName;
                return HolidayData;
            }
        }
        return HolidayData;
    }
    //Functions related to dynamic HTML binding
    private dynamicFieldsRow = (rowType) => {
        let NoOfRows;
        let rowId;
        let Obj;
        if (rowType.toLowerCase() == "weekrow") {
            NoOfRows = this.state.currentWeeklyRowsCount;
            Obj = this.state.trFormdata.WeeklyItemsData;
            rowId = "rowPRJ"
        }
        else {
            NoOfRows = this.state.currentOTRowsCount;
            Obj = this.state.trFormdata.OTItemsData;
            rowId = "rowOVR"
        }


        let section = [];
        for (var i = 1; i < NoOfRows; i++) {
            section.push(<tr id={rowId + (i + 1)}>
                <td className=" text-start"> </td>
                <td>
                    <textarea className="form-control textareaBorder" rows={1} value={Obj[i].Description} id={i + "_Description_" + rowType} title={Obj[i].Description} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                </td>
                <td>
                    <input className="form-control" value={Obj[i].ProjectCode} id={i + "_ProjectCode_" + rowType} onChange={this.changeTime} title={Obj[i].ProjectCode} disabled={this.state.isSubmitted || this.state.showBillable} type="text"></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day1)} value={Obj[i][this.WeekNames[0].day1]} id={i + "_" + this.WeekNames[0].day1 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day2)} value={Obj[i][this.WeekNames[0].day2]} id={i + "_" + this.WeekNames[0].day2 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day3)} value={Obj[i][this.WeekNames[0].day3]} id={i + "_" + this.WeekNames[0].day3 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day4)} value={Obj[i][this.WeekNames[0].day4]} id={i + "_" + this.WeekNames[0].day4 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day5)} value={Obj[i][this.WeekNames[0].day5]} id={i + "_" + this.WeekNames[0].day5 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day6)} value={Obj[i][this.WeekNames[0].day6]} id={i + "_" + this.WeekNames[0].day6 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day7)} value={Obj[i][this.WeekNames[0].day7]} id={i + "_" + this.WeekNames[0].day7 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                </td>
                <td>
                    {rowType.toLowerCase() == "otrow" ? <span className="c-badge">OT</span> : ""}
                </td>
                {this.state.showPTO && <><td>
                </td><td>
                    </td></>}
                <td>
                    <input className="form-control time WeekTotal" value={Obj[i].Total} id={i + "_Total_" + rowType} onChange={this.changeTime} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                </td>
                <td>

                    {this.state.showBillable ? '' : this.state.isSubmitted ? '' : i == NoOfRows - 1 ?
                        <>{<button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={i + "_" + rowType}><span title='Delete row' ><FontAwesomeIcon icon={faClose} id={i + "_" + rowType}></FontAwesomeIcon></span></button>}
                            {rowType.toLowerCase() == "weekrow" ? <button type="button" className='span-fa-plus' onClick={this.CreateWeeklyHrsRow} id='addnewRow'><span title='Add new Billable hours row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
                            </span></button> : <button type="button" className='span-fa-plus' onClick={this.CreateOTHrsRow} id='addnewRow'><span title='Add new OT hours row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
                            </span></button>}
                        </> :
                        <button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={i + "_" + rowType}><span title='Delete row'  ><FontAwesomeIcon icon={faClose} id={i + "_" + rowType}></FontAwesomeIcon></span></button>}
                </td>
            </tr>);
        }
        return section;
    }
    private bindComments = () => {
        let body = [];
        if (this.state.trFormdata.CommentsHistoryData.length > 0) {
            var History = this.state.trFormdata.CommentsHistoryData;
            for (let i = History.length - 1; i >= 0; i--) {
                body.push(<tr>
                    {/* <td className="" >{History[i]["Role"]}</td> */}
                    <td className="" >{History[i]["User"]}</td>
                    <td className="" >{History[i]["Action"]}</td>
                    <td className="" >{DateUtilities.getDateMMDDYYYY(History[i]["Date"])}  {"  " + new Date(History[i]["Date"]).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }).split(",")[1]}</td>
                    <td className="" >{History[i]["Comments"]}</td>
                </tr>)
            }
        }
        return body;
    }
    private getWeekstartAndWeekEnd = (formdata) => {
        if (formdata.WeekStartDate != null) {
            let weekstartWeekEnd = ''
            let weekStart = new Date(formdata.WeekStartDate);
            let weekEnd = addDays(new Date(weekStart), 6);
            let weekStartArr = weekStart.toDateString().split(" ");
            let weekEndArr = weekEnd.toDateString().split(" ")
            weekstartWeekEnd = " (" + weekStartArr[1] + "-" + weekStartArr[2] + "-" + weekStartArr[3] + " To " + weekEndArr[1] + "-" + weekEndArr[2] + "-" + weekEndArr[3] + " )";
            return weekstartWeekEnd
        }
    }
    //get current week start date based on clients weekstartday
    private getCurrentWeekStartDate = (weekStartDay) => {
        let weeks = this.state.weeks;
        let dayCode = weeks.indexOf(weekStartDay)
        let date = new Date()
        while (date.getDay() != dayCode) {
            date.setDate(date.getDate() - 1)
        }
        return date;
    }
    // PTOFormModal Starts -------------------

    private handlePtoSubmit = (data: any) => {  //this function is used to bind the PTO popup submitted data
        console.log('Received PTO data:', data);
        if (Object.keys(data).length) {
            this.setState({ ptoFormData: data.TimeOffData, totalPTOFormData: data });
            this.bindTimeOffHoursOnPTOFormSubmit(data, this.state.trFormdata.PTOBalanceAfterDeduction);
        }
    };
    private bindPTOFormData = (data, TimeOffRecPTOBalance, TimeOff) => { //This function is used to bind the TimeOffRequest submitted data to TimeOff row
        this.setState({ ptoFormData: data.TimeOffData ?? [], totalPTOFormData: data });
        this.bindTimeOffHoursOnPTOFormSubmit(data, TimeOffRecPTOBalance, true, TimeOff);
    };
    private bindTimeOffHoursOnPTOFormSubmit = (totalPTOFormData, PTOBalance, IsTimeOffRecData?, TimeOff?) => {
        const WeekKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Total'];
        const trFormdata = this.state.trFormdata;
        let PTOTransactionsDayWise = [];
        if (Object.keys(totalPTOFormData).length) {
           
            WeekKeys.forEach(day => {
                trFormdata.PTOHrs[0][day] = totalPTOFormData.Total[0][day]; //for Time Off row binding
                // for getting daywise PTO
                if (!['Total'].includes(day)) {
                    let dateKey = this.WeekHeadings[0][day + 'Date'];
                    let Hours = parseFloat(totalPTOFormData.PTOSubTotal[0][day]);
                    if (Hours > 0) {  
                        // Push new object
                        PTOTransactionsDayWise.push({ [dateKey]: Hours });
                    }
                }
                //FOR COLUMN WISE CALCULATION
                // NON BILLABLE SUBTOTAL COLUMN WISE
                let WeeklyTotal = 0;
                let NonBillableColValue = trFormdata.SynergyOfficeHrs[0][day].toString();
                [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));

                NonBillableColValue = trFormdata.ClientHolidayHrs[0][day].toString();
                [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));

                NonBillableColValue = trFormdata.PTOHrs[0][day].toString();
                [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));

                trFormdata.NonBillableSubTotal[0][day] = WeeklyTotal.toFixed(4).toString();
                //GRAND TOTAL COLUMN WISE
                WeeklyTotal = 0;
                let TotalColVal = trFormdata.BillableSubTotal[0][day].toString();
                [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
                WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));

                TotalColVal = trFormdata.NonBillableSubTotal[0][day].toString();
                [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
                WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));

                trFormdata.Total[0][day] = parseFloat(WeeklyTotal.toFixed(4)).toString();
            })
            //}
            if (IsTimeOffRecData && TimeOff.length && ![StatusType.Submit, StatusType.Approved, StatusType.ManagerApprove, StatusType.ReviewerApprove, StatusType.Updated].includes(TimeOff[0].Status)) // if TimeOff Rec status is save/Revoke/Rejected PreviousPTOBalance is inaccurate, in this case display the accurate balance from current available balance
            {
                PTOBalance = this.state.trFormdata.PTOBalanceAfterDeduction;
            }
            let PTOAfterDeduction = parseFloat(PTOBalance) - parseFloat(totalPTOFormData.PTOTotal);
            trFormdata.PTOHrs[0]["PTOBalance"] = parseFloat(PTOBalance).toString();
            trFormdata.PTOHrs[0]["PTOAfterDeduction"] = parseFloat(PTOAfterDeduction.toFixed(4)).toString();
        }
        else {
            //to handle Previously TimeOffRequest submitted, but with drawn from TimeOffDashboard , in this case have to display empty time off row and corresponding calculations
            if([StatusType.Save,StatusType.Revoke.toString()].includes(trFormdata.Status))
            {
                WeekKeys.forEach(day => {
                    trFormdata.PTOHrs[0][day] = ['Total'].includes(day) ? '0.00' : ''; //for Time Off row binding
                    //FOR COLUMN WISE CALCULATION
                    // NON BILLABLE SUBTOTAL COLUMN WISE
                    let WeeklyTotal = 0;
                    let NonBillableColValue = trFormdata.SynergyOfficeHrs[0][day].toString();
                    [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                    WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
    
                    NonBillableColValue = trFormdata.ClientHolidayHrs[0][day].toString();
                    [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                    WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
    
                    NonBillableColValue = trFormdata.PTOHrs[0][day].toString();
                    [undefined, null, "", "."].includes(NonBillableColValue.trim()) ? NonBillableColValue = "0" : NonBillableColValue;
                    WeeklyTotal = WeeklyTotal + (parseFloat(NonBillableColValue));
    
                    trFormdata.NonBillableSubTotal[0][day] = WeeklyTotal.toFixed(4).toString();
                    //GRAND TOTAL COLUMN WISE
                    WeeklyTotal = 0;
                    let TotalColVal = trFormdata.BillableSubTotal[0][day].toString();
                    [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
                    WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));
    
                    TotalColVal = trFormdata.NonBillableSubTotal[0][day].toString();
                    [undefined, null, "", "."].includes(TotalColVal.trim()) ? TotalColVal = "0" : TotalColVal;
                    WeeklyTotal = WeeklyTotal + (parseFloat(TotalColVal));
    
                    trFormdata.Total[0][day] = parseFloat(WeeklyTotal.toFixed(4)).toString();
                })
            }
        }

        this.setState({ trFormdata, PTOTransactions: PTOTransactionsDayWise });

    }
    private openPToFormModal = async () => {
        let filQuery = 'IsActive eq 1';
        if (!this.state.trFormdata.EligibleforPTO) {
            filQuery += ' and IsVisibleToPTONotEligibleEmp eq 1';
        }
        const PTOTimeOffTypes = await sp.web.lists.getByTitle('TimeOffTypes').items.select('*').filter(filQuery).getAll();
        const sortedArray = PTOTimeOffTypes.sort((a, b) => a.Title.localeCompare(b.Title));
        let UPTOTypes = sortedArray.map(i => {
            if (i.IsUPTO == true)
                return i.Title;
        })
        this.setState({ timeOffTypes: sortedArray, UPTOTypes, isPTOFormModalVisible: true });
    }
    private handlePtoClose = () => {
        this.setState({ isPTOFormModalVisible: false });
    }
    private handlePTOCancel = () => {
        let totalPTOFormData = {
            TimeOffData: [{ TimeOffType: '', IsPTOEligible: false, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Total: '0.00' }],
            PTOSubTotal: [{ Type: "Paid Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
            TOSubTotal: [{ Type: "Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
            Total: [{ Type: "Total", Mon: '0', Tue: '0', Wed: '0', Thu: '0', Fri: '0', Total: '0' }],
            currentTimeOffRowsCount: 1,
            PTOTotal: 0,
            TOTotal: 0,
            IsActive: false,
            TOComments: ''
        }
        this.bindTimeOffHoursOnPTOFormSubmit(totalPTOFormData, this.state.trFormdata.PTOBalanceAfterDeduction);
        this.setState({ totalPTOFormData: totalPTOFormData, ptoFormData: totalPTOFormData.TimeOffData });
    }
    //This fonction implmented to map with TOR form with free date range
    private convertShrtDayToFullDateObj = (WeekStartDate, DataObj) => {
        const startDate = new Date(WeekStartDate);
        return DataObj.map(obj => {
            const newObj = {
                TimeOffType: obj.TimeOffType,
                Total: obj.Total,
                IsPTOEligible: obj.IsPTOEligible
            };
            // Loop through each weekday (Mon–Fri)
            const date = new Date(startDate);
            for (let i = 1; i <= 5; i++) {
                const dateStr = DateUtilities.getDateMMDDYYYY(date);//MM/dd/yyyy

                const shortDay = DateUtilities.getDateDay(date);// Mon, Tue
                if (obj.hasOwnProperty(shortDay)) {
                    newObj[dateStr] = obj[shortDay];
                } else {
                    newObj[dateStr] = "";
                }
                date.setDate(date.getDate() + 1);
            }
            return newObj;
        });
    }

    private convertFullDateToShrtDayObj = (WeekStartDate, DataObj) => {
        const startDate = new Date(WeekStartDate);
        return DataObj.map(obj => {
            const newObj = {
                TimeOffType: obj.TimeOffType,
                Total: obj.Total,
                IsPTOEligible: obj.IsPTOEligible
            };

            // Loop through each weekday (Mon–Fri)
            const date = new Date(startDate);
            for (let i = 1; i <= 5; i++) {
                const dateStr = DateUtilities.getDateMMDDYYYY(date);//MM/dd/yyyy
                const shortDay = DateUtilities.getDateDay(date);// Mon, Tue
                if (obj.hasOwnProperty(dateStr)) {
                    newObj[shortDay] = obj[dateStr];
                } else {
                    newObj[shortDay] = "";
                }
                date.setDate(date.getDate() + 1);
            }
            return newObj;
        });
    }

    // ------------------ PTOFormModal Ends
    public render() {

        if (!this.state.isRecordAcessable) {

            let url = this.siteURL + "/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        if (this.state.redirect) {
            let url = `/Dashboard${this.state.ActionToasterMessage}`;
            return (<Navigate to={url} />);
        }
        else {
            return (

                <React.Fragment>
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp>
                    {this.state.isPTOFormModalVisible && <PTOFormModal isVisible={this.state.isPTOFormModalVisible} onSubmit={this.handlePtoSubmit} dates={[]} days={[]} onClose={this.handlePtoClose} onReset={this.handlePTOCancel} ptoBalance={this.state.trFormdata.PTOHrs[0].PTOBalance} ptoFormData={this.state.ptoFormData} timeOffTypes={this.state.timeOffTypes} UPTOTypes={this.state.UPTOTypes} TOComments={this.state.totalPTOFormData.TOComments} EligibleforPTO={this.state.trFormdata.EligibleforPTO} weekDetails={[{ WeekNames: this.WeekNames, WeekHeadings: this.WeekHeadings }]} showResetBtn={this.state.ptoFormData.length ? true : false} isEditForm={this.state.isTimeOffEdit}></PTOFormModal>}
                    {
                        this.state.ConfirmPopupMessage == "" ? "" :
                            this.state.ConfirmPopupMessage == "Are you sure you want to delete this row?" ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.RemoveCurrentRow} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> :
                                ["Are you sure you want to submit?",
                                    "Are you sure you want to submit for current week?",
                                    "Are you sure you want to submit with '0' hours?",
                                    "Are you sure you want to submit for current week with '0' hours?",
                                    "Are you sure you want to submit with " + (this.state.trFormdata.PTOHrs[0].PTOAfterDeduction ? ((parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction.split('.')[0]) < 0) ? -(parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction)) : '') : '') + " hours of unpaid Time Off?",
                                    "Are you sure you want to submit for current week with " + (this.state.trFormdata.PTOHrs[0].PTOAfterDeduction ? ((parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction.split('.')[0]) < 0) ? -(parseFloat(this.state.trFormdata.PTOHrs[0].PTOAfterDeduction)) : '') : '') + " hours of unpaid Time Off?"].includes(this.state.ConfirmPopupMessage) ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleSubmitorSave} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> :
                                    this.state.ConfirmPopupMessage == "Are you sure you want to approve?" ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleApprove} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> :
                                        this.state.ConfirmPopupMessage == "Are you sure you want to reject?" ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleReject} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> :
                                            this.state.ConfirmPopupMessage == "Are you sure you want to revoke?" ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmDeletePopup} isSuccess={false} onConfirm={this.handleRevoke} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> : ""
                    }
                    <div id="content" className="content p-2 pt-2">
                        <div className="container-fluid">
                            <div className='FormContent'>
                                <div className="mt-3 mb-1 media-p-1 Billable Hours">
                                    <div className="title">Weekly Timesheet {this.state.trFormdata.Revised ? " - Revised" : ""}
                                        <div className='mandatory-note'>
                                            <span className='mandatoryhastrick'>*</span> indicates a required field
                                        </div>
                                    </div>
                                    <div className="col-md-12 SynergyAddress">
                                        <label className='headerClient'>{this.state.trFormdata.ClientName}</label><span id='weekstartAndweekEnd'>{this.getWeekstartAndWeekEnd(this.state.trFormdata)}</span>
                                        {this.state.showPDFButton && <ExportToPDF AllTimesheetsData={this.state.PDFData} LogoImgUrl={this.siteURL + '/PublishingImages/SynergyLogo.png'} filename={this.state.PDFFileName} btnTitle='Export to PDF' className='a-export-pdf-icon'></ExportToPDF>}
                                    </div>
                                    <div className="row justify-content-center my-3">
                                        {/* new alignment changes start*/}
                                        {(this.state.isAdmin || this.state.IsCurrUserReviewer) && this.props.match.params.id == undefined ?
                                            <div className="col-md-2">
                                                <div className="light-text">
                                                    <label>Applying for<span className="mandatoryhastrick">*</span></label>
                                                    <select className="form-control" name="Applying" id="Applying" title="Applying for" onChange={this.handleApplyingfor}>
                                                        <option value='Self'>Self</option>
                                                        <option value='onBehalf'>On Behalf</option>
                                                    </select>
                                                </div>
                                            </div> : ''}

                                        {this.state.onBehalf ?
                                            <div className={this.state.isAdmin ? "col-md-2" : "col-md-3"}>
                                                <div className="custom-dropdown">
                                                    <SearchableDropdown label="Employee" Title="Employee" name="Employee" id="Employee" placeholderText="Select Employee" className="" selectedValue={this.state.currentUserId} optionLabel={'Title'} optionValue={'ID'} OptionsList={this.state.EmployeesObj} onChange={(selectedOption, actionMeta) => { this.handleApplyingfor(selectedOption, actionMeta) }} isRequired={true} refElement={this.EmployeeDropdown} noOptionsMessage="No Employee"></SearchableDropdown>
                                                </div>
                                            </div> :
                                            <div className={this.state.isAdmin ? "col-md-2" : "col-md-3"}>
                                                <div className="light-text">
                                                    <label>Name</label>
                                                    <input className="form-control" required={true} name="Name" title="Name" value={this.state.trFormdata.Name} readOnly />
                                                </div>
                                            </div>
                                        }
                                        <div className={this.state.isAdmin ? "col-md-2" : "col-md-3"}>
                                            <div className="custom-dropdown">
                                                <SearchableDropdown label="Client" Title="Client" name="ClientName" id="Client" placeholderText="Select Client" className="" selectedValue={this.state.trFormdata.ClientName} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.ClientNames} onChange={(selectedOption, actionMeta) => { this.handleClientChange(selectedOption, actionMeta) }} isRequired={true} refElement={this.Client} disabled={(this.state.ClientNames.length == 1 ? true : this.currentUser == this.state.trFormdata.Name || this.state.isAdmin ? false : true)} noOptionsMessage="No Client"></SearchableDropdown>
                                            </div>
                                        </div>
                                        <div className={this.state.isAdmin ? "col-md-2" : "col-md-3"}>
                                            <div className="light-text">
                                                <label>Reporting Manager(s)</label>
                                                <div className={"form-control ManagersDiv" + ([0, 1].includes(this.state.trFormdata.SuperviserNames.length) ? ' SingleManagerDiv' : ' MultiManagerDiv')} title="Reporting Manager(s)">
                                                    <table>
                                                        <tbody className="tbodyRMDiv">
                                                            {this.state.trFormdata.SuperviserNames.map((name) => <tr><td>{name}</td></tr>)}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={this.state.isAdmin ? "col-md-2" : "col-md-3"}>
                                            <div className="light-text div-readonly">
                                                <div className="custom-datepicker-disabled-dates" id="divWeekStartDate">
                                                    <CustomDatePicker
                                                        handleChange={this.WeekStartDateChange}
                                                        selectedDate={this.state.trFormdata.WeekStartDate}
                                                        className='form-control'
                                                        id='dateWeeklyTimesheet'
                                                        labelName='Weekly Start Date'
                                                        isDisabled={(this.currentUser == this.state.trFormdata.Name || this.state.isAdmin ? false : true)}
                                                        ref={this.weekStartDate}
                                                        Day={this.WeekNames[0].dayCode}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* new alignment changes end*/}

                                    </div>
                                    <div className="border-box-shadow light-box table-responsive table-NoScroll">
                                        <div className='table-outer'></div>
                                        <table className="table table-bordered m-0 timetable table-td-p-0">
                                            <thead style={{ borderBottom: "4px solid #444444" }}>
                                                <tr>
                                                    <th className="" ><div className="have-h"></div></th>
                                                    <th className=""><div className='th-description'>Description {this.state.trFormdata.IsDescriptionMandatory ? <span className="mandatoryhastrick">*</span> : ""}</div></th>
                                                    <th className="projectCode"><div className='th-Project-Code'>Project Code {this.state.trFormdata.IsProjectCodeMandatory ? <span className="mandatoryhastrick">*</span> : ""}</div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day1 == "Sat" || this.WeekNames[0].day1 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day1} <span className={"day " + (this.WeekNames[0].day1 == "Sat" || this.WeekNames[0].day1 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Mon}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day2 == "Sat" || this.WeekNames[0].day2 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day2} <span className={"day " + (this.WeekNames[0].day2 == "Sat" || this.WeekNames[0].day2 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Tue}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day3 == "Sat" || this.WeekNames[0].day3 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day3} <span className={"day " + (this.WeekNames[0].day3 == "Sat" || this.WeekNames[0].day3 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Wed}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day4 == "Sat" || this.WeekNames[0].day4 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day4} <span className={"day " + (this.WeekNames[0].day4 == "Sat" || this.WeekNames[0].day4 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Thu}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day5 == "Sat" || this.WeekNames[0].day5 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day5} <span className={"day " + (this.WeekNames[0].day5 == "Sat" || this.WeekNames[0].day5 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Fri}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day6 == "Sat" || this.WeekNames[0].day6 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day6} <span className={"day " + (this.WeekNames[0].day6 == "Sat" || this.WeekNames[0].day6 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Sat}</span></div></th>
                                                    <th><div className={"weekDay " + (this.WeekNames[0].day7 == "Sat" || this.WeekNames[0].day7 == "Sun" ? "color-FF9800" : "")}>{this.WeekNames[0].day7} <span className={"day " + (this.WeekNames[0].day7 == "Sat" || this.WeekNames[0].day7 == "Sun" ? "color-FF9800" : "")}>{this.WeekHeadings[0].Sun}</span></div></th>
                                                    <th><div className="px-2"></div></th>
                                                    {this.state.showPTO &&
                                                        <><th className="bc-e1f2ff"><div className='th-PTOBal'>PTO Balance</div></th>
                                                            <th className="bc-e1f2ff"><div className='th-PTOADeduc'>PTO After Deduction</div></th></>}
                                                    <th className="bc-e1f2ff"><div className='th-total'>Total</div></th>
                                                    <th className=""><div className="px-3 th-AddDel-Icon"></div></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.trFormdata.ClientName.toLowerCase().includes("synergy") || this.state.trFormdata.ClientName.toLowerCase() == "" ? "" :
                                                    <tr id="rowPRJ1"  >
                                                        <td className=" text-start">
                                                            <div className="p-1">
                                                                <strong>Billable Hours</strong>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.WeeklyItemsData[0].Description} title={this.state.trFormdata.WeeklyItemsData[0].Description} id="0_Description_weekrow" onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable}  ></textarea>
                                                        </td>
                                                        <td>
                                                            <input className="form-control" value={this.state.trFormdata.WeeklyItemsData[0].ProjectCode} title={this.state.trFormdata.WeeklyItemsData[0].ProjectCode} id="0_ProjectCode_weekrow" onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day1)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day1]} id={"0_" + this.WeekNames[0].day1 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day2)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day2]} id={"0_" + this.WeekNames[0].day2 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day3)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day3]} id={"0_" + this.WeekNames[0].day3 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day4)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day4]} id={"0_" + this.WeekNames[0].day4 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day5)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day5]} id={"0_" + this.WeekNames[0].day5 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day6)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day6]} id={"0_" + this.WeekNames[0].day6 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day7)} value={this.state.trFormdata.WeeklyItemsData[0][this.WeekNames[0].day7]} id={"0_" + this.WeekNames[0].day7 + "_weekrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                                        </td>
                                                        <td>
                                                        </td>
                                                        {this.state.showPTO && <><td>
                                                        </td><td>
                                                            </td></>}
                                                        <td>
                                                            <input className="form-control time WeekTotal" value={this.state.trFormdata.WeeklyItemsData[0].Total} id="0_Total_weekrow" onChange={this.changeTime} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            {this.state.showBillable ? '' : this.state.isSubmitted ? '' : this.state.trFormdata.WeeklyItemsData.length == 1 ? <button type="button" className='span-fa-plus' onClick={this.CreateWeeklyHrsRow} id='addnewRow'><span title='Add new Billable hours row'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button> : <button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={'0_weekrow'}><span title='Delete row' ><FontAwesomeIcon icon={faClose} id={'0_weekrow'}></FontAwesomeIcon></span></button>}
                                                        </td>
                                                    </tr>}
                                                {this.dynamicFieldsRow("weekrow")}
                                                {this.state.trFormdata.ClientName.toLowerCase().includes("synergy") || this.state.trFormdata.ClientName.toLowerCase() == "" ? "" :
                                                    <tr id="rowOVR1" className="font-td-bold"  >
                                                        <td className=" text-start">
                                                            <div className="p-1">
                                                                <i className="fas fa-user-clock color-gray"></i> Overtime
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <textarea className="form-control textareaBorder fw-normal" rows={1} value={this.state.trFormdata.OTItemsData[0].Description} title={this.state.trFormdata.OTItemsData[0].Description} id="0_Description_otrow" onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable} ></textarea>
                                                        </td>
                                                        <td>
                                                            <input className="form-control" value={this.state.trFormdata.OTItemsData[0].ProjectCode} title={this.state.trFormdata.OTItemsData[0].ProjectCode} id="0_ProjectCode_otrow" onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day1)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day1]} id={"0_" + this.WeekNames[0].day1 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day2)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day2]} id={"0_" + this.WeekNames[0].day2 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day3)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day3]} id={"0_" + this.WeekNames[0].day3 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day4)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day4]} id={"0_" + this.WeekNames[0].day4 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day5)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day5]} id={"0_" + this.WeekNames[0].day5 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day6)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day6]} id={"0_" + this.WeekNames[0].day6 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day7)} value={this.state.trFormdata.OTItemsData[0][this.WeekNames[0].day7]} id={"0_" + this.WeekNames[0].day7 + "_otrow"} onChange={this.changeTime} disabled={this.state.isSubmitted || this.state.showBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <span className="c-badge">OT</span>
                                                        </td>
                                                        {this.state.showPTO && <><td>
                                                        </td><td>
                                                            </td></>}
                                                        <td>
                                                            <input className="form-control time WeekTotal" value={this.state.trFormdata.OTItemsData[0].Total} id="0_Total_otrow" onChange={this.changeTime} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            {this.state.showBillable ? '' : this.state.isSubmitted ? '' : this.state.trFormdata.OTItemsData.length == 1 ? <button type="button" className='span-fa-plus' onClick={this.CreateOTHrsRow} id=''><span title='Add new OT hours row'  ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button> : <button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={'0_otrow'} ><span title='Delete row'><FontAwesomeIcon icon={faClose} id={'0_otrow'}></FontAwesomeIcon></span></button>}
                                                        </td>
                                                    </tr>}
                                                {this.dynamicFieldsRow("otrow")}
                                                {!this.state.trFormdata.ClientName.toLowerCase().includes("synergy") ? "" :
                                                    <tr id="SynergyOfficeHrs">
                                                        <td className="text-start"><div className="p-1">Office Hours</div></td>
                                                        <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.SynergyOfficeHrs[0].Description} title={this.state.trFormdata.SynergyOfficeHrs[0].Description} onChange={this.changeTime} id="0_Description_SynOffcHrs" disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                                        <td><input className="form-control" value={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} title={this.state.trFormdata.SynergyOfficeHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_SynOffcHrs" disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day1)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day1 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day2)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day2 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day3)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day3 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day4)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day4 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day5)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day5 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day6)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day6 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined} ></input>
                                                        </td>
                                                        <td>
                                                            <input className={"form-control time " + (this.WeekNames[0].day7)} value={this.state.trFormdata.SynergyOfficeHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day7 + "_SynOffcHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined} ></input>
                                                        </td>
                                                        <td><span className="c-badge">O</span></td>
                                                        {this.state.showPTO && <><td>
                                                        </td><td>
                                                            </td></>}
                                                        <td><input className="form-control time WeekTotal" value={this.state.trFormdata.SynergyOfficeHrs[0].Total} onChange={this.changeTime} id="0_Total_SynOffcHrs" type="text" maxLength={5} tabIndex={-1} readOnly></input></td>
                                                        <td></td>
                                                    </tr>}

                                                <tr id="Holiday">
                                                    <td className="text-start"><div className="p-1">Holiday</div></td>
                                                    <td><textarea className="form-control textareaBorder" rows={1} value={this.state.trFormdata.ClientHolidayHrs[0].Description} title={this.state.trFormdata.ClientHolidayHrs[0].Description} onChange={this.changeTime} id="0_Description_ClientHldHrs" disabled={this.state.isSubmitted || this.state.showNonBillable} ></textarea></td>
                                                    <td><input className="form-control" value={this.state.trFormdata.ClientHolidayHrs[0].ProjectCode} title={this.state.trFormdata.ClientHolidayHrs[0].ProjectCode} onChange={this.changeTime} id="0_ProjectCode_ClientHldHrs" disabled={this.state.isSubmitted || this.state.showNonBillable} ></input></td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day1) + (this.WeekHeadings[0].IsDay1Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day1 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined || !this.WeekHeadings[0].IsDay1Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day2) + (this.WeekHeadings[0].IsDay2Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day2 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined || !this.WeekHeadings[0].IsDay2Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day3) + (this.WeekHeadings[0].IsDay3Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day3 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined || !this.WeekHeadings[0].IsDay3Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day4) + (this.WeekHeadings[0].IsDay4Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day4 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined || !this.WeekHeadings[0].IsDay4Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day5) + (this.WeekHeadings[0].IsDay5Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day5 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined || !this.WeekHeadings[0].IsDay5Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day6) + (this.WeekHeadings[0].IsDay6Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day6 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined || !this.WeekHeadings[0].IsDay6Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"form-control time " + (this.WeekNames[0].day7) + (this.WeekHeadings[0].IsDay7Holiday.isHoliday ? " ClientHoliday" : "")} value={this.state.trFormdata.ClientHolidayHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} id={"0_" + this.WeekNames[0].day7 + "_ClientHldHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined || !this.WeekHeadings[0].IsDay7Holiday.isHoliday} ></input>
                                                    </td>
                                                    <td><span className="c-badge">H</span></td>
                                                    {this.state.showPTO && <><td>
                                                    </td><td>
                                                        </td></>}
                                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.ClientHolidayHrs[0].Total} onChange={this.changeTime} id="0_Total_ClientHldHrs" type="text" maxLength={5} tabIndex={-1} readOnly></input></td>
                                                    <td></td>
                                                </tr>
                                                <tr id="PTOHrs">
                                                    <td className="text-start"><div className="p-1">Time Off</div></td>
                                                    <td colSpan={2} className='text-center'>
                                                        {this.state.showClickHereLink && <div className='divClickHere'>
                                                            <span onClick={this.openPToFormModal} title={this.state.isTimeOffEdit ? 'Add Time Off' : 'View Time Off'} className='ClickHere'>Click Here</span><br></br>
                                                            <span >to  <b>{this.state.isTimeOffEdit ? 'submit' : 'view'}</b> Time Off details</span>
                                                        </div>}
                                                    </td>

                                                    {/* By defalult passing true in condition else block for disable prop : before integrating TimeOffRequest form it is false */}
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day1) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day1]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day1]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day1]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day1]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day1 + 'Date']} id={"0_" + this.WeekNames[0].day1 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsMonJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day1) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day2) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day2]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day2]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day2]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day2]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day2 + 'Date']} id={"0_" + this.WeekNames[0].day2 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsTueJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day2) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day3) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day3]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day3]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day3]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day3]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day3 + 'Date']} id={"0_" + this.WeekNames[0].day3 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsWedJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day3) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day4) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day4]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day4]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day4]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day4]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day4 + 'Date']} id={"0_" + this.WeekNames[0].day4 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsThuJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day4) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day5) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day5]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day5]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day5]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day5]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day5 + 'Date']} id={"0_" + this.WeekNames[0].day5 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsFriJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day5) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day6) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day6]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day6]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day6]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day6]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day6 + 'Date']} id={"0_" + this.WeekNames[0].day6 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSatJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day6) ? true : true} ></input>
                                                    </td>
                                                    <td>
                                                        <input className={"time " + (this.WeekNames[0].day7) + ' ' + ((this.state.totalPTOFormData.PTOSubTotal && this.state.showPTO) ? parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day7]) > 0 && parseFloat(this.state.totalPTOFormData.TOSubTotal[0][this.WeekNames[0].day7]) > 0 ? 'PTO_TOCell' : parseFloat(this.state.totalPTOFormData.PTOSubTotal[0][this.WeekNames[0].day7]) > 0 ? 'PTOCell' : 'form-control' : 'form-control')} value={this.state.trFormdata.PTOHrs[0][this.WeekNames[0].day7]} onChange={this.changeTime} data-date={this.WeekHeadings[0][this.WeekNames[0].day7 + 'Date']} id={"0_" + this.WeekNames[0].day7 + "_PTOHrs"} disabled={this.state.isSubmitted || this.state.showNonBillable || this.WeekHeadings[0].IsSunJoined || ['Sat', 'Sun'].includes(this.WeekNames[0].day7) ? true : true} ></input>
                                                    </td>
                                                    <td><span className="c-badge">TO</span></td>
                                                    {this.state.showPTO && <><td>
                                                        <input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].PTOBalance} onChange={this.changeTime} id="PTObalance" type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td><td>
                                                            <input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].PTOAfterDeduction} onChange={this.changeTime} id="PTOAfterDeduction" type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td></>}
                                                    <td><input className="form-control time WeekTotal" value={this.state.trFormdata.PTOHrs[0].Total} onChange={this.changeTime} id="0_Total_PTOHrs" type="text" maxLength={5} tabIndex={-1} readOnly></input></td>
                                                    <td></td>
                                                </tr>
                                                {this.state.trFormdata.ClientName.toLowerCase().includes("synergy") || this.state.trFormdata.ClientName.toLowerCase() == "" ? "" :
                                                    <tr className="">
                                                        <td className="fw-bold text-start">
                                                            <div className="p-2 fw-bold">
                                                                <i className="fas fa-business-time color-gray"></i> Billable Total
                                                            </div>
                                                        </td>
                                                        <td colSpan={2}>

                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day1} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day1]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day2} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day2]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day3} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day3]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day4} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day4]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day5} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day5]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day6} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day6]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <input className="form-control time DayTotal" id={"BillableTotal" + this.WeekNames[0].day7} value={this.state.trFormdata.BillableSubTotal[0][this.WeekNames[0].day7]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>
                                                            <span className="c-badge">BT</span>
                                                        </td>
                                                        {this.state.showPTO && <><td>
                                                        </td><td>
                                                            </td></>}
                                                        <td className='fw-bold'>
                                                            <input className="form-control fw-bold time BillableSubTotal" id="BillableTotal" value={this.state.trFormdata.BillableSubTotal[0].Total} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                        </td>
                                                        <td>

                                                        </td>
                                                    </tr>}
                                                <tr className="" id="GrandTotalRow">
                                                    <td className="fw-bold text-start">
                                                        <div className="p-2 fw-bold">
                                                            <i className="fas fa-business-time color-gray"></i> Grand Total
                                                        </div>
                                                    </td>
                                                    <td colSpan={2}></td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day1]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day1]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day2]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day2]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day3]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day3]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day4]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day4]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day5]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day5]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day6]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day6]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>
                                                        <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day7]} value={this.state.trFormdata.Total[0][this.WeekNames[0].day7]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td><span className="c-badge">T</span></td>
                                                    {this.state.showPTO && <><td>
                                                    </td><td>
                                                        </td></>}
                                                    <td>
                                                        <input className="form-control time  GrandTotal" id="GrandTotal" value={this.state.trFormdata.Total[0].Total} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                                    </td>
                                                    <td>

                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {this.state.showPTO && this.state.totalPTOFormData.PTOSubTotal && parseFloat(this.state.totalPTOFormData.PTOSubTotal[0]['Total']) > 0 && <div className="px-2">Note : <div><span className="showPTONote"></span> Highlighted field(s) indicate that 'Hours' are <b>Paid Time Off</b>.</div><div><span className="showPartialPTONote"></span> Highlighted field(s) indicate that 'Hours' are <b>Partial Paid Time Off</b>.</div></div>}
                                    <div className="light-box m-1 p-2 pt-3">
                                        <div className="media-px-12,col-md-9">
                                            <div className="light-text height-auto">
                                                <label className="floatingTextarea2 top-11">Comments</label>
                                                <textarea className="position-static form-control requiredinput" ref={this.Comments} onChange={this.handleChange} value={this.state.trFormdata.Comments} id="txtComments" name="Comments" disabled={false}></textarea>
                                            </div>
                                        </div>
                                        {this.state.IsReviewer ?
                                            <div className="col-md-3">
                                                <div className="light-text">
                                                    <InputCheckBox
                                                        label={"Is Client Approval Needed?"}
                                                        name={"IsClientApprovalNeededUI"}
                                                        checked={this.state.trFormdata.IsClientApprovalNeededUI}
                                                        onChange={this.handleChange}
                                                        isforMasters={false}
                                                        isdisable={false}
                                                        id='chkIsClientApprovalNeed'
                                                    />
                                                </div>
                                            </div> : ""}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12 text-center my-2">
                                        {this.state.showApproveRejectbtn ? <button type="button" id="btnApprove" onClick={this.showConfirmApprove} className="SubmitButtons btn" title="Approve" >Approve</button> : ''}
                                        {this.state.showApproveRejectbtn ? <button type="button" id="btnReject" onClick={this.showConfirmReject} className="RejectButtons btn" title="Reject" >Reject</button> : ''}
                                        {this.state.showRevokebtn ? <button type="button" id="btnRevoke" onClick={this.showConfirmRevoke} className="txt-white CancelButtons bc-burgundy btn" title="Revoke">Revoke</button> : ''}
                                        {!this.state.isSubmitted && this.state.showSubmitSavebtn ? <button type="button" id="btnSave" onClick={this.handleSubmitorSave} className="SaveButtons btn" title="Save">Save</button> : ''}
                                        {!this.state.isSubmitted && this.state.showSubmitSavebtn ? <button type="button" id="btnSubmit" onClick={this.showConfirmSubmit} className="SubmitButtons btn" title="Submit">Submit</button> : ''}
                                        <button type="button" id="btnCancel" onClick={this.handleCancel} className="CancelButtons btn" title="Cancel">Cancel</button>
                                    </div>

                                </div>

                                {this.state.trFormdata.CommentsHistoryData.length > 0 ? <><div className="light-box m-1 p-2 pt-3">
                                    <h4>History</h4>
                                    <div className='divActionHistory'>
                                        <table className="table table-bordered m-0 timetable">
                                            <thead className='ActionHistoryHead'>
                                                <tr>
                                                    <th className="" style={{ width: '250px' }}>Action By</th>
                                                    <th className="" style={{ width: '150px' }}>Action</th>
                                                    <th className="" style={{ width: '250px' }}>Date & Time (EST)</th>
                                                    <th className="">Comments</th>

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.bindComments()}

                                            </tbody>
                                        </table></div>
                                </div></> : ""
                                }
                            </div>
                        </div>
                    </div>
                    {this.state.showToaster && <Toaster />}
                    {this.state.loading && <Loader />}
                </React.Fragment>
            );
        }
    }
}
export default WeeklyTimesheet;