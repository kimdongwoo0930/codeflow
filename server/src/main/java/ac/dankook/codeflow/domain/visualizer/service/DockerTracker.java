package ac.dankook.codeflow.domain.visualizer.service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DockerTracker {

    private static final Logger log = LoggerFactory.getLogger(DockerTracker.class);

    private static final String DOCKER_IMAGE    = "eclipse-temurin:21-jdk-jammy";
    private static final int    JDWP_PORT       = 5005;
    private static final int    PORT_WAIT_MS    = 15_000;
    private static final int    CONTAINER_TTL_S = 120;

    @Value("${docker.network:}")
    private String dockerNetwork;

    public record TraceResult(String programOutput, String traceJson) {}

    public TraceResult runAndTrace(String sourceCode, String input) throws Exception {
        Path tmpFile = Files.createTempFile("codeflow-trace-", ".java");
        try {
            Files.writeString(tmpFile, sourceCode);
            return runAndTraceFile(tmpFile.toString(), input);
        } finally {
            Files.deleteIfExists(tmpFile);
        }
    }

    private TraceResult runAndTraceFile(String javaFilePath, String input) throws Exception {
        String containerName = "codeflow-" + System.currentTimeMillis();

        log.info("[DockerTracker] 컨테이너 시작: {}", containerName);
        startContainer(containerName);

        try {
            copySourceToContainer(containerName, javaFilePath);
            compileInContainer(containerName);

            if (input != null && !input.isEmpty()) {
                copyInputToContainer(containerName, input);
            }

            log.info("[DockerTracker] 프로그램 실행 (stdout 캡처)");
            String programOutput = captureOutput(containerName, input);

            log.info("[DockerTracker] JDWP 모드로 JVM 기동");
            runWithJdwp(containerName, input);

            String containerIp = getContainerIp(containerName);
            log.info("[DockerTracker] 컨테이너 IP: {}, JDWP 포트 대기 중...", containerIp);
            waitForPort(containerIp, JDWP_PORT, PORT_WAIT_MS);

            log.info("[DockerTracker] ExecutionTracker 시작");
            ExecutionTracker tracker = new ExecutionTracker(containerIp, JDWP_PORT);
            String traceJson = tracker.trace();

            return new TraceResult(programOutput, traceJson);

        } finally {
            log.info("[DockerTracker] 컨테이너 정리: {}", containerName);
            stopAndRemove(containerName);
        }
    }

    /** stdin 입력을 /workspace/input.txt 로 컨테이너에 복사한다. */
    private void copyInputToContainer(String name, String input) throws Exception {
        Path tmp = Files.createTempFile("codeflow-input-", ".txt");
        try {
            Files.writeString(tmp, input);
            Process p = new ProcessBuilder(
                    "docker", "cp", tmp.toString(), name + ":/workspace/input.txt"
            ).redirectErrorStream(true).start();
            p.waitFor();
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    /** 일반 실행 — input이 있으면 stdin으로 주입한다. */
    private String captureOutput(String name, String input) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", "-i", name,
                "java", "-cp", "/workspace", "Sample"
        ).redirectErrorStream(true).start();

        if (input != null && !input.isEmpty()) {
            try (OutputStream os = p.getOutputStream()) {
                os.write(input.getBytes());
            }
        }

        String output = new String(p.getInputStream().readAllBytes());
        p.waitFor();
        return output.trim();
    }

    /** JDWP 모드 실행 — input이 있으면 input.txt 리다이렉트로 주입한다. */
    private void runWithJdwp(String name, String input) throws Exception {
        String jdwpOpts = "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:" + JDWP_PORT;
        String cmd = (input != null && !input.isEmpty())
                ? "java " + jdwpOpts + " -cp /workspace Sample < /workspace/input.txt"
                : "java " + jdwpOpts + " -cp /workspace Sample";

        new ProcessBuilder("docker", "exec", "-d", name, "sh", "-c", cmd).start();
    }

    private void startContainer(String name) throws Exception {
        java.util.List<String> cmd =
                new java.util.ArrayList<>(java.util.Arrays.asList("docker", "run", "-d"));
        if (dockerNetwork != null && !dockerNetwork.isBlank()) {
            cmd.addAll(java.util.Arrays.asList("--network", dockerNetwork));
        }
        cmd.addAll(java.util.Arrays.asList("--name", name, DOCKER_IMAGE, "sleep",
                String.valueOf(CONTAINER_TTL_S)));

        Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컨테이너 기동 실패:\n" + output);
        }
    }

    private String getContainerIp(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "inspect", "-f",
                "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", name
        ).start();
        String ip = new String(p.getInputStream().readAllBytes()).trim();
        p.waitFor();
        if (ip.isEmpty()) {
            throw new RuntimeException("컨테이너 IP를 가져오지 못했습니다: " + name);
        }
        return ip;
    }

    private void copySourceToContainer(String name, String javaFilePath) throws Exception {
        String source = Files.readString(Path.of(javaFilePath));
        String stripped = stripPackageDeclaration(source);

        Path tmp = Files.createTempFile("codeflow-", "-Sample.java");
        try {
            Files.writeString(tmp, stripped);
            exec(name, "mkdir", "-p", "/workspace");

            Process p = new ProcessBuilder(
                    "docker", "cp", tmp.toString(), name + ":/workspace/Sample.java"
            ).redirectErrorStream(true).start();

            String output = new String(p.getInputStream().readAllBytes());
            int exit = p.waitFor();
            if (exit != 0) {
                throw new RuntimeException("파일 복사 실패:\n" + output);
            }
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    private void compileInContainer(String name) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "exec", name,
                "javac", "-g", "-cp", "/workspace", "/workspace/Sample.java"
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컴파일 오류:\n" + output);
        }
    }

    private void stopAndRemove(String name) {
        try {
            new ProcessBuilder("docker", "stop", name).start().waitFor();
            new ProcessBuilder("docker", "rm",   name).start().waitFor();
        } catch (Exception e) {
            log.warn("[DockerTracker] 컨테이너 정리 실패 ({}): {}", name, e.getMessage());
        }
    }

    private void waitForPort(String host, int port, int timeoutMs) throws Exception {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            try (Socket ignored = new Socket(host, port)) {
                log.info("[DockerTracker] JDWP 포트 {}:{} 준비 완료", host, port);
                return;
            } catch (IOException e) {
                //noinspection BusyWait
                Thread.sleep(300);
            }
        }
        throw new RuntimeException("JDWP 포트가 " + timeoutMs + "ms 내에 열리지 않았습니다. host=" + host);
    }

    private void exec(String containerName, String... command) throws Exception {
        String[] full = new String[command.length + 3];
        full[0] = "docker";
        full[1] = "exec";
        full[2] = containerName;
        System.arraycopy(command, 0, full, 3, command.length);
        new ProcessBuilder(full).start().waitFor();
    }

    private String stripPackageDeclaration(String source) {
        return source.replaceAll("(?m)^\\s*package\\s+[\\w.]+;\\s*\\r?\\n?", "");
    }
}
