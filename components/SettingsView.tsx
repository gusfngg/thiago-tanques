"use client";
import { useState } from "react";
import { AppState, User, Tank, UserId } from "@/lib/types";

interface Props {
  state: AppState;
  onUpdateUser: (userId: UserId, name: string, emoji: string) => Promise<void>;
  onUpdateTank: (
    tankId: string,
    name: string,
    species: string,
    liters: number,
    emoji: string
  ) => Promise<void>;
  onClearHistory: () => Promise<void>;
}

export default function SettingsView({
  state,
  onUpdateUser,
  onUpdateTank,
  onClearHistory,
}: Props) {
  const [editingUser, setEditingUser] = useState<UserId | null>(null);
  const [editingTank, setEditingTank] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateUser = async (userId: UserId, name: string, emoji: string) => {
    setSaving(true);
    try {
      await onUpdateUser(userId, name, emoji);
      setEditingUser(null);
    } finally {
      setSaving(false);
    }
  };

  const updateTank = async (
    tankId: string,
    name: string,
    species: string,
    liters: number,
    emoji: string
  ) => {
    setSaving(true);
    try {
      await onUpdateTank(tankId, name, species, liters, emoji);
      setEditingTank(null);
    } finally {
      setSaving(false);
    }
  };

  const clearHistory = async () => {
    if (
      confirm(
        "Limpar apenas o checklist de hoje? Configurações e histórico de outros dias serão mantidos."
      )
    ) {
      setSaving(true);
      try {
        await onClearHistory();
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-8">
      {/* Users section */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Membros da Família</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {state.users.map((user) =>
            editingUser === user.id ? (
              <UserEditRow
                key={user.id}
                user={user}
                onSave={(name, emoji) => updateUser(user.id, name, emoji)}
                onCancel={() => setEditingUser(null)}
                disabled={saving}
              />
            ) : (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: user.color + "20" }}
                >
                  {user.emoji}
                </div>
                <span className="flex-1 font-semibold text-slate-700">{user.name}</span>
                <button
                  onClick={() => setEditingUser(user.id)}
                  disabled={saving}
                  className="text-xs text-cyan-600 font-bold px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Tanks section */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanques</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {state.tanks.map((tank) =>
            editingTank === tank.id ? (
              <TankEditRow
                key={tank.id}
                tank={tank}
                onSave={(n, s, l, e) => updateTank(tank.id, n, s, l, e)}
                onCancel={() => setEditingTank(null)}
                disabled={saving}
              />
            ) : (
              <div key={tank.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                  {tank.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{tank.name}</p>
                  <p className="text-xs text-slate-400">{tank.species} · {tank.liters}L</p>
                </div>
                <button
                  onClick={() => setEditingTank(tank.id)}
                  disabled={saving}
                  className="text-xs text-cyan-600 font-bold px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Checklist do Dia</h2>
        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
          <button
            onClick={() => void clearHistory()}
            disabled={saving}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-semibold text-sm">Limpar Checklist de Hoje</span>
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-slate-300">Thiago v1.0 · Feito com 🐠</p>
    </div>
  );
}

// Sub-components for editing

function UserEditRow({
  user, onSave, onCancel, disabled,
}: {
  user: User;
  onSave: (name: string, emoji: string) => Promise<void>;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [name, setName] = useState(user.name);
  const [emoji, setEmoji] = useState(user.emoji);
  return (
    <div className="px-4 py-3 bg-slate-50 fade-in space-y-2">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          disabled={disabled}
          className="w-14 text-center text-xl border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          maxLength={2}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Nome do membro"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => void onSave(name, emoji)}
          disabled={disabled}
          className="flex-1 py-1.5 text-sm font-bold bg-cyan-500 text-white rounded-lg"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="px-3 py-1.5 text-sm text-slate-400 rounded-lg hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TankEditRow({
  tank, onSave, onCancel, disabled,
}: {
  tank: Tank;
  onSave: (name: string, species: string, liters: number, emoji: string) => Promise<void>;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [name, setName] = useState(tank.name);
  const [species, setSpecies] = useState(tank.species);
  const [liters, setLiters] = useState(tank.liters.toString());
  const [emoji, setEmoji] = useState(tank.emoji);
  return (
    <div className="px-4 py-3 bg-slate-50 fade-in space-y-2">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          disabled={disabled}
          className="w-14 text-center text-xl border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          maxLength={2}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Nome do tanque"
        />
      </div>
      <div className="flex gap-2">
        <input
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          disabled={disabled}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Espécie"
        />
        <input
          type="number"
          value={liters}
          onChange={(e) => setLiters(e.target.value)}
          disabled={disabled}
          className="w-20 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="L"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => void onSave(name, species, Number(liters), emoji)}
          disabled={disabled}
          className="flex-1 py-1.5 text-sm font-bold bg-cyan-500 text-white rounded-lg"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="px-3 py-1.5 text-sm text-slate-400 rounded-lg hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
