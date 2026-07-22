"use client";

import { cn } from "@/lib/utils";
import {
  Compass,
  MessageCircle,
  PlusCircle,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-soil-800/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                active ? "text-spud-500" : "text-soil-800/45 hover:text-soil-800"
              )}
            >
              <Icon
                className={cn("size-6", href === "/create" && "size-7")}
                strokeWidth={active ? 2.4 : 2}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
