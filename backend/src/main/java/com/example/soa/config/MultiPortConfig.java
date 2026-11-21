package com.example.soa.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class MultiPortConfig {

    @Value("${server.additional-ports:8081,8082,8083}")
    private String additionalPorts;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> {
            if (additionalPorts != null && !additionalPorts.isBlank()) {
                String[] ports = additionalPorts.split(",");
                List<Connector> connectors = new ArrayList<>();
                for (String p : ports) {
                    try {
                        int port = Integer.parseInt(p.trim());
                        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
                        connector.setPort(port);
                        connectors.add(connector);
                    } catch (NumberFormatException ignored) {}
                }
                if (!connectors.isEmpty()) {
                    factory.addAdditionalTomcatConnectors(connectors.toArray(new Connector[0]));
                }
            }
        };
    }
}
