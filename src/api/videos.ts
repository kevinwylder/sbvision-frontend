import { API_URL } from "./url";
import { getToken } from "./auth";

export interface Video {
    id: number
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
    id: number
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
        src: `${API_URL}/video/${video.id}/video.mp4`,
        hls: `${API_URL}/video/${video.id}/playlist.m3u8`,
        thumbnail: `${API_URL}/thumbnail/${video.id}.jpg`,
    }
}

export interface VideoStatus {
    info: Video|null
    id: string
    status: string
    complete: boolean
    success: boolean
}

export function getVideo(id: number): Promise<Video> {
    return fetch(`${API_URL}/video/info?id=${id}`)
    .then(res => res.json())
    .then(transformVideo);
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

export function streamVideoStatus(onMessage: (status: VideoStatus) => void) {
    let [ protocol, domain ] = API_URL.split("://");
    let ws: WebSocket;
    getToken()
    .then(token => {
        ws = new WebSocket(`ws${protocol == "https" ? "s" : ""}://${domain}/video/status?identity=${token}`);
        ws.onmessage = (status) => {
            let data: VideoStatus = JSON.parse(status.data);
            data.info = data.info ? transformVideo(data.info as unknown as apiVideo) : null;
            onMessage(data);
            if (data.complete) {
                ws.close();
            }
        };
        ws.onerror = (err) => {
            console.log(err);
        }
    })
    return () => {
        if (ws && !ws.CLOSED) {
            ws.close();
        }
    }
}

export function uploadVideo(data: FormData, onProgress: (percent: number) => void): Promise<VideoStatus> { 
    return getToken()
    .then(token => new Promise((resolve, reject) => {
        let r = new XMLHttpRequest();
        r.open("POST", `${API_URL}/video/upload`, true);
        r.setRequestHeader("Identity", token);
        r.onreadystatechange = function() {
            if (r.readyState == 4) {
                if (r.status == 200) {
                    resolve(JSON.parse(r.responseText));
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