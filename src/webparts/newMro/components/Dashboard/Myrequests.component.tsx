import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
export interface MyRequestsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MyRequestsState {
    Requests: Array<Object>;
    loading:boolean;
    message : string;
    title : string;
    showHideModal : boolean;
    isSuccess : boolean;
    comments :  string;
    Action : string;
    errorMessage: string;
    ItemID : Number;
    TimesheetID:string;
    redirect:boolean;
}

class MyRequests extends React.Component<MyRequestsProps, MyRequestsState> {
    constructor(props: MyRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Requests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,TimesheetID:'',redirect:false};
    }

    public componentDidMount() {
        this.MyRequests();
    }
// this function is used to get 1 month records of weeklytime data of the current logged in user from weeklytimesheet list
    private MyRequests = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '"+date+"'"

        var filterString = "Initiator/Id eq '"+userId+"' "+filterQuery

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("Initiator").select('Initiator/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let date;
                    if(!["",undefined,null].includes(d.WeekStartDate)){
                        date = new Date(d.WeekStartDate.split('-')[1]+'/'+d.WeekStartDate.split('-')[2].split('T')[0]+'/'+d.WeekStartDate.split('-')[0])
                        date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                    }

                    Data.push({
                        Id : d.Id,
                        Date : date,
                        Company: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : this.getStatus(d.Status),
                    })
                }
                // console.log(Data);
                this.setState({ Requests: Data,loading: false });
                // document.getElementById('txtTableSearch').style.display = 'none';
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    private getStatus(value){
        let Status=value
        if(value =="approved by Manager")
        {
            Status = "Approved by Reporting Manager"
        }
        else if(value == "rejected by Manager"){
                Status = "Rejected by Reporting Manager"
            }
        else if(value =="rejected by Synergy")
            {
                Status = "Rejected by Synergy"
            }
        return Status
    }
    private  handleRowClicked = (row) => {
        let ID = row.Id
        this.setState({TimesheetID:ID,redirect:true})
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
            },
            {
                name: "Week Start Date",
                selector: (row, i) => row.Date,
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Company,
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                sortable: true,
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                sortable: true
            }
        ];
        if(this.state.redirect){
            let url = `/WeeklyTimesheet/${this.state.TimesheetID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Requests} fileName={'My Timesheets'} showExportExcel={false} showAddButton={true} customBtnClass='px-1 text-right' navigateOnBtnClick={`/WeeklyTimesheet`} btnDivID='divAddNewWeeklyTimeSheet' btnSpanID='newWeeklyTimeSheet' btnCaption=' New' btnTitle='New Weekly Timesheet' searchBoxLeft={false} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default MyRequests