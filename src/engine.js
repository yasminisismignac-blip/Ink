import { ENDINGS, FOCUS, HOOKS, PROFILES, SLOP } from './library.js';

export const textOf = (content) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('\n');
    return '';
};

export const estimateTokens = (text, cpt = 3.6) => Math.ceil(String(text || '').length / (cpt || 3.6));

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ───────── Anti-clichê mínimo ─────────
const matcherCache = new Map();
export function buildMatchers(langs = 'both', customPhrases = '') {
    const key = `${langs}|${customPhrases}`;
    if (matcherCache.has(key)) return matcherCache.get(key);
    const out = [];
    for (const [pat, label, lang] of SLOP) {
        if (lang === 'any' || langs === 'both' || lang === langs) out.push({ re: new RegExp(pat, 'i'), label });
    }
    for (const raw of String(customPhrases || '').split('\n')) {
        const p = raw.trim();
        if (p) out.push({ re: new RegExp(escRe(p), 'i'), label: p, custom: true });
    }
    matcherCache.set(key, out);
    return out;
}

export function scanSlop(text, matchers) {
    const hits = [];
    for (const m of matchers) if (m.re.test(text)) hits.push(m.label);
    return hits;
}

const words = (t) => t.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];

export function findRepeatedNgrams(texts, n = 4, max = 2) {
    const counts = new Map();
    for (const t of texts) {
        const w = words(t);
        const seen = new Set();
        for (let i = 0; i + n <= w.length; i++) {
            const g = w.slice(i, i + n);
            if (!g.some((x) => x.length >= 4)) continue;
            const s = g.join(' ');
            if (!seen.has(s)) { seen.add(s); counts.set(s, (counts.get(s) || 0) + 1); }
        }
    }
    const rep = [...counts].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([g]) => g);
    return rep.slice(0, max);
}

