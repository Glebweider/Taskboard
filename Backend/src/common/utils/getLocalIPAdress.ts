import { networkInterfaces } from "os";

export function _getLocalIPAddress(): string {
	const nets = networkInterfaces();
	let localAddress = '';
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]!) {
			// Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
			if (net.family === 'IPv4' && !net.internal) {
				localAddress = net.address;
			}
		}
	}
	return localAddress;
}