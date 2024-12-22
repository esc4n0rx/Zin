/**************************************
 * Olha só, esse aqui é o compilador (meio zoneado, mas funciona)
 * Então, se você veio procurando perfeição... bem, errou de lugar.
 * Se ainda tá aqui, parabéns pela coragem! :)
 **************************************/

const fs = require('fs');                 // A boa e velha biblioteca de filesystem
const { tokenize } = require('./lexer');  // Nosso herói que racha o código em pedacinhos
const { parse } = require('./parser');    // E esse aqui tenta dar sentido a esses pedacinhos
const { performance } = require('perf_hooks');  // Só pra gente brincar de medir tempo
const readline = require('readline');     // E a gente ainda conversa com o console usando isso

// A gente finge que essas variáveis são GLOBAIS (porque sim)
const variables = {};  // Guarde aqui o que quiser, só não perca a chave...
const functions = {};  // Funções definidas no Zin viram propriedades lindas nesse objeto
const filePath = process.argv[2]; // Pega lá do Node: se esquecermos, já era


// confesso que isso ficou uma zona ja , porem está funcional 
// E isso aqui tá meio doido: aparentemente quer escrever no filePath que não existe quando !filePath?
// Bora fingir que não vimos essa contradição, haha!
if (!filePath) {
    fs.writeFileSync(filePath, content.replace(/\\n/g, '\n')); // Isso aqui não faz sentido, mas tá aqui?
    console.error('Erro: Nenhum arquivo fornecido.\nUso: zin <arquivo.z>');
    process.exit(1);
}

// Preparando a interface de leitura de console (pra quando o pessoal der input)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funciona tipo "E aí, parça, digita aqui o que eu tô te perguntando"
function askQuestion(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

/*****************************************
 * evaluateNode: é tipo "vamos ver o que
 * esse nó do AST quer da minha vida".
 * Retorna o valor resultante, ou um erro
 * se estiver de mau humor.
 *****************************************/
async function evaluateNode(node) {
    switch (node.type) {
        case 'Literal':
            // Se for literal, é fácil: devolve o valor cru.
            return node.value;

        case 'Identifier':
            // Se for só um identificador (tipo "x"), busca em variables
            if (variables[node.name] === undefined) {
                // Se não achar, bora surtar
                throw new Error(`Variável desconhecida: ${node.name}`);
            }
            return variables[node.name];

        case 'IndexExpression': {
            // Tipo: arr[algumaCoisa]
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
            // Aquele caso clássico: x + y, x - y, x * y, x / 0 (ops!)
            const leftVal = await evaluateNode(node.left);
            const rightVal = await evaluateNode(node.right);
            switch (node.operator) {
                case '+':
                    // Se ambos forem números, soma. Senão, concatena string e boa...
                    return (typeof leftVal === 'number' && typeof rightVal === 'number')
                      ? leftVal + rightVal
                      : String(leftVal) + String(rightVal);
                case '-':
                    return Number(leftVal) - Number(rightVal);
                case '*':
                    return Number(leftVal) * Number(rightVal);
                case '/':
                    // Divisão por zero é tipo pular sem paraquedas, não dá certo
                    if (Number(rightVal) === 0) throw new Error("Divisão por zero");
                    return Number(leftVal) / Number(rightVal);
                default:
                    throw new Error(`Operador '${node.operator}' não suportado neste contexto.`);
            }
        }

        case 'CallExpression': {
            // Chamou uma funçãããão
            const func = functions[node.callee.name];
            if (!func) throw new Error(`Função desconhecida: ${node.callee.name}`);
            const args = [];
            for (const arg of node.arguments) {
                args.push(await evaluateNode(arg));
            }

            // Guardamos o estado atual das variáveis (vai que a função mexe em tudo)
            const localVariables = { ...variables };
            // Atribui cada argumento a cada parâmetro
            func.params.forEach((param, i) => {
                variables[param] = args[i];
            });

            // Executa a AST do corpo da função
            const result = await executeAST({ body: func.body });

            // Restaura o estado das variáveis (senão vira festa do caqui)
            Object.assign(variables, localVariables);

            return (result !== undefined) ? result : null;
        }

        default:
            // Se cair aqui, a gente não sabe do que se trata
            throw new Error(`Tipo de nó não suportado na avaliação: ${node.type}`);
    }
}

/*****************************************************************
 * evaluateExpression: pega uma galera de tokens (tipo [x, +, y])
 * e avalia como uma expressão JS. Cuidado, aqui tem gambiarra braba.
 *****************************************************************/
function evaluateExpression(expressions) {
    let evalString = '';
    for (const token of expressions) {
        if (token.type === 'NUMBER') {
            // Se for número, só cola no evalString
            evalString += token.value;
        } else if (token.type === 'IDENTIFIER') {
            // Se for ID, troca pelo valor armazenado
            if (variables[token.value] === undefined) {
                throw new Error(`Variável desconhecida: ${token.value}`);
            }
            evalString += variables[token.value];
        } else if (['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!='].includes(token.value)) {
            // Se for operador, adiciona com espaço por segurança
            evalString += ` ${token.value} `;
        } else {
            // Qualquer coisa fora dessa lista não pode
            throw new Error(`Token inválido na expressão numérica: ${JSON.stringify(token)}`);
        }
    }

    // E no fim das contas, um eval maroto (prometa que nunca usará em prod, tá?)
    return eval(evalString);
}

/**************************************************************************
 * evaluateCondition: Parecido com a evaluateExpression, mas para condições,
 * tipo (x < 10). Mesma gambiarra com eval. Só que a gente separou em outra
 * função pra ficar "organizado"... SQN.
 **************************************************************************/
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

    // "eval" de novo, tamo abusando do bichinho...
    return eval(conditionString);
}

