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
        var filterString = "Initiator/Id eq '"+userId+"'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("Initiator").select('Initiator/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date;
                    if(!["",undefined,null].includes(d.DateSubmitted)){
                        date = new Date(d.DateSubmitted)
                        date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                    }

                    Data.push({
                        Id : d.Id,
                        Date : date,
                        Company: d.ClientName,
                        PendingWith: d.PendingWith,
                        Status : d.Status,
                    })
                }
                console.log(Data);
                this.setState({ Requests: Data,loading:false });
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
                width: '100px'
            },
            {
                name: "Date",
                selector: (row, i) => row.Date,
                width: '100px',
                sortable: true
            },
            {
                name: "Company",
                selector: (row, i) => row.Company,
                width: '130px',
                sortable: true
            },
            {
                name: "Pending With",
                selector: (row, i) => row.PendingWith,
                sortable: true,
                width: '135px'
            },
            {
                name: "Status",
                selector: (row, i) => row.Status,
                width: '100px',
                sortable: true

            }
        ];
        return (
            <React.Fragment>
            {/* <h1>Initiator Screen</h1> */}

                <div style={{ paddingLeft: '10px' }} className="px-1 text-right" id='divAddNewWeeklyTimeSheet'>
                    <NavLink title="Edit"  className="csrLink ms-draggable" to={`/WeeklyTimesheet`}>
                        <span className='add-button' id='newWeeklyTimeSheet'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </div>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Requests} fileName={'My Requests'} showExportExcel={false}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default MyRequests