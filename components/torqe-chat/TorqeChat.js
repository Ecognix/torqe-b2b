"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import "./torqe-chat.css";

const SESSIONS_KEY = "torqeai-chat-sessions-v1";
const CONSENT_KEY = "torqeai-chat-consent-v1";
const LOGO = "/logo-orange.png"; // put your logo in /public
const uid = () => Math.random().toString(36).slice(2, 10);
const makeSession = () => ({ id: uid(), title: "New chat", updatedAt: Date.now(), messages: [] });
const getTitle = (messages) => messages.find((message) => message.role === "user")?.content?.trim().slice(0, 52) || "New chat";
const strip = (s) => s.replace(/<think>[\s\S]*?(<\/think>|$)/g, "").trimStart(); // hides reasoning blocks some models emit
const MAX_IMG = 3;
// Shrinks an image to at most 1024px and re-encodes it as JPEG, so uploads stay small and fast.
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, 1024 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
  img.src = url;
});

const SUGGESTIONS = [
  { t: "What is Torqe?", p: "What is Torqe and what problem does it solve?", icon: "M4 5h16v11H8l-4 4z" },
  { t: "How does the AI agent work?", p: "Walk me through how the Torqe AI agent works, from trigger to follow-up.", icon: "M4 12h4l2-7 4 14 2-7h4" },
  { t: "What needs human approval?", p: "What does Torqe do on its own, and what needs human approval?", icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z M9 12l2 2 4-4" },
  { t: "Channels and tools", p: "Which channels, calendars and team tools does Torqe work with?", icon: "M4 6h16v12H4z M4 8l8 5 8-5" },
  { t: "Pricing and pilot", p: "How does pricing work, and how do I become a pilot partner?", icon: "M12 2v20 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { t: "Show me an example", p: "Show me an example of Torqe handling a lead from first message to booked meeting.", icon: "M5 4h14v16H5z M9 8h6 M9 12h6 M9 16h3" },
];

const IC = {
  send: "M12 19V5 M5 12l7-7 7 7", copy: "M9 9h10v10H9z M5 15V5h10", check: "M5 12l5 5 9-10", plus: "M12 5v14 M5 12h14",
  redo: "M20 11a8 8 0 00-14-4L4 9 M4 4v5h5 M4 13a8 8 0 0014 4l2-2", close: "M6 6l12 12 M18 6L6 18", clip: "M21 12.5l-8.5 8.5a5.5 5.5 0 01-7.8-7.8l9-9a3.7 3.7 0 015.2 5.2l-9 9a1.8 1.8 0 01-2.6-2.6l8-8",
  share: "M14 3h7v7 M21 3l-11 11 M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6",
  history: "M3 12a9 9 0 109-9 9.5 9.5 0 00-6.4 2.6L3 8 M3 3v5h5 M12 7v5l3 2",
};
const Ico = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

function detectLeadAction(text) {
  const normalized = text.toLowerCase();
  if (/\b(pilot|pilot partner|pilot program)\b/.test(normalized)
    && /\b(apply|application|join|become|sign up|interested|start|submit|fill)\b/.test(normalized)
    || /\b(application form|submit (?:an? )?application|fill (?:out )?(?:an? )?application)\b/.test(normalized)) return "pilot";
  if (/\b(demo|demonstration)\b/.test(normalized)
    && /\b(book|schedule|request|arrange|see|want|like|start)\b/.test(normalized)) return "demo";
  if (/\b(submit|fill out|complete)\b.{0,25}\b(contact )?form\b/.test(normalized)) return "contact";
  if (/\b(contact|email|talk|speak|reach out|connect)\b/.test(normalized)
    && /\b(team|someone|sales|torqe)\b/.test(normalized)) return "contact";
  return null;
}

function LeadActionCard({ action }) {
  const [values, setValues] = useState({ name: "", email: "", company: "", role: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const type = action === "pilot" ? "pilot" : action === "contact" ? "contact" : "demo";
  const title = type === "pilot" ? "Apply to the pilot" : action === "contact" ? "Contact the Torqe team" : "Request a demo";

  const submit = async (event) => {
    event.preventDefault();
    if (!consent || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chat-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, type, consent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your request could not be sent.");
      setSent(true);
    } catch (submitError) {
      setError(submitError.message || "Your request could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <p className="tc-lead-success" role="status">Your {type === "pilot" ? "pilot application" : type === "contact" ? "contact request" : "demo request"} has been sent to the Torqe team. They’ll follow up at {values.email}.</p>;
  }

  return (
    <form className="tc-lead-form" onSubmit={submit}>
      <h3>{title}</h3>
      <p>Share your details and the Torqe team will follow up. Nothing is sent until you submit this form.</p>
      <div className="tc-lead-grid">
        <label>Name<input name="name" autoComplete="name" maxLength={200} required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Work email<input name="email" type="email" autoComplete="email" maxLength={200} required value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} /></label>
        <label>Company<input name="company" autoComplete="organization" maxLength={200} required value={values.company} onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))} /></label>
        <label>Role <span>(optional)</span><input name="role" autoComplete="organization-title" maxLength={200} value={values.role} onChange={(event) => setValues((current) => ({ ...current, role: event.target.value }))} /></label>
      </div>
      <label className="tc-lead-message">What would you like the team to know? <span>(optional)</span>
        <textarea name="message" rows={3} maxLength={3000} value={values.message} onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))} />
      </label>
      <label className="tc-lead-consent">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>I agree to send these details to Torqe so the team can respond to my request. They will be emailed to <a href="mailto:admin@ecognix.in">admin@ecognix.in</a>.</span>
      </label>
      {error && <p className="tc-lead-error" role="alert">{error} <a href="mailto:admin@ecognix.in">Email admin@ecognix.in</a></p>}
      <button className="tc-lead-submit" type="submit" disabled={!consent || busy}>{busy ? "Sending…" : title}</button>
    </form>
  );
}

