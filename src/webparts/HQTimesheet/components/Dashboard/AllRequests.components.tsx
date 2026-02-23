import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import DateUtilities from '../../Utilities/DateUtilities';
import CommonUtilities from '../../Utilities/CommonUtilities';

export interface AllRequestsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface AllRequestsState {
}

class AllRequests extends React.Component<AllRequestsProps, AllRequestsState> {
    constructor(props: AllRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
    }
    public state = { AllRequests: [], loading: false, message: '', title: '', showHideModal: false, isSuccess: true, comments: '', Action: '', errorMessage: '', ItemID: 0, ExportExcelData: [], TimesheetID: '', redirect: false, isAdmin: false };

    public componentDidMount() {
        this.setState({ loading: true });
        this.AllRequests();
    }
    // this function is used to get 1 month records of weeklytime data of all employees from weeklytimesheet list
    private AllRequests = async () => {
        let userID = this.props.spContext.userId;
        let dateFilter = new Date();
        dateFilter.setDate(new Date().getDate() - 366);
        let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        var TimeSheetFilterQuery = "WeekStartDate ge '" + date + "'";
        let EmpMasterSelQuery = "Employee/ID,Employee/Title,ReportingManager/EMail,Reviewers/EMail,ReportingManager/ID,Reviewers/ID";
        let TimeSheetSelQuery = "Initiator/ID,Initiator/Title,Initiator/EMail,Reviewers/EMail,Reviewers/Id,ReportingManager/Id,ReportingManager/EMail,ReportingManager/Title,*";
        let delegationQuery = "DelegateTo/Id eq '" + userID + "'";
        try {

            let [ApprovalMatrix, WeeklyTimesheets, groups, DelegationData] = await Promise.all([
                sp.web.lists.getByTitle('EmployeeMaster').items.top(5000).select(EmpMasterSelQuery).expand('Employee,ReportingManager,Reviewers').getAll(),
                sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(TimeSheetFilterQuery).expand("Initiator,ReportingManager,Reviewers").select(TimeSheetSelQuery).orderBy('WeekStartDate', false).getAll(),
                sp.web.currentUser.groups(),
                sp.web.lists.getByTitle('Delegations').items.filter(delegationQuery).expand("Authorizer,DelegateTo").select('Authorizer/Title,Authorizer/ID,Authorizer/EMail,DelegateTo/ID,DelegateTo/EMail,*').orderBy('Authorizer/ID', false).getAll(),
            ])
            let userGroups = [], isAdmin = false;
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Dashboard Admins'))
                isAdmin = true;
            let IsCurrUserReviewer = ApprovalMatrix.some(emp =>
                emp.Reviewers?.some(reviewer => reviewer.ID === userID)
            );
            let IsCurrUserManager = ApprovalMatrix.some(emp =>
                emp.ReportingManager?.some(ReportingManager => ReportingManager.ID === userID)
            );

            if (!isAdmin) // filter based on role and delegation
            {
                if (IsCurrUserManager || IsCurrUserReviewer) {
                    //filter only current user timesheets and his reported employees of either manager/reviewer/managerdelegated/reviewerdelegated
                    WeeklyTimesheets = WeeklyTimesheets.filter(timesheet => timesheet.Initiator.ID == userID || timesheet.Reviewers.some(Rev => Rev.Id == userID) || timesheet.ReportingManager.some(RM => RM.Id == userID));
                }
                else if (IsCurrUserManager) {
                    //filter only current user timesheets and his reported employees of either manager/managerdelegated
                    WeeklyTimesheets = WeeklyTimesheets.filter(timesheet => timesheet.Initiator.ID == userID || timesheet.ReportingManager.some(RM => RM.Id == userID));
                }
                else if (IsCurrUserReviewer) {
                    //filter only current user timesheets and his reported employees of either reviewer/reviewerdelegated
                    WeeklyTimesheets = WeeklyTimesheets.filter(timesheet => timesheet.Initiator.ID == userID || timesheet.Reviewers.some(Rev => Rev.Id == userID));
                }
            }

            let Data = [], ExcelData = [];
            WeeklyTimesheets.sort((a, b) => b.Id - a.Id);
            for (const d of WeeklyTimesheets) {
                let Rm = '';
                let ExcelRm = ''
                d.ReportingManager.sort((a, b) => a.Title.localeCompare(b.Title));
                if (d.ReportingManager.length > 0) {
                    for (let r of d.ReportingManager) {
                        Rm += "<div>" + r.Title + "</div>"
                        ExcelRm += r.Title + "\n"
                    }
                }
                let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate));
                let isBillable = true;
                if (d.ClientName.toLowerCase().includes('synergy')) {
                    isBillable = false
                }
                Data.push({
                    Id: d.Id,
                    Date: DateUtilities.getDateMMDDYYYY(date),
                    DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                    EmployeName: d.Initiator.Title,
                    Status: CommonUtilities.getTSStatus(d.Status),
                    StatusForGrid: `<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTSStatus(d.Status)}'>${CommonUtilities.getTSStatusInShortForm(d.Status)}</span>`, 
                    Client: d.ClientName,
                    PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                    BillableHours: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                    OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                    TotalBillableHrs: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                    HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                    PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(2)),
                    TotalHours: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                    RM: ExcelRm,
                    RMForGrid: Rm
                })
                ExcelData.push({
                    Id: d.Id,
                    Date: DateUtilities.getDateMMDDYYYY(date),
                    EmployeName: d.Initiator.Title,
                    Status: CommonUtilities.getTSStatus(d.Status),
                    Client: d.ClientName,
                    PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                    BillableHours: isBillable ? d.WeeklyTotalHrs : JSON.parse(d.SynergyOfficeHrs)[0].Total,
                    OTTotalHrs: d.OTTotalHrs,
                    TotalBillableHrs: d.BillableTotalHrs,
                    HolidayHrs: JSON.parse(d.ClientHolidayHrs)[0].Total,
                    PTOHrs: JSON.parse(d.PTOHrs)[0].Total,
                    TotalHours: d.GrandTotal,
                    RM: ExcelRm
                })
            }

            if (!isAdmin) // if current user is not admin then filter delegation timesheets
            {
                //check if current user is in delegation period as managerdelegated or reviewerdelegated
                let DelgatedRMOrRev = DelegationData
                    .filter(delegation =>
                        this.checkTodayIsInDelegation(delegation.From, delegation.To)
                    )
                    .map(delegation => delegation.Authorizer.ID);
                let getDelTSQry = '';
                if (DelgatedRMOrRev.length) {
                    if (DelgatedRMOrRev.length > 1) {
                        getDelTSQry = '(';
                        for (const AuthorizerId of DelgatedRMOrRev) {
                            getDelTSQry += ` (ReportingManager/Id eq '${AuthorizerId}') or (Reviewers/Id eq '${AuthorizerId}') or`;
                        }
                        getDelTSQry = getDelTSQry.substring(0, getDelTSQry.lastIndexOf(") or"));
                        getDelTSQry += "))";
                    }
                    else {
                        getDelTSQry = `ReportingManager/Id eq '${DelgatedRMOrRev[0]}' or Reviewers/Id eq '${DelgatedRMOrRev[0]}'`;
                    }
                }
                let delTSs = [];
                if (DelgatedRMOrRev.length)
                    delTSs = await sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(5000).filter(getDelTSQry).expand("ReportingManager,Reviewers,Initiator").select('ReportingManager/Title,ReportingManager/EMail,ReportingManager/Id,Reviewers/Title,Reviewers/EMail,Reviewers/Id,Initiator/Title,Initiator/EMail,Initiator/Id,*').orderBy('WeekStartDate,DateSubmitted', false).getAll()
                if (delTSs.length) {
                    delTSs.sort((a, b) => b.Id - a.Id);
                    for (const d of delTSs) {
                        let Rm = '';
                        let ExcelRm = ''
                        d.ReportingManager.sort((a, b) => a.Title.localeCompare(b.Title));
                        if (d.ReportingManager.length > 0) {
                            for (let r of d.ReportingManager) {
                                Rm += "<div>" + r.Title + "</div>"
                                ExcelRm += r.Title + "\n"
                            }
                        }
                        let date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate));
                        let isBillable = true;
                        if (d.ClientName.toLowerCase().includes('synergy')) {
                            isBillable = false
                        }
                        if (Data.findIndex(item => item.Id == d.Id) === -1) {
                            Data.push({
                                Id: d.Id,
                                Date: DateUtilities.getDateMMDDYYYY(date),
                                DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                                EmployeName: d.Initiator.Title,
                                Status: CommonUtilities.getTSStatus(d.Status),
                                StatusForGrid: `<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTSStatus(d.Status)}'>${CommonUtilities.getTSStatusInShortForm(d.Status)}</span>`,
                                Client: d.ClientName,
                                PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                                BillableHours: isBillable ? parseFloat(parseFloat(d.WeeklyTotalHrs).toFixed(2)) : parseFloat(parseFloat(JSON.parse(d.SynergyOfficeHrs)[0].Total).toFixed(2)),
                                OTTotalHrs: parseFloat(parseFloat(d.OTTotalHrs).toFixed(2)),
                                TotalBillableHrs: parseFloat(parseFloat(d.BillableTotalHrs).toFixed(2)),
                                HolidayHrs: parseFloat(parseFloat(JSON.parse(d.ClientHolidayHrs)[0].Total).toFixed(2)),
                                PTOHrs: parseFloat(parseFloat(JSON.parse(d.PTOHrs)[0].Total).toFixed(2)),
                                TotalHours: parseFloat(parseFloat(d.GrandTotal).toFixed(2)),
                                RM: ExcelRm,
                                RMForGrid: Rm
                            })
                            ExcelData.push({
                                Id: d.Id,
                                Date: DateUtilities.getDateMMDDYYYY(date),
                                EmployeName: d.Initiator.Title,
                                Status: CommonUtilities.getTSStatus(d.Status),
                                Client: d.ClientName,
                                PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                                BillableHours: isBillable ? d.WeeklyTotalHrs : JSON.parse(d.SynergyOfficeHrs)[0].Total,
                                OTTotalHrs: d.OTTotalHrs,
                                TotalBillableHrs: d.BillableTotalHrs,
                                HolidayHrs: JSON.parse(d.ClientHolidayHrs)[0].Total,
                                PTOHrs: JSON.parse(d.PTOHrs)[0].Total,
                                TotalHours: d.GrandTotal,
                                RM: ExcelRm
                            })
                        }
                    }

                }
            }
            this.setState({ AllRequests: Data, ExportExcelData: ExcelData, loading: false, isAdmin: isAdmin });
        }
        catch (err) {
            console.log('Failed to fetch data.', err);
        }
    }
    private handleRowClicked = (row, Id?) => {
        let ID = row.Id ? row.Id : Id;
        this.setState({ TimesheetID: ID, redirect: true });
    }
    private checkTodayIsInDelegation(startDate, endDate) {
        let today = new Date();
        let start = new Date(startDate);
        let end = new Date(endDate);
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today >= start && today <= end) {
            return true;
        }
        return false;
    }
    public render() {
        const columns = [
            {
                name: "View",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                                <NavLink title="View" className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Date",
                selector: (row, i) => row.DateForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.DateForGrid }} onClick={(event) => this.handleRowClicked(event, row.Id)} />,
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.RMForGrid,
                cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.RMForGrid }} onClick={(event) => this.handleRowClicked(event, row.Id)} />,
                sortable: true
            },
            {
                name: "Hours",
                selector: (row, i) => row.BillableHours,
                sortable: true,
            },
            {
                name: "OT",
                selector: (row, i) => row.OTTotalHrs,
                sortable: true,
            },
            {
                name: "Total Billable",
                selector: (row, i) => row.TotalBillableHrs,
                sortable: true,
            },
            {
                name: "Holiday",
                selector: (row, i) => row.HolidayHrs,
                sortable: true,
            },
            {
                name: "Time Off",
                selector: (row, i) => row.PTOHrs,
                sortable: true,
            },
            {
                name: "Grand Total",
                selector: (row, i) => row.TotalHours,
                sortable: true
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.StatusForGrid }} onClick={(event) => this.handleRowClicked(event, row.Id)} />,
                width: '220px',
                sortable: true
            },
        ];
        const Exportcolumns = [
            {
                name: "Date",
                selector: "Date",
                width: '120px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: "EmployeName",
                sortable: true
            },
            {
                name: "Client",
                selector: "Client",
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: "RM",
                sortable: true
            },
            {
                name: "Hours",
                selector: "BillableHours",
                sortable: true,
            },
            {
                name: "OT Hours",
                selector: "OTTotalHrs",
                width: '120px',
                sortable: true,
            },
            {
                name: "Total Billable Hours",
                selector: "TotalBillableHrs",
                sortable: true,
            },
            {
                name: "Holiday Hours",
                selector: "HolidayHrs",
                sortable: true,
            },
            {
                name: "Time Off Hours",
                selector: "PTOHrs",
                sortable: true,
            },
            {
                name: "Grand Total Hours",
                selector: "TotalHours",
                width: '140px',
                sortable: true
            },
            {
                name: "Status",
                selector: "Status",
                sortable: true
            },
        ];
        if (!this.state.isAdmin) {
            columns.splice(7, 1)
            Exportcolumns.splice(6, 1)
        }
        const searchKeys = ['Date', 'EmployeName', 'Client', 'RM', 'Status', 'BillableHours', 'OTTotalHrs', 'TotalBillableHrs', 'HolidayHrs', 'PTOHrs', 'TotalHours'];

        if (this.state.redirect) {
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
            return (<Navigate to={url} />);
        }
        return (
            <React.Fragment>
                <div className="">
                    <div className="mx-2"><div className="text-right pt-2">
                        <NavLink title="New Weekly Timesheet" className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                            <button type="button" id="btnSubmit" className="SubmitButtons btn">
                                <span className='' id='WeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                            </button></NavLink>
                    </div></div>
                    <div className='c-v-table'>
                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.AllRequests} fileName={'All Timesheets'} showExportExcel={this.state.AllRequests.length ? true : false} searchBoxLeft={true} ExportExcelCustomisedColumns={Exportcolumns} ExportExcelCustomisedData={this.state.ExportExcelData} wrapColumns={["RM", "Client"]} LargeWidthColumns={["EmployeName", "Client", "RM"]} onRowClick={this.handleRowClicked}></TableGenerator>
                    </div>
                </div>
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default AllRequests