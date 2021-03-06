import * as React from 'react';
import "./style.css";

import { Video } from '../../api';
import { VideoPlayer } from './VideoPlayer';
import { getVideo } from '../../api/videos';
import { VideoControls } from './controls';
import { addClip } from '../../api/clip';
import { Redirect } from 'react-router-dom';

export interface Box {
    x: number
    y: number
    w: number
    h: number
}

export type Rotation = [number, number, number, number];

interface props{
    videoId: string
}
export function ClipCreator({videoId}: props) {

    let [ step, setStep ] = React.useState(1);
    let [ ready, setReady ] = React.useState(false);
    let stepText: string = "";
    switch(step) {
        case 1:
            stepText = "1st Dimension - Time";
            break
        case 2:
            stepText = "2nd Dimension - Area";
            break
        case 3:
            stepText = "3rd Dimension - Orientation";
            break
        case 4:
            stepText = "Complete!";
            break
    }

    let [ video, setVideo ] = React.useState<Video>();
    let [ [ width, height ], setDimensions ] = React.useState([0, 0]);
    React.useEffect(() => {
        getVideo(videoId)
        .then(video => {
            let maxHeight = window.innerHeight * .8;
            let width = Math.min(maxHeight * video.width / video.height, window.innerWidth, 600) - 1;
            let height = width * video.height / video.width;
            setDimensions([ width, height ]);
            setVideo(video)
        });
    }, []);

    let [ controls, setControls ] = React.useState<VideoControls>();
    let [ trickNames, setTrickNames ] = React.useState<string[]>();
    let [ boxes, setBoxes ] = React.useState<{[frame: number]: Box}>({});
    let [ rotations, setRotations ] = React.useState<{[frame: number]: Rotation}>({});

    return <div className="video-player">
        <ClipProgress step={step} ready={ready} onNext={() => {
            setStep(step+1);
            setReady(false);
        }} />
        <h3 style={{WebkitUserSelect: "none"}}> {stepText} </h3>
        { video && <VideoPlayer
            width={width}
            height={height}
            step={step}
            addBox={(b) => {
                if (!controls) return false
                boxes = {...boxes, [controls.frame]: b }
                setBoxes(boxes);
                let isReady = Object.keys(boxes).length > controls.endFrame - controls.startFrame
                setReady(isReady);
                return isReady;
            }}
            addRotation={(r) => {
                if (!controls) return false
                rotations = {...rotations, [controls.frame]: r}
                setRotations(rotations);
                let isReady = Object.keys(rotations).length > controls.endFrame - controls.startFrame
                setReady(isReady);
                return isReady;
            }}
            onVideoLoaded={(controls) => {
                setControls(controls);
                setReady(true);
            }}
            video={video} /> }
        { step == 1 && <StepOne /> }
        { step == 2 && <StepTwo /> }
        { step == 3 && <StepThree /> }
        { step == 4 && <StepFour 
            videoId={video?.id}
            controls={controls as VideoControls}
            boxes={boxes}
            rotations={rotations}
        />}
        <BottomBar 
            ready={ready}
            onNext={() => {
                setStep(step+1);
                setReady(false);
            }}
            text={ step == 3 ? "Finish" : "Next" }
        />
    </div>
}

interface clipProgressProps {
    ready: boolean
    step: number
    onNext(): void
}
function ClipProgress({step, ready, onNext}: clipProgressProps) {
    const thresholdColor = (n: number) => {
        if (ready && step == n - 1) {
            return { backgroundColor: "#ebbd34" }
        }
        if (step < n) {
            return { backgroundColor: "white" };
        }
        if (step == n) {
            return { backgroundColor: "#33b5e5" };
        }
        return { backgroundColor: "#d8d8d8" };
    }
    return <div className="video-player-progress" onClick={() => ready && onNext()}>
        <div className="video-player-step" style={thresholdColor(1)}> 
            <div className="video-player-step-title"> 1D </div>
            <div className="video-player-step-arrow" style={thresholdColor(2)} />
        </div>
        <div className="video-player-step" style={thresholdColor(2)}> 
            <div className="video-player-step-title"> 2D </div>
            <div className="video-player-step-arrow" style={thresholdColor(3)} />
        </div>
        <div className="video-player-step" style={thresholdColor(3)}> 
            <div className="video-player-step-title"> 3D </div>
            <div className="video-player-step-arrow" style={thresholdColor(8)} />
        </div>
    </div>
}

function StepOne() {
    return <div className="instructions">
        <p> Use the start and end labels on the video to specify where the trick is in time. Start right before the first truck leaves the ground, and end as soon as both feet are in control of the board</p>
    </div> 
}

function StepTwo() {
    return <div className="instructions">
        <p> Draw a box around the skateboard using your mouse or finger. When ready, tap or click to go to the next frame </p>
    </div>
}

function StepThree() {
    return <div className="instructions">
        <p> Match the skateboard on the right to the position of the example on the left </p>
        <ul>
            <li> Moving left to right will roll the board like a kickflip </li>
            <li> Moving up or down will spin board like a 180 or a shuv it </li>
            <li> Scrolling the mouse wheel will tilt board like popping an ollie </li>
            <li> If you're on mobile, drawing circles is the same as scrolling the mouse wheel </li>
        </ul>
    </div>
}

interface stepFourProps {
    videoId?: string
    controls: VideoControls
    boxes: { [frame: number]: Box }
    rotations: { [frame: number]: Rotation }
}
function StepFour({videoId, controls, boxes, rotations}: stepFourProps) {
    let input = React.createRef<HTMLInputElement>()
    let [ disabled, setDisabled ] = React.useState(false);
    let [ error, setError ] = React.useState("")
    let [ finished, setFinished ] = React.useState(false);
    if (finished) {
        return <Redirect to="/videos" />
    }
    return <div>
        <h3> Name this Trick </h3>
        <input type="text" ref={input} placeholder="kickflip"/>
        <button disabled={disabled} onClick={() => {
            if (!input.current?.value) {
                return;
            }
            setDisabled(true);
            addClip({
                videoId,
                trick: input.current.value,
                startFrame: controls.startFrame,
                endFrame: controls.endFrame,
                boxes,
                rotations,
            }, controls.canvasScale)
            .then(_ => {
                setFinished(true);
            })
            .catch(err => {
                setError(err);
                setDisabled(false);
            })
        }}> Add Clip </button>
        <div style={{color: "red"}}> {error} </div>
    </div>
}

interface bottomBarProps{
    text: string
    ready: boolean
    onNext(): void
}
function BottomBar({text, ready, onNext}: bottomBarProps){
    return <>
        <div className="bottom-bar-space"> </div>
        <div className="bottom-bar"> 
            <button onClick={onNext} style={{backgroundColor: (ready) ? "#ebbd34" : "#33b5e5"}}disabled={!ready}> {text} </button>
        </div>
    </>
}