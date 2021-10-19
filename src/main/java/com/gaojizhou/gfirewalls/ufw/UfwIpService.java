package com.gaojizhou.gfirewalls.ufw;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;

/**
 * @author kao
 */
@Service
public class UfwIpService {

    @Value("${server.port}")
    private String port;

    public List<String> hasIp() {
        // todo ip list
        String ListString = runCmd("status");
        return null;
    }

    public String setIp(String ip) {
        if (ip == null || ip.length() == 0) {
            return "sorry, gfirewalls cannot recognize your ip</br>" +
            "you can manual add your ip like this: </br>" +
            "<a href='/add_other_ip?ip=' target='view_window'>add_other_ip?ip={your ip}</a></br>";
        }
        String result = runCmd(Arrays.asList("ufw", "allow", "from",
                ip, "to", "any", "port", "1:39000", "proto",
                "tcp"));
        if (result.contains("已经存在")) {
            return result + " your ip is " + ip;
        }
        runCmd(Arrays.asList("ufw", "allow", "from",
                ip, "to", "any", "port", "1:39000", "proto",
                "udp"));
        String reload = runCmd(Arrays.asList("ufw", "reload"));
        return reload + " your ip is " + ip;
    }

    public String runCmd(String cmd) {
        return runCmd(Collections.singletonList(cmd));
    }

    public String runCmd(List<String> cmdAfterBase) {
        // command list
        String[] cmd = Stream.of(cmdAfterBase).flatMap(Collection::stream).distinct().toArray(String[]::new);
        System.out.println("running command: " +  String.join(" ", cmd));
        try {
            Process ps = Runtime.getRuntime().exec(cmd);
            ps.waitFor();

            BufferedReader bufrIn = new BufferedReader(new InputStreamReader(ps.getInputStream(), StandardCharsets.UTF_8));
            BufferedReader bufrError = new BufferedReader(new InputStreamReader(ps.getErrorStream(), StandardCharsets.UTF_8));

            // read output result is from shell
            StringBuilder result = new StringBuilder();
            String line = null;
            while ((line = bufrIn.readLine()) != null || (line = bufrError.readLine()) != null) {
                result.append(line).append('\n');
            }

            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "run cmd error";
    }


    final String BASE_USER_RULES = "*filter\n" +
            ":ufw-user-input - [0:0]\n" +
            ":ufw-user-output - [0:0]\n" +
            ":ufw-user-forward - [0:0]\n" +
            ":ufw-before-logging-input - [0:0]\n" +
            ":ufw-before-logging-output - [0:0]\n" +
            ":ufw-before-logging-forward - [0:0]\n" +
            ":ufw-user-logging-input - [0:0]\n" +
            ":ufw-user-logging-output - [0:0]\n" +
            ":ufw-user-logging-forward - [0:0]\n" +
            ":ufw-after-logging-input - [0:0]\n" +
            ":ufw-after-logging-output - [0:0]\n" +
            ":ufw-after-logging-forward - [0:0]\n" +
            ":ufw-logging-deny - [0:0]\n" +
            ":ufw-logging-allow - [0:0]\n" +
            ":ufw-user-limit - [0:0]\n" +
            ":ufw-user-limit-accept - [0:0]\n" +
            "### RULES ###\n" +
            "\n" +
            "### tuple ### allow any " + port + " 0.0.0.0/0 any 0.0.0.0/0 in\n" +
            "-A ufw-user-input -p tcp --dport " + port + "  -j ACCEPT\n" +
            "-A ufw-user-input -p udp --dport " + port + "  -j ACCEPT\n" +
            "\n" +
            "### END RULES ###\n" +
            "\n" +
            "### LOGGING ###\n" +
            "-A ufw-after-logging-input -j LOG --log-prefix \"[UFW BLOCK] \" -m limit --limit 3/min --limit-burst 10\n" +
            "-I ufw-logging-deny -m conntrack --ctstate INVALID -j RETURN -m limit --limit 3/min --limit-burst 10\n" +
            "-A ufw-logging-deny -j LOG --log-prefix \"[UFW BLOCK] \" -m limit --limit 3/min --limit-burst 10\n" +
            "-A ufw-logging-allow -j LOG --log-prefix \"[UFW ALLOW] \" -m limit --limit 3/min --limit-burst 10\n" +
            "### END LOGGING ###\n" +
            "\n" +
            "### RATE LIMITING ###\n" +
            "-A ufw-user-limit -m limit --limit 3/minute -j LOG --log-prefix \"[UFW LIMIT BLOCK] \"\n" +
            "-A ufw-user-limit -j REJECT\n" +
            "-A ufw-user-limit-accept -j ACCEPT\n" +
            "### END RATE LIMITING ###\n" +
            "COMMIT";

    public String clear() {
        runCmd(Arrays.asList("echo", BASE_USER_RULES, ">", "/etc/ufw/user.rules"));
        return runCmd(Arrays.asList("ufw", "reload"));
    }
}
