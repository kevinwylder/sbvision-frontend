import { API_URL } from "../constants";
import { getToken } from "./auth";

export interface ClipData {
    id: string
    video: string
    username: string
    trick: string
    uploadedAt: string
    startFrame: number
    endFrame: number
    boxes: { [ frame: number ]: {
        x: number, 
        y: number,
        w: number,
        h: number
    }}
    rotations: { [ frame: number ]: [ number, number, number, number ] }
}

export function getClips(): Promise<ClipData[]> {
    return fetch(`${API_URL}/clip/list`)
    .then(res => res.json())
}

export function getClipInfo(id: string): Promise<ClipData> {
    return fetch(`${API_URL}/clip/info?id=${id}`)
    .then(res => res.json())
    .then(clips => clips || []);
}

interface PartialClipData {
    videoId?: string,
    startFrame?: number,
    endFrame?: number,
    boxes: { [ frame: number ]: {
        x: number, 
        y: number,
        w: number,
        h: number
    }}
    rotations: { [ frame: number ]: [ number, number, number, number ] }
    trick: string
}
export function addClip(clip: PartialClipData): Promise<void> {
    return getToken()
    .then(token => fetch(`${API_URL}/clip/upload`, {
        method: "POST",
        headers: {
            "Identity": token,
        },
        body: JSON.stringify(clip),
    }))
    .then(async (res) => {
        if (res.status != 200) {
            let reason = await res.text();
            return Promise.reject("Error - " + reason);
        }
    })
}