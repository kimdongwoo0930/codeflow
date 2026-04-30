package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import ac.dankook.codeflow.domain.problem.dto.MyProblemDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitResponseDto;
import ac.dankook.codeflow.domain.problem.dto.TutorRequestDto;

public interface ProblemService {
    String generateProblem(ProblemRequestDto requestDto);
    String askTutor(TutorRequestDto requestDto);
    SubmitResponseDto submit(SubmitRequestDto requestDto) throws Exception;
    List<MyProblemDto> getMyProblems();
    ProblemDetailDto getProblemDetail(Long id);
}
