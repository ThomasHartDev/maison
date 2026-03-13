import { GOLD } from "@/constants";

interface RingProps {
  value: number;
  total: number;
  color?: string;
  size?: number;
  stroke?: number;
}

export const Ring = ({ value, total, color = GOLD, size = 64, stroke = 5 }: RingProps) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total ? value / total : 0;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};
