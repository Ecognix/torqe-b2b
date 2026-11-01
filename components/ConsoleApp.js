"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "../components/Logo";
import Logo from "../components/Logo";
import TorqeChat from "./torqe-chat/TorqeChat";
import { activities, approvals as initialApprovals, conversations as initialConversations, integrations as initialIntegrations, navItems } from "../lib/data";

const iconPaths = {
  activity: "M3 12h4l3-8 4 16 3-8h4",
  arrow: "M5 12h14m-7-7 7 7-7 7",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
  chevron: "m9 18 6-6-6-6",
  close: "m18 6-12 12M6 6l12 12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 16h8m-8 4h8",
  grid: "M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z",
  inbox: "M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Zm0 0 2 8h3l2 3 2-3h3l2-8",
  lock: "M5 11h14v10H5zm3 0V7a4 4 0 0 1 8 0v4",
  menu: "M4 6h16M4 12h16M4 18h16",
  message: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
  more: "M12 5h.01M12 12h.01M12 19h.01",
  pause: "M7 5h3v14H7zm7 0h3v14h-3z",
  plug: "M12 22v-5m-5-4V2m10 11V2M5 7h14m-9 5h4a3 3 0 0 1 3 3v2a5 5 0 0 1-10 0v-2a3 3 0 0 1 3-3Z",
  search: "m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  send: "m22 2-7 20-4-9-9-4Zm0 0L11 13",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3m10-10h-3M5 12H2m17.1-7.1L17 7m-10 10-2.1 2.1m14.2 0L17 17m-10-10L4.9 4.9",
  shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-4-11 3 3 5-6",
  spark: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
  trend: "m3 17 6-6 4 4 8-8m-6 0h6v6",
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name] || iconPaths.spark} />
    </svg>
  );
}

function exportCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function ChannelMark({ type }) {
  const icons = {
    whatsapp: "/icons/channel-whatsapp.svg",
    gmail: "/icons/channel-gmail.svg",
    outlook: "/icons/channel-outlook.svg",
    linkedin: "/icons/channel-linkedin.svg",
  };
  return <span className={`channel-mark channel-${type}`} aria-label={type}>{icons[type] ? <img src={icons[type]} alt="" /> : "T"}</span>;
}

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`status-pill status-${tone}`}><i />{children}</span>;
}

