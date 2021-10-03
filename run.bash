#!/bin/bash

# run in root
if [ "$(id -u)" != "0" ]; then
   echo "this script must be run as root or sudo permissions" 1>&2
   exit 1
fi

read -p "select gfirewalls potr (1000-9999): " PORT
until
[ $PORT -gt 999 -a $PORT -lt 10000 ]
do
read -p "$PORT value error, please enter number between 1000 to 9999: " PORT
done

# backup user.rules 

# check ufw 

# check java

# run jar
java -jar ./target/gfirewalls.jar --server.port=$PORT