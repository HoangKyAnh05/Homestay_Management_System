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
public class RemotionSidecarManager {

    private static final Logger log = LoggerFactory.getLogger(RemotionSidecarManager.class);

    private final boolean autoStart;
    private final String serviceUrl;
    private final String workingDirectory;
    private final String nodeCommand;
    private final HttpClient httpClient;

    private Process sidecarProcess;

    public RemotionSidecarManager(
            @Value("${remotion.sidecar.auto-start:true}") boolean autoStart,
            @Value("${remotion.sidecar.service-url:http://127.0.0.1:3000}") String serviceUrl,
            @Value("${remotion.sidecar.working-directory:../tool_remotion}") String workingDirectory,
            @Value("${remotion.sidecar.node-command:node}") String nodeCommand
    ) {
        this.autoStart = autoStart;
        this.serviceUrl = serviceUrl;
        this.workingDirectory = workingDirectory;
        this.nodeCommand = nodeCommand;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startSidecarIfNeeded() {
        if (!autoStart) {
            log.info("Remotion Video Studio sidecar auto-start is disabled.");
            return;
        }
        if (isSidecarHealthy()) {
            log.info("Remotion Video Studio server is already running at {}.", serviceUrl);
            return;
        }

        try {
            File sidecarDirectory = resolveSidecarDirectory();
            if (sidecarDirectory == null || !sidecarDirectory.exists()) {
                log.warn("Remotion Video Studio directory not found. Please verify tool_remotion folder exists.");
                return;
            }

            File serverFile = new File(sidecarDirectory, "server.mjs");
            if (!serverFile.exists()) {
                log.warn("server.mjs not found in {}. Skipping Remotion Video Studio auto-start.", sidecarDirectory);
                return;
            }

            List<String> command = new ArrayList<>();
            command.add(nodeCommand);
            command.add("server.mjs");

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(sidecarDirectory);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            sidecarProcess = processBuilder.start();

            log.info("Started Remotion Video Studio server at {} from directory {}.", serviceUrl, sidecarDirectory);
        } catch (Exception exception) {
            log.warn("Could not auto-start Remotion Video Studio sidecar. Start it manually via start_remotion_studio.bat if needed.", exception);
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

    private File resolveSidecarDirectory() {
        try {
            File configured = new File(workingDirectory).getCanonicalFile();
            if (configured.exists() && new File(configured, "server.mjs").exists()) {
                return configured;
            }

            File fallbackRoot = new File("tool_remotion").getCanonicalFile();
            if (fallbackRoot.exists() && new File(fallbackRoot, "server.mjs").exists()) {
                return fallbackRoot;
            }

            File fallbackParent = new File("../tool_remotion").getCanonicalFile();
            if (fallbackParent.exists() && new File(fallbackParent, "server.mjs").exists()) {
                return fallbackParent;
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
