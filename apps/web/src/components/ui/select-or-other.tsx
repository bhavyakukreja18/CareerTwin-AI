"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui/field";

export interface SelectOrOtherOption {
  value: string;
  label: string;
}

interface SelectOrOtherProps {
  value: string;
  onChange: (next: string) => void;
  options: SelectOrOtherOption[];
  placeholder?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
}

const OTHER_SENTINEL = "__other__";

// A <select> covers the common answers with zero typing, but still falls back to a free-text
// input for the long tail — avoids forcing users into an incomplete preset list.
export function SelectOrOther({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  otherLabel = "Other (type your own)",
  otherPlaceholder = "Type your own..."
}: SelectOrOtherProps) {
  const isPreset = options.some((option) => option.value === value);
  const [showCustom, setShowCustom] = useState(value !== "" && !isPreset);

  return (
    <div className="space-y-2">
      <select
        className={inputClass}
        value={showCustom ? OTHER_SENTINEL : value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === OTHER_SENTINEL) {
            setShowCustom(true);
            onChange("");
          } else {
            setShowCustom(false);
            onChange(next);
          }
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value={OTHER_SENTINEL}>{otherLabel}</option>
      </select>
      {showCustom ? (
        <input
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={otherPlaceholder}
          autoFocus
        />
      ) : null}
    </div>
  );
}
