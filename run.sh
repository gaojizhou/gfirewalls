#!/bin/bash

# run in root
if [ "$(id -u)" != "0" ]; then
   echo "this script must be run as root or sudo permissions" 1>&2
   exit 1
fi

# check ufw
if command -v ufw >/dev/null 2>&1; then
  echo 'ufw check'
else
  echo 'ufw no exists, maybe you can install ufw like this: sudo apt install ufw'
  exit 1
fi

# check node（兼容 nvm 安装路径，sudo 会重置 PATH 导致 which/command -v 均失效）
NODE_BIN=$(which node 2>/dev/null)
if [ -z "$NODE_BIN" ]; then
  # 通过 $SUDO_USER 找到真实用户的 home，定向搜索 nvm 路径
  REAL_HOME=$(getent passwd "${SUDO_USER:-$USER}" | cut -d: -f6)
  NODE_BIN=$(find "$REAL_HOME/.nvm/versions/node" -name "node" -path "*/bin/node" 2>/dev/null | sort -V | tail -1)
fi
if [ -z "$NODE_BIN" ]; then
  echo 'node no exists, please install Node.js (>=14): https://nodejs.org'
  exit 1
fi
echo "node check: $NODE_BIN"
$NODE_BIN --version

# 将 node 所在目录加入 PATH，确保 npm/npx 内部的 env node 能找到
export PATH="$(dirname "$NODE_BIN"):$PATH"

# npm 与 node 在同一目录
NPM_BIN="$(dirname "$NODE_BIN")/npm"
if [ ! -x "$NPM_BIN" ]; then
  echo 'npm no exists, please reinstall Node.js'
  exit 1
fi
echo "npm check: $NPM_BIN"
$NPM_BIN --version

# install dependencies (typescript, @types/node)
echo 'running npm install...'
$NPM_BIN install
if [ $? -ne 0 ]; then
  echo 'npm install failed'
  exit 1
fi

# compile TypeScript -> dist/
TSC_BIN="$(dirname "$NODE_BIN")/npx"
echo 'running tsc...'
$TSC_BIN tsc
if [ $? -ne 0 ]; then
  echo 'tsc build failed'
  exit 1
fi
echo 'build success'

echo "select a gfirewalls public port (open to everyone, add_this_ip only)"
read -p "please input number between 1000 to 9999 (default 7893): " PORT
until
[[ ! $PORT ]] || [[ $PORT -ge 1000 && $PORT -le 9999 ]]
do
  echo "port value error: $PORT"
  read -p "please input number between 1000 to 9999 (default 7893): " PORT
done
if [ ! $PORT ]; then
  PORT='7893'
  echo "select default public port: $PORT"
else
  echo "gfirewalls public port: $PORT"
fi

echo "select a gfirewalls admin port (whitelist required, all features)"
read -p "please input number between 1000 to 9999 (default 7894): " ADMIN_PORT
until
[[ ! $ADMIN_PORT ]] || [[ $ADMIN_PORT -ge 1000 && $ADMIN_PORT -le 9999 ]]
do
  echo "port value error: $ADMIN_PORT"
  read -p "please input number between 1000 to 9999 (default 7894): " ADMIN_PORT
done
if [ ! $ADMIN_PORT ]; then
  ADMIN_PORT='7894'
  echo "select default admin port: $ADMIN_PORT"
else
  echo "gfirewalls admin port: $ADMIN_PORT"
fi

# gfirewalls dir
DIR_NAME=/root/.gfirewalls
if [ ! -d $DIR_NAME ]; then
  mkdir $DIR_NAME
else
  echo "gfirewalls dir exist"
fi
echo "the gfirewalls dir is $DIR_NAME"

NOW=$(date +'%Y%m%d_%H-%M-%S')

# backup user.rules
cp /etc/ufw/user.rules $DIR_NAME/user.rules.$NOW.backup
cp /etc/ufw/user6.rules $DIR_NAME/user6.rules.$NOW.backup

NAME=gfirewalls
SERVICE_NAME=$NAME.service

# stop running service
systemctl stop $SERVICE_NAME 2>/dev/null

# copy compiled dist to gfirewalls dir
cp -r ./dist $DIR_NAME/

START_COMMAND="$NODE_BIN $DIR_NAME/dist/index.js --port=$PORT --admin-port=$ADMIN_PORT"

SER_STR="[Unit]
Description=$NAME Server Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DIR_NAME
RuntimeMaxSec=86400
Restart=on-failure
RestartSec=5s
ExecStart=$START_COMMAND

[Install]
WantedBy=multi-user.target"

printf '%s\n' "$SER_STR" > /etc/systemd/system/$SERVICE_NAME

systemctl daemon-reload
systemctl start $SERVICE_NAME
systemctl enable $SERVICE_NAME
systemctl status $SERVICE_NAME

# 重置所有规则，仅加入与 /clear 一致的白名单
echo 'resetting ufw rules...'
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# 公开端口对所有人开放（仅 add_this_ip）
# admin port 在 1:39000 范围内，通过白名单规则自动覆盖，无需单独开放
ufw allow $PORT/tcp
ufw allow $PORT/udp

# 局域网放行
echo 'allowing LAN subnets...'
for SUBNET in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16; do
  ufw allow from $SUBNET to any port 1:39000 proto tcp
  ufw allow from $SUBNET to any port 1:39000 proto udp
done

# 服务器自身公网 IP 放行
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me)
if [[ $PUBLIC_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "allowing server public IP: $PUBLIC_IP"
  ufw allow from $PUBLIC_IP to any port 1:39000 proto tcp
  ufw allow from $PUBLIC_IP to any port 1:39000 proto udp
else
  echo "could not detect public IP, skipping"
fi

ufw --force enable
ufw reload
ufw status verbose

echo ""
echo "public port  (open to all): http://[YOUR_LINUX_MACHINE_ADDRESSES]:$PORT/add_this_ip"
echo "admin port (whitelist only): http://[YOUR_LINUX_MACHINE_ADDRESSES]:$ADMIN_PORT/"
