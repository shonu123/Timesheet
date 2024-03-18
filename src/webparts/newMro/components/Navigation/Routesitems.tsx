import * as React from 'react';
import { Component, Suspense, lazy } from 'react';
import { render } from 'react-dom';
import { Route, Routes, Navigate, useParams, BrowserRouter as Router, } from 'react-router-dom';
import GuardedRoute from './GuardedRoute';
//const Dashboard = React.lazy(() => import('../Dashboard/Dashboard.component'));
import Dashboard from '../Dashboard/Dashboard.component';
import PurchaseRequest from '../Forms/PurchaserequestForm.component';
// const Home = lazy(() => import('../Home/Home.component'));
import Home from '../Home/Home.component';
import ApprovalMaster from '../Masters/Approvalmaster.component';
const Purchaserequestlist = lazy(() => import('../Reports/PurchaseRequest.component'));
// import Purchaserequestlist from '../Reports/PurchaseRequest.component';
import ApprovalMasterform from '../Masters/ApprovalmasterForm.component';
import Vendor from '../Masters/Vendor.component';
import RequisitionReport from '../Reports/Requistionreport.component';
import Myapprovals from '../Dashboard/Myapprovals.component';
import Myrequests from '../Dashboard/Myrequests.component';
import EmployeeMasterForm from '../Masters/EmployeeMasterForm.component';
import WeeklyTimesheet from '../Forms/WeeklyTimesheet.component'; 
import HolidaysList from '../Masters/HolidayMaster.component';
import { SPHttpClient, SPHttpClientResponse, SPHttpClientConfiguration } from '@microsoft/sp-http';
import sitePermissions from './Routing.module';
import EmployeeMasterView from '../Masters/EmployeeMasterView.component';
import Clients from '../Masters/ClientMaster.component';
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
          const WrappermasterForm = (props) => {
            let params =useParams();
            return <ApprovalMasterform {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperVendor = (props) => {
            let params =useParams();
            return <Vendor {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperApprovalMaster = (props) => {
            let params =useParams();
            return <ApprovalMaster {...this.context}{...this.props}  {...{...props, match: {params}} } />
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
        return (
            <Suspense fallback={<div></div>}>
                <Routes>
                    <Route path='/' element={<Dashboard {...this.context}{...this.props}  />} />
                    <Route path='/approvalmaster' element={<WrapperApprovalMaster/>} />
                   <Route path='/WeeklyTimesheet/:id?' element ={<WrapperWeeklyTimesheet/>} />
                   <Route path='/EmployeeMasterForm/:id?' element ={<WrapperEmployeeMasterForm/>} />
                   <Route path='/EmployeeMasterView/' element ={<WrapperMasterView/>} />
                   <Route path='/HolidayMaster/:id?' element ={<WrapperHolidayMaster/>} />
                   <Route path='/ClientMaster/:id?' element ={<WrapperClientMaster/>} />
                    <Route path='/purchaserequest/:id?' element={<Wrapper />} />
                    <Route path='/requisitionreport' element={(matchprops) => <RequisitionReport {...matchprops}{...this.props} />} />
                    <Route path='/Dashboard' element={<Dashboard {...this.context} {...this.props} />} />
                    {/* <Route path='/approvalmasterForm/:id?' element={<ApprovalMasterform {...this.context}{...this.props} />} /> */}
                    <Route path='/approvalmasterForm/:id?' element={<WrappermasterForm/>} />
                    {/* <Route path='/approvalmasterForm/' element={<ApprovalMasterform {...this.context}{...this.props} />} />  */}
                    {/* <Route path='/vendor/:id?' element={<Vendor {...this.context}{...this.props} />} /> */}
                    <Route path='/vendor/:id?' element={<WrapperVendor/>} />
                  

                    <Route path='/purchaserequestlist' element={<Purchaserequestlist {...this.context} {...this.props} />} />
                    <Route path='/myapprovals' element={<Myapprovals {...this.context}{...this.props} />} />
                    <Route path='/myrequests' element={<Myrequests {...this.context}{...this.props} />} />
                   
                    {this.renderProtectedRoutes()}
                </Routes>
            </Suspense>
        );
    }
}
export default Routesitems;
