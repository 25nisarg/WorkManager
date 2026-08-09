import { CircleAlert } from "lucide-react";
import { Card } from "./card";

export function DataError({ message }: { message: string }) {
  return (
    <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-4 text-red-800" role="alert">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">Something went wrong</p>
        <p className="mt-1 text-sm text-red-700">{message}</p>
      </div>
    </Card>
  );
}
