package com.gaojizhou.gfirewalls;

import com.gaojizhou.gfirewalls.ufw.UfwIpService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

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
				"<a href='/add_this_ip' target='view_window'>/clear</a></br>" +
				"/add_ip?ip={your ip}</br>";
	}

	@GetMapping("/add_this_ip")
	public String setThisIp(String ip) {
		return ufwIpService.setIp(ip);
	}

	@GetMapping("clean")
	public String clean() {
		return ufwIpService.clean();
	}

}
