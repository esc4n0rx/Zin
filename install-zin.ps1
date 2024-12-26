function Check-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "Git não está instalado. Por favor, instale o Git antes de continuar." -ForegroundColor Red
        exit 1
    }
    Write-Host "Git encontrado." -ForegroundColor Green
}

function Check-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js não está instalado. Por favor, instale o Node.js antes de continuar." -ForegroundColor Red
        exit 1
    }
    Write-Host "Node.js encontrado." -ForegroundColor Green
}

function Configure-SystemPath {
    $path = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    if ($path -notlike "*C:\bin*") {
        [System.Environment]::SetEnvironmentVariable("Path", $path + ";C:\bin", [System.EnvironmentVariableTarget]::Machine)
        Write-Host "Variável de ambiente PATH configurada para incluir C:\bin." -ForegroundColor Green
    } else {
        Write-Host "C:\bin já está configurado no PATH." -ForegroundColor Yellow
    }
}

function Create-Directories {
    $installPath = "C:\bin\Zin"
    $librariesPath = "$installPath\libraries"

    if (-not (Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        Write-Host "Diretório $installPath criado." -ForegroundColor Green
    } else {
        Write-Host "Diretório $installPath já existe." -ForegroundColor Yellow
    }

    if (-not (Test-Path $librariesPath)) {
        New-Item -ItemType Directory -Path $librariesPath -Force | Out-Null
        Write-Host "Diretório $librariesPath criado." -ForegroundColor Green
    } else {
        Write-Host "Diretório $librariesPath já existe." -ForegroundColor Yellow
    }

    return $installPath
}

function Clone-Repository {
    param (
        [string]$installPath
    )
    $repoUrl = "https://github.com/esc4n0rx/Zin"
    if (-not (Test-Path "$installPath\compiler.js")) {
        git clone $repoUrl $installPath
        Write-Host "Repositório clonado em $installPath." -ForegroundColor Green
    } else {
        Write-Host "Repositório já clonado em $installPath." -ForegroundColor Yellow
    }
}

function Download-Library {
    param (
        [string]$libraryName,
        [string]$installPath
    )
    $librariesPath = "$installPath\libraries"
    $libraryPath = "$librariesPath\$libraryName"

    if (Test-Path $libraryPath) {
        Write-Host "Biblioteca $libraryName já está instalada." -ForegroundColor Yellow
        return
    }

    $libraryUrl = "https://github.com/esc4n0rx/zin-libraries/tree/master/bibliotecas/$libraryName"
    Write-Host "Baixando biblioteca $libraryName de $libraryUrl..." -ForegroundColor Cyan
    git clone $libraryUrl $libraryPath
    Write-Host "Biblioteca $libraryName instalada com sucesso em $libraryPath." -ForegroundColor Green
}

function Create-BatchFile {
    param (
        [string]$installPath
    )
    $batContent = @"
@echo off
if "%1"=="-versao" (
    echo Zin Language - Versao 0.0.1
    exit /b 0
)
if "%1"=="-check" (
    if exist $installPath\compiler.js (
        echo Todos os arquivos necessários estão presentes.
        exit /b 0
    ) else (
        echo Erro: Arquivos necessários não encontrados em $installPath.
        exit /b 1
    )
)
if "%1"=="-create" (
    if "%2"=="" (
        echo Erro: Nenhum nome de arquivo especificado.
        exit /b 1
    )
    echo escreva("Hello World") > "%2"
    echo Arquivo "%2" criado com sucesso.
    exit /b 0
)
if "%1"=="-install" (
    if "%2"=="" (
        echo Erro: Nenhum nome de biblioteca especificado.
        exit /b 1
    )
    powershell -Command "& { Download-Library '%2' '$installPath' }"
    exit /b 0
)
if "%1"=="" (
    echo Erro: Nenhum arquivo especificado.
    echo Uso: zin <arquivo.z>
    exit /b 1
)
node $installPath\compiler.js %*
"@
    $batPath = "C:\bin\zin.bat"
    Set-Content -Path $batPath -Value $batContent -Force
    Write-Host "Arquivo zin.bat criado em $batPath." -ForegroundColor Green
}

function Install-Zin {
    Write-Host "Iniciando instalação do Zin..." -ForegroundColor Cyan
    Check-Git
    Check-Node
    Configure-SystemPath

    $installPath = Create-Directories
    Clone-Repository -installPath $installPath
    Create-BatchFile -installPath $installPath

    Write-Host "Instalação do Zin concluída com sucesso!" -ForegroundColor Green
    Write-Host "Você pode usar o comando 'zin' no terminal para executar arquivos .z ou instalar bibliotecas usando 'zin -install <biblioteca>'." -ForegroundColor Cyan
}

Install-Zin
