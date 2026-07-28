"use client";

import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TimePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export default function TimePickerInput({
  value,
  onChange,
  disabled,
  className,
  id,
}: TimePickerInputProps) {
  return (
    <div className="relative">
      <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn("pl-9", className)}
      />
    </div>
  );
}
