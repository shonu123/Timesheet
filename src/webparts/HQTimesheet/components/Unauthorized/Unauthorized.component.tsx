import * as React from 'react';
export interface UnAuthorizedProps {
    
}
 
export interface UnAuthorizedState {
    
}
 
class UnAuthorized extends React.Component<UnAuthorizedProps, UnAuthorizedState> {
    //state = {  }
    public render() { 
        return ( <h5>You are not authorize to view this page, please contact administrator </h5> );
    }
}
 
export default UnAuthorized;