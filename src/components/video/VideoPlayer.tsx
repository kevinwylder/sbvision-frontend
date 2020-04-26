import * as React from 'react';
import { Video } from '../../api';
import { getVideoControls, VideoControls, PendingVideoControls } from './controls';
import { FindTime } from './steps/findtime';
import { PlayButton } from './steps/playbutton';
import { BoxFrame } from './steps/boxframe';
import { handleGestures } from './gesture';
import { RotateBoard } from './steps/rotateboard';
import { Box, Rotation } from './ClipCreator';

interface VideoPlayerProps {
    width: number
    height: number
    video: Video
    step: number
    addRotation: (r: Rotation) => void
    addBox: (b: Box) => void
    onVideoLoaded ?: (controls: VideoControls) => void;
}
export function VideoPlayer({ video, width, height, step, onVideoLoaded, addRotation, addBox }: VideoPlayerProps) {
    let videoCanvas = React.createRef<HTMLCanvasElement>();
    let overlayCanvas = React.createRef<HTMLCanvasElement>();

    let [ pendingControls, setPendingControls ] = React.useState<PendingVideoControls>();
    let [ videoControls, setVideoControls ] = React.useState<VideoControls>();

    // Load the video and setup hook to clean it up once we're done
    React.useEffect(() => {
        console.log("Make a mess");
        let controls = getVideoControls(video)
        setPendingControls(controls);
        return () => {
            console.log("Clean up yo mess");
            controls.destroy();
        }
    }, []);

    // when controls are ready, bind to the canvases
    React.useEffect(() => {
        if (!videoControls || !videoCanvas.current || !overlayCanvas.current) return
        if (onVideoLoaded) onVideoLoaded(videoControls);
        videoControls.setCanvas(videoCanvas.current);
        overlayCanvas.current.width = videoCanvas.current.width;
        overlayCanvas.current.height = videoCanvas.current.height;
    }, [videoCanvas.current, overlayCanvas.current, videoControls]);

    // setup make play button appear 
    React.useEffect(() => {
        const canvas = overlayCanvas.current;
        const controls = videoControls;
        if (!canvas || controls || !pendingControls) return;
        let play = new PlayButton(canvas, pendingControls, video, setVideoControls);
        return handleGestures(canvas, play);
    }, [overlayCanvas.current, pendingControls, videoControls]);

    let [ boxes, setBoxes ] = React.useState<BoxFrame>();
    // synchronize step classes to the current step 
    React.useEffect(() => {
        const video = videoCanvas.current;
        const overlay = overlayCanvas.current;
        const controls = videoControls;
        if (!controls || !video || !overlay) return;

        let renderID: number
        let cleanup: () => void
        switch(step) {
        case 1:
            let step1 = new FindTime(overlay, controls);
            renderID = controls.addRenderFunc(() => step1.update());
            cleanup = handleGestures(overlay, step1);
            break;
        case 2: 
            let step2 = new BoxFrame(overlay, controls, addBox);
            setBoxes(step2);
            renderID = controls.addRenderFunc(() => step2.render());
            cleanup = handleGestures(overlay, step2);
            break
        case 3:
            let step3 = new RotateBoard(overlay, controls, boxes as BoxFrame, addRotation);
            cleanup = handleGestures(overlay, step3);
            renderID = controls.addRenderFunc(() => step3.render());
        }

        return () => {
            controls.removeRenderFunc(renderID);
            if (cleanup) {
                console.log("Cleaning up");
                cleanup();
            }
        }
    }, [videoCanvas.current, overlayCanvas.current, videoControls, step]);

    return <div className="canvas-container">
        <canvas 
            ref={ videoCanvas } 
            style={{ width, height }} 
        />
        <canvas 
            className="canvas-container-overlay"
            ref={ overlayCanvas } 
            style={{ width, height, }} 
        />
        <br/>
        <br/>
        <br/>
    </div>
}