import * as React from 'react';
import Myapprovals from './Myapprovals.component';
import Myrequests from './Myrequests.component';
import Pending from './Pending.component';
import PurchasingManager from './PurchasingManager.component';
import Approved from './Approved.component';
import Exported from './Exported.component';
import { SPHttpClient} from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import {highlightCurrentNav} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";

export interface DashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface DashboardState {
    showApproveComp: boolean;
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
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
    constructor(props: DashboardProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });
        this.state = {
            showApproveComp: false,
            showRequestComp: true,
            CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
            PurchasingManager: false,
            showPurchasing: false,
            showApproved: false,
            showExported: false,
            purchasingDeptMember : false,
            isMROAdmin:false,
            showPending:false,
            activeElementClass:"nav-link"
        };
    }

    // public state={
    //     showApproveComp: true,
    //     showRequestComp: false,
    //     CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
    //     PurchasingManager:false,
    // }
    public componentDidMount() {
        this.getUserGroups();
    }

    private updatethetabs=()=> {
        let prvData = localStorage.getItem('PrvData');
        let lsMyrequests = {'PageNumber':1,"sortOrder":true,"sortBy":1,'tab':'','SearchKey':null};
       if(prvData!= null && JSON.parse(prvData).tab !="" && JSON.parse(prvData).tab !=undefined) this.onHandleClick(JSON.parse(prvData).tab);
       else  localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
    }
    

    private getUserGroups = async () => {
        let qryReviewedTO = '';
        let qeyPurTeam ='';
        let groups = await sp.web.currentUser.groups();
        let mroGroups=groups.filter(c=>c.Title.includes('MRO'));
        mroGroups.forEach(grp=>{
            qryReviewedTO += ' or ReviewerId eq ' + grp.Id;
        });
        mroGroups.forEach(grp=>{
            qeyPurTeam += ' or PurchasingTeamId eq ' + grp.Id;
        });
        this.GetMasterListData(qryReviewedTO,groups,qeyPurTeam);
        this.updatethetabs();
    }
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
        
        if (groupInfo.length) {
           // const users = await sp.web.siteGroups.getById(groupInfo[0].Id).users();
            //  this.setState({
            //      isUserExistInPurchasingGroup : true,
            //      DynamicDisabled : false
            //  });
        }
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

        let showApproveComp = false; let showRequestComp = false; let showPurchasing = false; let showApproved = false; let showExported = false; let showPending = false;
        if (url === 'myapprovals')
        {
            document.getElementById('MyRequests-tab').classList.add('active');
            document.getElementById('MyRequests').classList.add('active');
            document.getElementById('MyRequests').classList.add('show');
            showApproveComp = true;
        }
        else if (url === 'myrequests')
         { 
            document.getElementById('home-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
           showRequestComp = true;}
        else if (url === 'PM'){
            showPurchasing = true;
            document.getElementById('PM-tab').classList.add('active');
            document.getElementById('PM').classList.add('active');
            document.getElementById('PM').classList.add('show');
        }
        else if (url === 'Approved'){
            showApproved = true;
            document.getElementById('Approved-tab').classList.add('active');
            document.getElementById('Approved').classList.add('active');
            document.getElementById('Approved').classList.add('show');
        }
        else if (url === 'Pending'){
            showPending = true;
            document.getElementById('Pending-tab').classList.add('active');
            document.getElementById('Pending').classList.add('active');
            document.getElementById('Pending').classList.add('show');
        }
        else{
            showExported = true;
            document.getElementById('Exported-tab').classList.add('active');
            document.getElementById('Exported').classList.add('active');
            document.getElementById('Exported').classList.add('show');
        }
        this.setState({ showApproveComp: showApproveComp, showRequestComp: showRequestComp, showPurchasing: showPurchasing, showApproved: showApproved, showExported: showExported, showPending: showPending });
        let lsMyrequests = {'PageNumber':1,"sortOrder":true,"sortBy":1,'tab':'','SearchKey':null};
        if(url!= undefined) {setTimeout(() => {
            localStorage.setItem('PrvData', JSON.stringify(lsMyrequests));
          }, 1000);
         } 
    }
    public render() {
        return (
            <div id="content" className="content p-2 pt-2">
                {highlightCurrentNav("liDashboardLink")}
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className='title'>Dashboard
                        </div>

                        <div className="after-title"></div>

                        <div className="p-1">
                            <div className="border-box-shadow light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('myrequests')}>
                                        <a className="nav-link active" id="home-tab" data-toggle="tab" href="#/home" role="tab" aria-controls="home" aria-selected="true">My Requests</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Pending')} hidden={!this.state.isMROAdmin}>
                                        <a className="nav-link" id="Pending-tab" data-toggle="tab" href="#/Pending" role="tab" aria-controls="profile" aria-selected="false">All Pending</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('myapprovals')}>
                                        <a className="nav-link" id="MyRequests-tab" data-toggle="tab" href="#/MyRequests" role="tab" aria-controls="profile" aria-selected="false">My Approvals</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('PM')} hidden={!this.state.PurchasingManager}>
                                        <a className="nav-link" id="PM-tab" data-toggle="tab" href="#/PM" role="tab" aria-controls="profile" aria-selected="false">Purchasing Manager</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Approved')} hidden={!this.state.PurchasingManager  && !this.state.purchasingDeptMember}>
                                        <a className="nav-link" id="Approved-tab" data-toggle="tab" href="#/Approved" role="tab" aria-controls="profile" aria-selected="false">Approved</a>
                                    </li>
                                    <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('Exported')} hidden={!this.state.PurchasingManager}>
                                        <a className="nav-link" id="Exported-tab" data-toggle="tab" href="#/Exported" role="tab" aria-controls="profile" aria-selected="false">Exported</a>
                                    </li>
                                </ul>

                                <div className="tab-content" id="myTabContent">
                                    <div className="tab-pane fade csmyrequests show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="v-table">
                                            {this.state.showRequestComp && <Myrequests {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csmyapprovals" id="MyRequests" role="tabpanel" aria-labelledby="MyRequests-tab">
                                        <div className="v-table">
                                            {this.state.showApproveComp && <Myapprovals {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csPending" id="Pending" role="tabpanel" aria-labelledby="Pending-tab">
                                        <div className="v-table">
                                            {this.state.showPending && <Pending {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csPM" id="PM" role="tabpanel" aria-labelledby="PM-tab">
                                        <div className="v-table">
                                            {this.state.showPurchasing && <PurchasingManager {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csApproved" id="Approved" role="tabpanel" aria-labelledby="Approved-tab">
                                        <div className="v-table">
                                            {this.state.showApproved && <Approved {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csExported" id="Exported" role="tabpanel" aria-labelledby="Exported-tab">
                                        {this.state.showExported && <Exported {...this.props} />}
                                    </div>
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