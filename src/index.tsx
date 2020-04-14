import * as React from "react";
import * as ReactDOM from "react-dom";
import {
    BrowserRouter as Router,
    Switch,
    Route,
} from 'react-router-dom';

import { NavigationBar } from "./NavigationBar";
import { HomePage } from './components/HomePage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { isLoggedIn } from './api';
import { Login } from "./components/login/Login";

export function Main() {

    let [ loggedIn, setLoggedIn ] = React.useState(false);

    React.useEffect(() => {
        isLoggedIn()
        .then(setLoggedIn);
    }, []);

    return <Router>
        <NavigationBar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
        <Switch>
            <Route exact path="/" >
                <HomePage />
            </Route>
            <Route path="/login">
                <Login onLogin={setLoggedIn} redirect="/dashboard" />
            </Route>
            <Route path="/dashboard"> 
                <UserDashboard />
            </Route>
        </Switch>
    </Router>
}

ReactDOM.render(
    <Main />,
    document.getElementById("root")
)