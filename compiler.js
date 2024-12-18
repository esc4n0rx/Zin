const fs = require('fs');
const { tokenize } = require('./lexer');
const { parse } = require('./parser');
const { performance } = require('perf_hooks'); 
const readline = require('readline');

const variables = {};
const filePath = process.argv[2];

if (!filePath) {
    console.error('Erro: Nenhum arquivo fornecido.\nUso: zin <arquivo.z>');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}




function evaluateNode(node) {
    switch (node.type) {
        case 'Literal':
            return node.value;
        case 'Identifier':
            if (variables[node.name] === undefined) {
                throw new Error(`Variável desconhecida: ${node.name}`);
            }
            return variables[node.name];
        case 'IndexExpression':
            const arrayVal = evaluateNode(node.object);
            const indexVal = evaluateNode(node.index);
            if (!Array.isArray(arrayVal)) {
                throw new Error(`Tentando indexar variável que não é array`);
            }
            if (typeof indexVal !== 'number') {
                throw new Error(`Índice não é um número`);
            }
            return arrayVal[indexVal];
        case 'BinaryExpression':
            const leftVal = evaluateNode(node.left);
            const rightVal = evaluateNode(node.right);
            if (node.operator === '+') {

                return String(leftVal) + String(rightVal);
            }

            throw new Error(`Operador '${node.operator}' não suportado neste contexto.`);
        default:
            throw new Error(`Tipo de nó não suportado na avaliação: ${node.type}`);
    }
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
                    rhsTokens.push(`variables['${token.value}']`);
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
        let fullExpression = `variables['${variableName}'] = ${rhsExpression}`;


        let func = new Function('variables', `${fullExpression}; return variables['${variableName}'];`);
        let value = func(variables);
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
                return variables[token.value];
            } else if (token.type === 'NUMBER' || token.type === 'OPERATOR') {
                return token.value;
            } else {
                throw new Error(`Token inválido na condição: ${JSON.stringify(token)}`);
            }
        })
        .join(' ');

    return eval(conditionString);
}


async function executeAST(ast) {
    for (const node of ast.body) {
        if (node.type === 'EscrevaStatement') {
            let output = '';
            node.value.forEach(v => {
                output += evaluateNode(v);
            });
            console.log(output);

        } else if (node.type === 'VariavelDeclaration') {
            let value;
            if (node.valueNode.type === 'Literal') {
                value = node.valueNode.value;
                variables[node.name] = value;
                console.log(`Variável '${node.name}' definida com valor '${variables[node.name]}'`);
            } else if (node.valueNode.type === 'Identifier') {
                if (variables[node.valueNode.name] === undefined) {
                    throw new Error(`Variável desconhecida: ${node.valueNode.name}`);
                }
                variables[node.name] = variables[node.valueNode.name];
                console.log(`Variável '${node.name}' definida com valor '${variables[node.name]}'`);
            } else if (node.valueNode.type === 'ArrayLiteral') {
                const arr = node.valueNode.elements.map(el => {
                    if (el.type === 'Literal') return el.value;
                    if (el.type === 'Identifier') {
                        if (variables[el.name] === undefined) {
                            throw new Error(`Variável desconhecida: ${el.name}`);
                        }
                        return variables[el.name];
                    }
                });
                variables[node.name] = arr;
                console.log(`Variável '${node.name}' definida com array '${JSON.stringify(variables[node.name])}'`);
            }

        } else if (node.type === 'CalculeExpression') {
            const result = evaluateExpression(node.expressions);
            console.log(`Resultado do cálculo: ${result}`);

        } else if (node.type === 'IfStatement') {
            if (evaluateCondition(node.condition)) {
                await executeAST({ body: node.body });
            } else if (node.elseBody) {
                await executeAST({ body: node.elseBody });
            }

        } else if (node.type === 'WhileStatement') {
            while (evaluateCondition(node.condition)) {
                await executeAST({ body: node.body });
            }

        } else if (node.type === 'InputStatement') {
            const question = node.question.replace(/(^"|"$)/g, ''); 
            const answer = await askQuestion(question);
            variables[node.variable] = isNaN(Number(answer)) ? answer : Number(answer);
            console.log(`Variável '${node.variable}' definida com valor '${variables[node.variable]}'`);

        } else {
            console.error(`Comando desconhecido: ${node.type}`);
        }
    }
}



try {
    const startTime = performance.now(); 
    const code = fs.readFileSync(filePath, 'utf-8');
    const tokens = tokenize(code);
    const ast = parse(tokens);
    console.log('--- Saída do Código Zin ---');
    executeAST(ast);
    const endTime = performance.now(); 
    const executionTime = endTime - startTime;
    console.log(`Tempo de execução: ${executionTime.toFixed(2)} ms`);
} catch (error) {
    console.error(`Erro ao processar o arquivo: ${error.message}`);
}
