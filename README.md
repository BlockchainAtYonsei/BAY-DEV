# BAY 개발팀 과제 플랫폼

BAY 개발팀의 과제 제출 · 복습 퀴즈(문항별 토론) · 학습자료 열람 플랫폼입니다.
Next.js(App Router) 풀스택 + Prisma(SQLite), 지갑 서명 로그인 기반으로 동작합니다.

## 주요 기능

**학생**
- 지갑 서명 로그인 (RainbowKit/wagmi, 트랜잭션 없음) 후 이름 등록
- 과제 트랙: URL 제출(크립토좀비) 또는 퀴즈 풀이(이더리움 코어)
- 퀴즈: 문항별 제출 → 답이 그 문항 **토론 게시판의 글**이 되고, 지갑 주소로 익명 토론
- 답안 브라우저 자동 임시저장, 답글 웹 푸시 알림(옵트인)
- 학습자료: 마크다운 강의록 + HTML 인터랙티브 자료(전체 화면 iframe)

**관리자** (`/admin`, 비밀번호 로그인)
- 제출 현황 매트릭스, 퀴즈 CRUD·응답/채점 보기, 학습자료 CRUD
- 퀴즈·학습자료는 md/html 파일 업로드 + 실시간 미리보기로 작성

## 프로젝트 구조

```
app/                        # 라우팅 + 데이터 조회 (마크업은 컴포넌트에 위임)
  page.tsx                  # 홈 — 트랙·홈단독 퀴즈 카드
  assignments/[track]/      # 과제 트랙 (submitMode에 따라 URL 폼 / 퀴즈 목록)
  quiz/[slug]/              # 퀴즈 풀이 + 문항별 토론
  lectures/                 # 학습자료 목록 탭
  lecture/[slug]/           # 학습자료 열람 (md 렌더 / html iframe)
    raw/route.ts            # html 형식 원문 서빙 (iframe 소스)
  my/                       # 내 제출 내역
  admin/                    # 관리자: 제출 현황 · quizzes/ · lectures/
  api/
    auth/, me/, register/   # 지갑 로그인(nonce→서명 검증→세션), 이름 등록
    submissions/            # URL 과제 제출
    quizzes/[slug]/         # 퀴즈 조회(정답 제거)·응답 제출(서버 채점)
      comments/             # 문항별 토론 (제출글 upsert, 대댓글, 소프트 삭제)
    push/                   # 웹 푸시 구독 등록/해제, VAPID 공개키
    admin/                  # 관리자 로그인 + 퀴즈/학습자료/제출 관리

components/                 # 화면 조각 — 컴포넌트당 한 가지 책임
  quiz/                     # QuizForm(조율) + QuestionCard/QuizProgress/CommunityPanel/Markdown
  lecture/                  # LectureView(블록 렌더) + LectureList/LectureFrame
  track/                    # 트랙 페이지 내용 (QuizModeContent/UrlModeContent)
  admin/                    # 화면별 오케스트레이터 + quiz/·lecture/ 하위에 테이블·에디터
  auth/                     # 로그인 → 이름 등록 → 세션 표시 (AuthGate가 분기)

hooks/                      # 상태 로직 (useQuizAnswers, useAdminGate, useSession …)

lib/                        # 도메인 로직 — React 없음
  api/guards.ts             # requireWallet/requireRegisteredUser/requireAdmin (라우트 공통 인증)
  client/                   # 브라우저용 유틸 (fetchJson, quizApi, 파일 업로드)
  quiz/                     # 퀴즈 md 파서·채점·검증·임시저장 (순수 함수)
  lecture/                  # 학습자료 md 파서(:::cards 등 블록)·검증
  *Store.ts                 # Prisma 접근 계층 (quiz/lecture/comment/submission/user/push)
  session.ts                # HMAC 서명 쿠키 세션 (지갑/관리자/nonce)
  push.ts                   # web-push 발송 + 만료 구독 정리
  tracks.ts                 # 트랙 정의 (submitMode: url | quiz)

prisma/schema.prisma        # User, Submission, Quiz, QuizResponse, Comment, Lecture, PushSubscription
lectures/, quizzes/         # 콘텐츠 원본 "사본" (실제 서빙 기준은 DB — 아래 참고)
public/sw.js                # 푸시 알림 서비스 워커
```

## 콘텐츠 저장 원칙 (중요)

**퀴즈·학습자료의 원본은 DB입니다.** admin에서 저장하면 즉시 반영되며 재배포가 필요 없습니다.
저장소의 `quizzes/*.md`, `lectures/*.md|html`은 버전 관리용 사본이므로, admin에서 직접
수정했다면 사본과 어긋날 수 있습니다. 기준은 언제나 DB입니다.

### 퀴즈 md 형식

```md
# 퀴즈 제목
인트로 (선택)

## 문항 하나당 ## 하나
- [ ] 오답 보기
- [x] 정답 보기      ← [x] 2개 이상이면 복수 선택
## 보기가 없으면 주관식 문항
```

정답 표시는 학생에게 절대 내려가지 않고, 채점은 서버에서만 합니다(주관식은 채점 제외).

### 학습자료 md 형식

`## 섹션` + `:라벨`, 시각 블록은 `:::cards` `:::flow` `:::steps` `:::compare`
`:::callout` `:::embed`(URL 한 줄) ~ `:::`. HTML 형식이면 원문 전체가 그대로 서빙됩니다.

## 환경 변수 (.env)

```bash
DATABASE_URL="file:../data/bay18.db"
ADMIN_PASSWORD=관리자_비밀번호
SESSION_SECRET=긴_랜덤_문자열          # 바꾸면 전원 로그아웃
ADMIN_WALLETS=0x...,0x...             # 토론 관리자 배지 (선택)
VAPID_PUBLIC_KEY=...                  # 웹 푸시 (npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY=...                 # ⚠️ 잃어버리면 기존 푸시 구독 전체 무효
VAPID_SUBJECT=mailto:연락처
```

## 실행 · 배포

```bash
# 개발
npm install
npx prisma db push        # 스키마 → SQLite 반영 (실행 전 data/bay18.db 백업 권장)
npm run dev

# 배포 (운영 = docker 컨테이너 bay-dev, data/ 디렉토리를 호스트와 공유)
docker compose up -d --build
```

- DB는 `data/bay18.db` 하나이며 컨테이너와 호스트가 공유합니다. 스키마 변경 전
  `cp data/bay18.db data/bay18.db.bak-…`으로 백업하는 습관을 유지하세요.
- 웹 푸시는 HTTPS에서만 동작합니다 (로컬 localhost는 예외적으로 허용).
