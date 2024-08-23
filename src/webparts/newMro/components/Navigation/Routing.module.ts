import { Component, Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('../Dashboard/Dashboard.component'));
const PurchaseRequest = lazy(() => import('../Forms/Purchaserequest.component'));
const Home = lazy(() => import('../Home/Home.component'));
// const ApprovalMaster = lazy(() => import('../Masters/Approvalmaster.component'));
// const Vendor = lazy(() => import('../Masters/Vendor.component'));
const WeeklyTimesheet = lazy(() => import('../Forms/WeeklyTimesheet.component'));
const Clients = lazy(() => import('../Masters/ClientMaster.component'));
const EmployeeMasterForm = lazy(() => import('../Masters/EmployeeMasterForm.component'));
const EmployeeMasterView = lazy(() => import('../Masters/EmployeeMasterView.component'));
const Holidays = lazy(() => import('../Masters/HolidayMaster.component'));
const MyTeam = lazy(() => import('../Masters/MyTeam.component'));
const AllRequests = lazy(() => import('../Dashboard/AllRequests.components'));
const Approvers = lazy(() => import('../Dashboard/Approvers.component'));
const DeligateTimesheets = lazy(() => import('../Dashboard/DelegateTimesheets.component'));
const MyRequests = lazy(() => import('../Dashboard/Myrequests.component'));
const MyReviewes = lazy(() => import('../Dashboard/Reviewers.component'));
const DailyTimesheetReport = lazy(() => import('../Reports/DailyTimesheetReport.component'));
const WeeklyTimesheetReport = lazy(() => import('../Reports/WeeklyTimesheetReport.component'));



const sitePermissions = [
    {
        link: '/',
        accessTo: 'everyone',
        canActivate:false,
        component:Home
    },
    {
        link: '/approvalmaster',
        accessTo: 'everyone',
        canActivate:true,
        // component:ApprovalMaster
    },
    {
        link: '/vendor',
        accessTo: 'Designers2',
        // canActivate:true,component:ApprovalMaster
    }
];
export default sitePermissions;