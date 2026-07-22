"use client";

import { FormEvent, useState } from "react";
import { shortWallet } from "@/lib/format";

type Props = {
  wallet: string;
  busy: boolean;
  error: string;
  onRegister: (name: string) => Promise<void>;
  onLogout: () => Promise<void>;
};

export default function NameBindingForm({ wallet, busy, error, onRegister, onLogout }: Props) {
  const [name, setName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRegister(name);
  }

  return (
    <form className="submissionForm" onSubmit={submit}>
      <div>
        <span className="label">지갑</span>
        <strong>{shortWallet(wallet)}</strong>
      </div>
      <p className="warning">
        이 지갑이 평소에 쓰는 지갑이라면 로그아웃하고 개발용 지갑으로 다시 가입해 주세요.
      </p>
      <label>
        이름
        <input
          placeholder="홍길동"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <p className="formGuide">
        이름은 이 지갑에 한 번만 등록하며, 이후에는 입력할 필요가 없습니다.
      </p>
      <button
        className="primaryButton wide"
        disabled={name.trim().length < 2 || busy}
        type="submit"
      >
        이름 등록
      </button>
      <button
        className="ghostButton wide"
        disabled={busy}
        type="button"
        onClick={onLogout}
      >
        로그아웃하고 다른 지갑으로
      </button>
      {error && <p className="status">{error}</p>}
    </form>
  );
}
