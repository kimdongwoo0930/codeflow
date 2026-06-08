package ac.dankook.codeflow.domain.problem.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ac.dankook.codeflow.domain.problem.dto.MyStageProgressDto;
import ac.dankook.codeflow.domain.problem.dto.StageProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.StageSectionDto;
import ac.dankook.codeflow.domain.problem.dto.StageProgressRequestDto;
import ac.dankook.codeflow.domain.problem.service.StageProblemService;
import ac.dankook.codeflow.global.response.CommonResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/stage-problems")
@RequiredArgsConstructor
public class StageProblemController {

    private final StageProblemService stageProblemService;

    /** 단계별 섹션 목록 (토픽별 묶음 + 유저 진행 상태) */
    @GetMapping("/sections")
    public ResponseEntity<CommonResponse<List<StageSectionDto>>> getSections() {
        return ResponseEntity.ok(CommonResponse.success(stageProblemService.getSections()));
    }

    /** 단계별 문제 상세 (유저 lastCode / status 포함) */
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<StageProblemDetailDto>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(CommonResponse.success(stageProblemService.getDetail(id)));
    }

    /** 코드 저장 + 풀이 상태 업데이트 */
    @PostMapping("/{id}/progress")
    public ResponseEntity<CommonResponse<Void>> saveProgress(
            @PathVariable Long id,
            @RequestBody StageProgressRequestDto request) {
        stageProblemService.saveProgress(id, request);
        return ResponseEntity.ok(CommonResponse.success(null));
    }

    /** 마이페이지: 유저가 시도한 단계별 문제 목록 */
    @GetMapping("/my")
    public ResponseEntity<CommonResponse<List<MyStageProgressDto>>> getMyProgress() {
        return ResponseEntity.ok(CommonResponse.success(stageProblemService.getMyProgress()));
    }
}
