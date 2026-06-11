"use client";

interface SubheaderBarProps {
  text: string;
  className?: string;
}

export function SubheaderBar({ text, className }: SubheaderBarProps) {
  return (
    <div className={className ?? ""}>
      <div className="h-[3px] w-full bg-[#1a5092]" />
      <div className="mt-1 font-header text-xl uppercase tracking-wide text-[#1a5092]">
        {text}
      </div>
    </div>
  );
}

