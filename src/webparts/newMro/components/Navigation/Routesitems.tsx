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
import Holidays from '../Masters/Holidays.component';
import ProjectCode from '../Masters/ProjectCode.component';
import ProjectCategory from '../Masters/ProjectCategory.component';
import CommodityCategory from '../Masters/CommodityCategory.component';
const Purchaserequestlist = lazy(() => import('../Reports/PurchaseRequest.component'));
// import Purchaserequestlist from '../Reports/PurchaseRequest.component';
import ApprovalMasterform from '../Masters/ApprovalmasterForm.component';
const MasterRequisition = lazy(() => import('../Masters/Masterrequisition.component'));
import Vendor from '../Masters/Vendor.component';
import RequisitionReport from '../Reports/Requistionreport.component';
import Buyers from '../Masters/Buyer.component';
import Notifications from '../Masters/Notifications.component';
import Myapprovals from '../Dashboard/Myapprovals.component';
import Myrequests from '../Dashboard/Myrequests.component';
//const Units = lazy(()=> import('../Masters/Units.component'));
import Units from '../Masters/Units.component';
import PriceUnits from '../Masters/PriceUnits.component';
const Searchbypolist = lazy(() => import('../Reports/SearchRequestbyPO.component'));
import Plant from '../Masters/Plant.component';
import RequsitionerCodes from '../Masters/RequsitionerCodes.component';
import Programs from '../Masters/Programs.component';
import Tools from '../Masters/Tools.component';

const PurchaseRequestReorder = lazy(() => import('../Forms/PurchaserequestFormReOrder.component'));


import { SPHttpClient, SPHttpClientResponse, SPHttpClientConfiguration } from '@microsoft/sp-http';
import sitePermissions from './Routing.module';

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
          const WrapperReorder = (props) => {
            let params =useParams();
            return <PurchaseRequestReorder {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrappermasterForm = (props) => {
            let params =useParams();
            return <ApprovalMasterform {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperVendor = (props) => {
            let params =useParams();
            return <Vendor {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperTools = (props) => {
            let params =useParams();
            return <Tools {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperBuyers = (props) => {
            let params =useParams();
            return <Buyers {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }          
          const WrapperNotifications = (props) => {
            let params =useParams();
            return <Notifications {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperPlant = (props) => {
            let params =useParams();
            return <Plant {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperRequsitionerCodes = (props) => {
            let params =useParams();
            return <RequsitionerCodes {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperPrograms = (props) => {
            let params =useParams();
            return <Programs {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperUnits = (props) => {
            let params =useParams();
            return <Units {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperPriceUnits = (props) => {
            let params =useParams();
            return <PriceUnits {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }          
          const WrapperCommodityCategory = (props) => {
            let params =useParams();
            return <CommodityCategory {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperProjectCode = (props) => {
            let params =useParams();
            return <ProjectCode {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperProjectCategory = (props) => {
            let params =useParams();
            return <ProjectCategory {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperHolidays = (props) => {
            let params =useParams();
            return <Holidays {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperMasterRequisition = (props) => {
            let params =useParams();
            return <MasterRequisition {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
          const WrapperApprovalMaster = (props) => {
            let params =useParams();
            return <ApprovalMaster {...this.context}{...this.props}  {...{...props, match: {params}} } />
          }
        return (
            <Suspense fallback={<div></div>}>
                <Routes>
                    <Route path='/' element={<Dashboard {...this.context}{...this.props} />} />
                    <Route path='/approvalmaster' element={<WrapperApprovalMaster/>} />
                    {/* <Route path='/masterrequisition' render={(matchprops) => <MasterRequisition {...matchprops}{...this.props} />} /> */}
                    <Route path='/masterrequisition/:id?' element={<WrapperMasterRequisition/>} />
                    <Route path='/purchaserequest/:id?' element={<Wrapper />} />
                    <Route path='/purchaserequestreorder/:id?' element={ <WrapperReorder/> } />
                    <Route path='/requisitionreport' element={(matchprops) => <RequisitionReport {...matchprops}{...this.props} />} />
                    <Route path='/searchbypolist' element={<Searchbypolist {...this.context}{...this.props} />} />
                    <Route path='/dashboard' element={<Dashboard {...this.context} {...this.props} />} />
                    {/* <Route path='/approvalmasterForm/:id?' element={<ApprovalMasterform {...this.context}{...this.props} />} /> */}
                    <Route path='/approvalmasterForm/:id?' element={<WrappermasterForm/>} />
                    {/* <Route path='/approvalmasterForm/' element={<ApprovalMasterform {...this.context}{...this.props} />} />  */}
                    {/* <Route path='/vendor/:id?' element={<Vendor {...this.context}{...this.props} />} /> */}
                    <Route path='/vendor/:id?' element={<WrapperVendor/>} />
                    <Route path='/tools/:id?' element={<WrapperTools/>} />
                    {/* <Route path='/holiday' render={(matchprops) => <Holidays {...matchprops}{...this.props} />} /> */}
                    <Route path='/holiday/:id?' element={<WrapperHolidays/>} />
                    <Route path='/projectcode/:id?' element={<WrapperProjectCode />} />
                    <Route path='/ProjectCategory/:id?' element={<WrapperProjectCategory />} />
                    <Route path='/commoditycategory/:id?' element={<WrapperCommodityCategory/>} />
                    {/* <Route path='/Buyers' element={<Buyers {...this.context}{...this.props} />} /> */}
                    {/* <Route path='/Buyers/:id?' element={<Buyers {...this.context}{...this.props} />} /> */}
                    <Route path='/Buyers/:id?' element={<WrapperBuyers/>} />

                    <Route path='/Notifications' element={<Notifications {...this.context}{...this.props} />} />
                    {/* <Route path='/Notifications/:id?' element={(matchprops) => <Notifications {...matchprops}{...this.props} />} /> */}
                    <Route path='/Notifications/:id?' element={<WrapperNotifications/>} />

                    <Route path='/purchaserequestlist' element={<Purchaserequestlist {...this.context} {...this.props} />} />
                    <Route path='/myapprovals' element={<Myapprovals {...this.context}{...this.props} />} />
                    <Route path='/myrequests' element={<Myrequests {...this.context}{...this.props} />} />
                    <Route path='/units/:id?' element={<WrapperUnits/>} />
                    <Route path='/priceunit/:id?' element={<WrapperPriceUnits />} />
                    {/* <Route path='/Plants/:id?' element={<Plant {...this.context}{...this.props} />} /> */}
                    <Route path='/Plants/:id?' element={<WrapperPlant/>} />
                    {/* <Route path='/Plants' element={<Plant {...this.context}{...this.props} />} /> */}
                    {/* <Route path='/Programs' element={<Programs {...this.context}{...this.props} />} /> */}
                    <Route path='/Programs/:id?' element={<WrapperPrograms />} />
                    <Route path='/RequsitionerCodes/:id?' element={<WrapperRequsitionerCodes />} />
                    {this.renderProtectedRoutes()}
                </Routes>
            </Suspense>
        );
    }
}
export default Routesitems;
