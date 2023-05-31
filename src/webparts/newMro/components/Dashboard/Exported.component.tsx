import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';

export interface ExportedProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ExportedState {
    Exported: Array<Object>;
    loading:boolean;
    pageNumber:number;
    sortBy:number;
    sortOrder:boolean;
}

class Exported extends React.Component<ExportedProps,ExportedState> {
    
    constructor(props: ExportedProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        let lsMyrequests = localStorage.getItem('PrvData');
        let MyrequestsJson =  lsMyrequests != 'null' && lsMyrequests != undefined && lsMyrequests != null ? JSON.parse(lsMyrequests):null;
        this.state = {Exported: [],loading:true,
            pageNumber:MyrequestsJson != null && MyrequestsJson.tab =='Exported'? MyrequestsJson.PageNumber:1,
            sortBy:MyrequestsJson != null && MyrequestsJson.tab =='Exported' ? MyrequestsJson.sortBy:1,
            sortOrder:MyrequestsJson != null && MyrequestsJson.tab =='Exported' && MyrequestsJson.sortOrder=='asc' ? true:false 

        };
    }
    public componentDidMount() {
        //console.log(this.props);
        this.loadListData();
    }
    private loadListData = () => {
        let now = new Date();
        let last30days = new Date(now.setDate(now.getDate() - 31));
        let filterQuery =`(IsActive ne 0 and Status eq 'Approved' or Status eq 'Purchasing Team Updated') and Modified ge datetime'${last30days.toISOString()}'`;
        sp.web.lists.getByTitle('PurchaseRequest').items.top(4000).filter(filterQuery).expand("Author", "Requisitioner").select('Author/Title', 'Requisitioner/Title', '*').orderBy('Modified', false).get()
            .then((response) => {
                this.setState({Exported: response,loading:false});
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
        lsMyrequests.tab ='Exported';
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
                            <NavLink title="View" onClick={this.storData} className="csrLink ms-draggable" to={`/purchaserequest/${record.Id}`}>
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
               // selector: "Plant",
                selector: (row, i) => row.Plant,
                width: '100px',
                sortable: true
            },
            {
                name: "Department",
               // selector: "Department",
                selector: (row, i) => row.Department,
                sortable: true,
                width: '135px'
            },
            {
                name: "Vendor",
                selector: 'VendorName',
                sortable: true,
                width: '150px'
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
                width: '110px',
                cell: record => {
                    return (
                        new Date(record.Created).toLocaleDateString()
                    );
                },
            },
            {
                name: "Description",
                //selector: 'Description',
                selector: (row, i) => row.Description,
                //width: '135px',
                sortable: true
            },
            {
                name: "Total Amount",
               // selector: "TotalAmount",
                selector: (row, i) => row.TotalAmount,
                sortable: true,
                width: '135px'
            },
            
            
        ];
        return (
            <React.Fragment>
            {this.state.loading && <Loader />}
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Exported} fileName={'Exported'} showExportExcel={false} onChange={this.onPageChange} onSortChange={this.sortOrder} prvPageNumber={this.state.pageNumber} prvDirection={this.state.sortOrder} prvSort={this.state.sortBy}></TableGenerator>
                </div>
            </div>
            </React.Fragment>
        );
    }
}

export default Exported;