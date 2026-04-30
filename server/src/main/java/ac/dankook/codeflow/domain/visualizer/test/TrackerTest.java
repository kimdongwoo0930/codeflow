package ac.dankook.codeflow.domain.visualizer.test;

import ac.dankook.codeflow.domain.visualizer.dto.CodeRequest;
import ac.dankook.codeflow.domain.visualizer.dto.TestCaseDto;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.util.List;

public class TrackerTest {

    /* Docker 실행 후 Test 확인  */

    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        CodeRequest request = mapper.readValue(
                Path.of("server/src/main/java/ac/dankook/codeflow/domain/visualizer/test/Sample.json")
                        .toAbsolutePath().toFile(),
                CodeRequest.class
        );

        String sourceCode = request.getCode();
        List<TestCaseDto> testCases = request.getTestCases();
        DockerTracker tracker = new DockerTracker();

        for (int i = 0; i < testCases.size(); i++) {
            String input = testCases.get(i).getInput();

            System.out.println("\n==============================");
            System.out.println(" 테스트 케이스 " + (i + 1));
            System.out.println("==============================");

            DockerTracker.TraceResult result = tracker.runAndTrace(sourceCode, input);

            String output = result.programOutput();
            String expected = testCases.get(i).getExpected();
            boolean correct = output.trim().equals(expected.trim());

            System.out.println("=== 결과 ===");
            System.out.println((correct ? "정답 ! " : "오답 ! ") + output);

            System.out.println("\n=== JSON ===");
            System.out.println(result.traceJson());
        }
    }
}
