import * as React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import TableGenerator from '../Shared/TableGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEdit, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { highlightCurrentNav } from '../../Utilities/HighlightCurrentComponent';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import Loader from '../Shared/Loader';
import { ToasterTypes } from '../../Constants/Constants';
import toast, { Toaster } from 'react-hot-toast';
import customToaster from '../Shared/Toaster.component';
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
    showToaster:boolean;
    redirect:boolean;
}

class EmployeeMasterView extends React.Component<EmployeeMasterViewProps, EmployeeMasterViewState> {
    constructor(props: EmployeeMasterViewProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Details: [], loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,showToaster:false,redirect:false};
    }

    public componentDidMount() {
        this.setState({ loading: true});
        highlightCurrentNav("employeemaster");
        this.EmployeeMasterData();
        if(!["",undefined,null].includes(this.props.match.params.message)){
            this.setState({showToaster:true})
            let message = this.props.match.params.message
            window.location.hash='#/EmployeeMasterView';
            if(message == 'Error'){
                customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            }
            else{
                let status = message.split('-')[1]
                setTimeout(() => {
                    status == "Added"?customToaster('toster-success',ToasterTypes.Success,'Employee configuration added successfully',2000):customToaster('toster-success',ToasterTypes.Success,'Employee configuration updated successfully',
                    2000)}, 0);
            }
        }
    }
// this function is used to get all records of  both active and inactive employees from employee master list
    private EmployeeMasterData = async () => {
        var selectQuery = "Employee/Title,ReportingManager/Title,Approvers/Title,Reviewers/Title,Notifiers/Title,*";
        var expandQuery = "Employee,ReportingManager,Approvers,Reviewers,Notifiers";
        sp.web.lists.getByTitle('EmployeeMaster').items.top(2000).expand(expandQuery).select(selectQuery).orderBy('Modified', false).get()
            .then((response) => {
                // console.log(response)
                let Data = [];
                for (const d of response) {
                    let ReportingManagerString = '',ReviewersString = '',NotifiersString ='';
                    if(d.ReportingManager.length>0){
                        for(let user of d.ReportingManager){
                            ReportingManagerString+= "<div>"+user.Title+"</div>"
                        }
                    }
                    if(d.Reviewers.length>0){
                        for(let user of d.Reviewers){
                            ReviewersString+= "<div>"+user.Title+"</div>"
                        }
                    }
                    // --------------Notifiers-----------
                    // if(d.Notifiers.length>0){
                    //     for(let user of d.Notifiers){
                    //         NotifiersString+= "<div>"+user.Title+"<div>"
                    //     }
                    //     // NotifiersString = NotifiersString.substring(0, NotifiersString.lastIndexOf(","));
                    // }
                    // ----------------------------------

                    let date = new Date(d.DateOfJoining.split('-')[1]+'/'+d.DateOfJoining.split('-')[2].split('T')[0]+'/'+d.DateOfJoining.split('-')[0]);
                    Data.push({
                        Id : d.Id,
                        Employee : d.Employee.Title,
                        Company : d.ClientName,
                        ReportingManager: ReportingManagerString,
                        Reviewers:ReviewersString,
                        Doj : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                        EPTO:d.EligibleforPTO?"Yes":"No",
                        IsActive: d.IsActive
                    })
                }
                // console.log(Data);
                this.setState({ Details: Data,loading: false});
                // document.getElementById('txtTableSearch').style.display = 'none';
            }).catch(err => {
                console.log('Failed to fetch data.', err);
            });
    }

    private  handleRowClicked = (row) => {
        let ID = row.Id
        this.setState({ItemID:ID,redirect:true})
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
                width: '250px',
                sortable: true
            },
            {
                name: "Reporting Manager",
                selector: (row, i) => row.ReportingManager,
                cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.ReportingManager }} />,
                width: '250px',
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
                width: '250px',
                cell: row => <div className='divReviewers' dangerouslySetInnerHTML={{ __html: row.Reviewers }} />
            },
            {
                name: "Client",
                selector: (row, i) => row.Company,
                // width: '200px',
                sortable: true
            },
            // { ------Notifiers--------
            //     name: "Notifiers",
            //     selector: (row, i) => row.Notifiers,
            //     sortable: true,
            //     cell: row => <div dangerouslySetInnerHTML={{ __html: row.Notifiers }} />
            //     // width: '250px'
            // },
            {
                name: "Date of Joining",
                selector: (row, i) => row.Doj,
                sortable: true,
                // width: '150px'
            },
            {
                name: "Eligible for PTO",
                selector: (row, i) => row.EPTO,
                sortable: true,
                // width: '150px'
            },
            {
                name: "Status",
                selector: (row, i) => row.IsActive?"Active":"In-Active",
                sortable: true,
                width: '100px',
            }
        ];
        
        if(this.state.redirect){
            let url = `/EmployeeMasterForm/${this.state.ItemID}`;
        return (<Navigate to={url}/>);
        }
        return (
            <React.Fragment>
            <div id="content" className="content p-2 pt-2">
            <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Approval Matrix</div>
                                <div className="after-title"></div>
            {/* <h1 className='title'>Approval Matrix</h1> */}

                {/* <div style={{ paddingLeft: '10px' }} className="px-1 text-right Billable" id='divAddNewEmployeeMaster'>
                    <NavLink title="New Approval Matrix"  className="csrLink ms-draggable" to={`/EmployeeMasterForm`}>
                        <span className='add-button' id='newEmployeeMasterForm'><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon> New</span>
                    </NavLink>
                </div> */}
            <div className='border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2'>
            {this.state.loading && <Loader />}
                <div className='table-head-1st-td'>
                    <TableGenerator columns={columns} data={this.state.Details} fileName={'My Details'} showExportExcel={false}
                    showAddButton={true} customBtnClass='px-1 text-right mt-2' btnDivID='divAddNewEmployeeMaster' navigateOnBtnClick={`/EmployeeMasterForm`} btnSpanID='newEmployeeMasterForm' btnCaption=' New' btnTitle='New Approval Matrix' searchBoxLeft={false}  onRowClick={this.handleRowClicked}></TableGenerator>
                </div>
            </div>
            </div>
            </div>
            </div>
               {this.state.showToaster&& <Toaster /> }
            </React.Fragment> 
        );
    }
}

export default EmployeeMasterView