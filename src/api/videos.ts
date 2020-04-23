import { API_URL } from "./url";
import { getToken } from "./auth";

export interface Video {
    id: string
    title: string
    from: string
    format: string
    fps: number
    width: number
    height: number
    duration: string
    src: string
    hls: string
    thumbnail: string
    uploaded_by: string
}

interface apiVideo {
    id: string
    title: string
    width: number
    height: number
    fps: number
    duration: string
    type: number
    uploaded_at: string
    uploaded_by: string
}

const typeLookup: {[k: number]: string} = {
    1: "Youtube",
    2: "/r/skateboarding",
    3: "User Upload",
}
function transformVideo(video: apiVideo): Video {
    return {
        ...video,
        format: "video/mp4",
        from: typeLookup[video.type],
        src: `https://skateboardvision.net/video/${video.id}/video.mp4`,
        hls: `https://skateboardvision.net/video/${video.id}/playlist.m3u8`,
        thumbnail: `https://skateboardvision.net/video/${video.id}/thumbnail.jpg`,
    }
}

export interface VideoStatus {
    info: Video|null
    requestid: string
    message: string
    is_complete: boolean
    was_success: boolean
}

export function getVideo(id: string): Promise<Video> {
    return fetch(`${API_URL}/video/info?id=${id}`)
    .then(r => r.json())
    .then(video => transformVideo(video));
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
        return videos.map(transformVideo);
    })
}

export function streamVideoStatus(onMessage: (statuses: VideoStatus[]) => void) {
    let [ protocol, domain ] = API_URL.split("://");
    let ws: WebSocket;
    let interval = window.setInterval(() => {
        if (ws && ws.readyState == ws.OPEN) ws.send("_");
        console.log(ws.readyState, ws.OPEN);
    }, 5000);
    let statuses: { [id: string]: VideoStatus } = {};
    getToken()
    .then(token => {
        ws = new WebSocket(`ws${protocol == "https" ? "s" : ""}://${domain}/video/status?identity=${token}`);
        ws.onmessage = (status) => {
            let data: VideoStatus = JSON.parse(status.data);
            data.info = data.info ? transformVideo(data.info as unknown as apiVideo) : null;
            statuses[data.requestid] = data;
            onMessage(Object.values(statuses));
            if (Object.values(statuses).reduce((all_complete, {is_complete}) => all_complete && is_complete, true)) {
                ws.close();
                window.clearInterval(interval);
            }
        };
        ws.onerror = (err) => {
            console.log(err);
        }
    })
    return () => {
        if (ws && ws.readyState == ws.OPEN) {
            ws.close();
        }
        window.clearInterval(interval);
    }
}

export function uploadVideo(data: FormData, onProgress: (percent: number) => void): Promise<void> { 
    return getToken()
    .then(token => new Promise((resolve, reject) => {
        let r = new XMLHttpRequest();
        r.open("POST", `${API_URL}/video/upload`, true);
        r.setRequestHeader("Identity", token);
        r.onreadystatechange = function() {
            if (r.readyState == 4) {
                if (r.status == 200) {
                    resolve();
                } else {
                    reject(r.responseText);
                }
            }
        }

        if (r.upload) {
            r.upload.onprogress = function (e) {
                onProgress(e.loaded / e.total);
            };
        }

        r.send(data);
    }))
}