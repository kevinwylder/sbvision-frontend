import { AUTH_URL, APP_CLIENT_ID } from ".";

export function isLoggedIn() {
    return parseInt(window.localStorage.getItem("expires") || "0") > Date.now();
}

export function getToken(): Promise<string> {
    let history = readLocalStorage();
    if (history) {
        let { expires_in, id_token, refresh_token } = history;
        if (expires_in > 0) {
            return Promise.resolve(id_token);
        } else {
            return fromRefresh(refresh_token);
        }
    }
    let code = new URLSearchParams(window.location.search).get("code");
    if (code) {
        return fromCode(code);
    }
    return Promise.reject("User is not logged in");
}

function fromRefresh(refresh_token: string) {
    return fetch(`${AUTH_URL}/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `grant_type=refresh_token&client_id=${APP_CLIENT_ID}&refresh_token=${refresh_token}`
    })
    .then(res => res.json())
    .then(handleResponse);
}

function fromCode(code: string) {
    return fetch(`${AUTH_URL}/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `grant_type=authorization_code&client_id=${APP_CLIENT_ID}&code=${code}&redirect_uri=${window.origin}/dashboard`
    }).then(res => res.json())
    .then(handleResponse)
}

interface serverResponse {
    id_token: string
    refresh_token: string
    expires_in: number
}

function handleResponse(r: serverResponse) {
    if (!r.id_token || !r.refresh_token || !r.expires_in) {
        return Promise.reject("invalid server response: " + JSON.stringify(r));
    }
    window.localStorage.setItem("id_token", r.id_token);
    window.localStorage.setItem("refresh_token", r.refresh_token);
    window.localStorage.setItem("expires", "" + (Date.now() + r.expires_in * 1000));
    return Promise.resolve(r.id_token);
}

function readLocalStorage(): serverResponse|undefined {
    let id_token = window.localStorage.getItem("id_token");
    let refresh_token = window.localStorage.getItem("refresh_token");
    let expires = window.localStorage.getItem("expires");
    if (id_token && expires && refresh_token) {
        return { 
            id_token, 
            refresh_token,
            expires_in: parseInt(expires) - Date.now(), 
         };
    }
}

export function login() {
    window.location.href = `${AUTH_URL}/login?response_type=code&client_id=${APP_CLIENT_ID}&redirect_uri=${window.origin}/dashboard`
}

export function clearToken() {
    window.localStorage.removeItem("id_token");
    window.localStorage.removeItem("refresh_token");
    window.localStorage.removeItem("expires");
}