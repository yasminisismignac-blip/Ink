// Perfis: regras de ofício, não manuais literários.
export const PROFILES = {
    natural: {
        name: 'Natural / Direto',
        text: '[Estilo]\nEscreva com precisão e contenção. Priorize ação concreta, subtexto e diálogos com intenção. Corte adjetivos genéricos e descrições enfeitadas.'
    },
    literario: {
        name: 'Literário Contido',
        text: '[Estilo Literário]\nProsa limpa e observadora. Detalhes sensíveis só quando revelam personagem ou clima. Nada de lirismo gratuito.'
    },
    minimalista: {
        name: 'Minimalista',
        text: '[Estilo Minimalista]\nFrases curtas. Espaço no diálogo. Apenas o essencial na cena.'
    },
    noir: {
        name: 'Noir',
        text: '[Estilo Noir]\nTom seco, cinismo contido, frases diretas. Atmosfera pelo contraste, não por adjetivos.'
    }
};

// Focos de cena: UMA diretiva por turno.
export const FOCUS = {
    subtexto: 'Mostre o não-dito por gestos e ações, nunca nomeie emoções.',
    corpo: 'Use linguagem corporal concreta em vez de adjetivos de sentimento.',
    dialogo: 'Diálogos curtos, com intenção. Cada fala deve revelar algo ou mudar algo.',
    ritmo: 'Varie o comprimento das frases. Acelere na tensão, desacelere no repouso.',
    ambiente: 'Um único detalhe concreto do lugar, nunca uma lista de impressões.',
    iniciativa: 'O personagem age por vontade própria; não devolva a vez passivamente.'
};

// Ganços: apenas um por turno, comportamento-driven.
export const HOOKS = {
    segredo: 'O personagem esconde algo relevante desta cena.',
    tensao: 'Uma tensão não resolvida sobe um degrau.',
    objeto: 'Um objeto físico ganha importância inesperada.',
    confissao: 'Uma meia-confissão ou quase-dizer.',
    relogio: 'O tempo está acabando para algo nesta cena.'
};

// Finais: ponto aberto, nunca pergunta genérica "o que você faz?".
export const ENDINGS = {
    gesto: 'Termine com um gesto físico carregado, sem explicar.',
    fala: 'Termine com uma fala solta que deixe algo no ar.',
    escolha: 'Ofereça ao usuário uma escolha tentadora ou perigosa.',
    pausa: 'Termine no silêncio ou na interrupção brusca.'
};

// Clichês alvo: lista curta, só o que realmente estraga imersão.
export const SLOP = [
    ['a testament to', 'flor de IA', 'en'],
    ['um arrepio na espinha', 'clichê físico', 'pt'],
    ['não podia deixar de', 'exposição forçada', 'pt'],
    ['lágrimas rolaram', 'clichê emocional', 'pt'],
    ['coração batia forte', 'clichê físico', 'pt'],
    ['minha alma', 'dramatização barata', 'pt'],
    ['sussurrou docemente', 'adjetivo desnecessário', 'pt'],
    ['olhos brilhavam', 'clichê visual', 'pt']
];
