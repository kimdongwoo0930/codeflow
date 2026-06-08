package ac.dankook.codeflow.domain.problem.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ac.dankook.codeflow.domain.problem.entity.StageProblemStatus;
import ac.dankook.codeflow.domain.problem.entity.UserStageProblem;

public interface UserStageProblemRepository extends JpaRepository<UserStageProblem, Long> {
    Optional<UserStageProblem> findByUserIdAndStageProblemId(Long userId, Long stageProblemId);
    List<UserStageProblem> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<UserStageProblem> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, StageProblemStatus status);
}
