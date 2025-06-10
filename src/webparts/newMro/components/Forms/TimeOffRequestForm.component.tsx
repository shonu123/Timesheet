import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
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
import { highlightCurrentNav, highlightCurrentNav2 } from '../../Utilities/HighlightCurrentComponent';
import DatePicker from "../Shared/DatePickerField";
import CustomDatePicker from "../Shared/DatePicker";
import { Navigate } from 'react-router-dom';
import InputCheckBox from '../Shared/InputCheckBox';
import { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
import { ToasterTypes } from '../../Constants/Constants';
import InputText from '../Shared/InputText';
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
    private sitecollectionURL: string;
    private ItemID = "";
    private client;
    //private TimeOffType;
    private From;
    private To;
    private EmployeeType;
    private PTOType;
    private TotalHours;
    private Comments; WeekHeadings = []; WeekNames = [];
    constructor(props: TimeOffRequestFormProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.client = React.createRef();
        //this.TimeOffType = React.createRef();
        this.From = React.createRef();
        this.To = React.createRef();
        this.EmployeeType = React.createRef();
        this.PTOType = React.createRef();
        this.TotalHours = React.createRef();
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
        this.WeekNames.push({ "day1": "Mon", "day2": "Tue", "day3": "Wed", "day4": "Thu", "day5": "Fri", "dayCode": "Monday" });

    }

    public state = {
        ItemID: 0,
        EmployeeId: this.props.spContext.userId,
        //SelectedTimeOffTypes:[],
        //TimeOffType:'',
        IsSelectedTOEligibleforPTO: false,
        // FromDate: new Date(DateUtilities.getCurrentWeekStartDate('Monday')),
        // ToDate: new Date(addDays(DateUtilities.getCurrentWeekStartDate('Monday'), 6)),
        ClientName:'',  //if Employee exists in approval matrix consider first clientname, otherwise consider default as Synergy-HQ
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
        isPTOEligible:false,
        HolidayDates: [],
        EmployeeHolidayType: '',


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
        TimeOffTableData: {
            TimeOffRowsData: [{ TimeOffType: '', IsPTOEligible: false, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Total: '0.00' }],
            PTOSubTotal: [{ Type: "Paid Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
            TOSubTotal: [{ Type: "Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
            Total: [{ Type: "Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
            currentTimeOffRowsCount: 1,
            PTOTotal: 0,
            TOTotal: 0,
            DelRowIndex: ''
        },
        PTOTransactionsDayWise:[],
        PTOTransactionListData:[],
        Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        //HR controls
        // EnteredIntoIndividualPTOTracker:false,
        // EnteredIntoPayRollSystem:false,
        // EnteredIntoTimesheetTracker:false,
        // PTOHoursPaid:'',
        // PTOHoursTaken:'',
        // PTOBalance:'',

        //TimeOffTypeKeys: [],
        //TimeOffTypes: {},
        AllTimeOffTypesObj:[],
        TimeOffTypesObj: [],
        showHRSection: false,
        //action confirm popup
        showConfirmPopup: false,
        ConfirmPopupMessage: '',
        //invalid employee popup
        modalTitle: '',
        modalText: '',
        isSuccess: true,
        showHideModal: false,

        //postObject:{},
        //ActionStatus:'',
        ActionID: '',

        loading: false,
        userGroups: [],
        errorMessage: '',
        Homeredirect: false,
        isRecordAcessable: true,
        message: "Success",
        showToaster: false,
        isDisabled: false,
        ButtonsVisibility: {
            Submit: true,
            Withdraw: false,
            Approve: false,
            Reject: false,
            Revoke: false
        },
    }


    public componentDidMount() {
        //highlightCurrentNav2("liTimeOffDashboard");
        highlightCurrentNav("TimeOffRequestForm");
        // document.getElementById('TimeOffType').getElementsByTagName('input')[0].focus();
        this.setState({ loading: true });
        this.getOnLoadData();
    }

    private async getOnLoadData() {
        let userID = this.props.spContext.userId;
        let EmpfilterQuery = "Employee/Id eq '" + userID + "' and  IsActive eq '1'";
        let EmpselectQuery = "Employee/Title,Employee/ID,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        let Year = new Date().getFullYear() + "";
        try {
            let [groups, Employee, TimeOffTypesData,ClientNames, Holidays] = await Promise.all([
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('Employees').items.filter(EmpfilterQuery).expand("Employee,SynergyManager").select(EmpselectQuery).getAll(),
                sp.web.lists.getByTitle('TimeOffTypes').items.filter('').select("*").getAll(),
                sp.web.lists.getByTitle('EmployeeMaster').items.filter(`Employee/Id eq ${userID} and IsActive eq 1`).select("ClientName,Employee/Title,Employee/Id,Employee/EMail,*").expand("Employee").orderBy("ClientName", true).getAll(),
                sp.web.lists.getByTitle('HolidaysList').items.top(2000).filter("Year eq '" + Year + "'").select('*').orderBy('ClientName').getAll(),
            ])
            //To get dynamic time Off types
            //let TimeOffTypeKeys=[],TimeOffTypes={};
            let TimeOffTypesObj = [];

            TimeOffTypesData.sort((a, b) => a.Title.localeCompare(b.Title));
            TimeOffTypesData.forEach(item => {
                //TimeOffTypeKeys.push(item.Title.replaceAll(" ",""));
                //TimeOffTypes[item.Title.replaceAll(" ","")]={label:item.Title,val:false,IsEligibleforPTO:item.IsEligibleforPTO};
                TimeOffTypesObj.push({ Title: item.Title, IsEligibleforPTO: [null, undefined].includes(item.IsEligibleforPTO) ? false : item.IsEligibleforPTO, Color: item.Color });
            })
            // To get latest EmpMatrix data
            let EmpMatrixObj=this.getEmpMatrixData(Employee);
            let isPTOEligible=EmpMatrixObj.isPTOEligible;
            this.setState({ SynergyManagerId: EmpMatrixObj.SynergyManagerIds, SynergyManagerNames: EmpMatrixObj.SynergyManagerNames, SynergyManagerEmails: EmpMatrixObj.SynergyManagerEmails, DateOfJoining: EmpMatrixObj.DOJ,isPTOEligible:isPTOEligible,ClientName:ClientNames.length?ClientNames[0].ClientName:'Synergy-HQ', showToaster: true });

            let EmployeeHolidayDates = [];
            // let EmployeeHolidayDates = Holidays.filter(day => {
            //     if (day.ClientName == Employee[0].HolidayType) {
            //         return true;
            //     }
            // }).map(day => new Date(DateUtilities.GetDateMMDDYYYYAsInList(day.HolidayDate)));
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            if (this.props.match.params.id != undefined) {
                let ItemID = this.props.match.params.id;
                await this.getItemDataByID(ItemID, userGroups, EmployeeHolidayDates, TimeOffTypesData);
                //TO table related
            let WeekStartDate = new Date(DateUtilities.getDateMMDDYYYY(this.state.FromDate));
            let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(this.state.DateOfJoining));
            this.WeekHeadings = [];
            this.WeekHeadings.push({
                "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsMonJoined": WeekStartDate < DateOfjoining,
                "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsTueJoined": WeekStartDate < DateOfjoining,
                "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsWedJoined": WeekStartDate < DateOfjoining,
                "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsThuJoined": WeekStartDate < DateOfjoining,
                "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsFriJoined": WeekStartDate < DateOfjoining,
            })
            }
            // else {
            //     this.setState({ EmployeeData: Employee, HolidayDates: EmployeeHolidayDates, loading: false });
            // }
            //To get latest PTO credentials           
            let EmpPTO = await this.getLatestPTOData(this.state.EmployeeId, new Date()); //To get latest PTO Record
            let EmpPTOData=this.getEmpPTOData(EmpPTO,TimeOffTypesData,isPTOEligible,this.state.Status); // To extract the PTOData,TimeOffTypesObj from latest PTO record
            let  PTOData=EmpPTOData['PTOData'];
                 TimeOffTypesObj = EmpPTOData['TimeOffTypesObj'];
           
            
            this.setState({ EmployeeData: Employee,AllTimeOffTypesObj:TimeOffTypesData, PTOData: PTOData, TimeOffTypesObj: TimeOffTypesObj,loading: false});
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    // this function is used to get data from the timeoff record of Edit record
    private async getItemDataByID(ID, userGroups, Holidays, TimeOffTypesObj) {
        let filterQuery = "ID eq '" + ID + "'";
        let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
        try {
            let [data,PTOTransactionListData] = await Promise.all([sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').getAll(),
            sp.web.lists.getByTitle('PTOTransactions').items.filter(`TimeOffID eq '${ID}' and IsActive eq '1'`).select('*').getAll()
            ]);
            if (data.length < 1) {
                this.setState({ message: 'Invalid', Homeredirect: true });
                return false;
            }
            this.bindItemData(data, userGroups,PTOTransactionListData);
        }
        catch (error) {
            console.log(error);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        }
    }
    private async getItemDataByFromDate(FromDate) {
        if (![null, "", undefined].includes(FromDate)) {
            let prevDate = addDays(new Date(FromDate), -1);
            let nextDate = addDays(new Date(FromDate), 1);
            let prev = DateUtilities.getDateMMDDYYYY(prevDate);
            let next = DateUtilities.getDateMMDDYYYY(nextDate);
            let filterQuery = `From gt '${prev}' and From lt '${next}' and Employee/ID eq '${this.state.EmployeeId}'`;
            let selectQuery = "Employee/ID,Employee/Title,Employee/EMail,SynergyManager/ID,SynergyManager/Title,SynergyManager/EMail,*";
            try {
                let data = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee,SynergyManager').getAll();
                if (data.length > 0) {
                  let  PTOTransactionListData=await sp.web.lists.getByTitle('PTOTransactions').items.filter(`TimeOffID eq '${data[0].Id}' and IsActive eq '1'`).select('*').getAll()
                   await this.bindItemData(data, this.state.userGroups,PTOTransactionListData);
                  //To get latest PTO credentials           
                  let EmpPTO = await this.getLatestPTOData(this.state.EmployeeId, new Date()); //To get latest PTO Record
                  let EmpPTOData=this.getEmpPTOData(EmpPTO,this.state.AllTimeOffTypesObj,this.state.isPTOEligible,this.state.Status); // To extract the PTOData,TimeOffTypesObj from latest PTO record
                  let  PTOData=EmpPTOData['PTOData'];
                  let  TimeOffTypesObj = EmpPTOData['TimeOffTypesObj'];
                  this.setState({PTOData:PTOData,TimeOffTypesObj:TimeOffTypesObj,loading: false});
                }
                else{
                    this.ClearTimeOffControls(this.state.FromDate,this.state.ToDate);
                }
            }
            catch (error) {
                console.log(error);
                this.setState({ message: 'Error', loading: false, Homeredirect: true });
            }
        }
    }
    private getEmpPTOData=(EmpPTO,TimeOffTypesData,isPTOEligible,Status)=>
    {
        let PTOAvailableBalance = '0';
        let TimeOffTypesObj = [];
       let PTOData = this.state.PTOData;
        if ([StatusType.ManagerReject.toString(), StatusType.HRReject, StatusType.Revoke,StatusType.Withdraw, ''].includes(Status)) {
            if (EmpPTO.length) {
                PTOAvailableBalance = [null, undefined, ''].includes(EmpPTO[0].PTOBalanceAfterDeduction) ? '0' : parseFloat(EmpPTO[0].PTOBalanceAfterDeduction).toFixed(4);
            }
            else {
                // if current login user not configured as active employee in employee matrix, show popup
                this.setState({ modalTitle: 'Invalid Employee configuration', modalText: 'Employee not configured in Employee Matrix,Please contact Administrator', isSuccess: false, showHideModal: true, loading: false });
                return false;
            }
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
                PTOBalanceAfterDeduction: [null, undefined, ''].includes(EmpPTO[0].PTOBalanceAfterDeduction) ? '0' : parseFloat(EmpPTO[0].PTOBalanceAfterDeduction).toFixed(4),
                EmpPTOID: EmpPTO[0].Id,
                PTOAvailableBalance: PTOAvailableBalance,
            };
        }

        return {PTOData:PTOData,TimeOffTypesObj:TimeOffTypesObj};
    }
    private getEmpMatrixData=(Employee)=>
    {
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

        return {SynergyManagerIds:SynergyManagerIds,SynergyManagerEmails:SynergyManagerEmails,SynergyManagerNames:SynergyManagerNames,DOJ:DOJ,isPTOEligible:isPTOEligible};
    }
    private ClearTimeOffControls = async (FromDate,ToDate) => {
        let EmpMatrixObj= await this.getEmpMatrixData(this.state.EmployeeData);
        let isPTOEligible=EmpMatrixObj.isPTOEligible;
         //To get latest PTO credentials 
        let EmpPTO = await this.getLatestPTOData(this.state.EmployeeId, new Date());//To get latest PTO Record
        let EmpPTOData=await this.getEmpPTOData(EmpPTO,this.state.AllTimeOffTypesObj,isPTOEligible,''); // To extract the PTOData,TimeOffTypesObj from latest PTO record
        let  PTOData=EmpPTOData['PTOData'];
        let  TimeOffTypesObj = EmpPTOData['TimeOffTypesObj'];

          let initialState={
          ItemID: 0,
          EmployeeId: this.props.spContext.userId,
          FromDate:FromDate,
          ToDate:ToDate,
          TotalHours: '',
          Comments: '',
          CommentsHistory: [],
          Status: '',
          PendingWith: "",
          IsSubmitted: false,
          EmployeeName: this.props.spContext.userDisplayName,
          EmployeeEmail: this.props.spContext.userEmail,
          SynergyManagerId: EmpMatrixObj.SynergyManagerIds,
          SynergyManagerNames:EmpMatrixObj.SynergyManagerNames,
          SynergyManagerEmails:EmpMatrixObj.SynergyManagerEmails,
          DateOfJoining:EmpMatrixObj.DOJ,
          PTOData: PTOData,
          PreviousPTOBalance: '0',
          CurrentPTOBalance: '0',
          //TO table related
          TimeOffTableData: {
              TimeOffRowsData: [{ TimeOffType: '', IsPTOEligible: false, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Total: '0.00' }],
              PTOSubTotal: [{ Type: "Paid Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
              TOSubTotal: [{ Type: "Time Off", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
              Total: [{ Type: "Total", Mon: '0.00', Tue: '0.00', Wed: '0.00', Thu: '0.00', Fri: '0.00', Total: '0.00' }],
              currentTimeOffRowsCount: 1,
              PTOTotal: 0,
              TOTotal: 0,
              DelRowIndex: ''
          },
          TimeOffTypesObj:TimeOffTypesObj,
          ButtonsVisibility: {
              Submit: true,
              Withdraw: false,
              Approve: false,
              Reject: false,
              Revoke: false
          },
          isDisabled:false,
          loading:false,
          PTOTransactionsDayWise:[],
          PTOTransactionListData:[],
        }
        this.setState(initialState);
    }
    // this function is used to bind item data in 2 cases: 1.onload with ID url parameter, 2.on change of  'From' week start date
    private bindItemData(data, userGroups,PTOTransactionListData) {
        let SynergyManagerIds = { results: [] };
        let SynergyManagerEmails = [], SynergyManagerNames = [];
        if (![null, undefined, ''].includes(data[0].SynergyManager) && data[0].SynergyManager.length > 0) {
            for (const user of data[0].SynergyManager) {
                SynergyManagerIds.results.push(user.ID);
                SynergyManagerEmails.push(user.EMail);
                SynergyManagerNames.push(user.Title);
            }
        }
        let EmployeeEmail = data[0].Employee.EMail, EmployeeId = data[0].Employee.ID;
        this.userAccessableRecord(userGroups, EmployeeId, SynergyManagerIds);
        let result = this.buttonsVisibility(data[0].Status, EmployeeId, SynergyManagerIds, userGroups);
        let PTOData = this.state.PTOData;
        PTOData.PTOAvailableBalance = [null, undefined, ''].includes(data[0].PTOAvailableBalance) ? '0' : parseFloat(data[0].PTOAvailableBalance).toFixed(4);
        //TO table related
        let TimeOffTableData = this.state.TimeOffTableData;
        TimeOffTableData.TimeOffRowsData = JSON.parse(data[0].TimeOffRows);
        TimeOffTableData.PTOSubTotal = JSON.parse(data[0].PTOSubTotal);
        TimeOffTableData.TOSubTotal = JSON.parse(data[0].TOSubTotal);
        TimeOffTableData.Total = JSON.parse(data[0].Total);
        TimeOffTableData.currentTimeOffRowsCount = JSON.parse(data[0].TimeOffRows).length;
        TimeOffTableData.PTOTotal = [null, undefined, ''].includes(data[0].PTOTotal) ? 0 : parseFloat(data[0].PTOTotal);
        TimeOffTableData.TOTotal = [null, undefined, ''].includes(data[0].TOTotal) ? 0 : parseFloat(data[0].TOTotal);
        let PTOTransactionsDayWise=this.mapDatesToHours(TimeOffTableData.PTOSubTotal,new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].From)));
        this.setState({
            EmployeeId: data[0].Employee.ID,
            EmployeeName: data[0].Employee.Title,
            EmployeeEmail: EmployeeEmail,
            FromDate: new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].From)),
            fetchedFromDate: new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].From)),
            ToDate: new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].To)),
            fetchedToDate: new Date(DateUtilities.GetDateMMDDYYYYAsInList(data[0].To)),
            PreviousPTOBalance: [null, undefined, ''].includes(data[0].PreviousPTOBalance) ? '0' : parseFloat(data[0].PreviousPTOBalance).toFixed(4),
            CurrentPTOBalance: [null, undefined, ''].includes(data[0].CurrentPTOBalance) ? '0' : parseFloat(data[0].CurrentPTOBalance).toFixed(4),
            TotalHours: data[0].TotalHours,
            CommentsHistory: JSON.parse(data[0].CommentsHistory),
            SynergyManagerId: SynergyManagerIds,
            SynergyManagerNames: SynergyManagerNames,
            loading: false,
            Status: data[0].Status,
            ButtonsVisibility: result.visibility,
            isDisabled: result.isDisabled,
            SynergyManagerEmails: SynergyManagerEmails,
            IsSubmitted: data[0].IsSubmitted,
            ItemID: parseInt(data[0].Id),
            Comments: '',
            userGroups: userGroups,
            PTOData: PTOData,
            TimeOffTableData:TimeOffTableData,
            PTOTransactionsDayWise:PTOTransactionsDayWise,
            PTOTransactionListData:PTOTransactionListData
        })
    }
    // Below functions are used to check permissions and authentication
    private buttonsVisibility(Status, EmployeeID, SynergyManagerIds, userGroups) {
        let result = { visibility: {}, isDisabled: false };
        let loginUserID = this.props.spContext.userId;
        let isHR = userGroups.includes('Timesheet HR');
        let ButtonsVisibility = {Submit: true,Withdraw: false, Approve: false,Reject: false,Revoke: false};

        let showHRSection = false; //to HR section

        if (Status == StatusType.Withdraw) {
            result.isDisabled = false;
            ButtonsVisibility.Submit = true;
        }
        else if (Status == StatusType.Submit) {
            result.isDisabled = true;
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Withdraw = true;
            }
            else if (SynergyManagerIds.results.includes(loginUserID)) {
                ButtonsVisibility.Approve = true;
                ButtonsVisibility.Reject = true;
                if (isHR)
                    showHRSection = true;
            }
        }
        else if (Status == StatusType.ManagerApprove) {
            result.isDisabled = true;
            ButtonsVisibility.Submit = false;
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Revoke = true
                if (isHR) {
                    ButtonsVisibility.Approve = true
                    ButtonsVisibility.Reject = true
                    showHRSection = true;
                }
            }
            else if (isHR) {
                ButtonsVisibility.Approve = true
                ButtonsVisibility.Reject = true
                showHRSection = true;
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
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = true;
                ButtonsVisibility.Approve = false;
                ButtonsVisibility.Reject = false;
                ButtonsVisibility.Revoke = false;
                ButtonsVisibility.Withdraw = false;
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
        else if (Status == StatusType.Approved) {
            result.isDisabled = true
            if (loginUserID == EmployeeID) {
                ButtonsVisibility.Submit = false;
                ButtonsVisibility.Revoke = true;
            }
            else if (SynergyManagerIds.results.includes(loginUserID)) {
                ButtonsVisibility.Submit = false;
            }
            else if (isHR) {
                ButtonsVisibility.Submit = false;
                showHRSection = true;
            }
        }
        else if (Status == StatusType.Reject) {
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
        result.visibility = ButtonsVisibility;
        this.setState({ showHRSection: showHRSection });
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
        if (name != "TotalHours") {
            //if (this.state.TimeOffTypeKeys.includes(name)) {
            // let TimeOffTypes = this.state.TimeOffTypes;
            //let SelectedTimeOffTypes=[];
            // TimeOffTypes[name].val = value;
            // for(let type in TimeOffTypes) //to remove border for TimeOff Type
            //     {
            //         if(TimeOffTypes[type].val==true)
            //             {
            //                 document.getElementById("divTimeOffType").classList.remove("TimeOffTypeMandatory");
            //                 SelectedTimeOffTypes.push(TimeOffTypes[type].label);
            //             }
            //     }
            //this.setState({ TimeOffTypes: TimeOffTypes,SelectedTimeOffTypes:SelectedTimeOffTypes});
            //}
            //else
            let TimeOffTypesObj = this.state.TimeOffTypesObj;
            // if(name=='TimeOffType')
            // {
            //    let IsEligibleforPTO =false;
            //    if(value!='')
            //     IsEligibleforPTO=TimeOffTypesObj.find(item=>item.Title == value).IsEligibleforPTO // To check whether the Selected TImeOffType is eligible for PTO or not

            //    this.setState({IsSelectedTOEligibleforPTO:IsEligibleforPTO});
            // }
            if (name.includes('_TimeOffType')) //TO table related
            {
                let [PTOTotal, TOTotal] = [0, 0];
                let index = parseInt(name.split('_'));
                let TimeOffTableData = this.state.TimeOffTableData;
                let TimeOffRowsData = TimeOffTableData.TimeOffRowsData;
                TimeOffRowsData[index].TimeOffType = value;
                TimeOffRowsData[index].IsPTOEligible = TimeOffTypesObj.find(item => item.Title == value) ? TimeOffTypesObj.find(item => item.Title == value).IsEligibleforPTO : false;
                TimeOffRowsData.forEach(item => {
                    if (item.IsPTOEligible)//For PTO Total calculation
                    {
                        PTOTotal = PTOTotal + (parseFloat(item['Total']));
                    }
                    else //For To Total calculation
                    {
                        TOTotal = TOTotal + (parseFloat(item['Total']));
                    }
                }
                );
                TimeOffTableData.PTOTotal = PTOTotal;
                TimeOffTableData.TOTotal = TOTotal;
                TimeOffTableData.TimeOffRowsData = TimeOffRowsData;
                this.setState({ TimeOffTableData });
            }
            else {
                this.setState({ [name]: value });
            }
        }
        else {
            value = value.match(/\d{0,5}(\.\d{0,4})?/)[0];
            this.setState({ [name]: value });
        }
    }
    // this function is used to set date to the date feild
    private handleFromorToDate = (dateprops) => {
        let date = new Date();
        let DateField = dateprops[1] == "txtFromDate" ? 'FromDate' : dateprops[1] == "txtToData" ? 'ToDate' : '';
        if (dateprops[0] != null) {
            date = new Date(DateUtilities.getDateMMDDYYYY(dateprops[0]));
            this.setState({ [DateField]: date, ReportData: [] });
        }
        else {
            this.setState({ [DateField]: null, ReportData: [] });
        }
    }
    private handleFromoDate = (dateprops) => {
        this.setState({ loading: true });
        let date = new Date();
        if (dateprops != null) {
            date = new Date(DateUtilities.getDateMMDDYYYY(dateprops));
            //TO table related
            this.getItemDataByFromDate(date);
            let WeekStartDate = new Date(date);
            let DateOfjoining = new Date(DateUtilities.getDateMMDDYYYY(this.state.DateOfJoining));
            this.WeekHeadings = [];
            this.WeekHeadings.push({
                "Mon": (new Date(WeekStartDate).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "MonDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsMonJoined": WeekStartDate < DateOfjoining,
                "Tue": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "TueDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsTueJoined": WeekStartDate < DateOfjoining,
                "Wed": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "WedDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsWedJoined": WeekStartDate < DateOfjoining,
                "Thu": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "ThuDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsThuJoined": WeekStartDate < DateOfjoining,
                "Fri": (new Date(WeekStartDate.setDate(WeekStartDate.getDate() + 1)).getDate().toString().length == 1 ? "0" + WeekStartDate.getDate() : WeekStartDate.getDate()) + ' ' + this.state.Months[new Date(WeekStartDate).getMonth()],
                "FriDate": DateUtilities.getDateMMDDYYYY(WeekStartDate),
                "IsFriJoined": WeekStartDate < DateOfjoining,
            })
            this.setState({ FromDate: date, ToDate: addDays(date, 6)});
        }
        else {
            this.WeekHeadings = [];
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
            this.setState({ FormDate: null,ToDate: null});
            this.ClearTimeOffControls(null,null);
        }
    }
    //Email sending functions
    private emailBodyPreparation(redirectURL, tableContent, bodyString, userName, DashboardURL) {
        var emailLink = "Please <a href=" + redirectURL + ">click here</a> to review the details or go to <a href=" + DashboardURL + ">Dashboard</a>.";
        var emailBody = '<table id="email-container" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; text-align: left;"width="600px">' +
            '<tr valign="top"><td colspan="2"><div id="email-to">Dear Sir/Madam,</br></div></td></tr>';
        emailBody += '<tr valign="top"><td colspan="2" style="padding-top: 10px;">' + bodyString + '</td></tr>';
        var i = 0;
        for (var key in tableContent) {
            if (i === 0)
                emailBody += "<tr><td></br></td></tr>";
            var tdValue = tableContent[key];
            emailBody += '<tr valign="top"> <td style="width:200px">' + key + '</td><td>: ' + tdValue + '</td></tr>';
            i++;
        }
        emailBody += '<tr valign="top"> <td colspan="2" style="padding-top: 10px;"></br>' + emailLink + '</td></tr>';
        emailBody += '<tr valign="top"><td colspan="2"></br><p style="margin-bottom: 0;">Regards,</p><div style="margin-top: 5px;" id="email-from">' + userName + '</div>';
        emailBody += '</td></tr></table>';
        return emailBody;
    }
    private sendemail(emaildetails, ActionStatus) {
        sp.utility.sendEmail({
            //Body of Email  
            Body: emaildetails.body,
            //Subject of Email  
            Subject: emaildetails.subject,
            //Array of string for To of Email  
            To: emaildetails.toemail,
            CC: emaildetails.ccemail
        }).then((i) => {
            //  customToaster('toster-success', ToasterTypes.Success,'PTO Applied Successfully', 2000)
            if (StatusType.Revoke != ActionStatus) {
                let actionStatusForToaster = [StatusType.ManagerApprove, StatusType.HRApprove].includes(ActionStatus) ? StatusType.Approved : [StatusType.ManagerReject, StatusType.HRReject].includes(ActionStatus) ? StatusType.Reject : ActionStatus;
                this.setState({ loading: false, message: 'Success-' + actionStatusForToaster, Homeredirect: true });
            }
            else {
                customToaster('toster-success', ToasterTypes.Success, 'Time Off request form ' + StatusType.Revoke.toLowerCase() + ' succesfully', 2000);
                this.getOnLoadData();
            }
        }).catch((i) => {
            console.log(i);
            this.setState({ message: 'Error', loading: false, Homeredirect: true });
        });
    }
    private showSuccessToaster(ActionStatus) {
        if ([StatusType.Revoke,StatusType.Withdraw].includes(ActionStatus)) {
            customToaster('toster-success', ToasterTypes.Success, 'Time Off request form ' + ActionStatus.toLowerCase() + ' succesfully', 2000);
            this.getOnLoadData();
        }
        else {
            let actionStatusForToaster = [StatusType.ManagerApprove, StatusType.HRApprove].includes(ActionStatus) ? StatusType.Approved : [StatusType.ManagerReject, StatusType.HRReject].includes(ActionStatus) ? StatusType.Reject : ActionStatus;
            this.setState({ loading: false, message: 'Success-' + actionStatusForToaster, Homeredirect: true });
        }
    }

    // Below are CRUD operation functions for actions

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
        if (Status != data[0].Status) {
            // customToaster('toster-error', ToasterTypes.Error, "Attention: This PTO has been modified. Please review the changes.", 4000);
            this.setState({ loading: false, message: 'Success-' + StatusType.RecordModified, Homeredirect: true });
            // this.setState({message:'RecordModified',Homeredirect:true})
            return false;
        }
        let postObject, ConfirmPopupMessage = '';
        let isHR = this.state.userGroups.includes('Timesheet HR');
        if (ActionID == "btnApprove") {
            //if (this.state.Status == StatusType.Submit) {
            //     commentsObj.push({
            //         Action: StatusType.Approved,
            //         Role: 'Reporting Manager',
            //         User: this.props.spContext.userDisplayName,
            //         Comments: Comments,
            //         Date: new Date().toISOString()
            //     })
            //     if(isHR){
            //         // postObject = {
            //         //     CommentsHistory: JSON.stringify(commentsObj),
            //         //     Status: StatusType.Approved,
            //         //     PendingWith: "NA",
            //         // }
            //         // ActionStatus = StatusType.Approved 
            //     }
            //     else{
            //     postObject = {
            //         CommentsHistory: JSON.stringify(commentsObj),
            //         Status: StatusType.ManagerApprove,
            //         PendingWith: "HR",
            //     }
            //     ActionStatus = StatusType.ManagerApprove
            // }
            // }
            // else {
            //     commentsObj.push({
            //         Action: StatusType.Approved,
            //         Role: 'HR',
            //         User: this.props.spContext.userDisplayName,
            //         Comments: Comments,
            //         Date: new Date().toISOString()
            //     })
            //     postObject = {
            //         CommentsHistory: JSON.stringify(commentsObj),
            //         Status: StatusType.Approved,
            //         PendingWith: "NA",
            //     }
            //     ActionStatus = StatusType.Approved
            // }
            ConfirmPopupMessage = 'Are you sure you want to approve?';
            //this.generateEmailData(postObject, ActionStatus)
        }
        else if (ActionID == "btnReject") {
            let isValid = this.checkMandatoryComments(Comments);
            if (!isValid) {
                return false;
            }
            // if (this.state.Status == StatusType.Submit) {
            //     commentsObj.push({
            //         Action: StatusType.Reject,
            //         Role: 'Reporting Manager',
            //         User: this.props.spContext.userDisplayName,
            //         Comments: Comments,
            //         Date: new Date().toISOString()
            //     })
            //     postObject = {
            //         CommentsHistory: JSON.stringify(commentsObj),
            //         Status: StatusType.ManagerReject,
            //         PendingWith: "Initiator",
            //     }
            //     ActionStatus=StatusType.ManagerReject;
            // }
            // else {
            //     commentsObj.push({
            //         Action: StatusType.Reject,
            //         Role: 'HR',
            //         User: this.props.spContext.userDisplayName,
            //         Comments: Comments,
            //         Date: new Date().toISOString()
            //     })
            //     postObject = {
            //         CommentsHistory: JSON.stringify(commentsObj),
            //         Status: StatusType.HRReject,
            //         PendingWith: "Initiator",
            //     }
            //     ActionStatus=StatusType.HRReject
            // }
            ConfirmPopupMessage = 'Are you sure you want to reject?';
            //this.generateEmailData(postObject,ActionStatus)
        }
        else if (ActionID == "btnRevoke") {
            let isValid = this.checkMandatoryComments(Comments)
            if (!isValid) {
                return false;
            }
            // commentsObj.push({
            //     Action: StatusType.Revoke,
            //     Role: 'Initiator',
            //     User: this.props.spContext.userDisplayName,
            //     Comments: Comments,
            //     Date: new Date().toISOString()
            // })
            // postObject = {
            //     CommentsHistory: JSON.stringify(commentsObj),
            //     Status: StatusType.Revoke,
            //     PendingWith: "Initiator",
            // }
            // ActionStatus=StatusType.Revoke;
            ConfirmPopupMessage = 'Are you sure you want to revoke?';
            //this.generateEmailData(postObject,ActionStatus)
        }
        else if (ActionID == "btnWithdraw") {
            let isValid = this.checkMandatoryComments(Comments);
            if (!isValid) {
                return false;
            }
            // commentsObj.push({
            //     Action: StatusType.Withdraw,
            //     Role: 'Initiator',
            //     User: this.props.spContext.userDisplayName,
            //     Comments: Comments,
            //     Date: new Date().toISOString()
            // })
            // postObject = {
            //     CommentsHistory: JSON.stringify(commentsObj),
            //     Status: StatusType.Withdraw,
            //     PendingWith: "NA",
            // }
            // ActionStatus = StatusType.Withdraw;
            ConfirmPopupMessage = 'Are you sure you want to withdraw?';
            //this.generateEmailData(postObject,ActionStatus)
        }
        // if(this.state.showHRSection)
        // {
        //     postObject['EnteredIntoIndividualPTOTracker']=this.state.EnteredIntoIndividualPTOTracker;
        //     postObject['EnteredIntoPayRollSystem']=this.state.EnteredIntoPayRollSystem;
        //     postObject['EnteredIntoTimesheetTracker']=this.state.EnteredIntoTimesheetTracker;
        //     postObject['PTOHoursPaid']=this.state.PTOHoursPaid;
        //     postObject['PTOHoursTaken']=this.state.PTOHoursTaken;
        //     postObject['PTOBalance']=this.state.PTOBalance;
        // }
        this.setState({ ActionID: ActionID, showConfirmPopup: true, ConfirmPopupMessage: ConfirmPopupMessage, loading: false });

        // this.generateEmailData(postObject, ActionStatus);
    }
    // this function is used to validate form and send data to list if validation succeeds
    private showConfirmSubmit = async (e) => {
        this.setState({ loading: true });
        let data = {
            // TimeOffType: { val: this.state.TimeOffType, required: true, Name: 'Time Off Type', Type: ControlType.reactSelect, Focusid: 'TimeOffType' },
            FromDate: { val: this.state.FromDate, required: true, Name: 'From Date', Type: ControlType.date, Focusid: "divFromDate" },
            ToDate: { val: this.state.ToDate, required: true, Name: 'To Date', Type: ControlType.date, Focusid: "divToDate" },
            // TotalHours: { val: this.state.TotalHours, required: true, Name: 'Total Hours', Type: ControlType.string, Focusid: this.TotalHours }
        }
        let isDatesValid = Formvalidator.checkValidations(data);
        let isValid = isDatesValid.status ? this.validateTimeOffControls() : isDatesValid;
        if (!isValid.status) {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000);
            return false
        }
        if (new Date(this.state.FromDate) > new Date(this.state.ToDate)) {
            isValid.message = 'From Date cannot be greater than To Date'
            let element = document.getElementById('txtFromDate');
            element.focus();
            element.classList.add('mandatory-FormContent-focus');
            // setTimeout(function () {
            //     element.classList.add('mandatory-FormContent-focus');
            // }, 0)
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        isValid = this.checkIsValidDateRange(this.state.FromDate, this.state.ToDate, this.state.HolidayDates)
        if (!isValid.status) {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        isValid = this.validateTotalPTOhours(this.state.FromDate, this.state.ToDate, this.state.TotalHours)
        if (!isValid.status) {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false
        }
        let doj = new Date(this.state.DateOfJoining);
        let from = new Date(this.state.FromDate);
        if (new Date(doj) > new Date(from)) {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, "TimeOff cannot be applied for days preceding your date of joining.", 4000);
            return false;
        }
        isValid = await this.validateDuplicateRecord();
        if (!isValid.status) {
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, isValid.message, 4000)
            return false;
        }
        // let commentsObj = this.state.CommentsHistory;
        // commentsObj.push({
        //     Action: this.state.IsSubmitted ? "Re-" + StatusType.Submit : StatusType.Submit,
        //     Role: 'Initiator',
        //     User: this.props.spContext.userDisplayName,
        //     Comments: this.state.Comments,
        //     Date: new Date().toISOString()
        // })
        // let postObject = {
        //     EmployeeId: this.state.EmployeeId,
        //     TimeOffType:JSON.stringify(this.state.SelectedTimeOffTypes),
        //     From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.FromDate))),
        //     To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.ToDate))),
        //     PTOAvailableBalance:this.state.PTOData.PTOAvailableBalance.toString(),
        //     TotalHours: this.state.TotalHours,
        //     CommentsHistory: JSON.stringify(commentsObj),
        //     Status: StatusType.Submit,
        //     PendingWith: "Manager",
        //     SynergyManagerId: this.state.SynergyManagerId,
        //     IsSubmitted: true
        // }
        this.setState({ ActionID: e.target.id, showConfirmPopup: true, ConfirmPopupMessage: 'Are you sure you want to submit?', loading: false });
        //this.generateEmailData(postObject, this.state.IsSubmitted ? "Re-"+StatusType.Submit : StatusType.Submit);
    }
    private getActionDetails = (ActionID) => {
        let postObject, ActionStatus = '';
        let isHR = this.state.userGroups.includes('Timesheet HR');
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
                        Status: StatusType.ManagerApprove,
                        PendingWith: "HR",
                        Revised: true
                    }
                    ActionStatus = StatusType.ManagerApprove;
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
                    Revised: true
                }
                ActionStatus = StatusType.Approved;
            }
        }
        else if (ActionID == "btnReject") {
            // let isValid = this.checkMandatoryComments(Comments);
            // if (!isValid) {
            //     return false;
            // }
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
            // let isValid = this.checkMandatoryComments(Comments)
            // if (!isValid) {
            //     return false;
            // }
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
            // let isValid = this.checkMandatoryComments(Comments);
            // if (!isValid) {
            //     return false;
            // }
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
                //TimeOffType:JSON.stringify(this.state.SelectedTimeOffTypes),
                //TimeOffType:this.state.TimeOffType,
                From: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.FromDate))),
                To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(this.state.ToDate))),
                PTOAvailableBalance: this.state.PTOData.PTOAvailableBalance.toString(),
                //TotalHours: this.state.TotalHours,
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


            }
            ActionStatus = this.state.IsSubmitted ? "Re-" + StatusType.Submit : StatusType.Submit
        }
        // if(this.state.showHRSection)
        // {
        //     postObject['EnteredIntoIndividualPTOTracker']=this.state.EnteredIntoIndividualPTOTracker;
        //     postObject['EnteredIntoPayRollSystem']=this.state.EnteredIntoPayRollSystem;
        //     postObject['EnteredIntoTimesheetTracker']=this.state.EnteredIntoTimesheetTracker;
        //     postObject['PTOHoursPaid']=this.state.PTOHoursPaid;
        //     postObject['PTOHoursTaken']=this.state.PTOHoursTaken;
        //     postObject['PTOBalance']=this.state.PTOBalance;
        // }
        return { postObject: postObject, ActionStatus: ActionStatus };
    }
    private generateEmailData = () => {
        this.setState({ showConfirmPopup: false, ConfirmPopupMessage: '' });
        //let TimeOffSelection=this.GetIsPTOEligible();
        // let IsPTOEligibleTOSelected=this.state.IsSelectedTOEligibleforPTO;
        let IsPTOEligibleTOSelected = this.state.TimeOffTableData.PTOTotal > 0;
        let ActionDetails = this.getActionDetails(this.state.ActionID);
        let postObject = ActionDetails['postObject'];
        let ActionStatus = ActionDetails['ActionStatus'];
        let emaildetails = {};
        //let SelectedTimeOffTypes='';
        //this.state.SelectedTimeOffTypes.map((item,index)=>{SelectedTimeOffTypes+=`${index+1}. ${item} `});
        let Content =
        {
            'Employee': this.state.EmployeeName,
            //'Time Off Type':SelectedTimeOffTypes,
            'From': DateUtilities.getDateMMDDYYYY(this.state.FromDate),
            'To': DateUtilities.getDateMMDDYYYY(this.state.ToDate),
            'Total Hours': this.state.TotalHours,
        }

        // let AppliedTOHours=parseFloat(this.state.TotalHours);
        let AppliedTOHours = this.state.TimeOffTableData.PTOTotal;
        // if(TimeOffSelection.isBothSelected) //if PTO Eligible and Not Eligible TimeOff selected , consider only leassthan or equals to PTOAvaialableBalance
        // {
        //         let HrsDiff=parseFloat(this.state.PTOData.PTOAvailableBalance) - parseFloat(this.state.TotalHours) ;
        //         if(HrsDiff<0)
        //         {
        //             AppliedTOHours =parseFloat(this.state.PTOData.PTOAvailableBalance);
        //         }
        // }
        let PTOPostData = {};
        let PTOTransactionData = {
            EmployeeId: this.state.EmployeeId,
            TransactionType: ActionStatus,
            PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(new Date()))),
            From: this.addBrowserwrtServer(new Date(new Date(DateUtilities.getDateMMDDYYYY(this.state.FromDate)))),
            To: this.addBrowserwrtServer(new Date(new Date(DateUtilities.getDateMMDDYYYY(this.state.ToDate)))),
            Hours: AppliedTOHours.toFixed(4),
            //PreviousPTOBalance:parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4),
            //CurrentPTOBalance:parseFloat(row['CurrentPTOBalance']).toFixed(4),
            Reason: this.state.Comments,
            Year: new Date().getFullYear().toString(),
            IsActive: true
        }
        switch (ActionStatus) {
            case StatusType.Submit:
                emaildetails = { toemail: this.state.SynergyManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'Request for Time Off', bodyString: 'Time Off request form has been ' + StatusType.Submit + ' for your approval', body: '', tableContent: Content };
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) + AppliedTOHours).toFixed(4),
                }
                //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }
                break;
            case "Re-" + StatusType.Submit:
                emaildetails = { toemail: this.state.SynergyManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'Request for Time Off', bodyString: 'Time Off request form has been Re-Submitted for your approval', body: '', tableContent: Content };
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOAvailableBalance) - AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) + AppliedTOHours).toFixed(4),
                }
                //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }

                break;
            case StatusType.ManagerApprove:
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.SynergyManagerEmails, subject: 'Time Off request Approved', bodyString: 'Time Off request form has been ' + StatusType.ManagerApprove + ".", body: '', tableContent: Content }
                break;
            case StatusType.ManagerReject:
                Content['Comments'] = this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.SynergyManagerEmails, subject: 'Time Off request Rejected', bodyString: 'Time Off request form has been ' + StatusType.ManagerReject + ".", body: '', tableContent: Content }
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }

                break;
            case StatusType.Revoke:
                Content['Comments'] = this.state.Comments
                emaildetails = { toemail: this.state.SynergyManagerEmails, ccemail: [this.state.EmployeeEmail], subject: 'Time Off request Revoked', bodyString: 'Time Off request form has been ' + StatusType.Revoke + ".", body: '', tableContent: Content }
                //if HR approved, deduct hours from PTOAvailed, other wise deduct hours from PTOApplied
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                }
                if (this.state.Status == StatusType.Approved) {
                    PTOPostData['PTOAvailed'] = (parseFloat(this.state.PTOData.PTOAvailed) - AppliedTOHours).toFixed(4);
                }
                else {
                    PTOPostData['PTOApplied'] = (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4);
                }
                //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }

                break;
            case StatusType.Withdraw:
                Content['Comments'] = this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.SynergyManagerEmails, subject: 'Time Off request Withdrawn', bodyString: 'Time Off request form has been ' + StatusType.Withdraw + ".", body: '', tableContent: Content }
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }

                break;
            case StatusType.Approved:
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.SynergyManagerEmails, subject: 'Time Off request Approved', bodyString: 'Time Off request form has been ' + StatusType.Approved + ".", body: '', tableContent: Content }
                PTOPostData =
                {
                    PTOAvailed: (parseFloat(this.state.PTOData.PTOAvailed) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                    PTOBalance: (parseFloat(this.state.PTOData.PTOBalance) - AppliedTOHours).toFixed(4),
                }
                break;
            case StatusType.HRReject:
                Content['Comments'] = this.state.Comments
                emaildetails = { toemail: [this.state.EmployeeEmail], ccemail: this.state.SynergyManagerEmails, subject: 'Time Off request Approved', bodyString: 'Time Off request form has been ' + StatusType.HRReject + ".", body: '', tableContent: Content }
                PTOPostData =
                {
                    PTOBalanceAfterDeduction: (parseFloat(this.state.PTOData.PTOBalanceAfterDeduction) + AppliedTOHours).toFixed(4),
                    PTOApplied: (parseFloat(this.state.PTOData.PTOApplied) - AppliedTOHours).toFixed(4),
                }
                //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                if (IsPTOEligibleTOSelected) {
                    postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
                    PTOTransactionData['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                    postObject['CurrentPTOBalance'] = PTOPostData['PTOBalanceAfterDeduction'];
                }


                break;
            default:
                break;
        }
        // if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
        // {
        //     if([StatusType.ManagerApprove,StatusType.Approved].includes(ActionStatus))
        //     {
        //         Content['Previous PTO Balance']=this.state.PreviousPTOBalance;
        //         Content['Current PTO Balance']=this.state.CurrentPTOBalance;
        //     }
        //     else{
        //         Content['Previous PTO Balance']=postObject['PreviousPTOBalance'];
        //         Content['Current PTO Balance']=PTOPostData['PTOBalanceAfterDeduction'];
        //     }
        // }
        // else{
        //     PTOTransactionData['CurrentPTOBalance']=parseFloat(this.state.PTOData.PTOAvailableBalance).toFixed(4);
        //     postObject['CurrentPTOBalance']=parseFloat(this.state.PTOData.PTOAvailableBalance).toFixed(4);
        // }
        if (!IsPTOEligibleTOSelected) {
            postObject['PreviousPTOBalance'] = parseFloat(this.state.PTOData.PTOBalanceAfterDeduction).toFixed(4);
            postObject['CurrentPTOBalance'] = parseFloat(this.state.PTOData.PTOAvailableBalance).toFixed(4);
        }
        //this.InsertorUpdatedata(postObject,PTOPostData,PTOTransactionData, emaildetails,TimeOffSelection);
        this.InsertorUpdatedata(postObject, PTOPostData, PTOTransactionData, emaildetails, IsPTOEligibleTOSelected);
    }
    // this function is used save data in the list
    // private async InsertorUpdatedata(formdata,PTOPostData,PTOTransactionData, EmailData,TimeOffSelection) {
    private async InsertorUpdatedata(formdata, PTOPostData, PTOTransactionData, EmailData, IsPTOEligibleTOSelected) {
        try {
            if (this.state.ItemID > 0) {   //update existing record
                this.setState({ loading: true });
                sp.web.lists.getByTitle('TimeOffEmployees').items.getById(this.state.ItemID).update(formdata).then((res) => {
                    //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                    if (IsPTOEligibleTOSelected) {
                        //this.updatePTOData(PTOPostData, PTOTransactionData, EmailData, formdata);
                        this.updatePTOAndPTOTransactionsDayWise(PTOPostData, formdata,this.state.ItemID);
                    }
                    else {
                        let emaildetails = EmailData;
                        var DashboardURl = this.siteURL + '/SitePages/TimeSheet.aspx';
                        emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/TimeOffRequestForm/' + this.state.ItemID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);
                        //this.sendemail(emaildetails, formdata.Status);
                        this.showSuccessToaster(formdata.Status);
                    }
                }, (error) => {
                    console.log(error);
                });
            }
            else {                  //Add New record
                this.setState({ loading: true });
                sp.web.lists.getByTitle('TimeOffEmployees').items.add(formdata).then((res) => {
                    PTOTransactionData['TimeOffID'] = res.data.Id.toString();
                    //if(TimeOffSelection.isBothSelected || TimeOffSelection.isPTOEligibleTOSelected)
                    if (IsPTOEligibleTOSelected) {
                        //this.updatePTOData(PTOPostData, PTOTransactionData, EmailData, formdata);
                        this.updatePTOAndPTOTransactionsDayWise(PTOPostData, formdata,res.data.Id);
                    }
                    else {
                        let emaildetails = EmailData;
                        var DashboardURl = this.siteURL + '/SitePages/TimeSheet.aspx';
                        emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/TimeOffRequestForm/' + this.state.ItemID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);
                        // this.sendemail(emaildetails, formdata.Status);
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
    private async getLatestPTOData(EmployeeId, WeekStartDate) {
        let EmployeePTO = [];
        if (WeekStartDate != null) {
            try {
                let filterQuery = "Employee/Id eq " + EmployeeId + " and Year eq " + WeekStartDate.getFullYear() + " and IsActive eq 1";
                await sp.web.lists.getByTitle('EmployeePTO').items.filter(filterQuery).select('Employee/Id,Employee/Title,Employee/EMail,*').expand("Employee").getAll()
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
    //This function is used when PTO Transaction is updated with single reocord
    private async updatePTOData(PTOPostData, PTOTransactionData, EmailData, formdata) {
        try {
            //batch update of EmployeePTO and adding PTO Transaction :Start
            let PTOBatch = sp.web.createBatch();
            sp.web.lists.getByTitle('EmployeePTO').items.getById(this.state.PTOData.EmpPTOID).inBatch(PTOBatch).update(PTOPostData);
            let emaildetails = EmailData;
            var DashboardURl = this.siteURL + '/SitePages/TimeSheet.aspx';
            if (this.state.ItemID > 0) {
                let PTOTranOfTimeOffRec = await sp.web.lists.getByTitle('PTOTransactions').items.filter(`TimeOffID eq '${this.state.ItemID}'`).select('*').getAll();
                if (PTOTranOfTimeOffRec.length) {
                    sp.web.lists.getByTitle('PTOTransactions').items.getById(PTOTranOfTimeOffRec[0].Id).inBatch(PTOBatch).update(PTOTransactionData);
                }
                else {
                    sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(PTOTransactionData);

                }
                emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/TimeOffRequestForm/' + this.state.ItemID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);

            }
            else {
                sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(PTOTransactionData);
                emaildetails['body'] = this.emailBodyPreparation(this.siteURL + '/SitePages/TimeSheet.aspx#/TimeOffRequestForm/' + PTOTransactionData.TimeOffID, EmailData.tableContent, emaildetails['bodyString'], this.props.spContext.userDisplayName, DashboardURl);

            }

            Promise.all([PTOBatch.execute()]).then(PTORes => {
                //console.log("PTO updated successfullly");
                //    this.sendemail(emaildetails, formdata.Status);
                this.showSuccessToaster(formdata.Status);
            }).catch(PTOError => {
                console.log(PTOError);
                console.log("Error while updating PTO data");
            })
            //batch update of EmployeePTO and adding PTO Transaction :End
        }
        catch (e) {
            console.log('Failed to add PTO Data');
            this.setState({ ActionToasterMessage: 'Error', loading: false, redirect: true });
        }
    }
    //This function is used when PTO Transaction is updated with multiple reocords day wise
    private async updatePTOAndPTOTransactionsDayWise(PTOPostData,formdata,TimeOffID) {
        try {
            let PTOBatch = sp.web.createBatch();
            let PTOTransactionsDayWise= this.getPTOtransactionsDayWise();
            let PTOtransactionsDayWisePostData=this.calculatePTOTransactions(this.state.PTOData.PTOBalanceAfterDeduction,PTOTransactionsDayWise);
            //batch update of EmployeePTO and adding PTO Transaction :Start
            sp.web.lists.getByTitle('EmployeePTO').items.getById(this.state.PTOData.EmpPTOID).inBatch(PTOBatch).update(PTOPostData);
            if (this.state.ItemID > 0) {
                //If action is other than Submit, update only Status
               if(formdata.Status!=StatusType.Submit){
                if(this.state.PTOTransactionListData.length){
                    for (const row of this.state.PTOTransactionListData) {
                        let Transaction = {
                            TransactionType: formdata.Status
                        }
                        sp.web.lists.getByTitle('PTOTransactions').items.getById(row.ID).inBatch(PTOBatch).update(Transaction);
                    }
                }
            }
            else{
                if(this.state.PTOTransactionListData.length){

                    let exsistingData = [];
                    for (let row of this.state.PTOTransactionListData) {
    
                        let ddfrmt = row.PostedOn.split('T')[0];
                        ddfrmt = DateUtilities.getDateMMDDYYYY(ddfrmt);
                        exsistingData.push({
                            ID: row.ID,
                            DayDate: ddfrmt,
                            Hours: parseFloat(row.Hours),
                            PreviousPTOBalance:parseFloat(row.PreviousPTOBalance),
                            CurrentPTOBalance:parseFloat(row.CurrentPTOBalance),
                        })
                    }
                    let postData = this.getPTOTransactionsData(exsistingData,PTOtransactionsDayWisePostData);

                    for (const row of postData) {
                        let Transaction = {
                            ClientName:this.state.ClientName,
                            TimeOffID: TimeOffID.toString(),
                            EmployeeId:this.state.EmployeeId,
                            TransactionType: formdata.Status,
                            PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            From:this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            Hours:parseFloat(row['Hours']).toFixed(4),
                            PreviousPTOBalance:parseFloat(row['PreviousPTOBalance']).toFixed(4),
                            CurrentPTOBalance:parseFloat(row['CurrentPTOBalance']).toFixed(4),
                            Reason: this.state.Comments,
                            Year:new Date(row['DayDate']).getFullYear().toString(),
                            IsActive: row.IsActive
                        }
                        if(row.ID!=0)
                            sp.web.lists.getByTitle('PTOTransactions').items.getById(row.ID).inBatch(PTOBatch).update(Transaction);
                       else
                           sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(Transaction);
                    }
                }
                else{
                    // now applied for pto previously did not apply
                    for (const row of PTOtransactionsDayWisePostData) {
                        let Transaction = {
                            ClientName:this.state.ClientName,
                            TimesheetID: TimeOffID.toString(),
                            EmployeeId:this.state.EmployeeId,
                            TransactionType: formdata.Status,
                            PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            From:this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                            Hours:parseFloat(row['Hours']).toFixed(4),
                            PreviousPTOBalance:parseFloat(row['PreviousPTOBalance']).toFixed(4),
                            CurrentPTOBalance:parseFloat(row['CurrentPTOBalance']).toFixed(4),
                            Reason: this.state.Comments,
                            Year:new Date(row['DayDate']).getFullYear().toString(),
                            IsActive: row.IsActive
                        }
                       sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(Transaction);
                    }
                }
            }
            }
            else {
                // For batch adding of PTO transactions day wise if new Time Off
                for (const row of PTOtransactionsDayWisePostData) {
                    let PTOTransaction={
                        ClientName:this.state.ClientName,
                        TimeOffID: TimeOffID.toString(),
                        EmployeeId:this.state.EmployeeId,
                        TransactionType:formdata.Status,
                        PostedOn: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        From:this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        To: this.addBrowserwrtServer(new Date(DateUtilities.getDateMMDDYYYY(row['DayDate']))),
                        Hours:parseFloat(row['Hours']).toFixed(4),
                        PreviousPTOBalance:parseFloat(row['PreviousPTOBalance']).toFixed(4),
                        CurrentPTOBalance:parseFloat(row['CurrentPTOBalance']).toFixed(4),
                        Reason: this.state.Comments,
                        Year:new Date(row['DayDate']).getFullYear().toString(),
                        IsActive: true
                    }
                    sp.web.lists.getByTitle('PTOTransactions').items.inBatch(PTOBatch).add(PTOTransaction);
                }
            }

            Promise.all([PTOBatch.execute()]).then(PTORes => {
                //console.log("PTO updated successfullly");
                //    this.sendemail(emaildetails, formdata.Status);
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

    // Below is used to handle correct Date insertion irrespective of Timezone
    private addBrowserwrtServer(date) {
        if (date != '') {
            var utcOffsetMinutes = date.getTimezoneOffset();
            var newDate = new Date(date.getTime());
            newDate.setTime(newDate.getTime() + ((this.props.spContext.webTimeZoneData.Bias - utcOffsetMinutes + this.props.spContext.webTimeZoneData.DaylightBias) * 60 * 1000));
            return newDate;
        }
    }
    //Below are functions used to custom validation 
    private ValidateTimeOffType = () => {
        let isValid = {
            status: true,
            message: ""
        }
        //let TimeOffTypes=this.state.TimeOffTypes;
        //let isAllunchecked=true;
        // for(let type in TimeOffTypes)
        // {
        //     if(TimeOffTypes[type].val==true)
        //         {
        //             isAllunchecked=false;
        //             break;
        //         }
        // }
        //let TimeOffSelection=this.GetIsPTOEligible();
        // if(isAllunchecked)
        // {
        //     isValid.status=false;
        //     isValid.message="Please select atleast one 'Time Off Type'";
        //    document.getElementById("divTimeOffType").classList.add("TimeOffTypeMandatory");
        // }
        //else if(TimeOffSelection.isPTOEligibleTOSelected)
        //{
        if (this.state.IsSelectedTOEligibleforPTO) {
            if (parseFloat(this.state.TotalHours) > parseFloat(this.state.PTOData.PTOAvailableBalance)) {
                isValid.status = false;
                isValid.message = "'Total Hours' cannot be greater than 'PTO Balance'";
                document.getElementById("txtTotalHours").focus();
                document.getElementById("txtTotalHours").classList.add("mandatory-FormContent-focus");

            }
        }
        //}
        return isValid;
    }
    //function related to custom Validation //TO table related
    private validateTimeOffControls() {
        let TimeOffTableData = this.state.TimeOffTableData;
        let PTOData = this.state.PTOData;
        let isValid = { status: true, message: '' };
        let val;
        let Time;
        var isAllDaysEmpty;
        var weeks = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        for (let i in TimeOffTableData.TimeOffRowsData) {
            if (TimeOffTableData.TimeOffRowsData[i].TimeOffType.trim() == "") { // Time Off Type can not be blank
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
                    isValid.message = "Total time off hours in a day must not exceed 8 hours.";
                    isValid.status = false;
                    document.getElementById("Total" + key).focus();
                    document.getElementById("Total" + key).classList.add('mandatory-FormContent-focus');
                    return isValid;
                }
            }
        }

        val = TimeOffTableData.Total[0].Total;
        Time = parseFloat(val);  // 0 hours not allowed to submit timeoff
        if (Time == 0) {
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
        }
        //if isValid true remove all 'mandatory-FormContent-focus' classes
        this.RemoveAll_mandatory_FormContent_focus(TimeOffTableData);
        return isValid;
    }
    private RemoveAll_mandatory_FormContent_focus = (TimeOffTableData) => {
        var weeks = ["Mon", "Tue", "Wed", "Thu", "Fri"];
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
    //  private GetIsPTOEligible=()=>
    // {
    //     let PTOEligibleTimeOffs=[];
    //     let PTONotEligibleTimeOffs=[];
    //     for(let type in this.state.TimeOffTypes)
    //         {
    //                 if(this.state.TimeOffTypes[type].IsEligibleforPTO)
    //                 {
    //                     PTOEligibleTimeOffs.push(this.state.TimeOffTypes[type].label);
    //                 }
    //                 else{
    //                     PTONotEligibleTimeOffs.push(this.state.TimeOffTypes[type].label);
    //                 }
    //         }
    //     let TOSelectedObj={
    //         isPTOEligibleTOSelected:false,
    //         isPTONotEligibleTOSelected:false,
    //         isBothSelected:false
    //     }
    //    let SelectedTimeOffTypes=this.state.SelectedTimeOffTypes;
    //    TOSelectedObj.isPTOEligibleTOSelected= PTOEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type)) && !PTONotEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type));
    //    TOSelectedObj.isPTONotEligibleTOSelected= !PTOEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type)) && PTONotEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type));
    //    TOSelectedObj.isBothSelected= PTOEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type)) && PTONotEligibleTimeOffs.some(type => SelectedTimeOffTypes.includes(type));
    // return TOSelectedObj;
    // }
    private validateTotalPTOhours(FromDate, ToDate, Hours) {
        let isValid = {
            status: true,
            message: ''
        }
        let From = new Date(FromDate)
        let To = new Date(ToDate)
        let days = 0;
        while (From <= To) {
            if (![0, 6].includes(From.getDay())) //to exlcude sunday and saturday  
            {
                days++;
            }
            From.setDate(From.getDate() + 1);
        }
        if (parseFloat(Hours) == 0) {
            isValid.status = false;
            isValid.message = "Total Hours cannot be zero.";
            document.getElementById("txtTotalHours").focus();
            document.getElementById("txtTotalHours").classList.add("mandatory-FormContent-focus");
        }
        else if (parseFloat(Hours) > days * 8) {
            isValid.status = false;
            isValid.message = "Employees can apply a maximum of 8 hours of Time Off (TO) per day.";
        }
        return isValid;
    }
    // this function is used to validate duplicate record if the  employee is already associated withe selected client or not
    private async validateDuplicateRecord() {
        let isValid = {
            status: true,
            message: ""
        }
        let prevDate = addDays(new Date(this.state.FromDate), -1);
        let nextDate = addDays(new Date(this.state.FromDate), 1);
        let prev = DateUtilities.getDateMMDDYYYY(prevDate);
        let next = DateUtilities.getDateMMDDYYYY(nextDate);
        // filterQuery = "WeekStartDate gt '" + prev + "' and WeekStartDate lt '" + next + "'"
        let from1 = this.state.FromDate;
        let from2 = this.state.fetchedFromDate != null ? this.state.fetchedFromDate : '';
        let to1 = this.state.ToDate;
        let to2 = this.state.fetchedFromDate != null ? this.state.fetchedToDate : '';
        if (from1 == from2 && to1 == to2) {
            return isValid;
        }
        else {
            let from = new Date(this.state.FromDate);
            let to = new Date(this.state.ToDate);
            let filterQuery;
            if (this.state.ItemID != 0) {
                filterQuery = "Employee/Id eq '" + this.state.EmployeeId + "' and From ge '" + prev + "' and Status ne '" + StatusType.Withdraw + "' and ID ne '" + this.state.ItemID + "' ";
            }
            else {
                filterQuery = "Employee/Id eq '" + this.state.EmployeeId + "' and From ge '" + prev + "' and Status ne '" + StatusType.Withdraw + "'";
            }
            // " and From lt '"+next+"'
            let selectQuery = "Employee/Title,Employee/ID,*";
            let duplicateRecord = await sp.web.lists.getByTitle('TimeOffEmployees').items.filter(filterQuery).select(selectQuery).expand('Employee').orderBy('Title').get()
            // console.log(duplicateRecord);
            // console.log("length = "+duplicateRecord.length)
            // return duplicateRecord.length;
            //For handling single day duplication with same time Off type
            if ([0].includes((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))) //if selected daterange is only one day
            {
                if (this.checkDateRangeOverlap(duplicateRecord, from, to)) {
                    const fromDate = DateUtilities.getDateMMDDYYYY(from);
                    const toDate = DateUtilities.getDateMMDDYYYY(to);
                    let selDayAppliedHours = 0;
                    for (let record of duplicateRecord) {
                        const recordFromDate = DateUtilities.GetDateMMDDYYYYAsInList(record.From);
                        const recordToDate = DateUtilities.GetDateMMDDYYYYAsInList(record.To);
                        if (recordFromDate == recordToDate && recordFromDate == fromDate && recordToDate == toDate) {
                            selDayAppliedHours += parseFloat(record.TotalHours);
                        }
                    }
                    if (selDayAppliedHours >= 8) {
                        isValid.status = false;
                        isValid.message = "You have already used 8 hours for the selected date. Please choose a different date.";
                    }
                    else if (parseFloat(this.state.TotalHours) > (8 - selDayAppliedHours)) {
                        isValid.status = false;
                        isValid.message = `You have already used ${selDayAppliedHours} hours for the selected date. Please enter up to ${8 - selDayAppliedHours} hours.`;
                        document.getElementById("txtTotalHours").focus();
                        document.getElementById("txtTotalHours").classList.add("mandatory-FormContent-focus");
                    }
                }
            }
            else if (this.checkDateRangeOverlap(duplicateRecord, from, to)) {
                isValid.status = false;
                isValid.message = "Dates overlap with existing Time Off. Please select different dates.";
            }
            return isValid;
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
    private checkIsValidDateRange(FromDate, ToDate, HolidayDates) {

        let isValid = { status: true, message: "" };

        let currentDate = new Date(FromDate);
        const endDate = new Date(ToDate);
        let WeekOffDayIndexes = [0, 6];
        // while (new Date(currentDate) <= new Date(endDate)) {
        //     if (new Date(currentDate).getDay() === 0 || new Date(currentDate).getDay() === 6 || HolidayDates.includes(new Date(currentDate))) {
        //         isValid.status = false;
        //         isValid.message = "Date range includes either a Saturday or Sunday, or holiday.";
        //         break;
        //     }
        //     let nextDate = addDays(new Date(currentDate), 1)
        //     currentDate = nextDate
        // }
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
            // setTimeout(function () {
            //     element.classList.add('mandatory-FormContent-focus');
            // }, 0)
            this.setState({ loading: false });
            customToaster('toster-error', ToasterTypes.Error, "Comments cannot be balnk.", 4000)
            return false
        }
        return true
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
    // private bindTimeOffTypes = () => {
    //     let TimeOffTypeControls = [];
    //     let TimeOffTypes = this.state.TimeOffTypes;
    //     for (let type in TimeOffTypes) {
    //         TimeOffTypeControls.push(<div className="col-md-3">
    //             <div className="light-text">
    //                 <InputCheckBox
    //                     label={TimeOffTypes[type].label}
    //                     name={type}
    //                     checked={TimeOffTypes[type].val}
    //                     onChange={this.handleChangeEvents}
    //                     isforMasters={false}
    //                     isdisable={this.state.isDisabled}
    //                     id={`chk${type}`}
    //                 />
    //             </div>
    //         </div>)
    //     }
    //     return TimeOffTypeControls;
    // }
    // private bindHRSection = () => {
    //     let HRSection = [];
    //     HRSection.push(<div className="light-box my-2 p-2">
    //         <h5>Human Resource Approval</h5>
    //         <div className="row">
    //             {this.getHRCheckBoxes()}
    //         </div>
    //         <div className="row px-3">
    //             {this.getHRInputs()}
    //         </div>
    //     </div>)
    //     return HRSection;
    // }
    private getHRCheckBoxes = () => {
        let CheckBoxControls = [];
        let HRCheckBoxes = [{ label: 'Entered Into Individual PTO Tracker', name: 'EnteredIntoIndividualPTOTracker' }, { label: 'Entered Into Payroll System', name: 'EnteredIntoPayRollSystem' }, { label: 'Entered Into Timesheet Tracker', name: 'EnteredIntoTimesheetTracker' }];
        for (let obj of HRCheckBoxes) {
            CheckBoxControls.push(<div className="col-md-3">
                <div className="light-text" >
                    <InputCheckBox
                        label={obj.label}
                        name={obj.name}
                        checked={this.state[obj.name]}
                        onChange={this.handleChangeEvents}
                        isforMasters={false}
                        isdisable={false}
                        id={`chk${obj.name}`}
                    />
                </div>
            </div>)
        }
        return CheckBoxControls;
    }
    private getHRInputs = () => {
        let inputBoxControls = [];
        let HRInputs = [{ label: 'PTO Hours Paid', name: 'PTOHoursPaid' }, { label: 'PTO Hours Taken', name: 'PTOHoursTaken' }, { label: 'PTO Balance', name: 'PTOBalance' }];
        for (let obj of HRInputs) {
            inputBoxControls.push(<div className="col-md-3">
                <div className='light-text'>
                    <label>{obj.label}
                        {/* <span className="mandatoryhastrick">*</span> */}
                    </label>
                    <input className="form-control" type={"text"} title={obj.label} placeholder="" value={this.state[obj.name]}
                        required={true} onChange={this.handleChangeEvents} name={obj.name} autoComplete="off" disabled={false} maxLength={250} id={`txt${obj.name}`}
                    />
                </div>
            </div>)
        }
        return inputBoxControls;
    }
    //TO table related
    private changeTime = (event) => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let value = event.target.value;
        let index = parseInt(event.target.id.split("_")[0]);
        let prop = event.target.id.split("_")[1];
        let rowType = event.target.id.split("_")[2];
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        if (TableColumns.includes(prop)) {
            value = value.match(/\d{0,5}(\.\d{0,4})?/)[0];
            if (parseFloat(value) > 24.00) {
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
        let [WeeklyPTOSub,TotalPTOSub,WeeklyTOSub,TotalToSub]=[0,0,0,0];
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
        this.setState({ TimeOffTableData });

    }
    private CreateTimeOffHrsRow = () => {
        let TimeOffTableData = this.state.TimeOffTableData;
        let isValid = { status: true, message: '' };
        for (let i in TimeOffTableData.TimeOffRowsData) {

            if (parseFloat(TimeOffTableData.TimeOffRowsData[i].Total) == 0) {
                isValid.message = "Total time Off hours in a week cannot be 0 .";
                isValid.status = false;
                document.getElementById(i + "_Total_TimeOffRow").focus();
                document.getElementById(i + "_Total_TimeOffRow").classList.add('mandatory-FormContent-focus');
                break;
            }
        }
        if (isValid.status) {
            for (let i in TimeOffTableData.TimeOffRowsData) {
                document.getElementById(i + "_Total_TimeOffRow").classList.remove('mandatory-FormContent-focus');
            }
            let count = TimeOffTableData.currentTimeOffRowsCount + 1;
            let newObj = { TimeOffType: '', IsPTOEligible: false, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Total: '0.00' };
            TimeOffTableData.TimeOffRowsData.push(newObj);
            TimeOffTableData.currentTimeOffRowsCount = count;
            this.setState({ TimeOffTableData, errorMessage: "" });
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
        this.setState({ TimeOffTableData })
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
        this.setState({ TimeOffTableData, showConfirmPopup: false });

    }
    private calculateTimeWhenRemoveRow = (TimeOffTableData, DataAfterRemovedObject) => {
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Total"];
        //FOR COLUMN WISE CALCULATION
        for (var prop of TableColumns) {
            let [WeeklyTotal, PTOTotal, TOTotal] = [0, 0, 0];
            let [WeeklyPTOSub,WeeklyTOSub]=[0,0];

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
        for (var i = 0; i < NoOfRows; i++) {
            section.push(<tr id={rowId + (i + 1)}>
                <td title={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType}>
                    <SearchableDropdown isLabelRequired={false} label="Time Off Type" Title={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType} name={i + "_TimeOffType_" + rowType} id={i + "_TimeOffType_" + rowType} placeholderText="Time Off Type" className="ddlTimeOffType form-control text-left" selectedValue={this.state.TimeOffTableData.TimeOffRowsData[i].TimeOffType} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.TimeOffTypesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} disabled={this.state.isDisabled} isRequired={true} noOptionsMessage="No Time Off Type"></SearchableDropdown>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day1)} value={Obj[i][this.WeekNames[0].day1]} id={i + "_" + this.WeekNames[0].day1 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isDisabled || this.WeekHeadings[0].IsMonJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day2)} value={Obj[i][this.WeekNames[0].day2]} id={i + "_" + this.WeekNames[0].day2 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isDisabled || this.WeekHeadings[0].IsTueJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day3)} value={Obj[i][this.WeekNames[0].day3]} id={i + "_" + this.WeekNames[0].day3 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isDisabled || this.WeekHeadings[0].IsWedJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day4)} value={Obj[i][this.WeekNames[0].day4]} id={i + "_" + this.WeekNames[0].day4 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isDisabled || this.WeekHeadings[0].IsThuJoined} ></input>
                </td>
                <td>
                    <input className={"form-control time " + (this.WeekNames[0].day5)} value={Obj[i][this.WeekNames[0].day5]} id={i + "_" + this.WeekNames[0].day5 + "_" + rowType} onChange={this.changeTime} disabled={this.state.isDisabled || this.WeekHeadings[0].IsFriJoined} ></input>
                </td>
                <td>
                    <input className="form-control time WeekTotal" value={Obj[i].Total} id={i + "_Total_" + rowType} onChange={this.changeTime} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                </td>
                <td>

                    {this.state.isDisabled ? '' :
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
        return section;
    }
    private BindTimeOffTable = () => {
        let Table = [];
        Table.push(<div className="border-box-shadow light-box table-responsive table-NoScroll">
            <div className='table-outer'></div>
            <table className="table table-bordered m-0 timetable table-td-p-0">
                <thead style={{ borderBottom: "4px solid #444444" }}>
                    <tr>
                        <th className=""><div className='th-description'>Time Off Type <span className='mandatoryhastrick'>*</span></div></th>
                        <th><div className={"weekDay "}>{this.WeekNames[0].day1} <span className={"day "}>{this.WeekHeadings[0].Mon}</span></div></th>
                        <th><div className={"weekDay "}>{this.WeekNames[0].day2} <span className={"day "}>{this.WeekHeadings[0].Tue}</span></div></th>
                        <th><div className={"weekDay "}>{this.WeekNames[0].day3} <span className={"day "}>{this.WeekHeadings[0].Wed}</span></div></th>
                        <th><div className={"weekDay "}>{this.WeekNames[0].day4} <span className={"day "}>{this.WeekHeadings[0].Thu}</span></div></th>
                        <th><div className={"weekDay "}>{this.WeekNames[0].day5} <span className={"day "}>{this.WeekHeadings[0].Fri}</span></div></th>
                        <th className="bc-e1f2ff"><div className='th-total'>Total</div></th>
                        <th className=""><div className="px-3 th-AddDel-Icon"></div></th>
                    </tr>
                </thead>
                <tbody>
                    {this.dynamicFieldsRow("TimeOffRow")}

                    <tr className="" id="GrandTotalRow">
                        <td className="fw-bold text-start">
                            <div className="p-2 fw-bold">
                                <i className="fas fa-business-time color-gray"></i> Grand Total
                            </div>
                        </td>
                        <td>
                            <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day1]} value={this.state.TimeOffTableData.Total[0][this.WeekNames[0].day1]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                            <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day2]} value={this.state.TimeOffTableData.Total[0][this.WeekNames[0].day2]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                            <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day3]} value={this.state.TimeOffTableData.Total[0][this.WeekNames[0].day3]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                            <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day4]} value={this.state.TimeOffTableData.Total[0][this.WeekNames[0].day4]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                            <input className="form-control time DayTotal" id={"Total" + [this.WeekNames[0].day5]} value={this.state.TimeOffTableData.Total[0][this.WeekNames[0].day5]} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                            <input className="form-control time  GrandTotal" id="GrandTotal" value={this.state.TimeOffTableData.Total[0].Total} type="text" maxLength={5} tabIndex={-1} readOnly></input>
                        </td>
                        <td>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>);
        return Table;
    }
    private getPTOtransactionsDayWise=()=>
    {
        let TimeOffTableData = this.state.TimeOffTableData;
        let TableColumns = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        let PTOTransactionsDayWise=this.state.PTOTransactionsDayWise;
      //to store PTO transactions daywise
      for(let key in TimeOffTableData.PTOSubTotal[0])
      { 
        if(TableColumns.includes(key))
        {
            let DateKey=this.WeekHeadings[0][key+'Date'];
            let Hours=TimeOffTableData.PTOSubTotal[0][key];
            let existingTransaction = PTOTransactionsDayWise.find(transaction => transaction[DateKey] !== undefined);
            if(parseFloat(Hours)>0)
            if (existingTransaction) {
                // Update the existing value
                existingTransaction[DateKey] = Hours;
            } else {
                // Push new object
                PTOTransactionsDayWise.push({ [DateKey]: Hours });
            }
        }
      }
      this.setState({PTOTransactionsDayWise:PTOTransactionsDayWise});
      return PTOTransactionsDayWise;
    }
    //Below functions are used to store the PTO transactions day wise :START
        private calculatePTOTransactions(PTOBalance, PTOTransactions) {
        
            const totalBalance = parseFloat(PTOBalance); // Calculate total balance
            let remainingBalance = parseFloat(totalBalance.toFixed(4)); // Start with the total balance
            const adjustedTransactions = []; // This will hold the final transactions
        
            for (const transaction of PTOTransactions) {
                const date = Object.keys(transaction)[0]; // Get the date key
                const hoursRequested = parseFloat(transaction[date]); // Get the requested hours
                // Determine how many hours can be applied
                let hoursToApply = Math.min(hoursRequested, remainingBalance);
                    hoursToApply = parseFloat(hoursToApply.toFixed(4))
                // If there are hours to apply, add to the adjusted transactions
                if (hoursToApply > 0) {
                    adjustedTransactions.push({'DayDate': date, Hours: hoursToApply,PreviousPTOBalance:remainingBalance,CurrentPTOBalance:remainingBalance-hoursToApply });
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
                const value = data[0][dayKey]; // Assuming data is an array with one object
                
                // If there is a value, add it to the result
                if (value) {
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
                    existingEntry.PreviousPTOBalance=item.PreviousPTOBalance,
                    existingEntry.CurrentPTOBalance=item.CurrentPTOBalance,
                    combinedArray.push(existingEntry); // Add updated entry to combined array
                } else {
                    // Add new entry with ID 0
                    combinedArray.push({
                        ID: 0,
                        DayDate: item.DayDate,
                        Hours: item.Hours,
                        PreviousPTOBalance:item.PreviousPTOBalance,
                        CurrentPTOBalance:item.CurrentPTOBalance,
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
            // let url = `https://synergycomcom.sharepoint.com/sites/Billing.Timesheet/SitePages/AccessDenied.aspx?`
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
                                <div className="media-m-2 media-p-1">
                                    <div className="my-2">
                                        <div className="row pt-2 px-2">
                                            <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>Employee Name</label>
                                                    <input className="txtEmployeeName form-control" required={true} name="EmployeeName" title="Employee Name" value={this.state.EmployeeName} disabled />
                                                </div>
                                            </div>
                                            <div className={"col-md-3"}>
                                                <div className="light-text-readonly">
                                                    <label>PTO Balance</label>
                                                    <input className="txtPTOBalance form-control" required={true} name="PTOAvailableBalance" title="PTO Available Balance" value={this.state.PTOData.PTOAvailableBalance} disabled />
                                                </div>
                                            </div>
                                            <div className={"col-md-6"}>
                                                <div className="light-text-readonly">
                                                    <label>Synergy Manager(s)</label>
                                                    <div className={'div-multi-manager'} title="Synergy Manager(s)">
                                                        {this.state.SynergyManagerNames.map((name) => <div>{name}</div>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* PTO Type */}
                                    {/* <div className="light-box my-2 ml-2 p-2" id="divTimeOffType">
                                        <h6 className="">Time Off Type<span className="mandatoryhastrick">*</span></h6>
                                        <div className="row">
                                           {this.bindTimeOffTypes()}
                                        </div>
                                        </div> */}
                                    <div className="row pt-2 px-2">

                                        {/* <div className="col-md-3">
                                                                <div className="custom-dropdown">
                                                                    <SearchableDropdown label="Time Off Type" Title="Time Off Type" name="TimeOffType"  id="TimeOffType" placeholderText="Select Time Off" className="" selectedValue={this.state.TimeOffType} optionLabel={'Title'} optionValue={'Title'} OptionsList={this.state.TimeOffTypesObj} onChange={(selectedOption, actionMeta) => { this.handleChangeEvents(selectedOption, actionMeta) }} isRequired={true} refElement={this.TimeOffType} noOptionsMessage="No Time Off Type" isCustomStylesApplicable={true} disabled={this.state.isDisabled}></SearchableDropdown>
                                                                </div>
                                           </div> */}
                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">From Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker-disabled-dates" id="divFromDate">
                                                    <CustomDatePicker
                                                        handleChange={this.handleFromoDate}
                                                        selectedDate={this.state.FromDate}
                                                        className='form-control'
                                                        id='dateFrom Date'
                                                        labelName='From Date'
                                                        isDisabled={this.props.spContext.userId!=this.state.EmployeeId}
                                                        ref={this.From}
                                                        isDateRange={false}
                                                        minDate={new Date(this.state.DateOfJoining)}
                                                        maxDate={new Date(`12/31/${new Date().getFullYear()}`)}
                                                        Day={'Monday'}
                                                    />
                                                    {/* <DatePicker onDatechange={this.handleFromorToDate} selectedDate={this.state.FromDate} isDisabled={this.state.isDisabled} startDate={new Date(this.state.DateOfJoining)} endDate={new Date(`12/31/${new Date().getFullYear()}`)} id="txtFromDate" title="From Date" /> */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="light-text div-readonly">
                                                <label className="z-in-9">To Date<span className="mandatoryhastrick">*</span></label>
                                                <div className="custom-datepicker" id="divToDate">
                                                    <DatePicker onDatechange={this.handleFromorToDate} selectedDate={this.state.ToDate} isDisabled={true} startDate={new Date(this.state.DateOfJoining)} endDate={new Date(`12/31/${new Date().getFullYear()}`)} id="txtToData" title="To Date" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* <div className="col-md-3">
                                            <div className='light-text'>
                                                <label>{"Total Hours"}
                                                    <span className="mandatoryhastrick">*</span>
                                                </label>
                                                <input className="form-control" type={"text"} title={"Total Hours"} placeholder="" value={this.state.TotalHours}
                                                    required={true} onChange={this.handleChangeEvents} name={"TotalHours"} ref={this.TotalHours} autoComplete="off" disabled={this.state.isDisabled} maxLength={250} id={"txtTotalHours"}
                                                />
                                            </div>
                                        </div> */}
                                    </div>
                                    {this.BindTimeOffTable()}
                                    <div className="light-box my-2 ml-2 p-2 text-center divInfo"><p className="TextInfo">All requests are to be turned into Manager for approval at least 5 working days prior to start of requested time off.<br></br>Requests for PTOS need to be turned into approving manager upon your return to work<br></br>*PTO Cash Out is only available upon separation from Synergy Computer Solutions, Inc.</p></div>

                                    {/* {this.state.showHRSection?this.bindHRSection():''} */}

                                    <div className="media-px-12,col-md-9">
                                        <div className="light-text height-auto">
                                            <label className="floatingTextarea2 top-11">Comments</label>
                                            <textarea className="position-static form-control requiredinput mt-3" ref={this.Comments} onChange={this.handleChangeEvents} value={this.state.Comments} maxLength={500} id="txtComments" name="Comments" disabled={false} title='Comments'></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-1" id="">
                                    <div className="col-sm-12 text-center my-2" id="">
                                        {this.state.ButtonsVisibility.Approve && <button type="button" id="btnApprove" onClick={this.handleActions} className="SubmitButtons btn" title='Approve'>Approve</button>}
                                        {this.state.ButtonsVisibility.Reject && <button type="button" id="btnReject" onClick={this.handleActions} className="RejectButtons btn" title='Reject'>Reject</button>}
                                        {this.state.ButtonsVisibility.Revoke && <button type="button" id="btnRevoke" onClick={this.handleActions} className="txt-white CancelButtons bc-burgundy btn" title='Revoke'>Revoke</button>}
                                        {this.state.ButtonsVisibility.Withdraw && <button type="button" id="btnWithdraw" onClick={this.handleActions} className="SaveButtons btn" title='Withdraw'>Withdraw</button>}
                                        {this.state.ButtonsVisibility.Submit && <button type="button" className="SubmitButtons btn" id="btnSubmit" onClick={this.showConfirmSubmit} title='Submit'>Submit</button>}
                                        <button type="button" title="Cancel" className="CancelButtons btn" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                </div>

                                {this.state.CommentsHistory.length > 0 ? <><div className="light-box m-1 p-2 pt-3">
                                    <h4>History</h4>
                                    <div className='divActionHistory'>
                                        <table className="table table-bordered m-0 timetable">
                                            <thead className='ActionHistoryHead'>
                                                <tr>
                                                    {/* <th className="">Action By</th> */}
                                                    <th className="" style={{ width: '250px' }}>Action By</th>
                                                    <th className="" style={{ width: '150px' }}>Status</th>
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
                </React.Fragment >
            );
        }
    }
}
export default TimeOffRequestForm

