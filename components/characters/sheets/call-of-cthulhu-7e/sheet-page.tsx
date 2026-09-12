import type { ReactNode } from "react";

export default function Coc7eSheetPage({
  children,
  pageNumber,
}: {
  children: ReactNode;
  pageNumber: 1 | 2;
}) {
  return (
    <section
      data-coc7e-sheet-page={pageNumber}
      className="mx-auto box-border w-full border-[1.5mm] border-stone-700 bg-[#fbfaf5] text-neutral-950 shadow-lg sm:border-[2mm] lg:aspect-[210/297] lg:border-[3mm] print:min-h-[297mm] print:w-[210mm] print:border-[3mm] print:shadow-none"
    >
      <div className="min-h-full min-w-0 bg-[#fbfaf5] p-1 sm:p-2 lg:p-2.5 print:p-[2mm]">
        {children}
      </div>
    </section>
  );
}
