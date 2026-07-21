"use client";

type Props = {
  total: number;
  currentWeekCount: number;
  visible: number;
};

export default function AdminMetrics({ total, currentWeekCount, visible }: Props) {
  const metrics = [
    { label: "총 제출", value: total },
    { label: "이번 주 제출", value: currentWeekCount },
    { label: "표시 중", value: visible }
  ];

  return (
    <section className="metricGrid">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <span className="label">{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </section>
  );
}
