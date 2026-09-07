import type { ReactNode } from "react";
import { stripLabel, stripSelect } from "@/components/strip-styles";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

/**
 * The Number/Date pickers on the toolbar strip — same chrome for both, matching
 * the reference project's `stripSelect` exactly. The native select arrow is
 * kept (as prod does) rather than swapped for a custom chevron, so the two
 * widgets look the same on the page.
 */
export default function StripSelect({
  label,
  value,
  onChange,
  children,
}: Props) {
  return (
    <>
      <span style={stripLabel}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...stripSelect, flexShrink: 0 }}
      >
        {children}
      </select>
    </>
  );
}
