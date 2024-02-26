import * as React from 'react';
import Myapprovals from './Myapprovals.component';
import Myrequests from './Myrequests.component';
import ReviewerApprovals from './Reviewers.component'
import Pending from './Pending.component';
import PurchasingManager from './PurchasingManager.component';
import Approved from './Approvers.component';
import Exported from './Exported.component';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import ApproversApprovals from './Approvers.component';

export interface DashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface DashboardState {
    showReviewerComp: boolean;
    showRequestComp: boolean;
    showPurchasing: boolean;
    showApproved: boolean;
    showExported: boolean;
    CurrentuserId: number;
    PurchasingManager: boolean;
    purchasingDeptMember : boolean;
    isMROAdmin:boolean;
    showPending:boolean;
    activeElementClass:string;
    userRole: string;
    tempUserRole: string;
    showApproveComp : boolean;
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
            showRequestComp: true,
            CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
            PurchasingManager: false,
            showPurchasing: false,
            showApproved: false,
            showExported: false,
            purchasingDeptMember : false,
            isMROAdmin:false,
            showPending:false,
            activeElementClass:"nav-link",
            userRole:'',
            tempUserRole : 'Approver'
        };
    }
    public componentDidMount() {
        // this.getUserGroups();
        this.getUserGroups();
    }

    private getUserGroups = async () => {
        let qryReviewedTO = '';
        let qeyPurTeam ='';
        let groups = await sp.web.currentUser.groups();
        console.log("current user deatils")
        console.log(this.props.context.pageContext)

        let userGroup = groups[0].Title
        let user = userGroup=='Timesheet Initiators' ?'Initiator': userGroup=='Timesheet Approvers'?'Approvers':userGroup=='Timesheet Reviewers'?'Reviewers':'Administrator'

        console.log('You are :'+user)
        this.setState({userRole : user})
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
    private async GetMasterListData(qryReviewedTO,groups,qeyPurTeam) {
        let ApprovalsMatrix: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and (ReviewerId eq " + this.state.CurrentuserId + qryReviewedTO +")").select('*').get();
        let PurTeammember: any = await sp.web.lists.getByTitle('ApprovalsMatrix').items.filter("IsActive eq 1 and (PurchasingTeamId eq " + this.state.CurrentuserId + qeyPurTeam +")").select('*').get();
        //let groupsInfo = groups.filter((item) => item.Title == "MRO Purchasing Team");
        const adminGrp = groups.filter((item) => item.Title == "MRO Admin");
        if (ApprovalsMatrix.length > 0) {
            this.setState({ PurchasingManager: true });
        } if (PurTeammember.length > 0) {
            this.setState({ purchasingDeptMember: true });        }  
        if (adminGrp.length > 0) {
            this.setState({ isMROAdmin: true });
        }
    }
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

        let showReviewerComp = false; let showApproveComp = false; let showPurchasing = false; let showApproved = false; let showExported = false; let showPending = false;
        if (url === 'Reviewers')
        {
            document.getElementById('ReviewersApprovals-tab').classList.add('active');
            document.getElementById('MyRequests').classList.add('active');
            document.getElementById('MyRequests').classList.add('show');
            showApproveComp = false;
            showReviewerComp = true;
        }
        else if (url === 'Approvers')
         { 
            document.getElementById('Approvers-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
            showApproveComp = true;
            showReviewerComp = false;
        }
        else if (url === 'PM'){
            showPurchasing = true;
            document.getElementById('PM-tab').classList.add('active');
            document.getElementById('PM').classList.add('active');
            document.getElementById('PM').classList.add('show');
        }
        
        this.setState({ showReviewerComp: showReviewerComp, showApproveComp: showApproveComp, showPurchasing: showPurchasing, showApproved: showApproved, showExported: showExported, showPending: showPending });
        let lsMyrequests = {'PageNumber':1,"sortOrder":true,"sortBy":1,'tab':'','SearchKey':null};
        if(url!= undefined) {setTimeout(() => {
            localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
          }, 1000);
         } 
    }
    public render() {
        return (
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
                {highlightCurrentNav("liDashboardLink")}
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className='title'>Dashboard
                        </div>

                        <div className="after-title"></div>
                        <h1>Welcome {this.state.userRole}</h1>

                        <div className="p-1">
                            <div className="border-box-shadow light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">
                                     <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Approvers')}>
                                        <a className="nav-link active" id="Approvers-tab" data-toggle="tab" href="#/Approvers" role="tab" aria-controls="home" aria-selected="true">Approvers Requests</a>
                                    </li>
                                    {/* <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Pending')} hidden={!this.state.isMROAdmin}>
                                        <a className="nav-link" id="Pending-tab" data-toggle="tab" href="#/Pending" role="tab" aria-controls="profile" aria-selected="false">All Pending</a>
                                    </li>  */}
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Reviewers')}>
                                        <a className="nav-link" id="ReviewersApprovals-tab" data-toggle="tab" href="#/Reviewers" role="tab" aria-controls="profile" aria-selected="false">Reviewer Approvals</a>
                                    </li>
                                    
                                </ul>
                                

                               <div className="tab-content" id="myTabContent">
                                    <div className="tab-pane fade csmyrequests show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="v-table">
                                            {this.state.showApproveComp && <ApproversApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csmyapprovals" id="MyRequests" role="tabpanel" aria-labelledby="ReviewersApprovals-tab">
                                        <div className="v-table">
                                            {this.state.showReviewerComp && <ReviewerApprovals {...this.props} />}
                                        </div>
                                    </div>
                                    {/* <div className="tab-pane fade csPending" id="Pending" role="tabpanel" aria-labelledby="Pending-tab">
                                        <div className="v-table">
                                            {this.state.showPending && <Pending {...this.props} />}
                                        </div>
                                    </div> */}
                                    
                                </div>
                            </div>
                        </div> 
                    </div>
                </div>
            </div>
        );
           
    }
}

export default Dashboard;