package ac.dankook.codeflow.domain.problem.dto;

public record MyProblemDto(
        Long id,
        String title,
        String topic,
        String difficulty,
        String status, // "solved" | "inprogress" | "created"
        String date) {
}
