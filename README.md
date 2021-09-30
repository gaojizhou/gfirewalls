# gfirewalls
this a simple and easy to use firewall base on ufw.  

### What can it do
Blocking bots from accessing your public network servers.  
Run in terminal like this:
```shell
$ java -jar ./gfirewalls-0.0.1.jar --server.port=8080
```
### How it work
![how gfirewalls work pic](./introduction/how_gfirewalls_work.jpg)

### What it needs
The linux machine you want to protect  

root permissions or sudo permissions  

ufw  
```shell
$ sudo ufw status

# Status active
```
java11  
```shell
$ sudo java -version

# openjdk version "11.0.10" 2021-01-19
# OpenJDK Runtime Environment AdoptOpenJDK (build 11.0.10+9)
# OpenJDK 64-Bit Server VM AdoptOpenJDK (build 11.0.10+9, mixed mode)
```

## Todo list
1. When run in fist time, backup /etc/ufw/user.rules file 
2. Uninstall and restore /etc/ufw/user.rules file
3. Check the dependent programs  

If you want to add some new code, create a pull request or send me an email: gaojizhou![@](./introduction/@.png)qq.com

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (GPL-3.0).