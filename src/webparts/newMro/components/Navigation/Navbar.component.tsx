import * as React from 'react';
import { NavLink } from 'react-router-dom';
// const sitePermissions: any = require('./Routing.module');
import sitePermissions from './Routing.module';
export interface NavBarProps {
    currentUserGroups: any;
}

export interface NavBarState {
    currentUserLinks: Array<string>;
}

class NavBar extends React.Component<NavBarProps, NavBarState> {
    public state = { currentUserLinks: [] };
    private currentUserLinksArr = [];
    public componentDidMount() {
        for (let permission of sitePermissions) {
            let accessTo = permission.accessTo;
            if (accessTo == 'everyone' || this.props.currentUserGroups.includes(accessTo)) {
                this.currentUserLinksArr.push(permission.link);
            }
        }
        if(!this.props.currentUserGroups.includes('Timesheet Administrators')){
            setTimeout(() => {
            if(document.getElementById('O365_SuiteBranding_container')!=null)
            document.getElementById('O365_SuiteBranding_container').style.display='none';

            if(document.getElementById('O365_MainLink_Settings_container')!=null)
            document.getElementById('O365_MainLink_Settings_container').style.display='none';

            if(document.getElementById('O365_MainLink_Help_container')!=null)
            document.getElementById('O365_MainLink_Help_container').style.display='none';
            },2000)
        }
        this.setState({ currentUserLinks: this.currentUserLinksArr });
    }
    public onNavItemClick(event) {
        let navLinks = document.querySelectorAll('.nav-click');
        if(navLinks.length > 0 ){
            navLinks.forEach(item => {
                item.className = '';
            });
        }
        event.currentTarget.className = 'nav-click';
        // event.currentTarget.classList.add('nav-click')
    }
    public render() {
        return (
            <div className=''>
                <div className='nav-main container-fluid'>
                    {/* <div>
                        <img src='/sites/billing.Timesheet/SiteAssets/SynergyLogo-SM.jpg' className='synergyLogo'/>
                    </div> */}
                    <div className="main-title">Timesheet</div>
                    
                    <div className='container-fluid'>                
                         
                        <ul className="list-unstyled ul-leftnav components mb-0 mt-2">
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators'))?
                                    <li className="" id="employeemaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/EmployeeMasterView"><span className=""><span className="">Approval Matrix</span></span></NavLink>
                                    </li>:''
                            }
                            
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators'))?
                                    <li className="" id="ClientMaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/ClientMaster"><span className=""><span className="">Clients</span></span></NavLink>
                                    </li>:''
                            }
                            {
                                (this.props.currentUserGroups.includes('Timesheet Members') ||this.props.currentUserGroups.includes('Timesheet Administrators'))?
                                    <li className="nav-click" id="liDashboard" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/Dashboard"><span className=""><span className="">Dashboard</span></span></NavLink>
                                    </li>:''
                            }
                            {
                                (this.props.currentUserGroups.includes('Timesheet Administrators'))?
                                    <li className="" id="HolidayMaster" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/HolidayMaster"><span className=""><span className="">Holidays</span></span></NavLink>
                                    </li>:''
                            }
                                                        {
                                (this.props.currentUserGroups.includes('Timesheet Administrators'))?
                                    <li className="" id="TimesheetReport" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/TimesheetReport"><span className=""><span className="">Reports</span></span></NavLink>
                                    </li>:''
                            }
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