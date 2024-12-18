function parse(tokens) {
    const root = { type: 'Program', body: [] };
    let current = 0;

    function walk() {
        const token = tokens[current];
    
        if (token.type === 'KEYWORD' && token.value === 'escreva') {
            current++; 
        
            if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '(') {
                current++; 
        
                const argument = [];
                while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === ')')) {
                    if (tokens[current].type === 'STRING' || tokens[current].type === 'IDENTIFIER' || ['+', '-', '*', '/'].includes(tokens[current].value)) {
                        argument.push(tokens[current]);
                        current++; 
                    } else {
                        throw new TypeError(`Erro de sintaxe: token inválido no argumento de 'escreva' (${JSON.stringify(tokens[current])})`);
                    }
                }
        
                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ')') {
                    current++;
        
                    if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ';') {
                        current++; 
        
                        return { type: 'EscrevaStatement', value: argument };
                    } else {
                        throw new TypeError(`Erro de sintaxe: esperava ';' após 'escreva(...)'`);
                    }
                } else {
                    throw new TypeError(`Erro de sintaxe: esperava ')' após o argumento em 'escreva(...)'`);
                }
            } else {
                throw new TypeError(`Erro de sintaxe: esperava '(' após 'escreva'`);
            }
        }
        
    
        if (token.type === 'KEYWORD' && token.value === 'variavel') {
            current++; 
    
            const name = tokens[current];
            if (name && name.type === 'IDENTIFIER') {
                current++; 
    
                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '=') {
                    current++; 
    
                    const value = tokens[current];
                    if (value && (value.type === 'NUMBER' || value.type === 'STRING')) {
                        current++; 
    
                        if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ';') {
                            current++;
                            return { type: 'VariavelDeclaration', name: name.value, value: value.value };
                        } else {
                            throw new TypeError(`Erro de sintaxe: esperava ';' após a declaração da variável`);
                        }
                    } else {
                        throw new TypeError(`Erro de sintaxe: esperava um valor após '='`);
                    }
                } else {
                    throw new TypeError(`Erro de sintaxe: esperava '=' após o nome da variável`);
                }
            } else {
                throw new TypeError(`Erro de sintaxe: esperava um identificador após 'variavel'`);
            }
        }
    
        if (token.type === 'KEYWORD' && token.value === 'calcule') {
            current++; // Consome 'calcule'
        
            if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '(') {
                current++; // Consome '('
        
                const expressions = [];
                while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === ')')) {
                    if (
                        tokens[current].type === 'NUMBER' ||
                        tokens[current].type === 'IDENTIFIER' ||
                        ['+', '-', '*', '/', '=', '<', '>', '<=', '>=', '==', '!='].includes(tokens[current].value)
                    ) {
                        expressions.push(tokens[current]);
                        current++; // Consome o token
                    } else {
                        throw new TypeError(`Erro de sintaxe: token inválido dentro de 'calcule' (${JSON.stringify(tokens[current])})`);
                    }
                }
        
                // Verifica o fechamento do parêntese ')'
                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ')') {
                    current++; // Consome ')'
        
                    // Verifica o ponto e vírgula ';'
                    if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ';') {
                        current++; // Consome ';'
                        return { type: 'CalculeExpression', expressions };
                    } else {
                        throw new TypeError(`Erro de sintaxe: esperava ';' após 'calcule(...)'`);
                    }
                } else {
                    throw new TypeError(`Erro de sintaxe: esperava ')' após a expressão em 'calcule'`);
                }
            } else {
                throw new TypeError(`Erro de sintaxe: esperava '(' após 'calcule'`);
            }
        }
        
        if (token.type === 'KEYWORD' && token.value === 'se') {
            current++; // Consome 'se'
        
            if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '(') {
                current++; // Consome '('
        
                const condition = [];
                while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === ')')) {
                    if (
                        tokens[current].type === 'NUMBER' ||
                        tokens[current].type === 'IDENTIFIER' ||
                        ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!='].includes(tokens[current].value)
                    ) {
                        condition.push(tokens[current]);
                        current++;
                    } else {
                        throw new TypeError(`Erro de sintaxe: token inválido na condição (${JSON.stringify(tokens[current])})`);
                    }
                }
        
                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ')') {
                    current++; // Consome ')'
        
                    if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '{') {
                        current++; // Consome '{'
        
                        const body = [];
                        while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === '}')) {
                            body.push(walk());
                        }
        
                        if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '}') {
                            current++; // Consome '}'
        
                            let elseBody = null;
        
                            // Senao opcional
                            if (tokens[current] && tokens[current].type === 'KEYWORD' && tokens[current].value === 'senao') {
                                current++; // Consome 'senao'
        
                                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '{') {
                                    current++; // Consome '{'
        
                                    elseBody = [];
                                    while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === '}')) {
                                        elseBody.push(walk());
                                    }
        
                                    if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '}') {
                                        current++; // Consome '}'
                                    } else {
                                        throw new TypeError(`Erro de sintaxe: esperava '}' após o corpo de 'senao'`);
                                    }
                                } else {
                                    throw new TypeError(`Erro de sintaxe: esperava '{' após 'senao'`);
                                }
                            }
        
                            return { type: 'IfStatement', condition, body, elseBody };
                        } else {
                            throw new TypeError(`Erro de sintaxe: esperava '}' após o corpo de 'se'`);
                        }
                    } else {
                        throw new TypeError(`Erro de sintaxe: esperava '{' após a condição de 'se'`);
                    }
                } else {
                    throw new TypeError(`Erro de sintaxe: esperava ')' após a condição de 'se'`);
                }
            } else {
                throw new TypeError(`Erro de sintaxe: esperava '(' após 'se'`);
            }
        }
        
        
      

    if (token.type === 'KEYWORD' && token.value === 'enquanto') {
        current++; 
    
        if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '(') {
            current++;
    
            const condition = [];
            while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === ')')) {
                if (tokens[current].type === 'NUMBER' || tokens[current].type === 'IDENTIFIER' || ['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!='].includes(tokens[current].value)) {
                    condition.push(tokens[current]);
                    current++;
                } else {
                    throw new TypeError(`Erro de sintaxe: token inválido na condição de 'enquanto' (${JSON.stringify(tokens[current])})`);
                }
            }
    
            if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === ')') {
                current++; 
    
                if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '{') {
                    current++; 
    
                    const body = [];
                    while (tokens[current] && !(tokens[current].type === 'OPERATOR' && tokens[current].value === '}')) {
                        body.push(walk());
                    }
    
                    if (tokens[current] && tokens[current].type === 'OPERATOR' && tokens[current].value === '}') {
                        current++; 
                        return { type: 'WhileStatement', condition, body };
                    } else {
                        throw new TypeError(`Erro de sintaxe: esperava '}' após o corpo de 'enquanto'`);
                    }
                } else {
                    throw new TypeError(`Erro de sintaxe: esperava '{' após a condição de 'enquanto'`);
                }
            } else {
                throw new TypeError(`Erro de sintaxe: esperava ')' após a condição de 'enquanto'`);
            }
        } else {
            throw new TypeError(`Erro de sintaxe: esperava '(' após 'enquanto'`);
        }
    }

    throw new TypeError(`Token desconhecido ou não suportado: ${JSON.stringify(token)}`);
}

while (current < tokens.length) {
    root.body.push(walk());
}

return root;
}

module.exports = { parse };