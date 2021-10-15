package com.gaojizhou.gfirewalls.ufw;


import org.apache.logging.log4j.util.Strings;

import javax.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.net.InetAddress;
import java.net.UnknownHostException;

public class IpToolkit {

    private static String UNKNOWN = "unknown";
    private static String regex = "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}";
    private static Pattern pattern = Pattern.compile(regex);

    private static Boolean isIpCheck(String ip) {
        if (Strings.isEmpty(ip) 
            || UNKNOWN.equalsIgnoreCase(ip)
            || "127.0.0.1".equals(ip)
            || "0:0:0:0:0:0:0:1".equals(ip)
            ) {
            return false;
        }
        return true;
    }

    public static String getIpAddr(HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");
        if (isIpCheck(ip)) { return ip; }

        ip = request.getHeader("Proxy-Client-IP");
        if (isIpCheck(ip)) { return ip; }

        ip = request.getHeader("WL-Proxy-Client-IP");
        if (isIpCheck(ip)) { return ip; }

        ip = request.getRemoteAddr();
        if (isIpCheck(ip)) { return ip; }

        InetAddress inet = null;
        try {
            inet = InetAddress.getLocalHost();
        } catch (UnknownHostException e) {
            e.printStackTrace();
        }
        ip = inet.getHostAddress();

        ip = request.getRemoteAddr();
        if (isIpCheck(ip)) { return ip; }

        return null;
    }

    public static Boolean isCorrectIp (String ip) {
        if (Strings.isEmpty(ip)) {
            return Boolean.FALSE;
        }
        Matcher matcher = pattern.matcher(ip);
        return matcher.matches();
    }
}