/*************************************************************
 * executeAST: Percorre a lista de nós do AST e faz as coisas.
 * Basicamente, um intérprete "simples" (entre muitas aspas).
 *************************************************************/
async function executeAST(ast) {
    for (const node of ast.body) {
        // Se for um print (EscrevaStatement)
        if (node.type === 'EscrevaStatement') {
            let output = '';
            for (const v of node.value) {
                let val = await evaluateNode(v);
                // Se tiver \n, bora transformar de verdade
                if (typeof val === 'string') {
                    val = val.replace(/\\n/g, '\n');
                }
                output += val;
            }
            // Joga tudo na tela
            console.log(output);

        } else if (node.type === 'EscrevaArquivoStatement') {
            // Escrever em arquivo
            const filePath = await evaluateNode(node.filePath);
            const content = await evaluateNode(node.content);

            try {
                console.log(`Tentando criar o arquivo: ${filePath}`);
                console.log(`Conteúdo: ${content}`);
                // Aqui rola o .replace() pra trocar \\n por \n real, finalmente
                fs.writeFileSync(filePath, content.replace(/\\n/g, '\n'));
                console.log(`Arquivo "${filePath}" criado com sucesso.`);
            } catch (err) {
                console.error(`Erro ao escrever no arquivo: ${err.message}`);
            }

        } else if (node.type === 'LeiaArquivoStatement') {
            // Leitura de arquivo
            const filePath = await evaluateNode(node.filePath);

            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                variables[node.variable] = content;
                console.log(`Conteúdo do arquivo ${filePath}:`);
                console.log(content);
            } catch (err) {
                console.error(`Erro ao ler o arquivo: ${err.message}`);
            }

        } else if (node.type === 'VariavelDeclaration') {
            // Declarou uma variável do tipo "variavel x = 123;"
            let value;

            if (!node.valueNode) {
                // Se não atribuir valor, fica nulo (por que não undefined? pq sim)
                value = null;
                console.log(`Variável '${node.name}' declarada sem valor.`);
            } else if (node.valueNode.type === 'Literal') {
                value = node.valueNode.value;
            } else if (node.valueNode.type === 'Identifier') {
                if (variables[node.valueNode.name] === undefined) {
                    throw new Error(`Variável desconhecida: ${node.valueNode.name}`);
                }
                value = variables[node.valueNode.name];
            } else if (node.valueNode.type === 'ArrayLiteral') {
                // Se for um array literal, vamos empurrando os valores
                const arr = [];
                for (const el of node.valueNode.elements) {
                    if (el.type === 'Literal') {
                        arr.push(el.value);
                    } else if (el.type === 'Identifier') {
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
                throw new Error(
                    `Tipo de valor não suportado após '=': ${node.valueNode.type || 'Nenhum valor fornecido'}`
                );
            }

            if (variables[node.name] !== undefined) {
                // Se já existir, a gente sobreescreve. Mas avisa que é a festa do "sabe de nada"
                console.warn(`Aviso: Sobrescrevendo valor da variável '${node.name}'.`);
            }

            variables[node.name] = value;
            console.log(`Variável '${node.name}' definida com valor '${variables[node.name]}'`);

        } else if (node.type === 'CalculeExpression') {
            // "calcule(x + y - 2)" e tal
            const result = evaluateExpression(node.expressions);
            console.log(`Resultado do cálculo: ${result}`);

        } else if (node.type === 'AssignmentStatement') {
            // i = i + 1, e por aí vai
            const newValue = await evaluateNode(node.value);

            if (variables[node.name] === undefined) {
                console.warn(`Aviso: variável '${node.name}' não existe. Será criada automaticamente.`);
            }
            variables[node.name] = newValue;

        } else if (node.type === 'IfStatement') {
            // "se" ... "senao"
            if (evaluateCondition(node.condition)) {
                // Se a condição for true
                const result = await executeAST({ body: node.body });
                if (result !== undefined) return result;
            } else if (node.elseBody) {
                // Se não for true e tiver else
                const result = await executeAST({ body: node.elseBody });
                if (result !== undefined) return result;
            }

        } else if (node.type === 'WhileStatement') {
            // loopzinho maroto
            while (evaluateCondition(node.condition)) {
                const result = await executeAST({ body: node.body });
                if (result !== undefined) return result;
            }

        } else if (node.type === 'FunctionDeclaration') {
            // define a função no dicionário 'functions'
            functions[node.name] = { params: node.params, body: node.body };
            console.log(`Função '${node.name}' registrada.`);

        } else if (node.type === 'InputStatement') {
            // "pergunte 'Digite algo' x;"
            const question = node.question.replace(/(^"|"$)/g, '');
            const answer = await askQuestion(question);
            // Tenta converter pra number; se não rolar, fica string
            variables[node.variable] = isNaN(Number(answer)) ? answer : Number(answer);
            console.log(`Variável '${node.variable}' definida com valor '${variables[node.variable]}'`);

        } else if (node.type === 'ReturnStatement') {
            // Opa, estamos num function e chegou o "retorne X"
            const returnValue = await evaluateNode(node.value);
            return returnValue;

        } else {
            // Bora desistir, é muita loucura
            console.error(`Comando desconhecido: ${node.type}`);
        }
    }

    // Se acabar a AST e não retornar nada, devolvemos undefined
    return undefined;
}

/*****************************************************
 * Função principal main(), que bota tudo pra rodar.
 * Lê arquivo, tokeniza, parseia, e executa. Ufa!
 *****************************************************/
(async function main() {
    try {
        const startTime = performance.now(); // Cronômetro
        const code = fs.readFileSync(filePath, 'utf-8'); // Lê o código Zin
        const tokens = tokenize(code);                    // Tokeniza (cuidado com a bagunça)
        
        const ast = parse(tokens, filePath, tokenize);   // Parser que gera a árvore
        
        console.log('--- Saída do Código Zin ---');
        await executeAST(ast);                           // Interpreta a bagaça
        const endTime = performance.now(); 
        const executionTime = endTime - startTime;
        // Cuidado, esse tempo aqui é praticamente um "chute" do perf_hooks
        console.log(`Tempo de execução: ${executionTime.toFixed(2)} ms`);
    } catch (error) {
        // Se algo deu muito ruim, paramos aqui
        console.error(`Erro ao processar o arquivo: ${error.message}`);
    } finally {
        // Encerra a leitura do console, a gente não quer ficar escutando pra sempre
        rl.close();
    }
})();
