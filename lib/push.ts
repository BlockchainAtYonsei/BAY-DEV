import webpush from "web-push";
import { prisma } from "./db";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

export function getPushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export const pushStore = {
  async subscribe(wallet: string, sub: { endpoint: string; p256dh: string; auth: string }) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { wallet: wallet.toLowerCase(), p256dh: sub.p256dh, auth: sub.auth },
      create: { ...sub, wallet: wallet.toLowerCase() }
    });
  },

  async unsubscribe(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  },

  async hasSubscription(endpoint: string) {
    const row = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    return Boolean(row);
  }
};

/**
 * 지갑 목록에 푸시 발송. 실패(만료된 구독)는 정리하고 조용히 넘어간다.
 * 응답을 막지 않도록 호출부에서 await 없이 써도 안전하다.
 */
export async function sendPushToWallets(
  wallets: string[],
  payload: { title: string; body: string; url: string }
) {
  if (wallets.length === 0 || !ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { wallet: { in: wallets.map((w) => w.toLowerCase()) } }
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // 브라우저에서 구독이 해지된 경우 — 죽은 구독 정리
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
