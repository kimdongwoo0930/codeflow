package ac.dankook.codeflow.domain.problem.dto;

public record StageProgressRequestDto(
        String code,
        boolean solved
) {}
