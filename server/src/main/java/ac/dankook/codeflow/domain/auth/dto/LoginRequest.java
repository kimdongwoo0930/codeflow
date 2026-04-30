package ac.dankook.codeflow.domain.auth.dto;

public record LoginRequest(
        String email,
        String password
) {}
