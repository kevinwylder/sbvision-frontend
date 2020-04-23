import * as React from 'react';
import { Video } from '../../api';
import { getVideoControls, VideoControls } from './controls';

const relativeCoords = (e: {clientX: number, clientY: number}, elem: HTMLElement) => {
    let { left, top, width, height } = elem.getBoundingClientRect();
    return [ (e.clientX - left) / width, (e.clientY - top) / height ] as [ number, number ];
}

const dispatchCrossPlatform = (elem: HTMLElement, start: () => void, move: (pos: [number, number]) => void, up: () => void) => { 
    elem.ontouchstart = (e) => {
        start()
        move(relativeCoords(e.targetTouches[0], elem));
    }
    elem.ontouchmove = (e) => {
        move(relativeCoords(e.targetTouches[0], elem));
    }
    elem.ontouchend = (e) => {
        move(relativeCoords(e.targetTouches[0], elem));
        up();
    }
    let mousedown = false;
    elem.onmousedown = (e) => {
        start();
        move(relativeCoords(e, elem));
        mousedown = true;
    }
    elem.onmouseup = (e) => {
        mousedown && move(relativeCoords(e, elem));
        mousedown = false;
        up();
    }
    elem.onmouseout = (e) => {
        mousedown && move(relativeCoords(e, elem));
        mousedown = false;
        up();
    }
    elem.onmousemove = (e) => {
        mousedown && move(relativeCoords(e, elem));
    }
}

interface VideoPlayerProps {
    width: number
    height: number
    video: Video
    onVideoLoaded ?: (controls: VideoControls) => void;
}
export function VideoPlayer({ video, width, height }: VideoPlayerProps) {
    let videoCanvas = React.createRef<HTMLCanvasElement>();
    let scrubberCanvas = React.createRef<HTMLCanvasElement>();
    let [ videoControls, setVideoControls ] = React.useState<VideoControls>()

    // sync video to videoCanvas
    React.useEffect(() => {
        const canvas = videoCanvas.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        let controlsCleanup: VideoControls;
        getVideoControls(video)
        .then(controls => {
            controlsCleanup = controls;
            setVideoControls(controls);
            let { width, height } = canvas.getBoundingClientRect();
            if (width * controls.height > controls.width * height) {
                // the canvas is relatively wider than the video
                canvas.width = window.devicePixelRatio * height * controls.width / controls.height;
                canvas.height = window.devicePixelRatio * height;
            } else {
                // the canvas is relatively taller than the video
                canvas.width = window.devicePixelRatio * width;
                canvas.height = window.devicePixelRatio * width * controls.height / controls.width;
            }
            controls.addRenderFunc((data, frame) => {
                ctx.drawImage(data, 0, 2, controls.width, controls.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
            });
        })
        .catch(err => console.log(err));

        return () => controlsCleanup?.destroy();
    }, [videoCanvas.current]);

    // sync scrubber to progress
    React.useEffect(() => {
        const canvas = scrubberCanvas.current;
        const ctx = canvas?.getContext("2d");
        const controls = videoControls;
        if (!controls || !canvas || !ctx) return;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = 1;
        const draw = (x: number) => {
            ctx.fillStyle = "#33b5e5";
            ctx.clearRect(0, 0, canvas.width, 1);
            ctx.fillRect(0, 0, x * canvas.width, 1);
        }
        controls.addRenderFunc((_, time) => draw(time / controls.duration) );
        dispatchCrossPlatform(canvas, 
            () => {
                controls.pause();
            },
            ([x, y]) => {
                controls.setTime(controls.duration * x);
                draw(x);
            },
            () => {
                controls.play();
            }
        )
    }, [scrubberCanvas.current, videoControls]);

    return <div>
        <canvas 
            ref={ videoCanvas } 
            style={{ width, height, objectFit: "contain" }} 
        />
        <canvas 
            ref={ scrubberCanvas }
            style={{ width, height: "20px" }}
        />
    </div>
}