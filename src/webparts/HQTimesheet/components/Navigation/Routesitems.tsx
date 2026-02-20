import * as React from 'react';
import { Component, Suspense, lazy } from 'react';
import { Route, Routes, Navigate, useParams, BrowserRouter as Router, } from 'react-router-dom';
import { SPHttpClient, SPHttpClientResponse, SPHttpClientConfiguration } from '@microsoft/sp-http';
// Dashboards
import Dashboard from '../Dashboard/Dashboard.component';
import TimeOffDashboard from '../PTODashboard/TimeOffDashboard.component';
// Forms
import EmployeeMasterForm from '../Masters/EmployeeMasterForm.component';
import TimeOffRequestForm from '../Forms/TimeOffRequestForm.component';
import WeeklyTimesheet from '../Forms/WeeklyTimesheet.component';
// Masters
import HolidaysList from '../Masters/HolidayMaster.component';
import EmployeeMasterView from '../Masters/EmployeeMasterView.component';
import Clients from '../Masters/ClientMaster.component';
import EmployeeClassification from '../Masters/EmployeeClassificationMaster.component';
import PTOPolicy from '../Masters/PTOPolicyMaster.component';
import TimeOffType from '../Masters/TimeOffTypeMaster.component';
import Employee from '../Masters/EmployeeMaster.component';
// Reports
import DailyTimesheetReport from '../Reports/DailyTimesheetReport.component';
import WeeklyTimesheetReport from '../Reports/WeeklyTimesheetReport.component';
import MonthlyTimesheetReport from '../Reports/MonthlyTimesheetReport.component';
import PTOSummaryReport from '../Reports/PTOSummaryReport';
import PTODetailedReport from '../Reports/PTODetailedReport';

// Unused routes

// Unused
// import PTODashboard from '../PTODashboard/PTODashboard.component';
// import { render } from 'react-dom';
// import GuardedRoute from './GuardedRoute';
// import sitePermissions from './Routing.module';
// import Home from '../Home/Home.component';
// const Purchaserequestlist = lazy(() => import('../Reports/PurchaseRequest.component'));
// import RequisitionReport from '../Reports/Requistionreport.component';
// import EmpPTOCredit from '../Masters/EmployeePTOCredit.component';
// import TimesheetReport from '../Reports/TimesheetReport.component';
// import PTOReport from '../Reports/PTOReport';
// import DelegateManagerApprovals from '../../UnUsedFiles/AutoManagerDelegtion.component'
// import DelegateReviewerApprovals from '../../UnUsedFiles/Test.component';
// import Myrequests from '../Dashboard/Myrequests.component';


