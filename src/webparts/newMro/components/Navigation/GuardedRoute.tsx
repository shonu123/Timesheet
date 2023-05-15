import * as React from 'react';
import { Route,Routes,Navigate,BrowserRouter as Router} from "react-router-dom";
import UnAuthorized from '../Unauthorized/Unauthorized.component';

const GuardedRoute = ({ component: Component, auth, ...rest }) => (
    <Route  {...rest} element={(props) => (
        auth === true ? <Component {...rest} {...props} />: <UnAuthorized />)
    } />

);
export default GuardedRoute;