import { ArrowDownToLine, CheckCircle2, Upload } from "lucide-react";
import { useState } from "react";

import { WorkspaceSettings } from "@/components/planner/workspace";
import { type AppData, type Preferences } from "@/lib/planner";

export function SettingsView({
  data,
  onChange,
  onExport,
  onReset,
  onPreferences,
  onImport,
}: {
  data: AppData;
  onChange: (name: string) => void;
  onExport: () => void;
  onReset: () => void;
  onPreferences: (patch: Partial<Preferences>) => void;
  onImport: (file: File) => void;
}) {
  const [name, setName] = useState(data.name);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            YOUR SPACE, YOUR WAY
          </div>
          <h1>
            Settings<span className="period">.</span>
          </h1>
          <p className="lead">A few details to make this workspace feel like yours.</p>
        </div>
      </div>
      <div className="settings-stack">
        <section className="panel privacy-panel">
          <div className="privacy-emblem">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="eyebrow">NO ACCOUNT. YOUR OWN SPACE.</span>
            <h2>Personal by default.</h2>
            <p>
              Your event details, guests, budgets, and notes stay in this browser profile. Kivora
              does not upload them to a shared database or make them public. No sign-in is needed.
            </p>
            <ul>
              <li>Each browser profile has its own separate workspace.</li>
              <li>Anyone using this same profile on this device can see these plans.</li>
              <li>
                Clearing browser data removes your workspace. Private browsing may erase it when the
                session ends.
              </li>
              <li>
                Backup files contain your planning details. Store and share them thoughtfully.
              </li>
            </ul>
          </div>
        </section>
        <WorkspaceSettings preferences={data.preferences} onChange={onPreferences} />
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Your profile</h2>
            <p>Your name is saved on this device.</p>
          </div>
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              onChange(name.trim() || "Planner");
            }}
          >
            <label className="field-label">
              Display name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </label>
            <button className="button button-dark">Save changes</button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Your data</h2>
            <p>Your plans are stored on this device. Export a copy before deleting your events.</p>
          </div>
          <div className="settings-buttons">
            <button className="button button-light" onClick={onExport}>
              <ArrowDownToLine size={16} />
              Download backup
            </button>
            <label className="button button-light upload-button">
              <Upload size={16} />
              Restore backup
              <input
                type="file"
                accept=".json,application/json"
                aria-label="Restore workspace backup"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="storage-count">
              {data.events.length} event{data.events.length === 1 ? "" : "s"} saved
            </span>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Clear local workspace</h2>
            <p>Remove all event data saved on this browser.</p>
          </div>
          <button className="button button-danger" onClick={onReset}>
            Clear local workspace
          </button>
        </section>
        <div className="local-warning">
          <span className="local-dot" />
          Saved in this browser only. Download backups regularly to keep a portable copy of your
          plans. No account or shared access is enabled.
        </div>
      </div>
    </>
  );
}