//Previously commented
//const Dashboard = React.lazy(() => import('../Dashboard/Dashboard.component'));
// import PurchaseRequest from '../../UnUsedFiles/PurchaserequestForm.component';
// const Home = lazy(() => import('../Home/Home.component'));
// import Purchaserequestlist from '../Reports/PurchaseRequest.component';
// import WeeklyTimesheet from '../Forms/WeeklyTimesheet.component'; 
// import WeeklyTimesheetReport from '../Reports/WeeklyTimesheetReportPDF.component';
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
  // private renderProtectedRoutes = () => {
  //     let currentUserGroups = this.props.currentUserGroups;
  //     let protectedRoutes = sitePermissions.map((permission) => {
  //         if (permission.canActivate) {
  //             let authinticated = false;
  //             if (currentUserGroups.includes(permission.accessTo)) {
  //                 authinticated = true;
  //             }
  //             return (<Route path={permission.link} element={<GuardedRoute {...this.props} path={permission.link} component={permission.component} auth={authinticated}></GuardedRoute>} />)
  //         }
  //         return null;
  //     });
  //     // this.setState({ isPermissionChecked: true });
  //     return protectedRoutes;
  // }
  public render() {

    // const Wrapper = (props) => {
    //     let params = useParams();
    //     return <PurchaseRequest {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }

    //  const WrapperPTOCreditMaster = (props) => {
    //     let params =useParams();
    //     return <EmpPTOCredit {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }

    //  const WrapperPTODashboard = (props) => {
    //     let params =useParams();
    //     return <PTODashboard {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }

    //  const TimesheetReports = (props) => {
    //     let params =useParams();
    //     return <TimesheetReport {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }

    //  const WrapperManagerDelegatesForm = (props) => {
    //     let params =useParams();
    //     return <DelegateManagerApprovals {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }
    //   const WrapperReviewerDelegatesForm = (props) => {
    //     let params =useParams();
    //     return <DelegateReviewerApprovals {...this.context}{...this.props}  {...{...props, match: {params}} } />
    //   }

    // Dashboards
    const WrapperDashboard = (props) => {
      let params = useParams();
      return <Dashboard {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperTimeOffDashboard = (props) => {
      let params = useParams();
      return <TimeOffDashboard {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    // Forms
    const WrapperEmployeeMasterForm = (props) => {
      let params = useParams();
      return <EmployeeMasterForm {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperTimeOffRequestForm = (props) => {
      let params = useParams();
      return <TimeOffRequestForm {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperWeeklyTimesheet = (props) => {
      let params = useParams();
      return <WeeklyTimesheet {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }

    // Masters
    const WrapperMasterView = (props) => {
      let params = useParams();
      return <EmployeeMasterView {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperHolidayMaster = (props) => {
      let params = useParams();
      return <HolidaysList {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperClientMaster = (props) => {
      let params = useParams();
      return <Clients {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperEmployeeClassificationMaster = (props) => {
      let params = useParams();
      return <EmployeeClassification {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperPTOPolicyMaster = (props) => {
      let params = useParams();
      return <PTOPolicy {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperTimeOffTypeMaster = (props) => {
      let params = useParams();
      return <TimeOffType {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WrapperEmployeeMaster = (props) => {
      let params = useParams();
      return <Employee {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }


    // Reports
    const DailyTimesheetReports = (props) => {
      let params = useParams();
      return <DailyTimesheetReport {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const WeeklyTimesheetReports = (props) => {
      let params = useParams();
      return <WeeklyTimesheetReport {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const MonthlyTimesheetReports = (props) => {
      let params = useParams();
      return <MonthlyTimesheetReport {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const PTOSummaryReports = (props) => {
      let params = useParams();
      return <PTOSummaryReport {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    const PTODetailedReports = (props) => {
      let params = useParams();
      return <PTODetailedReport {...this.context}{...this.props}  {...{ ...props, match: { params } }} />
    }
    
    return (
      <Suspense fallback={<div></div>}>
        <Routes>
          {/* <Route path='/' element={<Dashboard {...this.context}{...this.props}  />} />WrapperDashboard */}
          {/* <Route path='/PTODashboard/:message?' element={<WrapperPTODashboard />} />
          <Route path='/DelegateApprovalTimesheets/:id?' element={<WrapperManagerDelegatesForm />} />
          <Route path='/DelegateReviewTimesheets/:id?' element={<WrapperReviewerDelegatesForm />} />
          <Route path='/EmployeePTOCreditMaster/:id?' element={<WrapperPTOCreditMaster />} />
          <Route path='/purchaserequest/:id?' element={<Wrapper />} />
          <Route path='/TimesheetReport/' element={<TimesheetReports />} />
          <Route path='/purchaserequestlist' element={<Purchaserequestlist {...this.context} {...this.props} />} />
                    {this.renderProtectedRoutes()} 
                              <Route path='/myrequests' element={<Myrequests {...this.context}{...this.props} />} />
*/}



          {/* Dashboards */}
          <Route path='/:message?' element={this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins') || this.props.currentUserGroups.includes('Synergycom Timesheet Members') ? <WrapperDashboard /> : this.props.currentUserGroups.includes('Time Off Members') ? <WrapperTimeOffDashboard /> : <WrapperDashboard />} />
          <Route path='/Dashboard/:message?' element={<WrapperDashboard />} />
          <Route path='/TimeOffDashboard/:message?' element={<WrapperTimeOffDashboard />} />

          {/* Forms */}
          <Route path='/WeeklyTimesheet/:id?' element={<WrapperWeeklyTimesheet />} />
          <Route path='/EmployeeMasterForm/:id?/:redirect?' element={<WrapperEmployeeMasterForm />} />
          <Route path='/TimeOffRequestForm/:id?' element={<WrapperTimeOffRequestForm />} />

          {/* Masters */}
          <Route path='/EmployeeMasterView/:message?' element={<WrapperMasterView />} />
          <Route path='/HolidayMaster/:id?' element={<WrapperHolidayMaster />} />
          <Route path='/ClientMaster/:id?' element={<WrapperClientMaster />} />
          <Route path='/EmployeeClassificationMaster/:id?' element={<WrapperEmployeeClassificationMaster />} />
          <Route path='/PTOPolicyMaster/:id?' element={<WrapperPTOPolicyMaster />} />
          <Route path='/TimeOffTypeMaster/:id?' element={<WrapperTimeOffTypeMaster />} />
          <Route path='/EmployeeMaster/:id?' element={<WrapperEmployeeMaster />} />

          {/* Reports */}
          <Route path='/DailyTimesheetReport/' element={<DailyTimesheetReports />} />
          <Route path='/WeeklyTimesheetReport/' element={<WeeklyTimesheetReports />} />
          <Route path='/Bi-WeeklyTimesheetReport/' element={<MonthlyTimesheetReports />} />
          <Route path='/PTOSummaryReport/' element={<PTOSummaryReports />} />
          <Route path='/PTODetailedReport/' element={<PTODetailedReports />} />

        </Routes>
      </Suspense>
    );
  }
}
export default Routesitems;
