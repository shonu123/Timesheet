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
export interface MyPTOsProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}
export interface MyPTOsState {
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
    PTOID:string;
    redirect: boolean;
}

class MyPTOs extends React.Component<MyPTOsProps, MyPTOsState> {
    constructor(props: MyPTOsProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Requests: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,PTOID:'',redirect: false};
    }

    public componentDidMount() {
        this.MyPTOs();
    }
// this function is used to get 1 month records of weeklytime data of the current logged in user from weeklytimesheet list
    private MyPTOs = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        let dateFilter = new Date()
        dateFilter.setDate(new Date().getDate()-60);
        let date = `${dateFilter.getMonth() + 1}/${dateFilter.getDate()}/${dateFilter.getFullYear()}`
        var filterQuery = "and From ge '"+date+"'"

        var filterString = "Employee/Id eq '"+userId+"' "+filterQuery

        sp.web.lists.getByTitle('PTO').items.top(2000).filter(filterString).expand("Employee").select('Employee/Title','*').orderBy('Modified', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let fromDate = new Date(d.From)
                    let toDate = new Date(d.To)

                    Data.push({
                        Id : d.Id,
                        Client: d.Client,
                        EmployeeType: d.EmployeeType,
                        PTOType: d.PTOType,
                        FromDate : fromDate.toLocaleDateString('en-US'),
                        ToDate: toDate.toLocaleDateString('en-US'),
                        TotalHrs: parseFloat(d.TotalHours),
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
        this.setState({PTOID:ID,redirect:true})
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
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/PTOForm/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
            },
            {
                name: "Client",
                selector: (row, i) => row.Client,
                sortable: true
            },
            {
                name: "Employee Type",
                selector: (row, i) => row.EmployeeType,
                sortable: true
            },
            {
                name: "PTO Type",
                selector: (row, i) => row.PTOType,
                sortable: true
            },
            {
                name: "From",
                selector: (row, i) => row.FromDate ,
                sortable: true
            },
            {
                name: "To",
                selector: (row, i) => row.ToDate,
                sortable: true
            },
            {
                name: "Total Hours",
                selector: (row, i) => row.TotalHrs,
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
            let url = `/PTOForm/${this.state.PTOID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Requests} fileName={'My PTOs'} showExportExcel={false} showAddButton={true} customBtnClass='px-1 text-right' navigateOnBtnClick={`/PTOForm`} btnDivID='divAddNewWeeklyTimeSheet' btnSpanID='newWeeklyTimeSheet' btnCaption=' New' btnTitle='New PTO' searchBoxLeft={false} onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            {this.state.loading && <Loader />}
            </React.Fragment> 
        );
    }
}
export default MyPTOs