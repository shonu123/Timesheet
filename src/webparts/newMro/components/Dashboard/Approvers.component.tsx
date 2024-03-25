import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';

export interface ApproversProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ApproversState {
    // Approvers: Array<Object>;
    ReportingManager: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number
    // pageNumber:number;
    // sortBy:number;
    // sortOrder:boolean;
}

class ApproversApprovals extends React.Component<ApproversProps, ApproversState> {
    constructor(props: ApproversProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {ReportingManager: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.ReportingManagerApproval();
    }

    private ReportingManagerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '"+date+"'"
        var filterString = "ReportingManager/Id eq '"+userId+"' and PendingWith eq 'Manager' and Status eq '"+StatusType.Submit+"'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString+filterQuery).expand("ReportingManager").select('ReportingManager/Title','*').orderBy('WeekStartDate,DateSubmitted', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.WeekStartDate)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EmployeName: d.Name,
                        PendingWith: d.PendingWith,
                        Status : d.Status,
                        BillableTotalHrs: d.WeeklyTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        TotalBillable:d.BillableTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        WeeklyTotalHrs: d.GrandTotal
                    })
                }
                console.log(Data);
                this.setState({ ReportingManager: Data,loading:false });
                this.setState({ loading: false });
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
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
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/WeeklyTimesheet/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Date",
                selector: (row, i) => row.Date,
                width: '100px',
                sortable: true
            },
            {
                name: "Employee Name",
                selector: (row, i) => row.EmployeName,
                sortable: true
            },
            {
                name: "Pending With",
                //selector: 'VendorName',
                selector: (row, i) => row.PendingWith,
                // width: '180px',
                sortable: true

            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                sortable: true

            },
            {
                name: "Billable Hours",
                selector: (row, i) => row.BillableTotalHrs,
                sortable: true,
                // width: '135px'
            },
            {
                name: "OT Hours",
                selector: (row, i) => row.OTTotalHrs,
                width: '110px',
                sortable: true,
            },
            {
                name: "Non-Billable Hours",
                selector: (row, i) => row.NonBillableTotalHrs,
                sortable: true,
                // width: '200px'
            },
            {
                name: "Total Hours",
                selector: (row, i) => row.WeeklyTotalHrs,
                sortable: true
            }
        ];
        return (
            <React.Fragment>
            {/* <h1>Approver Screen</h1> */}
            <div>
                <div className='table-head-1st-td'>
                    {/* <TableGenerator columns={columns} data={this.state.ReportingManager} fileName={'My Approvals'} showExportExcel={false} searchBoxLeft={true} showAddButton={false}></TableGenerator> */}

                    <TableGenerator columns={columns} data={this.state.ReportingManager} fileName={'My Approvals'} showExportExcel={false}
                    showAddButton={false} customBtnClass='' btnDivID='' navigateOnBtnClick='' btnSpanID='newEmployeeMasterForm' btnCaption='' btnTitle='' searchBoxLeft={true}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default ApproversApprovals