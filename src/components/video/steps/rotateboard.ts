import { VideoControls } from "../controls";
import { TapMode, KeyEvent } from "../gesture";
import { rotateSkateboard, tiltSkateboard } from "../../../renderer/math";
import { renderSkateboard } from "../../../renderer";
import { Rotation, Box } from "../ClipCreator";
import { BoxFrame } from "./boxframe";

export class RotateBoard {

    private r: Rotation = [1, 0, 0, 0];
    private ctx: CanvasRenderingContext2D
    private rotations: { [f: number]: Rotation } = {};

    constructor(
        private canvas: HTMLCanvasElement,
        private controls: VideoControls,
        private boxes: BoxFrame,
        private addRotation: (rotation: Rotation) => boolean,
    ) {
        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No context");
        }
        this.controls.pause()
        this.controls.goToStart();
        this.ctx = ctx;
        this.setTranslation(boxes.getBox(this.controls.startFrame).asStruct());
    }

    public move(dx: number, dy: number) {
        this.r = rotateSkateboard(dx / window.devicePixelRatio, dy / window.devicePixelRatio, this.r);
        this.render();
    }

    public scroll(dz: number) {
        this.r = tiltSkateboard(dz, this.r);
        this.render();
    }

    public tap(mode: TapMode, x: number, y: number) {
        if (mode == TapMode.UP) {
            this.rotations[this.controls.frame] = this.r;
            let ready = this.addRotation(this.r);
            if (ready) {
                document.exitPointerLock();
            }
            let { frame, startFrame, endFrame } = this.controls;
            let nextFrame = ((frame + 1 - startFrame) % (endFrame - startFrame + 1)) + startFrame;
            let box = this.boxes.getBox(nextFrame);
            if (!box) {
                this.controls.nextFrame();
                return;
            }
            this.setTranslation(box.asStruct());
            this.controls.nextFrame();
        }
    }

    public key(k: KeyEvent) {
        if (k == KeyEvent.NEXT_FRAME) {
            this.tap(TapMode.UP, 0, 0);
        } else if (k == KeyEvent.PREV_FRAME) {
            let { frame, startFrame, endFrame } = this.controls;
            let clipSize = endFrame - startFrame + 1
            let prevFrame = ((((frame - 1 - startFrame) % clipSize) + clipSize) % clipSize) + startFrame;
            let prevBox = this.boxes.getBox(prevFrame);
            if (prevBox) {
                this.setTranslation(prevBox.asStruct());
            }
            this.controls.prevFrame();
        }
    }

    private setTranslation(box: Box) {
        let { x, y, w, h } = box;
        let { width, height } = this.canvas;
        let dstPadding = Math.min(width / 2, height) * 0.1;
        let dstSide = Math.min(width / 2, height) - 2 * dstPadding
        let dstTop = (height - dstSide) / 2;
        let dstLeft = (width / 2 - dstSide) / 2;
        let scale = dstSide / Math.max(w, h);
        let l = x - Math.max(0, h - w) / 2 - dstLeft / scale;
        let t = y - Math.max(0, w - h) / 2 - dstTop / scale;
        this.controls.setTransform(l, t, scale);
        this.render();
    }

    public render() {
        let box = this.boxes.getBox();
        let { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        // draw the skateboard in an "object-fit: contain;"" behaving square on the right half of canvas
        if (this.rotations[this.controls.frame]) {
            this.r = this.rotations[this.controls.frame];
        }
        let dstPadding = Math.min(width / 2, height) * 0.1;
        let dstSide = Math.min(width / 2, height) - 2 * dstPadding;
        let dstTop = (height - dstSide) / 2;
        let dstLeft = (width / 2 - dstSide) / 2;
        renderSkateboard(this.ctx, this.r, [ 
            width/2 + dstLeft,
            dstTop, 
            dstLeft + width/2 + dstSide, 
            dstTop + dstSide
        ]);

        // draw the scrubber
        let { frame, startFrame, endFrame } = this.controls;
        this.ctx.fillStyle = "#ebbd34";
        this.ctx.fillRect(0, 0, width, height * 0.02);
        this.ctx.fillStyle = "#33b5e5";
        this.ctx.fillRect(0, 0, width * (frame - startFrame) / (endFrame - startFrame + 1), height * 0.02);

        if (!box) {
            return;
        }
        // draw a box around where the skateboard should have ended up after translation
        let { w, h } = box.asStruct();
        let srcSide = Math.max(w, h);
        let scale = dstSide / srcSide;
        let t = dstTop + Math.max( w - h, 0 ) * scale / 2;
        let l = dstLeft + Math.max( h - w, 0 ) * scale / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(l, t);
        this.ctx.lineTo(l, t + h * scale);
        this.ctx.lineTo(l + w * scale, t + h * scale);
        this.ctx.lineTo(l + w * scale, t);
        this.ctx.closePath();
        this.ctx.strokeStyle = "#33b5e5";
        this.ctx.lineWidth = 4 * window.devicePixelRatio;
        this.ctx.stroke();
    }

}