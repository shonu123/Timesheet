import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import ModalApprovePopUp from '../Shared/ModalApprovePopUp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { StatusType } from '../../Constants/Constants';

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
    // pageNumber:number;
    // sortBy:number;
    // sortOrder:boolean;
}

class MyRequests extends React.Component<MyRequestsProps, MyRequestsState> {
    constructor(props: MyRequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Requests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.ReviewerApproval();
    }

    private ReviewerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-31);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and WeekStartDate ge '"+date+"'"

        var filterString = "Initiator/Id eq '"+userId+"'"+filterQuery

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("Initiator").select('Initiator/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date;
                    if(!["",undefined,null].includes(d.WeekStartDate)){
                        date = new Date(d.WeekStartDate)
                        date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                    }

                    Data.push({
                        Id : d.Id,
                        Date : date,
                        Company: d.ClientName,
                        PendingWith: d.PendingWith == "Approver" ||d.PendingWith == "Manager" ?"Reporting Manager":d.PendingWith,
                        Status : d.Status=='rejected by Synergy'?'Rejected by Synergy':d.Status=='rejected by Manager'?'Rejected by Manager':d.Status,
                    })
                }
                console.log(Data);
                this.setState({ Requests: Data });
                setTimeout(() => {
                    this.setState({ loading: false });
                      }, 1500);
                // document.getElementById('txtTableSearch').style.display = 'none';
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
                // width: '100px'
            },
            {
                name: "Week Start Date",
                selector: (row, i) => row.Date,
                // width: '250px',
                sortable: true
            },
            {
                name: "Client",
                selector: (row, i) => row.Company,
                // width: '150px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                sortable: true,
                // width: '250px'
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                // width: '100px',
                sortable: true

            }
        ];
        return (
            <React.Fragment>
            {/* <h1>Initiator Screen</h1> */}

                {/* <div style={{ paddingLeft: '10px' }} className="px-1 text-right" id='divAddNewWeeklyTimeSheet'>
                    <NavLink title="New Weekly Timesheet"  className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                        <span className='add-button' id='newWeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </div> */}
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Requests} fileName={'My Requests'} showExportExcel={false} showAddButton={true} customBtnClass='px-1 text-right' navigateOnBtnClick={`/WeeklyTimesheet`} btnDivID='divAddNewWeeklyTimeSheet' btnSpanID='newWeeklyTimeSheet' btnCaption=' New' btnTitle='New Weekly Timesheet' searchBoxLeft={false}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default MyRequests