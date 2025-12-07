"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, MessageCircle, BarChart3, Settings, TrendingUp } from 'lucide-react';

export default function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: <Home className="w-4 h-4" />
    },
    {
      href: '/dashboard',
      label: 'Portfolio',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      href: '/chat',
      label: 'AI Chat',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                DEFAI
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:shadow-xl'
                      : 'hover:bg-red-100 text-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
