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
        //console.log('props in navbar', this.props);
        //console.log('permissions', sitePermissions);
        // let nav = window.location.href.split("#/")[1]; 
        // if(nav.length)
        // document.getElementsByTagName("li")[nav].className = 'nav-click'

        for (let permission of sitePermissions) {
            let accessTo = permission.accessTo;
            if (accessTo == 'everyone' || this.props.currentUserGroups.includes(accessTo)) {
                this.currentUserLinksArr.push(permission.link);
            }
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
    }
    public render() {
        return (
            <div className=''>
                <nav id="" className="sidebar">
                    <div className="">
                        <ul className="list-unstyled ul-leftnav components mb-5">
                        {(this.props.currentUserGroups.includes('MRO Purchasing Team') || this.props.currentUserGroups.includes('SharePoint – MRO Administrator'))?
                            <li className="">
                                {this.state.currentUserLinks.includes('/') ? <NavLink className="" to="/"><span className=""><span className="">Masters</span></span>
                                </NavLink> : null}
                                <ul className="ul-leftnav">
                                    <li className="" id="approvalmaster" onClick={(event) => this.onNavItemClick(event)}>
                                        {this.state.currentUserLinks.includes('/approvalmaster') ? <NavLink className="" to="/approvalmaster"><span className=""><span className="">Approvals</span></span></NavLink> : null}
                                    </li>
                                    <li className="" id="vendor" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/vendor"><span className=""><span className="">Vendors</span></span></NavLink>
                                    </li>
                                    <li className="" id="Buyers" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/Buyers"><span className=""><span className="">Buyers</span></span></NavLink>
                                    </li>
                                    <li className="" id="Notifications" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/Notifications"><span className=""><span className="">Notifications</span></span></NavLink>
                                    </li>
                                    
                                    <li className="" id="Plants" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/Plants"><span className=""><span className="">Plants</span></span></NavLink>
                                    </li>
                                    
                                    <li className="" id="holiday" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/holiday"><span className=""><span className="">Holidays</span></span></NavLink>
                                    </li>
                                    <li className="" id="Programs" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/Programs"><span className=""><span className="">Programs</span></span></NavLink>
                                    </li>
                                    <li className="" id="projectcode" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/projectcode"><span className=""><span className="">Project Code</span></span></NavLink>
                                    </li>
                                    <li className="" id="RequsitionerCodes" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/RequsitionerCodes"><span className=""><span className="">Requisitioner Codes</span></span></NavLink>
                                    </li>
                                    <li className="" id="commoditycategory" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/commoditycategory"><span className=""><span className="">Commodity Category</span></span></NavLink>
                                    </li>
                                    <li className="" id="units" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/units"><span className=""><span className="">Quantity for  Units</span></span></NavLink>
                                    </li>
                                    <li className="" id="priceunit" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/priceunit"><span className=""><span className="">Price for Units</span></span></NavLink>
                                    </li>
                                    <li className="" id="tools" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/tools"><span className=""><span className="">Tools</span></span></NavLink>
                                    </li>
                                </ul>
                            </li> :''}
                            <li className=""><span className=""><span className=""><span className="">Forms</span></span></span>
                                <ul className="ul-leftnav">
                                {/* <li className="" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/masterrequisition"><span className=""><span className="">Master Requisition</span></span></NavLink>
                                    </li> */}
                                    <li id="lipurchaseLink" className="ul-leftnav selected" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/purchaserequest"><span className=""><span className="">Requisition</span></span></NavLink></li>
                                </ul>
                            </li>
                            {(this.props.currentUserGroups.includes('MRO Reporting') || this.props.currentUserGroups.includes('SharePoint – MRO Administrator'))?
                            <li  className=""><span className=""><span className=""><span className="">Reports</span></span></span>
                                <ul className="ul-leftnav">
                                    <li className="" id="lipurchaserequestlistLink" onClick={(event) => this.onNavItemClick(event)}>
                                        <NavLink className="" to="/purchaserequestlist"><span className=""><span className="">Requisition</span></span></NavLink>
                                    </li>
                                    
                                    {/* <li className="">
                                        <NavLink className="" to="/requisitionreport"><span className=""><span className="">Reports</span></span></NavLink>
                                    </li> */}
                                </ul>
                            </li>:''}
                            <li className="" id="lisearchbypolistlink" onClick={(event) => this.onNavItemClick(event)}>
                                <NavLink className="" to="/searchbypolist"><span className=""><span className="">Search by PO</span></span></NavLink>
                            </li>
                            <li id="liDashboardLink" className="" onClick={(event) => this.onNavItemClick(event)}>
                                <NavLink className="" to="/dashboard"><span className=""><span className="">Dashboard</span></span></NavLink>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* <aside id='sidenavApp' className='ms-dialogHidden ms-forceWrap ms-noList'>
                <div className='ms-dialogHidden ms-forceWrap ms-noList'>
                    <div id='DeltaPlaceHolderLeftNavBar' className='ms-core-navigation'>
                        <div className='noindex ms-core-listMenu-verticalBox'>

                            <ul id="zz13_RootAspMenu" className="root ms-core-listMenu-root static">
                                <li className="static">
                                    {this.state.currentUserLinks.includes('/') ? <NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Home</span></span>
                                    </NavLink> : null}
                                    <ul className="static">
                                        <li className="static">
                                            {this.state.currentUserLinks.includes('/approvalmaster')?<NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/approvalmaster"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Approval Master</span></span></NavLink> : null}
                                        </li>
                                        <li className="static">
                                            <NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/vendor"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Vendor Master</span></span></NavLink>
                                        </li>
                                        <li className="static">
                                            <NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/masterrequisition"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Master Requisition</span></span></NavLink>
                                        </li>
                                    </ul></li>
                                <li className="static"><span className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Forms</span></span></span><ul className="static">
                                    <li className="static selected">
                                        <NavLink className="static selected menu-item ms-core-listMenu-item ms-displayInline ms-core-listMenu-selected ms-navedit-linkNode" to="/purchaserequest"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Purchase Request</span><span className="ms-hidden">Currently selected</span></span></NavLink></li>
                                </ul></li>
                                <li className="static"><span className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Reports</span></span></span><ul className="static">
                                    <li className="static">
                                        <NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/requisitionreport"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Reports</span></span></NavLink>
                                    </li>
                                </ul></li>
                                <li className="static">
                                    <NavLink className="static menu-item ms-core-listMenu-item ms-displayInline ms-navedit-linkNode" to="/dashboard"><span className="additional-background ms-navedit-flyoutArrow"><span className="menu-item-text">Dashboard</span></span></NavLink>
                                </li>
                            </ul>

                        </div>
                    </div>
                </div>
            </aside> */}
            </div>
        );
    }
}

export default NavBar;