
# **Documentação da Linguagem Zin**

## **Índice**
1. [Introdução](#introdução)  
2. [Requisitos de Instalação](#requisitos-de-instalação)  
3. [Estrutura do Código](#estrutura-do-código)  
4. [Palavras-Chave](#palavras-chave)  
5. [Comandos Principais](#comandos-principais)  
6. [Estruturas de Controle](#estruturas-de-controle)  
7. [Operadores Suportados](#operadores-suportados)  
8. [Exemplo Completo](#exemplo-completo)  
9. [Manipulação de Arquivos](#manipulação-de-arquivos)  
10. [Execução do Programa](#execução-do-programa)  

---

## **1. Introdução**

**Zin** é uma linguagem de programação simples e didática, projetada para aprendizado. Ela possui sintaxe explícita, comandos básicos para controle de fluxo, manipulação de variáveis, suporte a cálculos e operações condicionais, modularização e manipulação de arquivos TXT.

A linguagem Zin utiliza arquivos com a extensão **`.z`**.

---

## **2. Requisitos de Instalação**

Para usar a linguagem Zin, você precisa:

1. **Node.js** instalado no sistema.
2. Clonar o projeto para ter acesso ao compilador e arquivos necessários.
3. Um editor de texto, como **Visual Studio Code**, configurado para rodar arquivos `.z`.
4. Use o comando abaixo para instalar:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; `
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/esc4n0rx/Zin/main/install-zin.ps1" -OutFile "install-zin.ps1"; `
   .\install-zin.ps1
   ```

---

## **3. Estrutura do Código**

O código Zin utiliza uma estrutura simples e comandos claros. Um exemplo básico:

```z
variavel x = 10;
escreva("O valor de x é: " + x);
calcule(x = x + 5);
escreva("Novo valor de x: " + x);
```

---

## **4. Palavras-Chave**

| Palavra-chave  | Descrição                                  |
|----------------|--------------------------------------------|
| `variavel`     | Declara uma variável.                     |
| `escreva`      | Imprime mensagens no terminal.            |
| `calcule`      | Realiza cálculos e atribuições.           |
| `se`           | Inicia uma estrutura condicional.         |
| `senao`        | Bloco alternativo ao `se`.                |
| `enquanto`     | Inicia um loop baseado em uma condição.   |
| `funcao`       | Cria uma função.                          |
| `retorne`      | Retorna um valor de uma função.           |
| `importe`      | Permite importar arquivos.                |
| `escrevaArquivo` | Salva conteúdo em um arquivo TXT.       |
| `leiaArquivo`  | Lê conteúdo de um arquivo TXT.            |

---

## **5. Comandos Principais**

### **5.1. Declaração de Variáveis**

Use `variavel` para criar variáveis.

```z
variavel nome = "João";
variavel idade = 25;
```

### **5.2. Impressão de Mensagens**

Use `escreva()` para exibir mensagens no terminal. Pode concatenar variáveis com `+`.

```z
escreva("Olá, mundo!");
escreva("Nome: " + nome);
```

### **5.3. Cálculos**

Use `calcule()` para realizar operações matemáticas ou atribuições.

```z
variavel x = 10;
calcule(x = x + 5);
escreva("Resultado: " + x);
```

---

## **6. Estruturas de Controle**

### **6.1. Estrutura Condicional: `se` e `senao`**

```z
variavel x = 10;

se (x > 5) {
    escreva("x é maior que 5");
} senao {
    escreva("x é menor ou igual a 5");
}
```

### **6.2. Estrutura de Loop: `enquanto`**

```z
variavel contador = 0;

enquanto (contador < 5) {
    escreva("Contador: " + contador);
    calcule(contador = contador + 1);
}
```

---

## **7. Operadores Suportados**

### **7.1. Operadores Aritméticos**

| Operador | Descrição             | Exemplo          |
|----------|-----------------------|------------------|
| `+`      | Adição                | `x = x + 2`      |
| `-`      | Subtração             | `x = x - 2`      |
| `*`      | Multiplicação         | `x = x * 2`      |
| `/`      | Divisão               | `x = x / 2`      |
| `%`      | Resto da Divisão      | `x = x % 2`      |

### **7.2. Operadores Relacionais**

| Operador | Descrição              | Exemplo          |
|----------|------------------------|------------------|
| `<`      | Menor que              | `x < 5`          |
| `>`      | Maior que              | `x > 5`          |
| `<=`     | Menor ou igual         | `x <= 5`         |
| `>=`     | Maior ou igual         | `x >= 5`         |
| `==`     | Igualdade              | `x == 5`         |
| `!=`     | Diferente              | `x != 5`         |

---

## **8. Exemplo Completo**

```z
// Programa para verificar números pares e ímpares
variavel x = 0;

enquanto (x < 5) {
    escreva("Valor de x: " + x);

    se (x % 2 == 0) {
        escreva("x é par.");
    } senao {
        escreva("x é ímpar.");
    }

    calcule(x = x + 1);
}

escreva("Fim do programa.");
```

---

## **9. Manipulação de Arquivos**

### **9.1. Escrever em um Arquivo**

Use `escrevaArquivo` para salvar texto em um arquivo:

```z
escrevaArquivo("saida.txt", "Hello, Zin!");
escreva("Arquivo 'saida.txt' criado com sucesso.");
```

### **9.2. Ler de um Arquivo**

Use `leiaArquivo` para carregar conteúdo de um arquivo:

```z
leiaArquivo("saida.txt", conteudo);
escreva("Conteúdo do arquivo: " + conteudo);
```

### **9.3. Exemplo Completo: Gerar Relatório**

```z
variavel relatorio = "Relatório de Números Pares:\n";

variavel i = 1;
enquanto (i <= 10) {
    se (i % 2 == 0) {
        relatorio = relatorio + "Número: " + i + "\n";
    }
    i = i + 1;
}

escrevaArquivo("relatorio.txt", relatorio);
escreva("Relatório salvo em 'relatorio.txt'.");

```

**Saída Esperada no Arquivo `relatorio.txt`:**
```
Relatório de Números Pares:
Número: 2
Número: 4
Número: 6
Número: 8
Número: 10
```

---

## **10. Execução do Programa**

### **Requisitos**
- Tenha o arquivo `zin.bat` para executar.
- Crie os arquivos `.z` com um editor de texto.

### **Execução**
No terminal, digite:

```bash
zin <nome_do_arquivo.z>
```

**Exemplo**:
```bash
zin exemplo.z
```

---

## **Conclusão**

Com suporte à manipulação de arquivos, a linguagem Zin agora permite criar e ler arquivos TXT, expandindo suas aplicações práticas. 🚀
