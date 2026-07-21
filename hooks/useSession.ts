"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export type SessionInfo = {
  wallet: string;
  name: string | null;
};

export type SessionState = {
  session: SessionInfo | null;
  loading: boolean;
  busy: boolean;
  error: string;
  isConnected: boolean;
  connect: () => void;
  signIn: () => Promise<void>;
  register: (name: string) => Promise<void>;
  logout: () => Promise<void>;
};

export function useSession(): SessionState {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const me = await fetch("/api/me").then((res) => res.json());
    setSession(me.session || null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const connect = useCallback(() => {
    setError("");
    openConnectModal?.();
  }, [openConnectModal]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    setError("");
    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address })
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error);

      const signature = await signMessageAsync({
        account: address,
        message: nonceData.message
      });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, nonce: nonceData.nonce, signature })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error);

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "지갑 로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [address, signMessageAsync, refresh]);

  const register = useCallback(
    async (name: string) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSession((prev) => (prev ? { ...prev, name: data.user.name } : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "이름 등록에 실패했습니다.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await disconnectAsync().catch(() => {});
    setSession(null);
    setError("");
  }, [disconnectAsync]);

  return { session, loading, busy, error, isConnected, connect, signIn, register, logout };
}
