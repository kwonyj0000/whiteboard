# Git Commit & Push Command

현재 작업 디렉토리의 변경사항을 Git에 commit하고 push합니다.

## 실행 규칙

1. **현재 디렉토리만 처리**: 상위 디렉토리 변경사항 무시
2. **자동 commit message 생성**: Git log 스타일 참고하여 의미있는 메시지 작성
3. **Co-authored-by 추가**: `Claude Sonnet 4.5 <noreply@anthropic.com>` 자동 포함
4. **Hook 우회**: 필요시 `--no-verify` 사용
5. **Pull before push**: Remote 변경사항 있으면 merge 후 push

## 실행 순서

### 1. 현재 디렉토리 변경사항 확인

```bash
git status
git diff --stat
```

현재 디렉토리 내부 변경사항만 분석합니다.

### 2. 변경사항 Stage

```bash
git add .
```

현재 디렉토리 전체를 staging area에 추가합니다.

### 3. Commit Message 생성

다음 형식으로 자동 생성:

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Type**: feat, fix, docs, refactor, test, chore 등
**Scope**: 현재 프로젝트명 (예: day04/whiteboard)
**Subject**: 변경 내용 한 줄 요약 (50자 이내)
**Body**: 주요 변경사항 bullet points (선택사항)

최근 commit log를 참고하여 프로젝트 스타일에 맞춥니다.

### 4. Commit 실행

```bash
git commit --no-verify -m "<message>"
```

Hook 실패 시 `--no-verify` 자동 적용합니다.

### 5. Push 실행

```bash
# Remote 변경사항 확인
git fetch

# 필요시 pull (merge 전략)
git pull --no-rebase

# Push
git push
```

Conflict 발생 시 사용자에게 알립니다.

## 예시

### 사용자 입력
```
/git
```

### 실행 흐름
1. 변경파일 확인: `index.html`, `js/main.js`, `css/layout.css` 수정됨
2. Commit message 생성: "feat(whiteboard): add responsive toolbar and touch improvements"
3. Commit 실행: 성공
4. Push 실행: 성공
5. 결과 보고: "✅ Pushed commit `abc1234` to remote"

## 에러 처리

- **변경사항 없음**: "No changes to commit" 메시지 출력
- **Merge conflict**: 충돌 파일 목록과 해결 방법 안내
- **Push 실패**: Remote 상태 확인 후 재시도 안내
- **Hook 실패**: `--no-verify` 사용하여 재시도

## WORKFLOW.md 갱신

Commit & push 성공 시 자동으로 `WORKFLOW.md`에 기록:

```markdown
### Request N: Git Commit & Push

**프롬프트**:
\`\`\`
/git
\`\`\`

**작업 요약**:
- Commit: <hash> - <message>
- 변경파일: <파일목록>
- Push 완료
```

## 주의사항

- 상위 디렉토리(../) 파일은 절대 포함하지 않음
- Sensitive 파일(.env, credentials 등) 자동 제외 확인
- Large files(>50MB) 경고
- Binary files 변경 시 알림
