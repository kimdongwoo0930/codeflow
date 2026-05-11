package ac.dankook.codeflow.domain.visualizer;

import ac.dankook.codeflow.domain.visualizer.controller.VisualizerController;
import ac.dankook.codeflow.domain.visualizer.dto.TraceRequest;
import ac.dankook.codeflow.domain.visualizer.dto.TraceResponse;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import ac.dankook.codeflow.global.response.CommonResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class VisualizerControllerTest {

    @Test
    void trace_목데이터_반환() throws Exception {
        // DockerTracker 목 생성
        DockerTracker mockTracker = mock(DockerTracker.class);
        String mockTraceJson = "["
                + "{\"step\":1,\"line\":3,\"method\":\"main\",\"variables\":{\"args\":[]},\"stack\":[\"Main.main:3\"]},"
                + "{\"step\":2,\"line\":4,\"method\":\"main\",\"variables\":{\"args\":[],\"n\":4},\"stack\":[\"Main.main:4\"]},"
                + "{\"step\":3,\"line\":5,\"method\":\"main\",\"variables\":{\"args\":[],\"n\":4,\"arr\":[]},\"stack\":[\"Main.main:5\"]},"
                + "{\"step\":4,\"line\":9,\"method\":\"main\",\"variables\":{\"args\":[],\"n\":4,\"arr\":[3,9,1,7],\"max\":3},\"stack\":[\"Main.main:9\"]}"
                + "]";

        when(mockTracker.runAndTrace(anyString(), anyString()))
                .thenReturn(new DockerTracker.TraceResult("9", mockTraceJson));

        // TraceRequest 생성 (Jackson으로 필드 주입)
        TraceRequest request = new ObjectMapper().readValue(
                "{\"sourceCode\":\"public class Main{}\",\"input\":\"4\\n3 9 1 7\"}",
                TraceRequest.class
        );

        // 컨트롤러 직접 호출
        VisualizerController controller = new VisualizerController(mockTracker);
        ResponseEntity<CommonResponse<TraceResponse>> response = controller.trace(request);

        // 검증
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();

        String programOutput = response.getBody().getData().getAnswerCheck().getProgramOutput();
        String traceJson     = response.getBody().getData().getJdi().getTraceJson();

        System.out.println("=== 결과 (programOutput) ===");
        System.out.println(programOutput);

        System.out.println("\n=== JSON (traceJson) ===");
        System.out.println(traceJson);

        assertThat(programOutput).isEqualTo("9");
        assertThat(traceJson).contains("step");
    }
}
