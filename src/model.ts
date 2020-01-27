import { Quaternion } from './math';

export interface Label{
    input: ModelInput
    output: ModelOutput
}

export interface ModelInput{
    width: number
    height: number
    data: string
}

export interface ModelOutput{
    isSkateboard: number
    rotation: Quaternion
}


// big shoutout to Egor Nepomnyaschih 
// https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
const base64abc = (() => {
	let abc = [],
		A = "A".charCodeAt(0),
		a = "a".charCodeAt(0),
		n = "0".charCodeAt(0);
	for (let i = 0; i < 26; ++i) {
		abc.push(String.fromCharCode(A + i));
	}
	for (let i = 0; i < 26; ++i) {
		abc.push(String.fromCharCode(a + i));
	}
	for (let i = 0; i < 10; ++i) {
		abc.push(String.fromCharCode(n + i));
	}
	abc.push("+");
	abc.push("/");
	return abc;
})();

export function encodeImage(bytes: Uint8ClampedArray) {
    // remove alpha channel
    for (let i = 0; i < bytes.length; i += 4) {
        bytes[0 + i * 3 / 4] = bytes[i + 0];
        bytes[1 + i * 3 / 4] = bytes[i + 1];
        bytes[2 + i * 3 / 4] = bytes[i + 2];
    }
    bytes = bytes.slice(0, bytes.length * 3 / 4);

	let result = '', i, l = bytes.length;
	for (i = 2; i < l; i += 3) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
		result += base64abc[bytes[i] & 0x3F];
	}
	if (i === l + 1) { // 1 octet missing
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 0x03) << 4];
		result += "==";
	}
	if (i === l) { // 2 octets missing
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[(bytes[i - 1] & 0x0F) << 2];
		result += "=";
	}
	return result;
}
