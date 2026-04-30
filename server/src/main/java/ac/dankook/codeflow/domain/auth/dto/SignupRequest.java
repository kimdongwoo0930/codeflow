package ac.dankook.codeflow.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
        @Email String email,
        String password,
        @NotBlank String nickname
) {}
