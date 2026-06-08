package ac.dankook.codeflow.domain.problem.dto;

public record MyStageProgressDto(
        Long id,
        String title,
        String topic,
        String difficulty,
        String status,
        String date
) {}
