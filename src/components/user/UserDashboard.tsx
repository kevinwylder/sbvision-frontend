import * as React from 'react';
import { UserInfo, ensureToken, getUserInfo, setUsername } from '../../api';
import { DisplayUserInfo } from './DisplayUserInfo';
import { ERR_USER_NOT_LOGGED_IN } from '../../api/user';

export function UserDashboard() {

    let [ userInfo, setUserInfo ] = React.useState<UserInfo>();
    let [ chooseUsername, setChooseUsername ] = React.useState(false);
    let [ usernameTaken, setUsernameTaken ] = React.useState(false);
    let inputbox = React.createRef<HTMLInputElement>();

    React.useEffect(() => {
        ensureToken()
        .then(getUserInfo)
        .then(setUserInfo)
        .catch(err => {
            if (err != ERR_USER_NOT_LOGGED_IN) {
                console.log(err, "Assuming the user hasn't set username yet");
                setChooseUsername(true);
            }
        });
    }, [])

    if (!chooseUsername) {
        return <DisplayUserInfo info={userInfo} />
    }

    return <div>
        <h1>Welcome to the Skateboard Vision Project</h1>

        <p> Please choose a username this will appear next to your contributions</p>

        <input type="text" ref={inputbox} />
        <button onClick={() => {
            if (!inputbox.current) {
                return
            }
            let box = inputbox.current;
            box.disabled = true;
            setUsername(box.value)
            .then(info => {
                setUserInfo(info)
                setChooseUsername(false);
                console.log("Set username to", info);
            })
            .catch(err => {
                console.log(err)
                setUsernameTaken(true);
                box.disabled = false;
            })
        }}>Use this Username</button>

        { usernameTaken && <p style={{color: "red"}}> This username is already taken! </p> }

    </div>
}