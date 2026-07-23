"use client";

import type { AdminCommentNode } from "@/lib/commentStore";

export type DiscussionData = {
  quiz: { id: string; title: string };
  questions: { index: number; prompt: string }[];
  threads: Record<number, AdminCommentNode[]>;
};

function shortWallet(wallet: string) {
  return wallet.length > 12 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
}

function CommentItem({ node, isReply }: { node: AdminCommentNode; isReply?: boolean }) {
  return (
    <li className={isReply ? "adminCmt adminCmtReply" : "adminCmt"}>
      <div className="adminCmtMeta">
        <strong>{node.name || "(이름 미등록)"}</strong>
        <small className="urlCell">{shortWallet(node.wallet)}</small>
        {node.isSubmission && <span className="trackBadge">제출 답안</span>}
        <small>{new Date(node.createdAt).toLocaleString("ko-KR")}</small>
      </div>
      <p className="adminCmtBody">{node.deleted ? "(삭제된 글)" : node.body}</p>
      {node.replies.length > 0 && (
        <ul className="adminCmtList">
          {node.replies.map((reply) => (
            <CommentItem key={reply.id} node={reply} isReply />
          ))}
        </ul>
      )}
    </li>
  );
}

/** 관리자 전용: 퀴즈 토론 전체를 문항별로, 작성자 이름과 함께 보여준다 */
export default function DiscussionPanel({
  data,
  onClose
}: {
  data: DiscussionData;
  onClose: () => void;
}) {
  const { quiz, questions, threads } = data;
  const withComments = questions.filter((q) => (threads[q.index] || []).length > 0);

  return (
    <section className="quizEditor">
      <div className="adminHeader">
        <h2 className="sectionTitle">토론 — {quiz.title}</h2>
        <button className="ghostButton" type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      {withComments.length === 0 ? (
        <p className="status">아직 댓글이 없습니다.</p>
      ) : (
        withComments.map((question) => (
          <div className="adminCmtQuestion" key={question.index}>
            <h3>
              <span className="quizQuestionNumber">Q{question.index + 1}</span>
              {question.prompt}
            </h3>
            <ul className="adminCmtList">
              {threads[question.index].map((node) => (
                <CommentItem key={node.id} node={node} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
