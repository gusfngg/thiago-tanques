"use client";
import { useState, useEffect, useCallback } from "react";
import { AppState, UserId, CheckEntry, SharedState } from "@/lib/types";
import { getDefaultSharedState } from "@/lib/defaults";
import { getTodayEntries } from "@/lib/store";
import {
  clearHistory,
  createEntry,
  fetchSharedState,
  updateTank,
  updateUser,
} from "@/lib/api-client";
import UserSelector from "@/components/UserSelector";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TanksView from "@/components/TanksView";
import HistoryView from "@/components/HistoryView";
import ReportView from "@/components/ReportView";
import SettingsView from "@/components/SettingsView";

type Tab = "tanks" | "history" | "report" | "settings";

const ACTIVE_USER_STORAGE_KEY = "aqua_control_active_user";
const SYNC_INTERVAL_MS = 2_000;

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tanks");
  const [mounted, setMounted] = useState(false);

  const applySharedState = useCallback((sharedState: SharedState) => {
    setState((currentState) => {
      const activeUserId = currentState?.activeUserId ?? readStoredActiveUser();
      return toAppState(sharedState, activeUserId);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const sharedState = await fetchSharedState();
        if (cancelled) return;
        setState(toAppState(sharedState, readStoredActiveUser()));
      } catch (error) {
        console.error("Initial sync failed", error);
        if (cancelled) return;
        setState(toAppState(getDefaultSharedState(), readStoredActiveUser()));
      } finally {
        if (!cancelled) {
          setMounted(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const syncFromServer = useCallback(async () => {
    const sharedState = await fetchSharedState();
    applySharedState(sharedState);
  }, [applySharedState]);

  useEffect(() => {
    if (!mounted) return;

    const intervalId = window.setInterval(() => {
      void syncFromServer().catch(() => {
        // Keep quiet while polling; next cycle retries.
      });
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mounted, syncFromServer]);

  const handleLogin = (userId: UserId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
    }

    setState((currentState) =>
      currentState ? { ...currentState, activeUserId: userId } : currentState
    );
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }

    setState((currentState) =>
      currentState ? { ...currentState, activeUserId: null } : currentState
    );
    setActiveTab("tanks");
  };

  const handleCheck = async (
    tankId: string,
    taskId: string,
    value?: string,
    notes?: string
  ) => {
    if (!state?.activeUserId) return;

    const entry: CheckEntry = {
      id: crypto.randomUUID(),
      userId: state.activeUserId,
      tankId,
      taskId: taskId as CheckEntry["taskId"],
      completedAt: new Date().toISOString(),
      ...(value ? { value } : {}),
      ...(notes ? { notes } : {}),
    };

    try {
      const sharedState = await createEntry(entry);
      applySharedState(sharedState);
    } catch (error) {
      reportMutationError("Não foi possível salvar essa tarefa agora.", error);
    }
  };

  const handleUpdateUser = async (userId: UserId, name: string, emoji: string) => {
    try {
      const sharedState = await updateUser(userId, name, emoji);
      applySharedState(sharedState);
    } catch (error) {
      reportMutationError("Não foi possível atualizar o membro.", error);
      throw error;
    }
  };

  const handleUpdateTank = async (
    tankId: string,
    name: string,
    species: string,
    liters: number,
    emoji: string
  ) => {
    try {
      const sharedState = await updateTank(tankId, name, species, liters, emoji);
      applySharedState(sharedState);
    } catch (error) {
      reportMutationError("Não foi possível atualizar o tanque.", error);
      throw error;
    }
  };

  const handleClearHistory = async () => {
    try {
      const sharedState = await clearHistory();
      applySharedState(sharedState);
    } catch (error) {
      reportMutationError("Não foi possível limpar o checklist de hoje agora.", error);
      throw error;
    }
  };

  const handleClearTankHistory = async (tankId: string) => {
    try {
      const sharedState = await clearHistory(tankId);
      applySharedState(sharedState);
    } catch (error) {
      reportMutationError("Não foi possível limpar os dados desse tanque agora.", error);
      throw error;
    }
  };

  if (!mounted || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🐠</div>
      </div>
    );
  }

  if (!state.activeUserId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cyan-50/50 to-white">
        <UserSelector
          users={state.users}
          onSelect={handleLogin}
        />
      </main>
    );
  }

  const activeUser = state.users.find((u) => u.id === state.activeUserId)!;
  const todayEntries = getTodayEntries(state.entries);
  const totalPossible = state.tanks.length * state.tasks.length;
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
            onCheck={handleCheck}
            onClearTankHistory={handleClearTankHistory}
          />
        )}
        {activeTab === "history" && <HistoryView state={state} />}
        {activeTab === "report" && <ReportView state={state} />}
        {activeTab === "settings" && (
          <SettingsView
            state={state}
            onUpdateUser={handleUpdateUser}
            onUpdateTank={handleUpdateTank}
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

function toAppState(sharedState: SharedState, activeUserId: UserId | null): AppState {
  return {
    ...sharedState,
    activeUserId,
  };
}

function readStoredActiveUser(): UserId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  if (raw === "user1" || raw === "user2" || raw === "user3") {
    return raw;
  }

  return null;
}

function reportMutationError(message: string, error: unknown): void {
  console.error(message, error);
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}
