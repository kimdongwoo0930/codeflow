package ac.dankook.codeflow.domain.problem.dto;

import java.util.List;

public record ProblemDetailDto(
        Long id,
        String title,
        String description,
        String studyType,
        String topic,
        String difficulty,
        String inputExample,
        String outputExample,
        List<String> constraints,
        String hint,
        String startCode) {
}
