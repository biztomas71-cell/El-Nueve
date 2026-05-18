# El Nueve - App de Gestión Deportiva

Esta aplicación ha sido desarrollada para la gestión de entrenamientos, calendarios y currículum académico de clubes deportivos.

## Características

- **Calendario de Eventos**: Gestión de partidos, entrenamientos y eventos especiales.
- **Currículum Académico**: Seguimiento de contenidos técnicos y tácticos por categorías y periodos.
- **Gestión de Usuarios**: Roles diferenciados para administradores y entrenadores.
- **Autenticación con Google**: Acceso seguro y sencillo.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- Una cuenta de [Firebase](https://firebase.google.com/)

## Configuración

1. **Clonar el repositorio** y entrar en la carpeta del proyecto.
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Configurar Firebase**:
   - Crea un proyecto en Firebase Console.
   - Habilita **Authentication** con el proveedor Google.
   - Crea una base de datos **Firestore**.
   - Registra una aplicación Web en tu proyecto de Firebase.
4. **Variables de Entorno**:
   - Crea un archivo `.env` basado en `.env.example`.
   - Completa las variables con tus credenciales de Firebase.
   - Asegúrate de agregar los dominios permitidos (ej. `localhost`, tu dominio de despliegue) en la sección de Authentication de Firebase.

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Despliegue en GitHub Pages (vía GitHub Actions)

Para que la aplicación funcione correctamente en GitHub Pages, sigue estos pasos:

1. **Configurar Secrets en GitHub**:
   - Ve a tu repositorio en GitHub.
   - Entra en `Settings > Secrets and variables > Actions`.
   - Haz clic en `New repository secret` y añade cada una de las siguientes variables (puedes encontrar los valores en tu archivo `.env` o en la consola de Firebase):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (Si usas el ID por defecto, suele ser `(default)`)

2. **Habilitar GitHub Actions para Pages**:
   - Ve a `Settings > Pages`.
   - En la sección **Build and deployment**, bajo **Source**, selecciona **GitHub Actions**.

3. **Subir cambios**:
   - Una vez que subas el archivo `.github/workflows/deploy.yml` a tu rama `main`, GitHub Actions comenzará automáticamente el proceso de construcción y despliegue.

4. **Soporte para Rutas (SPA)**:
   - El workflow incluye un paso que copia `index.html` a `404.html`. Esto permite que si recargas la página en una ruta interna (ej. `/calendario`), GitHub Pages no devuelva un error 404 y cargue la aplicación correctamente.

## Modo de Prueba (Sin Firebase)

Si deseas probar la aplicación rápidamente en GitHub Pages sin configurar Firebase:
- La aplicación detectará automáticamente si faltan las variables de entorno y entrará en **Modo Mock**.
- Los datos se guardarán localmente en tu navegador (`localStorage`).
- Podrás usar las funcionalidades de calendario y currículum, pero los cambios solo serán visibles para ti en ese navegador.
- Para habilitar la colaboración real, sigue los pasos de configuración de Firebase mencionados anteriormente.

## Despliegue (General)

Para generar la versión de producción:

```bash
npm run build
```

Para iniciar la aplicación en producción:

```bash
npm run start
```

## Estructura del Proyecto

- `src/components`: Componentes de la interfaz de usuario.
- `src/lib/firebase.ts`: Configuración e inicialización de Firebase.
- `server.ts`: Servidor Express para manejar rutas de API y servir la SPA en producción.
- `firestore.rules`: Reglas de seguridad para Firestore.

## Notas sobre Seguridad

Asegúrate de desplegar las reglas de seguridad de `firestore.rules` en tu consola de Firebase para proteger tus datos según los roles definidos en la aplicación.
