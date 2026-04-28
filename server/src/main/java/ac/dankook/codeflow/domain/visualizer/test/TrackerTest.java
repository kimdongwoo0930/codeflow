package ac.dankook.codeflow.domain.visualizer.test;

import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;

import java.nio.file.Files;
import java.nio.file.Path;

public class TrackerTest {

    /* Docker 실행 후 Test 확인  */

    public static void main(String[] args) throws Exception {
        String sourceCode = Files.readString(
                Path.of("server/src/main/java/ac/dankook/codeflow/domain/visualizer/test/Sample.java")
                        .toAbsolutePath()
        );

        String input = "4\n3 9 1 7";

        DockerTracker tracker = new DockerTracker();
        DockerTracker.TraceResult result = tracker.runAndTrace(sourceCode, input);

        System.out.println("=== 1. 결과 ===");
        System.out.println(result.programOutput());

        System.out.println("\n=== 2. JSON ===");
        System.out.println(result.traceJson());
    }
}
