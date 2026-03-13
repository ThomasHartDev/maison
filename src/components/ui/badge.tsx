import type { DressStatus } from "@/types";
import { STATUS } from "@/constants";

interface BadgeProps {
  status: DressStatus;
  small?: boolean;
}

export const Badge = ({ status, small }: BadgeProps) => {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span
      style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.color}22`,
        borderRadius: 20,
        padding: small ? "1px 8px" : "3px 11px",
        fontSize: small ? 9 : 10,
        fontWeight: 700, letterSpacing: 0.5,
        textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};
