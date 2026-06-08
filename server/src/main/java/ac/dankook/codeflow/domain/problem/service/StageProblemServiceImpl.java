package ac.dankook.codeflow.domain.problem.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ac.dankook.codeflow.domain.problem.dto.MyStageProgressDto;
import ac.dankook.codeflow.domain.problem.dto.StageProblemDetailDto;
import ac.dankook.codeflow.domain.problem.dto.StageProblemSummaryDto;
import ac.dankook.codeflow.domain.problem.dto.StageSectionDto;
import ac.dankook.codeflow.domain.problem.dto.StageProgressRequestDto;
import ac.dankook.codeflow.domain.problem.entity.StageProblem;
import ac.dankook.codeflow.domain.problem.entity.UserStageProblem;
import ac.dankook.codeflow.domain.problem.repository.StageProblemRepository;
import ac.dankook.codeflow.domain.problem.repository.UserStageProblemRepository;
import ac.dankook.codeflow.global.config.StageDataSeeder;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StageProblemServiceImpl implements StageProblemService {

    private final StageProblemRepository stageProblemRepository;
    private final UserStageProblemRepository userStageProblemRepository;

    @Override
    public List<StageSectionDto> getSections() {
        List<StageProblem> all = stageProblemRepository.findAllByOrderByOrderIndexAsc();
        Long userId = getCurrentUserId();

        Map<Long, String> progressMap = new java.util.HashMap<>();
        if (userId != null) {
            userStageProblemRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                    .forEach(u -> progressMap.put(u.getStageProblemId(), u.getStatus().name()));
        }

        Map<String, List<StageProblemSummaryDto>> byTopic = new LinkedHashMap<>();
        for (StageProblem p : all) {
            String status = progressMap.get(p.getId());
            byTopic.computeIfAbsent(p.getTopic(), k -> new ArrayList<>())
                    .add(new StageProblemSummaryDto(p.getId(), p.getTitle(), p.getTopic(),
                            p.getDifficulty(), p.getDescription(), status));
        }

        Map<String, String> topicDesc = StageDataSeeder.getTopicDescription();
        return byTopic.entrySet().stream().map(e -> {
            List<StageProblemSummaryDto> problems = e.getValue();
            long solved = problems.stream().filter(p -> "SOLVED".equals(p.status())).count();
            return new StageSectionDto(e.getKey(), topicDesc.getOrDefault(e.getKey(), ""),
                    problems.size(), (int) solved, problems);
        }).toList();
    }

    @Override
    public StageProblemDetailDto getDetail(Long id) {
        StageProblem p = stageProblemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAGE_PROBLEM_NOT_FOUND));

        Long userId = getCurrentUserId();
        String lastCode = null;
        String status = null;
        if (userId != null) {
            Optional<UserStageProblem> progress =
                    userStageProblemRepository.findByUserIdAndStageProblemId(userId, id);
            if (progress.isPresent()) {
                lastCode = progress.get().getLastCode();
                status = progress.get().getStatus().name();
            }
        }

        return new StageProblemDetailDto(p.getId(), p.getTopic(), p.getTitle(), p.getDifficulty(),
                p.getDescription(), p.getConstraints(), p.getInputExample(), p.getOutputExample(),
                p.getStarterCode(), lastCode, status);
    }

    @Override
    @Transactional
    public void saveProgress(Long id, StageProgressRequestDto request) {
        Long userId = getCurrentUserId();
        if (userId == null) return;

        stageProblemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAGE_PROBLEM_NOT_FOUND));

        UserStageProblem progress = userStageProblemRepository
                .findByUserIdAndStageProblemId(userId, id)
                .map(existing -> {
                    existing.updateProgress(request.code(), request.solved());
                    return existing;
                })
                .orElseGet(() -> UserStageProblem.of(userId, id, request.code()));

        userStageProblemRepository.save(progress);
    }

    @Override
    public List<MyStageProgressDto> getMyProgress() {
        Long userId = getCurrentUserId();
        if (userId == null) return List.of();

        List<UserStageProblem> progresses =
                userStageProblemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        if (progresses.isEmpty()) return List.of();

        Set<Long> problemIds = progresses.stream()
                .map(UserStageProblem::getStageProblemId).collect(Collectors.toSet());
        Map<Long, StageProblem> problemMap = stageProblemRepository.findAllById(problemIds)
                .stream().collect(Collectors.toMap(StageProblem::getId, p -> p));

        return progresses.stream().map(u -> {
            StageProblem p = problemMap.get(u.getStageProblemId());
            if (p == null) return null;
            String date = u.getUpdatedAt() != null
                    ? u.getUpdatedAt().toLocalDate().toString() : "";
            return new MyStageProgressDto(p.getId(), p.getTitle(), p.getTopic(),
                    p.getDifficulty(), u.getStatus().name(), date);
        }).filter(d -> d != null).toList();
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
