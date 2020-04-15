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
    let url = React.createRef<HTMLInputElement>();
    let file = React.createRef<HTMLInputElement>();
    let title = React.createRef<HTMLInputElement>();

    let onSubmit = () => {
        if (!url.current || !file.current || !title.current) return
        setIsPending(true);

        let form = new FormData();

        if (url.current.value != "") {
            form.append('url', url.current.value);
        } else if (title.current.value && file.current.files) {
            form.append('video', file.current.files[0])
            form.append('title', title.current.value)
        }

        uploadVideo(form)
        .then(({id}) => setRequestID(id))
        .catch(err => {
            setIsPending(false);
            setError(err + "");
        })
    }

    return <div>
        <h3> Add a new Video in one of these formats</h3>
        <ul>
            <li>Youtube link: <pre>https://youtu.be/...</pre> or <pre>https://www.youtube.com/watch?...</pre></li>
            <li>Reddit comments link from <a href="https://www.reddit.com/r/skateboarding">/r/skateboarding</a> <pre>https://www.reddit.com/r/skateboarding/comments/...</pre></li>
        </ul>
        <div className="add-video">
            <input type="url" ref={url} placeholder={"Youtube link or /r/skateboarding comments url"} />
            <button disabled={isPending} onClick={ onSubmit }> Add </button>
        </div>
        <ul>
            <li>Directly upload a video file </li>
        </ul>
        <div className="add-video">
            <div style={{display: "flex", flexDirection: "column"}}>
                <input type="text" ref={title} placeholder={"The title of your post"} />
                <input type="file" ref={file} accept="video/*" />
            </div>
            <button disabled={isPending} onClick={onSubmit}> Upload </button>
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