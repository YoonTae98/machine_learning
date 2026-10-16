import { LiquidGlass } from "@aberhamm/liquid-glass-react";

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

export default function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <LiquidGlass
      cornerRadius={24}
      padding="24px"
    >
      <div className="metric-card-content">
        <span className="metric-label">
          {label}
        </span>

        <strong className="metric-value">
          {value}
        </strong>

        <span className="metric-description">
          {description}
        </span>
      </div>
    </LiquidGlass>
  );
}