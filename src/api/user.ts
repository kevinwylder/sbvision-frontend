import { getToken, login, clearToken } from './auth';
import { API_URL } from './url';

export interface UserInfo {
    email: string
    username: string
    uploadID: string
}

let userInfo: UserInfo|undefined;

export async function isLoggedIn() {
    try {
        await getToken();
        return true;
    } catch (err) {
        return false;
    }
}

export function getUserInfo(): Promise<UserInfo> {
    if (userInfo) {
        return Promise.resolve(userInfo);
    }
    return getToken()
    .then(token => fetch(`${API_URL}/user`, {
        method: "GET",
        headers: {
            Identity: token,
        }
    }))
    .then(res => {
        if (res.status == 401) {
            login();
        }
        return res.json()
    })
    .then((info: UserInfo) => {
        userInfo = info;
        return userInfo;
    })
}

export function setUsername(username: string): Promise<UserInfo> {
    return getToken()
    .then(token => fetch(`${API_URL}/user`, {
        method: "POST",
        headers: {
            Identity: token,
        },
        body: JSON.stringify({ username })
    }))
    .then(res => res.json())
    .then((info: UserInfo) => {
        userInfo = info;
        return userInfo;
    })
}

export function logout() {
    userInfo = undefined;
    clearToken();
}