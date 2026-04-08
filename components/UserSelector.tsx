"use client";
import { User, UserId } from "@/lib/types";

interface Props {
  users: User[];
  onSelect: (id: UserId) => void;
}

export default function UserSelector({ users, onSelect }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 slide-up">
      {/* Logo area */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-4">🐠</div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">AquaControl</h1>
        <p className="text-slate-500 text-sm">Quem está usando agora?</p>
      </div>

      {/* User cards */}
      <div className="w-full max-w-xs space-y-3">
        {users.map((user, i) => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all duration-200 fade-in"
            style={{
              animationDelay: `${i * 0.08}s`,
              animationFillMode: "both",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: user.color + "20" }}
            >
              {user.emoji}
            </div>
            <div className="text-left">
              <p className="font-700 text-slate-800 text-base font-bold">{user.name}</p>
              <p className="text-xs text-slate-400">Toque para entrar</p>
            </div>
            <div className="ml-auto text-slate-300">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Dados salvos no servidor local
      </p>
    </div>
  );
}
