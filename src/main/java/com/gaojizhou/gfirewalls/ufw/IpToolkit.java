package com.gaojizhou.gfirewalls.ufw;


import org.apache.logging.log4j.util.Strings;

import javax.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class IpToolkit {

    private static String UNKNOWN = "unknown";
    private static String regex = "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}";
    private static Pattern pattern = Pattern.compile(regex);

    public static String getIpAddr(HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");
        if (Strings.isEmpty(ip) || UNKNOWN.equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (Strings.isEmpty(ip) || UNKNOWN.equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        return ip;
    }

    public static Boolean isCorrectIp (String ip) {
        if (Strings.isEmpty(ip)) {
            return Boolean.FALSE;
        }
        Matcher matcher = pattern.matcher(ip);
        return matcher.matches();
    }
}


