import { Video } from "../../../api";
import { TapMode, handleGestures } from "../gesture";
import { PendingVideoControls, VideoControls } from "../controls";

export class PlayButton {

    private ctx: CanvasRenderingContext2D;
    private thumbnail: HTMLImageElement;

    constructor(
        private canvas: HTMLCanvasElement,
        private pendingControls: PendingVideoControls,
        video: Video,
        private onControlsSet: (c: VideoControls) => void,
    ) {
        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No 2D Context for Canvas")
        }
        this.ctx = ctx;
        this.canvas.width = video.width;
        this.canvas.height = video.height;

        // display play button
        this.thumbnail = new Image();
        this.thumbnail.src = video.thumbnail;
        this.thumbnail.onload = () => {
            this.render();
        }
    }

    public render() {
        this.ctx.drawImage(this.thumbnail, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width * .4, this.canvas.height * 0.35);
        this.ctx.lineTo(this.canvas.width * .6, this.canvas.height * 0.5);
        this.ctx.lineTo(this.canvas.width * .4, this.canvas.height * 0.65);
        this.ctx.closePath();
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        this.ctx.fillStyle = "white";
        this.ctx.fill();
    }

    public tap(mode: TapMode) {
        if (mode == TapMode.DOWN) {
            this.pendingControls.start(this.onControlsSet);
        }
    }

}