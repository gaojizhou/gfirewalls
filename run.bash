#!/bin/bash

# run in root
if [ "$(id -u)" != "0" ]; then
   echo "this script must be run as root or sudo permissions" 1>&2
   exit 1
fi

# check ufw
if command -v ufw >/dev/null 2>&1; then 
  echo 'run ufw enable'
  ufw enable
else 
  echo 'ufw no exists, maybe you can install ufw like this: sudo apt install ufw'
  exit 1
fi

# check java
if command -v java >/dev/null 2>&1; then 
  echo 'run java -version, gfirewalls need java 11'
  java -version
else 
  echo 'java no exists, please install java 11 for root user'
  exit 1
fi

read -p "select gfirewalls potr (1000-9999): " PORT
until
[ $PORT -gt 999 -a $PORT -lt 10000 ]
do
read -p "$PORT value error, please enter number between 1000 to 9999: " PORT
done

# gfirewalls dir
DIR_NAME=/root/.gfirewalls
if [ ! -d $DIR_NAME  ];then
  mkdir $DIR_NAME
else
  echo gfirewalls dir exist
fi
echo "the gfirewalls dir is $DIR_NAME"

NOW=`date +'%Y%m%d_%H-%M-%S'`

# backup user.rules 
cp /etc/ufw/user.rules $DIR_NAME/user.rules.$NOW.backup
cp /etc/ufw/user6.rules $DIR_NAME/user.user6.$NOW.backup

# run jar
cp ./target/gfirewalls.jar $DIR_NAME

java -jar $DIR_NAME/gfirewalls.jar --server.port=$PORT