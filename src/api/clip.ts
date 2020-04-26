import { Video } from "./videos";

export interface ClipData {
    videoInfo: Video
    completedStep: number

    startFrame: number
    endFrame: number
    tricks: string[]
}