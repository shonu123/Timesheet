import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { ApprovalStatus } from '../../Constants/Constants';

export interface PendingProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface PendingState {
    approvals: Array<Object>;
    loading:boolean;
    showHideModal: boolean;
    isSuccess: boolean;
    pageNumber:number;
    sortBy:number;
    sortOrder:boolean;
}

class Pending extends React.Component<PendingProps,PendingState> {
    constructor(props: PendingProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        let lsMyrequests = localStorage.getItem('PrvData');
        let MyrequestsJson =  lsMyrequests != 'null' && lsMyrequests != undefined && lsMyrequests != null ? JSON.parse(lsMyrequests):null;
        this.state = {approvals: [],loading:true,showHideModal: false,isSuccess: true,
            pageNumber:MyrequestsJson != null && MyrequestsJson.tab =='Pending'? MyrequestsJson.PageNumber:1,
            sortBy:MyrequestsJson != null && MyrequestsJson.tab =='Pending' ? MyrequestsJson.sortBy:1,
            sortOrder:MyrequestsJson != null && MyrequestsJson.tab =='Pending' && MyrequestsJson.sortOrder=='asc' ? true:false,
        };
    
    }
    public componentDidMount() {
        //console.log(this.props);
        this.loadListData();
    }
    private loadListData = () => {
        let now = new Date();
        let addonemoreday = new Date(now.getTime() + 86400000);
        let last30days = new Date(now.setDate(now.getDate() - 60));

        const userId = this.props.spContext.userId;
        var filterString = `(IsActive ne 0 and Status ne 'Approved' and Status ne 'Purchasing Team Updated' and Status ne '${ApprovalStatus.Withdraw}') and (Modified ge datetime'${last30days.toISOString()}' and Modified le datetime'${addonemoreday.toISOString()}')`;
        sp.web.lists.getByTitle('PurchaseRequest').items.top(4000).filter(filterString).expand("Author", "Requisitioner").select('Author/Title', 'Requisitioner/Title', '*').orderBy('Created', false).get()
            .then((response) => {
                this.setState({approvals: response,loading:false});
                //console.log(this.state.approvals);
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    private onError = () => {
        this.setState({ showHideModal: true, loading: false, isSuccess: false});
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
        lsMyrequests.tab ='Pending';
        localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
    }
    
    public render() {
        const columns = [
            {
                name: "View",
                //selector: "Id",
                selector: (row, i) => row.Id,
                export: false,
                cell: record => {
                    return (
                        <React.Fragment>
                            <div style={{ paddingLeft: '10px' }}>
                            <NavLink  onClick={this.storData} title="View" className="csrLink ms-draggable" to={`/purchaserequest/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
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
                width: '135px',
                sortable: true
            },
            {
                name: "Vendor",
                selector: 'VendorName',
                sortable: true

            },
            {
                name: "Requisitioner",
                //selector: "Requisitioner.Title",
                selector: (row, i) => row.Requisitioner.Title,
                width: '135px',
                cell: record => {
                    return (
                        record.Requisitioner.Title
                    );
                },
                sortable: true,
            },
            // {
            //     name: "Buyer",
            //     selector: 'Buyer',
            //     sortable: true

            // },
            // {
            //     name: "Project Code",
            //     selector: 'ProjectCode',
            //     sortable: true

            // },
            // {
            //     name: "Commodity Category",
            //     selector: 'CommodityCategory',
            //     sortable: true

            // },
            {
                name: "Created",
                //selector: 'Created',
                selector: (row, i) => row.Created,
                sortable: true,
                cell: record => {
                    return (
                        new Date(record.Created).toLocaleDateString()
                    );
                },
                width: '110px',
            },
            // {
            //     name: "Processed",
            //     selector: 'isProcessed',
            //     sortable: true,
            //     cell: record => {
            //         return ((record.IsProcessed && record.CMSMstr !="" && record.CMSMstr !=null)?record.IsProcessed='Processed':(record.IsProcessed?record.IsProcessed='Sent to CMS':record.IsProcessed='Not Processed'));
            //     },
            //     width: '100px',
            // },
            {
                name: "Description",
                //selector: 'Description',
                selector: (row, i) => row.Description,
                //width: '135px',
                sortable: true
            },
            {
                name: "Total Amount",
                //selector: "TotalAmount",
                selector: (row, i) => row.TotalAmount,
                sortable: true,
                width: '100px'
            },
            
            
        ];
        return (
            <React.Fragment>
            <style>
            .confirm-box__overlay{ 'background-color: rgb(0 0 0 / 32%)!important;' }
            </style>
            {this.state.loading && <Loader />}
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.approvals} fileName={'Pending'} showExportExcel={false} onChange={this.onPageChange} onSortChange={this.sortOrder} prvPageNumber={this.state.pageNumber} prvDirection={this.state.sortOrder} prvSort={this.state.sortBy}></TableGenerator>
                </div>
            </div>
            </React.Fragment>
        );
    }
}

export default Pending;