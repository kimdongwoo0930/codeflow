package ac.dankook.codeflow.domain.problem.dto;

import java.util.List;

public record StageSectionDto(
        String topic,
        String description,
        int totalCount,
        int solvedCount,
        List<StageProblemSummaryDto> problems
) {}
