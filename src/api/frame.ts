import { Quaternion } from "../math";

export interface Bound {
    id: number
    x: number
    y: number
    width: number
    height: number
    rotations: Rotation[]
}

export interface Rotation {
    r: number
    i: number
    j: number
    k: number
}

export function toRot(q: Quaternion): Rotation  {
    return {
        r: q[0],
        i: q[1],
        j: q[2],
        k: q[3],
    }
}

export function toQuat({r, i, j, k}: Rotation): Quaternion {
    return [r, i, j, k]
}