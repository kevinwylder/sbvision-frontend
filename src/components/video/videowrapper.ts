import { Box } from "./boxmanager";
import { PlayButton } from "./playbutton";
import { renderSkateboard } from "../../renderer";

export class VideoWrapper {

    private video: HTMLVideoElement;

    private ctx: CanvasRenderingContext2D|undefined;
    private box: Box|undefined;
    private playbutton: PlayButton|undefined;

    constructor (
        private videoID: number,
        onload: (width: number, height: number) => void,
    ) {

        this.video = document.createElement("video");
        this.video.style.visibility = 'hidden';
        this.video.style.width = "1";
        this.video.style.height = "1";
        this.video.controls = true;
        this.video.setAttribute("playsinline", "");
        this.video.loop = true;
        this.video.crossOrigin = "Anonymus";
        document.body.appendChild(this.video);

        this.video.onplay = () => {
            if (this.playbutton) {
                this.playbutton.cancel();
                this.playbutton = undefined;
            }
            this.render();
        }

        this.video.onpause = () => {
            this.render();
        }

        this.video.onresize = () => {
            this.box = new Box(6, this.video.videoWidth, this.video.videoHeight);
            onload(this.video.videoWidth, this.video.videoHeight);
            this.video.play();
        }

        this.video.ontimeupdate = () => {
            if (this.video.paused) {
                this.render();
            }
        }

    }

    public mobileClick() {
        this.video.play();
    }

    public grab(pos: [number, number]) {
        this.box?.grab(pos);
        this.render();
    }
    
    public drag(pos: [number, number]) {
        if (this.box?.drag(pos)) {
            this.render();
        }
    }

    public up() {
        if (!this.box) {
            return;
        }

        let [ wasTap ] = this.box.release();

        if (wasTap) {
            if (this.video.paused) {
                this.video.play();
            } else {
                this.video.pause();
            }
            return;
        }

    }

    public forward() {
        this.video.currentTime += 0.02; 
        this.render();
    }

    public back() {
        this.video.currentTime -= 0.02; 
        this.render();
    }
    
    public setContext(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.playbutton = new PlayButton(this.videoID, ctx, this.video.videoWidth, this.video.videoHeight);
    }

    public destroy() {
        this.video.pause();
        this.ctx = undefined;
        this.video.remove();
    }

    private render() {
        if (!this.ctx) return;

        this.ctx.drawImage(this.video, 0, 0);
        this.drawAnnotations();
        if (this.video.paused) {
            this.box?.draw(this.ctx);
        } else {
            window.requestAnimationFrame(() => this.render());
        }
    }

    private drawAnnotations() {
        if (!this.ctx) {
            return;
        }
    }

}