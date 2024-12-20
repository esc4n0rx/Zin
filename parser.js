function parse(tokens) {
    let current = 0;

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
        if (!token || token.type !== type || (value && token.value !== value)) {
            throw new TypeError(`Token inesperado: esperava ${type}${value ? ' ' + value : ''}, obteve ${token ? token.type + ' ' + token.value : 'EOF'}`);
        }
        current++;
        return token;
    }

    function parseProgram() {
        const body = [];
        while (current < tokens.length) {
            const stmt = parseStatement();
            if (stmt) body.push(stmt);
        }
        return { type: 'Program', body };
    }

    function parseStatement() {
        const token = tokens[current];
        if (!token) return null;

        if (check('KEYWORD', 'escreva')) return parseEscrevaStatement();
        if (check('KEYWORD', 'variavel')) return parseVariavelDeclaration();
        if (check('KEYWORD', 'funcao')) return parseFunctionDeclaration();
        if (check('KEYWORD', 'retorne')) return parseReturnStatement();
        if (check('KEYWORD', 'calcule')) return parseCalculeExpression();
        if (check('KEYWORD', 'se')) return parseIfStatement();
        if (check('KEYWORD', 'enquanto')) return parseWhileStatement();
        if (check('KEYWORD', 'pergunte')) return parseInputStatement();

        throw new TypeError(`Token desconhecido ou não suportado: ${JSON.stringify(token)}`);
    }

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

    function parseVariavelDeclaration() {
        eat('KEYWORD', 'variavel');
        const nameToken = eat('IDENTIFIER');
        eat('OPERATOR', '=');
        const valueNode = parseExpression();
        eat('OPERATOR', ';');
        return { type: 'VariavelDeclaration', name: nameToken.value, valueNode };
    }

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

    function parseReturnStatement() {
        eat('KEYWORD', 'retorne');
        const value = parseExpression();
        eat('OPERATOR', ';');
        return { type: 'ReturnStatement', value };
    }

    function parseCalculeExpression() {
        eat('KEYWORD', 'calcule');
        eat('OPERATOR', '(');
        const expressions = [];
        while (!checkOperator(')')) {
            const t = tokens[current];
            if (!t) throw new TypeError('Fim inesperado em calcule');
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

    function parseBlock() {
        const body = [];
        while (!checkOperator('}') && current < tokens.length) {
            body.push(parseStatement());
        }
        return body;
    }

    function parseConditionTokens(context) {
        // Simples, sem parse detalhado, assumindo tokens lineares
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

    // Precedência de operadores:
    // parseExpression -> lida com + e -
    // parseTerm -> lida com * e /
    // parseFactor -> lida com literais, identificadores, chamadas de função
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

        if (token.type === 'STRING') {
            current++;
            return { type: 'Literal', value: token.value.replace(/^"|"$/g, ''), literalType: 'STRING' };
        }

        if (token.type === 'NUMBER') {
            current++;
            return { type: 'Literal', value: Number(token.value), literalType: 'NUMBER' };
        }

        if (token.type === 'IDENTIFIER') {
            current++;
            let node = { type: 'Identifier', name: token.value };

            // Chamada de função
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

        throw new TypeError(`Token inesperado em expressão: ${JSON.stringify(token)}`);
    }

    return parseProgram();
}

module.exports = { parse };
