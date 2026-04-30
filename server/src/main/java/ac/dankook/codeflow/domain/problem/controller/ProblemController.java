package ac.dankook.codeflow.domain.problem.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.problem.dto.MyProblemDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitResponseDto;
import ac.dankook.codeflow.domain.problem.dto.TutorRequestDto;
import ac.dankook.codeflow.domain.problem.service.ProblemService;
import ac.dankook.codeflow.global.response.CommonResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemController {
    private final ProblemService problemService;

    @PostMapping("/generate")
    public String generate(@RequestBody ProblemRequestDto requestDto) {
        return problemService.generateProblem(requestDto);
    }

    @PostMapping("/hint")
    public String hint(@RequestBody TutorRequestDto requestDto) {
        return problemService.askTutor(requestDto);
    }

    @PostMapping("/submit")
    public ResponseEntity<CommonResponse<SubmitResponseDto>> submit(
            @RequestBody SubmitRequestDto requestDto) throws Exception {
        return ResponseEntity.ok(CommonResponse.success(problemService.submit(requestDto)));
    }

    @GetMapping("/my")
    public ResponseEntity<CommonResponse<List<MyProblemDto>>> getMyProblems() {
        return ResponseEntity.ok(CommonResponse.success(problemService.getMyProblems()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ProblemDetailDto>> getProblem(@PathVariable Long id) {
        return ResponseEntity.ok(CommonResponse.success(problemService.getProblemDetail(id)));
    }
}
