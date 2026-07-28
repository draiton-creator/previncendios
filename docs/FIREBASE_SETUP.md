# Guía de configuración de Firebase para Previncendios España

> Esta guía explica paso a paso cómo crear un proyecto Firebase real, conectarlo con la app y preparar el entorno de desarrollo local.

---

## 1. Por qué no aparecía ningún proyecto vinculado

El repositorio traía una configuración de ejemplo (`firebase-applet-config.json`) que apuntaba a un proyecto `gen-lang-client-0739982630`. Ese proyecto fue generado automáticamente por el entorno de AI Studio o era un placeholder, y **no existe en tu consola de Firebase**. Para que la app funcione con datos reales necesitas crear o seleccionar tu propio proyecto.

---

## 2. Crear un proyecto Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com) e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Añadir proyecto"**.
3. Escribe el nombre del proyecto, por ejemplo `previncendios-espana`.
4. Acepta las condiciones y crea el proyecto.
5. (Opcional) Desactiva Google Analytics si no lo necesitas.

---

## 3. Registrar la app web

1. Dentro del proyecto, haz clic en el icono **"</>"** (Web).
2. Pon un nombre a la app, por ejemplo `previncendios-web`.
3. **No marques la opción de Firebase Hosting** si vas a desplegar en Vercel o en otro sitio; se puede configurar más tarde.
4. Haz clic en **"Registrar app"**.
5. Copia el objeto `firebaseConfig`. Tiene este aspecto:

```js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "previncendios-espana.firebaseapp.com",
  projectId: "previncendios-espana",
  storageBucket: "previncendios-espana.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx",
};
```

---

## 4. Configurar el archivo `.env`

1. En la raíz del proyecto, crea el archivo `.env` si no existe (está en `.gitignore`, así que no se subirá a GitHub).
2. Copia el contenido de `.env.example`.
3. Rellena los valores con los del paso anterior:

```env
VITE_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXX"
VITE_FIREBASE_AUTH_DOMAIN="previncendios-espana.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="previncendios-espana"
VITE_FIREBASE_STORAGE_BUCKET="previncendios-espana.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:xxxxxxxxxxxx"
VITE_FIREBASE_FIRESTORE_DATABASE_ID=""
VITE_FIREBASE_OAUTH_CLIENT_ID=""
```

> `VITE_FIREBASE_OAUTH_CLIENT_ID` solo es necesario si vas a usar inicio de sesión con Google de forma personalizada. Más información en el paso 7.

---

## 5. Activar los servicios necesarios

En el menú lateral de Firebase Console, activa estos productos:

### 5.1 Authentication
1. Ve a **Build > Authentication**.
2. Haz clic en **"Comenzar"**.
3. Activa **Correo electrónico / Contraseña**.
4. (Recomendado) Activa **Google** si quieres inicio de sesión con Google.

### 5.2 Firestore Database
1. Ve a **Build > Firestore Database**.
2. Haz clic en **"Crear base de datos"**.
3. Selecciona **"Iniciar en modo de prueba"** para desarrollo.
4. Elige la ubicación `europe-west` (más cercana a España).

### 5.3 Storage (para fotos y documentos)
1. Ve a **Build > Storage**.
2. Haz clic en **"Comenzar"**.
3. Selecciona **"Iniciar en modo de prueba"**.

### 5.4 Cloud Messaging (para notificaciones push)
1. Ve a **Build > Cloud Messaging**.
2. Genera un par de claves VAPID más adelante cuando se implemente FCM.

---

## 6. Desplegar las reglas de seguridad

1. Abre `firestore.rules` en el proyecto.
2. Sustituye su contenido por las reglas propuestas en `docs/INFORME_ESTADO.md` (sección 8.3) cuando el sistema de autenticación y municipios esté terminado.
3. Durante el desarrollo, las reglas actuales permiten lectura/escritura básica a usuarios autenticados. **No uses esas reglas en producción.**

Opcionalmente, instala Firebase CLI y ejecuta:

```bash
npx firebase deploy --only firestore:rules
```

---

## 7. Configurar inicio de sesión con Google (opcional)

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com) y selecciona tu proyecto Firebase.
2. Ve a **APIs y servicios > Credenciales**.
3. Crea un ID de cliente OAuth 2.0 tipo **Web**.
4. Añade `http://localhost:3000` y tu dominio de producción en **Orígenes autorizados de JavaScript**.
5. Copia el **ID de cliente** y pégalo en `VITE_FIREBASE_OAUTH_CLIENT_ID`.

---

## 8. Desarrollo local con emuladores de Firebase

Si quieres probar la app sin gastar cuota ni depender de un proyecto real, usa los emuladores locales.

### 8.1 Instalar Firebase CLI

```bash
npm install -D firebase-tools
```

O usa `npx` sin instalar:

```bash
npx firebase-tools emulators:start
```

### 8.2 Iniciar emuladores

Ya existe un `firebase.json` con la configuración de emuladores. Ejecuta:

```bash
npm run emulators
```

Esto levanta:
- Firestore en `localhost:8080`
- Auth en `localhost:9099`
- Storage en `localhost:9199`

### 8.3 Conectar la app a los emuladores

Durante el desarrollo se puede conectar la app a emuladores cambiando `src/firebase/config.ts` o mediante variables de entorno. Esto se documentará en el roadmap de la Sesión B.

---

## 9. Verificar que todo funciona

1. Arranca el servidor de desarrollo:

```bash
npm run dev
```

2. Abre `http://localhost:3000`.
3. Abre el modal de **Registro** e intenta crear un usuario con email y contraseña.
4. Si ves el mensaje "guardado en Firestore", la conexión funciona.
5. Ve a Firebase Console > Authentication y comprueba que el usuario aparece.

---

## 10. Siguiente paso recomendado

Con el proyecto ya creado, el siguiente paso es hacer que toda la app use datos reales de Firestore en lugar de los mocks de `EmergencyContext`. Esto está detallado en el roadmap del informe (`docs/INFORME_ESTADO.md`, Sesión B).
