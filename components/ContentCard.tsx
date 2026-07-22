import Link from "next/link";

type Props = {
  href: string;
  badge: string;
  title: string;
  description: string;
};

/** 홈·트랙·학습자료 목록에서 공통으로 쓰는 콘텐츠 카드 링크 */
export default function ContentCard({ href, badge, title, description }: Props) {
  return (
    <Link href={href} className="trackCard">
      <span className="trackBadge">{badge}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </Link>
  );
}
