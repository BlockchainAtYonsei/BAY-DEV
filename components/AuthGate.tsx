"use client";

import WalletLoginPanel from "@/components/auth/WalletLoginPanel";
import NameBindingForm from "@/components/auth/NameBindingForm";
import SessionToolbar from "@/components/auth/SessionToolbar";
import type { SessionState } from "@/hooks/useSession";

type Props = {
  auth: SessionState;
  children: React.ReactNode;
};

/**
 * 인증 단계에 따라 로그인 → 이름 바인딩 → children 순서로 보여준다.
 * 각 단계의 UI는 개별 컴포넌트가 담당하고, 여기서는 분기만 한다.
 */
export default function AuthGate({ auth, children }: Props) {
  const { session, loading, busy, error, isConnected, connect, disconnect, signIn, register, logout } = auth;

  if (loading) {
    // 세션 확인 중 빈 화면 대신 자리표시자를 보여줘 늦게 뜨는 느낌을 줄인다
    return <div className="submissionForm skeleton" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <WalletLoginPanel
        isConnected={isConnected}
        busy={busy}
        error={error}
        onConnect={connect}
        onDisconnect={disconnect}
        onSignIn={signIn}
      />
    );
  }

  if (!session.name) {
    return (
      <NameBindingForm
        wallet={session.wallet}
        busy={busy}
        error={error}
        onRegister={register}
        onLogout={logout}
      />
    );
  }

  return (
    <>
      <SessionToolbar
        wallet={session.wallet}
        name={session.name}
        busy={busy}
        onLogout={logout}
      />
      {children}
    </>
  );
}
