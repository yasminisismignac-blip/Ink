// InkCore — ponto de entrada. Roda DEPOIS do TokenSaver (loading_order 200 > 100).

import { DEFAULTS, MODULE, STRENGTH } from './src/defaults.js';
import { applyInkCore } from './src/engine.js';
import { recordRun, resetStats, summarize } from './src/stats.js';
import { mountUI } from './src/ui.js';

const LOG = '[InkCore]';
const ctx = () => SillyTavern.getContext();

let ui = null;
let last = null;
const recentFocus = [];
const recentHooks = [];
const recentEnds = [];

function getSettings() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) extensionSettings[MODULE] = structuredClone(DEFAULTS);
    const s = extensionSettings[MODULE];
    for (const k of Object.keys(DEFAULTS)) if (!Object.hasOwn(s, k)) s[k] = structuredClone(DEFAULTS[k]);
    return s;
}
const save = () => ctx().saveSettingsDebounced();

function applyStrength(name) {
    if (STRENGTH[name]) Object.assign(getSettings(), STRENGTH[name], { strength: name });
}

function shouldRun(s) {
    if (!s.enabled) return false;
    const c = ctx();
    if (c.mainApi && c.mainApi !== 'openai') return false;
    if (s.onlyOpenRouter && document.getElementById('chat_completion_source')?.value !== 'openrouter') return false;
    if (s.onlyFreeModels) {
        const model = String(document.getElementById('model_openrouter_select')?.value ?? '');
        if (!model.endsWith(':free')) return false;
    }
    return true;
}

function clip(text, max) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '));
    return (end > max * 0.5 ? cut.slice(0, end) : cut.trimEnd()) + '.';
}

function getInfo(s) {
    const c = ctx();
    const subst = (t) => (typeof c.substituteParams === 'function' ? c.substituteParams(t) : t);
    let anchorAuto = '';
    if (s.anchorAuto && !c.groupId) {
        const card = c.characters?.[c.characterId];
        const raw = card?.personality || card?.data?.personality || '';
        if (raw) anchorAuto = clip(subst(raw), 350);
    }
    return { charName: c.name2, userName: c.name1, anchorAuto, subst, turn: Array.isArray(c.chat) ? c.chat.length : undefined };
}

function remember(list, items, max) {
    list.push(...items);
    list.splice(0, Math.max(0, list.length - max));
}

function onPromptReady(data) {
    try {
        const s = getSettings();
        if (!data || !Array.isArray(data.chat) || !shouldRun(s)) return;

        const res = applyInkCore(data.chat, s, getInfo(s), { recent: recentFocus, recentHooks, recentEnds });
        data.chat.splice(0, data.chat.length, ...res.messages);

        if (!data.dryRun) {
            remember(recentFocus, res.focusKeys, 4);
            remember(recentHooks, res.plan.hookKeys, 4);
            remember(recentEnds, res.plan.endingKey ? [res.plan.endingKey] : [], 2);
            last = { staticText: res.staticText, tailText: res.tailText };
            recordRun(s, res);
            save();
            ui?.refresh();
        }
    } catch (err) {
        console.error(LOG, 'falha ao injetar, prompt mantido como estava:', err);
    }
}

function onSettingsReady(gen) {
    try {
        const s = getSettings();
        if (!gen || !s.samplerNudge || !shouldRun(s)) return;
        if (s.freqPenalty > 0) gen.frequency_penalty = Math.max(Number(gen.frequency_penalty) || 0, s.freqPenalty);
        if (s.presPenalty > 0) gen.presence_penalty = Math.max(Number(gen.presence_penalty) || 0, s.presPenalty);
    } catch (err) {
        console.error(LOG, err);
    }
}

async function showPreview() {
    if (!last) { toastr.info('Ainda não houve injeção nesta sessão.', 'InkCore'); return; }
    const box = document.createElement('div');
    const pre = document.createElement('div');
    pre.className = 'ih-preview';
    pre.textContent = `── injetado ANTES do histórico ──\n${last.staticText || '(nada)'}\n\n── injetado no FIM do prompt ──\n${last.tailText || '(nada)'}`;
    box.append(pre);
    const c = ctx();
    if (c.callGenericPopup) await c.callGenericPopup(box, c.POPUP_TYPE?.TEXT ?? 1, '', { wide: true, large: true, allowVerticalScrolling: true });
    else console.log(LOG, pre.textContent);
}

function tokenSaverStats() {
    const st = ctx().extensionSettings?.tokensaver?.stats;
    if (!st) return null;
    return { saved: Math.max(0, (st.tokensBefore || 0) - (st.tokensAfter || 0)) };
}

(function init() {
    const c = ctx();
    const types = c.eventTypes ?? c.event_types;
    getSettings();
    ui = mountUI({
        getSettings, save, applyStrength,
        resetStats: () => resetStats(getSettings()),
        summarize: () => summarize(getSettings(), getInfo(getSettings())),
        tokenSaver: tokenSaverStats,
        showPreview,
    });
    c.eventSource.on(types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    if (types.CHAT_COMPLETION_SETTINGS_READY) c.eventSource.on(types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    console.log(LOG, 'carregado.');
})();
