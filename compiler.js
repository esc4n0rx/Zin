const fs = require('fs');
const { tokenize } = require('./lexer');
const { parse } = require('./parser');

const variables = {};
const filePath = process.argv[2];

if (!filePath) {
    console.error('Erro: Nenhum arquivo fornecido.\nUso: zin <arquivo.z>');
    process.exit(1);
}

function evaluateExpression(expressions) {

    let isAssignment = expressions.some(token => token.value === '=');
    let hasString = expressions.some(token => token.type === 'STRING');
    

    if (isAssignment) {
        let variableName = null;
        let rhsTokens = [];
        let foundEquals = false;

        for (const token of expressions) {
            if (!foundEquals) {
                if (token.value === '=') {
                    foundEquals = true;
                } else if (token.type === 'IDENTIFIER' && variableName === null) {
                    variableName = token.value;
                }
            } else {

                if (token.type === 'IDENTIFIER') {
                    if (variables[token.value] === undefined) {
                        throw new Error(`Variável desconhecida: ${token.value}`);
                    }
                    rhsTokens.push(variables[token.value]);
                } else if (token.type === 'NUMBER') {
                    rhsTokens.push(token.value);
                } else if (token.type === 'STRING') {
                
                    rhsTokens.push(JSON.stringify(token.value.replace(/^"|"$/g, '')));
                } else if (['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!='].includes(token.value)) {
                    rhsTokens.push(token.value);
                } else {
                    throw new Error(`Token inválido na expressão de atribuição: ${JSON.stringify(token)}`);
                }
            }
        }

        if (!variableName) {
            throw new Error(`Erro de sintaxe: variável não encontrada na atribuição`);
        }

        let rhsExpression = rhsTokens.join(' ');
        
        let value;
        if (rhsTokens.some(t => /^"/.test(t))) {

            value = eval(rhsExpression);
        } else {

            value = eval(rhsExpression);
        }

        variables[variableName] = value;
        return value;

    } else {

        if (hasString) {
           
            let resultString = '';
            let concatNext = false; 

            for (const token of expressions) {
                if (token.type === 'STRING') {

                    const strVal = token.value.replace(/^"|"$/g, '');
                    if (concatNext) {
                        resultString += strVal;
                        concatNext = false;
                    } else {
                       
                        if (resultString === '') {
                            resultString = strVal;
                        } else {
                           
                            resultString += strVal;
                        }
                    }
                } else if (token.type === 'IDENTIFIER') {
                    if (variables[token.value] === undefined) {
                        throw new Error(`Variável desconhecida: ${token.value}`);
                    }
                    let val = variables[token.value].toString();
                    if (concatNext) {
                        resultString += val;
                        concatNext = false;
                    } else {
                        if (resultString === '') {
                            resultString = val;
                        } else {
                            resultString += val;
                        }
                    }
                } else if (token.type === 'NUMBER') {

                    if (concatNext) {
                        resultString += token.value;
                        concatNext = false;
                    } else {
                        if (resultString === '') {
                            resultString = token.value;
                        } else {
                            resultString += token.value;
                        }
                    }
                } else if (token.value === '+') {

                    concatNext = true;
                } else {
                   
                    throw new Error(`Operador '${token.value}' inválido em expressão com strings`);
                }
            }

            return resultString;

        } else {
        
            let evalString = '';
            for (const token of expressions) {
                if (token.type === 'NUMBER') {
                    evalString += token.value;
                } else if (token.type === 'IDENTIFIER') {
                    if (variables[token.value] === undefined) {
                        throw new Error(`Variável desconhecida: ${token.value}`);
                    }
                    evalString += variables[token.value];
                } else if (['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!='].includes(token.value)) {
                    evalString += ` ${token.value} `;
                } else {
                    throw new Error(`Token inválido na expressão numérica: ${JSON.stringify(token)}`);
                }
            }

            return eval(evalString);
        }
    }
}

function evaluateCondition(condition) {
    const conditionString = condition
        .map(token => {
            if (token.type === 'IDENTIFIER' && variables[token.value] !== undefined) {
                return variables[token.value]; // Substitui a variável pelo valor
            } else if (token.type === 'NUMBER' || token.type === 'OPERATOR') {
                return token.value; // Usa o valor diretamente
            } else {
                throw new Error(`Token inválido na condição: ${JSON.stringify(token)}`);
            }
        })
        .join(' '); // Junta os tokens em uma string válida

    return eval(conditionString); // Avalia a expressão concatenada
}


function executeAST(ast) {
    ast.body.forEach(node => {
        if (node.type === 'EscrevaStatement') {
        
            const output = evaluateExpression(node.value);
            console.log(output);
        } else if (node.type === 'VariavelDeclaration') {
            variables[node.name] = isNaN(Number(node.value)) ? node.value : Number(node.value);
            console.log(`Variável '${node.name}' definida com valor '${variables[node.name]}'`);
        } else if (node.type === 'CalculeExpression') {
            const result = evaluateExpression(node.expressions);
            console.log(`Resultado do cálculo: ${result}`);
        } else if (node.type === 'IfStatement') {
            if (evaluateCondition(node.condition)) {
                executeAST({ body: node.body });
            } else if (node.elseBody) {
                executeAST({ body: node.elseBody });
            }
        } else if (node.type === 'WhileStatement') {
            while (evaluateCondition(node.condition)) {
                executeAST({ body: node.body });
            }
        } else {
            console.error(`Comando desconhecido: ${node.type}`);
        }
    });
}

try {
    const code = fs.readFileSync(filePath, 'utf-8');

    const tokens = tokenize(code);
    const ast = parse(tokens);
    console.log('--- Saída do Código Zin ---');
    executeAST(ast);
} catch (error) {
    console.error(`Erro ao processar o arquivo: ${error.message}`);
}