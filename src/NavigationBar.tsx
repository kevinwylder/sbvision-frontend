import * as React from 'react';
import { Link } from 'react-router-dom';

import './style.css';
import { RotatingSkateboard } from './components/RotatingSkateboard';
import { logout } from './api';

interface navBarProps { 
    loggedIn: boolean 
    setLoggedIn(s: boolean): void
}

export function NavigationBar( { loggedIn, setLoggedIn }: navBarProps ) {

    if (loggedIn) {
        return <div className="nav-bar">
            <Link to="/" className="nav-bar-tab" ><RotatingSkateboard/></Link>
            <Link to="/tricks" className="nav-bar-tab"><div> Tricks </div></Link>
            <Link to="/dataset" className="nav-bar-tab"><div> Dataset </div></Link>
            <Link to="/dashboard" className="nav-bar-tab"><div> Dashboard </div></Link>
            <Link to="/" className="nav-bar-tab nav-bar-tab-last" onClick={() => {
                logout();
                setLoggedIn(false);
            }}><div> Logout </div></Link>
        </div>
    }

    return <div className="nav-bar">
        <Link to="/" className="nav-bar-tab" ><RotatingSkateboard/></Link>
        <Link to="/tricks" className="nav-bar-tab"><div> Tricks </div></Link>
        <Link to="/dataset" className="nav-bar-tab"><div> Dataset </div></Link>
        <Link to="/login" className="nav-bar-tab nav-bar-tab-last"> Login / Sign Up </Link>
    </div>
}