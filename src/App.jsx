import { useState, useRef, useEffect, useCallback } from "react";

const MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Smart", icon: "🧠" },
  { id: "claude-haiku-4-5-20251001", label: "Fast", icon: "⚡" },
];

const PERSONAS = [
  { id: "default", label: "Default", icon: "🤖", prompt: "Kamu adalah DiTz AI, asisten cerdas buatan DiTz Store. Jawab natural, ringkas, dan helpful. Bisa bahasa Indonesia maupun Inggris." },
  { id: "programmer", label: "Programmer", icon: "💻", prompt: "Kamu senior programmer expert. Jawab teknis, langsung ke solusi, kasih code yang clean dan efisien. No basa-basi." },
  { id: "trader", label: "Trader", icon: "📈", prompt: "Kamu trader berpengalaman. Analisa market tajam, kasih insight trading actionable, selalu ingatkan manajemen risiko." },
  { id: "guru", label: "Guru", icon: "📚", prompt: "Kamu guru yang sabar dan pintar. Jelaskan dengan mudah dipahami, pakai contoh nyata, dorong semangat belajar." },
  { id: "motivator", label: "Motivator", icon: "🔥", prompt: "Kamu motivator energetik. Jawab penuh semangat dan inspirasi, dorong user untuk action sekarang. Gaya anak muda Indonesia." },
];

const STARTERS = [
  "Buatkan script Python sederhana",
  "Analisa XAU/USD hari ini",
  "Tips jualan di Shopee 2026",
  "Jelaskan cara kerja neural network",
];

