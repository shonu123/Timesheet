import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import Formvalidator from '../../Utilities/Formvalidator';
import { ControlType, StatusType } from '../../Constants/Constants';
import ModalPopUp from '../Shared/ModalPopUp';
import ModalPopUpConfirm from '../Shared/ModalPopUpConfirm';
import SearchableDropdown from '../Shared/SearchableDropdown';
import Loader from '../Shared/Loader';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/webs";
import "@pnp/sp/sputilities";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups";
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import DatePicker from "../Shared/DatePickerField";
import { Navigate } from 'react-router-dom';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import { addDays } from 'office-ui-fabric-react';
import DateUtilities from '../../Utilities/DateUtilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPlus } from "@fortawesome/free-solid-svg-icons";
export interface TimeOffRequestFormProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface TimeOffRequestFormState {
}

class TimeOffRequestForm extends React.Component<TimeOffRequestFormProps, TimeOffRequestFormState> {

    private siteURL: string;
    private Comments; WeekHeadings = []; WeekNames = [];
    constructor(props: TimeOffRequestFormProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.Comments = React.createRef();
        this.WeekHeadings.push({
            "Mon": '',
            "MonDate": '',
            "IsMonJoined": true,
            "Tue": '',
            "TueDate": '',
            "IsTueJoined": true,
            "Wed": '',
            "WedDate": '',
            "IsWedJoined": true,
            "Thu": '',
            "ThuDate": '',
            "IsThuJoined": true,
            "Fri": '',
            "FriDate": '',
            "IsFriJoined": true,
        })
        this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri" });

    }

