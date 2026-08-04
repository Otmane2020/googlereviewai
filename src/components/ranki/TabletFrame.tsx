import { ReactNode } from "react";

export const TabletFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative mx-auto w-full max-w-[560px] aspect-[4/3] rounded-[2.2rem] bg-gradient-to-b from-[#2a2d34] to-[#0f1013] p-3 sm:p-4 shadow-2xl border border-black/40">
      {/* Camera dot */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/60 ring-1 ring-white/10" />
      {/* Screen */}
      <div className="relative h-full w-full rounded-[1.4rem] overflow-hidden ring-1 ring-white/10 bg-[#0b0d12]">
        {children}
      </div>
    </div>
  );
};
