package ac.dankook.codeflow.domain.problem.dto;

public record SubmitResponseDto(
    boolean passed,
    String programOutput,
    String expectedOutput,
    Object trace
) {}
