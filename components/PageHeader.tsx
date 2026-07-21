type Props = {
  title: string;
  description?: string;
  badge?: string;
  logoSrc?: string;
};

export default function PageHeader({ title, description, badge, logoSrc }: Props) {
  return (
    <header className="pageHeader">
      {logoSrc && <img className="heroLogo" src={logoSrc} alt="" />}
      {badge && <span className="trackBadge">{badge}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
