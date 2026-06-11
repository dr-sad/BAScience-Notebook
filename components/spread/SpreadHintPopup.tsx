"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "ba_spread1_check_hint_dismissed";

const HINT_MESSAGE =
  "After answering a question, you can click on the problem number circle to check your answers.";

interface SpreadHintPopupProps {
  spreadId: string;
}

export function SpreadHintPopup({ spreadId }: SpreadHintPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (spreadId !== "spread-1") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    setVisible(true);
  }, [spreadId]);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="rounded-lg bg-white px-5 py-4 shadow-lg max-w-sm text-center">
        <p className="font-ui text-sm text-stone-800">{HINT_MESSAGE}</p>
        <button
          type="button"
          className="mt-3 rounded bg-[#5b8fb9] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#446f94]"
          onClick={handleDismiss}
        >
          OK
        </button>
      </div>
    </div>,
    document.body,
  );
}
