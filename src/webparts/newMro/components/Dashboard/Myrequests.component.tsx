import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import Loader from '../Shared/Loader';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import {ApprovalStatus} from '../../Constants/Constants';

export interface MyrequestsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface MyrequestsState {
    requests: Array<Object>;
    loading:boolean;
    pageNumber:number;
    sortBy:number;
    sortOrder:boolean;
    searchText:string;

}

class Myrequests extends React.Component<MyrequestsProps, MyrequestsState> {
    constructor(props: MyrequestsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        var lsMyrequests = localStorage.getItem('PrvData');
         let MyrequestsJson =  lsMyrequests != 'null' && lsMyrequests != undefined && lsMyrequests != null ? JSON.parse(lsMyrequests):null;
        this.state = {
            requests: [],
            loading:true,
            pageNumber:MyrequestsJson != null && (MyrequestsJson.tab =='myrequests'||MyrequestsJson.tab =='home'||MyrequestsJson.tab =='dashboard')? MyrequestsJson.PageNumber:1,
            sortBy:MyrequestsJson != null && (MyrequestsJson.tab =='myrequests'||MyrequestsJson.tab =='home'||MyrequestsJson.tab =='dashboard')? MyrequestsJson.sortBy:1,
            sortOrder:MyrequestsJson != null && (MyrequestsJson.tab =='myrequests'||MyrequestsJson.tab =='home'||MyrequestsJson.tab =='dashboard') && MyrequestsJson.sortOrder=='asc' ? true:false,
            searchText:MyrequestsJson != null && (MyrequestsJson.tab =='myrequests'||MyrequestsJson.tab =='home'||MyrequestsJson.tab =='dashboard')? MyrequestsJson.searchText:'',
        };
       //.getItem('Myrequests');
    }
    public componentDidMount() {
        this.loadListData();
    }
    private loadListData = () => {
        const userId = this.props.spContext.userId;
        var filterString = `RequisitionerId eq ${userId} and IsActive ne 0 and Status ne '${ApprovalStatus.Withdraw}'`;
        sp.web.lists.getByTitle('PurchaseRequest').items.top(2000).filter(filterString).expand("Author", "Requisitioner").select('Author/Title', 'Requisitioner/Title', '*').orderBy('Modified', false).get()
            .then((response) => {
                this.setState({requests: response,loading:false});
                //console.log(this.state.requests);
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
        lsMyrequests.PageNumber =this.state.pageNumber!=null?this.state.pageNumber:1;
        lsMyrequests.sortOrder =this.state.sortOrder;
        lsMyrequests.sortBy =this.state.sortBy;
        lsMyrequests.tab ='myrequests';
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
                                <NavLink onClick={this.storData} title="Edit" className="csrLink ms-draggable" to={`/purchaserequest/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                }
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
                width: '110px',
                sortable: true
            },
            {
                name: "Vendor",
                //selector: 'VendorName',
                selector: (row, i) => row.VendorName,
                width: '150px',
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
                width: '150px'
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
                width: '135px',
                sortable: true
            },
            {
                name: "Status",
                //selector: "Status",
                selector: (row, i) => row.Status,
                width: '135px',
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
            <div className='table-head-1st-td'>
                <TableGenerator columns={columns} data={this.state.requests} fileName={'My Approval'} showExportExcel={false} onChange={this.onPageChange} onSortChange={this.sortOrder} prvPageNumber={this.state.pageNumber} prvDirection={this.state.sortOrder} prvSort={this.state.sortBy}></TableGenerator>
            </div>
            </React.Fragment>
        );
    }
}

export default Myrequests;