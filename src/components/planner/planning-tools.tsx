import { usePlannerFormatting } from "@/hooks/use-planner-formatting";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Heart,
  Lightbulb,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import { type EventPlan, localDate } from "@/lib/planner";

import { type Section } from "@/lib/planner-navigation";
export function CopilotView({
  event,
  events,
  onChoose,
  onCreateTask,
  generated,
  onGenerated,
  onCreateEvent,
}: {
  event?: EventPlan | undefined;
  events: EventPlan[];
  onChoose: (id: string, tab?: Section) => void;
  onCreateTask: (eventId: string, title: string, due: string, category: string) => void;
  generated: boolean;
  onGenerated: () => void;
  onCreateEvent: () => void;
}) {
  const { formatMoney, niceDate } = usePlannerFormatting();
  const [selected, setSelected] = useState(event?.id || "");
  const [interest, setInterest] = useState("");
  const chosen = events.find((e) => e.id === selected) || event;
  const suggestions = useMemo(() => {
    if (!chosen) return [];
    const daysLeft = chosen.date
      ? Math.max(
          1,
          Math.ceil((new Date(`${chosen.date}T12:00:00`).getTime() - Date.now()) / 86400000),
        )
      : 120;
    const early = daysLeft > 120;
    const eventType = chosen.type.toLowerCase();
    const list = eventType.includes("wedding")
      ? [
          "Set a comfortable total budget",
          "Start a guest list and agree on a first draft",
          "Research ceremony and reception venues",
          "Decide what matters most to you as a couple",
          "Collect quotes for food, photography, and music",
        ]
      : eventType.includes("birthday")
        ? [
            "Set a guest count and choose a date",
            "Pick a place that fits the kind of gathering you want",
            "Plan food and drinks around your guests",
            "Choose one personal detail to make it feel special",
            "Confirm setup, music, and day-of helpers",
          ]
        : [
            "Clarify the purpose and shape of the gathering",
            "Choose a date, location, and weather backup",
            "Estimate attendance and accessibility needs",
            "Coordinate volunteers and event-day roles",
            "Plan food, supplies, and cleanup",
          ];
    if (interest) list.unshift(`Make room for: ${interest}`);
    return early
      ? list
      : list
          .slice(0, 4)
          .map((item) => item.replace("Start a guest list", "Confirm the guest list"));
  }, [chosen, interest]);
  return (
    <>
      <div className="copilot-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />A THOUGHTFUL START, NOT A FINAL ANSWER
          </div>
          <h1>
            Let’s find your
            <br className="mobile-only" /> starting point<span className="period">.</span>
          </h1>
          <p className="lead">
            A few good questions can turn a big idea into a plan you can work with.
          </p>
        </div>
        <div className="copilot-orb">
          <Sparkles size={34} strokeWidth={1.2} />
        </div>
      </div>
      <div className="copilot-layout">
        <section className="panel copilot-form">
          <div className="panel-heading">
            <div>
              <div className="eyebrow small-eyebrow">YOUR PLANNING BRIEF</div>
              <h2>What are we celebrating?</h2>
            </div>
          </div>
          <label className="field-label">
            Choose an event
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                onGenerated();
              }}
            >
              <option value="">Choose an event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.type}
                </option>
              ))}
            </select>
          </label>
          {!events.length && (
            <div className="inline-empty">
              <button className="text-button" onClick={onCreateEvent}>
                Create an event first <ArrowRight size={14} />
              </button>
            </div>
          )}
          <label className="field-label">
            What matters most to you?
            <span className="field-hint">
              A feeling, a practical concern, or something you want people to remember
            </span>
            <textarea
              rows={3}
              placeholder="A relaxed garden dinner where everyone feels at home…"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />
          </label>
          {chosen && (
            <div className="brief-facts">
              <span>
                <CalendarDays size={15} />
                {niceDate(chosen.date)}
              </span>
              <span>
                <Users size={15} />
                {chosen.guests || "Guest count TBD"}
              </span>
              <span>
                <Wallet size={15} />
                {chosen.budget ? formatMoney(chosen.budget, chosen.currency) : "Budget TBD"}
              </span>
            </div>
          )}
          <button
            className="button button-dark full-button"
            disabled={!chosen}
            onClick={onGenerated}
          >
            <Sparkles size={16} />
            {generated ? "Refresh planning ideas" : "Find my starting point"}
          </button>
          <p className="fine-print">
            Suggestions are generated from simple planning prompts in your browser. This is not
            connected to an AI model and should be reviewed for your situation.
          </p>
        </section>
        <section className="panel suggestions-panel">
          <div className="eyebrow small-eyebrow">A FIRST DRAFT, JUST FOR YOU</div>
          {generated && chosen ? (
            <>
              <h2>Somewhere to begin.</h2>
              <p className="suggestions-intro">
                A manageable starting list for <b>{chosen.name}</b>. Adjust dates, priorities, and
                estimates as you go.
              </p>
              <div className="suggestion-list">
                {suggestions.map((s, i) => (
                  <div className="suggestion" key={`${s}-${i}`}>
                    <span className="suggestion-num">0{i + 1}</span>
                    <span>{s}</span>
                    <button
                      aria-label={`Add ${s} to tasks`}
                      title="Add to timeline"
                      disabled={chosen.tasks.some((t) => t.title === s)}
                      onClick={() => {
                        onCreateTask(chosen.id, s, "", "Copilot suggestion");
                      }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="assumption-box">
                <Lightbulb size={16} />
                <span>
                  Start with what you know. This draft does not include real vendor prices,
                  availability, or legal requirements.
                </span>
              </div>
              <button
                className="button button-light"
                onClick={() => onChoose(chosen.id, "Timeline & tasks")}
              >
                Review your timeline <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <div className="suggestions-empty">
              <div className="sparkle-art">
                <Sparkles size={24} />
              </div>
              <h3>Your next steps will feel clearer.</h3>
              <p>
                Choose an event, share what matters to you, and we’ll shape a starter list that you
                can make your own.
              </p>
              <div className="copilot-steps">
                <span>
                  <i>1</i> Choose the celebration
                </span>
                <span>
                  <i>2</i> Share what matters
                </span>
                <span>
                  <i>3</i> Shape your plan
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function InspirationHub({
  events,
  onChoose,
  onAdd,
}: {
  events: EventPlan[];
  onChoose: (id: string, tab: Section) => void;
  onAdd: () => void;
}) {
  const allNotes = events.flatMap((e) => e.notes.map((n) => ({ ...n, event: e })));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            COLLECT THE DETAILS
          </div>
          <h1>
            Inspiration studio<span className="period">.</span>
          </h1>
          <p className="lead">
            Hold on to the colors, words, and little things that make it feel like yours.
          </p>
        </div>
        <button className="button button-dark" onClick={onAdd}>
          <Plus size={16} />
          Save an idea
        </button>
      </div>
      <div className="inspo-feature">
        <div className="inspo-quote">
          “The best celebrations feel
          <br /> like the people in them.”<span>Make space for your own kind of magic.</span>
        </div>
        <div className="inspo-shapes">
          <span className="shape shape-1" />
          <span className="shape shape-2" />
          <span className="shape shape-3" />
          <span className="shape shape-4" />
        </div>
      </div>
      {allNotes.length ? (
        <div className="hub-note-grid">
          {allNotes.map((n) => (
            <button
              className="hub-note"
              key={n.id}
              onClick={() => onChoose(n.event.id, "Inspiration")}
            >
              <span>
                {n.kind} · {n.event.name}
              </span>
              <b>{n.title}</b>
              <small>{n.text}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel empty-inspo">
          <Heart size={23} />
          <h2>Collect what feels like you.</h2>
          <p>
            Save a mood, a detail, or an idea in an event’s Inspiration tab. Your notes stay here on
            this device.
          </p>
          <button className="button button-light" onClick={onAdd}>
            Start a collection <ArrowRight size={15} />
          </button>
        </div>
      )}
    </>
  );
}
export function Notifications({
  events,
  onEvent,
}: {
  events: EventPlan[];
  onEvent: (id: string) => void;
}) {
  const { niceDate } = usePlannerFormatting();
  const due = events.flatMap((e) =>
    e.tasks.filter((t) => !t.done && t.due && t.due < localDate()).map((t) => ({ e, t })),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />A QUIET CHECK-IN
          </div>
          <h1>
            Notifications<span className="period">.</span>
          </h1>
          <p className="lead">Helpful reminders from the plans you’ve saved here.</p>
        </div>
      </div>
      <section className="panel notification-panel">
        {due.length ? (
          due.map(({ e, t }) => (
            <button
              className="notification-row"
              key={`${e.id}-${t.id}`}
              onClick={() => onEvent(e.id)}
            >
              <span className="notification-icon">
                <Bell size={17} />
              </span>
              <span>
                <b>{t.title} is past its planned date</b>
                <small>
                  {e.name} · Due {niceDate(t.due)}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))
        ) : (
          <div className="empty-state compact">
            <CheckCircle2 size={27} />
            <h3>All quiet for now.</h3>
            <p>
              Overdue open tasks will show up here. We won’t send notifications outside this
              browser.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
