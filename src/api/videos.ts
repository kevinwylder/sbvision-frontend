import { API_URL } from "./url";

export interface Video {
    id: number
    title: string
    type: number
    format: string
    duration: number
    src: string
    clips: number
}

interface GetVideosResponse {
    videos: Video[]
    total: number
}

export function getVideos(offset: number, limit: number): Promise<GetVideosResponse> {
    return fetch(`${API_URL}/app/video/list?offset=${offset}&count=${limit}`)
    .then(res => {
        if (res.status != 200) {
            return res.text()
            .then(reason => Promise.reject(reason))
        } 
        return res.json()
    })
    .then(({videos, total}) => videos ? {videos, total} : {videos: [], total: 0});
}

export function getVideoById(id: number) : Promise<Video> {
    return fetch(`${API_URL}/app/video/list?id=${id}`)
    .then(res => res.json())
    .then(({videos}) => videos[0]);
}
