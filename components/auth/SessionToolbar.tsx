"use client";

import { shortWallet } from "@/lib/format";

type Props = {
  wallet: string;
  name: string;
  busy: boolean;
  onLogout: () => Promise<void>;
};

export default function SessionToolbar({ wallet, name, busy, onLogout }: Props) {
  return (
    <section className="toolbar">
      <div>
        <span className="label">{shortWallet(wallet)}</span>
        <strong>{name}</strong>
      </div>
      <button className="ghostButton" disabled={busy} onClick={onLogout} type="button">
        로그아웃
      </button>
    </section>
  );
}
