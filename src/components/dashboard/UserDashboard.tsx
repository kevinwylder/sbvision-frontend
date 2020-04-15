import * as React from 'react';
import { UserInfo, getUserInfo } from '../../api';

import "./dashboard.css"
import { AddVideo } from './AddVideo';
import { ListElement, Listing } from '../list/Listing';
import { login } from '../../api/auth';
import { getVideos } from '../../api/videos';

export function UserDashboard() {

    let [ info, setUserInfo ] = React.useState<UserInfo>();
    React.useEffect(() => {
        getUserInfo()
        .then(setUserInfo)
        .catch(err => {
            console.log(err);
            login();
        });
    }, [])

    let [ videos, setVideos ] = React.useState<ListElement[]>([]);
    React.useEffect(() => {
        getVideos()
        .then(videos => {
            setVideos(videos.map(({title, src, thumbnail, duration, type}) => ({
                thumbnail,
                title,
                link: src,
                textCenter: duration,
                textRight: (type == 1) ? "youtube" : "/r/skateboarding",
            })));
        })
    }, []);

    if (!info) {
        return <div> Loading... </div>
    }

    return <>
        <div className="dashboard-container">
            <h1> Hello, {info.username}</h1>
            <AddVideo onVideoAdded={(video) => {
                setVideos([video, ...videos]);
            }}/>
            <h1> Your Videos </h1>
            <Listing videos={videos} />
        </div>
    </>
}
