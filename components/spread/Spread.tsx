"use client";

import type { SpreadData } from "@/data/spreads";
import { PageContentRenderer } from "./PageContentRenderer";
import { HotspotOverlay } from "./HotspotOverlay";

/** Steel/cornflower blue from reference image - identical on both sides */
const SPREAD_BAR_COLOR = "#5b8fb9";
/** Blue bar width as percentage of one page width (plan: ~3-5%) */
const BAR_WIDTH_PERCENT = 4;

interface SpreadProps {
  data: SpreadData;
  spreadId?: string;
}

/**
 * One open-book spread: left page | center line | right page.
 * CSS-only frame: blue bars, center divider, ratio-preserving layout.
 */
export function Spread({ data, spreadId }: SpreadProps) {
  const { leftPage, rightPage, footer, hotspots = [] } = data;
  const barColor = data.sidebarColor ?? SPREAD_BAR_COLOR;

  return (
    <div
      className="w-full max-w-6xl mx-auto bg-white"
      style={{
        aspectRatio: "16 / 10",
        maxHeight: "85vh",
      }}
    >
      <div className="flex h-full w-full border border-gray-200 rounded-sm overflow-hidden shadow-lg">
        {/* Left page: bar (outer) + content */}
        <div className="flex flex-1 min-w-0" style={{ borderRight: "1px solid #ccc" }}>
          <div
            className="relative flex-shrink-0 flex flex-col items-center justify-end py-2"
            style={{
              width: `${BAR_WIDTH_PERCENT}%`,
              minWidth: "24px",
              backgroundColor: barColor,
              zIndex: 1,
            }}
          >
            <div
              className="absolute left-full bottom-2 flex h-[30px] w-[30px] items-center justify-start pl-1 font-header text-sm tracking-tight text-white"
              style={{ backgroundColor: barColor }}
            >
              {leftPage.pageNumber}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col p-4 overflow-y-auto border-t border-b border-gray-200 relative">
            {leftPage.largeHeaderBar && (
              <div className="mb-2">
                <div className="relative h-10 overflow-visible">
                  <div
                    className="absolute inset-x-0"
                    style={{
                      top: "6px",
                      height: "36px",
                      backgroundColor: "#1a5092",
                      transform: "rotate(-1deg)",
                      transformOrigin: "left center",
                    }}
                  />
                  <div className="relative flex items-center h-full px-4">
                    <span className="font-header text-2xl text-white leading-none translate-y-[4px]">
                      {leftPage.headerTitle}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1">
              <PageContentRenderer blocks={leftPage.blocks} spreadId={spreadId} />
            </div>
            {hotspots.length > 0 && <HotspotOverlay hotspots={hotspots} page="left" />}
            {footer?.leftSeriesText && (
              <p className="text-xs text-gray-400 mt-4 text-center">
                {footer.leftSeriesText}
              </p>
            )}
          </div>
        </div>

        {/* Center line separating left and right page */}
        <div
          className="flex-shrink-0 w-px"
          style={{ backgroundColor: "#ccc" }}
          aria-hidden
        />

        {/* Right page: content + bar (outer) */}
        <div className="flex flex-1 min-w-0" style={{ borderLeft: "1px solid #ccc" }}>
          <div className="flex-1 min-w-0 flex flex-col p-4 overflow-y-auto border-t border-b border-r border-gray-200 relative">
            {rightPage.largeHeaderBar && (
              <div className="mb-2">
                <div className="relative h-10 overflow-visible">
                  <div
                    className="absolute inset-x-0"
                    style={{
                      top: "6px",
                      height: "36px",
                      backgroundColor: "#1a5092",
                      transform: "rotate(-1deg)",
                      transformOrigin: "left center",
                    }}
                  />
                  <div className="relative flex items-center h-full px-4">
                    <span className="font-header text-2xl text-white leading-none translate-y-[4px]">
                      {rightPage.headerTitle}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1">
              <PageContentRenderer blocks={rightPage.blocks} spreadId={spreadId} />
            </div>
            {hotspots.length > 0 && <HotspotOverlay hotspots={hotspots} page="right" />}
            {footer?.rightChapterText && (
              <p className="text-xs text-gray-400 mt-4 text-center">
                {footer.rightChapterText}
              </p>
            )}
          </div>
          <div
            className="relative flex-shrink-0 flex flex-col items-center justify-end py-2"
            style={{
              width: `${BAR_WIDTH_PERCENT}%`,
              minWidth: "24px",
              backgroundColor: barColor,
            }}
          >
            <div
              className="absolute right-full bottom-2 flex h-[30px] w-[30px] items-center justify-end pr-1 font-header text-sm tracking-tight text-white"
              style={{ backgroundColor: barColor }}
            >
              {rightPage.pageNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
