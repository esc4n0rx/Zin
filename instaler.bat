@echo off
echo Instalando a linguagem Zin...
pause

:: Definir diretório de instalação
set "INSTALL_DIR=C:\bin\Zin"

:: Criar diretório, caso não exista
if not exist "%INSTALL_DIR%" (
    echo Criando diretório %INSTALL_DIR%...
    mkdir "%INSTALL_DIR%"
    echo Diretório criado.
) else (
    echo Diretório %INSTALL_DIR% já existe.
)
pause

:: Copiar arquivos
echo Copiando arquivos para %INSTALL_DIR%...
copy /Y "compiler.js" "%INSTALL_DIR%" > nul
copy /Y "lexer.js" "%INSTALL_DIR%" > nul
copy /Y "parser.js" "%INSTALL_DIR%" > nul
copy /Y "main.z" "%INSTALL_DIR%" > nul
echo Arquivos copiados.
pause

:: Criar o arquivo zin.bat no diretório principal (C:\bin)
set "EXECUTABLE=C:\bin\zin.bat"
echo Criando o arquivo %EXECUTABLE%...
(
    echo @echo off
    echo if "%%1"=="-versao" (
    echo echo Zin Language - Versao 0.0.1
    echo exit /b 0
    echo )
    echo if "%%1"=="" (
    echo echo Erro: Nenhum arquivo especificado.
    echo echo Uso: zin ^<arquivo.z^>
    echo exit /b 1
    echo )
    echo node "%INSTALL_DIR%\compiler.js" %%*
) > "%EXECUTABLE%"
echo Arquivo %EXECUTABLE% criado.
pause

:: Adicionar C:\bin ao PATH, caso ainda não esteja
echo Verificando PATH...
for %%P in ("%PATH:;=" "%") do (
    if /I "%%~P"=="C:\bin" (
        echo O diretório C:\bin já está no PATH.
        goto :PATH_EXISTS
    )
)
echo Adicionando C:\bin ao PATH...
setx PATH "%PATH%;C:\bin" > nul
echo C:\bin adicionado ao PATH.
:PATH_EXISTS
pause

echo Instalação concluída.
echo Para testar, use: zin -versao ou zin <arquivo.z>
pause
exit
