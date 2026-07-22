import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { verifyMessage } from "viem";
import type { PublicSession } from "./types";

const ADMIN_COOKIE = "bay18_admin";
const WALLET_COOKIE = "bay18_wallet";
const NONCE_COOKIE = "bay18_nonce";
const MAX_AGE = 60 * 60 * 24 * 14;

function getSecret() {
  return process.env.SESSION_SECRET || "dev-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encode(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode<T>(token?: string): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createNonce() {
  return randomBytes(16).toString("hex");
}

export function buildWalletMessage(wallet: string, nonce: string) {
  return [
    "BAY 개발팀 과제 제출 로그인",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    "",
    "이 서명은 로그인 확인용이며 트랜잭션을 발생시키지 않습니다."
  ].join("\n");
}

export async function setLoginNonce(wallet: string, nonce: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    NONCE_COOKIE,
    encode({ wallet: wallet.toLowerCase(), nonce, createdAt: Date.now() }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 5,
      path: "/"
    }
  );
}

export async function getLoginNonce(wallet: string, nonce: string) {
  const cookieStore = await cookies();
  const session = decode<{ wallet: string; nonce: string; createdAt: number }>(
    cookieStore.get(NONCE_COOKIE)?.value
  );
  const isFresh = session?.createdAt && Date.now() - session.createdAt < 1000 * 60 * 5;
  if (!session || !isFresh) return false;
  return session.wallet === wallet.toLowerCase() && session.nonce === nonce;
}

export async function clearLoginNonce() {
  const cookieStore = await cookies();
  cookieStore.delete(NONCE_COOKIE);
}

export async function verifyWalletSignature(params: {
  wallet: string;
  nonce: string;
  signature: string;
}) {
  const message = buildWalletMessage(params.wallet, params.nonce);
  return verifyMessage({
    address: params.wallet as `0x${string}`,
    message,
    signature: params.signature as `0x${string}`
  });
}

export async function setWalletSession(wallet: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    WALLET_COOKIE,
    encode({ wallet: wallet.toLowerCase(), createdAt: Date.now() }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
      path: "/"
    }
  );
}

export async function getWalletSession(): Promise<PublicSession | null> {
  const cookieStore = await cookies();
  const session = decode<{ wallet: string }>(cookieStore.get(WALLET_COOKIE)?.value);
  if (!session?.wallet) return null;
  return { wallet: session.wallet };
}

export async function clearWalletSession() {
  const cookieStore = await cookies();
  cookieStore.delete(WALLET_COOKIE);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, encode({ admin: true, createdAt: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/"
  });
}

export async function isAdmin() {
  const cookieStore = await cookies();
  const session = decode<{ admin: boolean }>(cookieStore.get(ADMIN_COOKIE)?.value);
  return session?.admin === true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "bay18-admin";
}

/** 관리자 배지를 붙일 지갑 주소 목록 (소문자) */
export function getAdminWallets(): Set<string> {
  return new Set(
    (process.env.ADMIN_WALLETS || "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );
}
