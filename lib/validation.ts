import { findTrack, type Track } from "./tracks";

type FormSubmissionInput = { track: Track; zombieUrl: string; note: string };
type ParseResult = { ok: true; input: FormSubmissionInput } | { ok: false; error: string };

function isAllowedUrl(value: string, track: Track) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (track.allowedHostSuffixes.length === 0) return true;
    return track.allowedHostSuffixes.some((suffix) => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export function parseSubmissionInput(body: unknown): ParseResult {
  const record = (body ?? {}) as Record<string, unknown>;
  const track = findTrack(typeof record.track === "string" ? record.track : null);
  const zombieUrl = typeof record.zombieUrl === "string" ? record.zombieUrl.trim() : "";
  const note = typeof record.note === "string" ? record.note.trim() : "";

  if (!track) {
    return { ok: false, error: "존재하지 않는 과제입니다." };
  }
  if (zombieUrl.length > 500 || !isAllowedUrl(zombieUrl, track)) {
    return { ok: false, error: track.urlErrorMessage };
  }
  return { ok: true, input: { track, zombieUrl, note } };
}

export function parseName(body: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const record = (body ?? {}) as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (name.length < 2 || name.length > 20) {
    return { ok: false, error: "이름을 2~20자로 입력해 주세요." };
  }
  return { ok: true, name };
}
