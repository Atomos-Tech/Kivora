import { ArrowRight, Search, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { type AppData, type EventPlan } from "@/lib/planner";
import { type Section, type View } from "@/lib/planner-navigation";
import { Modal } from "./forms";

type SearchResult = { id: string; title: string; section: Section; event: EventPlan };

function findResults(events: EventPlan[], query: string): SearchResult[] {
  const term = query.toLowerCase().trim();
  return events
    .flatMap((event): SearchResult[] => [
      { id: event.id, title: event.name, section: "Overview", event },
      ...event.tasks.map((item) => ({
        id: item.id,
        title: item.title,
        section: "Timeline & tasks" as const,
        event,
      })),
      ...event.guestsList.map((item) => ({
        id: item.id,
        title: item.name,
        section: "Guests" as const,
        event,
      })),
      ...event.vendors.map((item) => ({
        id: item.id,
        title: item.name,
        section: "Vendors" as const,
        event,
      })),
      ...event.notes.map((item) => ({
        id: item.id,
        title: item.title,
        section: "Inspiration" as const,
        event,
      })),
      ...event.budgetItems.map((item) => ({
        id: item.id,
        title: item.title,
        section: "Budget" as const,
        event,
      })),
    ])
    .filter((result) =>
      `${result.title} ${result.event.name} ${result.event.location}`.toLowerCase().includes(term),
    );
}

export function SearchDialog({
  events,
  nav,
  onClose,
  onNavigate,
  onOpen,
}: {
  events: AppData["events"];
  nav: { label: View; icon: LucideIcon }[];
  onClose: () => void;
  onNavigate: (view: View) => void;
  onOpen: (id: string, section: Section) => void;
}) {
  const [query, setQuery] = useState("");
  const results = query.trim() ? findResults(events, query) : [];
  return (
    <Modal title="Find your next step" onClose={onClose}>
      <label className="command-input">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search workspace records"
          placeholder="Events, tasks, guests, vendors, ideas…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="command-results">
        {!query.trim() ? (
          <>
            <span className="eyebrow">QUICK ACTIONS</span>
            {nav.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  onNavigate(label);
                  onClose();
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </>
        ) : results.length ? (
          <>
            <span className="eyebrow">{results.length} RESULTS</span>
            {results.slice(0, 30).map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onOpen(result.event.id, result.section);
                  onClose();
                }}
              >
                <Search size={16} />
                <span>
                  <b>{result.title}</b>
                  <small>
                    {result.event.name} · {result.section}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </>
        ) : (
          <div className="command-empty">
            <Search size={28} />
            <h3>No matches yet</h3>
            <p>Try an event name, a person, or a planning detail.</p>
          </div>
        )}
      </div>
      <p className="fine-print">
        Use Tab to move through results, Enter to open, and Escape to close.
      </p>
    </Modal>
  );
}
