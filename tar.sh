#!/bin/bash

rm -rf ./target &&  mvn clean package -Dmaven.test.skip=true
mkdir ./target/gfirewalls
cp ./README.md ./target/gfirewalls
cp ./run.bash ./target/gfirewalls
cp ./target/gfirewalls.jar ./target/gfirewalls
tar -cvf ./target/gfirewalls.tar ./target/gfirewalls
