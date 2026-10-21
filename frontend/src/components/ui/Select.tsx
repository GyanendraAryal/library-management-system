import { ChevronDown } from "lucide-react";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
  id?: string;
  label?: string;
}

export default function Select({ value, onChange, options, compact, id, label }: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label ? <span className="font-medium text-ink">{label}</span> : null}
      <div
        className={`relative inline-flex h-[34px] items-center rounded-lg border border-line bg-surface text-ink-muted focus-within:border-brand ${
          compact ? "min-w-16" : "min-w-40"
        }`}
      >
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full cursor-pointer appearance-none bg-transparent py-0 pl-3 pr-8 text-ink outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5" />
      </div>
    </label>
  );
}
