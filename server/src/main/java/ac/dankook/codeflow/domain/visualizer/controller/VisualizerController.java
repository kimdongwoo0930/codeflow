package ac.dankook.codeflow.domain.visualizer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.visualizer.dto.AnswerCheckResponse;
import ac.dankook.codeflow.domain.visualizer.dto.JdiResponse;
import ac.dankook.codeflow.domain.visualizer.dto.TraceRequest;
import ac.dankook.codeflow.domain.visualizer.dto.TraceResponse;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import ac.dankook.codeflow.global.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "DockerTracker", description = "DockerTracker API")
@RestController
@RequestMapping("/api/dockertracker")
@RequiredArgsConstructor
public class VisualizerController {

    private final DockerTracker dockerTracker;

    @Operation(summary = "코드 실행", description = "요청 바디의 sourceCode를 Docker에서 실행하고 출력과 JDI 트레이스를 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "실행 성공"),
            @ApiResponse(responseCode = "500", description = "실행 오류 (컴파일 실패, Docker 오류 등)")
    })
    @PostMapping("/trace")
    public ResponseEntity<CommonResponse<TraceResponse>> trace(
            @RequestBody @Valid TraceRequest request) throws Exception {
        DockerTracker.TraceResult result = dockerTracker.runAndTrace(request.getSourceCode(), request.getInput());

        TraceResponse response = new TraceResponse(
                new AnswerCheckResponse(result.programOutput()),
                new JdiResponse(result.traceJson())
        );

        return ResponseEntity.ok(CommonResponse.success(response));
    }
}
