type CampaignGameRoomPlannedToolsProps = {
  displayHeading: string;
  toolsHeading: string;
  status: string;
};

export default function CampaignGameRoomPlannedTools({
  displayHeading,
  toolsHeading,
  status,
}: CampaignGameRoomPlannedToolsProps) {
  return (
    <div className="game-room-workspace min-h-0" data-game-room-workspace>
      <section
        className="flex min-h-48 flex-1 items-center justify-center rounded-xl border border-white/20 bg-black/55 p-5 text-center"
        aria-labelledby="handout-display-title"
        data-handout-display
      >
        <div>
          <h2 id="handout-display-title" className="text-lg font-semibold sm:text-xl">
            {displayHeading}
          </h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            {status}
          </p>
        </div>
      </section>
      <section
        className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/20 bg-black/65 px-4 py-2"
        aria-labelledby="game-tools-title"
        data-game-tools-panel
      >
        <h2 id="game-tools-title" className="truncate text-sm font-semibold sm:text-base">
          {toolsHeading}
        </h2>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white/60">
          {status}
        </span>
      </section>
    </div>
  );
}
