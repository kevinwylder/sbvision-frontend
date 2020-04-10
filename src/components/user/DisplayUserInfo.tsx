import * as React from 'react';

import { UserInfo, logout } from '../../api';
import { Redirect } from 'react-router-dom';

interface displayUserProps{
    info?: UserInfo
}

export function DisplayUserInfo({info}: displayUserProps) {
    let [ loggedOut, setLoggedOut ] = React.useState(false);
    if (!info) {
        return <div> Loading... </div>
    }
    if (loggedOut) {
        return <Redirect to="/" />
    }
    return <div>
        <h1> Hello, {info.username}</h1>
        <button onClick={() => {
            logout()
            setLoggedOut(true);
        }}> Logout </button>
    </div> 
}