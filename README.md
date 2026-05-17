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

## Despliegue en GitHub Pages

1. **Configurar el Repositorio**:
   - Asegúrate de que el campo `homepage` en `package.json` coincida con tu URL de GitHub Pages (ej. `https://tu-usuario.github.io/tu-repo/`).
2. **Subir el código a GitHub**.
3. **Desplegar**:
   ```bash
   npm run deploy
   ```
4. **Configurar Secrets**:
   - En GitHub, ve a `Settings > Secrets and variables > Actions`.
   - Agrega todas las variables que comienzan con `VITE_FIREBASE_` que definiste en tu `.env`.
   - Si usas GitHub Actions para desplegar, asegúrate de que el workflow tenga acceso a estas variables.

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
