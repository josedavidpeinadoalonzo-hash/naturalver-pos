@echo off
REM Script para compilar NaturalVer's APK en Windows (Sin EAS)
REM Requiere tener instalado: Node.js, Java y Android Studio (con SDK)
REM Node.js 18 compatible (polyfills cargados via --require)

echo.
echo ========================================
echo   NaturalVer's - Compilador de APK
echo ========================================
echo.

REM Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node --version') do set "NODE_VER=%%v"
echo [OK] Node.js encontrado: %NODE_VER%

REM Verificar Java
echo Verificando Java...
if exist "C:\Program Files\Android\Android Studio\jbr" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    echo [INFO] Usando JDK de Android Studio
)
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java no esta instalado
    echo Descargalo desde: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)
echo [OK] Java encontrado

REM Verificar Android SDK
echo Verificando Android SDK...
if "%ANDROID_HOME%"=="" (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)
if not exist "%ANDROID_HOME%\platforms" (
    echo ERROR: No se encontro la carpeta de plataformas en %%ANDROID_HOME%%
    echo Asegurate de instalar Android Studio y al menos una plataforma SDK
    pause
    exit /b 1
)
echo [OK] Android SDK encontrado

REM Polyfill Node 18 APIs faltantes (toReversed, toSorted, findLast, etc.)
REM Se inyecta via --require para que este disponible en todos los modulos
set "NODE_OPTIONS=--require=%~dp0scripts\polyfill-node18.js"
echo [INFO] Node 18 polyfills activos (via --require)

REM Instalar dependencias
echo.
echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERROR: Fallo npm install
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

REM Aplicar parches de compatibilidad Node 18 (ESM Windows paths, polyfills)
echo.
echo Aplicando parches de compatibilidad Node 18...
node scripts\fix-node-modules.js
echo [OK] Parches aplicados

REM Generar carpeta nativa de Android (si no existe)
if not exist "android\app" (
    echo.
    echo Generando archivos nativos de Android...
    call npx expo prebuild --clean
) else (
    echo [INFO] Android nativo ya existe, saltando prebuild
)

REM Compilar APK con Gradle
echo.
echo ========================================
echo  COMPILANDO APK
echo  Tiempo estimado: 20-40 minutos
echo ========================================
echo.
cd android
call gradlew assembleRelease --no-daemon
set GRADLE_EXIT=%errorlevel%
cd ..

REM Limpiar variable de entorno
set "NODE_OPTIONS="

REM Verificar y copiar el APK
set "APK_ORIGEN=android\app\build\outputs\apk\release\app-release.apk"

if exist "%APK_ORIGEN%" (
    if not exist "dist" mkdir dist
    copy /Y "%APK_ORIGEN%" "dist\naturalvers-v1.2.1.apk" >nul
    
    for %%f in ("%APK_ORIGEN%") do set "APK_SIZE=%%~zf"

    echo.
    echo ========================================
    echo   [OK] APK compilado exitosamente!
    echo.
    echo   Version: 1.2.1
    echo   Tamano:  %APK_SIZE% bytes
    echo   Ubicacion: %cd%\dist\naturalvers-v1.2.1.apk
    echo ========================================
    echo.
    exit /b 0
) else (
    echo.
    echo ========================================
    echo   ERROR: No se pudo compilar el APK
    echo   Exit code de Gradle: %GRADLE_EXIT%
    echo   Revisa los errores de Gradle arriba.
    echo ========================================
    echo.
    exit /b 1
)
