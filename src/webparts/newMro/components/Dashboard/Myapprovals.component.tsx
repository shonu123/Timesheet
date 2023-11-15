import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { ApprovalStatus } from '../../Constants/Constants';
export interface MyapprovalsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface MyapprovalsState {
    approvals: Array<Object>;
    loading:boolean;
    pageNumber:number;
    sortBy:number;
    sortOrder:boolean;
}

class Myapprovals extends React.Component<MyapprovalsProps, MyapprovalsState> {
    constructor(props: MyapprovalsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        var lsMyrequests = localStorage.getItem('PrvData');
        let MyrequestsJson =  lsMyrequests != 'null' && lsMyrequests != undefined && lsMyrequests != null ? JSON.parse(lsMyrequests):null;
        this.state = {approvals: [], loading:true,
            pageNumber:MyrequestsJson != null && MyrequestsJson.tab =='myapprovals'? MyrequestsJson.PageNumber:1,
            sortBy:MyrequestsJson != null && MyrequestsJson.tab =='myapprovals' ? MyrequestsJson.sortBy:1,
            sortOrder:MyrequestsJson != null && MyrequestsJson.tab =='myapprovals' && MyrequestsJson.sortOrder=='asc' ? true:false,
        };
    }
    public componentDidMount() {
        //console.log(this.props);
        this.getUserGroups();
    }

    public componentDidUpdate(){

    }


    private getUserGroups = async () => {
        let qryAssignedTO = '';
        let groups = await sp.web.currentUser.groups();
        let mroGroups=groups.filter(c=>c.Title.includes('MRO'));
        mroGroups.forEach(grp=>{
            qryAssignedTO += ' or AssignToId eq ' + grp.Id;
        });
        mroGroups.forEach(grp=>{
            qryAssignedTO += ' or UrgentApprovalsId eq ' + grp.Id;
        });
        this.loadListData(qryAssignedTO);
    }
    private loadListData = (qryAssignedTO) => {
        let now = new Date();
        var last90days=new Date(now.setDate(now.getDate()-90));
        let currentDate = new Date()
        const userId = this.props.spContext.userId;
        var filterString = `(Modified le datetime'${currentDate.toISOString()}' and Modified ge datetime'${last90days.toISOString()}') and (AssignToId eq ${userId} ${qryAssignedTO}) and Status ne 'Approved' and Status ne '${ApprovalStatus.Withdraw}'`;
        sp.web.lists.getByTitle('PurchaseRequest').items.top(2000).filter(filterString).expand("Author", "Requisitioner").select('Author/Title', 'Requisitioner/Title', '*').orderBy('Modified', false).get()
            .then((response) => {
                this.setState({approvals: response,loading:false });
                //console.log(this.state.approvals);
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    
    private onPageChange =(pageIndex)=>{
        this.setState({pageNumber: pageIndex});  
    }
    private sortOrder =(event,sortDirection)=>{
        this.setState({sortBy: event.id,sortOrder:sortDirection});     
    }

    private storData=(event)=>{
        var lsMyrequests = JSON.parse(localStorage.getItem('PrvData'));
        lsMyrequests.PageNumber =this.state.pageNumber;
        lsMyrequests.sortOrder =this.state.sortOrder;
        lsMyrequests.sortBy =this.state.sortBy;
        lsMyrequests.tab ='myapprovals';
        localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
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
                                <NavLink title="Edit" onClick={this.storData} className="csrLink ms-draggable" to={`/purchaserequest/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Plant",
                //selector: "Plant",
                selector: (row, i) => row.Plant,
                width: '100px',
                sortable: true
            },
            {
                name: "Department",
                //selector: "Department",
                selector: (row, i) => row.Department,
                sortable: true
            },
            {
                name: "Vendor",
                //selector: 'VendorName',
                selector: (row, i) => row.VendorName,
                sortable: true

            },
            {
                name: "Requisitioner",
                //selector: "Requisitioner",
                selector: (row, i) => row.Requisitioner,
                sortable: true,
                cell: record => {
                    return (
                        record.Requisitioner.Title
                    );
                },
                width: '135px'
            },
            {
                name: "Created",
                //selector: 'Created',
                selector: (row, i) => row.Created,
                width: '110px',
                sortable: true,
                cell: record => {
                    return (
                        new Date(record.Created).toLocaleDateString()
                    );
                },
            },
            {
                name: "Total Amount",
                //selector: "TotalAmount",
                selector: (row, i) => row.TotalAmount,
                sortable: true,
                width: '100px'
            },
            {
                name: "Status",
                //selector: "Status",
                selector: (row, i) => row.Status,
                sortable: true
            },
            {
                name: "Description",
                //selector: 'Description',
                selector: (row, i) => row.Description,
                //width: '135px',
                sortable: true
            }
        ];
        return (
            <React.Fragment>
            {this.state.loading && <Loader />} 
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.approvals} fileName={'My Approval'} showExportExcel={false} onChange={this.onPageChange} onSortChange={this.sortOrder} prvPageNumber={this.state.pageNumber} prvDirection={this.state.sortOrder} prvSort={this.state.sortBy}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default Myapprovals;