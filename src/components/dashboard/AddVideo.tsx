import * as React from 'react';
import { uploadVideo, VideoStatus, getVideoStatus, Video } from '../../api/videos';
import { ListRow } from '../list/Listing';

interface addProps{
    onVideoAdded?(video: Video): void
}
export function AddVideo({onVideoAdded}: addProps) {
    let [ status, setStatus ] = React.useState<VideoStatus>();
    let [ finishedRequest, setFinishedRequest ] = React.useState(false);

    React.useEffect(() => {
        if (finishedRequest) {
            return;
        }
        return getVideoStatus((status, isOpen) => {
            if (isOpen) {
                setStatus(status);
            } else {
                setFinishedRequest(true);
            }
        })
    }, [finishedRequest])

    React.useEffect(() => {
        if (status?.complete) {
            let timeout = setTimeout(() => {
                setFinishedRequest(true);
                setStatus(undefined);
                if (onVideoAdded && status?.info) {
                    onVideoAdded(status.info);
                }
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [status?.complete]);

    if (status) {
        return <ShowVideoStatus {...status} />
    }

    return <UploadVideo setRequestID={id => {
        setFinishedRequest(false);
    }} />
}


interface uploadProps {
    setRequestID: (id: string) => void
    //setStatus: (status: VideoStatus) => void
}
function UploadVideo({ setRequestID }: uploadProps) {
    let [ isPending, setIsPending ] = React.useState(false);
    let [ error, setError ] = React.useState("");
    let ref = React.createRef<HTMLInputElement>();

    return <div>
        <h3> Add a new Video in one of these formats</h3>
        <ul>
            <li>Youtube link: <pre>https://youtu.be/...</pre> or <pre>https://www.youtube.com/watch?...</pre></li>
            <li>Reddit link: <pre>https://www.reddit.com/r/skateboarding/comments/...</pre></li>
        </ul>
        <div className="add-video">
            <input type="url" ref={ref} placeholder={"Youtube link or /r/skateboarding comments url"} />
            <button disabled={isPending} onClick={() => {
                if (!ref.current) return
                setIsPending(true);
                uploadVideo(ref.current.value)
                .then(({id}) => setRequestID(id))
                .catch(err => {
                    setError(err + "");
                })
            }}> Add </button>
        </div>
        <span style={{color: "red"}} > {error} </span>
    </div>
}

function ShowVideoStatus({info, id, complete, status, success}: VideoStatus) {
    if (info) {
        return <div className="listing"> 
            <ListRow textCenter={status} title={info.title} thumbnail={info.thumbnail} />
        </div>
    }
    return <div style={{color: (!complete) ? "black" : (success) ? "green" : "red"}}>
        <h3> Video Request ID: {id} </h3>
        <p> {status} </p>
    </div>
}