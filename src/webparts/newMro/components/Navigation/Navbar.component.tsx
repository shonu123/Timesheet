import * as React from 'react';
import { NavLink } from 'react-router-dom';
// const sitePermissions: any = require('./Routing.module');
import sitePermissions from './Routing.module';
export interface NavBarProps {
    currentUserGroups: any;
}


export interface NavBarState {
    currentUserLinks: Array<string>;
    expandNav:boolean;
}


class NavBar extends React.Component<NavBarProps, NavBarState> {
    public state = { currentUserLinks: [],expandNav:false };
    private currentUserLinksArr = [];
    public componentDidMount() {
        for (let permission of sitePermissions) {
            let accessTo = permission.accessTo;
            if (accessTo == 'everyone' || this.props.currentUserGroups.includes(accessTo)) {
                this.currentUserLinksArr.push(permission.link);
            }
        }
        if (!this.props.currentUserGroups.includes('Timesheet Administrators')) {
            setTimeout(() => {
                if (document.getElementById('O365_SuiteBranding_container') != null)
                    document.getElementById('O365_SuiteBranding_container').style.display = 'none';


                if (document.getElementById('O365_MainLink_Settings_container') != null)
                    document.getElementById('O365_MainLink_Settings_container').style.display = 'none';


                if (document.getElementById('O365_MainLink_Help_container') != null)
                    document.getElementById('O365_MainLink_Help_container').style.display = 'none';
            }, 2000)
        }
        this.setState({ currentUserLinks: this.currentUserLinksArr });
    }
    public onNavItemClick(event) {
        let navLinks = document.querySelectorAll('.nav-click');
        if (navLinks.length > 0) {
            navLinks.forEach(item => {
                item.className = 'dropdown-item';
            });
        }
        event.currentTarget.className = 'nav-click dropdown-item';
        if(event.currentTarget.parentElement.id=='divNavReportItems')
        {
            document.getElementById('divNavReportItems').classList.remove('show')
            document.getElementById('Reports').classList.add('heighlightMasters')
            if(this.props.currentUserGroups.includes('Timesheet Administrators'))
            {
                document.getElementById('divNavMasterItems').classList.remove('show')
                document.getElementById('Masters').classList.remove('heighlightMasters')
            }
        }
        else{
            document.getElementById('divNavMasterItems').classList.remove('show')
            document.getElementById('Masters').classList.add('heighlightMasters')
            document.getElementById('divNavReportItems').classList.remove('show')
            document.getElementById('Reports').classList.remove('heighlightMasters')
        }
        // event.currentTarget.classList.add('nav-click')
    }
    public onNavItemClick2(event) {
        this.setState({expandNav: false})
        let navLinks = document.querySelectorAll('.nav-click2');
        if(navLinks.length > 0 ){
            navLinks.forEach(item => {
                item.className = '';
            });
        }
        event.currentTarget.className = 'nav-click2';
        if(this.props.currentUserGroups.includes('Timesheet Administrators'))
        {
        document.getElementById('divNavMasterItems').classList.remove('show')
        document.getElementById('Masters').classList.remove('heighlightMasters')
        }
        document.getElementById('divNavReportItems').classList.remove('show')
        document.getElementById('Reports').classList.remove('heighlightMasters')
    }
    public render() {
        return (
            <div className=''>
                <div className='nav-main container-fluid'>
                    {/* <div>
                        <img src='/sites/billing.Timesheet/SiteAssets/SynergyLogo-SM.jpg' className='synergyLogo'/>
                    </div> */}
                    {/* <div className="main-title">Timesheet</div> */}
                    <div className="main-title"><NavLink className="redirect" to="/Dashboard"><span className=""><span className="">Timesheet</span></span></NavLink></div>
                    <div className='container-fluid'>


                        <ul className="list-unstyled ul-leftnav components mb-0 mt-2">


                            {this.props.currentUserGroups.includes('Timesheet Administrators')?
                             <li className={`nav-item dropdown`} id="Masters">
                             <a className="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-expanded="false">Masters</a>
                            <div className={`dropdown-menu ${this.state.expandNav?'show':''}`} id="divNavMasterItems">
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    // <li className="" >
                                        <NavLink to="/EmployeeMasterView"  id="employeemaster" onClick={(event) => this.onNavItemClick(event)} className="dropdown-item"><span className="">Approval Matrix</span></NavLink>
                                    // </li>
                                     : ''
                            }
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    // <li className="" >
                                        <NavLink className="dropdown-item" id="ClientMaster" onClick={(event) => this.onNavItemClick(event)} to="/ClientMaster"><span className="">Clients</span></NavLink>
                                    // </li>
                                     : ''
                            }
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    // <li className="" >
                                        <NavLink className="dropdown-item" id="HolidayMaster" onClick={(event) => this.onNavItemClick(event)} to="/HolidayMaster"><span className="">Holidays</span></NavLink>
                                    // </li>
                                     : ''
                            }
                            {/* {
                                (this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins')) ?
                                    // <li className="" >
                                        <NavLink className="dropdown-item" id="DailyTimesheetReport" onClick={(event) => this.onNavItemClick(event)} to="/DailyTimesheetReport"><span className="">Reports</span></NavLink>
                                    // </li> 
                                    : ''
                            }
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins')) ?
                                    // <li className="" >
                                        <NavLink className="dropdown-item" id="WeeklyTimesheetReport" onClick={(event) => this.onNavItemClick(event)} to="/WeeklyTimesheetReport"><span className="">Weekly Reports</span></NavLink>
                                    // </li> 
                                    : ''
                            } */}
                            </div>
                            </li>:''}


                            {/* {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    <li className="" id="employeemaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/EmployeeMasterView"><span className=""><span className="">Approval Matrix</span></span></NavLink>
                                    </li> : ''
                            } */}


                            {/* {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    <li className="" id="ClientMaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/ClientMaster"><span className=""><span className="">Clients</span></span></NavLink>
                                    </li> : ''
                            } */}
                            {
                                (this.props.currentUserGroups.includes('Synergycom Timesheet Members') || this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins') || this.props.currentUserGroups.includes('Timesheet HR')) ?
                                    <li className="nav-click2" id="liDashboard" onClick={(event) => this.onNavItemClick2(event)}>
                                        <NavLink className="" to="/Dashboard"><span className=""><span className="">Dashboard</span></span></NavLink>
                                    </li> : ''
                            }
                                    {/*--------- PTO Dashboard ---------  */}
                            {/* {
                                (this.props.currentUserGroups.includes('Synergycom Timesheet Members') || this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins') || this.props.currentUserGroups.includes('Timesheet HR')) ?
                                    <li className="nav-click2" id="liPTODashboard" onClick={(event) => this.onNavItemClick2(event)}>
                                        <NavLink className="" to="/PTODashboard"><span className=""><span className="">PTODashboard</span></span></NavLink>
                                    </li> : ''
                            } */}
                                    {/* ------------PTO Dashboard----------  */}

                            {/* {
                                (this.props.currentUserGroups.includes('Timesheet Administrators')) ?
                                    <li className="" id="HolidayMaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/HolidayMaster"><span className=""><span className="">Holidays</span></span></NavLink>
                                    </li> : ''
                            } */}
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins')) ?
                                <li  className={`nav-item dropdown`} id="Reports">
                             <a className="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-expanded="false">Reports</a>
                             <div className={`dropdown-menu ${this.state.expandNav?'show':''}`} id="divNavReportItems">
                                <NavLink className="dropdown-item" to="/DailyTimesheetReport" id="DailyTimesheetReport" onClick={(event) => this.onNavItemClick(event)}><span className=""><span className="">Daily Reports</span></span></NavLink>
                                <NavLink className="dropdown-item" to="/WeeklyTimesheetReport" id="WeeklyTimesheetReport" onClick={(event) => this.onNavItemClick(event)}><span className=""><span className="">Weekly Reports</span></span></NavLink>
                            </div>
                                </li>
                                    // <li className="nav-click2" id="DailyTimesheetReport" onClick={(event) => this.onNavItemClick2(event)}>
                                    //     <NavLink className="" to="/DailyTimesheetReport"><span className=""><span className="">Reports</span></span></NavLink>
                                    // </li> : ''
                                    :''
                            }

                                {/* --------------- Weekly Reports ----------- */}
                            {/* {
                                (this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins')) ?
                                    <li className="nav-click2" id="WeeklyTimesheetReport" onClick={(event) => this.onNavItemClick2(event)}>
                                        <NavLink className="" to="/WeeklyTimesheetReport"><span className=""><span className="">Weekly Reports</span></span></NavLink>
                                    </li> : ''
                            } */}
                                {/* --------------- Weekly Reports ----------- */}

                            {/* {
                                (this.props.currentUserGroups.includes('Synergycom Timesheet Members') || this.props.currentUserGroups.includes('Timesheet Administrators') || this.props.currentUserGroups.includes('Dashboard Admins')) ?
                                    <li className="nav-click" id="PTOForm" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/PTOForm"><span className=""><span className="">PTOForm</span></span></NavLink>
                                    </li> : ''
                            } */}
                        </ul>
                    </div>
                </div>
                {/* <nav id="" className="sidebar">
                    <div className="">
                        <ul className="list-unstyled ul-leftnav components mb-5">
                        {(this.props.currentUserGroups.includes('TImesheet Administrators'))?
                            <li className="">
                                {this.state.currentUserLinks.includes('/') ? <NavLink className="" to="/"><span className=""><span className="">Masters</span></span>
                                </NavLink> : null}
                                <ul className="ul-leftnav">
                                    <li className="" id="employeemaster" onClick={(event) => this.onNavItemClick(event)}>
                                        {this.state.currentUserLinks.includes('/employeemasterform') ? <NavLink className="" to="/employeemaster"><span className=""><span className="">Approvals</span></span></NavLink> : null}
                                    </li>
                                </ul>
                            </li> :''}
                            {(this.props.currentUserGroups.includes('TImesheet Initiators'))?
                            <li className="">
                                {this.state.currentUserLinks.includes('/') ? <NavLink className="" to="/"><span className=""><span className="">Masters</span></span>
                                </NavLink> : null}
                                <ul className="ul-leftnav">
                                    <li className="" id="weeklytimesheet" onClick={(event) => this.onNavItemClick(event)}>
                                        {this.state.currentUserLinks.includes('/weeklytimesheet') ? <NavLink className="" to="/weeklytimesheet"><span className=""><span className="">Approvals</span></span></NavLink> : null}
                                    </li>
                                </ul>
                            </li> :''}
                            <li className="" id="employeemaster" onClick={(event) => this.onNavItemClick(event)}>
                                <NavLink className="" to="/employeemasterform"><span className=""><span className="">Employee Master Form</span></span></NavLink>
                            </li>
                            <li className="" id="weeklytimesheet" onClick={(event) => this.onNavItemClick(event)}>
                                <NavLink className="" to="/weeklytimesheet"><span className=""><span className="">Weekly Timesheet</span></span></NavLink>
                            </li>
                            <li id="liDashboardLink" className="" onClick={(event) => this.onNavItemClick(event)}>
                                <NavLink className="" to="/dashboard"><span className=""><span className="">Dashboard</span></span></NavLink>
                            </li>
                        </ul>
                    </div>
                </nav> */}
            </div>
        );
    }
}


export default NavBar;