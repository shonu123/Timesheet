import * as React from 'react';
import { Component, Suspense, lazy } from 'react';
import { render } from 'react-dom';
import { Route, Routes, Navigate, useParams, BrowserRouter as Router, } from 'react-router-dom';
import GuardedRoute from './GuardedRoute';
//const Dashboard = React.lazy(() => import('../Dashboard/Dashboard.component'));
import Dashboard from '../Dashboard/Dashboard.component';
import PTODashboard from '../PTODashboard/PTODashboard.component';
import PurchaseRequest from '../Forms/PurchaserequestForm.component';
// const Home = lazy(() => import('../Home/Home.component'));
import Home from '../Home/Home.component';
const Purchaserequestlist = lazy(() => import('../Reports/PurchaseRequest.component'));
// import Purchaserequestlist from '../Reports/PurchaseRequest.component';
import RequisitionReport from '../Reports/Requistionreport.component';
import Myrequests from '../Dashboard/Myrequests.component';
import EmployeeMasterForm from '../Masters/EmployeeMasterForm.component';
// import WeeklyTimesheet from '../Forms/WeeklyTimesheet.component'; 
import WeeklyTimesheet from '../Forms/WeeklyTimesheet.component';
import HolidaysList from '../Masters/HolidayMaster.component';
import { SPHttpClient, SPHttpClientResponse, SPHttpClientConfiguration } from '@microsoft/sp-http';
import sitePermissions from './Routing.module';
import EmployeeMasterView from '../Masters/EmployeeMasterView.component';
import Clients from '../Masters/ClientMaster.component';
import TimesheetReport from '../Reports/TimesheetReport.component';
import DailyTimesheetReport from '../Reports/DailyTimesheetReport.component';
import WeeklyTimesheetReport from '../Reports/WeeklyTimesheetReport.component';
// import WeeklyTimesheetReport from '../Reports/WeeklyTimesheetReportPDF.component';
import PTOForm from '../Forms/PTOForm.component';
import DelegateManagerApprovals from '../Forms/AutoManagerDelegtion.component'
import DelegateReviewerApprovals from '../Forms/Test.component';
// import DelegateReviewerApprovals from '../Forms/AutoReviewerDelegation.component';
export interface RoutesProps {
    spContext: any;
    spHttpClient: SPHttpClient;
    currentUserGroups: any;
}
export interface RoutesState {

}

class Routesitems extends Component<RoutesProps, RoutesState> {
    //state = {}
    private renderProtectedRoutes = () => {
        let currentUserGroups = this.props.currentUserGroups;
        let protectedRoutes = sitePermissions.map((permission) => {
            if (permission.canActivate) {
                let authinticated = false;
                if (currentUserGroups.includes(permission.accessTo)) {
                    authinticated = true;
                }
                return (<Route path={permission.link} element={<GuardedRoute {...this.props} path={permission.link} component={permission.component} auth={authinticated}></GuardedRoute>} />)
            }
            return null;
        });
        // this.setState({ isPermissionChecked: true });
        return protectedRoutes;
    }
    public render() {
        
        const Wrapper = (props) => {
            let params = useParams();
            return <PurchaseRequest {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          
          const WrapperEmployeeMasterForm = (props) => {
            let params =useParams();
            return <EmployeeMasterForm {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperWeeklyTimesheet = (props) => {
            let params =useParams();
            return <WeeklyTimesheet {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperMasterView = (props) => {
            let params =useParams();
            return <EmployeeMasterView {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperHolidayMaster = (props) => {
            let params =useParams();
            return <HolidaysList {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperClientMaster = (props) => {
            let params =useParams();
            return <Clients {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperDashboard = (props) => {
            let params =useParams();
            return <Dashboard {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperPTODashboard = (props) => {
            let params =useParams();
            return <PTODashboard {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const TimesheetReports = (props) => {
            let params =useParams();
            return <TimesheetReport {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const DailyTimesheetReports = (props) => {
            let params =useParams();
            return <DailyTimesheetReport {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WeeklyTimesheetReports = (props) => {
            let params =useParams();
            return <WeeklyTimesheetReport {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperPTOForm = (props) => {
            let params =useParams();
            return <PTOForm {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperManagerDelegatesForm = (props) => {
            let params =useParams();
            return <DelegateManagerApprovals {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperReviewerDelegatesForm = (props) => {
            let params =useParams();
            return <DelegateReviewerApprovals {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
        return (
            <Suspense fallback={<div></div>}>
                <Routes>
                    {/* <Route path='/' element={<Dashboard {...this.context}{...this.props}  />} />WrapperDashboard */}
                    <Route path='/:message?' element={<WrapperDashboard/>} />
                    <Route path='/PTODashboard/:message?' element={<WrapperPTODashboard/>} />
                   <Route path='/WeeklyTimesheet/:id?' element ={<WrapperWeeklyTimesheet/>} />
                   <Route path='/EmployeeMasterForm/:id?/:redirect?' element ={<WrapperEmployeeMasterForm/>} />
                   <Route path='/PTOForm/:id?' element ={<WrapperPTOForm/>} />
                   <Route path='/DelegateApprovalTimesheets/:id?' element ={<WrapperManagerDelegatesForm/>} />
                   <Route path='/DelegateReviewTimesheets/:id?' element ={<WrapperReviewerDelegatesForm/>} />
                   <Route path='/EmployeeMasterView/:message?' element ={<WrapperMasterView/>} />
                   <Route path='/HolidayMaster/:id?' element ={<WrapperHolidayMaster/>} />
                   <Route path='/ClientMaster/:id?' element ={<WrapperClientMaster/>} />
                    <Route path='/purchaserequest/:id?' element={<Wrapper />} />
                    <Route path='/TimesheetReport/' element ={<TimesheetReports/>} />
                    <Route path='/DailyTimesheetReport/' element ={<DailyTimesheetReports/>} />
                    <Route path='/WeeklyTimesheetReport/' element ={<WeeklyTimesheetReports/>} />
                    {/* <Route path='/TimesheetReport' element={(matchprops) => <TimesheetReport {...matchprops}{...this.props} />} /> */}
                    {/* <Route path='/requisitionreport' element={(matchprops) => <RequisitionReport {...matchprops}{...this.props} />} /> */}
                    {/* <Route path='/Dashboard/:message?' element={<Dashboard {...this.context} {...this.props} />} /> */}
                    <Route path='/Dashboard/:message?' element={<WrapperDashboard/>} />
                    <Route path='/purchaserequestlist' element={<Purchaserequestlist {...this.context} {...this.props} />} />
                    <Route path='/myrequests' element={<Myrequests {...this.context}{...this.props} />} />
                    {this.renderProtectedRoutes()}
                </Routes>
            </Suspense>
        );
    }
}
export default Routesitems;
