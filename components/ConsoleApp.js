"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "../components/Logo";
import Logo from "../components/Logo";
import TorqeChat from "./torqe-chat/TorqeChat";
import { integrations as integrationCatalog, navItems } from "../lib/data";
import { AI_MODELS } from "../lib/ai/catalog";

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
  person: "M20 21a8 8 0 0 0-16 0m8-10a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
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
  overview: ["Workspace overview", "The latest conversations, approvals, and agent activity."],
  inbox: ["Inbox", "Review conversations, pause the agent, and prepare team replies."],
  approvals: ["Approvals", "Review the decisions that need a human in the loop."],
  activity: ["Activity log", "A clear record of every agent decision and action."],
  ai: ["AI & models", "Configure the model provider and workspace AI access."],
  automations: ["Agent workflow", "Define the guardrails for Torqe's execution workflow."],
  knowledge: ["Knowledge base", "Ground answers in your team's trusted source material."],
  channels: ["Channels", "Manage messaging connections for the workspace."],
  tools: ["Tools", "Manage the systems Torqe can use after they are securely connected."],
  settings: ["Workspace settings", "Manage team access and workspace security."],
  profile: ["Your profile", "Manage your account details and sign-in identity."],
};

function formatRecordTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const elapsed = Math.max(0, Date.now() - date.getTime());
  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initialsFor(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "—";
}

function mapWorkspaceRecords(data) {
  const messagesByConversation = new Map();
  for (const message of [...(data.messages || [])].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))) {
    const messages = messagesByConversation.get(message.conversation_id) || [];
    messages.push({
      from: message.sender_type === "prospect" ? "prospect" : message.sender_type === "system" ? "system" : message.sender_type,
      text: message.body,
      time: new Date(message.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    });
    messagesByConversation.set(message.conversation_id, messages);
  }

  const colors = ["lavender", "mint", "peach", "sky", "rose"];
  const conversations = (data.conversations || []).map((conversation, index) => {
    const metadata = conversation.metadata && typeof conversation.metadata === "object" ? conversation.metadata : {};
    const messages = messagesByConversation.get(conversation.id) || [];
    const name = conversation.contact_name || "Unknown contact";
    const lastMessage = messages[messages.length - 1];
    const channels = { whatsapp: "whatsapp", email: "gmail", linkedin: "linkedin", web: "web", other: "other" };
    const statusLabels = { needs_review: "Needs review", active: "In progress", waiting: "Waiting on team", closed: "Closed" };
    return {
      id: conversation.id,
      createdAt: conversation.created_at,
      name,
      company: conversation.company || "—",
      channel: conversation.channel,
      channelKey: channels[conversation.channel] || "other",
      initials: initialsFor(name),
      color: colors[index % colors.length],
      preview: lastMessage?.text || "No messages yet.",
      time: formatRecordTime(conversation.updated_at),
      unread: Number.isInteger(metadata.unread_count) ? metadata.unread_count : 0,
      status: statusLabels[conversation.status] || conversation.status,
      intent: typeof metadata.intent === "string" ? metadata.intent : "Unclassified",
      score: Number.isFinite(metadata.score) ? metadata.score : "—",
      agentPaused: conversation.agent_paused,
      messages,
    };
  });
  const conversationById = new Map(conversations.map((conversation) => [conversation.id, conversation]));

  const approvals = (data.approvals || []).map((approval) => {
    const conversation = conversationById.get(approval.conversation_id);
    const draft = approval.draft && typeof approval.draft === "object" ? approval.draft : {};
    const person = conversation?.name || "Workspace review";
    return {
      id: approval.id,
      title: approval.title,
      person,
      company: conversation?.company || "—",
      type: approval.action_type,
      time: formatRecordTime(approval.created_at),
      risk: typeof draft.risk === "string" ? draft.risk : "Review",
      reviewReason: [draft.rationale, draft.reason, draft.summary].find((value) => typeof value === "string" && value.trim()) || "",
      initials: initialsFor(person),
      status: approval.status,
      conversationId: approval.conversation_id,
    };
  });

  const activity = (data.activity || []).map((event) => ({
    id: event.id,
    title: event.action.replaceAll(".", " "),
    detail: [event.resource_type, event.resource_id].filter(Boolean).join(" · ") || "Workspace event",
    time: formatRecordTime(event.created_at),
    icon: event.action.includes("approval") ? "shield" : event.action.includes("conversation") ? "message" : "activity",
    tone: event.action.includes("approval") ? "peach" : "lavender",
    state: "Recorded",
  }));

  return { conversations, approvals, activity, settings: data.settings, integrations: data.integrations || [], role: data.role };
}

