/*******************************************************
 * Este aqui é o lexer.js — a parte que faz picadinho
 * do nosso código Zin. A ideia é transformar o texto
 * em tokens bonitinhos. Vamos nessa!
 *******************************************************/

const TOKEN_TYPES = {
    // Aqui temos um dicionário de tipos de tokens
    // Tipo KEYWORD (escreva, calcule, variavel, etc.)
    KEYWORD: 'KEYWORD',
    // Um IDENTIFIER é tipo: nomeDeVariavel, banana123
    IDENTIFIER: 'IDENTIFIER',
    // STRING é tudo que estiver entre aspas
    STRING: 'STRING',
    // NUMBER... bom, é número, né?
    NUMBER: 'NUMBER',
    // OPERATOR abrange +, -, =, ==, essas coisinhas
    OPERATOR: 'OPERATOR',
    // UNKNOWN é tudo que a gente não sabe classificar
    UNKNOWN: 'UNKNOWN',
};

/*****************************************************
 * function tokenize(code)
 * Pega o código do Zin e retorna um array de tokens
 * com type e value. É tipo o porteiro do rolê:
 * "Você entra aqui, você vai pra lá..."
 *****************************************************/
function tokenize(code) {
    const tokens = [];

    // Regex maluco que tenta capturar as palavras-chave,
    // identificadores, strings, números e operadores
    const regex = /\b(escreva|calcule|variavel|se|senao|enquanto|conjunto|funcao|retorne|importe|escrevaArquivo|leiaArquivo)\b|[a-zA-Z_][a-zA-Z0-9_]*|".*?"|\d+|(>=|<=|==|!=|[+\-*/=();{}<>!&|%,\[\]])/g;
    let match;

    // Ficamos rodando regex.exec até não sobrar nada
    while ((match = regex.exec(code)) !== null) {
        const value = match[0];

        // Se bater com uma das keywords conhecidas, beleza, KEYWORD
        if ([
            'escreva', 'calcule', 'variavel', 'se', 'senao',
            'enquanto', 'conjunto', 'funcao', 'retorne',
            'importe','leiaArquivo','escrevaArquivo'
        ].includes(value)) {
            tokens.push({ type: TOKEN_TYPES.KEYWORD, value });
        
        // Senão, se for algo tipo "nomeDeVariavel"
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value });
        
        // Se for algo entre aspas, vira STRING
        } else if (/^".*"$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.STRING, value });
        
        // Se for um bando de dígitos, é NUMBER
        } else if (/^\d+$/.test(value)) {
            tokens.push({ type: TOKEN_TYPES.NUMBER, value });
        
        // Se estiver na lista de operadores, bora de OPERATOR
        } else if ([
            '+', '-', '*', '/', '%', '=', '(', ')', ';', '{', '}',
            '<', '>', '<=', '>=', '==', '!=', '[', ']', ','
        ].includes(value)) {
            tokens.push({ type: TOKEN_TYPES.OPERATOR, value });
        
        // Se não for nada disso, a gente define  como UNKNOWN
        } else {
            tokens.push({ type: TOKEN_TYPES.UNKNOWN, value });
        }
    }

    // Retornamos todos os tokens recolhidos nessa batelada
    return tokens;
}

module.exports = { tokenize, TOKEN_TYPES };
