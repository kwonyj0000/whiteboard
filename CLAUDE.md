# CLAUDE.md

## Workflow Tracking

**MANDATORY**: 모든 작업 후 `WORKFLOW.md`를 업데이트해야 합니다.

작업 완료 시:
1. 사용자 프롬프트를 원본 그대로 기록
2. 수행한 작업을 요약하여 기록
3. `WORKFLOW.md`에 새로운 섹션 추가

## Git Rules

- **항상 merge 사용, rebase 금지**
- **Branch나 worktree 생성 금지** - 현재 working set에서 직접 작업
- 작업 완료 후 **즉시 commit & push**

## Working Directory Rules

- **현재 폴더(`Whiteboard/`) 내부 파일만 접근**
- **상위 디렉토리 탐색 및 수정 금지**
- **상위 디렉토리 상태 확인 금지** - Git 작업 시 상위 폴더 변경사항 무시
- 작업 범위를 현재 프로젝트로 제한

## Git Commit Rules

- **현재 프로젝트만 commit** - `git add .` 사용하여 현재 디렉토리만 추가
- 상위 디렉토리의 변경사항은 확인하거나 commit하지 않음
- Hook 실패 시 `--no-verify` 사용 가능 (현재 프로젝트 작업만 해당)

## Project Context

<!-- SPECKIT START -->
Read specs/001-collaborative-whiteboard/plan.md for technical context, project structure, and implementation strategy. Key decisions: vanilla HTML/CSS/JS (no frameworks), HTML5 Canvas for drawing, localStorage persistence (P1/P2), WebSocket collaboration (P3). See also: data-model.md, contracts/, quickstart.md for validation.
<!-- SPECKIT END -->
