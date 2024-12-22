/*************************************************************
 * Este é o parser.js — o cara que olha pra pilha de tokens
 * gerados pelo lexer e tenta organizar numa árvore (AST).
 * Se você achou que era fácil, prepare o café...
 *************************************************************/
 
const fs = require('fs');       // Pra ler arquivo, import etc
const path = require('path');   // Pra lidar com caminhos (windows, linux, etc)

let importedModules = new Set(); // Conjunto pra lembrar qual módulo já importamos,o zin so aceita import da pasta modules.porque? pq eu quis
let filePath;                    // O arquivo principal que estamos parseando
let tokenize;                    // Referência pra função de tokenização (a gente injeta)

function parse(tokens, entryFilePath, tokenizeFn) {

    // Seta as variáveis globais do parser, pq dev é assim...
    filePath = entryFilePath;
    tokenize = tokenizeFn;
    importedModules = new Set(); // Zera a lista de módulos importados

    // Esse current é tipo um ponteiro que percorre a lista de tokens
    let current = 0;

    /*************************************************************
     * Funções auxiliares: check, checkOperator, eat, etc.
     * São a base do parser: elas confirmam, validam,
     * e avançam no array de tokens.
     *************************************************************/

    function check(type, value) {
        const token = tokens[current];
        if (!token) return false;
        if (value !== undefined) return token.type === type && token.value === value;
        return token.type === type;
    }

    function checkOperator(value) {
        const token = tokens[current];
        return token && token.type === 'OPERATOR' && token.value === value;
    }

    function eat(type, value) {
        const token = tokens[current];
        // Se não tiver token ou se não casar com o esperado, kabum!!
        if (!token || token.type !== type || (value && token.value !== value)) {
            throw new TypeError(`Token inesperado: esperava ${type}${value ? ' ' + value : ''}, obteve ${token ? token.type + ' ' + token.value : 'EOF'}`);
        }
        // Se passar no teste, anda pro próximo token e retorna o atual
        current++;
        return token;
    }

    // parseProgram: começa parseando um bloco inteiro do programa
    function parseProgram() {
        const body = [];
        while (current < tokens.length) {
            const stmt = parseStatement();
            if (stmt) body.push(stmt);
        }
        return { type: 'Program', body };
    }

    /*************************************************************
     * parseStatement: decide que tipo de statement estamos lendo
     * tipo if, while, escreve, assignment, etc.
     * tem um pouquinho só de if
     *************************************************************/
    function parseStatement() {
        const token = tokens[current];
        if (!token) return null;

        // Checamos se é escrevaArquivo, leiaArquivo, etc...
        if (check('KEYWORD', 'escrevaArquivo')) return parseEscrevaArquivoStatement();
        if (check('KEYWORD', 'leiaArquivo'))    return parseLeiaArquivoStatement();
        if (check('KEYWORD', 'importe'))        return parseImportStatement();
        if (check('KEYWORD', 'escreva'))        return parseEscrevaStatement();
        if (check('KEYWORD', 'variavel'))       return parseVariavelDeclaration();
        if (check('KEYWORD', 'funcao'))         return parseFunctionDeclaration();
        if (check('KEYWORD', 'retorne'))        return parseReturnStatement();
        if (check('KEYWORD', 'calcule'))        return parseCalculeExpression();
        if (check('KEYWORD', 'se'))             return parseIfStatement();
        if (check('KEYWORD', 'enquanto'))       return parseWhileStatement();
        if (check('KEYWORD', 'pergunte'))       return parseInputStatement();

        // Se não for nada disso, tentamos parseAssignmentOrExpressionStatement
        // No nosso caso, a gente só fez assignment mesmo
        return parseAssignmentOrExpressionStatement();
    }

    function parseAssignmentOrExpressionStatement() {
        // Se for IDENTIFIER e em seguida tiver '=', é assignment
        if (check('IDENTIFIER')) {
            const identifierToken = tokens[current];
            const nextToken = tokens[current + 1];
    
            if (nextToken && nextToken.type === 'OPERATOR' && nextToken.value === '=') {
                return parseAssignmentStatement();
            }
        }
    
        // Se não cair em assignment, é algo desconhecido
        throw new TypeError(
            `Token desconhecido ou não suportado: ${JSON.stringify(tokens[current])}`
        );
    }
    
    // parseAssignmentStatement: ex: x = 5;
    function parseAssignmentStatement() {
        const nameToken = eat('IDENTIFIER'); 
        eat('OPERATOR', '='); // Ok, passa esse '='
    
        const valueNode = parseExpression(); // parseExpression resolve a parte da direita
    
        eat('OPERATOR', ';'); // Pede o ponto-e-vírgula
    
        return {
            type: 'AssignmentStatement',
            name: nameToken.value, 
            value: valueNode
        };
    }

    /*************************************************************
     * parseEscrevaArquivoStatement: ex: escrevaArquivo("foo.txt", conteudo);
     *************************************************************/
    function parseEscrevaArquivoStatement() {
        eat('KEYWORD', 'escrevaArquivo');
        eat('OPERATOR', '(');
    
        const filePath = parseExpression();
        eat('OPERATOR', ',');
        const content = parseExpression();
    
        eat('OPERATOR', ')');
        eat('OPERATOR', ';');
    
        return { type: 'EscrevaArquivoStatement', filePath, content };
    }
    
    // parseLeiaArquivoStatement: ex: leiaArquivo("foo.txt", variavel);
    function parseLeiaArquivoStatement() {
        eat('KEYWORD', 'leiaArquivo');
        eat('OPERATOR', '(');
    
        const filePath = parseExpression();
        eat('OPERATOR', ',');
        const variable = eat('IDENTIFIER').value;
    
        eat('OPERATOR', ')');
        eat('OPERATOR', ';');
    
        return { type: 'LeiaArquivoStatement', filePath, variable };
    }

    /*************************************************************
     * parseImportStatement: ex: importe "modulo.z";
     * Esse moço chama inlineModule que abre o arquivo e parseia
     *************************************************************/
    function parseImportStatement() {
        eat('KEYWORD', 'importe');
        const moduleToken = eat('STRING');
        eat('OPERATOR', ';');

        const modulePath = moduleToken.value.replace(/^"|"$/g, '');
        return inlineModule(modulePath);
    }

    // inlineModule: abre o arquivo, tokeniza, chama parseModule,
    // e retorna o AST pra grudarmos no lugar do import
    function inlineModule(modulePath) {
        const fullPath = path.resolve(path.dirname(filePath), modulePath);

        if (importedModules.has(fullPath)) {
            // Se já importamos, não repetimos
            return null; 
        }

        importedModules.add(fullPath);

        const code = fs.readFileSync(fullPath, 'utf-8');
        const modTokens = tokenize(code);
        const modAST = parseModule(modTokens, fullPath);

        return { type: 'ModuleInline', body: modAST.body };
    }

    // parseModule: mesmíssima coisa que parseProgram, mas guardando e restaurando estado
    function parseModule(modTokens, moduleFilePath) {
        const oldCurrent = current;
        const oldTokens = tokens;
        const oldFilePath = filePath;

        tokens = modTokens;
        current = 0;
        filePath = moduleFilePath;

        const ast = parseProgram();

        tokens = oldTokens;
        current = oldCurrent;
        filePath = oldFilePath;

        return ast;
    }

    /*************************************************************
     * parseEscrevaStatement: tipo escreva("Hello World");
     *************************************************************/
    function parseEscrevaStatement() {
        eat('KEYWORD', 'escreva');
        eat('OPERATOR', '(');
        const args = [];
        while (!checkOperator(')')) {
            args.push(parseExpression());
        }
        eat('OPERATOR', ')');
        eat('OPERATOR', ';');
        return { type: 'EscrevaStatement', value: args };
    }

    /*************************************************************
     * parseVariavelDeclaration: ex: variavel x = 10;
     *************************************************************/
    function parseVariavelDeclaration() {
        eat('KEYWORD', 'variavel');
        const nameToken = eat('IDENTIFIER');
    
        let valueNode = null; 
        // Se tiver '=', parseia a expressão. Se não, value = null
        if (checkOperator('=')) {
            eat('OPERATOR', '=');
            valueNode = parseExpression();
        }
    
        eat('OPERATOR', ';');
        return { type: 'VariavelDeclaration', name: nameToken.value, valueNode };
    }

    /*************************************************************
     * parseFunctionDeclaration: ex: funcao soma(a, b) { ... }
     *************************************************************/
    function parseFunctionDeclaration() {
        eat('KEYWORD', 'funcao');
        const name = eat('IDENTIFIER');
        eat('OPERATOR', '(');

        const params = [];
        while (!checkOperator(')')) {
            const param = eat('IDENTIFIER');
            params.push(param.value);
            if (checkOperator(',')) eat('OPERATOR', ',');
        }
        eat('OPERATOR', ')');

        eat('OPERATOR', '{');
        const body = parseBlock();
        eat('OPERATOR', '}');

        return {
            type: 'FunctionDeclaration',
            name: name.value,
            params,
            body,
        };
    }

    // parseReturnStatement: ex: retorne x + y;
    function parseReturnStatement() {
        eat('KEYWORD', 'retorne');
        const value = parseExpression();
        eat('OPERATOR', ';');
        return { type: 'ReturnStatement', value };
    }

    /*************************************************************
     * parseCalculeExpression: ex: calcule(x + 2)
     *************************************************************/
    function parseCalculeExpression() {
        eat('KEYWORD', 'calcule');
        eat('OPERATOR', '(');
        const expressions = [];
        while (!checkOperator(')')) {
            const t = tokens[current];
            if (!t) throw new TypeError('Fim inesperado em calcule');
            // Se for NUMBER, IDENTIFIER ou operador, adiciona
            if (
                t.type === 'NUMBER' ||
                t.type === 'IDENTIFIER' ||
                ['+', '-', '*', '/', '=', '<', '>', '<=', '>=', '==', '!='].includes(t.value)
            ) {
                expressions.push(t);
                current++;
            } else {
                throw new TypeError(`Erro de sintaxe: token inválido dentro de 'calcule' (${JSON.stringify(t)})`);
            }
        }
        eat('OPERATOR', ')');
        eat('OPERATOR', ';');
        return { type: 'CalculeExpression', expressions };
    }

    /*************************************************************
     * parseIfStatement: ex:
     * se (x < 10) { ... } senao { ... }
     *************************************************************/
    function parseIfStatement() {
        eat('KEYWORD', 'se');
        eat('OPERATOR', '(');
        const condition = parseConditionTokens('se');
        eat('OPERATOR', ')');
        eat('OPERATOR', '{');
        const body = parseBlock();
        eat('OPERATOR', '}');

        let elseBody = null;
        if (check('KEYWORD', 'senao')) {
            eat('KEYWORD', 'senao');
            eat('OPERATOR', '{');
            elseBody = parseBlock();
            eat('OPERATOR', '}');
        }

        return { type: 'IfStatement', condition, body, elseBody };
    }

    /*************************************************************
     * parseWhileStatement: ex:
     * enquanto (x < 10) { ... }
     *************************************************************/
    function parseWhileStatement() {
        eat('KEYWORD', 'enquanto');
        eat('OPERATOR', '(');
        const condition = parseConditionTokens('enquanto');
        eat('OPERATOR', ')');
        eat('OPERATOR', '{');
        const body = parseBlock();
        eat('OPERATOR', '}');
        return { type: 'WhileStatement', condition, body };
    }

    /*************************************************************
     * parseInputStatement: ex:
     * pergunte "Digite seu nome" nomeVar;
     *************************************************************/
    function parseInputStatement() {
        eat('KEYWORD', 'pergunte');
        const questionToken = tokens[current];
        if (!questionToken || questionToken.type !== 'STRING') {
            throw new TypeError("Erro de sintaxe: esperava uma STRING após 'pergunte'");
        }
        current++;

        const varToken = tokens[current];
        if (!varToken || varToken.type !== 'IDENTIFIER') {
            throw new TypeError("Erro de sintaxe: esperava um identificador de variável após a pergunta");
        }
        current++;

        eat('OPERATOR', ';');
        return { type: 'InputStatement', question: questionToken.value, variable: varToken.value };
    }

    // parseBlock: lê statements até encontrar '}' ou acabar token
    function parseBlock() {
        const body = [];
        while (!checkOperator('}') && current < tokens.length) {
            body.push(parseStatement());
        }
        return body;
    }

    // parseConditionTokens: lê tokens até o ')'
    // Só aceita NUMBER, IDENTIFIER ou operadores lógicos
    function parseConditionTokens(context) {
        const condition = [];
        while (!checkOperator(')')) {
            const t = tokens[current];
            if (!t) throw new TypeError(`Fim inesperado em condição de ${context}`);
            if (
                t.type === 'NUMBER' ||
                t.type === 'IDENTIFIER' ||
                ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!='].includes(t.value)
            ) {
                condition.push(t);
                current++;
            } else {
                throw new TypeError(`Erro de sintaxe: token inválido na condição (${JSON.stringify(t)})`);
            }
        }
        return condition;
    }

    /*************************************************************
     * parseExpression / parseTerm / parseFactor / parsePrimaryExpression
     * Isso é tipo a parte de "precedência" de operadores (+, -, *, /).
     * parseExpression chama parseTerm, que chama parseFactor, etc.
     *************************************************************/
    function parseExpression() {
        let node = parseTerm();
        while (checkOperator('+') || checkOperator('-')) {
            const op = tokens[current].value;
            eat('OPERATOR', op);
            const right = parseTerm();
            node = { type: 'BinaryExpression', operator: op, left: node, right };
        }
        return node;
    }

    function parseTerm() {
        let node = parseFactor();
        while (checkOperator('*') || checkOperator('/')) {
            const op = tokens[current].value;
            eat('OPERATOR', op);
            const right = parseFactor();
            node = { type: 'BinaryExpression', operator: op, left: node, right };
        }
        return node;
    }

    function parseFactor() {
        return parsePrimaryExpression();
    }

    function parsePrimaryExpression() {
        const token = tokens[current];

        if (!token) throw new TypeError('Fim inesperado de entrada');

        // Se for STRING, retorna um Literal node
        if (token.type === 'STRING') {
            current++;
            return { type: 'Literal', value: token.value.replace(/^"|"$/g, ''), literalType: 'STRING' };
        }

        // Se for NUMBER, idem
        if (token.type === 'NUMBER') {
            current++;
            return { type: 'Literal', value: Number(token.value), literalType: 'NUMBER' };
        }

        // Se for IDENTIFIER, pode ser var ou chamada de função
        if (token.type === 'IDENTIFIER') {
            current++;
            let node = { type: 'Identifier', name: token.value };

            // Se depois vier '(', é CallExpression (funcao(args))
            if (checkOperator('(')) {
                eat('OPERATOR', '(');
                const args = [];
                while (!checkOperator(')')) {
                    args.push(parseExpression());
                    if (checkOperator(',')) eat('OPERATOR', ',');
                }
                eat('OPERATOR', ')');
                node = { type: 'CallExpression', callee: node, arguments: args };
            }

            return node;
        }

        // Se não for nada disso, a gente surta
        throw new TypeError(`Token inesperado em expressão: ${JSON.stringify(token)}`);
    }

    // Bora parsear nosso programinha
    const ast = parseProgram();

    // inlineModules: a gente vai procurar nós de tipo 'ModuleInline'
    // e no lugar deles injeta o AST do módulo importado
    inlineModules(ast);

    return ast;

    function inlineModules(ast) {
        function recurse(nodeArray) {
            for (let i = 0; i < nodeArray.length; i++) {
                const node = nodeArray[i];
                if (node && node.type === 'ModuleInline') {
                    // Removemos o node do array e inserimos o body do módulo
                    nodeArray.splice(i, 1, ...node.body);
                    i--; 
                } else if (node && Array.isArray(node.body)) {
                    recurse(node.body);
                } else if (node && Array.isArray(node.value)) {
                    recurse(node.value);
                }
            }
        }
        recurse(ast.body);
    }
}

module.exports = { parse };