const opening = (t) => t.replace(/^[\s*_"'“”«»—–-]+/, '').split(/\s+/).slice(0, 2).join(' ');
const endsWithQuestion = (t) => /\?[\s*_"'”»)]*$/.test(t.trim());

const PASSIVE = /(what (?:do|will|would) you do|o que (?:você )?(?:vai |irá )?faz(?:er)?\s*\?|waits? for you|aguarda(?:ndo)? (?:a )?sua (?:resposta|reação|decisão))/i;

export function analyzeHistory(assistantTexts, matchers, minChars = 280) {
    const last = assistantTexts.slice(-3);
    const out = { slop: [], repeated: [], opening: null, noQuestion: false, passive: false, thin: false };
    if (!last.length) return out;
    const hit = new Set();
    for (const t of last) scanSlop(t, matchers).forEach((l) => hit.add(l));
    out.slop = [...hit].slice(0, 3);
    out.passive = PASSIVE.test(last.at(-1).slice(-220));
    if (last.length >= 2) out.thin = last.slice(-2).every((x) => x.length < minChars);
    if (last.length >= 2) {
        out.repeated = findRepeatedNgrams(last, 4, 2);
        const [a, b] = [opening(last.at(-2)), opening(last.at(-1))];
        if (a && a.toLowerCase() === b.toLowerCase()) out.opening = b;
        if (endsWithQuestion(last.at(-2)) && endsWithQuestion(last.at(-1))) out.noQuestion = true;
    }
    return out;
}

// ───────── Diretor (enxuto) ─────────
export function pickFocus(rng, count, recent = [], pool0 = Object.keys(FOCUS)) {
    let pool = pool0.filter((k) => !recent.includes(k));
    if (pool.length < count) pool = pool0;
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
}

// ───────── Blocos ─────────
export const STATIC_HEADER = '[Prose Direction]';
export const TAIL_HEADER = '[Turn Focus]';

export function buildStaticBlock(s) {
    const lines = [STATIC_HEADER];
    if (s.proseBible) {
        lines.push((PROFILES[s.profile] ?? PROFILES.natural).text);
        lines.push(
            '- Nunca escreva diálogos, ações, pensamentos ou sentimentos de {{user}}.',
            '- Termine sempre em um ponto aberto que convoque {{user}} a agir.',
            '- Não resuma, não moralize, não faça comentários meta. Fique na cena e no personagem.'
        );
    }
    if (s.initiative) {
        lines.push('- Iniciativa: o personagem age por vontade própria. Nunca devolva a vez de forma passiva.');
    }
    if (s.antiSlop && s.banCount > 0) {
        const custom = buildMatchers(s.langs, s.customBan).filter((x) => x.custom).map((x) => x.label);
        const pool = (lang) => SLOP.filter(([, label, l]) => l === lang).map(([, label]) => label);
        let base;
        if (s.langs === 'both') {
            const en = pool('en'), pt = pool('pt');
            base = [];
            for (let i = 0; i < Math.max(en.length, pt.length); i++) { if (pt[i]) base.push(pt[i]); if (en[i]) base.push(en[i]); }
        } else base = pool(s.langs);
        const labels = [...custom, ...base.slice(0, s.banCount)];
        if (labels.length) lines.push(`- Evite essas frases prontas: ${labels.map((l) => `"${l}"`).join(', ')}. Diga de outra forma.`);
    }
    const lang = String(s.outputLang || '').trim();
    lines.push(lang ? `Escreva em ${lang}.` : 'Escreva no idioma da conversa.');
    return lines.length > 1 ? lines.join('\n') : '';
}

export function buildTailBlock(s, info, analysis, plan) {
    const lines = [TAIL_HEADER];
    const items = [];

    // Máximo: 1 foco, 1 gancho, 1 final por turno.
    if (plan.focusKeys?.[0]) items.push(`Foco: ${FOCUS[plan.focusKeys[0]]}`);
    if (plan.hookKeys?.[0]) items.push(`Gancho: ${HOOKS[plan.hookKeys[0]]}`);
    if (plan.endingKey) items.push(`Final: ${ENDINGS[plan.endingKey]}`);

    if (s.radarEnabled !== false && analysis) {
        if (analysis.slop.length) items.push(`Não repita: ${analysis.slop.map((x) => `"${x}"`).join(', ')}.`);
        if (analysis.repeated.length) items.push(`Evite: "${analysis.repeated[0]}".`);
        if (analysis.noQuestion) items.push('Não termine com pergunta.');
        if (analysis.passive && s.initiative) items.push('Faça um movimento próprio; não devolva a vez passivamente.');
    }

    const threads = String(s.threads || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3);
    if (threads.length) items.push(`Fios soltos: ${threads.join('; ')}.`);

    if (items.length) lines.push(items.map((x) => `- ${x}`).join('\n'));

    if (s.anchor) {
        const parts = [];
        const clean = (x) => String(x).trim().replace(/[.\s]+$/, '');
        if (s.anchorAuto && info?.anchorAuto) parts.push(clean(info.anchorAuto));
        if (String(s.anchorText || '').trim()) parts.push(clean(s.anchorText));
        if (parts.length) {
            lines.push(`[Âncora]\nMantenha {{char}} fiel a: ${parts.join('. ')}. Sem amolecer nem virar genérico.`);
        }
    }

    return lines.length > 1 ? lines.join('\n') : '';
}

export function buildPlan(s, rng, deps = {}, turn = 0) {
    return {
        focusKeys: s.director ? pickFocus(rng, s.focusCount, deps.recent ?? []) : [],
        hookKeys: s.hooks ? pickFocus(rng, 1, deps.recentHooks ?? [], Object.keys(HOOKS)) : [],
        endingKey: s.hookEnding ? pickFocus(rng, 1, deps.recentEnds ?? [], Object.keys(ENDINGS))[0] : null,
    };
}

// ───────── Injeção ─────────
const isInk = (m) => typeof m.content === 'string' && (m.content.startsWith(STATIC_HEADER) || m.content.startsWith(TAIL_HEADER));
const isHistoryStart = (m) =>
    m.role !== 'system' || (m.name && m.name.startsWith('example_')) ||
    (typeof m.content === 'string' && /^\[(start a new chat|example chat)\]$/i.test(m.content.trim()));

export function injectBlocks(chat, staticText, tailText, o) {
    const out = chat.filter((m) => !isInk(m)).map((m) => ({ ...m }));
    if (staticText) {
        let idx = out.findIndex(isHistoryStart);
        if (idx < 0) idx = Math.max(0, out.length - 1);
        out.splice(idx, 0, { role: 'system', content: staticText });
    }
    if (tailText) {
        const depth = Math.max(0, o.tailDepth | 0);
        let idx = out.length - depth;
        if (depth === 0 && out.length && out.at(-1).role === 'assistant') idx = out.length - 1;
        out.splice(Math.max(0, idx), 0, { role: o.tailRole === 'user' ? 'user' : 'system', content: tailText });
    }
    return out;
}

const defaultSubst = (text, info) =>
    text.replace(/\{\{char\}\}/gi, info?.charName || 'the character').replace(/\{\{user\}\}/gi, info?.userName || 'the user');

export function applyInkCore(chat, s, info = {}, deps = {}) {
    const rng = deps.rng ?? Math.random;
    const subst = info.subst ?? ((t) => defaultSubst(t, info));

    const assistants = chat.filter((m) => m.role === 'assistant' && !m.tool_calls && !isInk(m)).map((m) => textOf(m.content)).filter(Boolean);
    const matchers = buildMatchers(s.langs, s.customBan);
    const analysis = s.antiSlop ? analyzeHistory(assistants, matchers) : null;
    const turn = Number.isFinite(info.turn) ? info.turn : assistants.length;
    const plan = buildPlan(s, rng, deps, turn);

    const staticText = subst(buildStaticBlock(s));
    const tailText = subst(buildTailBlock(s, info, analysis, plan));

    return {
        messages: injectBlocks(chat, staticText, tailText, s),
        staticText,
        tailText,
        focusKeys: plan.focusKeys,
        plan,
        analysis,
        tokens: estimateTokens(staticText + tailText, s.charsPerToken),
    };
}

export function estimateInjectionCost(s, info = {}) {
    const plan = {
        focusKeys: s.director ? Object.keys(FOCUS).slice(0, s.focusCount) : [],
        hookKeys: s.hooks ? Object.keys(HOOKS).slice(0, 1) : [],
        endingKey: s.hookEnding ? 'choice' : null,
    };
    return estimateTokens(buildStaticBlock(s) + buildTailBlock(s, info, null, plan), s.charsPerToken);
}
