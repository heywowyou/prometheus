import { useState } from "react";
import { cn } from "@lib/utils";
import { numberToInput, parseDecimal } from "../workout-format";

interface NumberFieldProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  /** Shown when empty, e.g. last time's value. */
  placeholder?: string;
  label: string;
  /** Whole numbers only (reps): numeric keypad without a decimal key. */
  integer?: boolean;
  className?: string;
}

/**
 * A phone-friendly number input: numeric keypad, select-all on focus, comma
 * or dot decimals. Keeps the typed text while editing ("82," mid-entry) and
 * reports the parsed number.
 */
function NumberField({
  value,
  onChange,
  placeholder,
  label,
  integer,
  className,
}: NumberFieldProps) {
  const [text, setText] = useState(() => numberToInput(value));
  const [focused, setFocused] = useState(false);

  // Outside changes (e.g. "+ Set" copying values) show when not editing.
  const shown = focused ? text : numberToInput(value);

  return (
    <input
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      enterKeyHint="next"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      value={shown}
      onFocus={(event) => {
        setText(numberToInput(value));
        setFocused(true);
        event.currentTarget.select();
      }}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const raw = event.target.value;
        if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
        setText(raw);
        const parsed = parseDecimal(raw);
        onChange(integer && parsed !== undefined ? Math.round(parsed) : parsed);
      }}
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-center text-base tabular-nums text-foreground placeholder:text-muted-foreground/60 focus:border-rating focus:outline-none",
        className,
      )}
    />
  );
}

export default NumberField;
