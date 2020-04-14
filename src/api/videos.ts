import { API_URL } from "./url";
import { getToken } from "./auth";

export interface Video {
    id: number
    title: string
    type: number
    format: string
    duration: string
    src: string
    clips: number
    thumbnail: string
}

export interface VideoStatus {
    info: Video|null
    id: string
    status: string
    complete: boolean
    success: boolean
}

export function getVideos(): Promise<Video[]> {
    return getToken()
    .then(token => fetch(
        `${API_URL}/video/list`, {
            method: "GET",
            headers: {
                Identity: token,
            }
        }
    ))
    .then(res => res.json())
    .then(videos => videos || [])
    .then(videos => {
        videos.forEach((video: Video) => {
            video.thumbnail = `${API_URL}/video/thumbnail?id=${video.id}`;
            video.src = `${API_URL}/video/stream?id=${video.id}`;
        }) 
        return videos;
    })
}

export function getVideoStatus(onMessage: (status: VideoStatus, isOpen: boolean) => void) {
    let [ protocol, domain ] = API_URL.split("://");
    let ws: WebSocket;
    getToken()
    .then(token => {
        ws = new WebSocket(`ws${protocol == "https" ? "s" : ""}://${domain}/video/status?identity=${token}`);
        ws.onmessage = (status) => {
            let data: VideoStatus = JSON.parse(status.data);
            if (data.info) {
                data.info.thumbnail = `${API_URL}/video/thumbnail?id=${data.info.id}`;
            }
            onMessage(data, true);
            if (data.complete) {
                ws.close();
            }
        };
        ws.onerror = () => {
            onMessage({ id: "", status: "Error connecting to socket", complete: true, success: false, info: null}, false);
        }
    })
    return () => {
        if (ws && !ws.CLOSED) {
            ws.close();
        }
    }
}

export function uploadVideo(url: string): Promise<VideoStatus> { 
    return getToken()
    .then(token => fetch(`${API_URL}/video/upload`, {
        method: "POST",
        headers: {
            "Identity": token,
        },
        body: JSON.stringify({url}),
    }))
    .then(async res => {
        if (res.status != 200) {
            let text = await res.text();
            throw text;
        }
        return res.json();
    })
}