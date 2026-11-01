import React from "react";

// Small, dependency-free Markdown renderer for chat answers (no raw HTML is ever injected).
const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*|!\[[^\]\n]*\]\([^)\s]+\)|\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(text, k = "i") {
  return text.split(INLINE).map((p, i) => {
    if (!p) return null;
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`")) return <code key={k + i}>{p.slice(1, -1)}</code>;
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) return <strong key={k + i}>{p.slice(2, -2)}</strong>;
    if (p.length > 2 && p.startsWith("*") && p.endsWith("*")) return <em key={k + i}>{p.slice(1, -1)}</em>;
    const image = p.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image && /^https:\/\//i.test(image[2])) {
      return <img key={k + i} className="tc-md-image" src={image[2]} alt={image[1]} loading="lazy" referrerPolicy="no-referrer" />;
    }
    const m = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m) {
      const ext = /^https?:\/\//i.test(m[2]);
      const internal = m[2].startsWith("/") && !m[2].startsWith("//");
      if (!ext && !internal && !m[2].startsWith("mailto:")) return m[1];
      return <a key={k + i} href={m[2]} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{m[1]}</a>;
    }
    return p;
  });
}

const UL = /^\s*[-*•]\s+/, OL = /^\s*\d+[.)]\s+/;
const isSep = (s) => !!s && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(s);
const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export default function Markdown({ text }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0, n = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.trim().startsWith("```")) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(<pre key={n++}><code>{buf.join("\n")}</code></pre>);
      continue;
    }
    const h = l.match(/^#{1,4}\s+(.*)$/);
    if (h) { out.push(<h4 key={n++}>{inline(h[1])}</h4>); i++; continue; }
    if (l.includes("|") && isSep(lines[i + 1])) {
      const head = cells(l); i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) rows.push(cells(lines[i++]));
      out.push(
        <div className="tc-tablewrap" key={n++}><table>
          <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>
      );
      continue;
    }
    if (UL.test(l) || OL.test(l)) {
      const ordered = OL.test(l), re = ordered ? OL : UL, items = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(lines[i++].replace(ordered ? /^\s*(?:\d+[.)]\s+)+/ : re, ""));
      }
      const Tag = ordered ? "ol" : "ul";
      out.push(<Tag key={n++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</Tag>);
      continue;
    }
    const buf = [l]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```)/.test(lines[i].trim()) && !UL.test(lines[i]) && !OL.test(lines[i]) && !(lines[i].includes("|") && isSep(lines[i + 1]))) buf.push(lines[i++]);
    out.push(<p key={n++}>{buf.map((t, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(t)}</React.Fragment>)}</p>);
  }
  return <div className="tc-md">{out}</div>;
}
