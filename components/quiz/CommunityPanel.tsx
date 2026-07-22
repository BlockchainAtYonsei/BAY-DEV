"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CommentNode = {
  id: string;
  wallet: string;
  body: string | null;
  deleted: boolean;
  isSubmission: boolean;
  isAdmin: boolean;
  isMine: boolean;
  name?: string;
  createdAt: string;
  replies: CommentNode[];
};

type Props = {
  slug: string;
  questionIndex: number;
  prompt: string;
  open: boolean;
  onClose: () => void;
  onCountChange: (questionIndex: number, count: number) => void;
};

function shortWallet(wallet: string) {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

function countVisible(nodes: CommentNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + (n.deleted ? 0 : 1) + countVisible(n.replies),
    0
  );
}

export default function CommunityPanel({
  slug,
  questionIndex,
  prompt,
  open,
  onClose,
  onCountChange
}: Props) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const loadedFor = useRef<number | null>(null);

  // 포털은 클라이언트에서만 (SSR 시 document 없음)
  useEffect(() => setMounted(true), []);

  // 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const apply = useCallback(
    (next: CommentNode[]) => {
      setComments(next);
      onCountChange(questionIndex, countVisible(next));
    },
    [onCountChange, questionIndex]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/quizzes/${slug}/comments?q=${questionIndex}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      apply(data.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [slug, questionIndex, apply]);

  // 패널이 이 문항으로 열릴 때 한 번 로드
  useEffect(() => {
    if (!open) return;
    if (loadedFor.current === questionIndex) return;
    loadedFor.current = questionIndex;
    load();
  }, [open, questionIndex, load]);

  useEffect(() => {
    if (!open) loadedFor.current = null;
  }, [open]);

  async function post(body: string, parentId: string | null) {
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/quizzes/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex, body, parentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      apply(data.comments);
      setReplyTo(null);
      setReplyDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 글을 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quizzes/${slug}/comments/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "삭제에 실패했습니다.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function renderNode(node: CommentNode, isReply: boolean) {
    return (
      <li
        className={`cmt${isReply ? " cmtReply" : ""}${node.isSubmission ? " cmtSubmission" : ""}`}
        key={node.id}
      >
        <div className="cmtHead">
          <span className="cmtWallet">{shortWallet(node.wallet)}</span>
          {node.isSubmission && <span className="cmtBadge cmtBadgeSub">제출 답</span>}
          {node.isAdmin && <span className="cmtBadge">관리자</span>}
          {node.isMine && <span className="cmtBadge cmtBadgeMine">나</span>}
          {node.name && <span className="cmtName">· {node.name}</span>}
          <time className="cmtTime">
            {new Date(node.createdAt).toLocaleString("ko-KR", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </time>
        </div>
        {node.deleted ? (
          <p className="cmtBody cmtDeleted">삭제된 글입니다.</p>
        ) : (
          <p className="cmtBody">{node.body}</p>
        )}
        {!node.deleted && (
          <div className="cmtActions">
            {!isReply && (
              <button
                type="button"
                className="cmtLink"
                onClick={() => {
                  setReplyTo(replyTo === node.id ? null : node.id);
                  setReplyDraft("");
                }}
              >
                답글
              </button>
            )}
            {node.isMine && (
              <button
                type="button"
                className="cmtLink cmtDanger"
                onClick={() => remove(node.id)}
                disabled={busy}
              >
                삭제
              </button>
            )}
          </div>
        )}

        {replyTo === node.id && !isReply && (
          <div className="cmtReplyBox">
            <textarea
              placeholder="답글을 입력하세요."
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              rows={2}
            />
            <div className="cmtReplyActions">
              <button
                type="button"
                className="cmtLink"
                onClick={() => {
                  setReplyTo(null);
                  setReplyDraft("");
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="cmtPost"
                disabled={busy || !replyDraft.trim()}
                onClick={() => post(replyDraft, node.id)}
              >
                답글 등록
              </button>
            </div>
          </div>
        )}

        {node.replies.length > 0 && (
          <ul className="cmtList cmtReplies">
            {node.replies.map((child) => renderNode(child, true))}
          </ul>
        )}
      </li>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`qcBackdrop${open ? " isOpen" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`qcSide${open ? " isOpen" : ""}`} aria-hidden={!open}>
        <header className="qcSideHead">
          <div>
            <span className="qcSideLabel">💬 문항 토론</span>
            <p className="qcSidePrompt">{prompt}</p>
          </div>
          <button type="button" className="qcClose" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="qcSideBody">
          <div className="qcInner">
            <p className="qcHint">
              제출한 답이 아래에 올라옵니다. 다른 사람의 답에 <strong>답글(대댓글)</strong>로
              생각을 나눠보세요.
            </p>

            {error && <p className="status">{error}</p>}

            {loading ? (
              <p className="cmtEmpty">불러오는 중…</p>
            ) : comments.length === 0 ? (
              <p className="cmtEmpty">아직 제출된 답이 없습니다. 첫 답을 제출해 보세요.</p>
            ) : (
              <ul className="cmtList">
                {comments.map((node) => renderNode(node, false))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}
