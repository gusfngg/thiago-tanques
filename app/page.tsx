"use client";
import { useState, useEffect, useCallback } from "react";
import { AppState, UserId, CheckEntry, User, Tank } from "@/lib/types";
import {
  getDefaultState,
  loadActiveUser,
  saveActiveUser,
  getTodayEntries,
  DEFAULT_TASKS,
} from "@/lib/store";
import {
  subscribeEntries,
  subscribeUsers,
  subscribeTanks,
  addEntry,
  saveUsers,
  saveTanks,
  clearEntries,
  initFirebaseDefaults,
} from "@/lib/db";
import UserSelector from "@/components/UserSelector";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TanksView from "@/components/TanksView";
import HistoryView from "@/components/HistoryView";
import ReportView from "@/components/ReportView";
import SettingsView from "@/components/SettingsView";

type Tab = "tanks" | "history" | "report" | "settings";

export default function Home() {
  const [state, setState] = useState<AppState>(() => ({
    ...getDefaultState(),
    activeUserId: null,
  }));
  const [activeTab, setActiveTab] = useState<Tab>("tanks");
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(true);

  // Boot: load active user from localStorage + init Firebase + subscribe
  useEffect(() => {
    const defaults = getDefaultState();

    // Init Firebase with defaults if first time
    initFirebaseDefaults(defaults).catch(console.error);

    // Restore active user from localStorage (per device)
    const savedUser = loadActiveUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, activeUserId: savedUser }));

    // Subscribe to real-time data
    const unsub1 = subscribeEntries((entries) => {
      setState((s) => ({ ...s, entries }));
      setSyncing(false);
    });
    const unsub2 = subscribeUsers((users) => {
      setState((s) => ({ ...s, users }));
    });
    const unsub3 = subscribeTanks((tanks) => {
      setState((s) => ({ ...s, tanks }));
    });

    setMounted(true);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const handleLogin = (userId: UserId) => {
    saveActiveUser(userId);
    setState((s) => ({ ...s, activeUserId: userId }));
  };

  const handleLogout = () => {
    saveActiveUser(null);
    setState((s) => ({ ...s, activeUserId: null }));
    setActiveTab("tanks");
  };

  const handleCheck = async (
    tankId: string,
    taskId: string,
    value?: string,
    notes?: string
  ) => {
    if (!state.activeUserId) return;
    const entry: CheckEntry = {
      id: crypto.randomUUID(),
      userId: state.activeUserId,
      tankId,
      taskId: taskId as CheckEntry["taskId"],
      completedAt: new Date().toISOString(),
      ...(value ? { value } : {}),
      ...(notes ? { notes } : {}),
    };
    // Optimistic update locally, then persist to Firebase
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
    await addEntry(entry);
  };

  const handleUpdateUsers = async (users: User[]) => {
    setState((s) => ({ ...s, users }));
    await saveUsers(users);
  };

  const handleUpdateTanks = async (tanks: Tank[]) => {
    setState((s) => ({ ...s, tanks }));
    await saveTanks(tanks);
  };

  const handleUpdateTankPatch = async (tankId: string, patch: Partial<Tank>) => {
    const next = state.tanks.map((t) => (t.id === tankId ? { ...t, ...patch } : t));
    setState((s) => ({ ...s, tanks: next }));
    await saveTanks(next);
  };

  const handleClearHistory = async () => {
    if (!confirm("Apagar todo o histórico de tarefas? Esta ação não pode ser desfeita.")) return;
    setState((s) => ({ ...s, entries: [] }));
    await clearEntries();
  };

  // Loading screen
  if (!mounted || syncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="text-5xl animate-pulse">🐠</div>
        <p className="text-sm text-slate-400 font-semibold">Conectando ao banco de dados...</p>
      </div>
    );
  }

  // User selector screen
  if (!state.activeUserId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cyan-50/60 to-white">
        <UserSelector
          users={state.users}
          activeUserId={state.activeUserId}
          onSelect={handleLogin}
        />
      </main>
    );
  }

  const activeUser = state.users.find((u) => u.id === state.activeUserId)!;
  const todayEntries = getTodayEntries(state.entries);
  const totalPossible = state.tanks.length * DEFAULT_TASKS.length;
  const pendingCount = Math.max(0, totalPossible - todayEntries.length);

  const tabTitles: Record<Tab, string> = {
    tanks: "Tanques",
    history: "Histórico",
    report: "Relatório do Dia",
    settings: "Configurações",
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      <Header
        user={activeUser}
        onLogout={handleLogout}
        todayCount={todayEntries.length}
        totalTasks={totalPossible}
      />

      {activeTab !== "tanks" && (
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-lg font-bold text-slate-800">{tabTitles[activeTab]}</h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "tanks" && (
          <TanksView
            state={state}
            activeUserId={state.activeUserId}
            onCheck={handleCheck}
            onUpdateTank={handleUpdateTankPatch}
          />
        )}
        {activeTab === "history" && <HistoryView state={state} />}
        {activeTab === "report"  && <ReportView  state={state} />}
        {activeTab === "settings" && (
          <SettingsView
            state={state}
            onUpdateUsers={handleUpdateUsers}
            onUpdateTanks={handleUpdateTanks}
            onClearHistory={handleClearHistory}
          />
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        pendingCount={pendingCount}
      />
    </main>
  );
}
