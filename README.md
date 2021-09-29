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

# version "11.0.10"
```
## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (GPL-3.0).
