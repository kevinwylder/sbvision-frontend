import { TapMode, DragMode } from "../gesture";
import { VideoControls } from "../controls";

const START_Y = 0.1;
const END_Y = 0.2;

export class FindTime {

    private ctx: CanvasRenderingContext2D;
    private start: TextArea;
    private end: TextArea;
    private isFirstGrab = true;
    private grabbedEnd = false;
    private grabbedStart = false;
    private x = 0;

    constructor (
        private canvas: HTMLCanvasElement,
        private controls: VideoControls
    ) {
        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No 2d context");
        }
        this.ctx = ctx;
        this.start = new TextArea(ctx, "Start", 0.05);
        this.start.position(0, START_Y);
        this.end = new TextArea(ctx, "End", 0.05);
        this.end.position(1, END_Y);
        this.controls.setTimeRange(0, this.controls.duration);
    }

    public tap(mode: TapMode, x: number, y: number) {
        if (mode == TapMode.DOWN) {
            let { startFrame, endFrame, duration } = this.controls;
            let { width } = this.canvas;
            if (x - width * (startFrame + endFrame) / (duration * 2) > 0) {
                this.grabbedEnd = true;
            } else {
                this.grabbedStart = true;
            }
            this.controls.pause();
        } else if (mode == TapMode.UP) {
            this.controls.play();
            this.grabbedEnd = false;
            this.grabbedStart = false;
        }
        this.render();
    }

    public drag(mode: DragMode, x: number) {
        let { startFrame, endFrame, duration } = this.controls;
        let { width } = this.canvas;
        let frame = duration * x / width;
        if (this.grabbedEnd) {
            if (this.start.x > x) {
                this.grabbedStart = true;
                this.grabbedEnd = false;
                return;
            }
            this.end.position(x / width, END_Y);
            this.controls.setTimeRange(startFrame, frame + 1);
        }
        if (this.grabbedStart) {
            if (this.end.x < x) {
                this.grabbedStart = false;
                this.grabbedEnd = true;
                return;
            }
            this.start.position(x / width, START_Y);
            this.controls.setTimeRange(frame - 1, endFrame);
        }
        this.controls.normalizeRangeTo(Math.max(3, (endFrame - startFrame) / this.controls.fps));
        if (mode == DragMode.END) {
            if (this.isFirstGrab && this.grabbedStart) {
                let endFrame = frame + this.controls.fps * 2;
                this.controls.setTimeRange(frame, endFrame);
                this.end.position(endFrame / this.controls.duration, END_Y);
            }
            this.isFirstGrab = false;
            this.grabbedEnd = false;
            this.grabbedStart = false;
            this.controls.setTime(startFrame);
            this.controls.play();
        } else {
            this.controls.setTime(frame);
        }
        this.x = x;
        this.render();
    }

    public update() {
        this.x = this.canvas.width * this.controls.frame / this.controls.duration
        this.render();
    }

    private render() {
        let { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        this.start.draw();
        this.end.draw();
        height *= 0.02;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = "#ebbd34";
        this.ctx.fillRect(this.start.x, 0, this.end.x - this.start.x, height);
        this.ctx.fillStyle = "#33b5e5";
        this.ctx.fillRect(this.start.x, 0, this.x - this.start.x, height);
    }

}

export class TextArea {
    public top: number = 0;
    public left: number = 0;
    public width: number
    public height: number
    public x: number = 0;
    public y: number = 0;

    constructor (
        private ctx: CanvasRenderingContext2D, 
        private text: string, 
        size: number,
        private padding = 2 * window.devicePixelRatio,
    ) {
        this.height = ctx.canvas.height * size;
        ctx.font = `${this.height}px Calibri`;
        let dimens = ctx.measureText(text);
        this.width = dimens.width;
    }

    public position(x: number, y: number) {
        this.x = x * this.ctx.canvas.width;
        this.y = y * this.ctx.canvas.height;
        this.left = (this.ctx.canvas.width - this.width) * x;
        this.top = (this.ctx.canvas.height - this.height) * y;
    }

    public center(): [number, number] {
        return [ (2 * this.left + this.width) / 2, (2 * this.top + this.height) / 2] 
    }

    public contains(x: number, y: number) {
        console.log(x, y, this);
        return (
            x > this.left - this.padding
        &&  x < this.left + this.padding + this.width  
        &&  y > this.top - this.padding
        &&  y < this.top + this.padding + this.height
        )
    }

    public draw() {
        this.ctx.fillStyle = "black";
        this.ctx.lineWidth = this.padding * 4;
        this.ctx.strokeStyle = "white";
        this.ctx.lineCap = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(this.left, this.top - this.height);
        this.ctx.lineTo(this.left + this.width, this.top - this.height);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.left + this.width, this.top - this.height);
        this.ctx.lineTo(this.left + this.width, this.top);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.left + this.width, this.top);
        this.ctx.lineTo(this.left, this.top);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.left, this.top);
        this.ctx.lineTo(this.left, this.top - this.height);
        this.ctx.stroke();

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.left, this.top - this.height, this.width, this.height);

        this.ctx.fillStyle = "black";
        this.ctx.fillText(this.text, this.left, this.top - this.height / 8);
    }
}