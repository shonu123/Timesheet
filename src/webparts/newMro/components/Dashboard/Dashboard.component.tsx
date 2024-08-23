import * as React from 'react';
import ReviewerApprovals from './Reviewers.component'
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import {highlightCurrentNav2} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import ApproversApprovals from './Approvers.component';
import MyRequests from './Myrequests.component';
import AllRequests from './AllRequests.components';
import MyTeam from '../Masters/MyTeam.component';
 import DelegateApprovals from './DelegateApprovals.component';
 import ReviewerDelegationsView from './ReviewerDelegationsView.componets'
 import ManagerDelegationsView from './ManagerDelegationsViews.component';
 import TimesheetDelegation from './DelegateTimesheets.component';
import Loader from '../Shared/Loader';
import customToaster from '../Shared/Toaster.component';
import { StatusType, ToasterTypes } from '../../Constants/Constants';
import { Toaster } from 'react-hot-toast';
export interface DashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface DashboardState {
    showReviewerComp: boolean;
    showExported: boolean;
    CurrentuserId: number;
    activeElementClass:string;
    userRole: string;
    showApproveComp : boolean;
    showMyRequestsComp : boolean;
    isInitiator:boolean;
    isApprover: boolean;
    isReviewer: boolean;
    isAdmin : boolean;
    showRequestTab: boolean;
    showMyApprovalsTab: boolean;
    showMyTeamTab: boolean;
    showMyReviewersTab: boolean;
    showAllRequestsTab:boolean;
    showDelegateApprovalsComp:boolean
    loading:boolean;
    showToaster:boolean;
    isEmployeeConfigured:boolean;
    showMyTeamComp:boolean;
    showReviewerDelegationsViewComp:boolean;
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
    constructor(props: DashboardProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {
            showApproveComp : false,
            showReviewerComp: false,
            CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
            showExported: false,
            activeElementClass:"nav-link",
            userRole:'',
            showMyRequestsComp : false,
            showDelegateApprovalsComp:false,
            isInitiator:false,
            isApprover: false,
            isReviewer: false,
            isAdmin : false,
            showRequestTab :false,
            showMyApprovalsTab:false,
            showMyReviewersTab: false,
            showAllRequestsTab: false,
            loading:false,
            showToaster:false,
            isEmployeeConfigured:true,
            showMyTeamComp:false,
            showMyTeamTab:false,
            showReviewerDelegationsViewComp:false,
        };
    }
    public componentDidMount() {
        this.setState({ loading: true });
        this.getUserGroups();
        if(!["",undefined,null].includes(this.props.match.params.message)){
            this.setState({showToaster:true})
            let message = this.props.match.params.message
            window.location.hash='#/Dashboard';
            if(message == 'Error'){
                customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            }
            else{
                let status = message.split('-')[1]
                setTimeout(() => {
                    switch (status) {
                        case StatusType.Submit:
                            customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Submit.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Approved:
                            customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Approved.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Reject:
                            customToaster('toster-success',ToasterTypes.Success,'Weekly timesheet '+StatusType.Reject.toLowerCase()+ ' succesfully',2000)
                            break; 
                        case StatusType.RecordModified:
                            customToaster('toster-warning', ToasterTypes.Warning,"Attention: This weekly timesheet has been modified.Please review the changes.", 4000);
                            break;
                            case "Delegated":
                            customToaster('toster-success',ToasterTypes.Success,'Your weekly timesheets will be delegated for the mentioned period',2000)
                            break;  
                        case "Invalid":
                            customToaster('toster-error',ToasterTypes.Error,'No data found!',4000)
                            break; 
                        default:
                            break;
                    }
                },0)
            }
        }
    }
// this function is used to fetch the current logged in user groups
    private getUserGroups = async () => {
        // let groups = await sp.web.currentUser.groups();
        let userID = this.props.spContext.userId,isAdminloggedin=false;
        let filterQuery = "(ReportingManager/ID eq '"+userID+"' or Employee/ID eq '"+userID+"' or Reviewers/ID eq '"+userID+"') and IsActive eq '1'"
        let [groups,EmployeeMaster] = await Promise.all([
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle("EmployeeMaster").items.filter(filterQuery).select('Employee/ID,ReportingManager/ID,Reviewers/ID,*').expand("Employee,ReportingManager,Reviewers").get()
          ]);
        // console.log(EmployeeMaster)
        let isEmployee = false,isManager = false,isReviewer = false;
 
        EmployeeMaster.forEach(obj => {
            if (obj.Employee.ID === userID) {
                isEmployee = true;
            }
        
            if (obj.ReportingManager && obj.ReportingManager.some(manager => manager.ID === userID)) {
                isManager = true;
            }
        
            if (obj.Reviewers && obj.Reviewers.some(reviewer => reviewer.ID === userID)) {
                isReviewer = true;
            }
        });
        let EmployeeConfigured = isEmployee || isManager ||isReviewer
        // console.log("Is Employee Configured: "+EmployeeConfigured)
        // console.log("current user deatils")
        // console.log(this.props.context.pageContext)
        let userGroup = []
        // console.log(groups)
        for(let grp of groups){
            userGroup.push(grp.Title)
        }
        let showTab =false;
        if(userGroup.includes('Timesheet Administrators')|| userGroup.includes('Synergycom Timesheet Members') || userGroup.includes('Dashboard Admins')){
            showTab =true;
        }
        if(showTab && isEmployee){
            this.setState({ showRequestTab: true});
            //this.onHandleClick('MyRequests')
        }
        if(isManager){
            this.setState({ showMyApprovalsTab: true});
            //this.onHandleClick('Approvers')
        }
        if(isManager&&isReviewer){
            this.setState({ showMyReviewersTab: true,showMyApprovalsTab: true});
            // this.setState({ showMyApprovalsTab: true});
            //this.onHandleClick('Approvers')
        }
        else if(isReviewer){
            this.setState({ showMyReviewersTab: true});
            //this.onHandleClick('Reviewers')
        }
        if(userGroup.includes('Timesheet Administrators') || userGroup.includes('Dashboard Admins')){
            this.setState({ showAllRequestsTab: true});
            //this.onHandleClick('AllRequests')
            isAdminloggedin=true;
            EmployeeConfigured = true
        }
        this.setState({isEmployeeConfigured: EmployeeConfigured,isReviewer:isReviewer,loading:false});
        [null,undefined,''].includes(localStorage.getItem('PreviouslySelectedTab'))?'':this.onHandleClick(localStorage.getItem('PreviouslySelectedTab'));
        //conditins updated to stop unwanted calls
        if(isAdminloggedin){
            this.onHandleClick('AllRequests')
        }
        else if(isManager&&isReviewer || isManager){
            this.onHandleClick('Approvers')
        }
        else if(isReviewer){
            this.onHandleClick('Reviewers')
        }
        else if(showTab && isEmployee){
            this.onHandleClick('MyRequests')
        }

    }

    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }
    //This function is used to display Tabs in Dasboard. Tabs are shown according to user groups
    private onHandleClick = (url) => {
        const activeLinkClass="nav-link active";
        let items = document.querySelectorAll('.nav-link');
        items.forEach(function(item) {
        item.classList.remove('active');
        });

        let itemsPane = document.querySelectorAll('.tab-pane');
        itemsPane.forEach(function(item) {
        item.classList.remove('active');
        item.classList.remove('show');
        });

        let showReviewerComp = false; let showApproveComp = false; let showMyRequestsComp = false; let showApproved = false; let showExported = false; let isAdmin = false,showMyTeamComp = false,showDelegateApprovalsComp=false,showReviewerDelegationsViewComp=false;
        if (url === 'Reviewers')
        {
            document.getElementById('ReviewersApprovals-tab').classList.add('active');
            document.getElementById('ReviewersApprovals').classList.add('active');
            document.getElementById('ReviewersApprovals').classList.add('show');
            showReviewerComp = true;
            showApproveComp = false;
            showMyTeamComp = false;
            showMyRequestsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp =false;
            showReviewerDelegationsViewComp = false;
        }
        else if (url === 'Approvers')
         { 
            document.getElementById('Approvers-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
            showApproveComp = true;
            showMyTeamComp = false;
            showReviewerComp = false;
            showMyRequestsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
            showReviewerDelegationsViewComp = false;
        }
        else if (url === 'MyTeam')
         { 
            document.getElementById('MyTeam-tab').classList.add('active');
            document.getElementById('MyTeam').classList.add('active');
            document.getElementById('MyTeam').classList.add('show');
            showApproveComp = false;
            showMyTeamComp = true;
            showReviewerComp = false;
            showMyRequestsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
            showReviewerDelegationsViewComp = false;
        }
        else if (url === 'MyRequests'){
            document.getElementById('MyRequests-tab').classList.add('active');
            document.getElementById('MyRequests').classList.add('active');
            document.getElementById('MyRequests').classList.add('show');
            showMyRequestsComp = true;
            showApproveComp = false;
            showMyTeamComp = false;
            showReviewerComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
            showReviewerDelegationsViewComp = false;
        }
        else if(url == 'AllRequests'){
            document.getElementById('AllRequests-tab').classList.add('active');
            document.getElementById('AdminRequests').classList.add('active');
            document.getElementById('AdminRequests').classList.add('show');
            showApproveComp = false;
            showMyTeamComp = false;
            showReviewerComp = false;
            showMyRequestsComp = false;
            isAdmin = true;
            showDelegateApprovalsComp = false;
            showReviewerDelegationsViewComp = false;
        }
        else if(url == 'DelegateApprovals'){
            document.getElementById('DelegateApprovals-tab').classList.add('active');
            document.getElementById('DelegateApprovals').classList.add('active');
            document.getElementById('DelegateApprovals').classList.add('show');
            showApproveComp = false;
            showMyTeamComp = false;
            showReviewerComp = false;
            showMyRequestsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = true;
            showReviewerDelegationsViewComp = false;
        }
        // else if(url=="ReviewerDelegationsView"){
        //     document.getElementById('ReviewerDelegationsView-tab').classList.add('active');
        //     document.getElementById('ReviewerDelegationsView').classList.add('active');
        //     document.getElementById('ReviewerDelegationsView').classList.add('show');
        //     showApproveComp = false;
        //     showMyTeamComp = false;
        //     showReviewerComp = false;
        //     showMyRequestsComp = false;
        //     isAdmin = false;
        //     showReviewerDelegationsViewComp = true;
        //     showDelegateApprovalsComp = false;
        // }
        
        this.setState({ showReviewerComp: showReviewerComp, showApproveComp: showApproveComp, showMyRequestsComp: showMyRequestsComp, showExported: showExported,isAdmin:isAdmin,showMyTeamComp:showMyTeamComp,showDelegateApprovalsComp:showDelegateApprovalsComp,showReviewerDelegationsViewComp:showReviewerDelegationsViewComp});
    }
    public render() {
        return (
            <React.Fragment>
            
            {this.state.isEmployeeConfigured&&<div id="content" className="content p-2 pt-2">
                {highlightCurrentNav2("liDashboard")}
                <div id="content" className="content p-2 pt-2">
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className="p-1">
                            <div className="light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">

                                {this.state.showAllRequestsTab &&<li className="nav-item" role="presentation" onClick={() =>{this.onHandleClick('AllRequests');localStorage.setItem('PreviouslySelectedTab','AllRequests');}} >
                                        <a className="nav-link" id="AllRequests-tab" data-toggle="tab" href="#/AllTimesheets" role="tab" aria-controls="AdminRequests" aria-selected="false">All Timesheets</a>
                                    </li>}
                                    
                                    {this.state.showRequestTab  &&  <li className="nav-item" role="presentation" onClick={() =>{ this.onHandleClick('MyRequests');localStorage.setItem('PreviouslySelectedTab','MyRequests');}} >
                                        <a className="nav-link" id="MyRequests-tab" data-toggle="tab" href="#/MyTimesheets" role="tab" aria-controls="profile" aria-selected="false">My Timesheets</a>
                                    </li>}

                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() =>{this.onHandleClick('Approvers');localStorage.setItem('PreviouslySelectedTab','Approvers');}} >
                                        <a className="nav-link active" id="Approvers-tab" data-toggle="tab" href="#/Approvers" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}
                                    {this.state.showMyReviewersTab &&<li className="nav-item" role="presentation" onClick={() =>{ this.onHandleClick('Reviewers');localStorage.setItem('PreviouslySelectedTab','Reviewers');}} >
                                        <a className="nav-link" id="ReviewersApprovals-tab" data-toggle="tab" href="#/Reviewers" role="tab" aria-controls="profile" aria-selected="false">My Reviews</a>
                                    </li>}
                                    {(this.state.showAllRequestsTab || this.state.showMyApprovalsTab || this.state.isReviewer) &&<li className="nav-item" role="presentation" onClick={() =>{ this.onHandleClick('DelegateApprovals');localStorage.setItem('PreviouslySelectedTab','DelegateApprovals');}} >
                                        <a className="nav-link" id="DelegateApprovals-tab" data-toggle="tab" href="#/DelegateApprovals" role="tab" aria-controls="DelegateApprovals" aria-selected="false">Delegate Timesheets</a>
                                    </li>}
                                    {/* {(this.state.showAllRequestsTab || this.state.showMyReviewersTab) &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('ReviewerDelegationsView')} >
                                        <a className="nav-link" id="ReviewerDelegationsView-tab" data-toggle="tab" href="#/DelegateReviews" role="tab" aria-controls="ReviewerDelegationsView" aria-selected="false">Delegate Reviews</a>
                                    </li>} */}
                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() =>{ this.onHandleClick('MyTeam');localStorage.setItem('PreviouslySelectedTab','MyTeam');}} >
                                        <a className="nav-link" id="MyTeam-tab" data-toggle="tab" href="#/MyTeam" role="tab" aria-controls="MyTeam" aria-selected="true">My Team</a>
                                    </li>}
                                </ul>
                                
                               <div className="tab-content" id="myTabContent">
                               <div className="tab-pane fade csApproversApprovals show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showApproveComp && <ApproversApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csReviewersApprovals" id="ReviewersApprovals" role="tabpanel" aria-labelledby="ReviewersApprovals-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showReviewerComp && <ReviewerApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyRequests" id="MyRequests" role="tabpanel" aria-labelledby="MyRequests-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showMyRequestsComp && <MyRequests {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyRequests" id="AdminRequests" role="tabpanel" aria-labelledby="AdminRequests-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.isAdmin && <AllRequests {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyRequests" id="MyTeam" role="tabpanel" aria-labelledby="MyTeam-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {this.state.showMyTeamComp && <MyTeam {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csDelegateApprovals" id="DelegateApprovals" role="tabpanel" aria-labelledby="DelegateApprovals-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {/* {this.state.showDelegateApprovalsComp && <DelegateApprovals {...this.props} />} */}
                                        {/* {this.state.showDelegateApprovalsComp && <ManagerDelegationsView {...this.props} />} */}
                                        {this.state.showDelegateApprovalsComp && <TimesheetDelegation {...this.props} />}
                                        </div>
                                    </div>
                                    {/* <div className="tab-pane fade csReviewerDelegationsView" id="ReviewerDelegationsView" role="tabpanel" aria-labelledby="ReviewerDelegationsView-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {this.state.showReviewerDelegationsViewComp && <ReviewerDelegationsView {...this.props} />}
                                        </div>
                                    </div>
                                     <div className="tab-pane fade csMyRequests" id="MyRequests" role="tabpanel" aria-labelledby="MyRequests-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showMyRequestsComp && <MyRequests {...this.props} />}
                                        </div> 
                                    </div> */}
                                </div>
                            </div>
                        </div> 
                    </div>
                </div>
             </div>
            </div>}
            {!this.state.isEmployeeConfigured&&<div className='noConfiguration'>
                <div className='ImgUnLink'><img src={require('../Images/unLink.png')} alt="" className=''/></div>
                <b>You are not configured in Approval Matrix.</b>Please contact Administrator.</div>}
            {this.state.showToaster&& <Toaster /> }
        {this.state.loading && <Loader />}
                </React.Fragment>
        );
           
    }
}
export default Dashboard;