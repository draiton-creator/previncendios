import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const keysPath = process.argv[2];

if (!keysPath || !fs.existsSync(keysPath)) {
  console.error('Uso: node scripts/updateEnv.mjs <ruta-fichero-claves>');
  process.exit(1);
}

const keysText = fs.readFileSync(keysPath, 'utf-8');
const keys = {};
for (const line of keysText.split(/\r?\n/).filter(Boolean)) {
  const [name, ...valueParts] = line.split('=');
  if (name) keys[name.trim()] = valueParts.join('=').trim();
}

const required = [
  'VITE_FIRMS_API_KEY',
  'VITE_OPENWEATHER_API_KEY',
  'VITE_GEMINI_API_KEY',
];

const missing = required.filter((k) => !keys[k]);
if (missing.length > 0) {
  console.error('Faltan claves:', missing.join(', '));
  process.exit(1);
}

let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
let lines = env.split(/\r?\n/);

// Eliminar clave antigua sin VITE_ (legacy)
lines = lines.filter((line) => !line.startsWith('GEMINI_API_KEY='));

for (const key of required) {
  const lineIndex = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (lineIndex >= 0) {
    lines[lineIndex] = `${key}=${keys[key]}`;
  } else {
    lines.push(`${key}=${keys[key]}`);
  }
}

fs.writeFileSync(envPath, lines.join('\n') + (lines.length ? '\n' : ''));

console.log('✓ .env actualizado con las claves.');
