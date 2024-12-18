function generateAssembly(ast) {
    let assemblyCode = 'section .data\n';

    const variables = {};
    let variableCounter = 0;

    ast.body.forEach(node => {
        if (node.type === 'VariavelDeclaration') {
            const variableName = `var${variableCounter++}`;
            variables[node.name] = variableName;
            assemblyCode += `    ${variableName} dd ${node.value}\n`;
        }
    });
    assemblyCode += '\nsection .text\n    global _start\n\n_start:\n';

    ast.body.forEach(node => {
        if (node.type === 'EscrevaStatement') {
            assemblyCode += `    mov eax, 4\n    mov ebx, 1\n    mov ecx, ${node.value}\n    int 0x80\n`;
        } else if (node.type === 'CalculeExpression') {
            assemblyCode += '    ; Calcule\n';
            node.expressions.forEach(exp => {
                assemblyCode += `    ; ${exp}\n`;
            });
        }
    });
    assemblyCode += '\n    mov eax, 1\n    xor ebx, ebx\n    int 0x80\n';
    return assemblyCode;
}
module.exports = { generateAssembly };
