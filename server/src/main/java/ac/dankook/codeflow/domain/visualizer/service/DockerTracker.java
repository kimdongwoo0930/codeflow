package ac.dankook.codeflow.domain.visualizer.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.ServerSocket;
import java.nio.file.*;

/**
 * Java 소스 코드를 Docker 컨테이너 안에서 실행하고,
 * JDI(ExecutionTracker)를 통해 실행 흐름을 추적하여 JSON으로 반환한다.
 *
 * 실행 순서:
 *   1. 소스 코드를 임시 파일로 저장
 *   2. Docker 컨테이너 기동 (JDWP 포트 동적 할당)
 *   3. 소스 파일을 컨테이너로 복사 (docker cp) — package 선언 자동 제거
 *   4. javac로 컴파일
 *   5. JDWP suspend=y 옵션으로 JVM 기동
 *   6. JDWP 포트 준비 확인 후 ExecutionTracker 연결
 *   7. 추적 완료 후 컨테이너 정리
 */
@Service
public class DockerTracker {

    private static final Logger log = LoggerFactory.getLogger(DockerTracker.class);

    private static final String DOCKER_IMAGE    = "eclipse-temurin:21-jdk-jammy";
    private static final int    CONTAINER_TTL_S = 120;

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
        int jdwpPort = findFreePort();

        log.info("[DockerTracker] 컨테이너 시작: {} (JDWP 포트: {})", containerName, jdwpPort);
        startContainer(containerName, jdwpPort);

        try {
            log.info("[DockerTracker] 소스 파일 복사: {}", javaFilePath);
            copySourceToContainer(containerName, javaFilePath);

            log.info("[DockerTracker] javac 컴파일");
            compileInContainer(containerName);

            if (input != null && !input.isEmpty()) {
                copyInputToContainer(containerName, input);
            }

            log.info("[DockerTracker] 프로그램 실행 (stdout 캡처)");
            String programOutput = captureOutput(containerName, input);

            log.info("[DockerTracker] JDWP 모드로 JVM 기동");
            runWithJdwp(containerName, jdwpPort, input);

            log.info("[DockerTracker] ExecutionTracker 시작");
            ExecutionTracker tracker = new ExecutionTracker("localhost", jdwpPort);
            String traceJson = tracker.trace();

            return new TraceResult(programOutput, traceJson);

        } finally {
            log.info("[DockerTracker] 컨테이너 정리: {}", containerName);
            stopAndRemove(containerName);
        }
    }

    private int findFreePort() throws IOException {
        try (ServerSocket s = new ServerSocket(0)) {
            return s.getLocalPort();
        }
    }

    /** input을 /workspace/input.txt로 컨테이너에 복사한다. */
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
    private void runWithJdwp(String name, int jdwpPort, String input) throws Exception {
        String jdwpOpts = "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:" + jdwpPort;
        String cmd = (input != null && !input.isEmpty())
                ? "java " + jdwpOpts + " -cp /workspace Sample < /workspace/input.txt"
                : "java " + jdwpOpts + " -cp /workspace Sample";

        new ProcessBuilder("docker", "exec", "-d", name, "sh", "-c", cmd).start();
    }

    private void startContainer(String name, int jdwpPort) throws Exception {
        Process p = new ProcessBuilder(
                "docker", "run", "-d",
                "-p", jdwpPort + ":" + jdwpPort,
                "--name", name,
                DOCKER_IMAGE,
                "sleep", String.valueOf(CONTAINER_TTL_S)
        ).redirectErrorStream(true).start();

        String output = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        if (exit != 0) {
            throw new RuntimeException("컨테이너 기동 실패:\n" + output);
        }
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
                "javac", "-g",
                "-cp", "/workspace",
                "/workspace/Sample.java"
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
