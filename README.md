# BAY 18기 개발팀 과제검사 플랫폼

Next.js 풀스택 기반 CryptoZombies 과제 제출 플랫폼입니다.

## 실행

```bash
npm install
npm run dev
```

제출 화면: `http://localhost:3000`

관리자 화면: `http://localhost:3000/admin`

## 환경 변수

`.env.local`을 만들고 아래 값을 설정하세요.

```bash
ADMIN_PASSWORD=원하는_관리자_비밀번호
SESSION_SECRET=긴_랜덤_문자열
```

환경 변수를 설정하지 않으면 개발용 기본 관리자 비밀번호는 `bay18-admin`입니다.

## 데이터 저장

제출 데이터는 `data/submissions.json`에 저장됩니다. 같은 지갑으로 다시 제출하면 기존 제출이 수정됩니다.
