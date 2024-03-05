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

export interface EmployeeMasterViewProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface EmployeeMasterViewState {
    Details: Array<Object>;
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

class EmployeeMasterView extends React.Component<EmployeeMasterViewProps, EmployeeMasterViewState> {
    constructor(props: EmployeeMasterViewProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Details: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0};
    }

    public componentDidMount() {
        //console.log(this.props);
        this.EmployeeMasterData();
    }

    private EmployeeMasterData = async () => {
        this.setState({ loading: true });
        const userId = this.props.spContext.userId;
        var selectQuery = "Employee/Title,ReportingManager/Title,Approvers/Title,Reviewers/Title,Notifiers/Title,*";
        var expandQuery = "Employee,ReportingManager,Approvers,Reviewers,Notifiers";
        sp.web.lists.getByTitle('EmployeeMaster').items.top(2000).expand(expandQuery).select(selectQuery).orderBy('ID', false).get()
            .then((response) => {
                console.log(response)
                let Data = [];
                for (const d of response) {
                    let ReportingManagerString = '',ReviewersString = '',NotifiersString ='';
                    if(d.ReportingManager.length>0){
                        for(let user of d.ReportingManager){
                            ReportingManagerString+= user.Title+","
                        }
                    }
                    ReportingManagerString = ReportingManagerString.substring(0, ReportingManagerString.lastIndexOf(","));
                    if(d.Reviewers.length>0){
                        for(let user of d.Reviewers){
                            ReviewersString+= user.Title+","
                        }
                    }
                    ReviewersString = ReviewersString.substring(0, ReviewersString.lastIndexOf(","));
                    if(d.Notifiers.length>0){
                        for(let user of d.Notifiers){
                            NotifiersString+= user.Title+","
                        }
                        NotifiersString = NotifiersString.substring(0, NotifiersString.lastIndexOf(","));
                    }
                    let date = new Date(d.DateOfJoining)
                    Data.push({
                        Id : d.Id,
                        Employee : d.Employee.Title,
                        // ReportingManager:d.ReportingManager.Title,
                        Company : d.ClientName,
                        ReportingManager: ReportingManagerString,
                        Reviewers:ReviewersString,
                        Notifiers:NotifiersString,
                        Doj : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        IsActive: d.IsActive
                    })
                }
                console.log(Data);
                this.setState({ Details: Data,loading:false });
                document.getElementById('txtTableSearch').style.display = 'none';
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
                                <NavLink title="Edit"  className="csrLink ms-draggable" to={`/EmployeeMasterForm/${record.Id}`}>
                                    <FontAwesomeIcon icon={faEdit}></FontAwesomeIcon>
                                </NavLink>
                            </div>
                        </React.Fragment>
                    );
                },
                width: '100px'
            },
            {
                name: "Employee",
                selector: (row, i) => row.Employee,
                width: '150px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.ReportingManager,
                width: '250px',
                sortable: true
            },
            {
                name: "Company",
                selector: (row, i) => row.Company,
                width: '100px',
                sortable: true
            },
            // {
            //     name: "Approvers",
            //     selector: (row, i) => row.Approvers,
            //     sortable: true,
            //     width: '200px'
            // },
            {
                name: "Reviewers",
                selector: (row, i) => row.Reviewers,
                sortable: true,
                width: '250px'
            },
            {
                name: "Notifiers",
                selector: (row, i) => row.Notifiers,
                sortable: true,
                width: '250px'
            },
            {
                name: "Date of Joining",
                selector: (row, i) => row.Doj,
                sortable: true,
                width: '100px'
            },
            {
                name: "Status",
                selector: (row, i) => row.IsActive?"Active":"In-Active",
                sortable: true,
                width: '100px',
            }
        ];
        return (
            <React.Fragment>
            <h1>Consultants</h1>

                <div style={{ paddingLeft: '10px' }} className="px-1 text-right" id='divAddNewEmployeeMaster'>
                    <NavLink title="Edit"  className="csrLink ms-draggable" to={`/EmployeeMasterForm`}>
                        <span className='add-button' id='newEmployeeMasterForm'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </div>
            <div>
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Details} fileName={'My Details'} showExportExcel={false}></TableGenerator>
                </div>
            </div>
            </React.Fragment> 
        );
    }
}

export default EmployeeMasterView