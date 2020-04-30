import { VideoControls } from "../controls";
import { TapMode, DragMode, KeyEvent } from "../gesture";
import { Box } from "../ClipCreator";

const boxWidth = window.devicePixelRatio * 7;

export class BoxFrame {

    private ctx: CanvasRenderingContext2D;
    private boxes: { [frame: number]: GrabBox } = {};
    private hasPlayedAfterComplete = false;

    constructor(
        private canvas: HTMLCanvasElement,
        private controls: VideoControls,
        private addBox: (b: Box) => boolean,
    ){
        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("no context");
        }
        this.ctx = ctx;
        this.controls.pause();
        this.controls.setTime(this.controls.startFrame);
        this.render();
    }


    public render() {
        let { frame, startFrame, endFrame } = this.controls;
        let { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = "#00000040";
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = "#ebbd34";
        this.ctx.fillRect(0, 0, width, height * 0.02);
        this.ctx.fillStyle = "#33b5e5";
        this.ctx.fillRect(0, 0, width * (frame - startFrame) / (endFrame - startFrame + 1), height * 0.02);

        this.boxes[this.controls.frame]?.render(this.ctx);
    }

    public tap(mode: TapMode, x: number, y: number) {
        let box = this.boxes[this.controls.frame];
        if (!box) {
            box = new GrabBox(x, y);
            this.boxes[this.controls.frame] = box;
        }
        if (mode == TapMode.UP) {
            let ready = this.addBox(box.asStruct());
            if (ready && !this.hasPlayedAfterComplete) {
                this.controls.play();
                this.hasPlayedAfterComplete = true;
            }
            let { frame, startFrame, endFrame } = this.controls;
            let nextFrame = ((frame + 1 - startFrame) % (endFrame - startFrame + 1)) + startFrame;
            if (!this.boxes[nextFrame]) {
                let { x, y, w, h } = box.asStruct()
                this.boxes[nextFrame] = new GrabBox(x, y, w, h);
            }
            this.controls.nextFrame();
        }
    }

    public key(k: KeyEvent) {
        if (k == KeyEvent.NEXT_FRAME) {
            this.tap(TapMode.UP, 0, 0);
        } else if (k == KeyEvent.PREV_FRAME) {
            this.controls.prevFrame();
        } else if (k == KeyEvent.PLAYPAUSE) {
            if (this.controls.playing) {
                this.controls.pause();
            } else {
                this.controls.play();
            }
        }
    }

    public drag(mode: DragMode, x: number, y: number, dx: number, dy: number) {
        this.boxes[this.controls.frame].drag(mode, x, y, dx, dy);
        this.render();
    }

    public getBox(frame?: number) {
        if (frame === undefined) {
            frame = this.controls.frame;
        }
        return this.boxes[frame];
    }

}

class GrabBox {

    private corners: [number, number, number, number];
    private grabbedCorners: number[] = [0, 1];

    constructor(
        private x: number,
        private y: number,
        private w = 0,
        private h = 0
    ) {
        this.corners = [x, y, x + w, y + h];
    }

    drag(mode: DragMode, x: number, y: number, dx: number, dy: number) {
        if (mode == DragMode.START) {
            this.grabbedCorners = [];
            let left = (x > this.x - boxWidth) && (x < this.x + boxWidth);
            let right = (x > this.x + this.w - boxWidth) && (x < this.x + this.w + boxWidth);
            let top = (y > this.y - boxWidth) && (y < this.y + boxWidth);
            let bottom = (y > this.y + this.h - boxWidth) && (y < this.y + this.h + boxWidth);
            if (left) {
                this.grabbedCorners.push(this.corners[0] < this.corners[2] ? 0 : 2);
            } else if (right) {
                this.grabbedCorners.push(this.corners[0] > this.corners[2] ? 0 : 2);
            }
            if (top) {
                this.grabbedCorners.push(this.corners[1] < this.corners[3] ? 1 : 3);
            } else if (bottom) {
                this.grabbedCorners.push(this.corners[1] > this.corners[3] ? 1 : 3);
            }
            if (!this.grabbedCorners.length) {
                if (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h) {
                    this.grabbedCorners = [0, 1, 2, 3];
                } else {
                    this.grabbedCorners = [0, 1];
                    this.corners = [x, y, x, y];
                    this.x = x;
                    this.y = y;
                    this.w = 0;
                    this.h = 0;
                }
            }
            return;
        }
        this.grabbedCorners.forEach(i => {
            if (i % 2 == 0) { // even indexes are the x values
                this.corners[i] += dx;
            } else { // odd indexes are the y values
                this.corners[i] += dy;
            }
        })
        this.x = Math.min(this.corners[0], this.corners[2]);
        this.y = Math.min(this.corners[1], this.corners[3]);
        this.w = Math.abs(this.corners[0] - this.corners[2]);
        this.h = Math.abs(this.corners[1] - this.corners[3]);
    }

    public asStruct() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            w: Math.round(this.w),
            h: Math.round(this.h)
        }
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(this.x, this.y, this.w, this.h);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.w, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.closePath();
        ctx.strokeStyle = "#33b5e5";
        ctx.lineWidth = boxWidth / 3;
        ctx.stroke();
    }
}