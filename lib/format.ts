export function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR");
}
