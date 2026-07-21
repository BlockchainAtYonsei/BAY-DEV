"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSuccess: () => void;
};

export default function AdminLoginForm({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "로그인에 실패했습니다.");
      return;
    }
    setPassword("");
    onSuccess();
  }

  return (
    <form className="loginBox" onSubmit={login}>
      <h1>관리자 로그인</h1>
      <label>
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button className="primaryButton wide" type="submit">
        로그인
      </button>
      {status && <p className="status">{status}</p>}
    </form>
  );
}
