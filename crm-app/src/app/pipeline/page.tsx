import PipelineBoard from "./PipelineBoard";

export default function PipelinePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Drag deals between stages. The flame marks deals with no recent activity — log one from the card to clear it.
        </p>
      </div>
      <PipelineBoard />
    </div>
  );
}
