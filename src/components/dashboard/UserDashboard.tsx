import * as React from 'react';
import { UserInfo, getUserInfo } from '../../api';

import "./dashboard.css"
import { AddVideo } from './AddVideo';
import { ListElement, Listing } from '../list/Listing';
import { getVideos, Video } from '../../api/videos';
import { Redirect } from 'react-router-dom';
import { ClipCreator } from './ClipCreator';

export function UserDashboard() {

    let [ loginErr, setLoginErr ] = React.useState<string>();
    let [ info, setUserInfo ] = React.useState<UserInfo>();
    React.useEffect(() => {
        getUserInfo()
        .then(setUserInfo)
        .catch(err => {
            setLoginErr(err + "");
        });
    }, [])

    let [ selectedVideo, setSelectedVideo ] = React.useState<Video>()
    let [ videos, setVideos ] = React.useState<ListElement[]>([]);
    React.useEffect(() => {
        getVideos()
        .then(videos => {
            setVideos(videos.map((video) => ({
                thumbnail: video.thumbnail,
                title: video.title,
                onClick: () => { setSelectedVideo(video) },
                textLeft: video.uploaded_by,
                textCenter: video.duration,
                textRight: video.from,
            })));
        })
    }, []);

    if (loginErr) {
        return <Redirect to="/" />
    }

    if (!info) {
        return <div> Loading... </div>
    }

    if (selectedVideo) {
        return <ClipCreator exit={() => setSelectedVideo(undefined)} video={selectedVideo} />
    }

    return <>
        <div className="dashboard-container">
            <h1> Hello, {info.username}</h1>
            <AddVideo onVideoAdded={(video) => {
                setSelectedVideo(video);
            }}/>
            <h1> Your Videos </h1>
            <Listing videos={videos} pageSize={8}/>
        </div>
    </>
}
