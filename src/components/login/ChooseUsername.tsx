import * as React from 'react';
import { setUsername, UserInfo } from '../../api';

interface chooseUsernameProps {
    onUsernameVerified(info: UserInfo): void
}

export function ChooseUsername({ onUsernameVerified }: chooseUsernameProps) {

    let [ usernameTaken, setUsernameTaken ] = React.useState(false);
    let inputbox = React.createRef<HTMLInputElement>();

    return <div>
        <h1>Welcome to the Skateboard Vision Project</h1>

        <p> Please choose a username this will appear next to your contributions </p>

        <input type="text" ref={inputbox} />
        <button onClick={() => {
            if (!inputbox.current) {
                return
            }
            let box = inputbox.current;
            box.disabled = true;
            setUsername(box.value)
            .then(onUsernameVerified)
            .catch(err => {
                console.log(err)
                setUsernameTaken(true);
                box.disabled = false;
            })
        }}>Use this Username</button>

        { usernameTaken && <p style={{color: "red"}}> This username is already taken! </p> }
    </div>
}