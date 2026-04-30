package ac.dankook.codeflow.domain.problem.dto;

public record TutorRequestDto(
    String topic,
    String difficulty,
    String problem,
    String userCode,
    String question
) {}
