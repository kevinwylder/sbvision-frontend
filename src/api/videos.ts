import { API_URL } from "./url";

export interface Video {
    id: number
    title: string
    type: number
    format: string
    duration: number
    src: string
    clips: number
    thumbnail: string
}

interface GetVideosResponse {
    videos: Video[]
    total: number
}

export function getVideos(offset: number, limit: number): Promise<GetVideosResponse> {
    return fetch(`${API_URL}/video/list?offset=${offset}&count=${limit}`)
    .then(res => {
        if (res.status != 200) {
            return res.text()
            .then(reason => Promise.reject(reason))
        } 
        return res.json()
    })
    .then(({videos, total}) => {
        videos.forEach((v: Video) => {
            v.thumbnail = `${API_URL}/video/thumbnail?id=${v.id}`;
        });
        return videos ? {videos, total} : {videos: [], total: 0}
    });
}

export function getVideoById(id: number) : Promise<[Video, string]> {
    return fetch(`${API_URL}/video/list?id=${id}`)
    .then(res => res.json())
    .then(({videos}) => [videos[0], `${API_URL}/video/stream?id=${videos[0].id}`]);
}