    private getDynamicDayKeys = (fromDate: Date, toDate: Date) => {
        const dayKeys: string[] = [];
        const currentDate = new Date(fromDate);

        while (currentDate <= toDate) {
            const formattedDate = DateUtilities.getDateMMDDYYYY(currentDate); // "MM/dd/yyyy"
            if (![0, 6].includes(currentDate.getDay())) {
                dayKeys.push(formattedDate);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dayKeys;
    };
    private initializeTimeOffTableData = (fromDate: Date, toDate: Date) => {
        const dayKeys = this.getDynamicDayKeys(fromDate, toDate); // e.g., ['11/10/2025', '11/11/2025', ...]
        const emptyRow: any = { TimeOffType: '', IsPTOEligible: false, Total: '0.00' };
        const PTOSubTotal: any = { Type: "Paid Time Off", Total: '0.00' };
        const TOSubTotal: any = { Type: "Time Off", Total: '0.00' };
        const Total: any = { Type: "Total", Total: '0.00' };

        // Initialize each dynamic column
        if (![fromDate, toDate].includes(null)) {
            dayKeys.forEach(day => {
                emptyRow[day] = '';
                PTOSubTotal[day] = '0.00';
                TOSubTotal[day] = '0.00';
                Total[day] = '0.00';
            });
        }

        return {
            TimeOffRowsData: [emptyRow],
            PTOSubTotal: [PTOSubTotal],
            TOSubTotal: [TOSubTotal],
            Total: [Total],
            currentTimeOffRowsCount: 1,
            PTOTotal: 0,
            TOTotal: 0,
            DelRowIndex: '',
            dayKeys: dayKeys
        };
    };
    public state = {
        ItemID: 0,
        EmployeeId: this.props.spContext.userId,
        ClientName: '',  //if Employee exists in approval matrix consider first clientname, otherwise consider default as Synergy-HQ
        FromDate: null,
        ToDate: null,
        TotalHours: '',
        Comments: '',
        CommentsHistory: [],
        Status: '',
        PendingWith: "",
        IsSubmitted: false,
        EmployeeName: this.props.spContext.userDisplayName,
        EmployeeEmail: this.props.spContext.userEmail,
        SynergyManagerId: { results: [] },
        SynergyManagerNames: [],
        SynergyManagerEmails: [],
        DateOfJoining: '',
        fetchedFromDate: null,
        fetchedToDate: null,
        EmployeeData: [],
        isPTOEligible: false,

        PTOData: {
            PTOAvailed: '0',
            PTOBalance: '0',
            PTOApplied: '0',
            PTOBalanceAfterDeduction: '0',
            EmpPTOID: 0,
            PTOAvailableBalance: '0',
        },
        PreviousPTOBalance: '0',
        CurrentPTOBalance: '0',
        //TO table related
        TimeOffTableData: this.initializeTimeOffTableData(null, null),
        //PTOTransactionsDayWise: [],
        PTOTransactionListData: [],
        Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        AllTimeOffTypesObj: [],
        TimeOffTypesObj: [],
        UniqueTimeOffTypes: [],
        UPTOTypes: [],
        //action confirm popup
        showConfirmPopup: false,
        ConfirmPopupMessage: '',
        //invalid employee popup
        modalTitle: '',
        modalText: '',
        isSuccess: true,
        showHideModal: false,

        ActionID: '',

        loading: false,
        userGroups: [],
        errorMessage: '',
        Homeredirect: false,
        isRecordAcessable: true,
        message: "",
        showToaster: false,
        isDisabled: false,
        isHRView: false,
        existingTimeOffRowsData: '',
        existingPTOSubTotal: '',
        existingPTOTotal: 0,
        ButtonsVisibility: {
            Submit: true,
            Withdraw: false,
            Approve: false,
            Reject: false,
            Revoke: false,
            Update: false,
        },
        IsSubmittedFromTimesheetForm: false,
        TimesheetRec: []
    }


    public componentDidMount() {
        highlightCurrentNav("TimeOffRequestForm");
        this.setState({ loading: true });
        this.getOnLoadData();
    }

    private async getOnLoadData() {
        let userID = this.props.spContext.userId;
        let EmpfilterQuery = `Employee/Id eq '${userID}' and  IsActive eq 1`;
        let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let Year = new Date().getFullYear() + "";
        try {
            let [groups, Employee, TimeOffTypesData, ClientNames] = await Promise.all([
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll(),
                sp.web.lists.getByTitle('TimeOffTypes').items.filter('').select("*").getAll(),
                sp.web.lists.getByTitle('EmployeeMaster').items.filter(`Employee/Id eq ${userID} and IsActive eq 1`).select("ClientName,Employee/Title,Employee/Id,Employee/EMail,*").expand("Employee").orderBy("ClientName", true).getAll(),
            ])
            //To get dynamic time Off types
            let TimeOffTypesObj = [];
            TimeOffTypesData.sort((a, b) => a.Title.localeCompare(b.Title));
            TimeOffTypesData.forEach(item => {
                TimeOffTypesObj.push({ Title: item.Title, IsEligibleforPTO: [null, undefined].includes(item.IsEligibleforPTO) ? false : item.IsEligibleforPTO, Color: item.Color });
            })
            let UPTOTypes = TimeOffTypesData.map(i => {
                if (i.IsUPTO == true)
                    return i.Title;
            })
            let mappedTOTypes = this.mapUniqueTimeOffTypes(this.state.TimeOffTableData.TimeOffRowsData, TimeOffTypesObj);
            // To get latest EmpMatrix data
            let EmpMatrixObj = this.getEmpMatrixData(Employee);
            let isPTOEligible = EmpMatrixObj.isPTOEligible;
            this.setState({ SynergyManagerId: EmpMatrixObj.SynergyManagerIds, SynergyManagerNames: EmpMatrixObj.SynergyManagerNames, SynergyManagerEmails: EmpMatrixObj.SynergyManagerEmails, DateOfJoining: EmpMatrixObj.DOJ, isPTOEligible: isPTOEligible, ClientName: ClientNames.length ? ClientNames[0].ClientName : 'Synergy-HQ', showToaster: true, EmployeeData: Employee, UniqueTimeOffTypes: mappedTOTypes });
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            if (this.props.match.params.id != undefined) {
                let ItemID = this.props.match.params.id;
                await this.getItemDataByID(ItemID, userGroups);
                //TO table related
                this.generateDynamicWeekHeadings(this.state.FromDate, this.state.ToDate);

            }
            //To get latest PTO credentials           
            let EmpPTO = await this.getLatestPTOData(this.state.EmployeeId, this.props.match.params.id != undefined ? this.state.FromDate : new Date(), this.state.EmployeeData[0].Id); //To get latest PTO Record
            let EmpPTOData = this.getEmpPTOData(EmpPTO, TimeOffTypesData, this.state.isPTOEligible, this.state.Status); // To extract the PTOData,TimeOffTypesObj from latest PTO record
            let PTOData = EmpPTOData['PTOData'];
            TimeOffTypesObj = EmpPTOData['TimeOffTypesObj'];
            mappedTOTypes = this.mapUniqueTimeOffTypes(this.state.TimeOffTableData.TimeOffRowsData, TimeOffTypesObj);
            this.setState({ AllTimeOffTypesObj: TimeOffTypesData, UPTOTypes, PTOData: PTOData, TimeOffTypesObj: TimeOffTypesObj, UniqueTimeOffTypes: mappedTOTypes, loading: false });
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    // this function is used to get data from the timeoff record of Edit record
    private async getItemDataByID(ID, userGroups) {
        let filterQuery = "ID eq '" + ID + "'";
        let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        try {
            let [data, PTOTransactionListData] = await Promise.all([sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').getAll(),
            sp.web.lists.getByTitle('PTOTransactions').items.filter(`TimeOffID eq '${ID}' and IsActive eq 1`).select('*').getAll()
            ]);
            if (data.length < 1) {
                this.setState({ message: 'Success-Invalid', Homeredirect: true });
                return false;
            }
            // for item id exists, get by timeoffrec of employee
            let EmpfilterQuery = `Employee/Id eq '${data[0].Employee.ID}' and  IsActive eq 1`;
            let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
            let Employee = await sp.web.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll(),
                EmpMatrixID = Employee[0].Id;
            this.setState({ EmployeeData: Employee, DateOfJoining: new Date(DateUtilities.GetDateMMDDYYYYAsInList(Employee[0].DateOfJoining)) });
            this.bindItemData(data, userGroups, PTOTransactionListData, EmpMatrixID);
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    private getEmpPTOData = (EmpPTO, TimeOffTypesData, isPTOEligible, Status) => {
        let PTOAvailableBalance = '0';
        let TimeOffTypesObj = [];
        let PTOData = this.state.PTOData;
        if ([StatusType.ManagerReject.toString(), StatusType.HRReject, StatusType.Revoke, StatusType.Withdraw, StatusType.Save, ''].includes(Status)) {
            if (EmpPTO.length) {
                PTOAvailableBalance = [null, undefined, ''].includes(EmpPTO[0].PTOBalanceAfterDeduction) ? '0' : parseFloat(parseFloat(EmpPTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString();
            }
            // else {
            //     // if current login user not configured as active employee in employee matrix, show popup
            //     this.setState({ modalTitle: 'Invalid Employee configuration', modalText: 'Employee not configured in Employee Matrix,Please contact Administrator', isSuccess: false, showHideModal: true, loading: false });
            //     return false;
            // }
            //To bind only active TimeOffTypes
            TimeOffTypesData.forEach(item => {
                if (item.IsActive) {
                    if (isPTOEligible)  //if Employee eligible for PTO show all timeofftypes
                        TimeOffTypesObj.push({ Title: item.Title, IsEligibleforPTO: [null, undefined].includes(item.IsEligibleforPTO) ? false : item.IsEligibleforPTO, Color: item.Color });
                    else {
                        if (item.IsVisibleToPTONotEligibleEmp ? item.IsVisibleToPTONotEligibleEmp : false) //if Employee not eligible for PTO show only IsVisibleToPTONotEligibleEmp=true which is configured in list not in Application UI form
                        {
                            TimeOffTypesObj.push({ Title: item.Title, IsEligibleforPTO: [null, undefined].includes(item.IsEligibleforPTO) ? false : item.IsEligibleforPTO, Color: item.Color });
                        }
                    }
                }
            })
        }
        else {
            PTOAvailableBalance = this.state.PTOData.PTOAvailableBalance;
            //To bind all TimeOffTypes
            TimeOffTypesData.forEach(item => {
                TimeOffTypesObj.push({ Title: item.Title, IsEligibleforPTO: [null, undefined].includes(item.IsEligibleforPTO) ? false : item.IsEligibleforPTO, Color: item.Color });
            })
        }
        if (EmpPTO.length) {
            PTOData = {
                PTOAvailed: [null, undefined, ''].includes(EmpPTO[0].PTOAvailed) ? '0' : parseFloat(EmpPTO[0].PTOAvailed).toFixed(4),
                PTOBalance: [null, undefined, ''].includes(EmpPTO[0].PTOBalance) ? '0' : parseFloat(EmpPTO[0].PTOBalance).toFixed(4),
                PTOApplied: [null, undefined, ''].includes(EmpPTO[0].PTOApplied) ? '0' : parseFloat(EmpPTO[0].PTOApplied).toFixed(4),
                PTOBalanceAfterDeduction: [null, undefined, ''].includes(EmpPTO[0].PTOBalanceAfterDeduction) ? '0' : parseFloat(parseFloat(EmpPTO[0].PTOBalanceAfterDeduction).toFixed(4)).toString(),
                EmpPTOID: EmpPTO[0].Id,
                PTOAvailableBalance: PTOAvailableBalance,
            };
        }
        else {
            PTOData = {
                PTOAvailed: '0',
                PTOBalance: '0',
                PTOApplied: '0',
                PTOBalanceAfterDeduction: '0',
                EmpPTOID: 0,
                PTOAvailableBalance: '0',
            }
        }

        return { PTOData: PTOData, TimeOffTypesObj: TimeOffTypesObj };
    }
    private getEmpMatrixData = (Employee) => {
        let SynergyManagerIds = { results: [] };
        let SynergyManagerEmails = [], SynergyManagerNames = [];
        let DOJ = new Date();
        let isPTOEligible = false;
        if (Employee.length) {
            if (![null, undefined, ''].includes(Employee[0].SynergyManager) && Employee[0].SynergyManager.length > 0) {
                for (const user of Employee[0].SynergyManager) {
                    SynergyManagerIds.results.push(user.ID);
                    SynergyManagerEmails.push(user.EMail);
                    SynergyManagerNames.push(user.Title);
                }
            }
            DOJ = new Date(DateUtilities.GetDateMMDDYYYYAsInList(Employee[0].DateOfJoining));
            isPTOEligible = Employee[0].EligibleforPTO;
        }

        return { SynergyManagerIds: SynergyManagerIds, SynergyManagerEmails: SynergyManagerEmails, SynergyManagerNames: SynergyManagerNames, DOJ: DOJ, isPTOEligible: isPTOEligible };
    }
    private ClearTimeOffControls = async (FromDate, ToDate) => {
        let EmpMatrixObj = await this.getEmpMatrixData(this.state.EmployeeData);
        let isPTOEligible = EmpMatrixObj.isPTOEligible;
        //To get latest PTO credentials 
        let EmpPTO = await this.getLatestPTOData(this.state.EmployeeId, this.state.FromDate ?? this.state.FromDate, this.state.EmployeeData[0].Id);//To get latest PTO Record
        let EmpPTOData = await this.getEmpPTOData(EmpPTO, this.state.AllTimeOffTypesObj, isPTOEligible, ''); // To extract the PTOData,TimeOffTypesObj from latest PTO record
        let PTOData = EmpPTOData['PTOData'];
        let TimeOffTypesObj = EmpPTOData['TimeOffTypesObj'];
        let EmployeeId = this.props.spContext.userId;
        //to hold the withdraw/Revoke/Submit of TimeOffRequest ,if Timesheet status is not in [Save,Revoke,Reject]
        let WeekStartLowerBound = DateUtilities.getDateMMDDYYYY(addDays(new Date(FromDate), -7));
        let To = DateUtilities.getDateMMDDYYYY(addDays(new Date(ToDate), 1));
        let TSfilterQuery = `WeekStartDate gt '${WeekStartLowerBound}' and WeekStartDate lt '${To}' and Initiator/ID eq '${EmployeeId}' and EmpMatrixID eq '${this.state.EmployeeData[0].Id}'`;
        let TSselectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,Reviewers/Id,ReportingManager/Id,ReportingManager/EMail,*";
        let TimesheetRec = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(TSfilterQuery).select(TSselectQuery).expand('Initiator,Reviewers,ReportingManager').getAll();
        let mappedTOTypes = this.mapUniqueTimeOffTypes([{ TimeOffType: '', IsPTOEligible: false, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Total: '0.00' }], TimeOffTypesObj);

        let initialState = {
            ItemID: 0,
            EmployeeId: EmployeeId,
            FromDate: FromDate,
            ToDate: ToDate,
            TotalHours: '',
            Comments: '',
            CommentsHistory: [],
            Status: '',
            PendingWith: "",
            IsSubmitted: false,
            EmployeeName: this.props.spContext.userDisplayName,
            EmployeeEmail: this.props.spContext.userEmail,
            SynergyManagerId: EmpMatrixObj.SynergyManagerIds,
            SynergyManagerNames: EmpMatrixObj.SynergyManagerNames,
            SynergyManagerEmails: EmpMatrixObj.SynergyManagerEmails,
            DateOfJoining: EmpMatrixObj.DOJ,
            PTOData: PTOData,
            PreviousPTOBalance: '0',
            CurrentPTOBalance: '0',
            //TO table related
            TimeOffTableData: this.initializeTimeOffTableData(this.state.FromDate, this.state.ToDate),
            TimesheetRec: TimesheetRec,
            TimeOffTypesObj: TimeOffTypesObj,
            UniqueTimeOffTypes: mappedTOTypes,
            ButtonsVisibility: {
                Submit: true,
                Withdraw: false,
                Approve: false,
                Reject: false,
                Revoke: false,
                Update: false
            },
            IsSubmittedFromTimesheetForm: false,
            isDisabled: false,
            isHRView: false,
            existingTimeOffRowsData: '',
            existingPTOSubTotal: '',
            existingPTOTotal: 0,
            loading: false,
            //PTOTransactionsDayWise: [],
            PTOTransactionListData: [],
        }
        this.setState(initialState);
    }
    // this function is used to bind item data in 2 cases: 1.onload with ID url parameter, 2.on change of  'From' week start date
    private async bindItemData(data, userGroups, PTOTransactionListData, EmpMatrixID) {
        let SynergyManagerIds = { results: [] };
        let SynergyManagerEmails = [], SynergyManagerNames = [];
        try {
            if (![null, undefined, ''].includes(data[0].SynergyManager) && data[0].SynergyManager.length > 0) {
                for (const user of data[0].SynergyManager) {
                    SynergyManagerIds.results.push(user.ID);
                    SynergyManagerEmails.push(user.EMail);
                    SynergyManagerNames.push(user.Title);
                }
            }
            let EmployeeEmail = data[0].Employee.EMail, EmployeeId = data[0].Employee.ID;
            let FormDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].From)), ToDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].To));
            let PTOData = this.state.PTOData;
            PTOData.PTOAvailableBalance = [null, undefined, ''].includes(data[0].PTOAvailableBalance) ? '0' : parseFloat(parseFloat(data[0].PTOAvailableBalance).toFixed(4)).toString();
            //TO table related
            let TimeOffTableData = this.state.TimeOffTableData;
            TimeOffTableData.TimeOffRowsData = JSON.parse(data[0].TimeOffRows);
            TimeOffTableData.PTOSubTotal = JSON.parse(data[0].PTOSubTotal);
            TimeOffTableData.TOSubTotal = JSON.parse(data[0].TOSubTotal);
            TimeOffTableData.Total = JSON.parse(data[0].Total);
            TimeOffTableData.currentTimeOffRowsCount = JSON.parse(data[0].TimeOffRows).length;
            TimeOffTableData.PTOTotal = [null, undefined, ''].includes(data[0].PTOTotal) ? 0 : parseFloat(data[0].PTOTotal);
            TimeOffTableData.TOTotal = [null, undefined, ''].includes(data[0].TOTotal) ? 0 : parseFloat(data[0].TOTotal);
            TimeOffTableData.dayKeys = this.getDynamicDayKeys(FormDate, ToDate);

            let result = this.buttonsVisibility(data[0].Status, FormDate, EmployeeId, SynergyManagerIds, userGroups, data[0].IsSubmittedFromTimesheetForm, data[0].EligibleforPTO);
            //to hold the withdraw/Revoke/Submit of TimeOffRequest ,if Timesheet status is not in [Save,Revoke,Reject]
            let WeekStartLowerBound = DateUtilities.getDateMMDDYYYY(addDays(new Date(FormDate), -7));
            let To = DateUtilities.getDateMMDDYYYY(addDays(new Date(ToDate), 1));
            let TSfilterQuery = `WeekStartDate gt '${WeekStartLowerBound}' and WeekStartDate lt '${To}' and Initiator/ID eq '${EmployeeId}' and EmpMatrixID eq '${this.state.EmployeeData[0].Id}'`;
            let TSselectQuery = "Initiator/ID,Initiator/EMail,Reviewers/EMail,Reviewers/Id,ReportingManager/Id,ReportingManager/EMail,*";
            this.setState({
                EmployeeId: data[0].Employee.ID,
                EmployeeName: data[0].Employee.Title,
                EmployeeEmail: EmployeeEmail,
                FromDate: FormDate,
                fetchedFromDate: FormDate,
                ToDate: ToDate,
                fetchedToDate: ToDate,
                PreviousPTOBalance: [null, undefined, ''].includes(data[0].PreviousPTOBalance) ? '0' : parseFloat(parseFloat(data[0].PreviousPTOBalance).toFixed(4)).toString(),
                CurrentPTOBalance: [null, undefined, ''].includes(data[0].CurrentPTOBalance) ? '0' : parseFloat(parseFloat(data[0].CurrentPTOBalance).toFixed(4)).toString(),
                TotalHours: data[0].TotalHours,
                CommentsHistory: JSON.parse(data[0].CommentsHistory),
                SynergyManagerId: SynergyManagerIds,
                SynergyManagerNames: SynergyManagerNames,
                // loading: false,
                Status: data[0].Status,
                ButtonsVisibility: result.visibility,
                IsSubmittedFromTimesheetForm: data[0].IsSubmittedFromTimesheetForm,
                isDisabled: result.isDisabled,
                isHRView: result.isHRView,
                existingTimeOffRowsData: data[0].TimeOffRows,
                existingPTOSubTotal: data[0].PTOSubTotal,
                existingPTOTotal: TimeOffTableData.PTOTotal,
                SynergyManagerEmails: SynergyManagerEmails,
                IsSubmitted: data[0].IsSubmitted,
                isPTOEligible: data[0].EligibleforPTO,
                ItemID: parseInt(data[0].Id),
                Comments: '',
                userGroups: userGroups,
                PTOData: PTOData,
                TimeOffTableData: TimeOffTableData,
                //PTOTransactionsDayWise: PTOTransactionsDayWise,
                PTOTransactionListData: PTOTransactionListData,
            })
            //if this call is above the setState() async loading issue white screen, to avoid this shifted to below setState()
            let TimesheetRec = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(TSfilterQuery).select(TSselectQuery).expand('Initiator,Reviewers,ReportingManager').getAll();
            // instead dispaly warn message, hide the withdraw button if user has no access to withdraw the record
            let ButtonsVisibility = this.state.ButtonsVisibility;
            if (data[0].Status == StatusType.Submit && TimesheetRec.length && this.state.ButtonsVisibility.Withdraw) {
                let filteredTS = TimesheetRec.find((item) => [StatusType.Submit, StatusType.ManagerApprove, StatusType.ReviewerApprove, StatusType.Approved].includes(item.Status));
                if (filteredTS) {
                    let TSWeekStartDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(filteredTS.WeekStartDate))
                    let isOverlap = this.isOverlap(new Date(TSWeekStartDate), new Date(addDays(TSWeekStartDate, 6)), this.state.FromDate, this.state.ToDate);
                    if (isOverlap) {
                        ButtonsVisibility.Withdraw = false;
                    }
                }
            }
            this.setState({ TimesheetRec: TimesheetRec, ButtonsVisibility: ButtonsVisibility });
            this.userAccessableRecord(userGroups, EmployeeId, SynergyManagerIds);
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    // Below functions are used to check permissions and authentication
    private buttonsVisibility(Status, FormDate, EmployeeID, SynergyManagerIds, userGroups, IsSubmittedFromTimesheetForm, EligibleforPTO) {
        let result = { visibility: {}, isDisabled: false, isHRView: false };
        let loginUserID = this.props.spContext.userId;
        let isHR = userGroups.includes('Timesheet HR');
        let ButtonsVisibility = { Submit: true, Withdraw: false, Approve: false, Reject: false, Revoke: false, Update: false };

        if (Status == StatusType.Withdraw || Status == StatusType.Save) {
            result.isDisabled = true;
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                result.isDisabled = false;
                ButtonsVisibility.Submit = true;
            }
        }
        else if (Status == StatusType.Submit) {
            result.isDisabled = true;
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Withdraw = true;
            }
            else if (SynergyManagerIds.results.includes(loginUserID) && !IsSubmittedFromTimesheetForm) {
                ButtonsVisibility.Approve = true;
                ButtonsVisibility.Reject = true;
                if (isHR) {
                    result.isHRView = true;
                }
            }
            if (isHR && (IsSubmittedFromTimesheetForm && JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase().includes('bereavement') || JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase().includes('jury duty'))) {
                ButtonsVisibility.Approve = true;
                ButtonsVisibility.Reject = true;
                result.isHRView = true;
            }
        }
        else if ([StatusType.ManagerApprove, StatusType.ReviewerApprove].includes(Status)) {
            result.isDisabled = true;
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Revoke = true;
                // if (isHR && !IsSubmittedFromTimesheetForm) {
                if (isHR) {
                    ButtonsVisibility.Approve = true;
                    ButtonsVisibility.Reject = true;
                    result.isHRView = true;
                }
            }
            // else if (isHR && !IsSubmittedFromTimesheetForm) {
            else if (isHR) {
                ButtonsVisibility.Approve = true;
                ButtonsVisibility.Reject = true;
                result.isHRView = true;
            }
        }
        else if (Status == StatusType.ManagerReject) {
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true;
            }
            else if (SynergyManagerIds.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false;
                result.isDisabled = true;
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false;
                result.isDisabled = true;
            }
        }
        else if (Status == StatusType.Revoke) {
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true;
                ButtonsVisibility.Approve = false;
                ButtonsVisibility.Reject = false;
                ButtonsVisibility.Revoke = false;
                ButtonsVisibility.Withdraw = false;
            }
            else if (SynergyManagerIds.results.includes(loginUserID) || isHR ) {
                ButtonsVisibility.Submit = false;
                result.isDisabled = true;
            }
            // else if (isHR) {
            //     ButtonsVisibility.Submit = false;
            //     result.isDisabled = true;
            // }
        }
        else if (Status == StatusType.Approved || Status == StatusType.Updated) {
            result.isDisabled = true;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = false;
                ButtonsVisibility.Revoke = true;
            }
            else if (SynergyManagerIds.results.includes(loginUserID) || isHR) {
                ButtonsVisibility.Submit = false;
            }
            if (isHR && (new Date(addDays(new Date(), -31)) <= new Date(FormDate) && new Date(FormDate) <= new Date())) { // For HR Update Button enabled only if FormDate falls between past 31 days
                result.isHRView = true;
                ButtonsVisibility.Update = true;
            }
        }
        else if (Status == StatusType.HRReject) {
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true;
            }
            else {
                ButtonsVisibility.Submit = false;
                result.isDisabled = true;
            }
        }
        result.visibility = ButtonsVisibility;
        return result;
    }
    private userAccessableRecord(userGroups, EmployeeId, SynergyManagerIds) {
        let currentUserId = this.props.spContext.userId;
        let isAccessable = false;
        if (currentUserId == EmployeeId || SynergyManagerIds.results.includes(currentUserId) || userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins') || userGroups.includes('Timesheet HR')) {
            isAccessable = true;
        }
        this.setState({ isRecordAcessable: isAccessable });
    }

    // Handle change functions
    private handleChangeEvents = (event, actionMeta?) => {
        let name, inputvalue, value;
        //Below is condition for handle common change function for both react select dropdown  and normal controls
        if (![null, undefined].includes(event) && event.target != undefined) {
            name = event.target.name;
            inputvalue = event.target.value;
            value = event.target.type == 'checkbox' ? event.target.checked : inputvalue;
        }
        else if (actionMeta != undefined) {
            name = actionMeta.name;
            value = actionMeta.action == 'clear' ? '' : event.value;
        }
        if (name.includes('_TimeOffType')) //TO table related
        {
            let [PTOTotal, TOTotal] = [0, 0];
            let index = parseInt(name.split('_'));
            let TimeOffTableData = this.state.TimeOffTableData;
            let TimeOffRowsData = TimeOffTableData.TimeOffRowsData;
            TimeOffRowsData[index].TimeOffType = value;
            TimeOffRowsData[index].IsPTOEligible = this.state.AllTimeOffTypesObj.find(item => item.Title == value) ? this.state.AllTimeOffTypesObj.find(item => item.Title == value).IsEligibleforPTO : false;
            // TimeOffRowsData.forEach(item => {
            //     if (item.IsPTOEligible)//For PTO Total calculation
            //     {
            //         PTOTotal = PTOTotal + (parseFloat(item['Total']));
            //     }
            //     else //For To Total calculation
            //     {
            //         TOTotal = TOTotal + (parseFloat(item['Total']));
            //     }
            // }
            // );
            // TimeOffTableData.PTOTotal = PTOTotal;
            // TimeOffTableData.TOTotal = TOTotal;
            TimeOffTableData.TimeOffRowsData = TimeOffRowsData;
            TimeOffTableData = this.calculateTimeWhenRemoveRow(TimeOffTableData, TimeOffTableData.TimeOffRowsData); // this is to recalculate when Time Off Type changed

            let mappedTOTypes = this.mapUniqueTimeOffTypes(TimeOffTableData.TimeOffRowsData, this.state.TimeOffTypesObj);
            this.setState({ TimeOffTableData, UniqueTimeOffTypes: mappedTOTypes });
        }
        else {
            this.setState({ [name]: value });
        }
    }
    // this function is used to set date to the date feild
    private handleFromorToDate = (dateprops) => {
        let date = new Date();
        let DateField = dateprops[1] == "txtFromDate" ? 'FromDate' : dateprops[1] == "txtToData" ? 'ToDate' : '';
        date = dateprops[0] != null ? new Date(DateUtilities.getDateMMDDYYYY(dateprops[0])) : null;
        this.setState({ [DateField]: date, ReportData: [] }, async () => {
            // Regenerate dynamic week headings once both dates are set
            this.generateDynamicWeekHeadings(this.state.FromDate, this.state.ToDate);
            const dynamicTableData = this.initializeTimeOffTableData(this.state.FromDate, this.state.ToDate);
            this.ClearTimeOffControls(this.state.FromDate, this.state.ToDate);
            this.setState({ TimeOffTableData: dynamicTableData });
            //Below is validation for From, To Dates change
            if (![this.state.FromDate, this.state.ToDate].includes(null)) {
                if (new Date(this.state.FromDate) > new Date(this.state.ToDate)) {
                    let elm = document.getElementById('txtFromDate');
                    elm.focus();
                    setTimeout(() => elm.classList.add('mandatory-FormContent-focus'), 300);
                    this.setState({ loading: false });
                    customToaster('toster-error', ToasterTypes.Error, 'From Date cannot be greater than To Date', 4000);
                    return false;
                }
                let isValid = await this.validateDuplicateRecord();
                if (!isValid.status) {
                    this.setState({ loading: false });
                    customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
                    return false;
                }
                isValid = this.validateUniqueYear(this.state.FromDate, this.state.ToDate);
                if (!isValid.status) {
                    this.setState({ loading: false });
                    customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
                    return false;
                }

            }
        });


    }

    // Below are CRUD operation functions for actions
    private showSuccessToaster(ActionStatus) {
        if ([StatusType.Revoke, StatusType.Withdraw].includes(ActionStatus)) {
            customToaster('toster-success', ToasterTypes.Success, 'Time Off request ' + ActionStatus.toLowerCase() + ' succesfully', 2000);
            this.getOnLoadData();
        }
        else {
            let actionStatusForToaster = [StatusType.ManagerApprove, StatusType.HRApprove].includes(ActionStatus) ? StatusType.Approved : [StatusType.ManagerReject, StatusType.HRReject].includes(ActionStatus) ? StatusType.Reject : ActionStatus;
            this.setState({ loading: false, message: 'Success-' + actionStatusForToaster, Homeredirect: true });
        }
    }
    private handleActions = (e) => {
        this.setState({ loading: true });
        console.log(e.target.id);
        let ActionID = e.target.id;
        this.validateStatusBeforeAction(this.state.ItemID, ActionID, this.state.Status, this.state.Comments.trim(), this.state.CommentsHistory);
    }
    private async validateStatusBeforeAction(ID, ActionID, Status, Comments, commentsObj) {
        let filterQuery = "ID eq '" + ID + "'";
        let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let data = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').get()
        if (ActionID != "btnSubmit" && Status != data[0].Status) {
            this.setState({ loading: false, message: 'Success-' + StatusType.RecordModified, Homeredirect: true });
            return false;
        }
        let ConfirmPopupMessage = '';
        if (ActionID == "btnApprove") {
            let isValid = await this.DynamicValidation(ActionID);
            if (!isValid.status) {
                this.setState({ loading: false });
                customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
                return false;
            }
            ConfirmPopupMessage = 'Are you sure you want to approve?';
        }
        if (ActionID == "btnUpdate") {
            let isValid = await this.DynamicValidation(ActionID);
            if (!isValid.status) {
                this.setState({ loading: false });
                customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
                return false;
            }
            ConfirmPopupMessage = 'Are you sure you want to update?';
        }
        else if (ActionID == "btnReject") {
            let isValid = this.checkMandatoryComments(Comments);
            if (!isValid) {
                return false;
            }
            ConfirmPopupMessage = 'Are you sure you want to reject?';
        }
        else if (ActionID == "btnRevoke") {
            //to hold the Revoke of TimeOffRequest ,if Timesheet status is not in [Save,Revoke,Reject]
            if (this.state.TimesheetRec.length) {
                let isValid = this.validateTimesheetStatus(ActionID);
                if (!isValid.status) {
                    customToaster('toster-warning', ToasterTypes.Warning, isValid.message, 4000);
                    this.setState({ loading: false });
                    return false;
                }
            }
            else {
                let isValid = this.checkMandatoryComments(Comments)
                if (!isValid) {
                    return false;
                }
            }
            ConfirmPopupMessage = 'Are you sure you want to revoke?';
        }
        else if (ActionID == "btnWithdraw") {
            //to hold the withdraw of TimeOffRequest ,if Timesheet status is not in [Save,Revoke,Reject]
            if (this.state.TimesheetRec.length) {
                let isValid = this.validateTimesheetStatus(ActionID);
                if (!isValid.status) {
                    customToaster('toster-warning', ToasterTypes.Warning, isValid.message, 4000);
                    this.setState({ loading: false });
                    return false;
                }
            }
            else {
                let isValid = this.checkMandatoryComments(Comments);
                if (!isValid) {
                    return false;
                }
            }
            ConfirmPopupMessage = 'Are you sure you want to withdraw?';
        }
        else if (ActionID == "btnSubmit") {
            let isValid = await this.DynamicValidation(ActionID);
            if (!isValid.status) {
                this.setState({ loading: false });
                customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
                return false;
            }
            ConfirmPopupMessage = 'Are you sure you want to submit?';
        }
        this.setState({ ActionID: ActionID, showConfirmPopup: true, ConfirmPopupMessage: ConfirmPopupMessage, loading: false });
    }
    private validateTimesheetStatus = (ActionID) => {
        let isValid = { status: true, message: '' };
        let filteredTS = this.state.TimesheetRec.find((item) => [StatusType.Submit, StatusType.ManagerApprove, StatusType.ReviewerApprove, StatusType.Approved].includes(item.Status));
        if (filteredTS) {
            let TSWeekStartDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(filteredTS.WeekStartDate))
            let isOverlap = this.isOverlap(new Date(TSWeekStartDate), new Date(addDays(TSWeekStartDate, 6)), this.state.FromDate, this.state.ToDate);
            if (isOverlap) {
                switch (ActionID) {
                    case "btnWithdraw":
                        isValid.message = `Timesheet ${[StatusType.Approved].includes(filteredTS.Status) ? '' : 'approval'} for the week starting ${DateUtilities.GetDateMMDDYYYYAsInList(filteredTS.WeekStartDate)} (${filteredTS.ClientName}) is ${[StatusType.Submit, StatusType.ManagerApprove, StatusType.ReviewerApprove].includes(filteredTS.Status) ? 'in progress' : 'approved'}. Withdrawal not possible.`;
                        isValid.status = false;
                        break;
                    case "btnSubmit":
                        isValid.message = `Timesheet ${[StatusType.Approved].includes(filteredTS.Status) ? '' : 'approval'} for the week starting ${DateUtilities.GetDateMMDDYYYYAsInList(filteredTS.WeekStartDate)} (${filteredTS.ClientName}) is ${[StatusType.Submit, StatusType.ManagerApprove, StatusType.ReviewerApprove].includes(filteredTS.Status) ? 'in progress' : 'approved'}. Submit not possible.`;
                        isValid.status = false;
                        break;
                    case "btnRevoke":
                        isValid.message = `Timesheet approval for the week starting ${DateUtilities.GetDateMMDDYYYYAsInList(filteredTS.WeekStartDate)} (${filteredTS.ClientName}) is ${[StatusType.Submit, StatusType.ManagerApprove, StatusType.ReviewerApprove].includes(filteredTS.Status) ? 'in progress' : 'approved'}. Revoke not possible.`;
                        isValid.status = false;
                        break;
                }
            }
        }
        return isValid;
    }
    // this function is used to validate form and send data to list if validation succeeds
    private DynamicValidation = async (ActionID) => {
        let isValid = { message: '', status: true }
        this.setState({ loading: true });
        let data = {
            FromDate: { val: this.state.FromDate, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
            ToDate: { val: this.state.ToDate, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
        }
        let isDatesValid = Formvalidator.checkValidations(data);
        if (!isDatesValid.status) {
            return isDatesValid;
        }
        if (new Date(this.state.FromDate) > new Date(this.state.ToDate)) {
            let elm = document.getElementById('txtFromDate');
            elm.focus();
            setTimeout(() => elm.classList.add('mandatory-FormContent-focus'), 300);
            isValid.status = false;
            isValid.message = 'From Date cannot be greater than To Date';
            return isValid;
        }
        let doj = new Date(this.state.DateOfJoining);
        let from = new Date(this.state.FromDate);
        if (new Date(doj) > new Date(from)) {
            isValid.status = false;
            isValid.message = 'TimeOff cannot be applied for days preceding your date of joining.';
            return isValid;
        }
        isValid = isDatesValid.status ? this.validateTimeOffControls(ActionID) : isDatesValid;
        if (!isValid.status) {
            return isValid;
        }
        // isValid = this.checkIsValidDateRange(this.state.FromDate, this.state.ToDate); // removed validation of current year restriction
        // if (!isValid.status) {
        //     return isValid;
        // }
        isValid = ActionID == 'btnSubmit' ? await this.validateDuplicateRecord() : isValid;
        if (!isValid.status) {
            return isValid;
        }
        //to hold the submit of TimeOffRequest ,if Timesheet status is not in [Save,Revoke,Reject]
        if (this.state.TimesheetRec.length) {
            isValid = this.validateTimesheetStatus(ActionID);
            if (!isValid.status) {
                return isValid;
            }
        }
        if ((ActionID == 'btnApprove' || ActionID == 'btnUpdate') && this.state.isHRView && this.state.existingTimeOffRowsData.toLowerCase() != JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase() && this.state.Comments.trim() == '') {
            let elm = document.getElementById('txtComments');
            elm.focus();
            setTimeout(() => elm.classList.add('mandatory-FormContent-focus'), 300);
            isValid.status = false;
            isValid.message = 'Please provide comments for updating hours.';
            return isValid;
        }
        if (ActionID == 'btnUpdate' && this.state.isHRView && this.state.existingTimeOffRowsData.toLowerCase() == JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase()) {
            isValid.status = false;
            isValid.message = 'Nothing has been modified to update.';
            return isValid;
        }
        return isValid;
    }
    private getActionDetails = (ActionID) => {
        let postObject, ActionStatus = '';
        let isHR = this.state.userGroups.includes('Timesheet HR');
        let isHRModifyData = (ActionID == 'btnApprove' || ActionID == 'btnUpdate') && this.state.isHRView && this.state.existingTimeOffRowsData.toLowerCase() != JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase();
        let isHRModifyPTOData = (ActionID == 'btnApprove' || ActionID == 'btnUpdate') && this.state.isHRView && this.state.existingPTOSubTotal.toLowerCase() != JSON.stringify(this.state.TimeOffTableData.PTOSubTotal).toLowerCase();

        let commentsObj = this.state.CommentsHistory, Comments = this.state.Comments;
        if (ActionID == "btnApprove") {
            if (this.state.Status == StatusType.Submit) {
                commentsObj.push({
                    Action: StatusType.Approved,
                    Role: 'Reporting Manager',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                if (isHR) {
                    postObject = {
                        CommentsHistory: JSON.stringify(commentsObj),
                        Status: StatusType.Approved,
                        PendingWith: "NA",
                        Revised: true
                    }
                    ActionStatus = StatusType.Approved;
                }
                else {
                    postObject = {
                        CommentsHistory: JSON.stringify(commentsObj),
                        Status: StatusType.Approved,
                        PendingWith: "NA",
                        Revised: true
                    }
                    ActionStatus = StatusType.Approved;
                    if (JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase().includes('bereavement') || JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData).toLowerCase().includes('jury duty')) {
                        postObject = {
                            CommentsHistory: JSON.stringify(commentsObj),
                            Status: StatusType.ManagerApprove,
                            PendingWith: "HR",
                            Revised: true
                        }
                        ActionStatus = StatusType.ManagerApprove;
                    }
                }
            }
            else {
                commentsObj.push({
                    Action: StatusType.Approved,
                    Role: 'HR',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.Approved,
                    PendingWith: "NA",
                    Revised: true,
                }
                ActionStatus = StatusType.Approved;
            }
            //Below included after edit access provided to HR
            if (isHRModifyData) {
                postObject['TimeOffRows'] = JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData);
                postObject['PTOSubTotal'] = JSON.stringify(this.state.TimeOffTableData.PTOSubTotal);
                postObject['TOSubTotal'] = JSON.stringify(this.state.TimeOffTableData.TOSubTotal);
                postObject['Total'] = JSON.stringify(this.state.TimeOffTableData.Total);
                postObject['PTOTotal'] = this.state.TimeOffTableData.PTOTotal.toString();
                postObject['TOTotal'] = this.state.TimeOffTableData.TOTotal.toString();
                postObject['TotalHours'] = (this.state.TimeOffTableData.PTOTotal + this.state.TimeOffTableData.TOTotal).toString();
            }
        }
        else if (ActionID == "btnUpdate") {
            commentsObj.push({
                Action: StatusType.Updated,
                Role: 'HR',
                User: this.props.spContext.userDisplayName,
                Comments: Comments,
                Date: new Date().toISOString()
            })
            postObject = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Updated,
                PendingWith: "NA",
                Revised: true,
            }
            ActionStatus = StatusType.Updated;
            //Below included after edit access provided to HR
            if (isHRModifyData) {
                postObject['TimeOffRows'] = JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData);
                postObject['PTOSubTotal'] = JSON.stringify(this.state.TimeOffTableData.PTOSubTotal);
                postObject['TOSubTotal'] = JSON.stringify(this.state.TimeOffTableData.TOSubTotal);
                postObject['Total'] = JSON.stringify(this.state.TimeOffTableData.Total);
                postObject['PTOTotal'] = this.state.TimeOffTableData.PTOTotal.toString();
                postObject['TOTotal'] = this.state.TimeOffTableData.TOTotal.toString();
                postObject['TotalHours'] = (this.state.TimeOffTableData.PTOTotal + this.state.TimeOffTableData.TOTotal).toString();
            }
        }
        else if (ActionID == "btnReject") {
            if (this.state.Status == StatusType.Submit) {
                commentsObj.push({
                    Action: StatusType.Reject,
                    Role: 'Reporting Manager',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.ManagerReject,
                    PendingWith: "Initiator",
                    Revised: true
                }
                ActionStatus = StatusType.ManagerReject;
            }
            else {
                commentsObj.push({
                    Action: StatusType.Reject,
                    Role: 'HR',
                    User: this.props.spContext.userDisplayName,
                    Comments: Comments,
                    Date: new Date().toISOString()
                })
                postObject = {
                    CommentsHistory: JSON.stringify(commentsObj),
                    Status: StatusType.HRReject,
                    PendingWith: "Initiator",
                    Revised: true
                }
                ActionStatus = StatusType.HRReject;
            }
        }
        else if (ActionID == "btnRevoke") {
            commentsObj.push({
                Action: StatusType.Revoke,
                Role: 'Initiator',
                User: this.props.spContext.userDisplayName,
                Comments: Comments,
                Date: new Date().toISOString()
            })
            postObject = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Revoke,
                PendingWith: "Initiator",
            }
            ActionStatus = StatusType.Revoke;
        }
        else if (ActionID == "btnWithdraw") {
            commentsObj.push({
                Action: StatusType.Withdraw,
                Role: 'Initiator',
                User: this.props.spContext.userDisplayName,
                Comments: Comments,
                Date: new Date().toISOString()
            })
            postObject = {
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Withdraw,
                PendingWith: "Initiator",
            }
            ActionStatus = StatusType.Withdraw;
        }
        else if (ActionID == "btnSubmit") {
            commentsObj.push({
                Action: this.state.IsSubmitted ? "Re-" + StatusType.Submit : StatusType.Submit,
                Role: 'Initiator',
                User: this.props.spContext.userDisplayName,
                Comments: this.state.Comments,
                Date: new Date().toISOString()
            })
            postObject = {
                EmployeeId: this.state.EmployeeId,
                From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.FromDate))),
                To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.ToDate))),
                PTOAvailableBalance: this.state.PTOData.PTOAvailableBalance.toString(),
                CommentsHistory: JSON.stringify(commentsObj),
                Status: StatusType.Submit,
                PendingWith: "Manager",
                SynergyManagerId: this.state.SynergyManagerId,
                IsSubmitted: true,
                //TO table related
                TimeOffRows: JSON.stringify(this.state.TimeOffTableData.TimeOffRowsData),
                PTOSubTotal: JSON.stringify(this.state.TimeOffTableData.PTOSubTotal),
                TOSubTotal: JSON.stringify(this.state.TimeOffTableData.TOSubTotal),
                Total: JSON.stringify(this.state.TimeOffTableData.Total),
                PTOTotal: this.state.TimeOffTableData.PTOTotal.toString(),
                TOTotal: this.state.TimeOffTableData.TOTotal.toString(),
                TotalHours: (this.state.TimeOffTableData.PTOTotal + this.state.TimeOffTableData.TOTotal).toString(),
                EligibleforPTO: this.state.isPTOEligible,
                IsActive: true,
                EmpMatrixID: this.state.EmployeeData[0].Id.toString(),
                IsSubmittedFromTimesheetForm: false
            }
            ActionStatus = this.state.IsSubmitted ? "Re-" + StatusType.Submit : StatusType.Submit
        }
        return { postObject: postObject, ActionStatus: ActionStatus, isHRModifyData: isHRModifyData, isHRModifyPTOData: isHRModifyPTOData };
    }
    private generateEmailData = () => {
        this.setState({ showConfirmPopup: false, ConfirmPopupMessage: '' });
        let IsPTOEligibleTOSelected = this.state.TimeOffTableData.PTOTotal > 0;
        let ActionDetails = this.getActionDetails(this.state.ActionID);
        let postObject = ActionDetails['postObject'];
        let ActionStatus = ActionDetails['ActionStatus'];
        let isHRModifyData = ActionDetails['isHRModifyData'];
        let isHRModifyPTOData = ActionDetails['isHRModifyPTOData'];

        let AppliedTOHours = this.state.TimeOffTableData.PTOTotal;
        let PTOPostData = {};
        switch (ActionStatus) {
            case StatusType.Submit:
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) + AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }
                break;
            case "Re-" + StatusType.Submit:
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) + AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }

                break;
            case StatusType.ManagerApprove:
                break;
            case StatusType.ManagerReject:
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }

                break;
            case StatusType.Revoke:
                //if HR approved, deduct hours from PTOAvailed, other wise deduct hours from PTOApplied
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                }
                if (this.state.Status == StatusType.Approved) {
                    PTOPostData['PTOBalance'] = (parseFloat(this.state.PTOData.PTOBalance) + AppliedTOHours).toFixed(4);
                    PTOPostData['PTOAvailed'] = (parseFloat(this.state.PTOData.PTOAvailed) - AppliedTOHours).toFixed(4);
                }
                else {
                    PTOPostData['PTOApplied'] = (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4);
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }

                break;
            case StatusType.Withdraw:
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }

                break;
            case StatusType.Approved:
                //Below included after edit access provided to HR
                if (isHRModifyPTOData) {
                    PTOPostData =
                    {
                        PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                        PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) + AppliedTOHours).toFixed(4),
                    }
                    if (IsPTOEligibleTOSelected) {
                        postObject['PreviousPTOBalance'] = this.state.PTOData.PTOAvailableBalance;
                        postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                    }

                }
                //Below is for Bereavement and Jury Duty cases handling where PTOAvailed should not be updated
                if (!this.state.IsSubmittedFromTimesheetForm) {
                    PTOPostData['PTOAvailed'] = (parseFloat(this.state.PTOData.PTOAvailed) + AppliedTOHours).toFixed(4);
                    PTOPostData['PTOApplied'] = (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4);
                    PTOPostData['PTOBalance'] = (parseFloat(this.state.PTOData.PTOBalance) - AppliedTOHours).toFixed(4);
                }
                //Below is for two cases handling for HR Modifying the data ,example cases
                //Case 1 : PTOApplied=18,existingPTOTotal=10,AppliedTOHours=12 :now updated  PTOApplied= 18 - 12 + (12-10)=8
                //Case 2 : PTOApplied=20,existingPTOTotal=10,AppliedTOHours=8 :now updated  PTOApplied= 20 - 8 -(10-8)=10
                if (isHRModifyPTOData) {
                    if (this.state.existingPTOTotal < AppliedTOHours) {
                        PTOPostData['PTOApplied'] = ((parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours) + (AppliedTOHours - this.state.existingPTOTotal)).toFixed(4);
                    }
                    if (this.state.existingPTOTotal > AppliedTOHours) {
                        PTOPostData['PTOApplied'] = ((parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours) - (this.state.existingPTOTotal - AppliedTOHours)).toFixed(4);
                    }
                    PTOPostData['PTOBalanceAfterDeduction'] = ((parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + this.state.existingPTOTotal) - (AppliedTOHours)).toFixed(4);
                }
                if (Number(PTOPostData['PTOApplied']) < 0)// Below included after edit access provided to HR, applied might be fall into negative in some cases
                {
                    PTOPostData['PTOApplied'] = '0';
                }
                break;
            case StatusType.Updated:
                if (isHRModifyPTOData) {
                    PTOPostData =
                    {
                        PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                    }
                    if (IsPTOEligibleTOSelected) {
                        postObject['PreviousPTOBalance'] = this.state.PTOData.PTOAvailableBalance;
                        postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                    }
                    if (this.state.existingPTOTotal < AppliedTOHours) {
                        PTOPostData['PTOAvailed'] = (parseFloat(this.state.PTOData.PTOAvailed) + (AppliedTOHours - this.state.existingPTOTotal)).toFixed(4);
                        PTOPostData['PTOBalance'] = (parseFloat(this.state.PTOData.PTOBalance) - (AppliedTOHours - this.state.existingPTOTotal)).toFixed(4);
                        PTOPostData['PTOBalanceAfterDeduction'] = (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) - (AppliedTOHours - this.state.existingPTOTotal)).toFixed(4);
                    }
                    if (this.state.existingPTOTotal > AppliedTOHours) {
                        PTOPostData['PTOAvailed'] = (parseFloat(this.state.PTOData.PTOAvailed) - (this.state.existingPTOTotal - AppliedTOHours)).toFixed(4);
                        PTOPostData['PTOBalance'] = (parseFloat(this.state.PTOData.PTOBalance) + (this.state.existingPTOTotal - AppliedTOHours)).toFixed(4);
                        PTOPostData['PTOBalanceAfterDeduction'] = (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + (this.state.existingPTOTotal - AppliedTOHours)).toFixed(4);
                    }
                }
                break;
            case StatusType.HRReject:
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
                    postObject['CurrentPTOBalance'] = parseFloat(PTOPostData['PTOBalanceAfterDeduction']).toString();
                }
                break;
            default:
                break;
        }
        if (!IsPTOEligibleTOSelected) {
            postObject['PreviousPTOBalance'] = this.state.PTOData.PTOBalanceAfterDeduction;
            postObject['CurrentPTOBalance'] = this.state.PTOData.PTOAvailableBalance;
        }
        this.InsertorUpdatedata(postObject, PTOPostData, IsPTOEligibleTOSelected, isHRModifyData, isHRModifyPTOData, ActionStatus);
    }
    // this function is used save data in the list
    private async InsertorUpdatedata(formdata, PTOPostData, IsPTOEligibleTOSelected, isHRModifyData, isHRModifyPTOData, ActionStatus) {
        try {
            if (this.state.ItemID > 0) {   //update existing recordl
                this.setState({ loading: true });
                //Update timesheet record after HR Approve/Update
                if ([StatusType.Approved, StatusType.Updated].includes(formdata.Status) && this.state.IsSubmittedFromTimesheetForm && this.state.TimesheetRec.length && [StatusType.ReviewerApprove].includes(this.state.TimesheetRec[0].Status)) {
                    let TSId = this.state.TimesheetRec[0].ID;
                    let TSData = {
                        PTOSubTotal: formdata.PTOSubTotal,
                        TOSubTotal: formdata.TOSubTotal,
                        Status: StatusType.Approved,
                        PendingWith: "NA",
                    }
                    await this.updateTimesheetRecordsAfterHRModify(TSId, TSData);
                }
                sp.web.lists.getByTitle('TimeOffEmployees').items.getById(this.state.ItemID).update(formdata).then((res) => {
                    if (IsPTOEligibleTOSelected) {
                        this.updatePTOAndPTOTransactionsDayWise(PTOPostData, formdata, this.state.ItemID, isHRModifyPTOData, ActionStatus);
                    }
                    else {
                        this.showSuccessToaster(formdata.Status);
                    }
                }, (error) => {
                    console.log(error);
                });
            }
            else {                  //Add New record
                this.setState({ loading: true });
                sp.web.lists.getByTitle('TimeOffEmployees').items.add(formdata).then((res) => {
                    if (IsPTOEligibleTOSelected) {
                        this.updatePTOAndPTOTransactionsDayWise(PTOPostData, formdata, res.data.Id, isHRModifyPTOData, ActionStatus);
                    }
                    else {
                        this.showSuccessToaster(formdata.Status);
                    }
                }, (error) => {
                    console.log(error);
                });
            }
        }
        catch (e) {
            console.log('Failed to add or update the item');
            this.setState({ message: 'Error' });
        }

    }
    private async getLatestPTOData(EmployeeId, WeekStartDate, EmpMatrixID) {
        let EmployeePTO = [];
        if (WeekStartDate != null) {
            try {
                let filterQuery = `Employee/Id eq '${EmployeeId}' and Year eq '${WeekStartDate.getFullYear()}' and IsActive eq 1 and EmpMatrixID eq ${EmpMatrixID}`;
                await sp.web.lists.getByTitle('EmployeePTO').items.filter(filterQuery).select('Employee/Id,Employee/Title,Employee/EMail,*').expand("Employee").getAll()
                    .then((response) => {
                        EmployeePTO = response;
                    }, (error) => {
                        this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
                        console.log(error);
                    });
            }
            catch (e) {
                console.log('Failed to get PTO Data');
                this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
            }
        }
        return EmployeePTO;
    }
    private updateTimesheetRecordsAfterHRModify(TSId, TSData) {
        try {
            sp.web.lists.getByTitle('WeeklyTimesheet').items.getById(TSId).update(TSData);
        }
        catch (e) {
            console.log('Failed to update Timesheet Records after HR Modify');
            this.setState({ message: 'Error' });
        }
    }
    //This function is used when PTO Transaction is updated with multiple reocords day wise
    private async updatePTOAndPTOTransactionsDayWise(PTOPostData, formdata, TimeOffID, isHRModifyPTOData, ActionStatus) {
        try {
            let PTOBatch = sp.web.createBatch();
            let PTOTransactionsDayWise = this.getPTOtransactionsDayWise();
            let PTOtransactionsDayWisePostData = this.calculatePTOTransactions(isHRModifyPTOData ? this.state.PTOData.PTOAvailableBalance : this.state.PTOData.PTOBalanceAfterDeduction, PTOTransactionsDayWise);
            //batch update of EmployeePTO and adding PTO Transaction :Start
            sp.web.lists.getByTitle('EmployeePTO').items.getById(this.state.PTOData.EmpPTOID).inBatch(PTOBatch).update(PTOPostData);
            if (this.state.ItemID > 0) {
                //If action is other than Submit, update only Status
                if (formdata.Status != StatusType.Submit && (!isHRModifyPTOData)) {
                    if (this.state.PTOTransactionListData.length) {
                        for (const row of this.state.PTOTransactionListData) {
                            let Transaction = {
                                TransactionType: formdata.Status
                            }
                            sp.web.lists.getByTitle('PTOTransactions').items.getById(row.ID).inBatch(PTOBatch).update(Transaction);
                        }
                    }
                }
                else {
                    if (this.state.PTOTransactionListData.length) {

                        let exsistingData = [];
                        for (let row of this.state.PTOTransactionListData) {

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
                        let postData = this.getPTOTransactionsData(exsistingData, PTOtransactionsDayWisePostData);

                        for (const row of postData) {
                            let Transaction = {
                                ClientName: this.state.ClientName,
                                TimeOffID: TimeOffID.toString(),
                                EmployeeId: this.state.EmployeeId,
                                TransactionType: formdata.Status,
                                TimeOffTypes: JSON.stringify(row['TimeOffTypes']),
                                PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                Hours: parseFloat(row['Hours']).toFixed(4),
                                PreviousPTOBalance: parseFloat(row['PreviousPTOBalance']).toFixed(4),
                                CurrentPTOBalance: parseFloat(row['CurrentPTOBalance']).toFixed(4),
                                Reason: this.state.Comments,
                                Year: new Date(row['DayDate']).getFullYear().toString(),
                                IsActive: row.IsActive
                            }
                            if ([StatusType.Submit].includes(formdata.Status) || isHRModifyPTOData) {
                                Transaction['SubmittedDate'] = this.addBrowserwrtServer(new Date());
                                Transaction['EmpMatrixID'] = this.state.EmployeeData[0].Id.toString();
                            }
                            if (row.ID > 0)
                                sp.web.lists.getByTitle('PTOTransactions').items.getById(row.ID).inBatch(PTOBatch).update(Transaction);
                            else
                                sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(Transaction);
                        }
                    }
                    else {
                        // now applied for pto previously did not apply
                        for (const row of PTOtransactionsDayWisePostData) {
                            let Transaction = {
                                ClientName: this.state.ClientName,
                                TimeOffID: TimeOffID.toString(),
                                EmployeeId: this.state.EmployeeId,
                                TransactionType: formdata.Status,
                                TimeOffTypes: JSON.stringify(row['TimeOffTypes']),
                                PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                                Hours: parseFloat(row['Hours']).toFixed(4),
                                PreviousPTOBalance: parseFloat(row['PreviousPTOBalance']).toFixed(4),
                                CurrentPTOBalance: parseFloat(row['CurrentPTOBalance']).toFixed(4),
                                Reason: this.state.Comments,
                                Year: new Date(row['DayDate']).getFullYear().toString(),
                                IsActive: row.IsActive
                            }
                            if ([StatusType.Submit].includes(formdata.Status) || isHRModifyPTOData) {
                                Transaction['SubmittedDate'] = this.addBrowserwrtServer(new Date());
                                Transaction['EmpMatrixID'] = this.state.EmployeeData[0].Id.toString();
                            }
                            sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(Transaction);
                        }
                    }
                }
            }
            else {
                // For batch adding of PTO transactions day wise if new Time Off
                for (const row of PTOtransactionsDayWisePostData) {
                    let PTOTransaction = {
                        ClientName: this.state.ClientName,
                        TimeOffID: TimeOffID.toString(),
                        EmployeeId: this.state.EmployeeId,
                        TransactionType: formdata.Status,
                        TimeOffTypes: JSON.stringify(row['TimeOffTypes']),
                        PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        Hours: parseFloat(row['Hours']).toFixed(4),
                        PreviousPTOBalance: parseFloat(row['PreviousPTOBalance']).toFixed(4),
                        CurrentPTOBalance: parseFloat(row['CurrentPTOBalance']).toFixed(4),
                        Reason: this.state.Comments,
                        Year: new Date(row['DayDate']).getFullYear().toString(),
                        IsActive: true
                    }
                    if ([StatusType.Submit].includes(formdata.Status)) {
                        PTOTransaction['SubmittedDate'] = this.addBrowserwrtServer(new Date());
                        PTOTransaction['EmpMatrixID'] = this.state.EmployeeData[0].Id.toString();
                    }
                    sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(PTOTransaction);
                }
            }

            Promise.all([PTOBatch.execute()]).then(async (PTORes) => {
                // Handling If an employee submits a time-off range within the previous year and the submission date is in the current year
                // considering date Based on SubmittedDate :
                // Case 1:In Case of Employee applied for Date range in previous year and submitting in current year
                let SubmittedDate = new Date(); // Default current date
                if (this.state.ItemID > 0 && this.state.PTOTransactionListData.length) { // if existing record found consider the existing Submitted date
                    SubmittedDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(this.state.PTOTransactionListData[0].SubmittedDate));
                }
                if (new Date(this.state.FromDate).getFullYear() == (new Date(SubmittedDate).getFullYear() - 1) && ([StatusType.Submit,StatusType.Withdraw,StatusType.Revoke, StatusType.ManagerReject, StatusType.HRReject].includes(ActionStatus))) {
                    await this.updateEmployeePTOAndOpeningPTOTnForCurrentYear(ActionStatus);
                }
                this.showSuccessToaster(formdata.Status);
            }).catch(PTOError => {
                console.log(PTOError);
                console.log("Error while updating PTO Transactions data");
            })
            //batch update of EmployeePTO and adding PTO Transaction :End
        }
        catch (e) {
            console.log('Failed to add PTO Data');
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
        }
    }
    private async updateEmployeePTOAndOpeningPTOTnForCurrentYear(ActionStatus) {
        try {
            let currentYear = new Date().getFullYear();
            let PTOfilterQuery = `Employee/Id eq '${this.state.EmployeeId}' and Year eq '${currentYear}' and IsActive eq 1 and EmpMatrixID eq ${this.state.EmployeeData[0].Id}`;
            let TranfilterQuery = `Employee/Id eq '${this.state.EmployeeId}' and Year eq '${currentYear}' and IsActive eq 1 and EmpMatrixID eq ${this.state.EmployeeData[0].Id} and TransactionType eq 'Opening PTO Balance'`;
            let [EmpPTODataCurrentYear, EmpOpeningPTOTran] = await Promise.all([
                sp.web.lists.getByTitle('EmployeePTO').items.filter(PTOfilterQuery).select('Id,PTOBalance,PTOBalanceAfterDeduction,Employee/Title,Employee/Id,*').expand("Employee").getAll(),
                sp.web.lists.getByTitle('PTOTransactions').items.filter(TranfilterQuery).select('Id,Employee/Title,Employee/Id,*').expand("Employee").getAll()
            ]
            );
            let AppliedPTOHours = this.state.TimeOffTableData.PTOTotal;
            if (EmpPTODataCurrentYear.length) {
                let updatedPTODataCurryear = {
                    PTOBalance: parseFloat(EmpPTODataCurrentYear[0].PTOBalance).toFixed(4),
                    PTOBalanceAfterDeduction: parseFloat(EmpPTODataCurrentYear[0].PTOBalanceAfterDeduction).toFixed(4),
                }
                let updatedOpeningPTOTranCurryear = {
                    PreviousPTOBalance: parseFloat(EmpOpeningPTOTran[0].PreviousPTOBalance).toFixed(4),
                    Hours: parseFloat(EmpOpeningPTOTran[0].Hours).toFixed(4),
                    CurrentPTOBalance: parseFloat(EmpOpeningPTOTran[0].CurrentPTOBalance).toFixed(4),
                }
                if (ActionStatus == StatusType.Submit) {
                    updatedPTODataCurryear.PTOBalance = (parseFloat(EmpPTODataCurrentYear[0].PTOBalance) - AppliedPTOHours).toFixed(4);
                    updatedPTODataCurryear.PTOBalanceAfterDeduction = (parseFloat(EmpPTODataCurrentYear[0].PTOBalanceAfterDeduction) - AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.PreviousPTOBalance = (parseFloat(EmpOpeningPTOTran[0].PreviousPTOBalance) - AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.Hours = (parseFloat(EmpOpeningPTOTran[0].Hours) - AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.CurrentPTOBalance = (parseFloat(EmpOpeningPTOTran[0].CurrentPTOBalance) - AppliedPTOHours).toFixed(4);
                }
                else if ([StatusType.Withdraw, StatusType.Revoke, StatusType.ManagerReject, StatusType.HRReject].includes(ActionStatus)) {
                    updatedPTODataCurryear.PTOBalance = (parseFloat(EmpPTODataCurrentYear[0].PTOBalance) + AppliedPTOHours).toFixed(4);
                    updatedPTODataCurryear.PTOBalanceAfterDeduction = (parseFloat(EmpPTODataCurrentYear[0].PTOBalanceAfterDeduction) + AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.PreviousPTOBalance = (parseFloat(EmpOpeningPTOTran[0].PreviousPTOBalance) + AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.Hours = (parseFloat(EmpOpeningPTOTran[0].Hours) + AppliedPTOHours).toFixed(4);
                    updatedOpeningPTOTranCurryear.PreviousPTOBalance = (parseFloat(EmpOpeningPTOTran[0].PreviousPTOBalance) + AppliedPTOHours).toFixed(4);
                }

                await sp.web.lists.getByTitle('EmployeePTO').items.getById(EmpPTODataCurrentYear[0].Id).update(updatedPTODataCurryear);
                await sp.web.lists.getByTitle('PTOTransactions').items.getById(EmpOpeningPTOTran[0].Id).update(updatedOpeningPTOTranCurryear);
            }
        }
        catch (e) {
            console.log('Failed to update EmployeePTO for current year');
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true })
        }
    }
    // Below is used to handle correct Date insertion irrespective of Timezone
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    //function related to custom Validation //TO table related
    private validateTimeOffControls(ActionID) {
        let TimeOffTableData = this.state.TimeOffTableData;
        let PTOData = this.state.PTOData;
        let isValid = { status: true, message: '' };
        let val;
        let Time;
        var isAllDaysEmpty;
        var weeks = TimeOffTableData.dayKeys;
        isValid = this.validateUniqueYear(this.state.FromDate, this.state.ToDate);
        if (!isValid.status) {
            return isValid;
        }
        for (let i in TimeOffTableData.TimeOffRowsData) {
            if (TimeOffTableData.TimeOffRowsData[i].TimeOffType.trim() == "") { // Time Off Type cannot be blank
                isValid.message = "Time Off Type cannot be blank.";
                isValid.status = false;
                document.getElementById(i + "_TimeOffType_TimeOffRow").getElementsByTagName('input')[0].focus();
                document.getElementById(i + "_TimeOffType_TimeOffRow").classList.add('searchMandatory');
                return isValid;
            }
            isAllDaysEmpty = true;
            for (let key in TimeOffTableData.TimeOffRowsData[i]) //validation if entire row Empty of TimeOff Hrs 
            {
                if (weeks.includes(key)) {
                    if (TimeOffTableData.TimeOffRowsData[i][key] != "") {
                        isAllDaysEmpty = false;
                        break;
                    }
                }
            }
            if (isAllDaysEmpty) {
                isValid.message = "Hours cannot be blank, Please provide valid hours.";
                isValid.status = false
                for (let day of weeks) {
                    let control = document.getElementById(i + "_" + day + "_TimeOffRow") as HTMLInputElement;
                    if (!control.disabled) {
                        document.getElementById(i + "_" + day + "_TimeOffRow").focus();
                        document.getElementById(i + "_" + day + "_TimeOffRow").classList.add('mandatory-FormContent-focus');
                        return isValid;
                    }
                }
            }
            else {
                for (let key in TimeOffTableData.TimeOffRowsData[i]) //validation for  invalid dots of TimeOff Hrs 
                {
                    if (weeks.includes(key)) {
                        if (TimeOffTableData.TimeOffRowsData[i][key] == ".") {
                            isValid.message = "Please enter valid hours.";
                            isValid.status = false;
                            let control = document.getElementById(i + "_" + key + "_TimeOffRow") as HTMLInputElement;
                            if (!control.disabled) {
                                document.getElementById(i + "_" + key + "_TimeOffRow").focus();
                                document.getElementById(i + "_" + key + "_TimeOffRow").classList.add('mandatory-FormContent-focus');
                                return isValid;
                            }
                        }
                    }
                }
            }
        }
        for (let key in TimeOffTableData.Total[0]) { // over 8 hours not allowed to submit
            val = TimeOffTableData.Total[0][key];
            let DayTime = 0;
            if (weeks.includes(key)) {
                DayTime = parseFloat(val);
                if (DayTime > 8) {
                    isValid.message = "Total Time Off hours in a day must not exceed 8 hours.";
                    isValid.status = false;
                    document.getElementById("Total" + key).focus();
                    document.getElementById("Total" + key).classList.add('mandatory-FormContent-focus');
                    return isValid;
                }
            }
        }

        val = TimeOffTableData.Total[0].Total;
        Time = parseFloat(val);  // 0 hours not allowed to submit timeoff
        if (Time == 0 && ActionID == 'btnSubmit') {
            isValid.message = "Total hours in a week cannot be 0.";
            isValid.status = false;
            document.getElementById("GrandTotal").focus();
            document.getElementById("GrandTotal").classList.add('mandatory-FormContent-focus');
            return isValid;
        }
        if (this.state.TimeOffTableData.PTOTotal > parseFloat(this.state.PTOData.PTOAvailableBalance)) // PTO hours cannot exceed PTO Balance
        {
            isValid.status = false;
            isValid.message = "'PTO Hours' cannot be greater than 'PTO Balance'";
            for (let i in TimeOffTableData.TimeOffRowsData) {

                if (TimeOffTableData.TimeOffRowsData[i].IsPTOEligible) {
                    document.getElementById(i + "_Total_TimeOffRow").focus();
                    document.getElementById(i + "_Total_TimeOffRow").classList.add('mandatory-FormContent-focus');
                    break;
                }
            }
            return isValid;
        }
        // Year End Time Off Submission validation
        let currYear = new Date().getFullYear();
        let isApplyingforDiffYearDateRange = TimeOffTableData.dayKeys.some(i => i.includes((currYear + 1).toString()));
        if (ActionID === 'btnSubmit' && this.state.isPTOEligible && isApplyingforDiffYearDateRange) {
            let currentYearHours = 0;
            let nextYearHours = 0;
            const PTO_Balance = parseFloat(this.state.PTOData.PTOAvailableBalance || "0");
            const PTOSubTotalObj = TimeOffTableData.PTOSubTotal[0];

            // Loop through each PTO row
            for (const dayKey in PTOSubTotalObj) {
                let hrs = parseFloat(PTOSubTotalObj[dayKey] || '0');
                if (dayKey.includes(currYear.toString())) currentYearHours += hrs;
                else if (dayKey.includes((currYear + 1).toString())) nextYearHours += hrs;
            }
            // Compute carry forward
            let carryForward = PTO_Balance - currentYearHours;
            if (carryForward > 80) {
                carryForward = 80;
            }

            // If applying PTO in next year greater than carryForward
            if (nextYearHours > carryForward) {

                isValid.status = false;
                isValid.message = `Only ${Number(Number(carryForward).toFixed(4))} hours can be carried forward to next year. Cannot submit ${Number(Number(nextYearHours).toFixed(4))} PTO hours.`;
                return isValid;
            }
        }
        if (ActionID == 'btnSubmit' && this.state.isPTOEligible && (parseFloat(this.state.PTOData.PTOAvailableBalance) - this.state.TimeOffTableData.PTOTotal) > 0 && this.state.TimeOffTableData.TOTotal > 0 && this.state.Comments.trim() == '' && TimeOffTableData.TimeOffRowsData.some(t => this.state.UPTOTypes.includes(t.TimeOffType))) // Comments are mandatory if PTOBalance is avialable, but employee applied for UPTO
        {
            isValid.status = false;
            isValid.message = `${Number((parseFloat(this.state.PTOData.PTOAvailableBalance) - this.state.TimeOffTableData.PTOTotal).toFixed(4))} PTO hours are available. Please provide comments for selecting 'Unpaid Time Off.'`;
            let elm = document.getElementById('txtComments');
            elm.focus();
            setTimeout(() => elm.classList.add('mandatory-FormContent-focus'), 300);
        }
        //if isValid true remove all 'mandatory-FormContent-focus' classes
        this.RemoveAll_mandatory_FormContent_focus(TimeOffTableData);
        return isValid;
    }
    private validateUniqueYear(FromDate, ToDate) {
        let isValid = { status: true, message: '' };
        if (new Date(FromDate).getFullYear() != new Date(ToDate).getFullYear()) {
            isValid.status = false;
            isValid.message = 'Please select From and To dates within the same year.';
        }
        return isValid;
    }

    private RemoveAll_mandatory_FormContent_focus = (TimeOffTableData) => {
        var weeks = TimeOffTableData.dayKeys;
        for (let i in TimeOffTableData.TimeOffRowsData) {
            for (let key in TimeOffTableData.TimeOffRowsData[i]) {
                if (weeks.includes(key)) {
                    document.getElementById(i + "_" + key + "_TimeOffRow") == null ? '' : document.getElementById(i + "_" + key + "_TimeOffRow").classList.remove('mandatory-FormContent-focus');
                }
            }
        }
        Object.keys(TimeOffTableData.Total[0]).forEach(key => {
            if (weeks.includes(key))
                document.getElementById("Total" + key).classList.remove('mandatory-FormContent-focus');
        })
        document.getElementById("GrandTotal").classList.remove('mandatory-FormContent-focus');
        document.getElementById("txtComments").classList.remove('mandatory-FormContent-focus');
    }
    // this function is used to validate duplicate record if the  employee is already associated withe selected Dates
    private async validateDuplicateRecord() {
        let isValid = { status: true, message: "" };
        let From = DateUtilities.getDateMMDDYYYY(addDays(new Date(this.state.FromDate), -1));
        let To = DateUtilities.getDateMMDDYYYY(addDays(new Date(this.state.ToDate), 1));
        let from = new Date(this.state.FromDate);
        let to = new Date(this.state.ToDate);
        let filterQuery = `Employee/Id eq '${this.state.EmployeeId}' and From le '${To}' and To ge '${From}' and Status ne '${StatusType.Withdraw}' and Status ne '${StatusType.Revoke}' and Status ne '${StatusType.ManagerReject}' and Status ne '${StatusType.HRReject}' and IsActive eq 1`;
        let selectQuery = "Employee/Title,Employee/ID,*";
        try {
            let duplicateRecord = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee').orderBy('Title').getAll()
            if ([0].includes((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))) //if selected daterange is only one day
            {
                if (this.checkDateRangeOverlap(duplicateRecord, from, to)) {
                    const fromDate = DateUtilities.getDateMMDDYYYY(from);
                    const toDate = DateUtilities.getDateMMDDYYYY(to);
                    let selDayAppliedHours = 0, isAllOneDay = true;
                    for (let record of duplicateRecord) {
                        const recordFromDate = DateUtilities.GetDateMMDDYYYYAsInList(record.From);
                        const recordToDate = DateUtilities.GetDateMMDDYYYYAsInList(record.To);
                        if (recordFromDate == recordToDate && recordFromDate == fromDate && recordToDate == toDate) {
                            selDayAppliedHours += parseFloat(record.TotalHours);
                        }
                        else {
                            isAllOneDay = false;
                            break;
                        }
                    }
                    if (isAllOneDay) {
                        if (selDayAppliedHours >= 8) {
                            isValid.status = false;
                            isValid.message = "You have already used 8 hours for the selected date. Please choose a different date.";
                        }
                        else if (parseFloat(this.state.TotalHours) > (8 - selDayAppliedHours)) {
                            isValid.status = false;
                            isValid.message = `You have already used ${selDayAppliedHours} hours for the selected date. Please enter up to ${8 - selDayAppliedHours} hours.`;
                            document.getElementById("GrandTotal").focus();
                            document.getElementById("GrandTotal").classList.add("mandatory-FormContent-focus");
                        }
                    }
                    else {
                        isValid.status = false;
                        isValid.message = "Dates overlap with existing Time Off. Please select different dates.";
                    }
                }
            }
            else if (this.checkDateRangeOverlap(duplicateRecord, from, to)) {
                isValid.status = false;
                isValid.message = "Dates overlap with existing Time Off. Please select different dates.";
            }
            return isValid;
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    private isOverlap(existingFromDate, existingToDate, newFromDate, newToDate) {
        return (existingFromDate <= newToDate && existingToDate >= newFromDate);
    }
    // Function to check if all dates in the new date range are present in any of the record date ranges
    private checkDateRangeOverlap(records, newFromDate, newToDate) {
        const fromDate = new Date(DateUtilities.getDateMMDDYYYY(newFromDate));
        const toDate = new Date(DateUtilities.getDateMMDDYYYY(newToDate));
        for (let record of records) {
            const recordFromDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(record.From));
            const recordToDate = new Date(DateUtilities.GetDateMMDDYYYYAsInList(record.To));
            if (this.isOverlap(new Date(recordFromDate), new Date(recordToDate), fromDate, toDate)) {
                return true; // There is an overlap
            }
        }
        return false; // No overlap found
    }
    private checkIsValidDateRange(FromDate, ToDate) {

        let isValid = { status: true, message: "" };

        let currentDate = new Date(FromDate);
        const endDate = new Date(ToDate);
        let WeekOffDayIndexes = [0, 6];
        let YearStart = new Date(`01/01/${new Date().getFullYear()}`);
        let YearEnd = new Date(`12/31/${new Date().getFullYear()}`);
        if (currentDate < YearStart || endDate > YearEnd) {
            isValid.status = false;
            isValid.message = "Time Off can be applied only for current year";
        }
        else if ([0, 1].includes((new Date(ToDate).getTime() - new Date(FromDate).getTime()) / (24 * 60 * 60 * 1000))) // Sat,Sun days are allowed but , if selected daterange is only one day or two days and both are sat and sun day ,then not allowed to submit
        {
            let isAplyingforWeekOffDays = true;
            while (new Date(currentDate) <= new Date(endDate)) {
                if (!WeekOffDayIndexes.includes(new Date(currentDate).getDay())) {
                    isAplyingforWeekOffDays = false;
                    break;
                }
                let nextDate = addDays(new Date(currentDate), 1);
                currentDate = nextDate;
            }
            if (isAplyingforWeekOffDays) {
                isValid.status = false;
                isValid.message = "Time Off cannot be applied for only Saturday or Sunday";
            }
        }
        return isValid;
    }
    private checkMandatoryComments(Comments) {
        if (Comments == "") {
            let element = document.getElementById('txtComments');
            element.focus();
            element.classList.add('mandatory-FormContent-focus');
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, "Comments cannot be blank.", 4000);
            return false;
        }
        return true;
    }

    // This function is used to close the confirmation popup
    private CloseConfirmationPopup = () => {
        this.setState({ loading: false, showConfirmPopup: false, ConfirmPopupMessage: '', Homeredirect: false });
    }
    private CloseInvalidEmployeePopup = () => {

        this.setState({ Homeredirect: true, message: '', ItemID: 0, showHideModal: false, errorMessage: '', modalTitle: '', modalText: '', loading: false });
    }
    // This function is used to navigate to Time Off Dashboard by clicking on  cancel button
    private handleCancel = async (e) => {
        this.setState({ message: '', showToaster: false, Homeredirect: true });
    }
    //Below are functions used to bind Dynamic HTML 
    private bindComments = () => {
        let body = [];
        if (this.state.CommentsHistory.length > 0) {
            var History = this.state.CommentsHistory;
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
    //TO table related
    private changeTime = (event) => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let value = event.target.value;
        let index = parseInt(event.target.id.split("_")[0]);
        let prop = event.target.id.split("_")[1];
        let rowType = event.target.id.split("_")[2];
        let TableColumns = Object.keys(this.WeekHeadings[0])
            .filter(k => !k.includes("shortDay") && !k.includes("Is"));
        if (TableColumns.includes(prop)) {
            value = value.match(/\d{0,5}(\.\d{0,4})?/)[0];
            if (parseFloat(value) > 8) {
                return false;
            }
        }
        //FOR ROW WISE CALCULATION
        let TotalRowMins = 0;
        TimeOffTableData.TimeOffRowsData[index][prop] = value.toString();
        Object.keys(TimeOffTableData.TimeOffRowsData[index]).forEach(key => {
            let val = TimeOffTableData.TimeOffRowsData[index][key].toString();
            [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
            if (!["TimeOffType", "IsPTOEligible", "Total"].includes(key)) {
                TotalRowMins = TotalRowMins + (parseFloat(val));
            }
        })
        TimeOffTableData.TimeOffRowsData[index]["Total"] = parseFloat(TotalRowMins.toFixed(4)).toString();
        //FOR COLUMN WISE CALCULATION
        let [WeeklyTotal, Total, PTOTotal, TOTotal] = [0, 0, 0, 0];
        let [WeeklyPTOSub, TotalPTOSub, WeeklyTOSub, TotalToSub] = [0, 0, 0, 0];
        //GRAND TOTAL COLUMN WISE
        // to iterate Time Off row hrs
        for (var item of TimeOffTableData.TimeOffRowsData) {
            //For weekly calculation
            let val = item[prop].toString();
            [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
            WeeklyTotal = WeeklyTotal + (parseFloat(val));
            //For total calculation
            let TotalVal = item.Total.toString();
            [undefined, null, "", "."].includes(TotalVal.trim()) ? TotalVal = "0" : TotalVal;
            Total = Total + (parseFloat(TotalVal));
            if (item.IsPTOEligible)//For PTO Total calculation
            {
                // for Total calculation : single value format
                PTOTotal = PTOTotal + (parseFloat(item['Total']));
                // for PTO Sub total calculation : json format
                WeeklyPTOSub = WeeklyPTOSub + (parseFloat(val));
                TotalPTOSub = TotalPTOSub + (parseFloat(TotalVal));

            }
            else //For To Total calculation
            {
                // for Total calculation : single value format
                TOTotal = TOTotal + (parseFloat(item['Total']));
                // for TO Sub total calculation : json format
                WeeklyTOSub = WeeklyTOSub + (parseFloat(val));
                TotalToSub = TotalToSub + (parseFloat(TotalVal));
            }

        }
        //PTO Sub Total
        TimeOffTableData.PTOSubTotal[0][prop] = parseFloat(WeeklyPTOSub.toFixed(4)).toString();
        TimeOffTableData.PTOSubTotal[0]["Total"] = parseFloat(TotalPTOSub.toFixed(4)).toString();
        //TO Sub Total
        TimeOffTableData.TOSubTotal[0][prop] = parseFloat(WeeklyTOSub.toFixed(4)).toString();
        TimeOffTableData.TOSubTotal[0]["Total"] = parseFloat(TotalToSub.toFixed(4)).toString();
        //Grand Total
        TimeOffTableData.Total[0][prop] = parseFloat(WeeklyTotal.toFixed(4)).toString();
        TimeOffTableData.Total[0]["Total"] = parseFloat(Total.toFixed(4)).toString();
        TimeOffTableData.PTOTotal = PTOTotal;
        TimeOffTableData.TOTotal = TOTotal;
        this.setState({ TimeOffTableData, TotalHours: parseFloat(Total.toFixed(4)).toString() });

    }
    private CreateTimeOffHrsRow = () => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let isValid = { status: true, message: '' };
        let TableColumns = Object.keys(this.WeekHeadings[0])
            .filter(k => !k.includes("shortDay") && !k.includes("Is"));
        for (let i in TimeOffTableData.TimeOffRowsData) {

            if (parseFloat(TimeOffTableData.TimeOffRowsData[i].Total) == 0) {

                isValid.message = "Total Time Off hours in a week cannot be 0 .";
                isValid.status = false;
                for (let key of TableColumns) {
                    let control = document.getElementById(i + "_" + key + "_TimeOffRow") as HTMLInputElement;
                    if (!control.disabled) {
                        document.getElementById(i + "_" + key + "_TimeOffRow").focus();
                        document.getElementById(i + "_" + key + "_TimeOffRow").classList.add('mandatory-FormContent-focus');
                        break;
                    }
                }
                break;
            }
        }
        if (isValid.status) {
            for (let i in TimeOffTableData.TimeOffRowsData) {
                document.getElementById(i + "_Total_TimeOffRow").classList.remove('mandatory-FormContent-focus');
            }
            let count = TimeOffTableData.currentTimeOffRowsCount + 1;
            let newObj: any = { TimeOffType: '', IsPTOEligible: false, Total: '0.00' };
            for (let col of TableColumns) {
                newObj[col] = '';
            }
            TimeOffTableData.TimeOffRowsData.push(newObj);
            TimeOffTableData.currentTimeOffRowsCount = count;
            let mappedTOTypes = this.mapUniqueTimeOffTypes(TimeOffTableData.TimeOffRowsData, this.state.TimeOffTypesObj);
            this.setState({ TimeOffTableData, UniqueTimeOffTypes: mappedTOTypes, errorMessage: "" });
        }
        else {
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
        }
    }
    private showConfirmDeleteRow = (event) => {
        this.setState({ showConfirmPopup: true, ConfirmPopupMessage: 'Are you sure you want to delete this row?' });
        let TypeofRow = event.currentTarget.id.split("_")[1];
        let DelRowIndex = event.currentTarget.id.split("_")[0];
        let TimeOffTableData = this.state.TimeOffTableData;
        TimeOffTableData.DelRowIndex = DelRowIndex;
        this.setState({ TimeOffTableData });
    }
    private RemoveCurrentRow = () => {
        let rowCount = parseInt(this.state.TimeOffTableData.DelRowIndex);
        let count;
        let TimeOffTableData = { ...this.state.TimeOffTableData };
        let tempItemsData = this.state.TimeOffTableData.TimeOffRowsData;
        TimeOffTableData.TimeOffRowsData = [];
        count = this.state.TimeOffTableData.currentTimeOffRowsCount - 1;
        for (var i = 0; i < tempItemsData.length; i++) {
            if (i != rowCount)
                TimeOffTableData.TimeOffRowsData.push(tempItemsData[i]);
        }
        TimeOffTableData = this.calculateTimeWhenRemoveRow(TimeOffTableData, TimeOffTableData.TimeOffRowsData);
        TimeOffTableData.currentTimeOffRowsCount = count;
        let mappedTOTypes = this.mapUniqueTimeOffTypes(TimeOffTableData.TimeOffRowsData, this.state.TimeOffTypesObj);
        this.setState({ TimeOffTableData, UniqueTimeOffTypes: mappedTOTypes, showConfirmPopup: false, TotalHours: TimeOffTableData.Total[0]["Total"] });

    }
    private calculateTimeWhenRemoveRow = (TimeOffTableData, DataAfterRemovedObject) => {
        let TableColumns = Object.keys(this.WeekHeadings[0])
            .filter(k => !k.includes("shortDay") && !k.includes("Is"));
        TableColumns.push('Total')
        //FOR COLUMN WISE CALCULATION
        for (var prop of TableColumns) {
            let [WeeklyTotal, PTOTotal, TOTotal] = [0, 0, 0];
            let [WeeklyPTOSub, WeeklyTOSub] = [0, 0];

            //GRAND TOTAL COLUMN WISE
            // to iterate Time Off row hrs
            for (var item of DataAfterRemovedObject) {
                //For weekly calculation
                let val = item[prop].toString();;
                [undefined, null, "", "."].includes(val.trim()) ? val = "0" : val;
                WeeklyTotal = WeeklyTotal + (parseFloat(val));
                if (item.IsPTOEligible)//For PTO Total calculation
                {
                    // for Total calculation : single value format
                    PTOTotal = PTOTotal + (parseFloat(item['Total']));
                    // for PTO Sub total calculation : json format
                    WeeklyPTOSub = WeeklyPTOSub + (parseFloat(val));

                }
                else //For To Total calculation
                {
                    // for Total calculation : single value format
                    TOTotal = TOTotal + (parseFloat(item['Total']));
                    // for TO Sub total calculation : json format
                    WeeklyTOSub = WeeklyTOSub + (parseFloat(val));
                }

            }
            //PTO Sub Total
            TimeOffTableData.PTOSubTotal[0][prop] = parseFloat(WeeklyPTOSub.toFixed(4)).toString();
            //TO Sub Total
            TimeOffTableData.TOSubTotal[0][prop] = parseFloat(WeeklyTOSub.toFixed(4)).toString();
            //Grand Total
            TimeOffTableData.Total[0][prop] = parseFloat(WeeklyTotal.toFixed(4)).toString();
            TimeOffTableData.PTOTotal = PTOTotal;
            TimeOffTableData.TOTotal = TOTotal;
        }
        return TimeOffTableData;
    }
    private dynamicFieldsRow = (rowType) => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let NoOfRows = TimeOffTableData.currentTimeOffRowsCount;
        let rowId = 'TimeOff';
        let Obj = TimeOffTableData.TimeOffRowsData;
        let section = [];
        if (this.state.UniqueTimeOffTypes.length == NoOfRows) {
            for (var i = 0; i < NoOfRows; i++) {
                section.push(<tr id={rowId + (i + 1)}>
                    <td className='' title={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType}>
                        <SearchableDropdown isLabelRequired={false} label="Time Off Type" Title={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType} name={i + "_TimeOffType_" + rowType} id={i + "_TimeOffType_" + rowType} placeholderText="Time Off Type" className="ddlTimeOffType form-control text-left" selectedValue={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.UniqueTimeOffTypes[i]} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} disabled={this.state.isDisabled && !this.state.isHRView} isRequired={true} noOptionsMessage="No Time Off Type" menuIsOpen={false}></SearchableDropdown>
                    </td>
                    {Object.keys(this.WeekNames[0])
                        .map((dayKey, idx) => {
                            const dateVal = this.WeekNames[0][dayKey]; // Mon/Tue etc.
                            return (
                                <td key={idx}>
                                    <input
                                        className={"form-control time " + dateVal}
                                        value={Obj[i][dateVal]}
                                        id={`${i}_${dateVal}_${rowType}`}
                                        onChange={this.changeTime}
                                        disabled={(this.state.isDisabled || this.WeekHeadings[0][`Is${dateVal}Joined`]) && !this.state.isHRView}
                                    />
                                </td>
                            );
                        })}
                    <td className=''>
                        <input className="form-control time WeekTotal" value={Obj[i].Total} id={i + "_Total_" + rowType} onChange={this.changeTime} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                    </td>
                    <td className=''>

                        {((this.state.isDisabled || this.state.FromDate == null) && !this.state.isHRView) ? '' :
                            NoOfRows == 1 ? <button type="button" className='span-fa-plus' onClick={this.CreateTimeOffHrsRow} id='addnewRow'><span title='Add new Time Off hours row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></span></button> :
                                i == NoOfRows - 1 ?
                                    <>
                                        <button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={i + "_" + rowType}><span title='Delete row' ><FontAwesomeIcon icon={faClose} id={i + "_" + rowType}></FontAwesomeIcon></span></button>
                                        <button type="button" className='span-fa-plus' onClick={this.CreateTimeOffHrsRow} id='addnewRow'><span title='Add new Time Off hours row' ><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
                                        </span></button>
                                    </> :
                                    <button type="button" className='span-fa-close' onClick={this.showConfirmDeleteRow} id={i + "_" + rowType}><span title='Delete row'  ><FontAwesomeIcon icon={faClose} id={i + "_" + rowType}></FontAwesomeIcon></span></button>}
                    </td>
                </tr>);
            }
        }
        return section;
    }
    private BindTimeOffTable = () => {
        let Table = [];
        Table.push(<div className="row my-2 mx-4 d-grid">
            <div className="border-box-shadow light-box overflow-auto">
                <table className="table table-bordered m-0 timetable table-td-p-0 TORTable">
                    <thead style={{ borderBottom: "4px solid #444444" }}>
                        <tr>
                            <th className=""><div className='th-description'>Time Off Type <span className='mandatoryhastrick'>*</span></div></th>
                            {Object.keys(this.WeekNames[0])
                                .map((dayKey, idx) => {
                                    const dayDate = this.WeekNames[0][dayKey];
                                    const shortDay = this.WeekHeadings[0][`${dayDate}shortDay`];
                                    let isValid = !isNaN(new Date(dayDate).getTime());
                                    return (
                                        <th key={idx}>
                                            <div className={"weekDay "}>
                                                {isValid && shortDay}
                                                {isValid && <span className={"day "}>{(new Date(dayDate).getDate().toString().length == 1 ? "0" + new Date(dayDate).getDate() : new Date(dayDate).getDate()) + ' ' + this.state.Months[new Date(dayDate).getMonth()]}</span>}
                                            </div>
                                        </th>
                                    );
                                })}
                            <th className="bc-e1f2ff "><div className='th-total'>Total</div></th>
                            <th className=""><div className="px-3 th-AddDel-Icon"></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.dynamicFieldsRow("TimeOffRow")}

                        <tr className="" id="GrandTotalRow">
                            <td className="fw-bold text-start ">
                                <div className="p-2 fw-bold">
                                    <i className="fas fa-business-time color-gray"></i> Grand Total
                                </div>
                            </td>
                            {Object.keys(this.WeekNames[0])
                                .map((dayKey, idx) => {
                                    const dayDate = this.WeekNames[0][dayKey];
                                    return (
                                        <td>
                                            <input className="form-control time DayTotal" id={"Total" + dayDate} value={this.state.TimeOffTableData.Total[0][dayDate]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                                        </td>
                                    );
                                })}
                            <td className=''>
                                <input className="form-control time  GrandTotal" id="GrandTotal" value={this.state.TimeOffTableData.Total[0].Total} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                            </td>
                            <td className=''>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div></div>);
        return Table;
    }
    private getPTOtransactionsDayWise = () => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let TableColumns = Object.keys(this.WeekHeadings[0])
            .filter(k => !k.includes("shortDay") && !k.includes("Is"));
        let PTOTransactionsDayWise = [];
        //to store PTO transactions daywise
        for (let key in TimeOffTableData.PTOSubTotal[0]) {
            if (TableColumns.includes(key)) {
                let DateKey = this.WeekHeadings[0][key];
                let Hours = TimeOffTableData.PTOSubTotal[0][key];
                if (parseFloat(Hours) > 0) {
                    // Push new object
                    PTOTransactionsDayWise.push({ [DateKey]: Hours });
                }
            }
        }
        //this.setState({ PTOTransactionsDayWise: PTOTransactionsDayWise });
        return PTOTransactionsDayWise;
    }
    private generateDynamicWeekHeadings = (fromDate: Date, toDate: Date) => {
        const weekHeadings: any = {};
        const weekNames: any = {};
        let currentDate = new Date(fromDate);
        let dayIndex = 1;
        let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(this.state.DateOfJoining));
        this.WeekHeadings = [], this.WeekNames = [];
        if (![fromDate, toDate].includes(null)) {
            while (currentDate <= toDate) {
                if (![0, 6].includes(currentDate.getDay())) {
                    const dayKey = `day${dayIndex}`;
                    const dateKey = DateUtilities.getDateMMDDYYYY(currentDate); // MM/dd/yyyy
                    const shortDay = DateUtilities.getDateDay(currentDate); // e.g., Mon, Tue, etc.

                    weekHeadings[`${dateKey}shortDay`] = shortDay;
                    weekHeadings[`${dateKey}`] = dateKey;
                    weekHeadings[`Is${dateKey}Joined`] = currentDate < DateOfjoining;

                    weekNames[dayKey] = dateKey;
                }
                currentDate.setDate(currentDate.getDate() + 1);
                dayIndex++;
            }
            this.WeekHeadings = [weekHeadings];
            this.WeekNames = [weekNames];
        }
        else {
            this.WeekHeadings.push({
                "Mon": '',
                "MonDate": '',
                "IsMonJoined": true,
                "Tue": '',
                "TueDate": '',
                "IsTueJoined": true,
                "Wed": '',
                "WedDate": '',
                "IsWedJoined": true,
                "Thu": '',
                "ThuDate": '',
                "IsThuJoined": true,
                "Fri": '',
                "FriDate": '',
                "IsFriJoined": true,
            })
            this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri" });
        }
    };

    // To avoid duplicated time Off Type selection
    private mapUniqueTimeOffTypes = (data: any[], timeOffTypes: any[]) => {
        let UniqueTimeOffTypesArr = [];
        data.map((item) => {
            let currRow = timeOffTypes.find(t => ![null, ''].includes(item.TimeOffType) && t.Title.toLowerCase() == item.TimeOffType.toLowerCase());
            let TOTArr = [];
            if (currRow != undefined) {
                TOTArr.push({ Title: currRow.Title, IsEligibleforPTO: currRow.IsEligibleforPTO });
            }
            let filteredTimeOffTypes = timeOffTypes.filter(t => !(data.some(Sel => Sel.TimeOffType == t.Title)));
            filteredTimeOffTypes.map((t) => (
                TOTArr.push({ Title: t.Title, IsEligibleforPTO: t.IsEligibleforPTO })
            ));
            TOTArr.sort((a, b) => a.Title.localeCompare(b.Title));
            UniqueTimeOffTypesArr.push(TOTArr);
        });
        return UniqueTimeOffTypesArr;
    };
    //Below functions are used to store the PTO transactions day wise :START
    private calculatePTOTransactions(PTOBalance, PTOTransactions) {

        const totalBalance = parseFloat(PTOBalance); // Calculate total balance
        let remainingBalance = parseFloat(totalBalance.toFixed(4)); // Start with the total balance
        const adjustedTransactions = []; // This will hold the final transactions
        var weeks = this.state.TimeOffTableData.dayKeys;
        for (const transaction of PTOTransactions) {
            const date = Object.keys(transaction)[0]; // Get the date key
            const hoursRequested = parseFloat(transaction[date]); // Get the requested hours
            // Determine how many hours can be applied
            let hoursToApply = Math.min(hoursRequested, remainingBalance);
            hoursToApply = parseFloat(hoursToApply.toFixed(4))
            // If there are hours to apply, add to the adjusted transactions
            let TimeOffTypes = []; // to insert timeofftypes which are eligible for PTO in the PTO transactions
            if (hoursToApply > 0) {
                this.state.TimeOffTableData.TimeOffRowsData.forEach(TORow => {
                    let weekday = new Date(date).getDay();
                    if (TORow.IsPTOEligible && !TimeOffTypes.includes(TORow.TimeOffType) && TORow[date] != '' && parseFloat(TORow[date]) > 0) {
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
    // Functions used to store the PTO transactions day wise :END

    public render() {
        if (!this.state.isRecordAcessable) {
            let url = this.siteURL + "/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        if (this.state.Homeredirect) {
            let message = this.state.message;
            let url
            if (this.props.match.params.redirect != undefined)
                url = `/TimeOffDashboard`;
            else
                url = `/TimeOffDashboard/${message}`;

            return (<Navigate to={url} />);
        }
        else {
            return (
                <React.Fragment>
                    <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.CloseInvalidEmployeePopup} isSuccess={this.state.isSuccess}></ModalPopUp>

                    {this.state.ConfirmPopupMessage == "" ? '' : this.state.ConfirmPopupMessage == "Are you sure you want to delete this row?" ? <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmPopup} isSuccess={false} onConfirm={this.RemoveCurrentRow} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm> : <ModalPopUpConfirm message={this.state.ConfirmPopupMessage} title={''} isVisible={this.state.showConfirmPopup} isSuccess={false} onConfirm={this.generateEmailData} onCancel={this.CloseConfirmationPopup}></ModalPopUpConfirm>}

                    <div id="content" className="content p-2 pt-2">
                        <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Time-Off Request Form
                                    <div className='mandatory-note'>
                                        <span className='mandatoryhastrick'>*</span> indicates a required field
                                    </div>
                                </div>
                                <div className="after-title"></div>
                                <div className="">
                                    <div className="row my-4 px-4">
                                        <div className={"col-md-3"}>
                                            <div className="light-text-readonly">
                                                <label>Employee Name</label>
                                                <input className="txtEmployeeName form-control" required={true} name="EmployeeName" title="Employee Name" value={this.state.EmployeeName} disabled />
                                            </div>
                                        </div>
                                        {this.state.isPTOEligible &&
                                            <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>PTO Balance</label>
                                                    <input className="txtPTOBalance form-control" required={true} name="PTOAvailableBalance" title="PTO Available Balance" value={this.state.PTOData.PTOAvailableBalance} disabled />
                                                </div>
                                            </div>}
                                        <div className={"col-md-6"}>
                                            <div className="light-text-readonly">
                                                <label>Synergy Manager(s)</label>
                                                <div className={'div-multi-manager'} title="Synergy Manager(s)">
                                                    {this.state.SynergyManagerNames.map((name) => <div>{name}</div>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row my-4 px-4">
                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">From Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divFromDate">
                                                    <DatePicker onDatechange={this.handleFromorToDate} selectedDate={this.state.FromDate} isDisabled={this.state.isDisabled || this.state.ItemID > 0} startDate={new Date(addDays(new Date(), -31))} endDate={new Date(`12/31/${new Date().getFullYear() + 1}`)} id="txtFromDate" title="From Date" disabledDayIndexes={[0, 6]} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">To Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divToDate">
                                                    <DatePicker onDatechange={this.handleFromorToDate} selectedDate={this.state.ToDate} isDisabled={this.state.isDisabled || this.state.ItemID > 0} startDate={new Date(addDays(new Date(), -31))} endDate={new Date(`12/31/${new Date().getFullYear() + 1}`)} id="txtToData" title="To Date" disabledDayIndexes={[0, 6]} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {this.BindTimeOffTable()}
                                    <div className="light-box mx-4 my-4 text-center divInfo"><p className="TextInfo">All requests are to be turned into Manager for approval at least 5 working days prior to start of requested Time Off.<br></br>Requests for PTOS need to be turned into approving manager upon your return to work<br></br>*PTO Cash Out is only available upon separation from Synergy Computer Solutions, Inc.</p></div>

                                    <div className='row px-4'>
                                        <div className="col-md-12">
                                            <div className="light-text height-auto">
                                                <label className="floatingTextarea2 top-11">Comments</label>
                                                <textarea className="position-static form-control requiredinput mt-3" ref={this.Comments} onChange={this.handleChangeEvents} value={this.state.Comments} maxLength={500} id="txtComments" name="Comments" disabled={false} title='Comments'></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mx-1" id="">
                                        <div className="col-sm-12 text-center my-2" id="">
                                            {this.state.ButtonsVisibility.Approve && <button type="button" id="btnApprove" onClick={this.handleActions} className="SubmitButtons btn" title='Approve'>Approve</button>}
                                            {this.state.ButtonsVisibility.Update && <button type="button" id="btnUpdate" onClick={this.handleActions} className="SubmitButtons btn" title='Update'>Update</button>}
                                            {this.state.ButtonsVisibility.Reject && <button type="button" id="btnReject" onClick={this.handleActions} className="RejectButtons btn" title='Reject'>Reject</button>}
                                            {this.state.ButtonsVisibility.Revoke && <button type="button" id="btnRevoke" onClick={this.handleActions} className="txt-white CancelButtons bc-burgundy btn" title='Revoke'>Revoke</button>}
                                            {this.state.ButtonsVisibility.Withdraw && <button type="button" id="btnWithdraw" onClick={this.handleActions} className="SaveButtons btn" title='Withdraw'>Withdraw</button>}
                                            {this.state.ButtonsVisibility.Submit && <button type="button" className="SubmitButtons btn" id="btnSubmit" onClick={this.handleActions} title='Submit'>Submit</button>}
                                            <button type="button" title="Cancel" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                        </div>
                                    </div>

                                    {this.state.CommentsHistory.length > 0 ? <><div className="light-box mx-4 p-2 m-2">
                                        <h4>History</h4>
                                        <div className='divActionHistory'>
                                            <table className="table table-bordered m-0 timetable">
                                                <thead className='ActionHistoryHead'>
                                                    <tr>
                                                        {/* <th className="">Action By</th> */}
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
                    </div>
                    {this.state.loading && <Loader />}
                </React.Fragment >
            );
        }
    }
}
export default TimeOffRequestForm;