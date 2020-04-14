import * as React from 'react';
import { getToken, login } from '../../api/auth';
import { getUserInfo } from '../../api';
import { Redirect } from 'react-router-dom';
import { ChooseUsername } from './ChooseUsername';

interface loginProps {
    onLogin(isLoggedIn: boolean): void;
    redirect: string
}

export function Login( { onLogin, redirect }: loginProps) {

    let [ needsUsername, setNeedsUsername ] = React.useState(false);
    let [ needsRedirect, setNeedsRedirect ] = React.useState(false);

    React.useEffect(() => {
        getUserInfo()
        .then(({username}) => {
            if (username) {
                setNeedsRedirect(true);
                onLogin(true);
            } else {
                setNeedsUsername(true);
            }
        })
        .catch(err => {
            console.log(err);
            login();
        });
    }) 

    if (needsRedirect) {
        return <Redirect to={redirect} />
    }

    if (needsUsername) {
        return <ChooseUsername onUsernameVerified={() => onLogin(true)}/>
    }

    return <div> Loading... </div>

}