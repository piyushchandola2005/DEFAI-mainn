"use client";

import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

export function DashboardButton() {
  return (
    <Link href="/dashboard" passHref>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-gray-800 border border-red-200 rounded-full px-3 h-8 transition-all duration-200 hover:shadow-sm"
      >
        <BarChart3 className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium">Dashboard</span>
      </Button>
    </Link>
  );
}
