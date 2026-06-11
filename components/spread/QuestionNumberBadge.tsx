"use client";

export type QuestionBadgeStatus =
  | "unanswered"
  | "correct"
  | "incorrect"
  | "inProgress";

interface QuestionNumberBadgeProps {
  number: number;
  status: QuestionBadgeStatus;
  onClick?: () => void;
  ariaLabel?: string;
}

export function QuestionNumberBadge({
  number,
  status,
  onClick,
  ariaLabel,
}: QuestionNumberBadgeProps) {
  const statusClasses =
    status === "correct"
      ? "bg-[#66b345] border border-white"
      : status === "incorrect"
        ? "bg-red-500 border border-white"
        : status === "inProgress"
          ? "bg-amber-400 border border-white"
          : "bg-gray-300 border border-white";

  const badge = (
    <div className="relative inline-flex">
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#5b8fb9]">
        <span className="text-xs font-semibold text-white">{number}</span>
      </div>
      <span
        className={`absolute -bottom-0.5 -right-1 w-2.5 h-2.5 rounded-full ${statusClasses}`}
        aria-hidden
      />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5b8fb9]"
      >
        {badge}
      </button>
    );
  }

  return <div className="flex-shrink-0">{badge}</div>;
}

