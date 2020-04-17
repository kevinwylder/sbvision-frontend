import * as React from 'react';

import { Video } from '../../api';
import { VideoPlayer } from './video/VideoPlayer';

interface props{
    video: Video
    exit: () => void
}
export function ClipCreator({video, exit}: props) {

    let [ step, setStep ] = React.useState(1);
    
    return <div className="video-player">
        <ClipProgress step={step} />
        <VideoPlayer
            width={600}
            height={400}
            video={video} />
        <br/>
        <button onClick={() => setStep(Math.max(step - 1, 1))}> Prev </button>
        <button onClick={exit}> Back to Home Page </button>
        <button onClick={() => setStep(Math.min(step + 1, 4))}> Next </button>
    </div>
}

interface clipProgressProps {
    step: number
}
export function ClipProgress({step}: clipProgressProps) {
    const thresholdColor = (n: number) => {
        if (step < n) {
            return { backgroundColor: "white" };
        }
        if (step == n) {
            return { backgroundColor: "#33b5e5" };
        }
        return { backgroundColor: "#d8d8d8" };
    }
    return <div className="video-player-progress">
        <div className="video-player-step" style={thresholdColor(1)}> 
            <div className="video-player-step-title"> Find a Trick </div>
            <div className="video-player-step-arrow" style={thresholdColor(2)} />
        </div>
        <div className="video-player-step" style={thresholdColor(2)}> 
            <div className="video-player-step-title"> Name the Trick </div>
            <div className="video-player-step-arrow" style={thresholdColor(3)} />
        </div>
        <div className="video-player-step" style={thresholdColor(3)}> 
            <div className="video-player-step-title"> Box the Skateboard </div>
            <div className="video-player-step-arrow" style={thresholdColor(4)} />
        </div>
        <div className="video-player-step" style={thresholdColor(4)}> 
            <div className="video-player-step-title"> Match the Orientation </div>
            <div className="video-player-step-arrow" style={thresholdColor(5)} />
        </div>
    </div>
}