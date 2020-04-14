import * as React from 'react';

import './list.css';

import { Redirect } from 'react-router-dom';

export interface ListElement {
    thumbnail: string
    title: string
    link?: string
    textLeft?: string
    textCenter?: string
    textRight?: string
}

interface ListingData {
    videos: ListElement[]
    pageSize?: number;
}

export function Listing({videos, pageSize}: ListingData) {

    const PAGE_SIZE = pageSize || 15;
    let [ offset, setOffset ] = React.useState(0);

    return (
    <div className="listing">
        {videos.map((v, i) => 
            <ListRow key={i} {...v} />
        )}
        <ListPagenation
            pageSize={PAGE_SIZE}
            maxTotal={videos.length}
            start={offset}
            end={offset + videos.length}
            onPageSelected={setOffset}
        />
    </div>)
}

export function ListRow(video: ListElement) {
    let [ selected, setSelected ] = React.useState(false);
    if (selected && video.link) {
        return <Redirect push to={video.link}/>
    }
    return (
        <div className="list-row" onClick={() => video.link && setSelected(true)}>
            <img className="list-row-image"
                src={video.thumbnail} />
            <div className="list-row-text">
                <h3 className="list-row-title" style={{
                    color: selected ? "red" : "black"
                }}> {video.title} </h3>
                <div className="list-row-stats">
                    <div> { video.textLeft || "" } </div> 
                    <div> { video.textCenter || "" } </div>
                    <div> { video.textRight || "" } </div>
                </div>
            </div>
        </div>
    )
}

interface ListPagenationProps {
    maxTotal: number
    pageSize: number
    start: number
    end: number
    onPageSelected: (offset: number) => void
}

export function ListPagenation(props: ListPagenationProps) {
    const disabled = "#9a9a9a";
    let pageText = (props.pageSize <= 1) ? props.start + 1 + "" : props.start + 1 + " to " + props.end;
    const canGoBack = () => props.start > 0;
    const canGoForward = () => props.end < props.maxTotal;
    return <div className="list-pagenation">
        <div
            style={{ color: canGoBack() ? "black" : disabled }}
            onClick={() => {
                if (canGoBack())  {
                    props.onPageSelected(Math.max(0, props.start - props.pageSize));
                }
            }}
        >Back</div>
        <div> {pageText} </div>
        <div 
            style={{ color: canGoForward() ? "black" : disabled }}
            onClick={() => {
                if (canGoForward()) {
                    props.onPageSelected(Math.min(props.start + props.pageSize, props.maxTotal - props.pageSize));
                }
            }}
        >Forward</div>
    </div>
}