"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAY_LABELS } from "../types";
import type { RestaurantFormValues } from "../form-schema";
import TimePickerInput from "./TimePickerInput";

export default function WorkingHoursEditor() {
  const { control } = useFormContext<RestaurantFormValues>();
  const { fields } = useFieldArray({
    control,
    name: "workingHours",
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">დღე</TableHead>
            <TableHead>გახსნა</TableHead>
            <TableHead>დაკეტვა</TableHead>
            <TableHead className="w-[100px]">დაკეტილი</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <WorkingHoursRow key={field.id} index={index} day={field.day} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WorkingHoursRow({
  index,
  day,
}: {
  index: number;
  day: RestaurantFormValues["workingHours"][number]["day"];
}) {
  const { control } = useFormContext<RestaurantFormValues>();
  const isClosed = useWatch({
    control,
    name: `workingHours.${index}.isClosed`,
  });

  return (
    <TableRow>
      <TableCell className="font-medium">
        {DAY_LABELS[day]}
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`workingHours.${index}.openTime`}
          render={({ field: f }) => (
            <TimePickerInput
              value={f.value}
              onChange={f.onChange}
              disabled={isClosed}
            />
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`workingHours.${index}.closeTime`}
          render={({ field: f }) => (
            <TimePickerInput
              value={f.value}
              onChange={f.onChange}
              disabled={isClosed}
            />
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`workingHours.${index}.isClosed`}
          render={({ field: f }) => (
            <Switch checked={f.value} onCheckedChange={f.onChange} />
          )}
        />
      </TableCell>
    </TableRow>
  );
}
