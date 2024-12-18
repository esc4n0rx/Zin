function parse(tokens) {
    const root = { type: 'Program', body: [] };
    let current = 0;

    function checkOperator(value) {
        return tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === value;
    }

    function eat(type, value) {
        const token = tokens[current];
        if (!token || token.type !== type || (value && token.value !== value)) {
            throw new TypeError(`Token inesperado: esperava ${type} ${value ? value : ''}, obteve ${token ? token.type + ' ' + token.value : 'EOF'}`);
        }
        current++;
        return token;
    }

    function parseExpression() {
        let node = parsePrimaryExpression();

        while (checkOperator('+')) {
            eat('OPERATOR', '+');
            let right = parsePrimaryExpression();
            node = { type: 'BinaryExpression', operator: '+', left: node, right };
        }

        return node;
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
    
        if (token.type === 'KEYWORD' && token.value === 'pergunte') {
            // Agora parseamos pergunte(...) como uma expressão
            current++; // consume 'pergunte'
            eat('OPERATOR', '(');
            const questionToken = tokens[current];
            if (!questionToken || questionToken.type !== 'STRING') {
                throw new TypeError("Erro de sintaxe: esperava uma STRING após 'pergunte('");
            }
            current++; // consume a STRING
            eat('OPERATOR', ')');
            // Aqui retornamos um nó representando essa expressão
            return { type: 'PergunteExpression', question: questionToken.value.replace(/^"|"$/g, '') };
        }
    
        if (token.type === 'IDENTIFIER') {
            current++;
            let node = { type: 'Identifier', name: token.value };
            while (checkOperator('[')) {
                eat('OPERATOR', '[');
                const indexExpr = parseExpression(); 
                if (!checkOperator(']')) {
                    throw new TypeError(`Esperava ']' após índice de array`);
                }
                eat('OPERATOR', ']');
                node = { type: 'IndexExpression', object: node, index: indexExpr };
            }
            return node;
        }
    
        throw new TypeError(`Token inesperado em expressão: ${JSON.stringify(token)}`);
    }
    

    function walk() {
        const token = tokens[current];

        if (token && token.type === 'KEYWORD' && token.value === 'escreva') {
            current++;
            if (checkOperator('(')) {
                eat('OPERATOR', '(');
                const args = [];
                while (!checkOperator(')')) {
                    args.push(parseExpression());
                }
                eat('OPERATOR', ')');
                eat('OPERATOR', ';');
                return { type: 'EscrevaStatement', value: args };
            } else {
                throw new TypeError(`Erro de sintaxe: esperava '(' após 'escreva'`);
            }
        }

        if (token && token.type === 'KEYWORD' && token.value === 'variavel') {
            current++;
            const name = eat('IDENTIFIER');

            eat('OPERATOR', '=');

            let valueNode;
            if (tokens[current] && tokens[current].type === 'KEYWORD' && tokens[current].value === 'conjunto') {
                current++;
                eat('OPERATOR', '[');
                const elements = [];
                while (!checkOperator(']')) {
                    const el = tokens[current];
                    if (!el) {
                        throw new TypeError('Fim inesperado ao parsear conjunto');
                    }
                    if (el.type === 'STRING') {
                        current++;
                        elements.push({ type: 'Literal', value: el.value.replace(/^"|"$/g, ''), literalType: 'STRING' });
                    } else if (el.type === 'NUMBER') {
                        current++;
                        elements.push({ type: 'Literal', value: Number(el.value), literalType: 'NUMBER' });
                    } else if (el.type === 'IDENTIFIER') {
                        current++;
                        elements.push({ type: 'Identifier', name: el.value });
                    } else {
                        throw new TypeError(`Elemento inválido no conjunto: ${JSON.stringify(el)}`);
                    }
                    if (checkOperator(',')) {
                        eat('OPERATOR', ',');
                    } else {
                        // sem vírgula, continua
                    }
                }
                eat('OPERATOR', ']');
                valueNode = { type: 'ArrayLiteral', elements };
            } else {
                const val = tokens[current];
                if (!val) throw new TypeError(`Esperava um valor após '=' na declaração de variável`);
                if (val.type === 'STRING') {
                    current++;
                    valueNode = { type: 'Literal', value: val.value.replace(/^"|"$/g, ''), literalType: 'STRING' };
                } else if (val.type === 'NUMBER') {
                    current++;
                    valueNode = { type: 'Literal', value: Number(val.value), literalType: 'NUMBER' };
                } else if (val.type === 'IDENTIFIER') {
                    current++;
                    valueNode = { type: 'Identifier', name: val.value };
                } else {
                    throw new TypeError(`Esperava um valor literal ou variável após '='`);
                }
            }

            eat('OPERATOR', ';');
            return { type: 'VariavelDeclaration', name: name.value, valueNode };
        }

        if (token && token.type === 'KEYWORD' && token.value === 'calcule') {
            current++;
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

        if (token && token.type === 'KEYWORD' && token.value === 'se') {
            current++;
            eat('OPERATOR', '(');
            const condition = [];
            while (!checkOperator(')')) {
                const t = tokens[current];
                if (!t) throw new TypeError('Fim inesperado em condição de se');
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
            eat('OPERATOR', ')');
            eat('OPERATOR', '{');
            const body = [];
            while (!checkOperator('}')) {
                body.push(walk());
            }
            eat('OPERATOR', '}');
            let elseBody = null;
            if (tokens[current] && tokens[current].type === 'KEYWORD' && tokens[current].value === 'senao') {
                current++;
                eat('OPERATOR', '{');
                elseBody = [];
                while (!checkOperator('}')) {
                    elseBody.push(walk());
                }
                eat('OPERATOR', '}');
            }
            return { type: 'IfStatement', condition, body, elseBody };
        }

        if (token && token.type === 'KEYWORD' && token.value === 'enquanto') {
            current++;
            eat('OPERATOR', '(');
            const condition = [];
            while (!checkOperator(')')) {
                const t = tokens[current];
                if (!t) throw new TypeError('Fim inesperado em condição de enquanto');
                if (
                    t.type === 'NUMBER' || t.type === 'IDENTIFIER' ||
                    ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!='].includes(t.value)
                ) {
                    condition.push(t);
                    current++;
                } else {
                    throw new TypeError(`Erro de sintaxe: token inválido na condição de 'enquanto' (${JSON.stringify(t)})`);
                }
            }
            eat('OPERATOR', ')');
            eat('OPERATOR', '{');
            const body = [];
            while (!checkOperator('}')) {
                body.push(walk());
            }
            eat('OPERATOR', '}');
            return { type: 'WhileStatement', condition, body };
        }

        // Aqui adicionamos o "pergunte" dentro do walk()
        if (token && token.type === 'KEYWORD' && token.value === 'pergunte') {
            current++;
            if (tokens[current] && tokens[current].type === 'STRING') {
                const questionToken = tokens[current];
                current++;
                
                // Espera-se um IDENTIFIER após a pergunta
                const varToken = tokens[current];
                if (!varToken || varToken.type !== 'IDENTIFIER') {
                    throw new TypeError("Erro de sintaxe: esperava um identificador de variável após a pergunta");
                }
                current++;
        
                eat('OPERATOR', ';');
                return { type: 'InputStatement', question: questionToken.value, variable: varToken.value };
            } else {
                throw new TypeError("Erro de sintaxe: esperava uma STRING após 'pergunte'");
            }
        }        

        // Se chegou aqui e não houve retorno, significa token desconhecido
        if (token) {
            throw new TypeError(`Token desconhecido ou não suportado: ${JSON.stringify(token)}`);
        } else {
            // Sem tokens
            return null;
        }
    }

    while (current < tokens.length) {
        const stmt = walk();
        if (stmt) root.body.push(stmt);
    }

    return root;
}

module.exports = { parse };
