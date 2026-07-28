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
    <Card className={cn("border-neutral-200 shadow-sm", className)}>
      <CardHeader className="pb-4">
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
      <CardContent>{children}</CardContent>
    </Card>
  );
}
