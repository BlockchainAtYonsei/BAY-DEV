"use client";

type Props = {
  isConnected: boolean;
  busy: boolean;
  error: string;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onSignIn: () => Promise<void>;
};

export default function WalletLoginPanel({
  isConnected,
  busy,
  error,
  onConnect,
  onDisconnect,
  onSignIn
}: Props) {
  return (
    <section className="submissionForm">
      <p className="formGuide">지갑으로 로그인한 뒤 과제를 제출할 수 있습니다.</p>
      <p className="warning">
        자산이 들어 있는 주 지갑은 연결하지 말고, 개발용 지갑으로 가입해 주세요.
      </p>
      {isConnected ? (
        <>
          <button className="primaryButton wide" disabled={busy} onClick={onSignIn} type="button">
            서명으로 로그인
          </button>
          <button
            className="ghostButton wide"
            disabled={busy}
            onClick={onDisconnect}
            type="button"
          >
            다른 지갑으로 바꾸기
          </button>
          <p className="formGuide">
            서명하기 전에 계정을 바꾸려면 위 버튼으로 연결을 끊고 다시 연결하세요. 아직 로그인은
            완료되지 않았습니다.
          </p>
        </>
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
