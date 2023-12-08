import * as React from 'react';
import { INewMroProps } from './INewMroProps';
import { HashRouter } from 'react-router-dom';
import NavBar from './Navigation/Navbar.component';
import Routes from './Navigation/Routesitems';
import { SPHttpClient, SPHttpClientResponse} from '@microsoft/sp-http';

export default class NewMro extends React.Component<INewMroProps, {}> {
  public state = {
    isPermissionChecked: false,
    currentUserGroups: []
  };
  private hideInterval;

  public componentDidMount() {
    //get current user permissions
    let siteUrl = this.props.spContext.webAbsoluteUrl;
    //console.log('site url', siteUrl);
    this.renderNavContent(siteUrl);
    this.hideInterval = setInterval(this.hideSideNav, 1000);
  }

  private hideSideNav = () => {
    if (document.querySelector<HTMLInputElement>('sidenav')) {
      document.querySelector<HTMLInputElement>('sidenav').style.display = 'none';
      clearInterval(this.hideInterval);
    }
    
  }

  private renderNavContent = (siteURL) => {
    let spGroupsQuery = siteURL + "/_api/web/currentuser/groups";
    this.props.spHttpClient.get(spGroupsQuery, SPHttpClient.configurations.v1).then((res: SPHttpClientResponse) => {
      if (res.ok) {
        res.json().then((resp: any) => {
          let items = resp.value;
          let currentUserGroupsList = [];
          for (let group of items) {
            currentUserGroupsList.push(group.Title);
          }
          this.setState({ isPermissionChecked: true, currentUserGroups: currentUserGroupsList });
        });
      }
      else {
        //console.log('something went wrong');
      }
    });
  }
  public render(): React.ReactElement<INewMroProps> {
    const {
     
    } = this.props;

    return (
      <HashRouter>
        <div className='wrapper d-flex align-items-stretch inactive' id="site_content">
          {this.state.isPermissionChecked ? <NavBar {...this.props} {...this.state} /> : null}
          {this.state.isPermissionChecked ? <Routes  {...this.state} {...this.props} /> : null}
        </div>
      </HashRouter>
    );
  }
}
