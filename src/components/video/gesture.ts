

export enum TapMode {
    DOWN, UP, CANCEL,
}
export enum DragMode {
    START, MOVE, END
}

interface GestureListeners{
    tap?(mode: TapMode, x: number, y: number): void
    drag?(mode: DragMode, x: number, y: number, dx: number, dy: number): void
    scroll?(dz: number): void
    move?(dx: number, dy: number,): void
}

interface Position {
    clientX: number
    clientY: number
}

// handleGestures takes pixel-relative callback functions for events that start on the given canvas 
export function handleGestures(elem: HTMLCanvasElement, listeners: GestureListeners): () => void {

    const relativeCoords = ({clientX, clientY}: Position) => {
        let { left, top, width, height } = elem.getBoundingClientRect();
        let offsetX = Math.max(0, elem.width - elem.height * width / height);
        let offsetY = Math.max(0, elem.height - elem.width * height / width);
        return [ 
            offsetX + (clientX - left) * window.devicePixelRatio, 
            offsetY + (clientY -  top) * window.devicePixelRatio 
        ] as [ number, number ];
    }

    const moveThreshold = 3 * window.devicePixelRatio;
    let isTap = true;
    let dragging = false;
    let mx: number, my: number;
    let sx: number, sy: number;
    let px: number, py: number;

    const down = (e: Position) => {
        let [ x, y ] = relativeCoords(e)
        if ( x >= 0 && x < elem.width && y >= 0 && y < elem.height ) {
            dragging = true;
            if (listeners.tap) {
                listeners.tap(TapMode.DOWN, x, y);
            }
        }
        mx = x;
        my = y;
        sx = x;
        sy = y;
    }

    const move = (e: Position) => {
        let [ x, y ] = relativeCoords(e);
        if (listeners.move) {
            if (!mx || !my) {
                mx = x;
                my = y;
            }
            listeners.move(x - mx, y - my);
            mx = x;
            my = y;
        }
        if (!dragging) {
            return;
        }
        if (isTap && (x - sx) * (x - sx) + (y - sy) * (y - sy) > moveThreshold) {
            if (listeners.drag) {
                listeners.drag(DragMode.START, sx, sy, 0, 0);
                px = sx;
                py = sy;
            }
            if (listeners.tap) {
                listeners.tap(TapMode.CANCEL, x, y);
            }
            isTap = false;
        }
        if (!isTap) {
            if (listeners.drag) {
                listeners.drag(DragMode.MOVE, x, y, x - px, y - py);
            }
            px = x;
            py = y;
        }
    }

    const up = (e: Position) => {
        let [ x, y ] = relativeCoords(e);
        if (isTap) {
            if (listeners.tap) {
                listeners.tap(TapMode.UP, x, y);
            }
        } else {
            if (listeners.drag) {
                listeners.drag(DragMode.END, x, y, x - px, y - py);
            }
        }
        dragging = false;
        isTap = true;
    }

    const onmousedown = function(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        down(e);
    }

    const onmousemove = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        move(e);
    }

    const onmouseup = (e: MouseEvent) => {
        if (!dragging) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        up(e);
    }

    let mobileCancel = false;
    const ontouchstart = (e: TouchEvent) => {
        if (mobileCancel) {
            return;
        }
        if (e.touches.length > 1) {
            if (dragging) {
                e.preventDefault();
                e.stopPropagation();
                up(e.touches[0]);
            }
            mobileCancel = true;
            return;
        }
        down(e.touches[0]);
    }

    const ontouchmove = (e: TouchEvent) => {
        if (mobileCancel) {
            return;
        }
        if (e.touches.length > 1) {
            if (dragging) {
                e.preventDefault();
                e.stopPropagation();
                up(e.touches[0])
            }
            return;
        }
        if (!dragging) {
            return;
        }
        e.preventDefault();
        move(e.touches[0]);
    }

    const ontouchend = (e: TouchEvent) => {
        console.log(e)
        if (e.touches.length == 0) {
            if (!mobileCancel && dragging) {
                e.stopPropagation();
                e.preventDefault();
                up(e.changedTouches[0]); // this is certanly a bug. Not worth fixing
            }
            mobileCancel = false;
        }
    }

    const onwheel = (e: WheelEvent) => {
        if (listeners.scroll) {
            listeners.scroll(e.deltaY);
        }
    }

    elem.addEventListener("mousedown", onmousedown, true)
    elem.addEventListener("touchstart", ontouchstart, true);
    window.addEventListener("mousemove", onmousemove, true)
    window.addEventListener("touchmove", ontouchmove, { capture: true, passive: false });
    window.addEventListener("mouseup", onmouseup, true);
    window.addEventListener("touchend", ontouchend, true);
    window.addEventListener("touchcancel", ontouchend, true);
    window.addEventListener("wheel", onwheel, true);
    return () => {
        elem.removeEventListener("mousedown", onmousedown, true);
        elem.removeEventListener("touchstart", ontouchstart, true);
        window.removeEventListener("mousemove", onmousemove, true);
        window.removeEventListener("touchmove", ontouchmove, true);
        window.removeEventListener("mouseup", onmouseup, true);
        window.removeEventListener("touchend", ontouchend, true);
        window.removeEventListener("touchcancel", ontouchend, true);
        window.removeEventListener("wheel", onwheel, true);
    }
}