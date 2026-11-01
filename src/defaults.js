export const MODULE = 'inkcore';

export const STRENGTH = {
    sutil: { focusCount: 1, banCount: 4 },
    equilibrado: { focusCount: 1, banCount: 6 },
    intenso: { focusCount: 2, banCount: 10 },
};

export const DEFAULTS = {
    enabled: true,
    onlyOpenRouter: true,
    onlyFreeModels: false,

    strength: 'sutil',
    ...STRENGTH.sutil,

    profile: 'natural',
    langs: 'both',
    outputLang: '',

    proseBible: true,
    antiSlop: true,
    director: true,
    anchor: true,
    anchorAuto: true,
    anchorText: '',
    customBan: '',

    initiative: true,
    hooks: true,
    hookEnding: true,

    tailRole: 'system',
    tailDepth: 0,

    samplerNudge: false,
    freqPenalty: 0,
    presPenalty: 0,

    charsPerToken: 3.6,

    stats: { runs: 0, injTokens: 0, last: null },
};