function parseMarkdown(text) {
  let t = text;
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const esc = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    return `<div class="cb"><div class="cb-head"><span class="cb-lang">${lang || "code"}</span><button class="cb-copy" onclick="navigator.clipboard.writeText(this.closest('.cb').querySelector('code').innerText)">Copy</button></div><pre><code>${esc}</code></pre></div>`;
  });
  t = t.replace(/`([^`\n]+)`/g, '<code class="ic">$1</code>');
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  t = t.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  t = t.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  t = t.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  t = t.replace(/(<li>[\s\S]+?<\/li>)/g, (m) => `<ul>${m}</ul>`);
  t = t.replace(/\n{2,}/g, "</p><p>");
  t = t.replace(/\n/g, "<br/>");
  return `<p>${t}</p>`;
}

function Bubble({ msg, onCopy, onRegen, isLast }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", maxWidth:780, margin:"0 auto", width:"100%", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{ width:32, height:32, borderRadius:10, background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 16px var(--glow)", marginTop:2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
      )}
      <div style={{
        maxWidth:"75%", padding:"11px 15px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "var(--user-bg)" : "var(--ai-bg)",
        color: isUser ? "#fff" : "var(--text)",
        border: isUser ? "none" : "1px solid var(--border)",
        boxShadow: isUser ? "0 4px 16px var(--glow)" : "var(--shadow)",
        fontSize:14, lineHeight:1.65,
      }}>
        {isUser
          ? <p style={{ margin:0, whiteSpace:"pre-wrap" }}>{msg.content}</p>
          : <div className="md" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
        }
        {!isUser && msg.content && (
          <div style={{ display:"flex", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid var(--border)" }}>
            <button className="abtn" onClick={() => onCopy(msg.content)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy
            </button>
            {isLast && (
              <button className="abtn" onClick={onRegen}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> Ulangi
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width:32, height:32, borderRadius:10, background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--text2)"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
        </div>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", maxWidth:780, margin:"0 auto", width:"100%" }}>
      <div style={{ width:32, height:32, borderRadius:10, background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 16px var(--glow)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div style={{ padding:"14px 18px", borderRadius:"16px 16px 16px 4px", background:"var(--ai-bg)", border:"1px solid var(--border)", display:"flex", gap:5, alignItems:"center" }}>
        {[0,1,2].map(i => <span key={i} className={`dot d${i}`} />)}
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(MODELS[0]);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState([{ id:1, title:"Chat baru" }]);
  const [activeId, setActiveId] = useState(1);
  const [toast, setToast] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const send = useCallback(async (overrideMsgs) => {
    const text = input.trim();
    if ((!text && !overrideMsgs) || loading) return;
    const history = overrideMsgs || [...msgs, { role:"user", content:text }];
    if (!overrideMsgs) { setMsgs(history); setInput(""); }
    setLoading(true); setError(null);

    const firstUser = history.find(m => m.role === "user");
    if (firstUser && history.filter(m => m.role === "user").length === 1) {
      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, title: firstUser.content.slice(0, 28) } : s));
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: model.id,
          max_tokens: 1024,
          system: persona.prompt,
          messages: history.slice(-20),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Tidak ada respons.";
      setMsgs([...history, { role:"assistant", content:reply }]);
    } catch(e) {
      setError("❌ " + e.message);
    } finally {
      setLoading(false); inputRef.current?.focus();
    }
  }, [msgs, input, loading, model, persona, activeId]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const regen = () => {
    const idx = [...msgs].reverse().findIndex(m => m.role === "user");
    if (idx === -1) return;
    const cut = msgs.slice(0, msgs.length - 1 - idx + 1);
    setMsgs(cut); send(cut);
  };

  const newChat = () => {
    const id = Date.now();
    setSessions(p => [{ id, title:"Chat baru" }, ...p]);
    setActiveId(id); setMsgs([]); setShowSidebar(false);
  };

  const switchSession = (id) => { setActiveId(id); setMsgs([]); setShowSidebar(false); };

  const delSession = (id, e) => {
    e.stopPropagation();
    setSessions(p => p.filter(s => s.id !== id));
    if (activeId === id) { setMsgs([]); }
  };

  const title = sessions.find(s => s.id === activeId)?.title || "DiTz AI";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .dark{--bg:#0c0c0e;--bg2:#131315;--bg3:#1a1a1f;--border:rgba(255,255,255,0.07);--text:#ededf0;--text2:#7777aa;--accent:#7c6fdf;--glow:rgba(124,111,223,0.35);--user-bg:linear-gradient(135deg,#7c6fdf,#a78bfa);--ai-bg:#18181d;--shadow:0 6px 28px rgba(0,0,0,0.35);--sb:#0a0a0c}
        .light{--bg:#f2f2f5;--bg2:#ffffff;--bg3:#e8e8ed;--border:rgba(0,0,0,0.07);--text:#1a1a2e;--text2:#6666aa;--accent:#6256d0;--glow:rgba(98,86,208,0.2);--user-bg:linear-gradient(135deg,#6256d0,#8b7cf6);--ai-bg:#ffffff;--shadow:0 4px 16px rgba(0,0,0,0.07);--sb:#ebebef}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text)}
        .app{display:flex;height:100vh;overflow:hidden}
        .sb{width:255px;min-width:255px;background:var(--sb);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:14px 10px;gap:7px;transition:transform .18s ease}
        .sb-logo{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;color:#a78bfa;padding:6px 8px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;letter-spacing:-0.5px}
        .lp{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--glow)}
        .ncb{width:100%;padding:9px 13px;border-radius:9px;border:1px dashed var(--border);background:transparent;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .18s ease}
        .ncb:hover{border-color:var(--accent);color:var(--accent);background:rgba(124,111,223,0.05)}
        .slist{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:3px}
        .slist::-webkit-scrollbar{width:3px}.slist::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
        .si{padding:8px 11px;border-radius:9px;cursor:pointer;font-size:13px;color:var(--text2);display:flex;align-items:center;justify-content:space-between;gap:8px;transition:all .18s ease;overflow:hidden}
        .si:hover,.si.act{background:var(--bg3);color:var(--text)}.si.act{color:#a78bfa;font-weight:500}
        .st{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .db{opacity:0;background:none;border:none;color:#ff7070;cursor:pointer;font-size:13px;padding:2px 4px;border-radius:4px}
        .si:hover .db{opacity:1}
        .sf{padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text2);text-align:center}
        .main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
        .hdr{padding:11px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0}
        .htitle{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .mpill{padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:var(--bg3);font-size:12px;color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s ease;display:flex;align-items:center;gap:5px;white-space:nowrap}
        .mpill:hover{border-color:var(--accent);color:var(--accent)}
        .ibtn{background:none;border:none;color:var(--text2);cursor:pointer;padding:5px;border-radius:7px;font-size:15px;transition:all .18s ease;display:flex;align-items:center}
        .ibtn:hover{color:var(--text);background:var(--bg3)}
        .sp{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 18px;display:flex;gap:20px;flex-shrink:0;overflow-x:auto}
        .sg{display:flex;flex-direction:column;gap:5px;min-width:fit-content}
        .slbl{font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;font-weight:600}
        .pg{display:flex;gap:5px;flex-wrap:wrap}
        .pill{padding:4px 11px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s ease;white-space:nowrap}
        .pill:hover{border-color:#a78bfa;color:#a78bfa}
        .pill.on{background:var(--accent);border-color:var(--accent);color:#fff}
        .ca{flex:1;overflow-y:auto;padding:22px 18px;display:flex;flex-direction:column;gap:18px}
        .ca::-webkit-scrollbar{width:3px}.ca::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
        .wlc{text-align:center;padding:50px 20px;color:var(--text2);flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
        .wi{font-size:44px;margin-bottom:6px}
        .wlc h2{font-family:'Syne',sans-serif;font-size:22px;color:var(--text)}
        .wlc p{font-size:13px;max-width:300px;line-height:1.6}
        .chips{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:10px}
        .chip{padding:7px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg2);color:var(--text2);font-size:12px;cursor:pointer;transition:all .18s ease;font-family:'DM Sans',sans-serif}
        .chip:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
        .md h1,.md h2,.md h3{font-family:'Syne',sans-serif;margin:8px 0 5px;color:var(--text)}
        .md h1{font-size:17px}.md h2{font-size:15px}.md h3{font-size:14px}
        .md p{margin:5px 0}.md ul{padding-left:18px;margin:5px 0}.md li{margin:2px 0}
        .md strong{color:#a78bfa;font-weight:600}.md em{font-style:italic}
        .cb{border-radius:9px;overflow:hidden;margin:7px 0;border:1px solid var(--border)}
        .cb-head{display:flex;justify-content:space-between;align-items:center;padding:5px 11px;background:rgba(124,111,223,0.1);font-size:11px;color:#a78bfa}
        .cb-copy{background:none;border:1px solid var(--border);color:var(--text2);padding:2px 7px;border-radius:4px;font-size:10px;cursor:pointer;transition:all .18s ease}
        .cb-copy:hover{border-color:var(--accent);color:var(--accent)}
        .cb pre{padding:11px;overflow-x:auto;background:var(--bg)}.cb code{font-family:monospace;font-size:13px;color:#a78bfa}
        .ic{background:var(--bg3);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#a78bfa}
        .abtn{background:none;border:none;color:var(--text2);font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:6px;transition:all .18s ease;font-family:'DM Sans',sans-serif}
        .abtn:hover{background:var(--bg3);color:var(--text)}
        .dot{width:7px;height:7px;border-radius:50%;background:#a78bfa;display:inline-block}
        .d0{animation:b 1.2s infinite}.d1{animation:b 1.2s .2s infinite}.d2{animation:b 1.2s .4s infinite}
        @keyframes b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
        .ebar{margin:7px 18px;padding:9px 14px;background:rgba(255,90,90,0.1);border:1px solid rgba(255,90,90,0.25);border-radius:9px;font-size:13px;color:#ff8080;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
        .ia{padding:14px 18px;border-top:1px solid var(--border);background:var(--bg2);flex-shrink:0}
        .iw{max-width:780px;margin:0 auto;display:flex;align-items:flex-end;gap:9px;background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:9px 12px;transition:border-color .18s ease}
        .iw:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,111,223,0.12)}
        .ci{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;resize:none;max-height:150px;min-height:22px;line-height:1.5}
        .ci::placeholder{color:var(--text2)}
        .sbtn{width:35px;height:35px;border-radius:9px;background:var(--accent);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s ease;box-shadow:0 2px 12px var(--glow)}
        .sbtn:hover:not(:disabled){transform:scale(1.06)}
        .sbtn:disabled{opacity:.35;cursor:not-allowed}
        .hint{text-align:center;font-size:11px;color:var(--text2);margin-top:7px}
        .toast{position:fixed;bottom:75px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:7px 18px;border-radius:20px;font-size:13px;z-index:100;box-shadow:0 4px 20px var(--glow);animation:fi .2s ease}
        @keyframes fi{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10}
        .mbtn{display:none!important}
        @media(max-width:768px){
          .sb{position:fixed;left:0;top:0;bottom:0;z-index:20;transform:translateX(-100%)}
          .sb.open{transform:translateX(0)}
          .mbtn{display:flex!important}
          .ov.open{display:block}
          .ca{padding:14px 12px}
          .ia{padding:10px 12px}
          .sp{padding:9px 12px;gap:14px}
        }
      `}</style>

      <div className={`app ${dark ? "dark" : "light"}`}>
        <div className={`sb ${showSidebar ? "open" : ""}`}>
          <div className="sb-logo"><div className="lp" />DiTz AI</div>
          <button className="ncb" onClick={newChat}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Chat Baru
          </button>
          <div className="slist">
            {sessions.map(s => (
              <div key={s.id} className={`si ${s.id === activeId ? "act" : ""}`} onClick={() => switchSession(s.id)}>
                <span className="st">{s.title}</span>
                <button className="db" onClick={(e) => delSession(s.id, e)}>✕</button>
              </div>
            ))}
          </div>
          <div className="sf">DiTz Store © 2026</div>
        </div>

        <div className={`ov ${showSidebar ? "open" : ""}`} onClick={() => setShowSidebar(false)} />

        <div className="main">
          <div className="hdr">
            <button className="ibtn mbtn" onClick={() => setShowSidebar(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="htitle">{title}</div>
            <button className="mpill" onClick={() => setShowSettings(s => !s)}>
              {persona.icon} {persona.label} · {model.icon} {model.label}
            </button>
            <button className="ibtn" onClick={() => setDark(d => !d)}>{dark ? "☀️" : "🌙"}</button>
          </div>

          {showSettings && (
            <div className="sp">
              <div className="sg">
                <div className="slbl">Model</div>
                <div className="pg">
                  {MODELS.map(m => (
                    <button key={m.id} className={`pill ${model.id === m.id ? "on" : ""}`} onClick={() => setModel(m)}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sg">
                <div className="slbl">Persona</div>
                <div className="pg">
                  {PERSONAS.map(p => (
                    <button key={p.id} className={`pill ${persona.id === p.id ? "on" : ""}`} onClick={() => setPersona(p)}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="ca">
            {msgs.length === 0 ? (
              <div className="wlc">
                <div className="wi">✦</div>
                <h2>DiTz AI siap membantu</h2>
                <p>Tanya apa saja — coding, trading, bisnis, atau sekadar ngobrol santai.</p>
                <div className="chips">
                  {STARTERS.map(q => (
                    <button key={q} className="chip" onClick={() => { setInput(q); inputRef.current?.focus(); }}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m, i) => (
                <Bubble
                  key={i} msg={m}
                  onCopy={(t) => { navigator.clipboard.writeText(t); showToast("✓ Disalin!"); }}
                  onRegen={regen}
                  isLast={i === msgs.length - 1 && m.role === "assistant"}
                />
              ))
            )}
            {loading && <Typing />}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="ebar">
              <span>{error}</span>
              <button className="abtn" onClick={() => setError(null)}>✕</button>
            </div>
          )}

          <div className="ia">
            <div className="iw">
              <textarea
                ref={inputRef}
                className="ci"
                placeholder="Tulis pesan... (Shift+Enter = baris baru)"
                value={input}
                rows={1}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                }}
                onKeyDown={handleKey}
              />
              <button
                className="sbtn"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {loading
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
            <div className="hint">DiTz AI bisa salah · Selalu verifikasi info penting</div>
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
