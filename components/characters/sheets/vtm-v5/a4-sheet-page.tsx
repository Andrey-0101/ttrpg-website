import type { ReactNode } from "react";

type A4SheetPageProps = {
  children: ReactNode;
  pageNumber: 1 | 2;
};

export default function A4SheetPage({
  children,
  pageNumber,
}: A4SheetPageProps) {
  return (
    <section
      data-vtm-sheet-page={pageNumber}
      className="mx-auto box-border w-full border-[1.5mm] border-[#b00000] bg-white text-neutral-950 shadow-lg sm:border-[2mm] lg:aspect-[210/297] lg:border-[3mm] print:min-h-[297mm] print:w-[210mm] print:border-[3mm] print:shadow-none"
    >
      <div className="min-h-full min-w-0 bg-white p-0.5 sm:p-1.5 lg:p-2 print:p-[2mm]">
        {children}
      </div>
    </section>
  );
}
