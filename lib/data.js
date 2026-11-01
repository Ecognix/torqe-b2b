export const conversations = [
  {
    id: "c1",
    name: "Olivia Chen",
    company: "Northstar Health",
    channel: "WhatsApp",
    channelKey: "whatsapp",
    initials: "OC",
    color: "lavender",
    preview: "Could we discuss a custom SLA for the pilot?",
    time: "2m",
    unread: 2,
    status: "Needs review",
    intent: "Enterprise pilot",
    score: 94,
    messages: [
      { from: "prospect", text: "We’re looking at a 40-seat pilot for our support team. Can Torqe work with our existing HubSpot instance?", time: "10:42 AM" },
      { from: "agent", text: "Yes — Torqe can sync contacts, deal stages, and conversation activity with HubSpot. I can arrange a technical walkthrough with your team.", time: "10:43 AM" },
      { from: "prospect", text: "Could we discuss a custom SLA for the pilot?", time: "10:47 AM" },
      { from: "agent", text: "I’m bringing in your account team to review the SLA request. They’ll follow up shortly.", time: "10:47 AM", pending: true },
    ],
  },
  { id: "c2", name: "Marcus Reed", company: "Layer Eight", channel: "Email", channelKey: "gmail", initials: "MR", color: "mint", preview: "Thursday at 2pm works perfectly, thanks.", time: "8m", unread: 0, status: "Meeting booked", intent: "Book a demo", score: 88 },
  { id: "c3", name: "Priya Nair", company: "Kestrel AI", channel: "LinkedIn", channelKey: "linkedin", initials: "PN", color: "peach", preview: "Can you send over the API documentation?", time: "16m", unread: 1, status: "In progress", intent: "Technical question", score: 82 },
  { id: "c4", name: "James Walker", company: "Meridian Cloud", channel: "WhatsApp", channelKey: "whatsapp", initials: "JW", color: "sky", preview: "We’d need legal to review the data terms first.", time: "31m", unread: 0, status: "Waiting on team", intent: "Security review", score: 76 },
  { id: "c5", name: "Sofia Alvarez", company: "Brightpath", channel: "Email", channelKey: "outlook", initials: "SA", color: "rose", preview: "Thanks for sharing the pricing overview.", time: "1h", unread: 0, status: "AI handling", intent: "Pricing inquiry", score: 69 },
];

export const approvals = [
  { id: "a1", title: "Custom SLA request", person: "Olivia Chen", company: "Northstar Health", type: "Commercial terms", time: "2 min ago", risk: "High", initials: "OC", status: "pending", conversationId: "c1" },
  { id: "a2", title: "Non-standard data retention", person: "James Walker", company: "Meridian Cloud", type: "Security exception", time: "18 min ago", risk: "High", initials: "JW", status: "pending", conversationId: "c4" },
  { id: "a3", title: "Enterprise quote · 40 seats", person: "Maya Patel", company: "Fable Systems", type: "Quote review", time: "42 min ago", risk: "Review", initials: "MP", status: "pending", conversationId: "c1" },
];

export const activities = [
  { id: "e1", title: "Demo booked with Marcus Reed", detail: "Google Calendar · Thursday, 2:00 PM", time: "8m ago", icon: "calendar", tone: "mint", state: "Completed" },
  { id: "e2", title: "SLA request routed for approval", detail: "Olivia Chen · Northstar Health", time: "12m ago", icon: "shield", tone: "peach", state: "Awaiting review" },
  { id: "e3", title: "HubSpot contact updated", detail: "Priya Nair · Kestrel AI", time: "19m ago", icon: "spark", tone: "lavender", state: "Completed" },
  { id: "e4", title: "Security documentation shared", detail: "James Walker · Meridian Cloud", time: "34m ago", icon: "file", tone: "sky", state: "Completed" },
];

export const integrations = [
  { id: "nvidia", name: "NVIDIA NIM", kind: "AI MODEL", detail: "Server-side model access for Torqe Copilot", icon: "N", iconSrc: "/icons/model-nvidia.svg", tone: "green", keyCheck: "model" },
  { id: "hubspot", name: "HubSpot", kind: "CRM", detail: "Sync contacts, deals & activity", icon: "H", tone: "orange" },
  { id: "salesforce", name: "Salesforce", kind: "CRM", detail: "Leads, opportunities & activity", icon: "S", tone: "blue" },
  { id: "slack", name: "Slack", kind: "TEAM", detail: "Approvals & escalation alerts", icon: "S", iconSrc: "/icons/tool-slack.svg", tone: "purple" },
  { id: "teams", name: "Microsoft Teams", kind: "TEAM", detail: "Approvals, alerts & team handoffs", icon: "T", iconSrc: "/icons/tool-microsoft-teams.svg", tone: "blue" },
  { id: "google-calendar", name: "Google Calendar", kind: "CALENDAR", detail: "Availability & meeting bookings", icon: "G", iconSrc: "/icons/tool-google-calendar.svg", tone: "blue" },
  { id: "outlook-calendar", name: "Outlook Calendar", kind: "CALENDAR", detail: "Availability & meeting bookings", icon: "O", tone: "blue" },
  { id: "whatsapp", name: "WhatsApp Business", kind: "CHANNEL", detail: "Inbound messages & replies", icon: "W", iconSrc: "/icons/channel-whatsapp.svg", tone: "green" },
  { id: "gmail", name: "Gmail", kind: "CHANNEL", detail: "Shared inbox and email threads", icon: "M", iconSrc: "/icons/channel-gmail.svg", tone: "red" },
  { id: "outlook", name: "Outlook", kind: "CHANNEL", detail: "Shared inbox and email threads", icon: "O", iconSrc: "/icons/channel-outlook.svg", tone: "blue" },
  { id: "linkedin", name: "LinkedIn", kind: "CHANNEL", detail: "Inbound conversations & lead context", icon: "in", iconSrc: "/icons/channel-linkedin.svg", tone: "blue" },
  { id: "docusign", name: "DocuSign / PandaDoc", kind: "LEGAL", detail: "Prepare and route approved agreements", icon: "D", tone: "orange" },
  { id: "stripe", name: "Stripe", kind: "PAYMENTS", detail: "Create approved quotes & payment links", icon: "S", tone: "purple" },
  { id: "support", name: "Jira / Zendesk", kind: "SUPPORT", detail: "Create and route support tickets", icon: "J", tone: "blue" },
  { id: "cohere", name: "Cohere Rerank", kind: "RETRIEVAL", detail: "Rerank approved knowledge search results", icon: "C", tone: "green" },
  { id: "webhook", name: "Internal webhooks", kind: "CUSTOM", detail: "Connect approved product workflows", icon: "↗", tone: "orange" },
];

export const navItems = [
  { id: "overview", label: "Overview", icon: "grid", section: "Workspace" },
  { id: "inbox", label: "Live inbox", icon: "inbox", badge: "5" },
  { id: "approvals", label: "Approvals", icon: "check", badge: "3" },
  { id: "activity", label: "Activity log", icon: "activity" },
  { id: "automations", label: "Automations", icon: "spark", section: "Agent" },
  { id: "knowledge", label: "Knowledge base", icon: "file" },
  { id: "integrations", label: "Integrations", icon: "plug", section: "Connections" },
  { id: "settings", label: "Settings", icon: "settings" },
];
