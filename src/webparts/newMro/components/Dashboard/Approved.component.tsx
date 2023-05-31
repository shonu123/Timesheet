import * as React from 'react';
import { NavLink } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEye } from '@fortawesome/free-solid-svg-icons';
import ModalPopUp from '../Shared/ModalPopUp';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { confirm } from 'react-confirm-box';

export interface ApprovedProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface ApprovedState {
    approvals: Array<Object>;
    loading:boolean;
    showHideModal: boolean;
    isSuccess: boolean;
    pageNumber:number;
    sortBy:number;
    sortOrder:boolean;
    groups:any;
}

class Approved extends React.Component<ApprovedProps,ApprovedState> {
    constructor(props: ApprovedProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        let lsMyrequests = localStorage.getItem('PrvData');
        let MyrequestsJson =  lsMyrequests != 'null' && lsMyrequests != undefined && lsMyrequests != null ? JSON.parse(lsMyrequests):null;     
        this.state = {approvals: [],loading:true,showHideModal: false,isSuccess: true,
            pageNumber:MyrequestsJson != null && MyrequestsJson.tab =='Approved'? MyrequestsJson.PageNumber:1,
            sortBy:MyrequestsJson != null && MyrequestsJson.tab =='Approved' ? MyrequestsJson.sortBy:1,
            sortOrder:MyrequestsJson != null && MyrequestsJson.tab =='Approved' && MyrequestsJson.sortOrder=='asc' ? true:false,groups:[]

        };
    }
    public componentDidMount() {
        //console.log(this.props);
        this.loadListData();
    }
    private  loadListData = async() => {
        let now = new Date();
        let addonemoreday = new Date(now.setDate(now.getDate() + 1)); //new Date(now.getTime() + 86400000);
        let last07days = new Date(now.setDate(now.getDate() - 7));
        let mroGroups = await sp.web.currentUser.groups();
        let Groups =[];
        mroGroups.forEach(grp=>{
            Groups.push(grp.Id);// += ' or ReviewerId eq ' + grp.Id;
        });
        Groups.push(this.props.spContext.userId);
        var filterString = `( IsActive ne 0 and Status eq 'Approved' or Status eq 'Purchasing Team Updated') and (Modified ge datetime'${last07days.toISOString()}' and Modified le datetime'${addonemoreday.toISOString()}') `;
        sp.web.lists.getByTitle('PurchaseRequest').items.top(2000).filter(filterString).expand("Author", "Requisitioner").select('Author/Title', 'Requisitioner/Title', '*').orderBy('Created', false).get()
            .then((response) => {
                let FinalData=[];
                for(let i=0;i<response.length;i++){
                    let MDate = new Date(response[i].Modified);
                    let LastModififedDate = new Date(MDate.setDate(MDate.getDate() + 3));
                    if(!(response[i].isPOProcessed && LastModififedDate > new Date())) FinalData.push(response[i])
                }
                this.setState({approvals: FinalData,loading:false,groups:Groups});
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }
    private onError = () => {
        this.setState({ showHideModal: true, loading: false, isSuccess: false});
    }
    private handleChange = (event) => {
        const formData = {};
        const itemId = parseInt(event.target.id);
        const { name } = event.target;
        const value = event.target.type == 'checkbox' ? event.target.checked : event.target.value;
        formData[name] = value;
        //this.setState({ ItemID:parseInt(event.target.id)});
        const classNames = {container:'confirm-modal',buttons:'btn',confirmButton:'btn-primary',cancelButton:'btn-secondary'};
        const options = {
            labels: {
              confirmable: "Yes",
              cancellable: "No"
            },
            classNames:classNames
          };
        const result = confirm("Are you sure?",options);
        result.then((res1) => {
            if(res1){
            sp.web.lists.getByTitle('PurchaseRequest').items.getById(itemId).update(formData).then((res) => {
                console.log('updated');
                //let approval = this.state.approvals.map(rec=> {if(rec.ID==itemId) {return {...rec, isPOProcessed:true}} else return rec;});
                this.setState({ showHideModal: true, loading: false, isSuccess: true});
                
                }, (Error) => {
                    console.log(Error);
                    this.onError();
                }).catch((err) => {
                    this.onError();
                    console.log(err);
                });
            }
            else{
                return;
            }
        });
    }
    public handleConfirm = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
    }
    public handleCancel = () => {
        this.setState({ showHideModal: false });
        this.loadListData();
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
        lsMyrequests.tab ='Approved';
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
                width: '100px',
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
                width: '150px',
                sortable: true
            },
            {
                name: "Requisitioner",
                //selector: "Requisitioner.Title",
                selector: (row, i) => row.Requisitioner.Title,
                width: '150px',
                cell: record => {
                    return (
                        record.Requisitioner.Title
                    );
                },
                sortable: true,
            },
            {
                name: "Vendor",
                selector: 'VendorName',
                width: '150px',
                sortable: true

            },
            {
                name: "Date Approved",
                //selector: 'Created',
                selector: (row, i) => row.Created,
                sortable: true,
                cell: record => {
                    return (
                        record.DateApproved != null?new Date(record.DateApproved).toLocaleDateString():""
                    );
                },
                width: '135px',
            },
            {
                name: "Processed",
                //selector: 'isPOProcessed',
                selector: (row, i) => row.isPOProcessed,
                sortable: true,
                style:{'text-align':'center'},
                cell: record => {
                    return (<input type="checkbox" name={"isPOProcessed"}
                        checked={record.isPOProcessed} disabled={record.isPOProcessed || (!this.state.groups.includes(record.ReviewerId) && !this.state.groups.includes(record.PurchasingTeamId)) }
                        onChange={this.handleChange}
                        id={record.Id}
                    />);
                },
                width: '100px',
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
                //width: '165px',
                sortable: true
            },
            {
                name: "Total Amount",
                //selector: "TotalAmount",
                selector: (row, i) => row.TotalAmount,
                sortable: true,
                width: '135px'
            },
            
            
        ];
        return (
            <React.Fragment>
            <style>
            .confirm-box__overlay{ 'background-color: rgb(0 0 0 / 32%)!important;' }
            </style>
            <ModalPopUp title={"Success"} modalText={"Record updated successfully"} isVisible={this.state.showHideModal} onClose={this.handleConfirm} isSuccess={this.state.isSuccess} ></ModalPopUp>
            {this.state.loading && <Loader />}
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.approvals} fileName={'Approved'} showExportExcel={false} onChange={this.onPageChange} onSortChange={this.sortOrder} prvPageNumber={this.state.pageNumber} prvDirection={this.state.sortOrder} prvSort={this.state.sortBy}></TableGenerator>
                </div>
            </div>
            </React.Fragment>
        );
    }
}

export default Approved;