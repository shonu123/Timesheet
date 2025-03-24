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
    currentTab:number;
    showTabs:boolean;
    ExcelData:any;
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
    isPageAccessable:boolean;
}

class EmployeeMasterView extends React.Component<EmployeeMasterViewProps, EmployeeMasterViewState> {
    private siteURL: string;
    constructor(props: EmployeeMasterViewProps) {
        super(props);
        this.siteURL = this.props.spContext.webAbsoluteUrl;
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {Details: [],ExcelData:[],currentTab:1,showTabs:true, loading:false,message:'',title:'',showHideModal:false,isSuccess:true,comments:'',Action:'',errorMessage:'',ItemID:0,showToaster:false,redirect:false,isPageAccessable: true,};
    }

    public componentDidMount() {
        this.setState({ loading: true});
        highlightCurrentNav("employeemaster");
        this.EmployeeMasterData(this.state.currentTab);
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
    private EmployeeMasterData = async (currentTab) => {
        if(![null,undefined,''].includes(localStorage.getItem('PreviouslySelectedMatrixTab')))
        currentTab=parseInt(localStorage.getItem('PreviouslySelectedMatrixTab'));
        var selectQuery = "Employee/Title,ReportingManager/Title,Approvers/Title,Reviewers/Title,Notifiers/Title,*";
        var expandQuery = "Employee,ReportingManager,Approvers,Reviewers,Notifiers";
        var filterQuery = `IsActive eq ${currentTab}`;
        try{
            let groups= await sp.web.currentUser.groups();
            let userGroups = [];
            for (const grp of groups) {
                userGroups.push(grp.Title);
            }
            sp.web.lists.getByTitle('EmployeeMaster').items.top(5000).expand(expandQuery).select(selectQuery).filter(filterQuery).orderBy('Modified', false).getAll()
                .then((response) => {
                    // console.log(response)
                    let Data = [],ExcelData=[];
                    for (const d of response) {
                        let ReportingManagerString = '',ReviewersString = '',RMExcelString = '',ReviewerExcelString = '',NotifiersString ='';
                        if(d.ReportingManager.length>0){
                            for(let user of d.ReportingManager){
                                ReportingManagerString+= "<div>"+user.Title+"</div>";
                                RMExcelString+= user.Title+"\n";
                            }
                        }
                        if(d.Reviewers.length>0){
                            for(let user of d.Reviewers){
                                ReviewersString+= "<div>"+user.Title+"</div>";
                                ReviewerExcelString+= user.Title+"\n";
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
                            IsActive: d.IsActive?"Active":"In-Active"
                        })
                        ExcelData.push({
                            Employee : d.Employee.Title,
                            Company : d.ClientName,
                            ReportingManager: RMExcelString,
                            Reviewers:ReviewerExcelString,
                            Doj : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                            EPTO:d.EligibleforPTO?"Yes":"No",
                            IsActive: d.IsActive?"Active":"In-Active"
                        })
                    }
                    let pageAccessable = false,showTabs=true;
                    if (userGroups.includes('Timesheet Administrators') || userGroups.includes('Timesheet HR')) {
                        pageAccessable = true;
                        if (userGroups.includes('Timesheet HR'))
                            showTabs = false;
                    }
                    else {
                        pageAccessable = false;
                    }
                    // console.log(Data);
                    this.setState({ Details: Data,ExcelData:ExcelData,loading: false,isPageAccessable:pageAccessable,showTabs:showTabs,currentTab:currentTab});
                    let items = document.querySelectorAll('.nav-link');
                    items.forEach(function (item) {
                        item.classList.remove('active');
                    });
                    if (currentTab == 1)
                        document.getElementById('Active-tab')?document.getElementById('Active-tab').classList.add('active'):'';
                    else
                    document.getElementById('In-Active-tab')?document.getElementById('In-Active-tab').classList.add('active'):'';
                    // document.getElementById('txtTableSearch').style.display = 'none';
                }).catch(err => {
                    console.log('Failed to fetch data.', err);
                });
        }
        catch (e) {
            console.log('Failed to fetch data.', e);
        }
    }
    private  handleRowClicked = (row,Id?) => {
        let ID = row.Id?row.Id:Id;
        this.setState({ItemID:ID,redirect:true});
      }
      private onHandleClick = (url) => {
        let CurrentClickedTab=url =='Active'?'1':'0';
        if(CurrentClickedTab!=localStorage.getItem('PreviouslySelectedMatrixTab'))
        {
            this.setState({loading:true});
            let items = document.querySelectorAll('.nav-link');
            items.forEach(function(item) {
            item.classList.remove('active');
            });
            let currentTab=1;
            if (url === 'Active')
                {
                    document.getElementById('Active-tab')?document.getElementById('Active-tab').classList.add('active'):'';
                    localStorage.setItem('PreviouslySelectedMatrixTab', '1'); 
                    currentTab=1;
                }
                else if (url === 'In-Active')
                 { 
                    document.getElementById('In-Active-tab')?document.getElementById('In-Active-tab').classList.add('active'):'';
                    localStorage.setItem('PreviouslySelectedMatrixTab', '0'); 
                    currentTab=0;
                }
            this.setState({currentTab:currentTab});
            this.EmployeeMasterData(currentTab);
        }
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
                cell: row => <div className='divManagers' dangerouslySetInnerHTML={{ __html: row.ReportingManager }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>,
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
                cell: row => <div className='divReviewers' dangerouslySetInnerHTML={{ __html: row.Reviewers }} onClick={(event)=>this.handleRowClicked(event,row.Id)}/>
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
            // {
            //     name: "Status",
            //     selector: (row, i) => row.IsActive,
            //     sortable: true,
            //     width: '100px',
            // }
        ];
        const ExcelColumns = [
            {
                name: "Employee",
                selector:"Employee",
            },
            {
                name: "Reporting Manager",
                selector: "ReportingManager",
            },
            {
                name: "Reviewers",
                selector:"Reviewers",
            },
            {
                name: "Client",
                selector: "Company",
            },
            {
                name: "Date of Joining",
                selector: "Doj",
            },
            {
                name: "Eligible for PTO",
                selector:"EPTO",
            },
            // {
            //     name: "Status",
            //     selector:"IsActive",
            // }
        ];
        
        if(this.state.redirect){
            let url = `/EmployeeMasterForm/${this.state.ItemID}`;
        return (<Navigate to={url}/>);
        }
        if (!this.state.isPageAccessable) {
            let url = this.siteURL+"/SitePages/AccessDenied.aspx";
            window.location.href = url;
        }
        return (
            <React.Fragment>
            <div id="content" className="content p-2 pt-2">
            <div className='container-fluid'>
                            <div className='FormContent'>
                                <div className="title">Approval Matrix</div>
                                <div className="after-title"></div>
                            {/* <div className={'pr-5 pb-2 text-right'} id={"divAddNewEmployeeMaster"}>
                                <NavLink title={'New Approval Matrix'} className="csrLink ms-draggable" to={`/EmployeeMasterForm`}>
                                    <button type="button" className="SubmitButtons btn"><span className='position-static' id={"newEmployeeMasterForm"}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>{' New'}</span></button>
                                </NavLink>
                            </div>  */}
            <div className='border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2'>
            {this.state.showTabs && <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">
                                    <li className="nav-item" role="presentation" onClick={() => { this.onHandleClick('Active') }} >
                                        <a className="nav-link" id="Active-tab" data-toggle="tab" href="#/EmployeeMasterView" role="tab" aria-selected="false">Active Employees</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => { this.onHandleClick('In-Active') }} >
                                        <a className="nav-link" id="In-Active-tab" data-toggle="tab" href="#/EmployeeMasterView" role="tab" aria-selected="false">In-Active Employees</a>
                                    </li>
                                </ul>}
                                {this.state.currentTab==1 && <div className={'pr-2 pt-2 text-right'} id={"divAddNewEmployeeMaster"}>
                                <NavLink title={'New Approval Matrix'} className="csrLink ms-draggable" to={`/EmployeeMasterForm`}>
                                    <button type="button" className="SubmitButtons btn"><span className='position-static' id={"newEmployeeMasterForm"}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>{' New'}</span></button>
                                </NavLink>
                            </div>}
            {this.state.loading && <Loader />}
                <div className=''>
                    <TableGenerator columns={columns} data={this.state.Details} ExportExcelCustomisedColumns={ExcelColumns} ExportExcelCustomisedData={this.state.ExcelData} fileName={'Approval Matrix'} showExportExcel={false}
                    showAddButton={false} customBtnClass='px-1 text-right mt-2' btnDivID='divAddNewEmployeeMaster' navigateOnBtnClick={`/EmployeeMasterForm`} btnSpanID='newEmployeeMasterForm' btnCaption=' New' btnTitle='New Approval Matrix' searchBoxLeft={true}  onRowClick={this.handleRowClicked}></TableGenerator>
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