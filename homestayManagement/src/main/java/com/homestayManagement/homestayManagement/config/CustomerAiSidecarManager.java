package com.homestayManagement.homestayManagement.config;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
public class CustomerAiSidecarManager {

    private static final Logger log = LoggerFactory.getLogger(CustomerAiSidecarManager.class);

    private final boolean autoStart;
    private final String serviceUrl;
    private final String workingDirectory;
    private final String envFile;
    private final String uvCommand;
    private final HttpClient httpClient;

    private Process sidecarProcess;

    public CustomerAiSidecarManager(
            @Value("${ai.customer.sidecar.auto-start:true}") boolean autoStart,
            @Value("${ai.customer.service-url:http://127.0.0.1:8001}") String serviceUrl,
            @Value("${ai.customer.sidecar.working-directory:../openchatbi}") String workingDirectory,
            @Value("${ai.customer.sidecar.env-file:customer_assistant/.env}") String envFile,
            @Value("${ai.customer.sidecar.uv-command:uv}") String uvCommand
    ) {
        this.autoStart = autoStart;
        this.serviceUrl = serviceUrl;
        this.workingDirectory = workingDirectory;
        this.envFile = envFile;
        this.uvCommand = uvCommand;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startSidecarIfNeeded() {
        if (!autoStart) {
            log.info("Customer AI sidecar auto-start is disabled.");
            return;
        }
        if (isSidecarHealthy()) {
            log.info("Customer AI sidecar is already running at {}.", serviceUrl);
            return;
        }

        try {
            URI uri = URI.create(serviceUrl);
            String host = uri.getHost() == null ? "127.0.0.1" : uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 8001;

            List<String> command = new ArrayList<>();
            command.add(uvCommand);
            command.add("run");
            command.add("uvicorn");
            command.add("customer_assistant.app:app");
            command.add("--host");
            command.add(host);
            command.add("--port");
            command.add(String.valueOf(port));
            command.add("--env-file");
            command.add(envFile);

            File sidecarDirectory = new File(workingDirectory).getCanonicalFile();
            Path envPath = sidecarDirectory.toPath().resolve(envFile).normalize();
            Map<String, String> sidecarEnvironment = readEnvFile(envPath);

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(sidecarDirectory);
            processBuilder.environment().putAll(sidecarEnvironment);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            sidecarProcess = processBuilder.start();
            log.info(
                    "Started Customer AI sidecar at {} with working directory {}. Env file: {}. Loaded env keys: {}",
                    serviceUrl,
                    sidecarDirectory,
                    envPath,
                    sidecarEnvironment.keySet()
            );
        } catch (Exception exception) {
            log.warn("Could not auto-start Customer AI sidecar. Start it manually if chat is needed.", exception);
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

    private Map<String, String> readEnvFile(Path path) throws IOException {
        if (!Files.exists(path)) {
            log.warn("Customer AI sidecar env file does not exist: {}", path);
            return Map.of();
        }
        return Files.readAllLines(path).stream()
                .map(String::trim)
                .filter(line -> !line.isBlank() && !line.startsWith("#"))
                .filter(line -> line.contains("="))
                .map(line -> line.split("=", 2))
                .filter(parts -> !parts[0].trim().isBlank())
                .collect(Collectors.toMap(
                        parts -> stripBom(parts[0].trim()),
                        parts -> unquote(parts[1].trim()),
                        (first, second) -> second
                ));
    }

    private String stripBom(String value) {
        if (!value.isEmpty() && value.charAt(0) == '\uFEFF') {
            return value.substring(1);
        }
        return value;
    }

    private String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
