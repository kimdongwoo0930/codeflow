package ac.dankook.codeflow.domain.problem.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import ac.dankook.codeflow.global.entity.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_stage_problems",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "stage_problem_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserStageProblem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "stage_problem_id", nullable = false)
    private Long stageProblemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StageProblemStatus status;

    @Column(columnDefinition = "TEXT")
    private String lastCode;

    @Column
    private LocalDateTime solvedAt;

    @Column(nullable = false)
    private int attemptCount;

    public static UserStageProblem of(Long userId, Long stageProblemId, String lastCode) {
        UserStageProblem p = new UserStageProblem();
        p.userId = userId;
        p.stageProblemId = stageProblemId;
        p.status = StageProblemStatus.IN_PROGRESS;
        p.lastCode = lastCode;
        p.attemptCount = 1;
        return p;
    }

    public void updateProgress(String code, boolean solved) {
        this.lastCode = code;
        this.attemptCount++;
        if (solved && this.status != StageProblemStatus.SOLVED) {
            this.status = StageProblemStatus.SOLVED;
            this.solvedAt = LocalDateTime.now();
        }
    }

    public void saveCode(String code) {
        this.lastCode = code;
    }
}
