import { Component, Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('../Dashboard/Dashboard.component'));
const PurchaseRequest = lazy(() => import('../Forms/Purchaserequest.component'));
const Home = lazy(() => import('../Home/Home.component'));
const ApprovalMaster = lazy(() => import('../Masters/Approvalmaster.component'));
const Holidays = lazy(() => import('../Masters/Holidays.component'));
const MasterRequisition = lazy(() => import('../Masters/Masterrequisition.component'));
const Vendor = lazy(() => import('../Masters/Vendor.component'));
const PurchaseRequestReorder = lazy(() => import('../Forms/PurchaserequestFormReOrder.component'));

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
        component:ApprovalMaster
    },
    {
        link: '/holidays',
        accessTo: 'everyone',
        canActivate:true,
        component:Holidays
    },
    {
        link: '/vendor',
        accessTo: 'Designers2',
        canActivate:true,component:ApprovalMaster
    }
];
export default sitePermissions;