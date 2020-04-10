import { getToken, login, clearToken } from './auth';
import { API_URL } from './url';

export const ERR_USER_NOT_LOGGED_IN = "user not logged in";

export interface UserInfo {
    email: string
    username: string
}

let token: string|undefined;
let userInfo: UserInfo|undefined;

export function ensureToken(): Promise<void> {
    if (token) {
        return Promise.resolve()
    }
    return getToken()
    .then(t => {
        token = t;
    })
    .catch(err => {
        console.log(err)
        login();
    })
}

export function getUserInfo(): Promise<UserInfo> {
    if (userInfo) {
        return Promise.resolve(userInfo);
    }
    if (!token) {
        return Promise.reject(ERR_USER_NOT_LOGGED_IN)
    }
    return fetch(`${API_URL}/user`, {
        method: "GET",
        headers: {
            Identity: token,
        }
    })
    .then(res => res.json())
    .then((info: UserInfo) => {
        userInfo = info;
        return userInfo;
    })
}

export function setUsername(username: string): Promise<UserInfo> {
    if (!token) {
        return Promise.reject("missing token")
    }
    return fetch(`${API_URL}/user`, {
        method: "POST",
        headers: {
            Identity: token,
        },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then((info: UserInfo) => {
        userInfo = info;
        return userInfo;
    })
}

export function logout() {
    token = undefined;
    userInfo = undefined;
    clearToken();
}