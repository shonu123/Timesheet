import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import DateUtilities from '../../Utilities/DateUtilities';
import CommonUtilities from '../../Utilities/CommonUtilities';

export interface MyRequestsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MyRequestsState {
    Requests: Array<Object>;
    loading: boolean;
    message: string;
    title: string;
    showHideModal: boolean;
    isSuccess: boolean;
    comments: string;
    Action: string;
    errorMessage: string;
    ItemID: Number;
    TimesheetID: string;
    redirect: boolean;
}

class MyRequests extends React.Component<MyRequestsProps, MyRequestsState> {
    constructor(props: MyRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = { Requests: [], loading: false, message: '', title: '', showHideModal: false, isSuccess: true, comments: '', Action: '', errorMessage: '', ItemID: 0, TimesheetID: '', redirect: false };
    }

    public componentDidMount() {
        this.MyRequests();
    }
    // this function is used to get 1 month records of weeklytime data of the current logged in user from weeklytimesheet list
    private MyRequests = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date();
        dateFilter.setDate(new Date().getDate() - 366);
        let date = DateUtilities.getDateMMDDYYYY(dateFilter);
        try {
            let EmpFilterQuery = `Employee/Id eq '${userId}' and IsActive eq 1`;
            let Employees = await sp.web.lists.getByTitle('Employees').items.top(5000).filter(EmpFilterQuery).expand("Employee").select('Employee/Title', '*').getAll();
            let EmpMatrixID = Employees.length ? Employees[0].Id : 0;
            var filterQuery = `WeekStartDate ge '${date}' and Initiator/Id eq '${userId}' and EmpMatrixID eq '${EmpMatrixID}'`;

            sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterQuery).expand("Initiator").select('Initiator/Title', '*').orderBy('Modified', false).getAll()
                .then((response) => {
                    // console.log(response)
                    let Data = [];
                    response.sort((a, b) => b.Id - a.Id);
                    for (const d of response) {
                        let date;
                        if (!["", undefined, null].includes(d.WeekStartDate)) {
                            date = new Date(DateUtilities.GetDateMMDDYYYYAsInList(d.WeekStartDate));
                        }

                        Data.push({
                            Id: d.Id,
                            Date: DateUtilities.getDateMMDDYYYY(date),
                            DateForGrid: `<span class='d-none'>${DateUtilities.getDateYYYYMMDDForSorting(date)}</span>${DateUtilities.getDateMMDDYYYY(date)}`,
                            Company: d.ClientName,
                            PendingWith: d.PendingWith == "Approver" || d.PendingWith == "Manager" ? "Reporting Manager" : d.PendingWith,
                            Status: CommonUtilities.getTSStatus(d.Status),
                            StatusForGrid: `<span class='${CommonUtilities.getStatusClass(d.Status)}' title='${CommonUtilities.getTSStatus(d.Status)}'>${CommonUtilities.getTSStatusInShortForm(d.Status)}</span>`,
                        })
                    }
                    // console.log(Data);
                    this.setState({ Requests: Data, loading: false });
                    // document.getElementById('txtTableSearch').style.display = 'none';
                }).catch(err => {
                    console.log('Failed to fetch data.', err);
                });
        }
        catch (err) {
            console.log('Failed to load My Time Offs', err);
        }
    }
    private handleRowClicked = (row, Id?) => {
        let ID = row.Id ? row.Id : Id;
        this.setState({ TimesheetID: ID, redirect: true })
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
                                <NavLink title="Edit" className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Week Start Date",
                selector: (row, i) => row.DateForGrid,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.DateForGrid }} onClick={(event) => this.handleRowClicked(event, row.Id)} />,
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Company,
                sortable: true
            },
           {
                name: "Status",
                selector: (row, i) => row.Status,
                cell: row => <div className='' dangerouslySetInnerHTML={{ __html: row.StatusForGrid }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
                width: '220px',
                sortable: true
            },
        ];
        const searchKeys = ['Date', 'Company', 'Status'];
        if (this.state.redirect) {
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
            return (<Navigate to={url} />);
        }
        return (
            <React.Fragment>
                <div>
                    <div className=''>
                        <TableGenerator columns={columns} searchKeys={searchKeys} data={this.state.Requests} fileName={'My Timesheets'} showExportExcel={false} showAddButton={true} customBtnClass='px-1 text-right' navigateOnBtnClick={`/WeeklyTimesheet`} btnDivID='divAddNewWeeklyTimeSheet' btnSpanID='newWeeklyTimeSheet' btnCaption=' New' btnTitle='New Weekly Timesheet' searchBoxLeft={false} onRowClick={this.handleRowClicked}></TableGenerator>
                    </div>
                </div>
                {this.state.loading && <Loader />}
            </React.Fragment>
        );
    }
}
export default MyRequests