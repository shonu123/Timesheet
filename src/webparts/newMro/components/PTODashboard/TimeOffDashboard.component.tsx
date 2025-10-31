import * as React from 'react';
import { SPHttpClient} from '@microsoft/sp-http';
import { sp } from '@pnp/sp';
import {highlightCurrentNav2} from '../../Utilities/HighlightCurrentComponent';
import "../Shared/Menuhandler";
import "@pnp/sp/site-users/web";
import TimeOffApprovals from './TimeOffApprovals.component';
import MyTimeOffs from './MyTimeOffs.component';
import AllTimeOffs from './AllTimeOffs.component';
import MyTeamPTO from './MyTeamPTOs.component';
import Loader from '../Shared/Loader';
import customToaster from '../Shared/Toaster.component';
import { StatusType, ToasterTypes } from '../../Constants/Constants';
import { Toaster } from 'react-hot-toast';
import HRApproval from './HRApprovals.component';
export interface TimeOffDashboardProps {
    match: any;
    spContext: any;
    spHttpClient: SPHttpClient;
    context: any;
    history: any;
}

export interface TimeOffDashboardState {
    
}

class TimeOffDashboard extends React.Component<TimeOffDashboardProps, TimeOffDashboardState> {
    constructor(props: TimeOffDashboardProps) {
        super(props);
        sp.setup({
            spfxContext: this.props.context
        });

    }
    public state = {
        showApproveComp : false,
        CurrentuserId: this.props.context.pageContext.legacyPageContext["userId"],
        showExported: false,
        activeElementClass:"nav-link",
        userRole:'',
        showMyTimeOffsComp : false,
        showDelegateApprovalsComp:false,
        isInitiator:false,
        isApprover: false,
        isAdmin : false,
        showMyTimeOffsTab :false,
        showMyApprovalsTab:false,
        showHRApprovalsTab:false,
        showHRComp:false,
        showAllTimeOffsTab: false,
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
            this.setState({showToaster:true});
            let message = this.props.match.params.message;
            window.location.hash='#/TimeOffDashboard';
            if(message == 'Error'){
                customToaster('toster-error',ToasterTypes.Error,'Sorry! something went wrong',4000);
            }
            else{
                let status = message.split('-')[1];
                setTimeout(() => {
                    switch (status) {
                        case StatusType.Submit:
                            customToaster('toster-success',ToasterTypes.Success,'Time Off request form '+StatusType.Submit.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Approved:
                            customToaster('toster-success',ToasterTypes.Success,'Time Off request form '+StatusType.Approved.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Reject:
                            customToaster('toster-success',ToasterTypes.Success,'Time Off request form '+StatusType.Reject.toLowerCase()+ ' succesfully',2000)
                            break;
                        case StatusType.Withdraw:
                            customToaster('toster-success',ToasterTypes.Success,'Time Off request form '+StatusType.Withdraw.toLowerCase()+ ' succesfully',2000)
                            break; 
                        case StatusType.RecordModified:
                            customToaster('toster-warning', ToasterTypes.Warning,"Attention: This Time Off request has been modified.Please review the changes.", 3000);
                            break;
                        case "Invalid":
                            customToaster('toster-error',ToasterTypes.Error,'No data found!',4000);
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
        let userID = this.props.spContext.userId;
        let filterQuery = "(SynergyManager/ID eq '"+userID+"' or Employee/ID eq '"+userID+"') and IsActive eq '1'";
        let [groups,EmployeeMaster] = await Promise.all([
            sp.web.currentUser.groups(),
            sp.web.lists.getByTitle("Employees").items.filter(filterQuery).select('Employee/ID,SynergyManager/ID,*').expand("Employee,SynergyManager").getAll()
          ]);
        // console.log(EmployeeMaster)
        let isEmployee = false,isManager = false;
 
        EmployeeMaster.forEach(obj => {
            //if (obj.Employee.ID === userID && obj.EligibleforPTO) { commented to  provide TimeOffForm submisssion provision if employee exists
            if (obj.Employee.ID === userID) {
                isEmployee = true;
            }
            if (obj.SynergyManager && obj.SynergyManager.some(manager => manager.ID === userID)) {
                isManager = true;
            }
        });
        let EmployeeConfigured = isEmployee || isManager;
        // console.log("Is Employee Configured: "+EmployeeConfigured)
        // console.log("current user deatils")
        // console.log(this.props.context.pageContext)
        let userGroup = []
        // console.log(groups)
        for(let grp of groups){
            userGroup.push(grp.Title)
        }
        let showTab =false;
        if(userGroup.includes('Timesheet Administrators')|| userGroup.includes('Synergycom Timesheet Members') || userGroup.includes('Dashboard Admins') || userGroup.includes('Timesheet HR') || userGroup.includes('Time Off Members')){
            showTab =true;
        }
        // if(showTab && isEmployee && userGroup.includes('Time Off Members')){
        if(showTab && isEmployee){  //To provide access of 'My Time Offs' Tab for All PTO Eligible Employees, removed Time Off Members group mandatory
            this.setState({ showMyTimeOffsTab: true});
            this.onHandleClick('MyTimeOffs');
        }
        if(isManager){
            this.setState({ showMyApprovalsTab: true});
            this.onHandleClick('TimeOffApprovals')
        }
        if(userGroup.includes('Timesheet Administrators') || userGroup.includes('Dashboard Admins') || userGroup.includes('Timesheet HR')){
            this.setState({ showAllTimeOffsTab: true});
            this.onHandleClick('AllTimeOffs')
            EmployeeConfigured = true;
        }
        if(!isManager && userGroup.includes('Timesheet HR')){
            EmployeeConfigured=true;
            this.setState({ showHRApprovalsTab: true});
            this.onHandleClick('HRApprovals')
        }
        this.setState({loading:false,isEmployeeConfigured: EmployeeConfigured});
        if(![null,undefined,''].includes(localStorage.getItem('PreviouslySelectedTimeOffTab')))
            {
                this.onHandleClick(localStorage.getItem('PreviouslySelectedTimeOffTab'));
                return false;
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

       let showApproveComp = false; let showMyTimeOffsComp = false; let showApproved = false; let showExported = false; let isAdmin = false,showMyTeamPTOsComp = false,showDelegateApprovalsComp=false,showHRComp=false
         if (url === 'TimeOffApprovals')
         { 
            document.getElementById('TimeOffApprovals-tab').classList.add('active');
            document.getElementById('home').classList.add('active');
            document.getElementById('home').classList.add('show');
            showApproveComp = true;
            showMyTeamPTOsComp = false;
            showMyTimeOffsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        else if (url === 'MyTimeOffs'){
            document.getElementById('MyTimeOffs-tab').classList.add('active');
            document.getElementById('MyTimeOffs').classList.add('active');
            document.getElementById('MyTimeOffs').classList.add('show');
            showMyTimeOffsComp = true;
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        else if(url == 'AllTimeOffs'){
            document.getElementById('AllTimeOffs-tab').classList.add('active');
            document.getElementById('AdminRequests').classList.add('active');
            document.getElementById('AdminRequests').classList.add('show');
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            showMyTimeOffsComp = false;
            isAdmin = true;
            showDelegateApprovalsComp = false;
        }
        else if(url == 'HRApprovals'){
            document.getElementById('HRApprovals-tab').classList.add('active');
            document.getElementById('HRTab').classList.add('active');
            document.getElementById('HRTab').classList.add('show');
            showApproveComp = false;
            showMyTeamPTOsComp = false;
            showMyTimeOffsComp = false;
            showHRComp = true;
            isAdmin = false;
            showDelegateApprovalsComp = false;
        }
        this.setState({showApproveComp: showApproveComp, showMyTimeOffsComp: showMyTimeOffsComp, showExported: showExported,isAdmin:isAdmin,showMyTeamPTOsComp:showMyTeamPTOsComp,showDelegateApprovalsComp:showDelegateApprovalsComp,showHRComp:showHRComp});
    }
    public render() {
        return (
            <React.Fragment>
            
            {this.state.isEmployeeConfigured&&<div id="content" className="content p-2 pt-2">
                {highlightCurrentNav2("liTimeOffDashboard")}
                <div id="content" className="content p-2 pt-2">
                <div className="container-fluid">
                    <div className='FormContent'>
                        <div className="p-1">
                            <div className="light-box m-2">
                                <ul className="nav nav-tabs nav-fill" id="myTab" role="tablist">

                                {this.state.showAllTimeOffsTab &&<li className="nav-item" role="presentation" onClick={() =>{this.onHandleClick('AllTimeOffs');localStorage.setItem('PreviouslySelectedTimeOffTab','AllTimeOffs')}} >
                                        <a className="nav-link" id="AllTimeOffs-tab" data-toggle="tab" href="#/AllTimeOffs" role="tab" aria-controls="AdminRequests" aria-selected="false">All Time Offs</a>
                                    </li>}
                                    
                                    {this.state.showMyTimeOffsTab  &&  <li className="nav-item" role="presentation" onClick={() => {this.onHandleClick('MyTimeOffs');localStorage.setItem('PreviouslySelectedTimeOffTab','MyTimeOffs');}} >
                                        <a className="nav-link" id="MyTimeOffs-tab" data-toggle="tab" href="#/MyTimeOffs" role="tab" aria-controls="profile" aria-selected="false">My Time Offs</a>
                                    </li>}

                                    {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => {this.onHandleClick('TimeOffApprovals');localStorage.setItem('PreviouslySelectedTimeOffTab','TimeOffApprovals');}} >
                                        <a className="nav-link active" id="TimeOffApprovals-tab" data-toggle="tab" href="#/TimeOffApprovals" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}

                                    {!this.state.showMyApprovalsTab && this.state.showHRApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => {this.onHandleClick('HRApprovals');localStorage.setItem('PreviouslySelectedTimeOffTab','HRApprovals');}} >
                                        <a className="nav-link active" id="HRApprovals-tab" data-toggle="tab" href="#/HRApprovals" role="tab" aria-controls="home" aria-selected="true">My Approvals</a>
                                    </li>}
                                    {/* {this.state.showMyApprovalsTab &&   <li className="nav-item" role="presentation" onClick={() => this.onHandleClick('MyTeamPTOs')} >
                                        <a className="nav-link" id="MyTeamPTOs-tab" data-toggle="tab" href="#/MyTeamPTOs" role="tab" aria-controls="MyTeamPTOs" aria-selected="true">My Team PTOs</a>
                                    </li>} */}
                                </ul>
                                
                               <div className="tab-content" id="myTabContent">
                               <div className="tab-pane fade csTimeOffApprovals show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showApproveComp && <TimeOffApprovals {...this.props} />}
                                        </div>
                                    </div>

                                    <div className="tab-pane fade csTimeOffHRApprovals" id="HRTab" role="tabpanel" aria-labelledby="HR-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {!this.state.showApproveComp && this.state.showHRComp && <HRApproval {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="MyTimeOffs" role="tabpanel" aria-labelledby="MyTimeOffs-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.showMyTimeOffsComp && <MyTimeOffs {...this.props} />}
                                        </div>
                                    </div>
                                    <div className="tab-pane fade csMyPTOs" id="AdminRequests" role="tabpanel" aria-labelledby="AdminRequests-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                            {this.state.isAdmin && <AllTimeOffs {...this.props} />}
                                        </div>
                                    </div> 
                                    {/*<div className="tab-pane fade csMyPTOs" id="MyTeamPTOs" role="tabpanel" aria-labelledby="MyTeamPTOs-tab">
                                        <div className="border-box-shadow light-box table-responsive dataTables_wrapper-overflow p-2">
                                        {this.state.showMyTeamPTOsComp && <MyTeamPTO {...this.props} />}
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
                <b>You are not configured in Employee Matrix.</b>Please contact Administrator.</div>}
            {this.state.showToaster&& <Toaster /> }
        {this.state.loading && <Loader />}
                </React.Fragment>
        );
           
    }
}
export default TimeOffDashboard;