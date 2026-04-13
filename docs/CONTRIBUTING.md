# 🤝 Contributing Guide

## 브랜치 구조

```
main         ← 배포용 (직접 push 금지)
  └── develop    ← 통합 브랜치 (PR로만 merge)
        ├── auth         ← 인증/회원 담당
        ├── problem      ← 문제 관리 담당
        └── visualizer   ← 시각화 담당
```

---

## 처음 환경 설정 (최초 1회)

```bash
# 원격 저장소 clone
git clone <repo-url>
cd codeflow

# develop 브랜치 가져오기
git fetch origin
git checkout -b develop origin/develop

# 자기 브랜치 생성 (develop 기준)
git checkout -b auth   # 예시: auth 담당자
git push origin auth
```

---

## 매일 작업 시작 전 (최신화)

```bash
# 1. develop 최신화
git checkout develop
git pull origin develop

# 2. 내 브랜치로 돌아와서 develop 반영
git checkout auth        # 본인 브랜치로
git merge develop        # develop 내용 가져오기

# 3. 이제 작업 시작!
```

> 충돌(Conflict)이 발생하면 충돌 파일을 수정 후 `git add .` → `git commit`

---

## 작업 완료 후 PR 올리기

```bash
# 1. 작업 내용 commit
git add .
git commit -m "feat: 로그인 기능 구현"

# 2. 원격 브랜치에 push
git push origin auth

# 3. GitHub에서 PR 생성
#    auth → develop 으로 Pull Request
#    팀원 리뷰 후 merge
```

---

## 커밋 메시지 규칙

| 태그       | 설명               |
| ---------- | ------------------ |
| `feat`     | 새로운 기능        |
| `fix`      | 버그 수정          |
| `style`    | UI/스타일 변경     |
| `refactor` | 코드 리팩토링      |
| `docs`     | 문서 수정          |
| `chore`    | 설정, 빌드 등 기타 |

예시: `feat: JWT 토큰 인증 구현`, `fix: 시각화 렌더링 오류 수정`

---

## 규칙 요약

| 규칙                        | 내용             |
| --------------------------- | ---------------- |
| `main` 직접 push 금지       | 배포 브랜치 보호 |
| 작업 전 develop pull        | 충돌 최소화      |
| PR은 팀원 리뷰 후 merge     | 코드 품질 유지   |
| develop → main은 팀 합의 후 | 배포 안정성 확보 |

## 🔀 PR (Pull Request) 방법

### PR 올리는 순서

```
1. 본인 브랜치에서 작업 완료
2. GitHub에서 PR 생성
3. 리뷰 후 Approve → Merge
```

### PR 제목 형식

```
[타입] 작업 내용
```

```
예시)
[feat] 로그인 API 구현
[fix] 게시글 조회 오류 수정
```

### PR 올리기 전 체크리스트

```
✅ 본인 브랜치에서 작업했는가
✅ develop 최신 내용을 merge 했는가
✅ 빌드 오류가 없는가
✅ API 키 등 민감한 정보가 포함되지 않았는가
```

---

## ⚠️ 주의사항

- `application.properties` 또는 `application-prod.properties`는 **절대 GitHub에 올리지 말 것**
- API 키, DB 비밀번호 등 민감한 정보는 `.gitignore`에 추가
- 충돌(conflict) 발생 시 회의방에 알리기

---

<div align="center">
  <sub>🐝 Codehive Team</sub>
</div>
