package ac.dankook.codeflow.domain.problem.service;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.dto.MyProblemDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemRequestDto;
import ac.dankook.codeflow.domain.problem.dto.ProblemResponseDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitRequestDto;
import ac.dankook.codeflow.domain.problem.dto.SubmitResponseDto;
import ac.dankook.codeflow.domain.problem.dto.TutorRequestDto;
import ac.dankook.codeflow.domain.problem.entity.Submission;
import ac.dankook.codeflow.domain.problem.entity.problem;
import ac.dankook.codeflow.domain.problem.repository.ProblemRepository;
import ac.dankook.codeflow.domain.problem.repository.SubmissionRepository;
import ac.dankook.codeflow.domain.visualizer.service.DockerTracker;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProblemServiceImpl implements ProblemService {
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final DockerTracker dockerTracker;

    @Override
    public String generateProblem(ProblemRequestDto requestDto) {
        ProblemResponseDto dto = geminiService.generateProblem(requestDto.studyType(),
                requestDto.topic(), requestDto.difficulty(), requestDto.detail());

        problem entity = problem.of(dto, requestDto.studyType(), requestDto.topic(),
                requestDto.difficulty(), getCurrentUserId());
        problem saved = problemRepository.save(entity);

        try {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", saved.getId());
            response.put("title", dto.title());
            response.put("description", dto.description());
            response.put("inputExample", dto.inputExample());
            response.put("outputExample", dto.outputExample());
            response.put("constraints", dto.constraints());
            response.put("hint", dto.hint());
            response.put("startCode", dto.startCode());
            response.put("answerCode", dto.answerCode());
            response.put("expectedOutput", dto.expectedOutput());
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }
    }

    @Override
    public String askTutor(TutorRequestDto requestDto) {
        return geminiService.askTutor(requestDto.topic(), requestDto.difficulty(),
                requestDto.problem(), requestDto.userCode(), requestDto.question());
    }

    @Override
    public SubmitResponseDto submit(SubmitRequestDto requestDto) throws Exception {
        problem p = problemRepository.findById(requestDto.problemId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_RESPONSE_FAILURE));

        DockerTracker.TraceResult result = dockerTracker.runAndTrace(requestDto.sourceCode());
        String actual = result.programOutput().trim();
        String expected = p.getExpectedOutput() == null ? "" : p.getExpectedOutput().trim();
        boolean passed = actual.equals(expected);

        Long userId = getCurrentUserId();
        if (userId != null) {
            submissionRepository.save(
                    Submission.of(userId, requestDto.problemId(), passed, requestDto.sourceCode()));
        }

        return new SubmitResponseDto(passed, actual, expected, result.traceJson());
    }

    @Override
    public List<MyProblemDto> getMyProblems() {
        Long userId = getCurrentUserId();
        if (userId == null) return List.of();

        List<problem> myProblems = problemRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Set<Long> solvedIds = submissionRepository.findSolvedProblemIds(userId);
        Set<Long> attemptedIds = new HashSet<>(submissionRepository.findAttemptedProblemIds(userId));
        attemptedIds.removeAll(solvedIds);

        return myProblems.stream().map(p -> {
            String status;
            if (solvedIds.contains(p.getId())) status = "solved";
            else if (attemptedIds.contains(p.getId())) status = "inprogress";
            else status = "created";

            String date = p.getCreatedAt() != null
                    ? p.getCreatedAt().toLocalDate().toString()
                    : "";

            return new MyProblemDto(p.getId(), p.getTitle(), p.getTopic(),
                    p.getDifficulty(), status, date);
        }).toList();
    }

    @Override
    public ProblemDetailDto getProblemDetail(Long id) {
        problem p = problemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_RESPONSE_FAILURE));
        return new ProblemDetailDto(p.getId(), p.getTitle(), p.getDescription(),
                p.getStudyType(), p.getTopic(), p.getDifficulty(),
                p.getInputExample(), p.getOutputExample(),
                p.getConstraints(), p.getHint(), p.getStartCode());
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        try {
            return Long.parseLong(auth.getPrincipal().toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
