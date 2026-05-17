# Instrucciones para Compilar NaturalVer's APK

## Requisitos Previos

Necesitas instalar lo siguiente en tu computadora:

### 1. Node.js (v16 o superior)
- Descarga desde: https://nodejs.org/
- Descarga la versión **LTS** (Long Term Support)
- Instala normalmente

### 2. Android SDK / Android Studio
- **Opción A (Recomendada)**: Instala Android Studio desde https://developer.android.com/studio
- **Opción B**: Solo Android SDK (más ligero) desde https://developer.android.com/studio#command-tools

### 3. Java Development Kit (JDK)
- Descarga desde: https://www.oracle.com/java/technologies/downloads/
- O usa: `choco install openjdk` (Windows) / `brew install openjdk` (Mac)

---

## Pasos para Compilar el APK

### Paso 1: Preparar el Proyecto

1. Extrae el archivo del proyecto NaturalVer's en una carpeta
2. Abre una terminal/CMD en esa carpeta
3. Ejecuta:
   ```bash
   npm install -g pnpm
   pnpm install
   ```

### Paso 2: Configurar Variables de Entorno (IMPORTANTE)

#### En Windows (CMD):
```cmd
set JAVA_HOME=C:\Program Files\Java\jdk-21
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

#### En Mac/Linux:
```bash
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME=$HOME/Library/Android/Sdk  # Mac
# o
export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Paso 3: Compilar el APK

La forma más fácil y rápida es usar el script automatizado que hemos creado:

1. Simplemente haz doble clic en el archivo:
   `compilar-apk.bat`
2. El script se encargará de:
   - Verificar Java y Android SDK automáticamente.
   - Instalar dependencias necesarias.
   - Generar los archivos nativos.
   - Compilar el APK final.

**Nota**: La primera compilación puede tardar **10-20 minutos**.

### Paso 4: Encontrar el APK

Una vez que el script termine exitosamente, encontrarás tu aplicación en:
```
C:\NaturalVer\dist\naturalvers-v1.2.0.apk
```

---

## Instalación en tu Dispositivo Android

### Opción A: Conectar por USB
1. Conecta tu teléfono a la computadora con USB
2. Activa **Modo de Desarrollador** en tu teléfono:
   - Ve a **Configuración > Acerca de**
   - Toca 7 veces el número de compilación
3. Ejecuta en la terminal:
   ```bash
   adb install ./dist/app-release.apk
   ```

### Opción B: Transferir por archivo
1. Copia el archivo `app-release.apk` a tu teléfono
2. Abre el archivo desde el gestor de archivos
3. Instala normalmente

---

## Solución de Problemas

### Error: "Java no encontrado"
- Verifica que JAVA_HOME esté configurado correctamente
- Reinicia la terminal después de configurar variables de entorno

### Error: "Android SDK no encontrado"
- Verifica que ANDROID_HOME esté configurado correctamente
- Asegúrate de tener instalado Android SDK

### Error: "No se puede conectar a Expo"
- Verifica tu conexión a internet
- Intenta ejecutar: `npx eas login` con tu token

### La compilación es muy lenta
- Es normal la primera vez
- Asegúrate de tener al menos 10GB de espacio libre
- Cierra otras aplicaciones pesadas

---

## Configuración Rápida (Alternativa)

Si prefieres no configurar variables de entorno, puedes editar el archivo `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## Necesitas Ayuda?

Si tienes problemas, verifica:
1. ✅ Node.js instalado: `node --version`
2. ✅ Java instalado: `java -version`
3. ✅ Android SDK: Busca la carpeta `Sdk` en tu sistema
4. ✅ Conexión a internet activa

¡Buena suerte! 🚀