export default function ConsoleApp() {
  const [authorized, setAuthorized] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ supabase: { configured: false }, model: { configured: false }, workspaces: [] });
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [workspaceData, setWorkspaceData] = useState({ conversations: [], approvals: [], activity: [], settings: null, integrations: [], role: "" });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [activePage, setActivePage] = useState("overview");
  const [activeConversation, setActiveConversation] = useState("");
  const conversations = workspaceData.conversations;
  const approvals = workspaceData.approvals;
  const activity = workspaceData.activity;
  const [autopilot, setAutopilot] = useState(false);
  const [search, setSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState("all");
  const [inboxChannel, setInboxChannel] = useState("all");
  const [toast, setToast] = useState("");
  const [integrationInfo, setIntegrationInfo] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [instructionsSaved, setInstructionsSaved] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const knowledgeInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const authError = url.searchParams.get("authError");
    if (authError === "setup") setAccessError("Your invitation could not be linked to a workspace. Contact your workspace administrator.");
    if (authError === "invite") setAccessError("This invitation link is invalid or expired. Ask your workspace administrator to send a new one.");
    if (authError) {
      url.searchParams.delete("authError");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    fetch("/api/console/access", { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(async ({ response, data }) => {
        if (!active) return;
        if (!response.ok) throw new Error(data.error || "Could not verify your session.");
        if (data.authorized) {
          const statusResponse = await fetch("/api/console/status", { cache: "no-store" });
          const statusResult = await statusResponse.json();
          if (!statusResponse.ok) throw new Error(statusResult.error || "Could not load your workspace access.");
          if (active) {
            setStatus(statusResult);
            setWorkspaceId(statusResult.workspaces?.[0]?.id || "");
          }
        }
        if (active) setAuthorized(Boolean(data.authorized));
      })
      .catch((error) => { if (active) { setAuthorized(false); setAccessError(error.message || "Could not verify your session. Check your connection and try again."); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!authorized || !workspaceId) {
      setWorkspaceData({ conversations: [], approvals: [], activity: [], settings: null, integrations: [], role: "" });
      return undefined;
    }

    let active = true;
    setDataLoading(true);
    setDataError("");
    setWorkspaceData({ conversations: [], approvals: [], activity: [], settings: null, integrations: [], role: "" });
    setActiveConversation("");
    fetch(`/api/console/data?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load workspace data.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        const mapped = mapWorkspaceRecords(data);
        setWorkspaceData(mapped);
        setAutopilot(Boolean(mapped.settings?.autopilot_enabled));
        setInstructions(mapped.settings?.instructions || "");
        setInstructionsSaved(true);
        setActiveConversation(mapped.conversations[0]?.id || "");
      })
      .catch((error) => {
        if (active) setDataError(error.message || "Could not load workspace data.");
      })
      .finally(() => { if (active) setDataLoading(false); });
    return () => { active = false; };
  }, [authorized, workspaceId]);

  const filteredConversations = useMemo(() => conversations.filter((item) => {
    const matchesSearch = `${item.name} ${item.company} ${item.preview}`.toLowerCase().includes(search.toLowerCase());
    const matchesReview = inboxFilter !== "review" || item.status === "Needs review";
    const matchesChannel = inboxChannel === "all" || item.channelKey === inboxChannel;
    return matchesSearch && matchesReview && matchesChannel;
  }), [conversations, inboxChannel, inboxFilter, search]);
  const pendingCount = approvals.filter((item) => item.status === "pending").length;
  const title = viewTitles[activePage] || viewTitles.overview;
  const selectedWorkspace = status.workspaces?.find((workspace) => workspace.id === workspaceId);

  async function enterWorkspace(event) {
    event.preventDefault();
    setSubmitting(true);
    setAccessError("");
    try {
      const response = await fetch("/api/console/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      setPassword("");
      const statusResponse = await fetch("/api/console/status", { cache: "no-store" });
      const statusResult = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(statusResult.error || "Signed in, but could not load workspace access.");
      setStatus(statusResult);
      setWorkspaceId(statusResult.workspaces?.[0]?.id || "");
      setAuthorized(true);
    } catch (error) {
      setAccessError(error.message || "Could not verify that invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    setCreatingWorkspace(true);
    setDataError("");
    try {
      const response = await fetch("/api/console/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create workspace.");
      setStatus((current) => ({ ...current, workspaces: [...(current.workspaces || []), data.workspace] }));
      setWorkspaceId(data.workspace.id);
      setWorkspaceName("");
    } catch (error) {
      setDataError(error.message || "Could not create workspace.");
    } finally {
      setCreatingWorkspace(false);
    }
  }

  async function signOut() {
    const response = await fetch("/api/console/access", { method: "DELETE" });
    if (!response.ok) {
      showToast("Could not sign out. Please try again.");
      return;
    }
    setAuthorized(false);
    setStatus({ supabase: { configured: false }, model: { configured: false }, workspaces: [] });
    setWorkspaceId("");
    setActivePage("overview");
  }

  function showToast(message) {
    setToast(message);
  }

  async function togglePause(id) {
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) return;
    const response = await fetch(`/api/console/conversations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, agent_paused: !conversation.agentPaused }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Could not update this conversation.");
      return;
    }
    setWorkspaceData((current) => ({
      ...current,
      conversations: current.conversations.map((item) => item.id === id ? { ...item, agentPaused: data.conversation.agent_paused } : item),
    }));
  }

  async function reviewApproval(id, nextStatus) {
    const response = await fetch(`/api/console/approvals/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Could not update this approval.");
      return;
    }
    setWorkspaceData((current) => ({
      ...current,
      approvals: current.approvals.map((item) => item.id === id ? { ...item, status: data.approval.status } : item),
    }));
    showToast(nextStatus === "approved" ? "Approval recorded. No external action was triggered." : "Approval decision recorded.");
  }

  async function saveAgentSettings(updates) {
    if (!workspaceId) return false;
    const response = await fetch("/api/console/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, ...updates }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Could not save agent settings.");
      return false;
    }
    return true;
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
          <p className="access-description">The Torqe Console is available to invited team members. Sign in with the email address that received your workspace invitation.</p>
          <form onSubmit={enterWorkspace} className="access-form">
            <label htmlFor="console-email">Work email</label>
            <input id="console-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
            <label htmlFor="console-password">Password</label>
            <input id="console-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
            {accessError && <p className="access-error" role="alert">{accessError}</p>}
            <button type="submit" className="console-primary-button access-submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<Icon name="arrow" size={16} /></button>
          </form>
          <div className="access-footnote"><Icon name="shield" size={15} /> Invite-only access · Protected by Supabase Auth</div>
        </div>
        <p className="access-help">Need access? <a href="mailto:hello@torqe.ai?subject=Torqe%20Console%20access">Ask your workspace administrator</a></p>
        <div className="access-bottom">TORQE <span>·</span> THE INBOUND EXECUTION SYSTEM</div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="console-access">
        <div className="access-brand"><Wordmark size={29} /><span className="access-divider" /><span className="access-console-label">Console</span></div>
        <section className="access-card">
          <div className="access-symbol"><Icon name="grid" size={22} /></div>
          <p className="console-eyebrow">CREATE YOUR WORKSPACE</p>
          <h1>Start with your team.</h1>
          <p className="access-description">Your account is secure. Create a workspace for your organization to begin configuring Torqe.</p>
          <form onSubmit={createWorkspace} className="access-form">
            <label htmlFor="workspace-create-name">Workspace name</label>
            <input id="workspace-create-name" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Your organization" minLength={2} maxLength={80} required />
            {dataError && <p className="access-error" role="alert">{dataError}</p>}
            <button type="submit" className="console-primary-button access-submit" disabled={creatingWorkspace}>{creatingWorkspace ? "Creating…" : "Create workspace"}<Icon name="arrow" size={16} /></button>
          </form>
          {status.workspaces?.length > 0 && <button className="access-return" onClick={() => setWorkspaceId(status.workspaces[0].id)}>Return to an existing workspace</button>}
          <div className="access-footnote"><Icon name="shield" size={15} /> Each workspace has isolated, role-based access</div>
        </section>
        <button className="access-help access-signout" onClick={signOut}>Sign out</button>
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
        <div className="workspace-selector">
          <button className="workspace-picker" onClick={() => setWorkspacePickerOpen((open) => !open)} aria-expanded={workspacePickerOpen}>
            <span className="workspace-mark">{initialsFor(selectedWorkspace?.name || "T").slice(0, 1)}</span>
            <span className="workspace-meta"><strong>{selectedWorkspace?.name || "Workspace"}</strong><small>{selectedWorkspace?.role || "Member"}</small></span>
            <Icon name="chevron" size={15} className="workspace-chevron" />
          </button>
          {workspacePickerOpen && <div className="workspace-menu" role="menu">
            {(status.workspaces || []).map((workspace) => <button key={workspace.id} role="menuitem" className={workspace.id === workspaceId ? "workspace-menu-active" : ""} onClick={() => { setWorkspaceId(workspace.id); setWorkspacePickerOpen(false); setActivePage("overview"); }}><strong>{workspace.name}</strong><small>{workspace.role}</small></button>)}
            <button role="menuitem" className="workspace-menu-create" onClick={() => { setWorkspacePickerOpen(false); setWorkspaceId(""); }}>Create a workspace</button>
          </div>}
        </div>
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
          <div className="workspace-health"><span className="health-dot" /><span><strong>{dataLoading ? "Syncing workspace" : "Workspace connected"}</strong><small>{dataError ? "Data could not be loaded" : "Private · role protected"}</small></span><span className="health-info" title={dataError || "Workspace data is protected by Supabase row-level security."}>i</span></div>
          <button className="sidebar-user" onClick={() => setActivePage("profile")}>
            <Avatar initials={initialsFor(status.user?.name || status.user?.email || "User")} color="charcoal" small />
            <span className="user-meta"><strong>{status.user?.name || status.user?.email || "Account"}</strong><small>{workspaceData.role || selectedWorkspace?.role || "Member"} · Profile</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />}

      <main className="console-main">
        <header className="console-topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>{selectedWorkspace?.name || "Workspace"}</span><Icon name="chevron" size={14} /><strong>{navItems.find((item) => item.id === activePage)?.label || "Overview"}</strong></div>
          <div className="topbar-actions">
            <span className="topbar-live"><i /> WORKSPACE DATA</span>
            <button className="topbar-icon-button notification-button" aria-label="Notifications" onClick={() => setActivePage("approvals")}><Icon name="bell" size={18} /><i /></button>
            <span className="topbar-separator" />
            <button className={`autopilot-control ${autopilot ? "autopilot-enabled" : ""}`} onClick={async () => { const next = !autopilot; if (await saveAgentSettings({ autopilot_enabled: next })) setAutopilot(next); }} aria-pressed={autopilot}>
              <span className="autopilot-indicator" />
              <span>Autopilot <strong>{autopilot ? "On" : "Off"}</strong></span>
              <span className="switch-track"><i /></span>
            </button>
            <button className="topbar-signout" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <div className="console-content">
          {dataError && <div className="integration-notice" role="alert"><span><Icon name="shield" size={18} /></span><p><strong>Workspace data could not be loaded.</strong> {dataError}</p></div>}
          <div className="page-heading">
            <div className="page-heading-copy"><p className="console-eyebrow">YOUR TORQE WORKSPACE</p><h1>{activePage === "overview" ? <>Welcome to <span className="hero-accent">{selectedWorkspace?.name || "Torqe"}.</span></> : title[0]}</h1><p>{title[1]}</p></div>
            <div className="page-heading-actions">
              {activePage === "overview" && <button className="console-secondary-button" onClick={() => exportCsv("torqe-workspace-report.csv", [["Metric", "Value"], ["Conversations", String(conversations.length)], ["Pending approvals", String(pendingCount)], ["Activity events", String(activity.length)]])}><Icon name="download" size={16} /> Export report</button>}
              <button className="console-primary-button" onClick={() => setAssistantOpen(true)}><Logo size={17} white spin /> Ask Torqe</button>
            </div>
          </div>

          {activePage === "overview" && <OverviewPage setActivePage={setActivePage} approvals={approvals} conversations={conversations} activity={activity} autopilot={autopilot} status={status} />}
          {activePage === "inbox" && <InboxPage workspaceId={workspaceId} conversations={filteredConversations} activeConversation={activeConversation} setActiveConversation={setActiveConversation} togglePause={togglePause} search={search} setSearch={setSearch} inboxFilter={inboxFilter} setInboxFilter={setInboxFilter} inboxChannel={inboxChannel} setInboxChannel={setInboxChannel} />}
          {activePage === "approvals" && <ApprovalsPage approvals={approvals} reviewApproval={reviewApproval} setActivePage={setActivePage} setActiveConversation={setActiveConversation} />}
          {activePage === "activity" && <ActivityPage entries={activity} />}
          {activePage === "automations" && <AutomationsPage autopilot={autopilot} setAutopilot={async (change) => { const next = typeof change === "function" ? change(autopilot) : change; if (await saveAgentSettings({ autopilot_enabled: next })) setAutopilot(next); }} instructions={instructions} setInstructions={(value) => { setInstructions(value); setInstructionsSaved(false); }} instructionsSaved={instructionsSaved} saveInstructions={async () => { if (await saveAgentSettings({ instructions })) { setInstructionsSaved(true); showToast("Agent instructions saved to this workspace."); } }} />}
          {activePage === "knowledge" && <KnowledgePage status={status} showToast={showToast} knowledgeFiles={knowledgeFiles} inputRef={knowledgeInputRef} onFilesSelected={(files) => { setKnowledgeFiles((current) => [...new Set([...current, ...files.map((file) => file.name)])]); if (files.length) showToast(`${files.length} document${files.length === 1 ? "" : "s"} selected. Upload and ingestion are not implemented yet.`); }} />}
          {activePage === "ai" && <AISettingsPage workspaceId={workspaceId} role={workspaceData.role || selectedWorkspace?.role} showToast={showToast} />}
          {activePage === "channels" && <ConnectionsPage category="CHANNEL" status={status} setIntegrationInfo={setIntegrationInfo} integrations={workspaceData.integrations} />}
          {activePage === "tools" && <ConnectionsPage category="TOOL" status={status} setIntegrationInfo={setIntegrationInfo} integrations={workspaceData.integrations} />}
          {activePage === "settings" && <SettingsPage status={status} showToast={showToast} workspace={selectedWorkspace} workspaceId={workspaceId} role={workspaceData.role || selectedWorkspace?.role} />}
          {activePage === "profile" && <ProfilePage user={status.user} onUpdated={(name) => setStatus((current) => ({ ...current, user: { ...current.user, name } }))} showToast={showToast} />}
          <footer className="console-footer"><span>TORQE CONSOLE <span className="footer-dot">·</span> PRIVATE WORKSPACE</span><span>Your team's operations, made visible.</span></footer>
        </div>
      </main>

      {assistantOpen && <div className="assistant-overlay"><button className="assistant-backdrop" onClick={() => setAssistantOpen(false)} aria-label="Close assistant" /><div className="tcw-panel console-chat-panel"><TorqeChat endpoint="/api/console/copilot" variant="widget" onClose={() => setAssistantOpen(false)} requestContext={{ workspaceId }} /></div></div>}
      {integrationInfo && <IntegrationDialog integration={integrationInfo} onClose={() => setIntegrationInfo(null)} />}
      {toast && <div role="status" className="console-toast"><Icon name="shield" size={17} />{toast}</div>}
    </div>
  );
}

function OverviewPage({ setActivePage, approvals, conversations, activity, autopilot, status }) {
  const outstanding = approvals.filter((item) => item.status === "pending");
  const today = new Date();
  const todayCount = conversations.filter((conversation) => conversation.createdAt && new Date(conversation.createdAt).toDateString() === today.toDateString()).length;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const count = conversations.filter((conversation) => conversation.createdAt && new Date(conversation.createdAt).toDateString() === date.toDateString()).length;
    return { label: date.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const maxCount = Math.max(...days.map((day) => day.count), 1);
  return (
    <>
      <div className="overview-callout"><span className="callout-icon"><Icon name="shield" size={17} /></span><span><strong>Workspace data is private.</strong> All records below are loaded from this workspace; empty states are shown until your team connects its systems.</span><button onClick={() => setActivePage("channels")}>View channels <Icon name="arrow" size={14} /></button></div>
      <section className="metric-grid" aria-label="Workspace metrics">
        <MetricCard label="New conversations today" value={String(todayCount)} change={conversations.length ? "Workspace data" : "No data"} detail="from the latest 100 conversations" icon="message" tone="orange" />
        <MetricCard label="Handled without a person" value="—" change="Not available" detail="Requires connected agent-run analytics" icon="spark" tone="green" />
        <MetricCard label="Meetings booked" value="—" change="Not available" detail="Requires a connected calendar" icon="calendar" tone="purple" />
        <MetricCard label="Needs your review" value={String(outstanding.length)} change={outstanding.length ? "Action needed" : "All clear"} detail="pending workspace approvals" icon="shield" tone="peach" alert onClick={() => setActivePage("approvals")} />
      </section>

      <section className="overview-main-grid">
        <div className="console-card approval-summary-card">
          <div className="card-heading"><div><h2>Approvals waiting</h2><p>Requests that need a team member to decide.</p></div><button className="text-link" onClick={() => setActivePage("approvals")}>View all <Icon name="arrow" size={14} /></button></div>
          {outstanding.length === 0 ? <div className="empty-approvals"><Icon name="check" size={20} /><span>Nothing waiting for review.</span></div> : <div className="attention-list">{outstanding.slice(0, 3).map((item) => <button className="attention-item" key={item.id} onClick={() => setActivePage("approvals")}><Avatar initials={item.initials} small /><span className="attention-copy"><strong>{item.title}</strong><small>{item.person} · {item.company}</small></span><span className="attention-time">{item.time}</span><Icon name="chevron" size={15} /></button>)}</div>}
          <div className="approval-card-footer"><span><span className="attention-dot" /> {outstanding.length} awaiting approval</span><button onClick={() => setActivePage("approvals")}>Review queue <Icon name="arrow" size={14} /></button></div>
        </div>

        <div className="console-card live-activity-card">
          <div className="card-heading"><div><p className="section-kicker">RECENT WORK</p><h2>Actions taken by Torqe.</h2><p>Recent agent actions across your workspace.</p></div><button className="text-link" onClick={() => setActivePage("activity")}>View activity <Icon name="arrow" size={14} /></button></div>
          <div className="activity-list">{activity.length ? activity.slice(0, 4).map((item) => <ActivityRow key={item.id} item={item} />) : <div className="empty-approvals">Workspace activity will appear here when recorded.</div>}</div>
        </div>
      </section>

      <section className="overview-bottom-grid">
        <div className="console-card performance-card">
          <div className="card-heading"><div><p className="section-kicker">LAST 7 DAYS</p><h2>Conversation activity</h2><p>Based on conversation records currently in this workspace.</p></div></div>
          <div className="chart-summary"><strong>{days.reduce((sum, day) => sum + day.count, 0)}</strong><span>conversations received</span></div>
          <div className="chart-legend"><span><i className="legend-orange" />Conversations</span><span className="chart-period-note">Latest 100 records</span></div>
          <div className="chart" role="img" aria-label="Conversation counts for the last seven days">
            <div className="chart-y-labels"><span>{maxCount}</span><span>{Math.ceil(maxCount * .75)}</span><span>{Math.ceil(maxCount * .5)}</span><span>{Math.ceil(maxCount * .25)}</span><span>0</span></div>
            <div className="chart-plot">{days.map((day) => <div className="chart-day" key={day.label}><div className="chart-bars"><i style={{ height: `${day.count ? Math.max(4, day.count / maxCount * 100) : 0}%` }} /></div><span>{day.label}</span></div>)}</div>
          </div>
        </div>
        <div className="console-card agent-status-card">
          <div className="card-heading"><div><p className="section-kicker">AGENT STATUS</p><h2>Agent status and safety</h2><p>Server configuration and workspace operating mode.</p></div><span className="agent-orbit"><Icon name="spark" size={18} /></span></div>
          <div className="agent-state-row"><span className="agent-status-dot" /><strong>{autopilot ? "Autopilot enabled" : "Autopilot paused"}</strong><span className="agent-mode">{autopilot ? "ON" : "OFF"}</span></div>
          <p className="agent-status-note">External execution remains unavailable until a reviewed worker and connected tools are deployed.</p>
          <div className="agent-connection-list"><ConnectionStatus label="Supabase database" connected={status.supabase.configured} /><ConnectionStatus label="NVIDIA model" connected={status.model.configured} /></div>
          <button className="agent-settings-link" onClick={() => setActivePage("tools")}>Set up tools <Icon name="arrow" size={14} /></button>
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

function InboxPage({ workspaceId, conversations, activeConversation, setActiveConversation, togglePause, search, setSearch, inboxFilter, setInboxFilter, inboxChannel, setInboxChannel }) {
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const visibleConversation = conversations.find((item) => item.id === activeConversation) || conversations[0];
  const isPaused = visibleConversation?.agentPaused || false;
  return (
    <div className={`inbox-layout console-card ${mobileThreadOpen ? "inbox-thread-open" : ""}`}>
      <aside className="inbox-list-panel">
        <div className="inbox-list-heading"><div><p className="section-kicker">TEAM INBOX</p><h2>Conversations</h2><span>{conversations.length} workspace threads</span></div></div>
        <label className="inbox-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or companies" /></label>
        <div className="inbox-filters"><button className={inboxFilter === "all" ? "filter-active" : ""} onClick={() => setInboxFilter("all")}>All <span>{conversations.length}</span></button><button className={inboxFilter === "review" ? "filter-active" : ""} onClick={() => setInboxFilter("review")}>Needs review <span>{conversations.filter((item) => item.status === "Needs review").length}</span></button><label className="channel-filter"><span>Channel</span><select aria-label="Filter by channel" value={inboxChannel} onChange={(event) => setInboxChannel(event.target.value)}><option value="all">All channels</option><option value="whatsapp">WhatsApp</option><option value="gmail">Email</option><option value="linkedin">LinkedIn</option><option value="web">Web</option><option value="other">Other</option></select></label></div>
        <div className="conversation-list">{conversations.length ? conversations.map((item) => <button key={item.id} className={`conversation-row ${item.id === visibleConversation?.id ? "conversation-selected" : ""}`} onClick={() => { setActiveConversation(item.id); setMobileThreadOpen(true); }}><Avatar initials={item.initials} color={item.color} /><span className="conversation-copy"><span className="conversation-name-row"><strong>{item.name}</strong><small>{item.time}</small></span><span className="conversation-company">{item.company}</span><span className="conversation-preview">{item.preview}</span><span className="conversation-tags"><ChannelMark type={item.channelKey} /><span className={`conversation-state ${item.status === "Needs review" ? "state-review" : ""}`}>{item.status}</span></span></span>{item.unread > 0 && <span className="unread-dot" />}</button>) : <div className="conversation-empty">No conversations match. Adjust your search or filters.</div>}</div>
      </aside>
      {visibleConversation ? <section className={`thread-panel ${mobileThreadOpen ? "thread-mobile-open" : ""}`}>
        <div className="thread-heading"><button className="thread-back-button" onClick={() => setMobileThreadOpen(false)} aria-label="Back to conversations"><Icon name="chevron" size={18} /></button><div className="thread-person"><Avatar initials={visibleConversation.initials} color={visibleConversation.color} /><span><strong>{visibleConversation.name}</strong><small>{visibleConversation.company} <span>·</span> {visibleConversation.channel}</small></span></div><div className="thread-tools"><StatusPill tone={isPaused ? "warning" : "success"}>{isPaused ? "AI paused" : "AI active"}</StatusPill><button className={`thread-pause-button ${isPaused ? "is-paused" : ""}`} onClick={() => togglePause(visibleConversation.id)}><Icon name={isPaused ? "spark" : "pause"} size={15} />{isPaused ? "Resume AI" : "Pause AI"}</button></div></div>
        <div className="thread-context"><span className="context-tag">{visibleConversation.intent}</span><span className="context-score"><Icon name="trend" size={14} /> Lead score <strong>{visibleConversation.score}</strong></span><span className="context-owner">{visibleConversation.company}</span></div>
        <div className="thread-messages">{(visibleConversation.messages || []).map((message, index) => <div key={`${visibleConversation.id}-${index}`} className={`message-row message-${message.from}`}><span className="message-author">{message.from === "prospect" ? visibleConversation.name.split(" ")[0] : message.from === "agent" ? "Torqe agent" : message.from === "human" ? "Workspace member" : "System"} <span>· {message.time}</span></span><div className="message-bubble">{message.text}{message.pending && <StatusPill tone="warning">Human follow-up</StatusPill>}</div></div>)}</div>
        <ConversationDraft workspaceId={workspaceId} conversationId={visibleConversation.id} />
      </section> : <section className="thread-panel thread-empty"><span className="empty-file"><Icon name="inbox" size={21} /></span><p>Select different filters to see matching conversations.</p></section>}
    </div>
  );
}

function ConversationDraft({ workspaceId, conversationId }) {
  const [draft, setDraft] = useState("");
  const [savedDraft, setSavedDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ workspaceId, conversationId });
    fetch(`/api/console/conversation-drafts?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this draft.");
        if (active) {
          setDraft(data.draft.body || "");
          setSavedDraft(data.draft.body || "");
          setSavedAt(data.draft.updated_at || null);
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load this draft."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId, conversationId]);

  async function saveDraft() {
    setSaving(true);
    setError("");
    try {
      const query = new URLSearchParams({ workspaceId, conversationId });
      const response = await fetch(`/api/console/conversation-drafts?${query}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this draft.");
      setDraft(data.draft.body);
      setSavedDraft(data.draft.body);
      setSavedAt(data.draft.updated_at);
    } catch (saveError) {
      setError(saveError.message || "Could not save this draft.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = draft !== savedDraft;
  return <div className="thread-reply">
    <div className="draft-heading"><strong>Private reply draft</strong><span>{savedAt && !hasChanges ? `Saved ${formatRecordTime(savedAt)}` : hasChanges ? "Unsaved changes" : "Not sent"}</span></div>
    <textarea aria-label="Private reply draft" placeholder={loading ? "Loading your draft…" : "Write a reply draft for your team to review…"} rows={3} maxLength={10000} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={loading || Boolean(error && !savedAt)} />
    {error && <p className="draft-error" role="alert">{error}</p>}
    <div className="reply-toolbar"><span><Icon name="lock" size={14} /> Only you can see this draft. Sending is unavailable.</span><button type="button" onClick={saveDraft} disabled={loading || saving || !hasChanges || Boolean(error && !savedAt)}><Icon name={saving ? "activity" : "check"} size={15} />{saving ? "Saving…" : "Save draft"}</button></div>
  </div>;
}

function ApprovalsPage({ approvals, reviewApproval, setActivePage, setActiveConversation }) {
  const pending = approvals.filter((item) => item.status === "pending");
  const reviewed = approvals.filter((item) => item.status !== "pending");
  return <div className="page-stack"><div className="approval-queue-header"><div><span className="queue-count">{pending.length}</span><span> items need your review</span></div><button className="console-secondary-button" onClick={() => setActivePage("automations")}><Icon name="settings" size={15} /> Approval policies</button></div>{pending.length === 0 ? <div className="console-card approval-empty"><span className="empty-check"><Icon name="check" /></span><h2>You’re all caught up.</h2><p>New workspace approvals will appear here when created.</p></div> : <div className="approval-grid">{pending.map((item) => <article className="console-card approval-card" key={item.id}><div className="approval-card-top"><div className={`risk-badge risk-${item.risk.toLowerCase()}`}><Icon name="shield" size={14} />{item.risk} review</div><span className="approval-time">{item.time}</span></div><h2>{item.title}</h2><p className="approval-type">{item.type}</p><div className="approval-requester"><Avatar initials={item.initials} small /><span><strong>{item.person}</strong><small>{item.company}</small></span>{item.conversationId && <button className="text-link" onClick={() => { setActiveConversation(item.conversationId); setActivePage("inbox"); }}>View thread <Icon name="arrow" size={13} /></button>}</div><div className="approval-context"><strong>Approval details</strong><p>{item.reviewReason || "Review the request details and record your decision. This will not trigger an external action."}</p></div><div className="approval-actions"><button className="approval-reject" onClick={() => reviewApproval(item.id, "rejected")}>Reject request</button><button className="approval-approve" onClick={() => reviewApproval(item.id, "approved")}><Icon name="check" size={15} /> Record approval</button></div><p className="preview-action-note">Recording a decision does not send messages or execute external actions.</p></article>)}</div>}{reviewed.length > 0 && <div className="console-card reviewed-card"><div className="card-heading"><div><h2>Recently reviewed</h2><p>Decisions recorded in this workspace.</p></div></div>{reviewed.map((item) => <div className="reviewed-row" key={item.id}><Avatar initials={item.initials} small /><span><strong>{item.title}</strong><small>{item.person} · {item.company}</small></span><StatusPill tone={item.status === "approved" ? "success" : "neutral"}>{item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : "Edited"}</StatusPill></div>)}</div>}</div>;
}

function ActivityRow({ item }) {
  return <div className="activity-row"><span className={`activity-icon activity-${item.tone}`}><Icon name={item.icon} size={16} /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="activity-state"><StatusPill tone={item.state === "Completed" ? "success" : "warning"}>{item.state}</StatusPill></span><span className="activity-time">{item.time}</span></div>;
}

function ActivityPage({ entries }) {
  return <div className="console-card full-activity-card"><div className="card-heading"><div><h2>Workspace activity</h2><p>Recorded audit events for this workspace.</p></div>{entries.length > 0 && <button className="console-secondary-button" onClick={() => exportCsv("torqe-activity.csv", [["Event", "Details", "Time", "Status"], ...entries.map((item) => [item.title, item.detail, item.time, item.state])])}><Icon name="download" size={15} /> Export log</button>}</div>{entries.length ? <div className="activity-list activity-full-list">{entries.map((item) => <ActivityRow key={item.id} item={item} />)}</div> : <div className="activity-table-note"><Icon name="shield" size={15} /> Workspace events will appear here when records are created.</div>}</div>;
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

function ConnectionsPage({ category, status, setIntegrationInfo, integrations }) {
  const items = integrationCatalog.filter((item) => category === "CHANNEL"
    ? item.kind === "CHANNEL"
    : item.kind !== "CHANNEL" && item.kind !== "AI MODEL");
  const connected = new Map(integrations.map((integration) => [integration.provider, integration]));
  const heading = category === "CHANNEL" ? "Messaging channels" : "Connected tools";
  const description = category === "CHANNEL"
    ? "Email, messaging, and social conversations your team wants to manage."
    : "CRM, calendars, support, legal, and payment systems available to the agent.";
  return <div className="integrations-page"><div className="integration-notice"><span><Icon name="shield" size={18} /></span><p><strong>Connections are not active yet.</strong> Provider actions remain unavailable until secure OAuth, webhooks, and execution workers are configured and reviewed.</p><StatusPill tone="warning">Setup required</StatusPill></div><div className="integration-section-heading"><div><h2>{heading}</h2><p>{description}</p></div><span className="integration-summary">{integrations.length} workspace connections</span></div><div className="integration-grid">{items.map((integration) => {
    const record = connected.get(integration.id);
    const configured = integration.keyCheck ? status[integration.keyCheck]?.configured : record?.status === "connected";
    return <IntegrationCard key={integration.id} integration={integration} configured={Boolean(configured)} onClick={() => setIntegrationInfo(integration)} />;
  })}</div><p className="integration-security-note"><Icon name="lock" size={14} /> Credentials are never collected in this page. Connected-provider setup is pending.</p></div>;
}

function AISettingsPage({ workspaceId, role, showToast }) {
  const [configuration, setConfiguration] = useState(null);
  const [provider, setProvider] = useState("torqe_managed");
  const [model, setModel] = useState(AI_MODELS.nvidia[0].id);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deploymentType, setDeploymentType] = useState("customer_hosted");
  const [deploymentModel, setDeploymentModel] = useState("");
  const [deploymentRegion, setDeploymentRegion] = useState("");
  const [deploymentEndpoint, setDeploymentEndpoint] = useState("");
  const [deploymentRequirements, setDeploymentRequirements] = useState("");
  const [deploymentSaving, setDeploymentSaving] = useState(false);
  const [deploymentError, setDeploymentError] = useState("");
  const [deploymentSubmitted, setDeploymentSubmitted] = useState(false);
  const canManage = ["owner", "admin"].includes(role);
  const models = provider === "openai_byok" ? AI_MODELS.openai : AI_MODELS.nvidia;
  const currentKeyConfigured = configuration?.provider === provider && configuration.keyConfigured;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/console/ai/config?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load AI settings.");
        if (active) {
          setConfiguration(data.configuration);
          setProvider(data.configuration.provider);
          setModel(data.configuration.model);
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load AI settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  function changeProvider(nextProvider) {
    setProvider(nextProvider);
    const nextModels = nextProvider === "openai_byok" ? AI_MODELS.openai : AI_MODELS.nvidia;
    if (!nextModels.some((item) => item.id === model)) setModel(nextModels[0].id);
  }

  async function saveConfiguration(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/console/ai/config?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save AI settings.");
      setConfiguration(data.configuration);
      setApiKey("");
      showToast("Workspace AI settings saved securely.");
    } catch (saveError) {
      setError(saveError.message || "Could not save AI settings.");
    } finally {
      setSaving(false);
    }
  }

  async function submitDeploymentRequest(event) {
    event.preventDefault();
    setDeploymentSaving(true);
    setDeploymentError("");
    try {
      const response = await fetch("/api/console/ai/deployment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          deploymentType,
          modelPreference: deploymentModel,
          region: deploymentRegion,
          endpoint: deploymentEndpoint,
          requirements: deploymentRequirements,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit deployment request.");
      setDeploymentSubmitted(true);
      showToast("Private deployment request submitted.");
    } catch (requestError) {
      setDeploymentError(requestError.message || "Could not submit deployment request.");
    } finally {
      setDeploymentSaving(false);
    }
  }

  return <div className="ai-settings-page">
    <div className="integration-notice"><span><Icon name="shield" size={18} /></span><p><strong>Torqe is not fine-tuned on this form.</strong> It configures the serving model and workspace instructions; training model weights requires a separate data, evaluation, and deployment process.</p><StatusPill tone="warning">No fine-tuning</StatusPill></div>
    <section className="console-card ai-config-card">
      <div className="card-heading"><div><p className="section-kicker">WORKSPACE AI</p><h2>Choose a model provider</h2><p>API keys are encrypted on the server and never returned to the browser.</p></div></div>
      {loading ? <div className="inbox-empty"><span>Loading AI settings…</span></div> : !configuration ? <p className="access-error" role="alert">{error || "AI settings could not be loaded."}</p> : <form className="ai-config-form" onSubmit={saveConfiguration}>
        <label htmlFor="ai-provider">Provider</label>
        <select id="ai-provider" value={provider} onChange={(event) => changeProvider(event.target.value)} disabled={!canManage}>
          <option value="torqe_managed">Torqe managed · NVIDIA</option>
          <option value="nvidia_byok">NVIDIA · use my API key</option>
          <option value="openai_byok">OpenAI · use my API key</option>
        </select>
        <label htmlFor="ai-model">Model</label>
        <select id="ai-model" value={model} onChange={(event) => setModel(event.target.value)} disabled={!canManage}>
          {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        {provider !== "torqe_managed" && <><label htmlFor="ai-api-key">Provider API key</label><input id="ai-api-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={currentKeyConfigured ? "Saved securely · enter a new key to replace" : "Paste provider API key"} disabled={!canManage} /><small>{currentKeyConfigured ? "A key is saved. Leave this blank to keep it." : "Required to use this provider."}</small></>}
        {error && <p className="access-error" role="alert">{error}</p>}
        {!canManage && <p className="integration-security-note">Only workspace owners and admins can change model settings.</p>}
        {canManage && <button className="console-primary-button" type="submit" disabled={saving || loading}>{saving ? "Saving…" : "Save AI settings"} <Icon name="check" size={16} /></button>}
        <div className="ai-provider-status"><StatusPill tone={(provider === "torqe_managed" ? configuration?.managedKeyConfigured : currentKeyConfigured) ? "success" : "warning"}>{provider === "torqe_managed" ? configuration?.managedKeyConfigured ? "Managed key configured" : "Managed key missing" : currentKeyConfigured ? "Workspace key configured" : "API key required"}</StatusPill><span>Changes apply to Torqe Copilot for this workspace.</span></div>
      </form>}
    </section>

    <section className="console-card deployment-request-card">
      <div className="card-heading"><div><p className="section-kicker">PRIVATE OR LOCAL HOSTING</p><h2>Request a private deployment</h2><p>Tell our team about a customer-hosted or private-cloud setup. This submits an inquiry only; it will not connect to your endpoint.</p></div></div>
      {deploymentSubmitted ? <div className="deployment-confirmation" role="status"><Icon name="check" size={19} /><span><strong>Request received.</strong><small>Our team will follow up through your workspace account email. No endpoint connection was attempted.</small></span></div>
        : <form className="ai-config-form deployment-form" onSubmit={submitDeploymentRequest}>
          <label htmlFor="deployment-type">Deployment model</label>
          <select id="deployment-type" value={deploymentType} onChange={(event) => setDeploymentType(event.target.value)}>
            <option value="customer_hosted">Run in our own environment</option>
            <option value="torqe_private_cloud">Torqe-managed private cloud</option>
            <option value="private_endpoint">Connect a private model endpoint</option>
          </select>
          <label htmlFor="deployment-model">Model / serving preference</label>
          <input id="deployment-model" value={deploymentModel} onChange={(event) => setDeploymentModel(event.target.value)} placeholder="Model name or serving requirements" maxLength={128} required />
          <label htmlFor="deployment-region">Region / hosting location</label>
          <input id="deployment-region" value={deploymentRegion} onChange={(event) => setDeploymentRegion(event.target.value)} placeholder="e.g. EU, US-East, on-premises" maxLength={100} required />
          {deploymentType === "private_endpoint" && <><label htmlFor="deployment-endpoint">Private endpoint URL</label><input id="deployment-endpoint" type="url" value={deploymentEndpoint} onChange={(event) => setDeploymentEndpoint(event.target.value)} placeholder="https://model.internal.example" maxLength={500} required /><small>Stored for review only. Torqe will not make a network request to this URL.</small></>}
          <label htmlFor="deployment-requirements">Security, scale, or compliance requirements <span>(optional)</span></label>
          <textarea id="deployment-requirements" value={deploymentRequirements} onChange={(event) => setDeploymentRequirements(event.target.value)} maxLength={3000} rows={4} placeholder="Share deployment, data residency, or security requirements." />
          {deploymentError && <p className="access-error" role="alert">{deploymentError}</p>}
          {!canManage && <p className="integration-security-note">Only workspace owners and admins can submit a deployment request.</p>}
          <button className="console-secondary-button" type="submit" disabled={deploymentSaving || !canManage}>{deploymentSaving ? "Submitting…" : "Submit private deployment request"} <Icon name="arrow" size={15} /></button>
        </form>}
    </section>
  </div>;
}

function ProfilePage({ user, onUpdated, showToast }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setName(user?.name || ""), [user?.name]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/console/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update your profile.");
      onUpdated(data.user.name);
      showToast("Profile updated.");
    } catch (saveError) {
      setError(saveError.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="console-card profile-card"><div className="card-heading"><div><p className="section-kicker">ACCOUNT</p><h2>Profile details</h2><p>Update how your name appears to your team.</p></div></div><form className="ai-config-form" onSubmit={saveProfile}><label htmlFor="profile-name">Full name</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /><label htmlFor="profile-email">Sign-in email</label><input id="profile-email" type="email" value={user?.email || ""} readOnly /><small>Your sign-in email is managed by your workspace administrator.</small>{error && <p className="access-error" role="alert">{error}</p>}<button className="console-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"} <Icon name="check" size={16} /></button></form></section>;
}

function IntegrationCard({ integration, configured, onClick }) {
  return <article className="console-card integration-card"><div className="integration-card-top"><IntegrationLogo integration={integration} /><span className="integration-kind">{integration.kind}</span></div><h3>{integration.name}</h3><p>{integration.detail}</p><div className="integration-card-footer"><StatusPill tone={configured ? "success" : "neutral"}>{configured ? "Key detected" : "Not connected"}</StatusPill><button onClick={onClick}>{configured ? "Manage" : "Connect"} <Icon name="arrow" size={13} /></button></div></article>;
}

function SettingsPage({ status, showToast, workspace, workspaceId, role }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operator");
  const [invitations, setInvitations] = useState([]);
  const [inviteError, setInviteError] = useState("");
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const canManageInvitations = ["owner", "admin"].includes(role);

  useEffect(() => {
    if (!canManageInvitations || !workspaceId) {
      setInvitations([]);
      return undefined;
    }

    let active = true;
    setLoadingInvitations(true);
    setInviteError("");
    fetch(`/api/console/invitations?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load invitations.");
        return data;
      })
      .then((data) => { if (active) setInvitations(data.invitations || []); })
      .catch((error) => { if (active) setInviteError(error.message || "Could not load invitations."); })
      .finally(() => { if (active) setLoadingInvitations(false); });
    return () => { active = false; };
  }, [canManageInvitations, workspaceId]);

  async function sendInvitation(event) {
    event.preventDefault();
    setSendingInvitation(true);
    setInviteError("");
    try {
      const response = await fetch(`/api/console/invitations?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send this invitation.");
      setInviteEmail("");
      showToast("Workspace invitation sent.");
      const listResponse = await fetch(`/api/console/invitations?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" });
      const listData = await listResponse.json();
      if (!listResponse.ok) throw new Error(listData.error || "Invitation sent, but the list could not be refreshed.");
      setInvitations(listData.invitations || []);
    } catch (error) {
      setInviteError(error.message || "Could not send this invitation.");
    } finally {
      setSendingInvitation(false);
    }
  }

  return <div className="settings-layout">
    <section className="console-card settings-section">
      <div className="card-heading"><div><h2>Workspace profile</h2><p>Your organization's console identity.</p></div></div>
      <div className="settings-field"><label htmlFor="workspace-name">Workspace name</label><input id="workspace-name" value={workspace?.name || ""} readOnly aria-describedby="workspace-name-help" /><small id="workspace-name-help">Workspace profile editing is not available yet.</small></div>
      <div className="settings-field"><label htmlFor="workspace-id">Workspace ID</label><div className="settings-readonly" id="workspace-id">{workspaceId}<span>{role || "member"}</span></div></div>
    </section>
    <section className="console-card settings-section">
      <div className="card-heading"><div><h2>Connected services</h2><p>Configuration verified by this deployment.</p></div></div>
      <div className="settings-service"><span className="settings-service-icon"><Icon name="grid" size={16} /></span><span><strong>Supabase</strong><small>Authenticated database session</small></span><StatusPill tone={status.supabase.configured ? "success" : "warning"}>{status.supabase.configured ? "Connected" : "Not configured"}</StatusPill></div>
      <div className="settings-service"><span className="settings-service-icon settings-model-icon"><Icon name="spark" size={16} /></span><span><strong>NVIDIA model</strong><small>Server-side API key</small></span><StatusPill tone={status.model.configured ? "success" : "warning"}>{status.model.configured ? "Key detected" : "Not configured"}</StatusPill></div>
      <p className="settings-secret-note"><Icon name="lock" size={14} /> API secrets are kept on the server and never displayed here.</p>
    </section>
    <section className="console-card settings-section access-settings">
      <div className="card-heading"><div><h2>Team access</h2><p>Invite-only accounts with workspace-scoped roles.</p></div><span className="access-lock-icon"><Icon name="lock" size={17} /></span></div>
      {canManageInvitations ? <>
        <form className="workspace-invite-form" onSubmit={sendInvitation}>
          <label htmlFor="invite-email">Invite a teammate</label>
          <div className="workspace-invite-fields">
            <input id="invite-email" type="email" autoComplete="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" required />
            <select aria-label="Invitation role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="admin">Admin</option><option value="operator">Operator</option><option value="viewer">Viewer</option></select>
            <button type="submit" className="console-primary-button" disabled={sendingInvitation}>{sendingInvitation ? "Sending…" : "Send invite"}</button>
          </div>
          {inviteError && <p className="access-error" role="alert">{inviteError}</p>}
        </form>
        <div className="workspace-invitation-list"><h3>Workspace invitations</h3>
          {loadingInvitations ? <p>Loading invitations…</p> : invitations.length ? invitations.map((invitation) => <div className="security-setting" key={invitation.id}><span><strong>{invitation.email}</strong><small>{invitation.role} · {new Date(invitation.created_at).toLocaleDateString()}</small></span><StatusPill tone={invitation.status === "accepted" ? "success" : "neutral"}>{invitation.status}</StatusPill></div>) : <p>No invitations found for this workspace.</p>}
        </div>
      </> : <div className="settings-warning"><Icon name="shield" size={17} /><span><strong>Administrator access required.</strong> Ask a workspace owner or admin to invite teammates.</span></div>}
    </section>
    <section className="console-card settings-section access-settings">
      <div className="card-heading"><div><h2>Access & security</h2><p>Identity and database protections.</p></div><span className="access-lock-icon"><Icon name="lock" size={17} /></span></div>
      <div className="security-setting"><span><strong>Supabase Auth</strong><small>Individual email and password sign-in</small></span><StatusPill tone="success">Enabled</StatusPill></div>
      <div className="security-setting"><span><strong>Workspace isolation</strong><small>Organization-scoped row-level security</small></span><StatusPill tone="success">Enforced</StatusPill></div>
      <div className="security-setting"><span><strong>External actions</strong><small>Messaging and agent execution workers</small></span><StatusPill tone="warning">Not enabled</StatusPill></div>
    </section>
    <div className="settings-warning"><Icon name="shield" size={17} /><span><strong>Review deployment setup before production.</strong> Apply and verify both Supabase migrations, configure email delivery and the server-side service-role key, then validate invitations and RLS against your target project.</span><button className="text-link" onClick={() => showToast("See the Console README for deployment setup and migration steps.")}>Setup notes <Icon name="arrow" size={13} /></button></div>
  </div>;
}

function IntegrationDialog({ integration, onClose }) {
  return <div className="integration-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="integration-modal" role="dialog" aria-modal="true" aria-labelledby="integration-modal-title"><button className="square-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button><IntegrationLogo integration={integration} /><p className="console-eyebrow">{integration.kind} CONNECTION</p><h2 id="integration-modal-title">Connect {integration.name}</h2><p>{integration.detail}</p><div className="modal-steps"><div><span>1</span><p><strong>Configure credentials</strong><small>Add OAuth credentials or provider tokens to your server environment.</small></p></div><div><span>2</span><p><strong>Authorize your workspace</strong><small>Complete the provider's secure OAuth flow for your organization.</small></p></div><div><span>3</span><p><strong>Verify the connection</strong><small>Test permissions and configure event subscriptions before going live.</small></p></div></div><div className="modal-security"><Icon name="lock" size={15} /> Connection setup isn’t enabled in this preview. No credentials were collected.</div><button className="console-secondary-button modal-done" onClick={onClose}>Got it</button></section></div>;
}
