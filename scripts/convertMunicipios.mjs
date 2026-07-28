import fs from 'fs';
import path from 'path';

function normalizeId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const csvPath = path.resolve('municipalidades.csv');
const outPath = path.resolve('public', 'municipios.json');

const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split(/\r?\n/);
const header = lines[0].replace(/"/g, '').split(',');

const communityIdx = header.indexOf('Comunidad');
const provinceIdx = header.indexOf('Provincia');
const municipalityIdx = header.indexOf('Municipio');
const populationIdx = header.indexOf('Población');
const latIdx = header.indexOf('Latitud');
const lngIdx = header.indexOf('Longitud');

const municipalities = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i]
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((c) => c.replace(/^"|"$/g, '').trim());

  const name = cols[municipalityIdx];
  if (!name) continue;

  const province = cols[provinceIdx];
  const community = cols[communityIdx];
  const population = parseInt(cols[populationIdx], 10) || 0;
  const lat = parseFloat(cols[latIdx]);
  const lng = parseFloat(cols[lngIdx]);

  if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

  const id = `muni_${normalizeId(name)}_${normalizeId(province)}`;

  municipalities.push({
    id,
    name,
    ineCode: `${i.toString().padStart(5, '0')}`,
    province,
    autonomousCommunity: community,
    centerLat: lat,
    centerLng: lng,
    fireRiskLevel: 'Moderado',
    activeEmergencyCount: 0,
    officialContactPhone: '',
    emergencyEmail: '',
    twinnedMunicipalityIds: [],
    population,
    createdAt: new Date().toISOString(),
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(municipalities, null, 2));

console.log(`✓ Convertidos ${municipalities.length} municipios a ${outPath}`);
