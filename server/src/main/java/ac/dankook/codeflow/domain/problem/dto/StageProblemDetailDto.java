package ac.dankook.codeflow.domain.problem.dto;

import java.util.List;

public record StageProblemDetailDto(
        Long id,
        String topic,
        String title,
        String difficulty,
        String description,
        List<String> constraints,
        String inputExample,
        String outputExample,
        String starterCode,
        String lastCode,
        String status
) {}
