import { API_URL } from "./url";

export function logImportantError(err: string) {
    fetch(`${API_URL}/test`, {
        method: "POST",
        body: err,
        headers: {
            testname: "error.txt"
        }
    });
}
