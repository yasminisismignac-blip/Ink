export function mountUI({ getSettings, save, applyStrength, resetStats, summarize, tokenSaver, showPreview }) {
    const root = document.createElement('div');
    root.className = 'ih-root';
    root.innerHTML = `
        <div class="ih-stats">
            <strong>🫀 InkCore</strong><br>
            <span class="ih-last" id="ih-stats-val">Carregando...</span>
        </div>
        <details class="ih-section" open>
            <summary>Configurações rápidas</summary>
            <div class="ih-row"><label>Perfil</label><select id="ih-profile"></select></div>
            <div class="ih-row"><label>Intensidade</label><select id="ih-strength"></select></div>
            <div class="ih-row"><label>Idioma de saída</label><input id="ih-outputLang" placeholder="vazio = idioma da conversa"></div>
            <div class="ih-field"><label><input type="checkbox" id="ih-anchorAuto"> Âncora automática da Personalidade</label></div>
            <div class="ih-field"><label><input type="checkbox" id="ih-initiative"> Iniciativa do personagem</label></div>
            <div class="ih-field"><label><input type="checkbox" id="ih-radar"> Radar adaptativo (anti-repetição)</label></div>
            <div class="ih-field"><label>Clichês banidos customizados (um por linha)</label><textarea id="ih-customBan" rows="2"></textarea></div>
            <div class="ih-field"><label>Âncora manual do personagem</label><textarea id="ih-anchorText" rows="2"></textarea></div>
            <div class="ih-field"><label>Fios soltos da história (um por linha)</label><textarea id="ih-threads" rows="2"></textarea></div>
            <div class="ih-buttons">
                <button id="ih-save">Salvar</button>
                <button id="ih-preview">👁️ Ver última injeção</button>
                <button id="ih-reset">Resetar stats</button>
            </div>
        </details>
    `;

    const s = getSettings();
    const selProfile = root.querySelector('#ih-profile');
    ['natural', 'literario', 'minimalista', 'noir'].forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p; o.selected = s.profile === p;
        selProfile.appendChild(o);
    });
    const selStrength = root.querySelector('#ih-strength');
    ['sutil', 'equilibrado', 'intenso'].forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p; o.selected = s.strength === p;
        selStrength.appendChild(o);
    });

    const bind = (id, key, type = 'text') => {
        const el = root.querySelector(`#${id}`);
        el.value = s[key] ?? '';
        el.onchange = () => {
            const ns = getSettings();
            ns[key] = type === 'checkbox' ? el.checked : el.value;
            save();
        };
    };

    bind('ih-profile', 'profile');
    bind('ih-strength', 'strength');
    bind('ih-outputLang', 'outputLang');
    bind('ih-anchorAuto', 'anchorAuto', 'checkbox');
    bind('ih-initiative', 'initiative', 'checkbox');
    bind('ih-radar', 'radarEnabled', 'checkbox');
    bind('ih-customBan', 'customBan');
    bind('ih-anchorText', 'anchorText');
    bind('ih-threads', 'threads');

    root.querySelector('#ih-save').onclick = () => save();
    root.querySelector('#ih-preview').onclick = showPreview;
    root.querySelector('#ih-reset').onclick = () => {
        resetStats(getSettings());
        root.querySelector('#ih-stats-val').textContent = 'Stats resetadas.';
    };

    function refresh() {
        const st = summarize ? summarize(getSettings(), {}) : null;
        const ts = tokenSaver ? tokenSaver() : null;
        const el = root.querySelector('#ih-stats-val');
        const parts = [];
        if (st) parts.push(`Runs: ${st.runs || 0}, Injeção: ${st.injTokens || 0} tok`);
        if (ts) parts.push(`Economia TokenSaver: ${ts.saved ?? 0} tok`);
        el.textContent = parts.length ? parts.join(' | ') : 'Sem dados.';
    }
    refresh();

    return { root, refresh };
}
