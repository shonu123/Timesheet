import * as React from 'react';
import ReviewerApprovals from './Reviewers.component'
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import ApproversApprovals from './Approvers.component';
import MyRequests from './Myrequests.component';
import AllRequests from './AllRequests.components';
import MyTeam from '../Masters/MyTeam.component';
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
    loading:boolean;
    showToaster:boolean;
    isEmployeeConfigured:boolean;
    showMyTeamComp:boolean;
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
        let userID = this.props.spContext.userId
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
        if(userGroup.includes('Timesheet Administrators')||userGroup.includes('Timesheet Members')){
            showTab =true;
        }
        if(showTab && isEmployee){
            this.setState({ showRequestTab: true});
            this.onHandleClick('MyRequests')
        }
        if(isManager){
            this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('Approvers')
        }
        if(isManager&&isReviewer){
            this.setState({ showMyReviewersTab: true,showMyApprovalsTab: true});
            // this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('Approvers')
        }
        else if(isReviewer){
            this.setState({ showMyReviewersTab: true});
            this.onHandleClick('Reviewers')
        }
        if(userGroup.includes('Timesheet Administrators')){
            this.setState({ showAllRequestsTab: true});
            this.onHandleClick('AllRequests')
            EmployeeConfigured = true
        }
        this.setState({loading:false,isEmployeeConfigured: EmployeeConfigured})
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

        let showReviewerComp = false; let showApproveComp = false; let showMyRequestsComp = false; let showApproved = false; let showExported = false; let isAdmin = false,showMyTeamComp = false;
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
        }
        
        this.setState({ showReviewerComp: showReviewerComp, showApproveComp: showApproveComp, showMyRequestsComp: showMyRequestsComp, showExported: showExported,isAdmin:isAdmin,showMyTeamComp:showMyTeamComp});
    }
    public render() {
        return (
            <React.Fragment>
            
            {this.state.isEmployeeConfigured&&<div id="content" className="content p-2 pt-2">
                {highlightCurrentNav("liDashboard")}
                <div id="content" className="content p-2 pt-2">
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className="p-1">
                            <div className="border-box-shadow light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">

                                {this.state.showAllRequestsTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('AllRequests')} >
                                        <a className="nav-link" id="AllRequests-tab" data-toggle="tab" href="#/AllTimesheets" role="tab" aria-controls="AdminRequests" aria-selected="false">All Timesheets</a>
                                    </li>}

                                    {this.state.showRequestTab  &&  <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyRequests')} >
                                        <a className="nav-link" id="MyRequests-tab" data-toggle="tab" href="#/MyTimesheets" role="tab" aria-controls="profile" aria-selected="false">My Timesheets</a>
                                    </li>}

                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Approvers')} >
                                        <a className="nav-link active" id="Approvers-tab" data-toggle="tab" href="#/Approvers" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}
                                  
                                    {this.state.showMyReviewersTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Reviewers')} >
                                        <a className="nav-link" id="ReviewersApprovals-tab" data-toggle="tab" href="#/Reviewers" role="tab" aria-controls="profile" aria-selected="false">My Reviews</a>
                                    </li>}
                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyTeam')} >
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
                                     {/* <div className="tab-pane fade csMyRequests" id="MyRequests" role="tabpanel" aria-labelledby="MyRequests-tab">
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