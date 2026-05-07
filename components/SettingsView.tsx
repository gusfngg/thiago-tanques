"use client";
import { useState } from "react";
import { AppState, User, Tank, UserId } from "@/lib/types";

interface Props {
  state: AppState;
  onUpdateUsers: (users: User[]) => void;
  onUpdateTanks: (tanks: Tank[]) => void;
  onClearHistory: () => void;
}

export default function SettingsView({ state, onUpdateUsers, onUpdateTanks, onClearHistory }: Props) {
  const [editingUser, setEditingUser] = useState<UserId | null>(null);
  const [editingTank, setEditingTank] = useState<string | null>(null);

  const updateUser = (userId: UserId, name: string, emoji: string) => {
    onUpdateUsers(state.users.map((u) => u.id === userId ? { ...u, name, emoji } : u));
    setEditingUser(null);
  };

  const updateTank = (tankId: string, patch: Partial<Tank>) => {
    onUpdateTanks(state.tanks.map((t) => t.id === tankId ? { ...t, ...patch } : t));
    setEditingTank(null);
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-8">
      {/* Sync status */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <p className="text-xs text-emerald-700 font-semibold">Sincronizado em tempo real com Firebase</p>
      </div>

      {/* Users */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Membros da Família</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {state.users.map((user) =>
            editingUser === user.id ? (
              <UserEditRow key={user.id} user={user}
                onSave={(name, emoji) => updateUser(user.id, name, emoji)}
                onCancel={() => setEditingUser(null)} />
            ) : (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: user.color + "20" }}>
                  {user.emoji}
                </div>
                <span className="flex-1 font-semibold text-slate-700">{user.name}</span>
                <button onClick={() => setEditingUser(user.id)}
                  className="text-xs text-cyan-600 font-bold px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors">
                  Editar
                </button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Tanks */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanques</h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {state.tanks.map((tank) =>
            editingTank === tank.id ? (
              <TankEditRow key={tank.id} tank={tank}
                onSave={(patch) => updateTank(tank.id, patch)}
                onCancel={() => setEditingTank(null)} />
            ) : (
              <div key={tank.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                  {tank.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{tank.name}</p>
                  <p className="text-xs text-slate-400">
                    {tank.species} · {tank.liters}L
                    {tank.fishCount ? ` · ${tank.fishCount} peixes` : ""}
                    {tank.avgWeightG ? ` · ${tank.avgWeightG}g/peixe` : ""}
                  </p>
                </div>
                <button onClick={() => setEditingTank(tank.id)}
                  className="text-xs text-cyan-600 font-bold px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors">
                  Editar
                </button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zona de Perigo</h2>
        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
          <button onClick={onClearHistory}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-semibold text-sm">Apagar Todo o Histórico</span>
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-slate-300">AquaControl v2.0 · Firebase Sync 🔥</p>
    </div>
  );
}

function UserEditRow({ user, onSave, onCancel }: { user: User; onSave: (n: string, e: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(user.name);
  const [emoji, setEmoji] = useState(user.emoji);
  return (
    <div className="px-4 py-3 bg-slate-50 fade-in space-y-2">
      <div className="flex gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="w-14 text-center text-xl border border-slate-200 rounded-lg px-2 py-1.5 bg-white" maxLength={2} />
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Nome do membro" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(name, emoji)} className="flex-1 py-1.5 text-sm font-bold bg-cyan-500 text-white rounded-lg">Salvar</button>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 rounded-lg hover:bg-slate-100">Cancelar</button>
      </div>
    </div>
  );
}

function TankEditRow({ tank, onSave, onCancel }: { tank: Tank; onSave: (patch: Partial<Tank>) => void; onCancel: () => void }) {
  const [name, setName] = useState(tank.name);
  const [species, setSpecies] = useState(tank.species);
  const [liters, setLiters] = useState(tank.liters.toString());
  const [emoji, setEmoji] = useState(tank.emoji);
  const [fishCount, setFishCount] = useState((tank.fishCount ?? "").toString());
  const [avgWeightG, setAvgWeightG] = useState((tank.avgWeightG ?? "").toString());

  const handleSave = () => {
    const fc = parseFloat(fishCount.replace(",", "."));
    const w = parseFloat(avgWeightG.replace(",", "."));
    onSave({
      name,
      species,
      liters: Number(liters),
      emoji,
      fishCount: Number.isFinite(fc) && fc > 0 ? Math.round(fc) : undefined,
      avgWeightG: Number.isFinite(w) && w > 0 ? w : undefined,
    });
  };

  return (
    <div className="px-4 py-3 bg-slate-50 fade-in space-y-2">
      <div className="flex gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="w-14 text-center text-xl border border-slate-200 rounded-lg px-2 py-1.5 bg-white" maxLength={2} />
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Nome do tanque" />
      </div>
      <div className="flex gap-2">
        <input value={species} onChange={(e) => setSpecies(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Espécie (ex: Tilápia)" />
        <input type="number" value={liters} onChange={(e) => setLiters(e.target.value)}
          className="w-20 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="L" />
      </div>
      <div className="flex gap-2">
        <input type="number" inputMode="numeric" min="0" step="1"
          value={fishCount} onChange={(e) => setFishCount(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Qtd. peixes" />
        <input type="number" inputMode="decimal" min="0" step="0.1"
          value={avgWeightG} onChange={(e) => setAvgWeightG(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-cyan-400"
          placeholder="Peso médio (g)" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 py-1.5 text-sm font-bold bg-cyan-500 text-white rounded-lg">Salvar</button>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 rounded-lg hover:bg-slate-100">Cancelar</button>
      </div>
    </div>
  );
}
