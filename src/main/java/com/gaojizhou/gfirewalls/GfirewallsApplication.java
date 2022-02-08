package com.gaojizhou.gfirewalls;

import com.gaojizhou.gfirewalls.ufw.IpToolkit;
import com.gaojizhou.gfirewalls.ufw.UfwIpService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

/**
 * @author gaojizhou
 */
@SpringBootApplication
@RestController
public class GfirewallsApplication {

    @Resource
    UfwIpService ufwIpService;

    public static void main(String[] args) {
        SpringApplication.run(GfirewallsApplication.class, args);
    }

    @GetMapping("/")
    String index() {
        return "This is a simple and easy to use firewall</br>" +
                "You can use like this:</br>" +
                "<a href='/add_this_ip' target='view_window'>/add_this_ip</a></br>" +
                "<a href='/clear' target='view_window'>/clear</a></br>" +
                "<a href='/add_other_ip?ip=' target='view_window'>add_other_ip?ip={your ip}</a></br>";
    }

    @GetMapping("/add_this_ip")
    public String addThisIp(HttpServletRequest request) {
        String ip = IpToolkit.getIpAddr(request);
        return ufwIpService.setIp(ip);
    }

    @GetMapping("/add_other_ip")
    public String addOtherIp(String ip) {
        if (!IpToolkit.isCorrectIp(ip)) {
            return "ip is not correct: " + ip;
        }
        return ufwIpService.setIp(ip);
    }

    @GetMapping("/clear")
    public String clear(HttpServletRequest request) {
        String ip = IpToolkit.getIpAddr(request);
        ufwIpService.clear();
        return ufwIpService.setIp(ip);
    }

    @GetMapping("/init_config")
    public String initConfig() {
        return "click /clear to blocking all ip: <a href='/clear' target='view_window'>/clear</a></br>" +
               "ssh or other server maybe disconnecting sessions</br>" +
               "click /add_this_ip add your ip to whitelist: <a href='/add_this_ip' target='view_window'>/add_this_ip</a></br>";
    }
}
