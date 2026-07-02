type SheetSectionDividerProps = {
  className?: string;
};

export default function SheetSectionDivider({
  className = "",
}: SheetSectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`h-2 w-full bg-[#b00000] ${className}`}
    />
  );
}
