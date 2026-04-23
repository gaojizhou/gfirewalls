import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

function runCmd(args: string[]): string {
    console.log('running command:', args.join(' '));
    const result = spawnSync(args[0], args.slice(1), { encoding: 'utf8' });
    if (result.error) {
        return 'run cmd error: ' + result.error.message;
    }
    return (result.stdout ?? '') + (result.stderr ?? '');
}

export function getAllowedIps(): string[] {
    const output = runCmd(['ufw', 'status']);
    const seen = new Set<string>();

    for (const line of output.split('\n')) {
        // 用正则提取 "ALLOW IN" 之后的 From 字段，避免 (v6) 后缀干扰 .pop()
        const match = line.match(/ALLOW IN\s+(.+?)\s*$/);
        if (!match) continue;

        const from = match[1].trim();
        // 过滤 Anywhere、Anywhere (v6) 等全开规则
        if (!from || /^anywhere/i.test(from)) continue;
        seen.add(from);
    }

    return Array.from(seen);
}

export function setIp(ip: string | null, port: number): string {
    if (!ip) {
        return (
            "sorry, gfirewalls cannot recognize your ip<br>" +
            "you can manual add your ip like this: <br>" +
            "<a href='/add_other_ip?ip=' target='view_window'>add_other_ip?ip={your ip}</a><br>"
        );
    }

    const tcpResult = runCmd(['ufw', 'allow', 'from', ip, 'to', 'any', 'port', '1:39000', 'proto', 'tcp']);

    // ufw 规则已存在时跳过 UDP，直接返回
    if (
        tcpResult.includes('已经存在') ||
        tcpResult.includes('already exists') ||
        tcpResult.includes('Skipping')
    ) {
        return tcpResult + ' your ip is ' + ip;
    }

    runCmd(['ufw', 'allow', 'from', ip, 'to', 'any', 'port', '1:39000', 'proto', 'udp']);
    const reload = runCmd(['ufw', 'reload']);
    return reload + ' your ip is ' + ip;
}

export function getUfwStatusVerbose(): string {
    return runCmd(['ufw', 'status', 'verbose']);
}

const LAN_SUBNETS = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

function fetchPublicIp(): string | null {
    const result = spawnSync('curl', ['-s', '--max-time', '5', 'ifconfig.me'], { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
        console.warn('fetchPublicIp: failed to get public IP, skipping');
        return null;
    }
    const ip = result.stdout.trim();
    // 简单校验是否为合法 IPv4
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        console.warn('fetchPublicIp: unexpected response:', ip);
        return null;
    }
    return ip;
}

// publicPort: 对所有人开放的端口（admin port 通过白名单规则自动覆盖，无需单独开放）
export function clear(publicPort: number): void {
    const port = publicPort;
    // 修复原 Java 版 bug：shell 重定向在 exec 中不生效，改用 writeFileSync 直接写文件
    const rules = [
        '*filter',
        ':ufw-user-input - [0:0]',
        ':ufw-user-output - [0:0]',
        ':ufw-user-forward - [0:0]',
        ':ufw-before-logging-input - [0:0]',
        ':ufw-before-logging-output - [0:0]',
        ':ufw-before-logging-forward - [0:0]',
        ':ufw-user-logging-input - [0:0]',
        ':ufw-user-logging-output - [0:0]',
        ':ufw-user-logging-forward - [0:0]',
        ':ufw-after-logging-input - [0:0]',
        ':ufw-after-logging-output - [0:0]',
        ':ufw-after-logging-forward - [0:0]',
        ':ufw-logging-deny - [0:0]',
        ':ufw-logging-allow - [0:0]',
        ':ufw-user-limit - [0:0]',
        ':ufw-user-limit-accept - [0:0]',
        '### RULES ###',
        '',
        `### tuple ### allow any ${port} 0.0.0.0/0 any 0.0.0.0/0 in`,
        `-A ufw-user-input -p tcp --dport ${port}  -j ACCEPT`,
        `-A ufw-user-input -p udp --dport ${port}  -j ACCEPT`,
        '',
        '### END RULES ###',
        '',
        '### LOGGING ###',
        '-A ufw-after-logging-input -j LOG --log-prefix "[UFW BLOCK] " -m limit --limit 3/min --limit-burst 10',
        '-I ufw-logging-deny -m conntrack --ctstate INVALID -j RETURN -m limit --limit 3/min --limit-burst 10',
        '-A ufw-logging-deny -j LOG --log-prefix "[UFW BLOCK] " -m limit --limit 3/min --limit-burst 10',
        '-A ufw-logging-allow -j LOG --log-prefix "[UFW ALLOW] " -m limit --limit 3/min --limit-burst 10',
        '### END LOGGING ###',
        '',
        '### RATE LIMITING ###',
        '-A ufw-user-limit -m limit --limit 3/minute -j LOG --log-prefix "[UFW LIMIT BLOCK] "',
        '-A ufw-user-limit -j REJECT',
        '-A ufw-user-limit-accept -j ACCEPT',
        '### END RATE LIMITING ###',
        'COMMIT',
    ].join('\n');

    writeFileSync('/etc/ufw/user.rules', rules, 'utf8');
    runCmd(['ufw', 'reload']);

    // 局域网不做 block
    for (const subnet of LAN_SUBNETS) {
        runCmd(['ufw', 'allow', 'from', subnet, 'to', 'any', 'port', '1:39000', 'proto', 'tcp']);
        runCmd(['ufw', 'allow', 'from', subnet, 'to', 'any', 'port', '1:39000', 'proto', 'udp']);
    }

    // 与服务器同公网 IP 的请求不做 block
    const publicIp = fetchPublicIp();
    if (publicIp) {
        console.log('auto-allowing server public IP:', publicIp);
        runCmd(['ufw', 'allow', 'from', publicIp, 'to', 'any', 'port', '1:39000', 'proto', 'tcp']);
        runCmd(['ufw', 'allow', 'from', publicIp, 'to', 'any', 'port', '1:39000', 'proto', 'udp']);
    }

    runCmd(['ufw', 'reload']);
}
