package ac.dankook.codeflow.domain.problem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ac.dankook.codeflow.global.entity.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "submissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Submission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long problemId;

    private boolean passed;

    @Column(columnDefinition = "TEXT")
    private String code;

    public static Submission of(Long userId, Long problemId, boolean passed, String code) {
        Submission s = new Submission();
        s.userId = userId;
        s.problemId = problemId;
        s.passed = passed;
        s.code = code;
        return s;
    }
}