function splitSuggestions(text) {
  const match = text.match(/\n{2,}\*\*Suggested questions\*\*\s*\n((?:\s*[-*]\s+.+\n?){1,3})\s*$/i);
  if (!match) return { answer: text, questions: [] };
  return {
    answer: text.slice(0, match.index).trimEnd(),
    questions: match[1].split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).slice(0, 3),
  };
}

export default function TorqeChat({ endpoint = "/api/chat", variant = "page", onClose, suggestions = SUGGESTIONS, requestContext = {} }) {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [shared, setShared] = useState(null);
  const [images, setImages] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [consentReady, setConsentReady] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [researchChoice, setResearchChoice] = useState("no");
  const [serviceStatus, setServiceStatus] = useState("checking");
  const abortRef = useRef(null), replyRef = useRef(null), fileRef = useRef(null), taRef = useRef(null), scrollRef = useRef(null), stick = useRef(true);

  const activeSession = sessions.find((session) => session.id === activeId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    let restored = [];
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSIONS_KEY) || "null");
      if (Array.isArray(saved?.sessions)) {
        restored = saved.sessions.filter((session) => session && typeof session.id === "string" && Array.isArray(session.messages));
        if (!restored.some((session) => session.id === saved.activeId)) setActiveId(restored[0]?.id || null);
        else setActiveId(saved.activeId);
      } else {
        const previous = JSON.parse(sessionStorage.getItem("torqeai-chat-v1") || "[]");
        if (Array.isArray(previous) && previous.length) {
          restored = [{ ...makeSession(), title: getTitle(previous), messages: previous }];
          sessionStorage.removeItem("torqeai-chat-v1");
        }
        setActiveId(restored[0]?.id || null);
      }
    } catch {
      setError("Saved chat history could not be read. A new chat session was started.");
      restored = [];
    }
    try {
      const consent = JSON.parse(sessionStorage.getItem(CONSENT_KEY) || "null");
      if (consent?.termsAccepted) {
        setConsentAccepted(true);
        setResearchChoice(consent.researchChoice === "yes" ? "yes" : "no");
      }
    } catch {
      setError("Saved consent preferences could not be read. Please review the consent options again.");
    }
    if (!restored.length) {
      const session = makeSession();
      restored = [session];
      setActiveId(session.id);
    }
    setSessions(restored);
    setStorageReady(true);
    setConsentReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      const savedSessions = sessions.map((session) => ({
        ...session,
        messages: session.messages.map(({ images: _images, ...message }) => message),
      }));
      sessionStorage.setItem(SESSIONS_KEY, JSON.stringify({ sessions: savedSessions, activeId }));
    } catch {
      setError("Chat history could not be saved in this browser session.");
    }
  }, [sessions, activeId, storageReady]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("torqeai:session-count", { detail: sessions.length }));
  }, [sessions.length]);

  useEffect(() => {
    if (endpoint !== "/api/chat") {
      setServiceStatus("ready");
      return;
    }
    let active = true;
    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Chat service status could not be checked.");
        const status = await response.json();
        if (active) setServiceStatus(status.configured ? "ready" : "missing");
      })
      .catch(() => { if (active) setServiceStatus("unavailable"); });
    return () => { active = false; };
  }, [endpoint]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (stick.current && scrollElement) scrollElement.scrollTop = scrollElement.scrollHeight;
  }, [messages, error]);
  useEffect(() => { const el = taRef.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; } }, [input]);

  const updateSessionMessages = useCallback((sessionId, update) => {
    setSessions((previous) => previous.map((session) => {
      if (session.id !== sessionId) return session;
      const nextMessages = typeof update === "function" ? update(session.messages) : update;
      return { ...session, messages: nextMessages, title: getTitle(nextMessages), updatedAt: Date.now() };
    }));
  }, []);

  const send = useCallback(async (text, base = messages, imgs = images) => {
    const q = text.trim();
    if ((!q && !imgs.length) || busy || serviceStatus !== "ready" || !activeId) return;
    const sessionId = activeId;
    const history = [...base, { id: uid(), role: "user", content: q, images: imgs }];
    const leadAction = detectLeadAction(q);
    const reply = { id: uid(), role: "assistant", content: "", ...(leadAction ? { leadAction } : {}) };
    updateSessionMessages(sessionId, [...history, reply]); setInput(""); setImages([]); setBusy(true); setError(null); stick.current = true;
    const ctl = new AbortController(); abortRef.current = ctl;
    replyRef.current = { sessionId, replyId: reply.id };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
        body: JSON.stringify({ ...requestContext, messages: history.map(({ role, content, images: im }) => ({ role, content, ...(im?.length ? { images: im } : {}) })) }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Something went wrong. Please try again."); }
      const contentType = res.headers.get("content-type") || "";
      let answer;
      if (contentType.includes("application/json")) {
        const result = await res.json();
        if (typeof result.reply !== "string") throw new Error("TorqeAI returned an unreadable response.");
        answer = result.reply;
      } else {
        answer = await res.text();
      }
      for (let index = 0; index < answer.length; index += 4) {
        if (ctl.signal.aborted) break;
        const content = answer.slice(0, index + 4);
        updateSessionMessages(sessionId, (current) => current.map((x) => (x.id === reply.id ? { ...x, content } : x)));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Something went wrong.");
        updateSessionMessages(sessionId, (current) => current.filter((x) => !(x.id === reply.id && !x.content)));
      }
    } finally {
      if (abortRef.current === ctl) {
        setBusy(false);
        abortRef.current = null;
        replyRef.current = null;
      }
    }
  }, [messages, busy, endpoint, images, serviceStatus, activeId, updateSessionMessages]);

  const addFiles = async (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, MAX_IMG - images.length));
    const urls = [];
    for (const f of list) { try { urls.push(await fileToDataUrl(f)); } catch {} }
    if (urls.length) setImages((p) => [...p, ...urls].slice(0, MAX_IMG));
  };
  const onPaste = (e) => {
    const fs = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
    if (fs.length) { e.preventDefault(); addFiles(fs); }
  };
  const stop = () => {
    const controller = abortRef.current;
    if (!controller) return;
    controller.abort();
    const reply = replyRef.current;
    if (reply) {
      updateSessionMessages(reply.sessionId, (current) => current.map((message) =>
        message.id === reply.replyId ? { ...message, stopped: true } : message
      ));
    }
    abortRef.current = null;
    replyRef.current = null;
    setBusy(false);
  };
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    replyRef.current = null;
    setBusy(false);
    setError(null);
    setInput("");
    setImages([]);
    setHistoryOpen(false);
    const session = makeSession();
    setSessions((previous) => [session, ...previous]);
    setActiveId(session.id);
  }, []);
  useEffect(() => {
    const handleNewChat = () => newChat();
    const handleHistory = () => setHistoryOpen((open) => !open);
    window.addEventListener("torqeai:new-chat", handleNewChat);
    window.addEventListener("torqeai:history-toggle", handleHistory);
    return () => {
      window.removeEventListener("torqeai:new-chat", handleNewChat);
      window.removeEventListener("torqeai:history-toggle", handleHistory);
    };
  }, [newChat]);
  const selectSession = (sessionId) => {
    abortRef.current?.abort();
    abortRef.current = null;
    replyRef.current = null;
    setActiveId(sessionId);
    setBusy(false);
    setError(null);
    setInput("");
    setImages([]);
    setHistoryOpen(false);
  };
  const acceptConsent = () => {
    try {
      sessionStorage.setItem(CONSENT_KEY, JSON.stringify({ termsAccepted: true, researchChoice, acceptedAt: Date.now() }));
      setConsentAccepted(true);
      setError(null);
    } catch {
      setError("Your consent choice could not be saved. Enable session storage to use TorqeAI.");
    }
  };
  const regenerate = () => {
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx >= 0) send(messages[idx].content, messages.slice(0, idx), messages[idx].images || []);
  };
  const copy = async (m) => {
    try { await navigator.clipboard.writeText(strip(m.content)); setCopied(m.id); setTimeout(() => setCopied(null), 1500); }
    catch { setError("Could not copy the answer. Check your browser clipboard permissions and try again."); }
  };
  const share = async (m) => {
    const text = strip(m.content);
    try {
      if (navigator.share) {
        await navigator.share({ title: "TorqeAI answer", text, url: window.location.href });
        setShared(m.id);
        setTimeout(() => setShared(null), 1500);
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(m.id);
        setTimeout(() => setCopied(null), 1500);
      }
    } catch (error) {
      if (error.name !== "AbortError") setError("Could not share the answer. Try copying it instead.");
    }
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } };
  const onScroll = () => { const el = scrollRef.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };

  const empty = messages.length === 0;
  const lastBot = messages.length && messages[messages.length - 1].role === "assistant" ? messages[messages.length - 1].id : null;

  return (
    <div className={`tc tc-${variant}`}>
      {variant === "widget" && (
        <header className="tc-widget-head">
          <img src={LOGO} alt="" width="26" height="26" className={busy ? "tc-spin tc-thinking" : ""} />
          <div><h2>TorqeAI</h2><p>Ask anything about Torqe</p></div>
          <div className="tc-widget-actions">
            {!empty && <button className="tc-ibtn" onClick={newChat} aria-label="New chat" title="New chat"><Ico d={IC.plus} /></button>}
            {onClose && <button className="tc-ibtn" onClick={onClose} aria-label="Close chat" title="Close"><Ico d={IC.close} /></button>}
          </div>
        </header>
      )}
      {historyOpen && (
        <div className="tc-history-backdrop" onClick={() => setHistoryOpen(false)}>
          <aside className="tc-history" aria-label="Chat history" onClick={(event) => event.stopPropagation()}>
            <div className="tc-history-title">
              <div><h2>Chat history</h2><p>{sessions.length} {sessions.length === 1 ? "chat" : "chats"} in this browser session</p></div>
              <button className="tc-ibtn" onClick={() => setHistoryOpen(false)} aria-label="Close history"><Ico d={IC.close} /></button>
            </div>
            <div className="tc-history-list">
              {sessions.map((session) => (
                <button key={session.id} className={`tc-history-item ${session.id === activeId ? "active" : ""}`} onClick={() => selectSession(session.id)} aria-current={session.id === activeId ? "true" : undefined}>
                  <strong>{session.title}</strong>
                  <span>{session.messages.length} {session.messages.length === 1 ? "message" : "messages"} · {new Date(session.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                </button>
              ))}
            </div>
            <button className="tc-history-new" onClick={newChat}><Ico d={IC.plus} size={17} />New chat</button>
          </aside>
        </div>
      )}
      <div className="tc-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="tc-col" role="log" aria-live="polite">
          {empty && (
            <div className="tc-empty">
              <img src={LOGO} alt="" width="44" height="44" className="tc-spin" />
              <h1>How can I help with Torqe?</h1>
              <p>I am TorqeAI. I can explain how the AI agent works, walk through workflows and pricing, or help you decide if Torqe fits your inbound sales.</p>
              <div className="tc-sug">{suggestions.map((s) => (
                <button key={s.t} onClick={() => send(s.p)}><Ico d={s.icon} size={19} /><span>{s.t}</span></button>
              ))}</div>
            </div>
          )}
          {messages.map((m) => m.role === "user" ? (
            <div key={m.id} className="tc-user">{m.images?.length > 0 && <div className="tc-uimgs">{m.images.map((s, i) => <img key={i} src={s} alt="Attached" />)}</div>}{m.content}</div>
          ) : (
            <div key={m.id} className="tc-bot">
              <img src={LOGO} alt="" width="26" height="26" className={`tc-av ${busy && m.id === lastBot ? "tc-spin tc-thinking" : ""}`} />
              <div className="tc-body">
                {strip(m.content) ? (() => {
                  const parsed = splitSuggestions(strip(m.content));
                  const followups = parsed.questions.length
                    ? parsed.questions
                    : suggestions.filter((suggestion) => !strip(m.content).includes(suggestion.t)).slice(0, 2).map((suggestion) => suggestion.p);
                  return (
                    <>
                      <Markdown text={parsed.answer} />
                      {!busy && !m.stopped && m.id === lastBot && followups.length > 0 && (
                        <div className="tc-followups" aria-label="Suggested questions">
                          <span>Suggested questions</span>
                          {followups.map((question) => (
                            <button key={question} onClick={() => send(question)}>{question}</button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })() : busy && m.id === lastBot ? <div className="tc-dots" aria-label="TorqeAI is thinking"><span /><span /><span /></div> : null}
                {m.leadAction && !m.stopped && <LeadActionCard key={m.id} action={m.leadAction} />}
                {m.stopped && <div className="tc-stopped" role="status"><span>Response stopped</span></div>}
                {!!strip(m.content) && !(busy && m.id === lastBot) && (
                  <div className="tc-actions">
                    <button onClick={() => copy(m)} aria-label="Copy answer" title="Copy"><Ico d={copied === m.id ? IC.check : IC.copy} size={16} /></button>
                    <button className="tc-share" onClick={() => share(m)} aria-label="Share answer" title="Share answer"><Ico d={shared === m.id ? IC.check : IC.share} size={16} /><span>{shared === m.id ? "Shared" : "Share"}</span></button>
                    {m.id === lastBot && <button onClick={regenerate} aria-label="Regenerate answer" title="Regenerate"><Ico d={IC.redo} size={16} /></button>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {error && <div className="tc-error" role="alert">{error}</div>}
        </div>
      </div>

      <div className="tc-composer">
        {serviceStatus === "missing" && (
          <div className="tc-setup" role="status">
            Chat is offline: the site owner needs to configure <code>NVIDIA_API_KEY</code> on the server.
          </div>
        )}
        {serviceStatus === "unavailable" && (
          <div className="tc-setup" role="status">Chat service status could not be reached. Check the server and try again.</div>
        )}
        <form className="tc-box" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          {images.length > 0 && (
            <div className="tc-thumbs">
              {images.map((s, i) => (
                <div key={i} className="tc-thumb"><img src={s} alt="Attached preview" /><button type="button" aria-label="Remove image" onClick={() => setImages((p) => p.filter((_, k) => k !== i))}>&times;</button></div>
              ))}
            </div>
          )}
          <button type="button" className="tc-attach" onClick={() => fileRef.current?.click()} disabled={busy || serviceStatus !== "ready" || images.length >= MAX_IMG} aria-label="Attach an image" title="Attach an image"><Ico d={IC.clip} size={20} /></button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} onPaste={onPaste} rows={1} maxLength={8000} placeholder={serviceStatus === "missing" ? "Chat is temporarily unavailable" : "Ask about Torqe, or attach an image"} aria-label="Message TorqeAI" disabled={serviceStatus !== "ready"} />
          {busy ? (
            <button type="button" className="tc-send" onClick={stop} aria-label="Stop generating"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></button>
          ) : (
            <button type="submit" className="tc-send" disabled={serviceStatus !== "ready" || (!input.trim() && !images.length)} aria-label="Send"><Ico d={IC.send} size={18} /></button>
          )}
        </form>
        <p className="tc-note">TorqeAI can make mistakes. Confirm pricing, security and contract details with the Torqe team.</p>
      </div>
      {consentReady && !consentAccepted && (
        <div className="tc-consent-backdrop">
          <section className="tc-consent" role="dialog" aria-modal="true" aria-labelledby="tc-consent-title">
            <div className="tc-consent-mark"><img src={LOGO} alt="" width="34" height="34" /></div>
            <h2 id="tc-consent-title">Before you start chatting</h2>
            <p>Your messages are sent to NVIDIA to generate replies. If you request web research, your search query is also sent to Bing. Your chat history stays in this browser session; Torqe does not currently collect chats for model training or product research.</p>
            <fieldset className="tc-research-choice">
              <legend>May we use your chats for future product research and development?</legend>
              <label><input type="radio" name="research-consent" value="no" checked={researchChoice === "no"} onChange={() => setResearchChoice("no")} /> No, do not use my chats</label>
              <label><input type="radio" name="research-consent" value="yes" checked={researchChoice === "yes"} onChange={() => setResearchChoice("yes")} /> Yes, I agree to future use</label>
            </fieldset>
            <p className="tc-consent-note">This records your preference for this browser session only. Chat data is not currently collected for training or research, even if you opt in.</p>
            <label className="tc-terms-check">
              <input type="checkbox" checked={termsChecked} onChange={(event) => setTermsChecked(event.target.checked)} />
              <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>.</span>
            </label>
            {error && <p className="tc-consent-error" role="alert">{error}</p>}
            <button className="tc-consent-continue" disabled={!termsChecked} onClick={acceptConsent}>Continue to TorqeAI</button>
          </section>
        </div>
      )}
    </div>
  );
}
