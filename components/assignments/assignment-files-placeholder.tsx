import { FolderLock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AssignmentFilesPlaceholder() {
  return (
    <section id="assignment-files" className="space-y-4" aria-labelledby="assignment-files-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Documents</p>
        <h2 id="assignment-files-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Files</h2>
      </div>
      <Card className="flex min-h-36 items-center gap-4 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FolderLock aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">Assignment files are planned for the next phase</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Private uploads and temporary writer-sharing links are not enabled yet. No storage bucket or file metadata table is required for this refactor.</p>
        </div>
      </Card>
    </section>
  );
}
