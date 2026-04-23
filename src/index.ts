import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { getIpAddr, isCorrectIp } from './ip';
import { setIp, clear, getAllowedIps, getUfwStatusVerbose } from './ufw';

const DEFAULT_PORT = 7893;
const DEFAULT_ADMIN_PORT = 7894;

function parsePorts(): { port: number; adminPort: number } {
    let port = DEFAULT_PORT;
    let adminPort = DEFAULT_ADMIN_PORT;
    for (const arg of process.argv.slice(2)) {
        const m = arg.match(/^--port=(\d+)$/);
        const ma = arg.match(/^--admin-port=(\d+)$/);
        if (m) port = parseInt(m[1], 10);
        if (ma) adminPort = parseInt(ma[1], 10);
    }
    return { port, adminPort };
}

const { port, adminPort } = parsePorts();

// 公开端口（对所有人开放）：仅提供 /add_this_ip
const publicServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const { pathname } = parse(req.url ?? '/', true);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;

    switch (pathname) {
        case '/': {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('visit [your-server-ip]:[port]/add_this_ip to add your ip to whitelist');
            break;
        }
        case '/add_this_ip': {
            const ip = getIpAddr(req);
            res.end(setIp(ip, port));
            break;
        }
        default: {
            res.statusCode = 404;
            res.end('not found');
        }
    }
});

// 管理端口（需要白名单才能访问）：提供所有功能
const adminServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const { pathname, query } = parse(req.url ?? '/', true);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;

    switch (pathname) {
        case '/': {
            res.end(
                "This is a simple and easy to use firewall<br>" +
                "You can use like this:<br>" +
                `<a href='/add_this_ip' target='view_window'>/add_this_ip</a><br>` +
                `<a href='/clear' target='view_window'>/clear</a><br>` +
                `<a href='/add_other_ip?ip=' target='view_window'>add_other_ip?ip={your ip}</a><br>` +
                `<a href='/ping' target='view_window'>/ping</a><br>` +
                `<a href='/status' target='view_window'>/status</a><br>`
            );
            break;
        }
        case '/add_this_ip': {
            const ip = getIpAddr(req);
            res.end(setIp(ip, port));
            break;
        }
        case '/add_other_ip': {
            const ip = query.ip as string | undefined;
            if (!isCorrectIp(ip)) {
                res.end('ip is not correct: ' + ip);
                break;
            }
            res.end(setIp(ip ?? null, port));
            break;
        }
        case '/clear': {
            const ip = getIpAddr(req);
            clear(port);
            res.end(setIp(ip, port));
            break;
        }
        case '/ping': {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('pong');
            break;
        }
        case '/status': {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(getUfwStatusVerbose());
            break;
        }
        case '/init_config': {
            res.end(
                "click /clear to blocking all ip: <a href='/clear' target='view_window'>/clear</a><br>" +
                "ssh or other server maybe disconnecting sessions<br>" +
                "click /add_this_ip add your ip to whitelist: <a href='/add_this_ip' target='view_window'>/add_this_ip</a><br>"
            );
            break;
        }
        default: {
            res.statusCode = 404;
            res.end('not found');
        }
    }
});

publicServer.listen(port, () => {
    console.log(`gfirewalls public server on port ${port} (add_this_ip only)`);
});

adminServer.listen(adminPort, () => {
    console.log(`gfirewalls admin server on port ${adminPort} (whitelist required)`);
});
