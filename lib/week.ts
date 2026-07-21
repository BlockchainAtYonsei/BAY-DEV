const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
// 과제 주기는 금요일 시작 ~ 목요일 마감 (KST). 날짜에 3일을 더하면 금~목이 ISO 주(월~일)에 정렬된다.
const CYCLE_SHIFT_MS = 3 * DAY_MS;

/** 과제 주기 키 (한국 시간, 금~목 기준), 예: "2026-W30" */
export function weekKeyFromDate(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS + CYCLE_SHIFT_MS);
  const target = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / WEEK_MS);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function getCurrentWeekKey(): string {
  return weekKeyFromDate(new Date());
}

function weekStart(weekKey: string): Date {
  const [yearPart, weekPart] = weekKey.split("-W");
  const jan4 = new Date(Date.UTC(Number(yearPart), 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const firstMonday = jan4.getTime() - jan4DayNum * DAY_MS;
  return new Date(firstMonday + (Number(weekPart) - 1) * WEEK_MS);
}

/** 과제 기간 표시 (금~목), 예: "7/17 ~ 7/23" */
export function formatWeekRange(weekKey: string): string {
  const start = new Date(weekStart(weekKey).getTime() - CYCLE_SHIFT_MS);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(start)} ~ ${fmt(end)}`;
}
