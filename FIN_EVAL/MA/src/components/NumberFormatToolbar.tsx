import { NUMBER_FORMATS, type NumberFormatId } from "@/lib";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import StripSelect from "@/components/StripSelect";

/**
 * Number Format selector (list of values). Picking a regional convention
 * (e.g. "1.234.567,89") re-renders every numeric cell across the app with that
 * grouping + decimal separator via CurrencyFormatContext. Underlying stored
 * values are never mutated — only their display changes.
 */
export default function NumberFormatToolbar() {
  const { numberFormat, setNumberFormat } = useCurrencyFormat();

  return (
    <StripSelect
      label="NUMBER FORMAT"
      value={numberFormat}
      onChange={(v) => setNumberFormat(v as NumberFormatId)}
    >
      {NUMBER_FORMATS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </StripSelect>
  );
}
