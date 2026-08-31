import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { KA } from "@/lib/restaurant/labels";

type ChartPlaceholderProps = {
  title: string;
  description?: string;
  height?: string;
};

export default function ChartPlaceholder({
  title,
  description,
  height = "h-64",
}: ChartPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={`flex ${height} items-center justify-center rounded-lg border border-dashed border-border bg-muted/30`}
        >
          <div className="text-center">
            <BarChart3 className="mx-auto size-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {KA.chartPlaceholder}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
