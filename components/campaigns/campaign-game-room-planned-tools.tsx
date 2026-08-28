type PlannedTool = {
  title: string;
  description: string;
  details?: string[];
};

type CampaignGameRoomPlannedToolsProps = {
  heading: string;
  description: string;
  status: string;
  tools: PlannedTool[];
};

export default function CampaignGameRoomPlannedTools({
  heading,
  description,
  status,
  tools,
}: CampaignGameRoomPlannedToolsProps) {
  return (
    <section aria-labelledby="planned-tools-title">
      <h2 id="planned-tools-title" className="text-xl font-bold">
        {heading}
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-white/70">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-lg border border-white/15 bg-black/20 p-4"
          >
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/65">
              {status}
            </span>
            <h3 className="mt-3 font-semibold">{tool.title}</h3>
            <p className="mt-2 text-sm text-white/65">{tool.description}</p>
            {tool.details && (
              <ul className="mt-3 space-y-1 text-xs text-white/55">
                {tool.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
