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
      className="mx-auto box-border w-full border-[3mm] border-[#b00000] bg-white text-neutral-950 shadow-lg md:aspect-[210/297] print:min-h-[297mm] print:w-[210mm] print:shadow-none"
    >
      <div className="min-h-full bg-white p-1 sm:p-1.5 md:p-2 print:p-[2mm]">
        {children}
      </div>
    </section>
  );
}
