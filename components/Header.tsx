"use client";
import { User } from "@/lib/types";

interface Props {
  user: User;
  onLogout: () => void;
  todayCount: number;
  totalTasks: number;
}

export default function Header({ user, onLogout, todayCount, totalTasks }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const progress = totalTasks > 0 ? Math.round((todayCount / totalTasks) * 100) : 0;

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: user.color + "25" }}
            >
              {user.emoji}
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">{greeting},</p>
              <p className="font-bold text-slate-800 text-sm leading-snug">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{dateStr}</span>
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              title="Trocar usuário"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? "#059669" : "#0891b2",
              }}
            />
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {todayCount}/{totalTasks} hoje
          </span>
        </div>
      </div>
    </header>
  );
}
