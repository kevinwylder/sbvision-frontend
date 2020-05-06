import { Video } from "../../api";
import { httpLog } from "../../api/log";

export type RenderFunc = () => void
export interface VideoControls {
    readonly width: number
    readonly height: number
    readonly canvasScale: number;
    readonly duration: number
    readonly fps: number
    readonly frame: number
    readonly startFrame: number;
    readonly endFrame: number;
    readonly playing: boolean

    setCanvas(canvas: HTMLCanvasElement): void
    addRenderFunc(renderer: RenderFunc): number
    removeRenderFunc(n: number): void

    destroy(): void

    goToStart(): void
    setTime(frame: number): void
    nextFrame(): void
    prevFrame(): void
    setTimeRange(start: number, end: number): void
    normalizeRangeTo(duration: number): void
    setTransform(dx: number, dy: number, scale: number): void
    pause(): void
    play(): void
}

export interface PendingVideoControls {
    start(setControls: (controls: VideoControls) => void): void;
    destroy(): void;
}

export function getVideoControls(video: Video): PendingVideoControls {
    return new VideoController(video);
}

const FRAME_COUNTER_BITS = 16;
const FRAME_COUNTER_HEIGHT = 2;
const FRAME_COUNTER_WIDTH = 4;

class VideoController {

    private counterCtx: CanvasRenderingContext2D;
    private ctx: CanvasRenderingContext2D|null = null;
    private video: HTMLVideoElement;
    private animationInterval: number = 0;
    private renderers: { [key: number]: RenderFunc } = {};

    public fps = this.videoInfo.fps;
    public startFrame = 0;
    public endFrame = 0;
    public width = 0;
    public height = 0;
    public playing = false
    public duration = 0;
    public canvasScale = 0;

    constructor(private videoInfo: Video) {
        let counter = document.createElement("canvas");
        counter.width = FRAME_COUNTER_BITS * FRAME_COUNTER_WIDTH;
        counter.height = FRAME_COUNTER_HEIGHT;
        let ctx = counter.getContext("2d");
        if (!ctx) {
            throw new Error("no context");
        }
        this.counterCtx = ctx;

        let video = document.createElement("video");
        video.style.visibility = "hidden";
        video.style.width = "1px";
        video.style.height = "1px";
        video.crossOrigin = "Anonymus";
        video.muted = true;
        video.loop = true;
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
            httpLog(err + "");
        })
        this.video = video;
    }

    public start(setControls: (c: VideoControls) => void) {
        return this.video.play()
        .then(() => {
            this.playing = true;
            this.width = this.video.videoWidth;
            this.height = this.video.videoHeight;
            this.duration = Math.floor(this.video.duration * this.videoInfo.fps);
            this.setTimeRange(0, this.duration);
            this.animationInterval = window.setInterval(() => {
                this.countVideoFrame();
            }, 1000 / this.videoInfo.fps);
            setControls(this);
        });
    } 

    public setCanvas(canvas: HTMLCanvasElement) {
        let { width, height } = canvas.getBoundingClientRect();
        if (width * this.video.height > this.video.width * height) {
            // the canvas is relatively wider than the video
            canvas.width = window.devicePixelRatio * height * this.videoInfo.width / this.videoInfo.height;
            canvas.height = window.devicePixelRatio * height;
        } else {
            // the canvas is relatively taller than the video
            canvas.width = window.devicePixelRatio * width;
            canvas.height = window.devicePixelRatio * width * this.videoInfo.height / this.videoInfo.width;
        }
        this.canvasScale = this.videoInfo.width / canvas.width;
        this.ctx = canvas.getContext("2d");
        if (!this.ctx) {
            throw new Error("Cannot set controls on the given canvas, no context");
        }
    }

    public frame: number = -1;
    private countVideoFrame() {
        const ctx = this.ctx;
        if (!ctx) {
            return
        }
        this.counterCtx.drawImage(this.video, 
            0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, FRAME_COUNTER_HEIGHT, 
            0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, FRAME_COUNTER_HEIGHT 
        );
        let counterData = this.counterCtx.getImageData(0, 0, FRAME_COUNTER_WIDTH * FRAME_COUNTER_BITS, 1).data;
        let counter = 0;
        let power = 1;
        for (let i = 0; i < FRAME_COUNTER_BITS; i++) {
            if (counterData[4 * (i * FRAME_COUNTER_WIDTH + 1)] > 128) {
                counter += power;
            }
            power *= 2;
        }
        if (this.playing) {
            if (counter < this.startFrame || counter > this.endFrame) {
                this.goToStart();
                return
            }
        }
        if (counter != this.frame) {
            this.frame = counter;
            this.draw();
        }
    }

    private draw() {
        const { ctx } = this;
        if (!ctx) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(this.video, this.dx, this.dy, this.scale * ctx.canvas.width, this.scale * ctx.canvas.height);
        Object.values(this.renderers).forEach(f => f());
    }

    private lastResetRequest = 0;
    public goToStart() {
        if (Date.now() - this.lastResetRequest < 1000) {
            return
        }
        this.setTime(this.startFrame);
        this.lastResetRequest = Date.now();
    }

    public addRenderFunc(renderer: RenderFunc) {
        let id = Math.random();
        this.renderers[id] = renderer;
        return id;
    }

    public removeRenderFunc(id: number) {
        delete(this.renderers[id]);
    }

    public setTime(frame: number) {
        this.video.currentTime = (frame + 0.5) / this.videoInfo.fps;
    }

    public nextFrame() {
        let { frame, startFrame, endFrame } = this;
        let nextFrame = ((frame + 1 - startFrame) % (endFrame - startFrame + 1)) + startFrame;
        this.setTime(nextFrame);
    }

    public prevFrame() {
        let { frame, startFrame, endFrame } = this;
        let clipSize = endFrame - startFrame + 1;
        let prevFrame = ((((frame - 1 - startFrame) % clipSize) + clipSize) % clipSize) + startFrame;
        this.setTime(prevFrame);
    }

    public setTimeRange(start: number, end: number) {
        this.startFrame = Math.floor(Math.min(start, end - 1));
        this.endFrame = Math.ceil(Math.max(start, end));
    }

    public normalizeRangeTo(duration: number) {
        let rangeDuration = (this.endFrame - this.startFrame) / this.videoInfo.fps;
        this.video.playbackRate = Math.max(rangeDuration / duration, .09);
    }

    private dx = 0;
    private dy = 0;
    private scale = 1;
    public setTransform(dx: number, dy: number, scale: number) {
        this.dx = -scale * dx;
        this.dy = -scale * dy;
        this.scale = scale
        this.draw();
    }

    public pause() {
        this.video.pause()
        this.playing = false;
    }

    public play() {
        this.playing = true;
        this.video.play()
    }

    public destroy() {
        document.body.removeChild(this.video);
        window.clearInterval(this.animationInterval);
    }

}
