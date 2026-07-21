"use client";

type Props = {
  isConnected: boolean;
  busy: boolean;
  error: string;
  onConnect: () => void;
  onSignIn: () => Promise<void>;
};

export default function WalletLoginPanel({ isConnected, busy, error, onConnect, onSignIn }: Props) {
  return (
    <section className="submissionForm">
      <p className="formGuide">지갑으로 로그인한 뒤 과제를 제출할 수 있습니다.</p>
      <p className="warning">
        자산이 들어 있는 주 지갑은 연결하지 말고, 개발용 지갑으로 가입해 주세요.
      </p>
      {isConnected ? (
        <button className="primaryButton wide" disabled={busy} onClick={onSignIn} type="button">
          서명으로 로그인
        </button>
      ) : (
        <button className="primaryButton wide" disabled={busy} onClick={onConnect} type="button">
          지갑 연결
        </button>
      )}
      {error && <p className="status">{error}</p>}
      <p className="formGuide">
        지갑이 없으세요?{" "}
        <a
          href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=ko"
          target="_blank"
          rel="noreferrer"
        >
          크롬 웹스토어에서 MetaMask 설치하기
        </a>
      </p>
    </section>
  );
}
