import * as React from 'react';
// import Myapprovals from './Myapprovals.component';
import Myrequests from './Myrequests.component';
import ReviewerApprovals from './Reviewers.component'
import Pending from '../Masters/EmployeeMasterView.component';
// import PurchasingManager from './PurchasingManager.component';
import Approved from './Approvers.component';
import Exported from './Exported.component';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import ApproversApprovals from './Approvers.component';
import MyRequests from './Myrequests.component';
import AllRequests from './AllRequests.components';
import EmployeeMasterForm from '../Masters/EmployeeMasterForm.component';
import EmployeeMasterView from '../Masters/EmployeeMasterView.component';
import App from '../Forms/CustomeDatePicker.component';
import Loader from '../Shared/Loader';
export interface DashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface DashboardState {
    showReviewerComp: boolean;
    // showRequestComp: boolean;
    // showPurchasing: boolean;
    // showApproved: boolean;
    showExported: boolean;
    CurrentuserId: number;
    // PurchasingManager: boolean;
    // purchasingDeptMember : boolean;
    // isMROAdmin:boolean;
    // showPending:boolean;
    activeElementClass:string;
    userRole: string;
    // tempUserRole: string;
    showApproveComp : boolean;
    showMyRequestsComp : boolean;
    isInitiator:boolean;
    isApprover: boolean;
    isReviewer: boolean;
    isAdmin : boolean;
    showRequestTab: boolean;
    showMyApprovalsTab: boolean;
    showMyReviewersTab: boolean;
    showAllRequestsTab:boolean;
    loading:boolean;
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
            // showRequestComp: true,
            CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
            // PurchasingManager: false,
            // showPurchasing: false,
            // showApproved: false,
            showExported: false,
            // purchasingDeptMember : false,
            // isMROAdmin:false,
            // showPending:false,
            activeElementClass:"nav-link",
            userRole:'',
            // tempUserRole : 'Approver',
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
        };
    }
    public componentDidMount() {
        // this.getUserGroups();
        // this.setState({ loading: true });
        this.getUserGroups();
    }

    private getUserGroups = async () => {
        let qryReviewedTO = '';
        let qeyPurTeam ='';
        let groups = await sp.web.currentUser.groups();
        console.log("current user deatils")
        console.log(this.props.context.pageContext)
        let userGroup = []
        console.log(groups)
        for(let grp of groups){
            userGroup.push(grp.Title)
        }
     
        // let user = userGroup=='Timesheet Initiators' ?'Initiator': userGroup=='Timesheet Approvers'?'Approver':userGroup=='Timesheet Reviewers'?'Reviewer':'Administrator'
        // console.log('You are :'+user)
        // this.setState({userRole : user})
        // if(user=="Initiator"){
        //     this.setState({isInitiator : true});
        //     this.onHandleClick('MyRequests')
        // }
        // else if(user=='Approver'){
        //     this.setState({isApprover : true});
        //     // this.onHandleClick('MyRequests')
        //     this.onHandleClick('Approvers')
        // }
        // else if(user=='Reviewer'){
        //     this.setState({isReviewer : true});
        //     this.onHandleClick('Reviewers')
        // }
        // else if(user=='Administrator'){
        //     this.setState({isAdmin : true}) 
        // }
        if(userGroup.includes('Timesheet Initiators')){
            this.setState({ showRequestTab: true});
            this.onHandleClick('MyRequests')
        }
        if(userGroup.includes('Timesheet Approvers')){
            this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('Approvers')
        }
        if(userGroup.includes('Timesheet Reviewers') && userGroup.includes('Timesheet Approvers')){
            this.setState({ showMyReviewersTab: true});
            this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('Approvers')
        }
        else if(userGroup.includes('Timesheet Reviewers')){
            this.setState({ showMyReviewersTab: true});
            this.onHandleClick('Reviewers')
        }
        if(userGroup.includes('Timesheet Owners')){
            this.setState({ showAllRequestsTab: true});
            this.onHandleClick('AllRequests')
        }
        if(userGroup.includes('Timesheet Members')){
            this.setState({ showAllRequestsTab: true});
            this.onHandleClick('AllRequests')
        }
        // this.setState({loading:false})
    }







    private updatethetabs=()=> {
        let prvData = localStorage.getItem('PrvData');
        let lsMyrequests = {'PageNumber':1,"sortOrder":true,"sortBy":1,'tab':'','SearchKey':null};
       if(prvData!= null && JSON.parse(prvData).tab !="" && JSON.parse(prvData).tab !=undefined) this.onHandleClick(JSON.parse(prvData).tab);
       else  localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
    }
    

    // private getUserGroups = async () => {
    //     let qryReviewedTO = '';
    //     let qeyPurTeam ='';
    //     let groups = await sp.web.currentUser.groups();
    //     let mroGroups=groups.filter(c=>c.Title.includes('MRO'));
    //     mroGroups.forEach(grp=>{
    //         qryReviewedTO += ' or ReviewerId eq ' + grp.Id;
    //     });
    //     mroGroups.forEach(grp=>{
    //         qeyPurTeam += ' or PurchasingTeamId eq ' + grp.Id;
    //     });
    //     this.GetMasterListData(qryReviewedTO,groups,qeyPurTeam);
    //     this.updatethetabs();
    // }
    // private async GetMasterListData(qryReviewedTO,groups,qeyPurTeam) {
    //     let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and (ReviewerId eq " + this.state.CurrentuserId + qryReviewedTO +")").select('*').get();
    //     let PurTeammember: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and (PurchasingTeamId eq " + this.state.CurrentuserId + qeyPurTeam +")").select('*').get();
    //     //let groupsInfo = groups.filter((item) => item.Title == "MRO Purchasing Team");
    //     const adminGrp = groups.filter((item) => item.Title == "MRO Admin");
    //     if (ApprovalsMatrix.length > 0) {
    //         this.setState({ PurchasingManager: true });
    //     } if (PurTeammember.length > 0) {
    //         this.setState({ purchasingDeptMember: true });        }  
    //     if (adminGrp.length > 0) {
    //         this.setState({ isMROAdmin: true });
    //     }
    // }
    public checkUserInPurchasingGroup = async () => {
        let groups = await sp.web.currentUser.groups();

        const groupInfo = groups.filter((item) => item.Title == "MRO Purchasing Team");
      
    }
    private onMenuItemClick(event) {
        let item = document.getElementById('sideMenuNav');
        item.classList.toggle('menu-hide');
    }
    private onHandleClick = (url) => {
        //remove active class for all hyperlinks
        const activeLinkClass="nav-link active";
        let items = document.querySelectorAll('.nav-link');

        // Using forEach loop
        items.forEach(function(item) {
        item.classList.remove('active');
        });

        let itemsPane = document.querySelectorAll('.tab-pane');

        // Using forEach loop
        itemsPane.forEach(function(item) {
        item.classList.remove('active');
        item.classList.remove('show');
        });

        let showReviewerComp = false; let showApproveComp = false; let showMyRequestsComp = false; let showApproved = false; let showExported = false; let isAdmin = false;
        if (url === 'Reviewers')
        {
            document.getElementById('ReviewersApprovals-tab').classList.add('active');
            document.getElementById('ReviewersApprovals').classList.add('active');
            document.getElementById('ReviewersApprovals').classList.add('show');
            showReviewerComp = true;
            showApproveComp = false;
            showMyRequestsComp = false;
            isAdmin = false;
        }
        else if (url === 'Approvers')
         { 
            document.getElementById('Approvers-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
            showApproveComp = true;
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
            showReviewerComp = false;
            isAdmin = false;
        }
        else if(url == 'AllRequests'){
            document.getElementById('AllRequests-tab').classList.add('active');
            document.getElementById('AdminRequests').classList.add('active');
            document.getElementById('AdminRequests').classList.add('show');
            showApproveComp = false;
            showReviewerComp = false;
            showMyRequestsComp = false;
            isAdmin = true;
        }
        
        this.setState({ showReviewerComp: showReviewerComp, showApproveComp: showApproveComp, showMyRequestsComp: showMyRequestsComp, showExported: showExported,isAdmin:isAdmin});
        // let lsMyrequests = {'PageNumber':1,"sortOrder":true,"sortBy":1,'tab':'','SearchKey':null};
        // if(url!= undefined) {setTimeout(() => {
        //     localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
        //   }, 1000);
        //  } 
    }
    public render() {
        return (
            <React.Fragment>
            <div id="content" className="content p-2 pt-2">
                <div id="clickMenu" className="menu-icon-outer" onClick={(event) => this.onMenuItemClick(event)}>
                    <div className="menu-icon">
                        <span>
                        </span>
                        <span>
                        </span>
                        <span>
                        </span>
                    </div>
                </div>
                {highlightCurrentNav("liDashboard")}

                <div id="content" className="content p-2 pt-2">
                <div className="container-fluid">
                    <div className='FormContent'>
                        {/* <div className='title'>Dashboard
                        </div> */}

                        {/* <div className="after-title"></div>
                        <h1>Welcome {this.state.userRole}</h1> */}
                        {/* <App {...this.props}></App> */}
                        <div className="p-1">
                            <div className="border-box-shadow light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">

                                {this.state.showAllRequestsTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('AllRequests')} >
                                        <a className="nav-link" id="AllRequests-tab" data-toggle="tab" href="#/AllRequests" role="tab" aria-controls="AdminRequests" aria-selected="false">All Requests</a>
                                    </li>}

                                {this.state.showRequestTab  &&  <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyRequests')} >
                                        <a className="nav-link" id="MyRequests-tab" data-toggle="tab" href="#/MyRequests" role="tab" aria-controls="profile" aria-selected="false">My Requests</a>
                                    </li> }

                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Approvers')} >
                                        <a className="nav-link active" id="Approvers-tab" data-toggle="tab" href="#/Approvers" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}
                                  
                                    {this.state.showMyReviewersTab &&<li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Reviewers')} >
                                        <a className="nav-link" id="ReviewersApprovals-tab" data-toggle="tab" href="#/Reviewers" role="tab" aria-controls="profile" aria-selected="false">My Reviews</a>
                                    </li>}
                                </ul>
                                
                               <div className="tab-content" id="myTabContent">
                                    <div className="tab-pane fade csApproversApprovals show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="c-v-table">
                                            {this.state.showApproveComp && <ApproversApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csReviewersApprovals" id="ReviewersApprovals" role="tabpanel" aria-labelledby="ReviewersApprovals-tab">
                                        <div className="c-v-table">
                                            {this.state.showReviewerComp && <ReviewerApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyRequests" id="MyRequests" role="tabpanel" aria-labelledby="MyRequests-tab">
                                        <div className="c-v-table">
                                            {this.state.showMyRequestsComp && <MyRequests {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="" id="AdminRequests" role="tabpanel" aria-labelledby="AdminRequests-tab">
                                        <div className="c-v-table">
                                            {/* {this.state.isAdmin && <EmployeeMasterForm {...this.props} />}  */}
                                            {this.state.isAdmin && <AllRequests {...this.props} />}
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div> 
                    </div>
                </div>
             </div>
            </div>
        {this.state.loading && <Loader />}
                </React.Fragment>

        );
           
    }
}

export default Dashboard;