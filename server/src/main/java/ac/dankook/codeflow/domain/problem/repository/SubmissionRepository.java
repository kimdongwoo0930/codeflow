package ac.dankook.codeflow.domain.problem.repository;

import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ac.dankook.codeflow.domain.problem.entity.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @Query("SELECT DISTINCT s.problemId FROM Submission s WHERE s.userId = :userId AND s.passed = true")
    Set<Long> findSolvedProblemIds(@Param("userId") Long userId);

    @Query("SELECT DISTINCT s.problemId FROM Submission s WHERE s.userId = :userId")
    Set<Long> findAttemptedProblemIds(@Param("userId") Long userId);
}
