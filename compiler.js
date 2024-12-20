const fs = require('fs');
const { tokenize } = require('./lexer');
const { parse } = require('./parser');
const { performance } = require('perf_hooks'); 
const readline = require('readline');

const variables = {};
const functions = {};
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

async function evaluateNode(node) {
    switch (node.type) {
        case 'Literal':
            return node.value;

        case 'Identifier':
            if (variables[node.name] === undefined) {
                throw new Error(`Variável desconhecida: ${node.name}`);
            }
            return variables[node.name];

        case 'IndexExpression': {
            const arrayVal = await evaluateNode(node.object);
            const indexVal = await evaluateNode(node.index);
            if (!Array.isArray(arrayVal)) {
                throw new Error(`Tentando indexar variável que não é array`);
            }
            if (typeof indexVal !== 'number') {
                throw new Error(`Índice não é um número`);
            }
            return arrayVal[indexVal];
        }

        case 'BinaryExpression': {
            const leftVal = await evaluateNode(node.left);
            const rightVal = await evaluateNode(node.right);
            switch (node.operator) {
                case '+':
                    return (typeof leftVal === 'number' && typeof rightVal === 'number')
                      ? leftVal + rightVal
                      : String(leftVal) + String(rightVal);
                case '-':
                    return Number(leftVal) - Number(rightVal);
                case '*':
                    return Number(leftVal) * Number(rightVal);
                case '/':
                    if (Number(rightVal) === 0) throw new Error("Divisão por zero");
                    return Number(leftVal) / Number(rightVal);
                default:
                    throw new Error(`Operador '${node.operator}' não suportado neste contexto.`);
            }
        }

        case 'CallExpression': {
            const func = functions[node.callee.name];
            if (!func) throw new Error(`Função desconhecida: ${node.callee.name}`);
            const args = [];
            for (const arg of node.arguments) {
                args.push(await evaluateNode(arg));
            }

            const localVariables = { ...variables };
            func.params.forEach((param, i) => {
                variables[param] = args[i];
            });

            const result = await executeAST({ body: func.body });


            Object.assign(variables, localVariables);

            return (result !== undefined) ? result : null;
        }

        default:
            throw new Error(`Tipo de nó não suportado na avaliação: ${node.type}`);
    }
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
                switch (node.operator) {
                  case '+':
                    return typeof leftVal === 'number' && typeof rightVal === 'number'
                      ? leftVal + rightVal
                      : String(leftVal) + String(rightVal);
                  case '-':
                    return Number(leftVal) - Number(rightVal);
                  case '*':
                    return Number(leftVal) * Number(rightVal);
                  case '/':
                    if (Number(rightVal) === 0) throw new Error("Divisão por zero");
                    return Number(leftVal) / Number(rightVal);
                  default:
                    throw new Error(`Operador '${node.operator}' não suportado neste contexto.`);
                }
              
            
        case 'CallExpression': {
            const func = functions[node.callee.name];
            if (!func) throw new Error(`Função desconhecida: ${node.callee.name}`);

            const args = node.arguments.map(evaluateNode);
            const localVariables = { ...variables };

            func.params.forEach((param, i) => {
                variables[param] = args[i];
            });

            for (const stmt of func.body) {
                if (stmt.type === 'ReturnStatement') {
                    const returnValue = evaluateNode(stmt.value);
                    Object.assign(variables, localVariables);
                    return returnValue;
                }
                executeAST({ body: [stmt] });
            }

            Object.assign(variables, localVariables);
            return null;
        }
        default:
            throw new Error(`Tipo de nó não suportado na avaliação: ${node.type}`);
    }
}

function evaluateExpression(expressions) {
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
            for (const v of node.value) {
                output += await evaluateNode(v);
            }
            console.log(output);

        } else if (node.type === 'VariavelDeclaration') {
            let value;
            if (node.valueNode.type === 'Literal') {
                value = node.valueNode.value;
            } else if (node.valueNode.type === 'Identifier') {
                if (variables[node.valueNode.name] === undefined) {
                    throw new Error(`Variável desconhecida: ${node.valueNode.name}`);
                }
                value = variables[node.valueNode.name];
            } else if (node.valueNode.type === 'ArrayLiteral') {
                const arr = [];
                for (const el of node.valueNode.elements) {
                    if (el.type === 'Literal') arr.push(el.value);
                    else if (el.type === 'Identifier') {
                        if (variables[el.name] === undefined) {
                            throw new Error(`Variável desconhecida: ${el.name}`);
                        }
                        arr.push(variables[el.name]);
                    }
                }
                value = arr;
            } else if (node.valueNode.type === 'CallExpression') {
                value = await evaluateNode(node.valueNode);
            } else {
                throw new Error(`Tipo de valor não suportado após '=': ${node.valueNode.type}`);
            }

            variables[node.name] = value;
            console.log(`Variável '${node.name}' definida com valor '${variables[node.name]}'`);

        } else if (node.type === 'CalculeExpression') {
            const result = evaluateExpression(node.expressions);
            console.log(`Resultado do cálculo: ${result}`);

        } else if (node.type === 'IfStatement') {
            if (evaluateCondition(node.condition)) {
                const result = await executeAST({ body: node.body });
                if (result !== undefined) return result; 
            } else if (node.elseBody) {
                const result = await executeAST({ body: node.elseBody });
                if (result !== undefined) return result; 
            }

        } else if (node.type === 'WhileStatement') {
            while (evaluateCondition(node.condition)) {
                const result = await executeAST({ body: node.body });
                if (result !== undefined) return result; 
            }

        } else if (node.type === 'FunctionDeclaration') {
            functions[node.name] = { params: node.params, body: node.body };
            console.log(`Função '${node.name}' registrada.`);

        } else if (node.type === 'InputStatement') {
            const question = node.question.replace(/(^"|"$)/g, '');
            const answer = await askQuestion(question);
            variables[node.variable] = isNaN(Number(answer)) ? answer : Number(answer);
            console.log(`Variável '${node.variable}' definida com valor '${variables[node.variable]}'`);

        } else if (node.type === 'ReturnStatement') {
            const returnValue = await evaluateNode(node.value);
            return returnValue;

        } else {
            console.error(`Comando desconhecido: ${node.type}`);
        }
    }

    return undefined;
}


(async function main() {
    try {
        const startTime = performance.now(); 
        const code = fs.readFileSync(filePath, 'utf-8');
        const tokens = tokenize(code);
        const ast = parse(tokens);
        console.log('--- Saída do Código Zin ---');
        await executeAST(ast); 
        const endTime = performance.now(); 
        const executionTime = endTime - startTime;
        console.log(`Tempo de execução: ${executionTime.toFixed(2)} ms`);
    } catch (error) {
        console.error(`Erro ao processar o arquivo: ${error.message}`);
    } finally {
        rl.close();
    }
})();

