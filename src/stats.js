export function recordRun(s, res) {
    const st = s.stats;
    st.runs = (st.runs || 0) + 1;
    st.injTokens = (st.injTokens || 0) + (res.tokens || 0);
    st.last = new Date().toISOString();
}

export function resetStats(s) {
    s.stats = { runs: 0, injTokens: 0, last: null };
}

export function summarize(s, info) {
    return {
        runs: s.stats.runs || 0,
        injTokens: s.stats.injTokens || 0,
        last: s.stats.last || null
    };
}
