"use client";

import PushToggle from "@/components/PushToggle";

type Props = {
  answeredCount: number;
  total: number;
  submittedAt: string | null;
  draftRestored: boolean;
};

/** 진행 상황 요약 + 알림 토글 + 임시저장 안내 */
export default function QuizProgress({ answeredCount, total, submittedAt, draftRestored }: Props) {
  return (
    <div>
      <span className="label">진행 상황</span>
      <strong>
        {answeredCount} / {total} 문항 응답
        {submittedAt && ` · 마지막 제출 ${new Date(submittedAt).toLocaleString("ko-KR")}`}
      </strong>
      <div style={{ marginTop: 10 }}>
        <PushToggle />
      </div>
      {!submittedAt && (
        <small className="quizHint" style={{ display: "block", marginTop: 6 }}>
          {draftRestored
            ? "작성 중이던 답안을 이 브라우저에서 불러왔습니다. 아직 제출되지는 않았어요."
            : "작성한 답안은 이 브라우저에 자동 저장되어, 나갔다 와도 이어서 쓸 수 있습니다."}
        </small>
      )}
    </div>
  );
}
