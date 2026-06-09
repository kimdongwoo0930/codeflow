package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import ac.dankook.codeflow.domain.problem.dto.MyStageProgressDto;
import ac.dankook.codeflow.domain.problem.dto.StageProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.StageSectionDto;
import ac.dankook.codeflow.domain.problem.dto.StageProgressRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitResponseDto;

public interface StageProblemService {
    List<StageSectionDto> getSections();
    StageProblemDetailDto getDetail(Long id);
    void saveProgress(Long id, StageProgressRequestDto request);
    List<MyStageProgressDto> getMyProgress();
    SubmitResponseDto submit(Long id, String sourceCode) throws Exception;
}
