import { LOG_URL } from "../constants";

export function httpLog(err: string) {
    if (!LOG_URL) {
        console.log(err)
        return;
    } else {
        fetch(`${LOG_URL}/log`, {
            method: "POST",
            body: err,
        });
    }
}
