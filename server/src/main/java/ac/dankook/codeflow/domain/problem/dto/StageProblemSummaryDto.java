package ac.dankook.codeflow.domain.problem.dto;

public record StageProblemSummaryDto(
        Long id,
        String title,
        String topic,
        String difficulty,
        String description,
        String status
) {}
