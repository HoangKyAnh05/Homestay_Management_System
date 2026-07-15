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
public class MarketingAiToEarnLocalSidecarManager {

    private static final Logger log = LoggerFactory.getLogger(MarketingAiToEarnLocalSidecarManager.class);

    private final boolean aiAgentEnabled;
    private final boolean autoStart;
    private final String serviceHealthUrl;
    private final String workingDirectory;
    private final String packageManagerCommand;
    private final String serveScript;
    private final HttpClient httpClient;

    private Process serverProcess;

    public MarketingAiToEarnLocalSidecarManager(
            @Value("${marketing.aiagent.enabled:false}") boolean aiAgentEnabled,
            @Value("${marketing.aitoearn.local.auto-start:true}") boolean autoStart,
            @Value("${marketing.aitoearn.local.health-url:http://127.0.0.1:7001/api/v2/channels/accounts}") String serviceHealthUrl,
            @Value("${marketing.aitoearn.local.working-directory:../aiagent/AiToEarn/project/aitoearn-backend}") String workingDirectory,
            @Value("${marketing.aitoearn.local.package-manager-command:}") String packageManagerCommand,
            @Value("${marketing.aitoearn.local.serve-script:server:serve}") String serveScript
    ) {
        this.aiAgentEnabled = aiAgentEnabled;
        this.autoStart = autoStart;
        this.serviceHealthUrl = serviceHealthUrl;
        this.workingDirectory = workingDirectory;
        this.packageManagerCommand = packageManagerCommand;
        this.serveScript = serveScript;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startAiToEarnLocalIfNeeded() {
        if (!aiAgentEnabled || !autoStart) {
            log.info("Local AiToEarn source auto-start is disabled or marketing.aiagent.enabled=false.");
            return;
        }
        if (isServiceReachable()) {
            log.info("Local AiToEarn source server is already reachable at {}.", serviceHealthUrl);
            return;
        }

        try {
            File directory = new File(workingDirectory).getCanonicalFile();
            if (!directory.exists()) {
                log.warn("Local AiToEarn source directory does not exist: {}.", directory);
                return;
            }

            List<String> command = new ArrayList<>();
            command.add(resolvePackageManagerCommand());
            command.add("run");
            command.add(serveScript);

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(directory);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            serverProcess = processBuilder.start();
            log.info("Started local AiToEarn source server with command '{}' in {}.", String.join(" ", command), directory);
        } catch (Exception exception) {
            log.warn("Could not auto-start local AiToEarn source server. Start it manually from aiagent/AiToEarn/project/aitoearn-backend if social publishing is needed.", exception);
        }
    }

    @PreDestroy
    public void stopAiToEarnLocal() {
        if (serverProcess == null || !serverProcess.isAlive()) {
            return;
        }
        serverProcess.destroy();
        try {
            if (!serverProcess.waitFor(5, TimeUnit.SECONDS)) {
                serverProcess.destroyForcibly();
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            serverProcess.destroyForcibly();
        }
    }

    private boolean isServiceReachable() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(serviceHealthUrl))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() < 500;
        } catch (Exception exception) {
            return false;
        }
    }

    private String resolvePackageManagerCommand() {
        if (packageManagerCommand != null && !packageManagerCommand.isBlank()) {
            return packageManagerCommand;
        }
        String os = System.getProperty("os.name", "").toLowerCase();
        return os.contains("win") ? "pnpm.cmd" : "pnpm";
    }
}
