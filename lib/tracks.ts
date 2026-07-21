export type Track = {
  slug: string;
  title: string;
  badge: string;
  description: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlErrorMessage: string;
  /** 제출 URL 호스트 제한 (비어 있으면 http/https URL이면 허용) */
  allowedHostSuffixes: string[];
  steps: string[];
};

export const TRACKS: Track[] = [
  {
    slug: "cryptozombies",
    title: "크립토좀비",
    badge: "18기 전용 과제",
    description: "매주 레슨을 완료하고 공유 링크를 제출합니다.",
    urlLabel: "크립토좀비 완료 URL",
    urlPlaceholder: "https://share.cryptozombies.io/...",
    urlErrorMessage: "cryptozombies.io 완료 URL을 입력해 주세요.",
    allowedHostSuffixes: ["cryptozombies.io"],
    steps: [
      "크립토좀비(cryptozombies.io)에서 이번 주 레슨을 완료합니다.",
      "완료 화면에 나오는 좀비의 영구적인 링크를 복사합니다.",
      "지갑으로 로그인한 뒤 아래에 링크를 붙여넣고 제출합니다."
    ]
  },
  {
    slug: "ethereum-core",
    title: "이더리움 코어",
    badge: "17·18기 공통 과제",
    description: "과제 결과물 링크(GitHub 등)를 제출합니다.",
    urlLabel: "결과물 URL",
    urlPlaceholder: "https://github.com/...",
    urlErrorMessage: "결과물 URL(https://...)을 입력해 주세요.",
    allowedHostSuffixes: [],
    steps: [
      "이더리움 코어 과제를 완료합니다.",
      "결과물이 있는 링크(GitHub 저장소, 문서 등)를 준비합니다.",
      "지갑으로 로그인한 뒤 아래에 링크를 붙여넣고 제출합니다."
    ]
  }
];

export function findTrack(slug: string | null | undefined): Track | null {
  return TRACKS.find((track) => track.slug === slug) || null;
}