function Avatar({ initials, color = "lavender", small = false }) {
  return <span className={`person-avatar avatar-${color} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

function IntegrationLogo({ integration }) {
  return (
    <span className="integration-logo">
      {integration.iconSrc ? <img src={integration.iconSrc} alt="" /> : integration.icon}
    </span>
  );
}

const viewTitles = {
  overview: ["Good morning, Alex", "Here’s what’s happening across your inbound today."],
  inbox: ["Live inbox", "Every conversation, channel, and handoff in one place."],
  approvals: ["Approvals", "Review the decisions that need a human in the loop."],
  activity: ["Activity log", "A clear record of every agent decision and action."],
  automations: ["Agent controls", "Set the boundaries for what Torqe can do on its own."],
  knowledge: ["Knowledge base", "Ground answers in your team's trusted source material."],
  integrations: ["Integrations", "Connect the tools and channels your team already uses."],
  settings: ["Workspace settings", "Manage access, data connections, and workspace preferences."],
};

export default function ConsoleApp() {
  const [authorized, setAuthorized] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ supabase: { configured: false }, model: { configured: false } });
  const [activePage, setActivePage] = useState("overview");
  const [activeConversation, setActiveConversation] = useState("c1");
  const [conversations, setConversations] = useState(initialConversations);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [autopilot, setAutopilot] = useState(false);
  const [pausedIds, setPausedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState("all");
  const [inboxChannel, setInboxChannel] = useState("all");
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState("");
  const [integrationInfo, setIntegrationInfo] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [instructions, setInstructions] = useState("You are Torqe, a thoughtful B2B sales operations agent. Be accurate, concise, and helpful. Use only approved company knowledge. Never invent pricing, legal terms, product capabilities, or customer commitments. Ask for human approval before discounts, contract changes, security exceptions, or any action with external impact.");
  const [instructionsSaved, setInstructionsSaved] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const knowledgeInputRef = useRef(null);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    let active = true;
    fetch("/api/console/access", { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ data }) => {
        if (!active) return;
        setAuthorized(Boolean(data.authorized));
        if (data.authorized) {
          fetch("/api/console/status", { cache: "no-store" })
            .then((response) => response.ok ? response.json() : null)
            .then((result) => { if (active && result) setStatus(result); })
            .catch(() => { if (active) setToast("Could not check workspace connection status."); });
        }
      })
      .catch(() => { if (active) { setAuthorized(false); setAccessError("Could not verify your invitation. Check your connection and try again."); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("torqe-console-agent-instructions");
      if (saved) {
        setInstructions(saved);
        setInstructionsSaved(true);
      }
    } catch {
      setInstructionsSaved(false);
      setToast("Could not read saved instructions from this browser.");
    }
  }, []);

  const filteredConversations = useMemo(() => conversations.filter((item) => {
    const matchesSearch = `${item.name} ${item.company} ${item.preview}`.toLowerCase().includes(search.toLowerCase());
    const matchesReview = inboxFilter !== "review" || item.status === "Needs review";
    const matchesChannel = inboxChannel === "all" || item.channelKey === inboxChannel;
    return matchesSearch && matchesReview && matchesChannel;
  }), [conversations, inboxChannel, inboxFilter, search]);
  const pendingCount = approvals.filter((item) => item.status === "pending").length;
  const title = viewTitles[activePage] || viewTitles.overview;

  async function enterWorkspace(event) {
    event.preventDefault();
    setSubmitting(true);
    setAccessError("");
    try {
      const response = await fetch("/api/console/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not verify that invitation.");
      setAuthorized(true);
      setAccessCode("");
      const statusResponse = await fetch("/api/console/status", { cache: "no-store" });
      if (statusResponse.ok) setStatus(await statusResponse.json());
    } catch (error) {
      setAccessError(error.message || "Could not verify that invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    await fetch("/api/console/access", { method: "DELETE" });
    setAuthorized(false);
    setActivePage("overview");
  }

  function showToast(message) {
    setToast(message);
  }

  function togglePause(id) {
    setPausedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reviewApproval(id, nextStatus) {
    setApprovals((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    showToast(nextStatus === "approved" ? "Preview: approval recorded." : "Preview: request sent back for changes.");
  }

  function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    setConversations((items) => items.map((item) => item.id === activeConversation
      ? { ...item, preview: reply.trim(), messages: [...(item.messages || []), { from: "human", text: reply.trim(), time: "Now" }] }
      : item));
    setReply("");
    showToast("Preview only — connect a messaging channel to send replies.");
  }

  if (authorized === null) {
    return <div className="console-loading"><span className="console-loader" /><span>Opening your workspace</span></div>;
  }

  if (!authorized) {
    return (
      <div className="console-access">
        <div className="access-brand"><Wordmark size={29} /><span className="access-divider" /><span className="access-console-label">Console</span></div>
        <div className="access-card">
          <div className="access-symbol"><Icon name="lock" size={22} /></div>
          <p className="console-eyebrow">PRIVATE WORKSPACE</p>
          <h1>Your team, in control.</h1>
          <p className="access-description">The Torqe Console is available to invited team members. Enter your workspace invitation to continue.</p>
          <form onSubmit={enterWorkspace} className="access-form">
            <label htmlFor="console-code">Invitation code</label>
            <input id="console-code" type="password" autoComplete="one-time-code" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Enter your invitation code" required />
            {accessError && <p className="access-error" role="alert">{accessError}</p>}
            <button type="submit" className="console-primary-button access-submit" disabled={submitting}>{submitting ? "Verifying…" : "Continue"}<Icon name="arrow" size={16} /></button>
          </form>
          <div className="access-footnote"><Icon name="shield" size={15} /> Invite-only access · Sessions expire after 8 hours</div>
        </div>
        <p className="access-help">Need access? <a href="mailto:hello@torqe.ai?subject=Torqe%20Console%20access">Ask your workspace administrator</a></p>
        <div className="access-bottom">TORQE <span>·</span> THE INBOUND EXECUTION SYSTEM</div>
      </div>
    );
  }

  return (
    <div className="console-app">
      <aside className={`console-sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Wordmark size={27} white />
          <span className="console-wordmark-label">CONSOLE</span>
          <button className="sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <button className="workspace-picker" onClick={() => showToast("You’re viewing the Torqe preview workspace.")}>
          <span className="workspace-mark">T</span>
          <span className="workspace-meta"><strong>Torqe workspace</strong><small>Internal team</small></span>
          <Icon name="chevron" size={15} className="workspace-chevron" />
        </button>
        <nav className="console-nav" aria-label="Console navigation">
          {navItems.map((item, index) => (
            <div key={item.id}>
              {item.section && <p className={`nav-section-label ${index ? "nav-section-spaced" : ""}`}>{item.section}</p>}
              <button className={`console-nav-item ${activePage === item.id ? "nav-item-active" : ""}`} onClick={() => { setActivePage(item.id); setMobileNavOpen(false); }}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.id === "approvals" && pendingCount > 0 ? <span className="nav-count">{pendingCount}</span> : item.badge && <span className="nav-count">{item.badge}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-health"><span className="health-dot" /><span><strong>Preview workspace</strong><small>Sample data · No live actions</small></span><span className="health-info" title="Connect Supabase and your channels to load live data">i</span></div>
          <button className="sidebar-user" onClick={() => setActivePage("settings")}>
            <Avatar initials="AT" color="charcoal" small />
            <span className="user-meta"><strong>Alex Taylor</strong><small>Workspace admin</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />}

      <main className="console-main">
        <header className="console-topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Torqe workspace</span><Icon name="chevron" size={14} /><strong>{navItems.find((item) => item.id === activePage)?.label || "Overview"}</strong></div>
          <div className="topbar-actions">
            <span className="topbar-live"><i /> PREVIEW</span>
            <button className="topbar-icon-button notification-button" aria-label="Notifications" onClick={() => setActivePage("approvals")}><Icon name="bell" size={18} /><i /></button>
            <span className="topbar-separator" />
            <button className={`autopilot-control ${autopilot ? "autopilot-enabled" : ""}`} onClick={() => { setAutopilot((enabled) => !enabled); showToast("Preview control changed. Live agent execution is not connected."); }} aria-pressed={autopilot}>
              <span className="autopilot-indicator" />
              <span>Autopilot <strong>{autopilot ? "On" : "Off"}</strong></span>
              <span className="switch-track"><i /></span>
            </button>
            <button className="topbar-signout" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <div className="console-content">
          <div className="page-heading">
            <div className="page-heading-copy"><p className="console-eyebrow">YOUR TORQE WORKSPACE</p><h1>{activePage === "overview" ? <>Good morning, <span className="hero-accent">Alex.</span></> : title[0]}</h1><p>{title[1]}</p></div>
            <div className="page-heading-actions">
              {activePage === "overview" && <button className="console-secondary-button" onClick={() => exportCsv("torqe-workspace-preview.csv", [["Metric", "Value"], ["Conversations today", "128"], ["Autonomously resolved", "84%"], ["Meetings booked", "16"], ["Awaiting approval", String(pendingCount)]])}><Icon name="download" size={16} /> Export report</button>}
              <button className="console-primary-button" onClick={() => setAssistantOpen(true)}><Logo size={17} white spin /> Ask Torqe</button>
            </div>
          </div>

          {activePage === "overview" && <OverviewPage setActivePage={setActivePage} approvals={approvals} autopilot={autopilot} status={status} showToast={showToast} range={range} setRange={setRange} />}
          {activePage === "inbox" && <InboxPage conversations={filteredConversations} activeConversation={activeConversation} setActiveConversation={setActiveConversation} pausedIds={pausedIds} togglePause={togglePause} search={search} setSearch={setSearch} reply={reply} setReply={setReply} sendReply={sendReply} showToast={showToast} inboxFilter={inboxFilter} setInboxFilter={setInboxFilter} inboxChannel={inboxChannel} setInboxChannel={setInboxChannel} />}
          {activePage === "approvals" && <ApprovalsPage approvals={approvals} reviewApproval={reviewApproval} setActivePage={setActivePage} setActiveConversation={setActiveConversation} />}
          {activePage === "activity" && <ActivityPage />}
          {activePage === "automations" && <AutomationsPage autopilot={autopilot} setAutopilot={setAutopilot} instructions={instructions} setInstructions={(value) => { setInstructions(value); setInstructionsSaved(false); }} instructionsSaved={instructionsSaved} saveInstructions={() => { try { window.localStorage.setItem("torqe-console-agent-instructions", instructions); setInstructionsSaved(true); showToast("Instructions saved in this browser preview."); } catch { showToast("Could not save instructions in this browser."); } }} />}
          {activePage === "knowledge" && <KnowledgePage status={status} showToast={showToast} knowledgeFiles={knowledgeFiles} inputRef={knowledgeInputRef} onFilesSelected={(files) => { setKnowledgeFiles((current) => [...new Set([...current, ...files.map((file) => file.name)])]); if (files.length) showToast(`${files.length} document${files.length === 1 ? "" : "s"} added to this browser preview. Connect Supabase to ingest them.`); }} />}
          {activePage === "integrations" && <IntegrationsPage status={status} setIntegrationInfo={setIntegrationInfo} />}
          {activePage === "settings" && <SettingsPage status={status} showToast={showToast} />}
          <footer className="console-footer"><span>TORQE CONSOLE <span className="footer-dot">·</span> PRIVATE PREVIEW</span><span>Your team's operations, made visible.</span></footer>
        </div>
      </main>

      {assistantOpen && <div className="assistant-overlay"><button className="assistant-backdrop" onClick={() => setAssistantOpen(false)} aria-label="Close assistant" /><div className="tcw-panel console-chat-panel"><TorqeChat endpoint="/api/console/copilot" variant="widget" onClose={() => setAssistantOpen(false)} /></div></div>}
      {integrationInfo && <IntegrationDialog integration={integrationInfo} onClose={() => setIntegrationInfo(null)} />}
      {toast && <div role="status" className="console-toast"><Icon name="shield" size={17} />{toast}</div>}
    </div>
  );
}

function OverviewPage({ setActivePage, approvals, autopilot, status, showToast, range, setRange }) {
  const outstanding = approvals.filter((item) => item.status === "pending");
  const periods = {
    "7d": { label: "Last 7 days", total: "1,284", change: "18.6%", days: [["Mon",46,34],["Tue",62,42],["Wed",54,39],["Thu",78,55],["Fri",66,49],["Sat",36,27],["Sun",48,34]] },
    "30d": { label: "Last 30 days", total: "4,892", change: "12.4%", days: [["W1",52,40],["W2",67,49],["W3",59,45],["W4",84,62],["W5",69,51],["W6",42,32],["W7",57,41]] },
    "90d": { label: "Last 90 days", total: "14,608", change: "24.1%", days: [["Aug",43,33],["Sep",61,46],["Oct",76,56],["Nov",68,51],["Dec",81,61],["Jan",72,54],["Feb",92,68]] },
  };
  const period = periods[range];
  return (
    <>
      <div className="overview-callout"><span className="callout-icon"><Icon name="spark" size={17} /></span><span><strong>Preview workspace.</strong> These are sample conversations. Connect your systems to bring your real operation into Torqe.</span><button onClick={() => setActivePage("integrations")}>Connect workspace <Icon name="arrow" size={14} /></button></div>
      <section className="metric-grid" aria-label="Workspace metrics">
        <MetricCard label="Conversations today" value="128" change="+12.8%" detail="vs. previous 7 days" icon="message" tone="orange" />
        <MetricCard label="Autonomously resolved" value="84%" change="+6.2%" detail="of eligible conversations" icon="spark" tone="green" />
        <MetricCard label="Meetings booked" value="16" change="+3 this week" detail="across all channels" icon="calendar" tone="purple" />
        <MetricCard label="Needs your review" value={String(outstanding.length).padStart(2, "0")} change={outstanding.length ? "Action needed" : "All clear"} detail="high-stakes decisions" icon="shield" tone="peach" alert onClick={() => setActivePage("approvals")} />
      </section>

      <section className="overview-main-grid">
        <div className="console-card approval-summary-card">
          <div className="card-heading"><div><h2>Needs your attention</h2><p>Decisions waiting on your team.</p></div><button className="text-link" onClick={() => setActivePage("approvals")}>View all <Icon name="arrow" size={14} /></button></div>
          {outstanding.length === 0 ? <div className="empty-approvals"><Icon name="check" size={20} /><span>Nothing waiting for review.</span></div> : <div className="attention-list">{outstanding.slice(0, 3).map((item) => <button className="attention-item" key={item.id} onClick={() => setActivePage("approvals")}><Avatar initials={item.initials} small /><span className="attention-copy"><strong>{item.title}</strong><small>{item.person} · {item.company}</small></span><span className="attention-time">{item.time}</span><Icon name="chevron" size={15} /></button>)}</div>}
          <div className="approval-card-footer"><span><span className="attention-dot" /> {outstanding.length} awaiting approval</span><button onClick={() => setActivePage("approvals")}>Review queue <Icon name="arrow" size={14} /></button></div>
        </div>

        <div className="console-card live-activity-card">
          <div className="card-heading"><div><p className="section-kicker">WHILE YOU WERE AWAY</p><h2>Work moved forward.</h2><p>Recent agent actions across your workspace.</p></div><button className="text-link" onClick={() => setActivePage("activity")}>View activity <Icon name="arrow" size={14} /></button></div>
          <div className="activity-list">{activities.slice(0, 4).map((item) => <ActivityRow key={item.id} item={item} />)}</div>
        </div>
      </section>

      <section className="overview-bottom-grid">
        <div className="console-card performance-card">
          <div className="card-heading"><div><p className="section-kicker">THE INBOUND, IN MOTION</p><h2>More conversations. Less waiting.</h2><p>Sample volume and agent-resolved conversations.</p></div><select aria-label="Performance time range" className="select-period" value={range} onChange={(event) => setRange(event.target.value)}>{Object.entries(periods).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></div>
          <div className="chart-summary"><strong>{period.total}</strong><span>conversations handled</span><span className="chart-change"><Icon name="trend" size={14} /> {period.change}</span></div>
          <div className="chart-legend"><span><i className="legend-orange" />Conversations</span><span><i className="legend-sand" />Resolved by agent</span><span className="chart-period-note">{period.label} · illustrative preview</span></div>
          <div className="chart" role="img" aria-label={`Sample inbound conversation chart: ${period.label}`}>
            <div className="chart-y-labels"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
            <div className="chart-plot">{period.days.map(([day, total, resolved]) => <div className="chart-day" key={day}><div className="chart-bars"><i style={{ height: `${total}%` }} /><i style={{ height: `${resolved}%` }} /></div><span>{day}</span></div>)}</div>
          </div>
        </div>
        <div className="console-card agent-status-card">
          <div className="card-heading"><div><p className="section-kicker">THE AGENT</p><h2>Ready, with guardrails.</h2><p>Connections and operating mode.</p></div><span className="agent-orbit"><Icon name="spark" size={18} /></span></div>
          <div className="agent-state-row"><span className="agent-status-dot" /><strong>{autopilot ? "Autopilot preview on" : "Autopilot paused"}</strong><span className="agent-mode">{autopilot ? "PREVIEW" : "OFF"}</span></div>
          <p className="agent-status-note">Preview only. This control does not execute external agent actions.</p>
          <div className="agent-connection-list"><ConnectionStatus label="Supabase database" connected={status.supabase.configured} /><ConnectionStatus label="NVIDIA model" connected={status.model.configured} /></div>
          <button className="agent-settings-link" onClick={() => setActivePage("integrations")}>Set up connections <Icon name="arrow" size={14} /></button>
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, change, detail, icon, tone, alert = false, onClick }) {
  return <article className={`metric-card ${alert ? "metric-alert" : ""}`} onClick={onClick} onKeyDown={(event) => { if (onClick && (event.key === "Enter" || event.key === " ")) onClick(); }} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}><div className={`metric-icon metric-${tone}`}><Icon name={icon} size={17} /></div><p className="metric-label">{label}</p><div className="metric-value-row"><strong>{value}</strong><span className={change.includes("Action") ? "metric-change warning-change" : "metric-change"}>{change}</span></div><p className="metric-detail">{detail}</p></article>;
}

function ConnectionStatus({ label, connected }) {
  return <div className="connection-status"><span className={connected ? "connection-ok" : "connection-missing"} /><span>{label}</span><strong>{connected ? "Configured" : "Not connected"}</strong></div>;
}

function InboxPage({ conversations, activeConversation, setActiveConversation, pausedIds, togglePause, search, setSearch, reply, setReply, sendReply, showToast, inboxFilter, setInboxFilter, inboxChannel, setInboxChannel }) {
  const visibleConversation = conversations.find((item) => item.id === activeConversation) || conversations[0];
  const isPaused = visibleConversation ? pausedIds.has(visibleConversation.id) : false;
  return (
    <div className="inbox-layout console-card">
      <aside className="inbox-list-panel">
        <div className="inbox-list-heading"><div><p className="section-kicker">OMNICHANNEL</p><h2>Conversations</h2><span>{conversations.length} preview threads</span></div></div>
        <label className="inbox-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or companies" /></label>
        <div className="inbox-filters"><button className={inboxFilter === "all" ? "filter-active" : ""} onClick={() => setInboxFilter("all")}>All <span>{initialConversations.length}</span></button><button className={inboxFilter === "review" ? "filter-active" : ""} onClick={() => setInboxFilter("review")}>Needs review <span>{initialConversations.filter((item) => item.status === "Needs review").length}</span></button><label className="channel-filter"><span>Channel</span><select aria-label="Filter by channel" value={inboxChannel} onChange={(event) => setInboxChannel(event.target.value)}><option value="all">All channels</option><option value="whatsapp">WhatsApp</option><option value="gmail">Gmail</option><option value="outlook">Outlook</option><option value="linkedin">LinkedIn</option></select></label></div>
        <div className="conversation-list">{conversations.length ? conversations.map((item) => <button key={item.id} className={`conversation-row ${item.id === visibleConversation?.id ? "conversation-selected" : ""}`} onClick={() => setActiveConversation(item.id)}><Avatar initials={item.initials} color={item.color} /><span className="conversation-copy"><span className="conversation-name-row"><strong>{item.name}</strong><small>{item.time}</small></span><span className="conversation-company">{item.company}</span><span className="conversation-preview">{item.preview}</span><span className="conversation-tags"><ChannelMark type={item.channelKey} /><span className={`conversation-state ${item.status === "Needs review" ? "state-review" : ""}`}>{item.status}</span></span></span>{item.unread > 0 && <span className="unread-dot" />}</button>) : <div className="conversation-empty">No conversations match. Adjust your search or filters.</div>}</div>
      </aside>
      {visibleConversation ? <section className="thread-panel">
        <div className="thread-heading"><div className="thread-person"><Avatar initials={visibleConversation.initials} color={visibleConversation.color} /><span><strong>{visibleConversation.name}</strong><small>{visibleConversation.company} <span>·</span> {visibleConversation.channel}</small></span></div><div className="thread-tools"><StatusPill tone={isPaused ? "warning" : "success"}>{isPaused ? "AI paused" : "AI active"}</StatusPill><button className={`thread-pause-button ${isPaused ? "is-paused" : ""}`} onClick={() => togglePause(visibleConversation.id)}><Icon name={isPaused ? "spark" : "pause"} size={15} />{isPaused ? "Resume AI" : "Pause AI"}</button></div></div>
        <div className="thread-context"><span className="context-tag">{visibleConversation.intent}</span><span className="context-score"><Icon name="trend" size={14} /> Lead score <strong>{visibleConversation.score}</strong></span><span className="context-owner"><Avatar initials="AT" color="charcoal" small /> Alex Taylor</span></div>
        <div className="thread-messages">{(visibleConversation.messages || [{ from: "prospect", text: visibleConversation.preview, time: visibleConversation.time }]).map((message, index) => <div key={`${visibleConversation.id}-${index}`} className={`message-row message-${message.from}`}><span className="message-author">{message.from === "prospect" ? visibleConversation.name.split(" ")[0] : message.from === "agent" ? "Torqe agent" : "Alex Taylor"} <span>· {message.time}</span></span><div className="message-bubble">{message.text}{message.pending && <StatusPill tone="warning">Human follow-up</StatusPill>}</div></div>)}</div>
        <div className="thread-assistant-note"><span className="assistant-note-icon"><Icon name="spark" size={14} /></span><span><strong>Torqe flagged this conversation</strong><small>Custom commercial terms require approval before anything is sent.</small></span><button onClick={() => showToast("This is an example recommendation from preview data.")}>View reason</button></div>
        <form className="thread-reply" onSubmit={sendReply}><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={isPaused ? "Write a message as Alex…" : "Reply to this conversation…"} rows={2} /><div className="reply-toolbar"><span><Icon name="spark" size={14} /> AI draft available <span className="preview-only-label">· preview only</span></span><button type="submit" disabled={!reply.trim()}><Icon name="send" size={15} /> Send reply</button></div></form>
      </section> : <section className="thread-panel thread-empty"><span className="empty-file"><Icon name="inbox" size={21} /></span><p>Select different filters to see matching conversations.</p></section>}
    </div>
  );
}

function ApprovalsPage({ approvals, reviewApproval, setActivePage, setActiveConversation }) {
  const pending = approvals.filter((item) => item.status === "pending");
  const reviewed = approvals.filter((item) => item.status !== "pending");
  return <div className="page-stack"><div className="approval-queue-header"><div><span className="queue-count">{pending.length}</span><span> items need your review</span></div><button className="console-secondary-button" onClick={() => setActivePage("automations")}><Icon name="settings" size={15} /> Approval policies</button></div>{pending.length === 0 ? <div className="console-card approval-empty"><span className="empty-check"><Icon name="check" /></span><h2>You’re all caught up.</h2><p>New high-stakes decisions will appear here for your review.</p></div> : <div className="approval-grid">{pending.map((item) => <article className="console-card approval-card" key={item.id}><div className="approval-card-top"><div className={`risk-badge risk-${item.risk.toLowerCase()}`}><Icon name="shield" size={14} />{item.risk} review</div><span className="approval-time">{item.time}</span></div><h2>{item.title}</h2><p className="approval-type">{item.type}</p><div className="approval-requester"><Avatar initials={item.initials} small /><span><strong>{item.person}</strong><small>{item.company}</small></span><button className="text-link" onClick={() => { setActiveConversation(item.conversationId); setActivePage("inbox"); }}>View thread <Icon name="arrow" size={13} /></button></div><div className="approval-context"><strong>Why this needs a human</strong><p>The request falls outside the agent's approved commercial policy. Review the conversation and confirm the next step before responding.</p></div><div className="approval-actions"><button className="approval-reject" onClick={() => reviewApproval(item.id, "rejected")}>Request changes</button><button className="approval-approve" onClick={() => reviewApproval(item.id, "approved")}><Icon name="check" size={15} /> Approve</button></div><p className="preview-action-note">Preview only · external actions are disabled</p></article>)}</div>}{reviewed.length > 0 && <div className="console-card reviewed-card"><div className="card-heading"><div><h2>Recently reviewed</h2><p>Decisions made in this preview session.</p></div></div>{reviewed.map((item) => <div className="reviewed-row" key={item.id}><Avatar initials={item.initials} small /><span><strong>{item.title}</strong><small>{item.person} · {item.company}</small></span><StatusPill tone={item.status === "approved" ? "success" : "neutral"}>{item.status === "approved" ? "Approved · preview" : "Changes requested"}</StatusPill></div>)}</div>}</div>;
}

function ActivityRow({ item }) {
  return <div className="activity-row"><span className={`activity-icon activity-${item.tone}`}><Icon name={item.icon} size={16} /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="activity-state"><StatusPill tone={item.state === "Completed" ? "success" : "warning"}>{item.state}</StatusPill></span><span className="activity-time">{item.time}</span></div>;
}

function ActivityPage() {
  const entries = activities.concat([{ id: "e5", title: "Inbound lead qualified", detail: "Daniel Kim · Arc & Oak", time: "52m ago", icon: "spark", tone: "mint", state: "Completed" }, { id: "e6", title: "Lead added to HubSpot", detail: "Daniel Kim · Arc & Oak", time: "55m ago", icon: "plug", tone: "lavender", state: "Completed" }]);
  return <div className="console-card full-activity-card"><div className="card-heading"><div><h2>Recent agent activity</h2><p>All events below are sample activity in the preview workspace.</p></div><button className="console-secondary-button" onClick={() => exportCsv("torqe-activity-preview.csv", [["Event", "Details", "Time", "Status"], ...entries.map((item) => [item.title, item.detail, item.time, item.state])])}><Icon name="download" size={15} /> Export log</button></div><div className="activity-list activity-full-list">{entries.map((item) => <ActivityRow key={item.id} item={item} />)}</div><div className="activity-table-note"><Icon name="shield" size={15} /> Live audit events will appear here after a connected workspace is configured.</div></div>;
}

function AutomationsPage({ autopilot, setAutopilot, instructions, setInstructions, instructionsSaved, saveInstructions }) {
  return <div className="automation-layout"><section className="console-card automation-main"><div className="card-heading"><div><h2>Agent operating mode</h2><p>Set whether the agent may act autonomously within your approved policies.</p></div><span className={`mode-badge ${autopilot ? "mode-preview" : ""}`}>{autopilot ? "PREVIEW ON" : "PAUSED"}</span></div><button className={`autopilot-large ${autopilot ? "autopilot-large-on" : ""}`} onClick={() => setAutopilot((value) => !value)}><span className="autopilot-large-symbol"><Icon name={autopilot ? "spark" : "pause"} size={18} /></span><span><strong>Autopilot {autopilot ? "on" : "off"}</strong><small>{autopilot ? "Preview setting is on; external actions remain disabled." : "The AI will wait for a human to review every next step."}</small></span><span className="switch-track"><i /></span></button><div className="policy-list"><PolicyRow title="Reply to routine product questions" description="Only using connected, approved knowledge sources." checked /><PolicyRow title="Qualify and update inbound leads" description="Log conversation summaries and score the opportunity." checked /><PolicyRow title="Book meetings on connected calendars" description="Offer available times and book after the prospect confirms." checked /><PolicyRow title="Send quotes, contracts, or payment links" description="Pause and ask for approval before any commercial commitment." checked disabled /><PolicyRow title="Apply discounts or custom legal terms" description="Always pause for a human decision." checked disabled /></div><div className="automation-safe-note"><Icon name="shield" size={17} /><span><strong>Human approval stays in control.</strong><small>High-risk, out-of-policy, and low-confidence actions always require review.</small></span></div></section><section className="console-card instructions-card"><div className="card-heading"><div><h2>Instructions for your AI</h2><p>Define how the agent should represent your team.</p></div><span className={`instructions-status ${instructionsSaved ? "instructions-saved" : ""}`}><i />{instructionsSaved ? "Saved to this browser" : "Unsaved changes"}</span></div><label className="instructions-label" htmlFor="agent-instructions">System instructions</label><textarea id="agent-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={8} /><p className="instructions-help">Keep instructions clear and specific. Product facts should come from your approved knowledge sources.</p><button className="console-secondary-button" onClick={saveInstructions}>Save instructions <Icon name="check" size={14} /></button></section><section className="console-card workflow-card"><div className="card-heading"><div><h2>Execution workflow</h2><p>Every inbound follows the same auditable path.</p></div></div><div className="workflow-steps">{[["01", "Bouncer", "Filter spam and unsafe instructions"], ["02", "Router", "Classify intent and choose a playbook"], ["03", "Doer + RAG", "Retrieve approved facts and run permitted tools"], ["04", "Auditor", "Check accuracy, risk, and policy"], ["05", "Dispatch or review", "Send safe replies or request a human decision"]].map(([number, name, description]) => <div className="workflow-step" key={number}><span>{number}</span><div><strong>{name}</strong><small>{description}</small></div><Icon name="check" size={16} /></div>)}</div></section><section className="console-card tools-policy-card"><div className="card-heading"><div><h2>Tool execution policy</h2><p>External tools are not enabled in the preview.</p></div></div><div className="tool-policy-grid">{["Google / Outlook availability and meeting booking", "HubSpot / Salesforce contacts and deal stages", "DocuSign / PandaDoc contracts and approval", "Branded quote PDFs and Stripe payment links", "14-day sandbox provisioning and API credentials", "Jira / Zendesk support ticket routing", "Slack / Teams escalation with 2-hour SLA reminders", "Document RAG with metadata filters and Cohere Rerank"].map((label) => <div key={label}><Icon name="lock" size={15} /><span>{label}</span><StatusPill>Not connected</StatusPill></div>)}</div></section></div>;
}

function PolicyRow({ title, description, checked, disabled }) {
  return <div className={`policy-row ${disabled ? "policy-row-locked" : ""}`}><span className={`policy-check ${checked ? "policy-check-on" : ""}`}>{checked && <Icon name={disabled ? "lock" : "check"} size={13} />}</span><span><strong>{title}</strong><small>{description}</small></span>{disabled && <span className="always-review">ALWAYS REVIEW</span>}</div>;
}

function KnowledgePage({ status, showToast, knowledgeFiles, onFilesSelected, inputRef }) {
  function handleFileChange(event) {
    const supported = Array.from(event.target.files || []).filter((file) => /\.(pdf|docx?|txt|md|csv)$/i.test(file.name));
    if (event.target.files?.length !== supported.length) showToast("Some files were skipped. Use PDF, DOC, DOCX, TXT, MD, or CSV files.");
    if (supported.length) onFilesSelected(supported);
    event.target.value = "";
  }
  return <div className="knowledge-layout"><section className="console-card knowledge-intro"><span className="knowledge-illustration"><Icon name="file" size={26} /></span><div><p className="console-eyebrow">GROUNDED ANSWERS</p><h2>Give your agent the right context.</h2><p>Upload product docs, pricing, technical guides, and approved policies. Torqe can use retrieval with source citations and escalate when information is missing.</p><input ref={inputRef} className="visually-hidden" type="file" aria-label="Select knowledge documents" accept=".pdf,.doc,.docx,.txt,.md,.csv" multiple onChange={handleFileChange} /><button className="console-primary-button" onClick={() => inputRef.current?.click()}><Icon name="file" size={15} /> Add documents</button><small className="preview-upload-note">Files are selected locally only; connect Supabase Storage to ingest them.</small></div></section><section className="console-card knowledge-status"><div className="card-heading"><div><h2>Knowledge connections</h2><p>Sources available to the agent.</p></div></div><div className="knowledge-source-row"><span className="source-type-icon source-database"><Icon name="grid" size={17} /></span><span><strong>Supabase knowledge store</strong><small>Document chunks, metadata & vector search</small></span><StatusPill tone={status.supabase.configured ? "success" : "warning"}>{status.supabase.configured ? "Project configured" : "Not connected"}</StatusPill></div><div className="knowledge-source-row"><span className="source-type-icon source-rag"><Icon name="search" size={17} /></span><span><strong>Retrieval & reranking</strong><small>Metadata filtering · citation-first answers</small></span><StatusPill>Not configured</StatusPill></div></section><section className="knowledge-empty console-card">{knowledgeFiles.length ? <><div className="knowledge-files-heading"><span><p className="section-kicker">LOCAL PREVIEW</p><h2>{knowledgeFiles.length} selected document{knowledgeFiles.length === 1 ? "" : "s"}</h2></span><button className="text-link" onClick={() => inputRef.current?.click()}>Add more <Icon name="arrow" size={14} /></button></div><ul className="knowledge-file-list">{knowledgeFiles.map((name) => <li key={name}><Icon name="file" size={16} /><span>{name}</span><StatusPill>Not ingested</StatusPill></li>)}</ul></> : <><span className="empty-file"><Icon name="file" size={21} /></span><h2>Your knowledge library is waiting.</h2><p>When your workspace is connected, add handbooks, product documentation, pricing guides, and security answers.</p><button className="text-link" onClick={() => showToast("Supported formats: PDF, DOC, DOCX, TXT, MD, and CSV.")}>View supported sources <Icon name="arrow" size={14} /></button></>}</section></div>;
}

function IntegrationsPage({ status, setIntegrationInfo }) {
  return <div className="integrations-page"><div className="integration-notice"><span><Icon name="shield" size={18} /></span><p><strong>Preview mode — connections are not live.</strong> OAuth credentials and channel webhooks must be set up by a workspace administrator.</p><StatusPill tone="warning">Setup required</StatusPill></div><div className="integration-section-heading"><div><h2>Connect your workflow</h2><p>One shared context across messaging, CRM, calendars, and agent tools.</p></div><span className="integration-summary">{status.supabase.configured ? "Database variables detected" : "Workspace not connected"}</span></div><div className="integration-grid">{initialIntegrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} configured={integration.keyCheck ? status[integration.keyCheck]?.configured : false} onClick={() => setIntegrationInfo(integration)} />)}</div><div className="console-card database-integration"><div className="database-mark"><Icon name="grid" size={20} /></div><div className="database-copy"><h3>Supabase</h3><p>Workspace database, authentication, and vector-ready knowledge storage.</p><span className="database-details"><i className={status.supabase.configured ? "connection-ok" : "connection-missing"} />{status.supabase.configured ? "Project variables detected · database connection not verified" : "Project URL and publishable key required"}</span></div><button className="console-secondary-button" onClick={() => setIntegrationInfo({ name: "Supabase", kind: "DATABASE", detail: "Database, authentication, and knowledge storage", icon: "S", tone: "green" })}>Setup guide <Icon name="arrow" size={14} /></button></div><p className="integration-security-note"><Icon name="lock" size={14} /> Provider credentials are never requested or stored by this preview interface.</p></div>;
}

function IntegrationCard({ integration, configured, onClick }) {
  return <article className="console-card integration-card"><div className="integration-card-top"><IntegrationLogo integration={integration} /><span className="integration-kind">{integration.kind}</span></div><h3>{integration.name}</h3><p>{integration.detail}</p><div className="integration-card-footer"><StatusPill tone={configured ? "success" : "neutral"}>{configured ? "Key detected" : "Not connected"}</StatusPill><button onClick={onClick}>{configured ? "Manage" : "Connect"} <Icon name="arrow" size={13} /></button></div></article>;
}

function SettingsPage({ status, showToast }) {
  return <div className="settings-layout"><section className="console-card settings-section"><div className="card-heading"><div><h2>Workspace profile</h2><p>Your organization's console identity.</p></div></div><div className="settings-field"><label htmlFor="workspace-name">Workspace name</label><input id="workspace-name" defaultValue="Torqe workspace" readOnly aria-describedby="workspace-name-help" /><small id="workspace-name-help">Workspace profile editing will be available after account setup.</small></div><div className="settings-field"><label>Workspace ID</label><div className="settings-readonly">torqe-preview-workspace <span>PREVIEW</span></div></div></section><section className="console-card settings-section"><div className="card-heading"><div><h2>Connected services</h2><p>Configuration detected by the server.</p></div></div><div className="settings-service"><span className="settings-service-icon"><Icon name="grid" size={16} /></span><span><strong>Supabase</strong><small>URL and public key</small></span><StatusPill tone={status.supabase.configured ? "success" : "warning"}>{status.supabase.configured ? "Configured" : "Not configured"}</StatusPill></div><div className="settings-service"><span className="settings-service-icon settings-model-icon"><Icon name="spark" size={16} /></span><span><strong>NVIDIA model</strong><small>Server-side API key</small></span><StatusPill tone={status.model.configured ? "success" : "warning"}>{status.model.configured ? "Key detected" : "Not configured"}</StatusPill></div><p className="settings-secret-note"><Icon name="lock" size={14} /> API secrets are kept on the server and never displayed here.</p></section><section className="console-card settings-section access-settings"><div className="card-heading"><div><h2>Access & security</h2><p>Console access is restricted to invitation holders.</p></div><span className="access-lock-icon"><Icon name="lock" size={17} /></span></div><div className="security-setting"><span><strong>Invitation gate</strong><small>Access code verified server-side</small></span><StatusPill tone="success">Enabled</StatusPill></div><div className="security-setting"><span><strong>Session protection</strong><small>HTTP-only cookie · eight-hour expiry</small></span><StatusPill tone="success">Enabled</StatusPill></div><div className="security-setting"><span><strong>Organization-level database access</strong><small>Requires Supabase Auth and provisioned team membership.</small></span><StatusPill tone={status.supabase.configured ? "warning" : "neutral"}>{status.supabase.configured ? "Not verified" : "Not configured"}</StatusPill></div></section><div className="settings-warning"><Icon name="shield" size={17} /><span><strong>Not a production identity system yet.</strong> The shared invitation gate is intended for a private preview. Before handling client data, add verified individual Supabase sign-in, provision team membership, and enforce tenant access using the included RLS policies.</span><button className="text-link" onClick={() => showToast("See console/README.md for the required Supabase and deployment setup.")}>Setup notes <Icon name="arrow" size={13} /></button></div></div>;
}

function IntegrationDialog({ integration, onClose }) {
  return <div className="integration-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="integration-modal" role="dialog" aria-modal="true" aria-labelledby="integration-modal-title"><button className="square-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button><IntegrationLogo integration={integration} /><p className="console-eyebrow">{integration.kind} CONNECTION</p><h2 id="integration-modal-title">Connect {integration.name}</h2><p>{integration.detail}</p><div className="modal-steps"><div><span>1</span><p><strong>Configure credentials</strong><small>Add OAuth credentials or provider tokens to your server environment.</small></p></div><div><span>2</span><p><strong>Authorize your workspace</strong><small>Complete the provider's secure OAuth flow for your organization.</small></p></div><div><span>3</span><p><strong>Verify the connection</strong><small>Test permissions and configure event subscriptions before going live.</small></p></div></div><div className="modal-security"><Icon name="lock" size={15} /> Connection setup isn’t enabled in this preview. No credentials were collected.</div><button className="console-secondary-button modal-done" onClick={onClose}>Got it</button></section></div>;
}
