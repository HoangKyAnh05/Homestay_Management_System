package com.homestayManagement.homestayManagement.config;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class MarketingAiAgentSidecarManager {

    private static final Logger log = LoggerFactory.getLogger(MarketingAiAgentSidecarManager.class);

    private final boolean autoStart;
    private final boolean enabled;
    private final String serviceUrl;
    private final String workingDirectory;
    private final String nodeCommand;
    private final HttpClient httpClient;

    private Process sidecarProcess;

    public MarketingAiAgentSidecarManager(
            @Value("${marketing.aiagent.sidecar.auto-start:true}") boolean autoStart,
            @Value("${marketing.aiagent.enabled:false}") boolean enabled,
            @Value("${marketing.aiagent.base-url:http://127.0.0.1:8787}") String serviceUrl,
            @Value("${marketing.aiagent.sidecar.working-directory:../aiagent/homestay-marketing-agent}") String workingDirectory,
            @Value("${marketing.aiagent.sidecar.node-command:node}") String nodeCommand
    ) {
        this.autoStart = autoStart;
        this.enabled = enabled;
        this.serviceUrl = serviceUrl;
        this.workingDirectory = workingDirectory;
        this.nodeCommand = nodeCommand;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startSidecarIfNeeded() {
        if (!enabled || !autoStart) {
            log.info("Marketing AI Agent sidecar auto-start is disabled or marketing.aiagent.enabled=false.");
            return;
        }
        if (isSidecarHealthy()) {
            log.info("Marketing AI Agent sidecar is already running at {}.", serviceUrl);
            return;
        }

        try {
            File sidecarDirectory = new File(workingDirectory).getCanonicalFile();
            List<String> command = new ArrayList<>();
            command.add(nodeCommand);
            command.add("server.js");

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(sidecarDirectory);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            sidecarProcess = processBuilder.start();
            log.info("Started Marketing AI Agent sidecar at {} with working directory {}.", serviceUrl, sidecarDirectory);
        } catch (Exception exception) {
            log.warn("Could not auto-start Marketing AI Agent sidecar. Start it manually if marketing automation is needed.", exception);
        }
    }

    @PreDestroy
    public void stopSidecar() {
        if (sidecarProcess == null || !sidecarProcess.isAlive()) {
            return;
        }
        sidecarProcess.destroy();
        try {
            if (!sidecarProcess.waitFor(5, TimeUnit.SECONDS)) {
                sidecarProcess.destroyForcibly();
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            sidecarProcess.destroyForcibly();
        }
    }

    private boolean isSidecarHealthy() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(serviceUrl.replaceAll("/+$", "") + "/health"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception exception) {
            return false;
        }
    }
}
