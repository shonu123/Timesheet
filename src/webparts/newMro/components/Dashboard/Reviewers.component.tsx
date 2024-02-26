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

export interface ReviewerApprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ReviewerApprovalsState {
    Reviewers: Array<Object>;
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

class ReviewerApprovals extends React.Component<ReviewerApprovalsProps, ReviewerApprovalsState> {
    constructor(props: ReviewerApprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Reviewers: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.ReviewerApproval();
    }

    private ReviewerApproval = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        var filterString = "Reviewers/Id eq '"+userId+"' and PendingWith eq 'Reviewer' and Status eq 'In-Progress'"

        sp.web.lists.getByTitle('WeeklyTimeSheet').items.top(2000).filter(filterString).expand("Reviewers").select('Reviewers/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let date = new Date(d.DateSubmitted)
                    Data.push({
                        Id : d.Id,
                        Date : `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
                        EmployeName: d.Name,
                        Status : d.Status,
                        BillableTotalHrs: d.BillableTotalHrs,
                        OTTotalHrs : d.OTTotalHrs,
                        NonBillableTotalHrs: d.NonBillableTotalHrs,
                        WeeklyTotalHrs: d.WeeklyTotalHrs
                    })
                }
                console.log(Data);
                this.setState({ Reviewers: Data,loading:false });
                this.setState({ loading: false });
                //console.log(this.state.approvals);
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }

    private  updateStatus = async (recordId,Status,Comments) =>{

        let postObject = {
            Status : Status,
            CommentsHistory : Comments
        }
        console.log(postObject);
        this.setState({comments  :''})
        sp.web.lists.getByTitle('WeeklyTimeSheet').items.getById(recordId).update(postObject).then((res) => {
            alert("Record Updated Sucessfully");
            this.setState({showHideModal : false,ItemID:0,message:'',title:'',Action:'',loading: false})
        });
    }

    private handleComments = async (e) =>{
       let value = e.target.value
       this.setState({comments : value})
    }

    private handleApprove = async (e) => {
        this.setState({ loading: true });
        let recordId = this.state.ItemID;
        var filterString = "Id eq '"+recordId+"'"

        let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('CommentsHistory').get()
        console.log(data)
        let commentsObj = JSON.parse(data[0].CommentsHistory)
        commentsObj.push({
            Action : 'Approve',
            Role : 'Reviewer',
            user : this.props.spContext.userDisplayName,
            Comments : this.state.comments,
            Date : new Date().toISOString()
        })
        commentsObj = JSON.stringify(commentsObj);
        // this.setState({comments : comments })
        this.updateStatus(recordId,'Approved',commentsObj)
    }

    private handleReject= async (e) =>{

        let recordId = this.state.ItemID;
        if(['',undefined,null].includes(this.state.comments)){
            this.setState({errorMessage : 'Comments cannot be Blank'})
        }
        else{
            this.setState({ loading: true });
            var filterString = "Id eq '"+recordId+"'"
    
            let data =  await sp.web.lists.getByTitle('WeeklyTimeSheet').items.filter(filterString).select('Comments').get()
            console.log(data)
            let commentsObj = JSON.parse(data[0].Comments)
            commentsObj.push({
                Action : 'Reject',
                Role : 'Reviewer',
                user : this.props.spContext.userDisplayName,
                Comments : this.state.comments,
                Date : new Date().toISOString()
            })
            commentsObj = JSON.stringify(commentsObj);
            this.updateStatus(recordId,'Rejected',commentsObj)
        }
    }
    private handlefullClose = () => {
        this.setState({ showHideModal: false, Action :'', errorMessage : '',ItemID : 0});
    }

    private showPopUp = (e) =>{
        console.log(e.target.id);
        console.log(e.target.dataset);
        console.log(e.target.dataset.name)
        let recordId = parseInt(e.target.id);
        this.setState({ItemID : recordId})
        let name = e.target.dataset.name
        if(name == 'Approve')
        {
            this.setState({message : 'Action : Approve',title : 'Approve', Action : 'Approve'})
        }
        else
        {
            this.setState({message : 'Action : Reject',title : 'Reject', Action : 'Reject'})
        }
        this.setState({showHideModal : true})
    }

    private handleAction = (e) =>{
        if(this.state.Action == 'Approve')
        this.handleApprove(e)
        else
         this.handleReject(e)
    }

    public render() {
        const columns = [
            {
                name: "Edit",
                //selector: "Id",
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
                //selector: "Plant",
                selector: (row, i) => row.Date,
                width: '100px',
                sortable: true
            },
            {
                name: "Employe Name",
                //selector: "Department",
                selector: (row, i) => row.EmployeName,
                sortable: true
            },
            {
                name: "Status",
                //selector: 'VendorName',
                selector: (row, i) => row.Status,
                sortable: true

            },
            {
                name: "Billable Hours",
                //selector: "Requisitioner",
                selector: (row, i) => row.BillableTotalHrs,
                sortable: true,
                width: '135px'
            },
            {
                name: "OT Hours",
                //selector: 'Created',
                selector: (row, i) => row.OTTotalHrs,
                width: '110px',
                sortable: true,
            },
            {
                name: "NonBillable Hours",
                //selector: "TotalAmount",
                selector: (row, i) => row.NonBillableTotalHrs,
                sortable: true,
                width: '200px'
            },
            {
                name: "Total",
                //selector: "Status",
                selector: (row, i) => row.WeeklyTotalHrs,
                sortable: true
            },
            {
                name: "",
                //selector: "Id",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                        <div style={{ paddingLeft: '10px' }} >
                                <FontAwesomeIcon icon={faCheck} id={record.Id} data-name={'Approve'} color='green' size="lg" onClick={this.showPopUp} title='Approve'></FontAwesomeIcon>
                        </div>
                    </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "",
                //selector: "Id",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                    <React.Fragment>
                        <div style={{ paddingLeft: '10px' }}>
                                <FontAwesomeIcon icon={faXmark} id={record.Id} data-name='Reject' color='red' size="lg" onClick={this.showPopUp} title='Reject'></FontAwesomeIcon>
                        </div>
                    </React.Fragment>
                    );
                },
                width: '100px'
            }
        ];
        return (
            <React.Fragment>
            <h1>Reviewer Screen</h1>
            {/* <ModalPopUp title={this.state.modalTitle} modalText={this.state.modalText} isVisible={this.state.showHideModal} onClose={this.handlefullClose} isSuccess={this.state.isSuccess}></ModalPopUp> */}
            <ModalApprovePopUp message={this.state.message} title={this.state.title} isVisible={this.state.showHideModal} isSuccess={false} onConfirm={this.handleAction} onCancel={this.handlefullClose} comments={this.handleComments} errorMessage={this.state.errorMessage} commentsValue={this.state.comments} ></ModalApprovePopUp>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Reviewers} fileName={'Reviewes Approvals'} showExportExcel={false}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}

export default ReviewerApprovals