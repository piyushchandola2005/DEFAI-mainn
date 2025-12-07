import React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className, ...props }: GlowCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-white/10 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10",
        className
      )}
      {...props}
    >
      {/* Gradient Hover Effect */}
      <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 blur-sm" />
      </div>
      
      {/* Inner Content (Masking the gradient center) */}
      <div className="relative h-full w-full rounded-[10px] bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
