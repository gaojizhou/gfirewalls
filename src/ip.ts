import { IncomingMessage } from 'http';

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const INVALID_IPS = new Set(['unknown', '127.0.0.1', '0:0:0:0:0:0:0:1', '::1']);

// 私有网段范围
const LAN_RANGES: Array<{ base: number; mask: number }> = [
    { base: ip4ToInt('10.0.0.0'),    mask: 0xff000000 },  // 10.0.0.0/8
    { base: ip4ToInt('172.16.0.0'),  mask: 0xfff00000 },  // 172.16.0.0/12
    { base: ip4ToInt('192.168.0.0'), mask: 0xffff0000 },  // 192.168.0.0/16
];

function ip4ToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

export function isLanIp(ip: string): boolean {
    if (!IP_REGEX.test(ip)) return false;
    const n = ip4ToInt(ip);
    return LAN_RANGES.some(({ base, mask }) => (n & mask) === base);
}

// 将 IPv4-mapped IPv6（::ffff:x.x.x.x）还原为纯 IPv4
function normalizeIp(ip: string): string {
    const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
    return mapped ? mapped[1] : ip;
}

function isValidIp(ip: string | undefined): ip is string {
    if (!ip) return false;
    return !INVALID_IPS.has(normalizeIp(ip).toLowerCase());
}

// 依次检查各代理头，取第一个有效 IP
export function getIpAddr(req: IncomingMessage): string | null {
    const proxyHeaders = [
        'x-forwarded-for',
        'proxy-client-ip',
        'wl-proxy-client-ip',
    ];

    for (const header of proxyHeaders) {
        const value = req.headers[header];
        if (typeof value === 'string') {
            // x-forwarded-for 可能包含多个 IP，取第一个
            const ip = normalizeIp(value.split(',')[0].trim());
            if (isValidIp(ip)) return ip;
        }
    }

    const remote = req.socket?.remoteAddress;
    if (isValidIp(remote)) return normalizeIp(remote);

    return null;
}

export function isCorrectIp(ip: string | undefined): boolean {
    if (!ip) return false;
    return IP_REGEX.test(ip);
}
