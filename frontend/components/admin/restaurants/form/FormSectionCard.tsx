"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormSectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function FormSectionCard({
  title,
  description,
  icon,
  children,
  className,
}: FormSectionCardProps) {
  return (
    <Card className={cn("min-w-0 border-neutral-200 shadow-sm", className)}>
      <CardHeader className="space-y-1.5 p-4 pb-4 sm:p-6">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  );
}
