import { DATE_FORMATS, type DateFormatId } from "@/lib/date-helper";
import { useDateFormat } from "@/context/DateFormatContext";
import StripSelect from "@/components/StripSelect";

/**
 * Date Format selector (list of values). Only one format is active at a time;
 * selecting one updates every displayed date across the app via
 * DateFormatContext.
 */
export default function DateFormatToolbar() {
  const { dateFormat, setDateFormat } = useDateFormat();

  return (
    <StripSelect
      label="DATE FORMAT"
      value={dateFormat}
      onChange={(v) => setDateFormat(v as DateFormatId)}
    >
      {DATE_FORMATS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </StripSelect>
  );
}
