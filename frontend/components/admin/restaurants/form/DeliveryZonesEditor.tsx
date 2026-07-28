"use client";

import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEmptyDeliveryZone,
  type RestaurantFormValues,
} from "../form-schema";
import FormField from "./FormField";

export default function DeliveryZonesEditor() {
  const {
    control,
    formState: { errors },
  } = useFormContext<RestaurantFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliveryZones",
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          მიწოდების ზონები ჯერ არ არის დამატებული
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-800">
                  ზონა #{index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="ზონის წაშლა"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`deliveryZones.${index}.name`}
                  render={({ field: f }) => (
                    <FormField
                      label="ზონის სახელი"
                      required
                      error={
                        errors.deliveryZones?.[index]?.name?.message
                      }
                    >
                      <Input {...f} placeholder="მაგ. ცენტრი" />
                    </FormField>
                  )}
                />
                <Controller
                  control={control}
                  name={`deliveryZones.${index}.deliveryFee`}
                  render={({ field: f }) => (
                    <FormField label="მიწოდების ფასი (₾)">
                      <Input
                        {...f}
                        type="number"
                        min={0}
                        step="0.5"
                        onChange={(e) =>
                          f.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormField>
                  )}
                />
                <Controller
                  control={control}
                  name={`deliveryZones.${index}.minimumOrder`}
                  render={({ field: f }) => (
                    <FormField label="მინ. შეკვეთა (₾)">
                      <Input
                        {...f}
                        type="number"
                        min={0}
                        step="1"
                        onChange={(e) =>
                          f.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormField>
                  )}
                />
                <Controller
                  control={control}
                  name={`deliveryZones.${index}.estimatedMinutes`}
                  render={({ field: f }) => (
                    <FormField label="დრო (წთ)">
                      <Input
                        {...f}
                        type="number"
                        min={1}
                        step="1"
                        onChange={(e) =>
                          f.onChange(e.target.valueAsNumber || 1)
                        }
                      />
                    </FormField>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append(createEmptyDeliveryZone())}
      >
        <Plus className="size-4" />
        ზონის დამატება
      </Button>
    </div>
  );
}
