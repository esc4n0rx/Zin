const TOKEN_TYPES = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    OPERATOR: 'OPERATOR',
    UNKNOWN: 'UNKNOWN',
};

function tokenize(code) {
    const tokens = [];

    const regex = /\b(escreva|calcule|variavel|se|senao|enquanto|conjunto)\b|[a-zA-Z_][a-zA-Z0-9_]*|".*?"|\d+|(>=|<=|==|!=|[+\-*/=();{}<>!&|%,\[\]])/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
        const value = match[0];
        if (['escreva', 'calcule', 'variavel', 'se', 'senao', 'enquanto', 'conjunto'].includes(value)) {
            tokens.push({ type: TOKEN_TYPES.KEYWORD, value });
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value });
        } else if (/^".*"$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.STRING, value });
        } else if (/^\d+$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.NUMBER, value });
        } else if (['+', '-', '*', '/', '%', '=', '(', ')', ';', '{', '}', '<', '>', '<=', '>=', '==', '!=', '[', ']', ','].includes(value)) {
            tokens.push({ type: TOKEN_TYPES.OPERATOR, value });
        } else {
            tokens.push({ type: TOKEN_TYPES.UNKNOWN, value });
        }
    }

    return tokens;
}

module.exports = { tokenize, TOKEN_TYPES };
