import { Video } from "../../../api";

type RenderFunc = (video: HTMLVideoElement, frame: number) => void
type TimeUpdateFunc = (frame: number) => void
export interface VideoControls {
    readonly width: number
    readonly height: number
    readonly duration: number

    addRenderFunc(renderer: RenderFunc):void;
    setTime(frame: number): void;

    pause(): void
    play(): void

    destroy(): void;
}

export function getVideoControls(video: Video): Promise<VideoControls> {
    return new Promise((resolve, reject) => {
        try {
            const controls = new VideoController(video, () => { resolve(controls); });
        } catch (err) {
            reject(err);
        }
    })
}

const FRAME_COUNTER_BITS = 16;
const FRAME_COUNTER_HEIGHT = 2;
const FRAME_COUNTER_WIDTH = 4;

class VideoController {

    private frameCtx: CanvasRenderingContext2D;
    private video: HTMLVideoElement;
    private animationInterval: number = 0;
    private frameUpdateListeners: TimeUpdateFunc[] = [];
    private renderers: RenderFunc[] = [];

    public width: number = 0;
    public height: number = 0;
    public duration: number = 0;

    constructor(private videoInfo: Video, onload: () => void) {
        console.log("new video");
        let canvas = document.createElement("canvas");
        canvas.height = FRAME_COUNTER_HEIGHT;
        canvas.width = FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS;
        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No canvas support");
        }
        this.frameCtx = ctx;

        let video = document.createElement("video");
        video.style.visibility = "hidden";
        video.style.width = "1px";
        video.style.height = "1px";
        video.crossOrigin = "Anonymus";
        video.setAttribute("playsinline", "")
        let source = document.createElement("source");
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            source.src = this.videoInfo.hls;
        } else {
            source.src = this.videoInfo.src;
        }
        video.appendChild(source);
        document.body.appendChild(video);
        video.addEventListener('error', (err) => {
            console.log(err)
        })
        video.play()
        .then(() => {
            this.width = video.videoWidth;
            this.height = video.videoHeight - FRAME_COUNTER_HEIGHT;
            this.duration = video.duration * this.videoInfo.fps;
            this.animationInterval = window.setInterval(() => {
                this.countVideoFrame();
            }, 1000 / this.videoInfo.fps);
            onload();
        })
        .catch(err => {
            console.log(err);
        })
        this.video = video;
    }

    private lastFrame: number = -1;
    private countVideoFrame() {
        this.frameCtx.drawImage(this.video, 
            0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, FRAME_COUNTER_HEIGHT, 
            0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, FRAME_COUNTER_HEIGHT, 
        );
        let counterData = this.frameCtx.getImageData(0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, FRAME_COUNTER_HEIGHT).data;
        let counter = 0;
        let power = 1;
        for (let i = 0; i < FRAME_COUNTER_BITS; i++) {
            if (counterData[4 * (i * FRAME_COUNTER_WIDTH + 1)] > 128) {
                counter += power;
            }
            power *= 2;
        }
        if (counter != this.lastFrame) {
            this.renderers.forEach(f => f(this.video, counter));
            this.lastFrame = counter;
        }
    }

    public addRenderFunc(renderer: RenderFunc) {
        this.renderers.push(renderer);
    }

    public addTimeUpdateListener(func: TimeUpdateFunc) {
        this.frameUpdateListeners.push(func);
    }

    public setTime(frame: number) {
        this.video.currentTime = frame / this.videoInfo.fps;
    }

    public pause() {
        this.video.pause();
    }

    public play() {
        this.video.play();
    }

    public destroy() {
        document.body.removeChild(this.video);
        window.clearInterval(this.animationInterval);
    }

}
