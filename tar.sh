#!/bin/bash

rm -rf ./target &&  mvn clean package -Dmaven.test.skip=true
mkdir ./gfirewalls
cp ./README.md ./gfirewalls
cp ./run.sh ./gfirewalls
cp ./target/gfirewalls.jar ./gfirewalls
tar -cvf ./target/gfirewalls.tar ./gfirewalls
rm -r ./gfirewalls