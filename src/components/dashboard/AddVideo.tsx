import * as React from 'react';
import { uploadVideo, VideoStatus, streamVideoStatus, Video } from '../../api/videos';
import { ListRow } from '../list/Listing';

interface addProps{
    onVideoSelected?(video: Video): void
}
export function AddVideo({onVideoSelected}: addProps) {
    let [ statuses, setStatuses ] = React.useState<VideoStatus[]>([]);

    React.useEffect(() => {
        return streamVideoStatus(setStatuses);
    }, [])

    return <div>
        <UploadVideo />
        { statuses.length > 0 && <h3> Pending Uploads </h3>}
        { statuses.map((status, i) => 
            <ShowVideoStatus key={i} {...status} />
        )}
    </div>

}


function UploadVideo() {
    let [ error, setError ] = React.useState("");
    let [ isPending, setIsPending ] = React.useState(false);
    let [ uploadProgress, setUploadProgress ] = React.useState<number>();
    let url = React.createRef<HTMLInputElement>();
    let file = React.createRef<HTMLInputElement>();
    let title = React.createRef<HTMLInputElement>();

    let onSubmit = () => {
        if (!url.current || !file.current || !title.current) return
        const urlRef = url.current;
        const fileRef = file.current;
        const titleRef = title.current;
        setIsPending(true);
        setError("")

        let form = new FormData();

        if (urlRef.value != "") {
            form.append('url', url.current.value);
        } else if (titleRef.value && fileRef.files) {
            form.append('video', fileRef.files[0])
            form.append('title', titleRef.value)
        }

        uploadVideo(form, setUploadProgress)
        .then(() => {
            setUploadProgress(undefined);
            setIsPending(false);
            setError("");
            urlRef.value = "";
            titleRef.value = "";
            fileRef.value = "";
        })
        .catch(err => {
            setUploadProgress(undefined);
            setIsPending(false);
            setError(err + "");
        })
    }

    return <div>
        <h3> Add a new Video in one of these formats</h3>
        <ul>
            <li>Youtube link: <pre>youtu.be/...</pre> or <pre>https://www.youtube.com/watch?...</pre></li>
            <li>Reddit comments link from <a href="https://www.reddit.com/r/skateboarding">/r/skateboarding</a> <pre style={{overflow: "scroll"}}>https://www.reddit.com/r/skateboarding/comments/...</pre></li>
        </ul>
        <div className="add-video">
            <input disabled={isPending} type="url" ref={url} placeholder={"Youtube link or /r/skateboarding comments url"} />
            <button disabled={isPending} onClick={ onSubmit }> Add </button>
        </div>
        <ul>
            <li>Directly upload a video file </li>
        </ul>
        <div className="add-video">
            <div style={{display: "flex", flexDirection: "column"}}>
                <input disabled={isPending} type="text" ref={title} placeholder={"The title of your post"} />
                <input disabled={isPending} type="file" ref={file} accept="video/*" />
            </div>
            <button disabled={isPending} onClick={onSubmit}> Upload </button>
        </div>
        { uploadProgress !== undefined && 
        <div className="add-video-upload-progress">
            <div> Upload Progress - </div>
            <progress value={uploadProgress * 100} max={100}> { Math.floor(uploadProgress * 100) } % </progress>
        </div>}
        <span style={{color: "red"}} > {error} </span>
    </div>
}

function ShowVideoStatus({info, is_complete, message, was_success, requestid}: VideoStatus) {
    let textColor = (is_complete) ? (was_success ? "green" : "red") : "black";
    return <div className="listing"> 
        <div style={{color: textColor, fontSize: "15px"}}> { requestid }: { message } </div>
        { info && <ListRow 
            title={info.title} 
            onClick={() => {

            }}
            textLeft={info.uploaded_by} 
            textRight={info.from} 
            textCenter={info.duration} 
            thumbnail={info.thumbnail} /> 
        }
    </div>
}