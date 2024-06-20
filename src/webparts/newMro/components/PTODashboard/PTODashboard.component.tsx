import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import {highlightCurrentNav2} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import PTOApprovals from './PTOApprovals.component';
import MyPTOs from './MyPTOs.component';
import AllPTOs from './AllEmployeePTOs.component';
import MyTeamPTO from './MyTeamPTOs.component';
import Loader from '../Shared/Loader';
import customToaster from '../Shared/Toaster.component';
import { StatusType, ToasterTypes } from '../../Constants/Constants';
import { Toaster } from 'react-hot-toast';
import HRApproval from './HRApprovals.component';
export interface PTODashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface PTODashboardState {
    
}

class PTODashboard extends React.Component<PTODashboardProps, PTODashboardState> {
    constructor(props: PTODashboardProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });

    }
    public state = {
        showApproveComp : false,
        showReviewerComp: false,
        CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
        showExported: false,
        activeElementClass:"nav-link",
        userRole:'',
        showMyPTOsComp : false,
        showDelegateApprovalsComp:false,
        isInitiator:false,
        isApprover: false,
        isReviewer: false,
        isAdmin : false,
        showRequestTab :false,
        showMyApprovalsTab:false,
        showHRApprovalsTab:false,
        showHRComp:false,
        showMyReviewersTab: false,
        showAllPTOsTab: false,
        loading:false,
        showToaster:false,
        isEmployeeConfigured:true,
        showMyTeamPTOsComp:false,
        showMyTeamPTOsTab:false,
    };
    public componentDidMount() {
        this.setState({ loading: true });
        this.getUserGroups();
        if(!["",undefined,null].includes(this.props.match.params.message)){
            this.setState({showToaster:true})
            let message = this.props.match.params.message
            window.location.hash='#/PTODashboard';
            if(message == 'Error'){
                customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000)
            }
            else{
                let status = message.split('-')[1]
                setTimeout(() => {
                    switch (status) {
                        case StatusType.Submit:
                            customToaster('toster-success',ToasterTypes.Success,'PTO form '+StatusType.Submit.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Approved:
                            customToaster('toster-success',ToasterTypes.Success,'PTO form '+StatusType.Approved.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Reject:
                            customToaster('toster-success',ToasterTypes.Success,'PTO form '+StatusType.Reject.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Withdraw:
                            customToaster('toster-success',ToasterTypes.Success,'PTO form '+StatusType.Withdraw.toLowerCase()+ ' succesfully',2000)
                            break; 
                        case StatusType.RecordModified:
                            customToaster('toster-warning', ToasterTypes.Warning,"Attention: This PTO has been modified.Please review the changes.", 3000);
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
        if(userGroup.includes('Timesheet Administrators')|| userGroup.includes('Timesheet Members') || userGroup.includes('Dashboard Admins') || userGroup.includes('Timesheet HR')){
            showTab =true;
        }
        if(showTab && isEmployee){
            this.setState({ showRequestTab: true});
            this.onHandleClick('MyPTOs')
        }
        if(isManager){
            this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('PTOApprovals')
        }
        if(isManager&&isReviewer){
            this.setState({ showMyReviewersTab: true,showMyApprovalsTab: true});
            // this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('PTOApprovals')
        }
        else if(isReviewer){
            this.setState({ showMyReviewersTab: true});
            this.onHandleClick('Reviewers')
        }
        if(userGroup.includes('Timesheet Administrators') || userGroup.includes('Dashboard Admins') || userGroup.includes('Timesheet HR')){
            this.setState({ showAllPTOsTab: true});
            this.onHandleClick('AllPTOs')
            EmployeeConfigured = true
        }
        if(userGroup.includes('Timesheet HR')){
            this.setState({ showHRApprovalsTab: true});
            this.onHandleClick('HRApprovals')
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

        let showReviewerComp = false; let showApproveComp = false; let showMyPTOsComp = false; let showApproved = false; let showExported = false; let isAdmin = false,showMyTeamPTOsComp = false,showDelegateApprovalsComp=false,showHRComp=false
        // if (url === 'Reviewers')
        // {
        //     document.getElementById('ReviewersApprovals-tab').classList.add('active');
        //     document.getElementById('ReviewersApprovals').classList.add('active');
        //     document.getElementById('ReviewersApprovals').classList.add('show');
        //     showReviewerComp = true;
        //     showApproveComp = false;
        //     showMyTeamPTOsComp = false;
        //     showMyPTOsComp = false;
        //     isAdmin = false;
        //     showDelegateApprovalsComp =false;
        // }
        // else
         if (url === 'PTOApprovals')
         { 
            document.getElementById('PTOApprovals-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
            showApproveComp = true;
            showMyTeamPTOsComp = false;
            showReviewerComp = false;
            showMyPTOsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        else if (url === 'MyTeamPTOs')
         { 
            document.getElementById('MyTeamPTOs-tab').classList.add('active');
            document.getElementById('MyTeamPTOs').classList.add('active');
            document.getElementById('MyTeamPTOs').classList.add('show');
            showApproveComp = false;
            showMyTeamPTOsComp = true;
            showReviewerComp = false;
            showMyPTOsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        else if (url === 'MyPTOs'){
            document.getElementById('MyPTOs-tab').classList.add('active');
            document.getElementById('MyPTOs').classList.add('active');
            document.getElementById('MyPTOs').classList.add('show');
            showMyPTOsComp = true;
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            showReviewerComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        else if(url == 'AllPTOs'){
            document.getElementById('AllPTOs-tab').classList.add('active');
            document.getElementById('AdminRequests').classList.add('active');
            document.getElementById('AdminRequests').classList.add('show');
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            showReviewerComp = false;
            showMyPTOsComp = false;
            isAdmin = true;
            showDelegateApprovalsComp = false;
        }
        else if(url == 'HRApprovals'){
            document.getElementById('HRApprovals-tab').classList.add('active');
            document.getElementById('HRTab').classList.add('active');
            document.getElementById('HRTab').classList.add('show');
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            showReviewerComp = false;
            showMyPTOsComp = false;
            showHRComp = true;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        // else if(url == 'DelegateApprovals'){
        //     document.getElementById('DelegateApprovals-tab').classList.add('active');
        //     document.getElementById('DelegateApprovals').classList.add('active');
        //     document.getElementById('DelegateApprovals').classList.add('show');
        //     showApproveComp = false;
        //     showMyTeamPTOsComp = false;
        //     showReviewerComp = false;
        //     showMyPTOsComp = false;
        //     isAdmin = false;
        //     showDelegateApprovalsComp = true;
        // }
        
        this.setState({ showReviewerComp: showReviewerComp, showApproveComp: showApproveComp, showMyPTOsComp: showMyPTOsComp, showExported: showExported,isAdmin:isAdmin,showMyTeamPTOsComp:showMyTeamPTOsComp,showDelegateApprovalsComp:showDelegateApprovalsComp,showHRComp:showHRComp});
    }
    public render() {
        return (
            <React.Fragment>
            
            {this.state.isEmployeeConfigured&&<div id="content" className="content p-2 pt-2">
                {highlightCurrentNav2("liPTODashboard")}
                <div id="content" className="content p-2 pt-2">
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className="p-1">
                            <div className="light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">

                                {this.state.showAllPTOsTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('AllPTOs')} >
                                        <a className="nav-link" id="AllPTOs-tab" data-toggle="tab" href="#/AllPTOs" role="tab" aria-controls="AdminRequests" aria-selected="false">All PTOs</a>
                                    </li>}
                                    
                                    {this.state.showRequestTab  &&  <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyPTOs')} >
                                        <a className="nav-link" id="MyPTOs-tab" data-toggle="tab" href="#/MyPTOs" role="tab" aria-controls="profile" aria-selected="false">My PTOs</a>
                                    </li>}

                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('PTOApprovals')} >
                                        <a className="nav-link active" id="PTOApprovals-tab" data-toggle="tab" href="#/PTOApprovals" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}

                                    {this.state.showHRApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('HRApprovals')} >
                                        <a className="nav-link active" id="HRApprovals-tab" data-toggle="tab" href="#/HRApprovals" role="tab" aria-controls="home" aria-selected="true">HR Approvals</a>
                                    </li>}
                                    {/* {this.state.showAllPTOsTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('DelegateApprovals')} >
                                        <a className="nav-link" id="DelegateApprovals-tab" data-toggle="tab" href="#/DelegateApprovals" role="tab" aria-controls="DelegateApprovals" aria-selected="false">Delegate Approvals</a>
                                    </li>} */}
                                    {/* {this.state.showMyReviewersTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Reviewers')} >
                                        <a className="nav-link" id="ReviewersApprovals-tab" data-toggle="tab" href="#/Reviewers" role="tab" aria-controls="profile" aria-selected="false">My Reviews</a>
                                    </li>} */}
                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyTeamPTOs')} >
                                        <a className="nav-link" id="MyTeamPTOs-tab" data-toggle="tab" href="#/MyTeamPTOs" role="tab" aria-controls="MyTeamPTOs" aria-selected="true">My Team PTOs</a>
                                    </li>}
                                </ul>
                                
                               <div className="tab-content" id="myTabContent">
                               <div className="tab-pane fade csPTOApprovalsApprovals show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showApproveComp && <PTOApprovals {...this.props} />}
                                        </div>
                                    </div>

                                    <div className="tab-pane fade csPTOHRApprovals" id="HRTab" role="tabpanel" aria-labelledby="HR-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showHRComp && <HRApproval {...this.props} />}
                                        </div>
                                    </div>
                                    {/* <div className="tab-pane fade csReviewersApprovals" id="ReviewersApprovals" role="tabpanel" aria-labelledby="ReviewersApprovals-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showReviewerComp && <ReviewerApprovals {...this.props} />}
                                        </div>
                                    </div> */}
                                    <div className="tab-pane fade csMyPTOs" id="MyPTOs" role="tabpanel" aria-labelledby="MyPTOs-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showMyPTOsComp && <MyPTOs {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyPTOs" id="AdminRequests" role="tabpanel" aria-labelledby="AdminRequests-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.isAdmin && <AllPTOs {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyPTOs" id="MyTeamPTOs" role="tabpanel" aria-labelledby="MyTeamPTOs-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {this.state.showMyTeamPTOsComp && <MyTeamPTO {...this.props} />}
                                        </div>
                                    </div>
                                    {/* <div className="tab-pane fade csDelegateApprovals" id="DelegateApprovals" role="tabpanel" aria-labelledby="DelegateApprovals-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {this.state.showDelegateApprovalsComp && <DelegateApprovals {...this.props} />}
                                        </div>
                                    </div> */}
                                     {/* <div className="tab-pane fade csMyPTOs" id="MyPTOs" role="tabpanel" aria-labelledby="MyPTOs-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showMyPTOsComp && <MyPTOs {...this.props} />}
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
export default PTODashboard;