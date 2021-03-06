import * as React from 'react';

import { eToQ, qMultiply } from '../renderer/math';
import { renderSkateboard } from '../renderer';

export function RotatingSkateboard() {

    let canvas = React.createRef<HTMLCanvasElement>();

    React.useEffect(() => {
        let ctx = canvas.current?.getContext("2d");
        let start = new Date().getTime()

        function rotate() {
            if (!ctx) {
                return;
            }
            let delta = (new Date().getTime() - start) / 2000;
            let shuvit = eToQ([1, 0, 0, -delta ]);
            let kickflip = eToQ([0, 0, 1, -delta]);
            renderSkateboard(ctx, qMultiply(kickflip, shuvit), [0, 0, 100, 100]);
        }

        let interval = window.setInterval(rotate, 24);
        return () => window.clearInterval(interval);
    }, [canvas.current])

    return <canvas
        ref={canvas}
        width="100"
        height="100"
        style={{
            objectFit: "contain",
        }}
    > </canvas>
}