import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import type { DateParts } from "@lib/date/date-parts";

interface DateFieldInputProps {
  /** Defaults to "Date"; the media form says "Finished on", "Started on"… */
  label?: string;
  value: DateParts;
  onChange: (value: DateParts) => void;
}

const DIGITS_ONLY = /\D/g;

/** DD / MM / YYYY entry. Validation lives in `partsToIso`. */
function DateFieldInput({ label = "Date", value, onChange }: DateFieldInputProps) {
  const field = (
    key: keyof DateParts,
    placeholder: string,
    maxLength: number,
    width: string,
  ) => (
    <Input
      type="text"
      inputMode="numeric"
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${width} text-center`}
      value={value[key]}
      onChange={(event) =>
        onChange({
          ...value,
          [key]: event.target.value.replace(DIGITS_ONLY, "").slice(0, maxLength),
        })
      }
    />
  );

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1.5">
        {field("day", "DD", 2, "w-12")}
        <span className="text-sm text-muted-foreground">/</span>
        {field("month", "MM", 2, "w-12")}
        <span className="text-sm text-muted-foreground">/</span>
        {field("year", "YYYY", 4, "w-16")}
      </div>
    </div>
  );
}

export default DateFieldInput;
