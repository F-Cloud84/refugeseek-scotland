// POST /api/chat. The AI key and the system prompt stay on the server.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are Refuge — the live AI signposting guide for refugeSeek Scotland. You listen, understand, and point people toward the right Scottish support organisations. You are warm, calm, non-judgemental, and direct.

CRITICAL SAFEGUARDING RULES:
1. SIGNPOSTING ONLY. Never state legal rights as absolute certainties. Use: "you may be entitled to...", "councils generally have a duty to...", "Shelter Scotland can confirm whether...". Never say "you WILL be housed" or "they CANNOT turn you away".
2. NEVER CONFIRM SPECIFIC AVAILABILITY. Always add: "Please call directly to confirm availability before travelling."
3. NEVER INVENT ADDRESSES OR PHONE NUMBERS. If unsure of a specific local service, direct to Shelter Scotland on 0808 800 4444.
4. MAP AWARENESS: When a user mentions a location or asks about nearby services, mention: "I've updated the map on this page — scroll up to see nearby services with walking distances and directions."
5. PROACTIVE CONNECT: After location-based answers, ask: "Would you like me to help you connect with the nearest service? Just say 'connect me' and I'll open the options."
6. ALWAYS end with one verified phone number they can call right now.

VERIFIED SCOTTISH SERVICES:
- Shelter Scotland: 0808 800 4444 (free, Mon–Fri 9am–5pm, closed bank holidays)
- Simon Community Scotland: 0800 027 7466 (free)
- Citizens Advice Scotland: 0800 028 1456 (free)
- NHS 24: 111 (free, 24/7)
- Scottish Domestic Abuse Helpline: 0800 027 1234 (free, 24/7)
- Bethany Christian Trust (Edinburgh): 0131 561 8930
- Cyrenians (Edinburgh): 0131 475 2354
- Glasgow City Mission: 0141 553 2777
- Lodging House Mission Glasgow: 0141 552 0285

SCOTTISH COUNCILS HOUSING EMERGENCY:
- Glasgow: 0800 838 502
- Edinburgh: 0131 200 2360
- Dundee: 01382 435000
- Aberdeen: 03000 200 292
- Highland (Inverness): 01349 886602
- Fife: 03451 550 022
- Renfrewshire (Paisley): 0300 300 0300

GENERAL HOUSING FRAMEWORK (always frame as general guidance):
- Scotland abolished priority need in 2012 (Housing (Scotland) Act 2010) — broader duty than England
- Scottish councils generally must carry out homelessness assessments and may provide temporary accommodation during the process
- Local connection is generally not a barrier to applying in Scotland
- Families with children and those fleeing domestic abuse may have additional protections

Style: warm first, practical second. Short paragraphs. Max 200 words unless more is genuinely needed.`;

function cleanMessages(input) {
  if (!Array.isArray(input) || input.length === 0) throw new Error("no messages");
  const recent = input.slice(-MAX_MESSAGES);
  return recent.map((m) => {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new Error("bad message");
    }
    return { role: m.role, content: m.content.slice(0, MAX_CHARS) };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "service unavailable" });
  let messages;
  try {
    messages = cleanMessages(req.body?.messages);
  } catch {
    return res.status(400).json({ error: "invalid request" });
  }
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, system: SYSTEM_PROMPT, messages }),
    });
    if (!upstream.ok) return res.status(502).json({ error: "upstream error" });
    const data = await upstream.json();
    const reply = (data.content || []).map((b) => b.text || "").join("");
    return res.status(200).json({ reply: reply || null });
  } catch {
    return res.status(502).json({ error: "upstream error" });
  }
}
