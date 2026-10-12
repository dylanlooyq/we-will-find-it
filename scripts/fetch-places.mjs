// Writes src/lib/data/places.ts: every MRT station plus the larger malls, parks, campuses, hospitals
// and landmarks, with coordinates from OneMap (onemap.gov.sg, the Singapore Land Authority's map).
//
//   node scripts/fetch-places.mjs             look up only what the file doesn't have yet
//   node scripts/fetch-places.mjs --refresh   ask OneMap for everything again (a few minutes)
//
// To add a place, add a line to PLACES below and run it again. Places already written by hand in
// src/lib/data/taxonomy.ts are left alone (same id → skipped). Anything OneMap can't match is listed
// at the end and left out, so check the output before committing.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SEARCH = "https://www.onemap.gov.sg/api/common/elastic/search";
const OUT = "src/lib/data/places.ts";

/** [name shown, kind, what to search OneMap for, the second line shown in pickers (default: its road)]. */
const PLACES = [
  // Malls — Orchard
  ["Plaza Singapura", "mall", "PLAZA SINGAPURA"],
  ["Ngee Ann City", "mall", "NGEE ANN CITY", "Takashimaya"],
  ["Paragon", "mall", "THE PARAGON"],
  ["313@Somerset", "mall", "313@SOMERSET"],
  ["Orchard Central", "mall", "ORCHARD CENTRAL"],
  ["Wisma Atria", "mall", "WISMA ATRIA"],
  ["Wheelock Place", "mall", "WHEELOCK PLACE"],
  ["Far East Plaza", "mall", "FAR EAST PLAZA"],
  ["Lucky Plaza", "mall", "LUCKY PLAZA"],
  ["The Centrepoint", "mall", "THE CENTREPOINT"],
  ["Tanglin Mall", "mall", "TANGLIN MALL"],
  ["Great World", "mall", "GREAT WORLD CITY"],
  // Malls — City
  ["Bugis Junction", "mall", "BUGIS JUNCTION"],
  ["Bugis+", "mall", "BUGIS+"],
  ["Suntec City", "mall", "SUNTEC CITY MALL"],
  ["Marina Square", "mall", "MARINA SQUARE"],
  ["Millenia Walk", "mall", "MILLENIA WALK"],
  ["Raffles City", "mall", "RAFFLES CITY SHOPPING CENTRE"],
  ["Funan", "mall", "FUNAN"],
  ["Chinatown Point", "mall", "CHINATOWN POINT"],
  ["People's Park Complex", "mall", "PEOPLE'S PARK COMPLEX"],
  ["Clarke Quay Central", "mall", "THE CENTRAL"],
  ["Sim Lim Square", "mall", "SIM LIM SQUARE"],
  ["Mustafa Centre", "mall", "MUSTAFA CENTRE"],
  ["City Square Mall", "mall", "CITY SQUARE MALL"],
  // Malls — central and south
  ["Tiong Bahru Plaza", "mall", "TIONG BAHRU PLAZA"],
  ["HarbourFront Centre", "mall", "HARBOURFRONT CENTRE"],
  ["Anchorpoint", "mall", "ANCHORPOINT"],
  ["Queensway Shopping Centre", "mall", "QUEENSWAY SHOPPING CENTRE"],
  ["The Star Vista", "mall", "THE STAR VISTA"],
  ["The Clementi Mall", "mall", "THE CLEMENTI MALL"],
  ["West Coast Plaza", "mall", "WEST COAST PLAZA"],
  ["Novena Square", "mall", "NOVENA SQUARE"],
  ["United Square", "mall", "UNITED SQUARE"],
  ["Junction 8", "mall", "JUNCTION 8"],
  ["Thomson Plaza", "mall", "THOMSON PLAZA"],
  ["Bukit Timah Plaza", "mall", "BUKIT TIMAH PLAZA"],
  ["Beauty World Centre", "mall", "BEAUTY WORLD CENTRE"],
  // Malls — north-east
  ["NEX", "mall", "NEX"],
  ["Heartland Mall", "mall", "HEARTLAND MALL"],
  ["Compass One", "mall", "COMPASS ONE"],
  ["Rivervale Mall", "mall", "RIVERVALE MALL"],
  ["The Seletar Mall", "mall", "THE SELETAR MALL"],
  ["Waterway Point", "mall", "WATERWAY POINT"],
  ["Punggol Plaza", "mall", "PUNGGOL PLAZA"],
  ["Oasis Terraces", "mall", "OASIS TERRACES"],
  // Malls — east
  ["Parkway Parade", "mall", "PARKWAY PARADE"],
  ["Paya Lebar Quarter", "mall", "PAYA LEBAR QUARTER", "PLQ Mall"],
  ["SingPost Centre", "mall", "SINGAPORE POST CENTRE"],
  ["Kallang Wave Mall", "mall", "KALLANG WAVE MALL"],
  ["Bedok Mall", "mall", "BEDOK MALL"],
  ["Century Square", "mall", "CENTURY SQUARE"],
  ["Tampines 1", "mall", "TAMPINES ONE"],
  ["Our Tampines Hub", "mall", "OUR TAMPINES HUB"],
  ["Eastpoint Mall", "mall", "EASTPOINT MALL"],
  ["Changi City Point", "mall", "CHANGI CITY POINT"],
  ["White Sands", "mall", "WHITE SANDS"],
  ["Downtown East", "mall", "DOWNTOWN EAST"],
  // Malls — north
  ["Causeway Point", "mall", "CAUSEWAY POINT"],
  ["Sun Plaza", "mall", "SUN PLAZA"],
  ["Sembawang Shopping Centre", "mall", "SEMBAWANG SHOPPING CENTRE"],
  ["Canberra Plaza", "mall", "CANBERRA PLAZA"],
  // Malls — west
  ["Westgate", "mall", "WESTGATE"],
  ["IMM", "mall", "IMM BUILDING"],
  ["Jurong Point", "mall", "JURONG POINT"],
  ["Lot One", "mall", "LOT ONE SHOPPERS' MALL"],
  ["Bukit Panjang Plaza", "mall", "BUKIT PANJANG PLAZA"],
  ["Hillion Mall", "mall", "HILLION MALL"],
  ["West Mall", "mall", "WEST MALL"],
  // Landmarks — the bay and the city
  ["Esplanade", "landmark", "ESPLANADE - THEATRES ON THE BAY", "Theatres on the Bay"],
  ["Merlion Park", "landmark", "MERLION PARK"],
  ["Marina Bay Sands", "landmark", "MARINA BAY SANDS"],
  ["Gardens by the Bay", "park", "GARDENS BY THE BAY"],
  ["Marina Barrage", "landmark", "MARINA BARRAGE"],
  ["Singapore Flyer", "landmark", "SINGAPORE FLYER"],
  ["ArtScience Museum", "landmark", "MARINA BAY SANDS (ARTSCIENCE MUSEUM)", "Marina Bay Sands"],
  ["National Gallery Singapore", "landmark", "NATIONAL GALLERY SINGAPORE"],
  ["National Museum of Singapore", "landmark", "NATIONAL MUSEUM OF SINGAPORE"],
  ["Fort Canning Park", "park", "FORT CANNING PARK"],
  ["Clarke Quay", "landmark", "CLARKE QUAY", "Riverside"],
  ["Boat Quay", "landmark", "BOAT QUAY", "Riverside"],
  ["Chinatown Complex", "landmark", "CHINATOWN COMPLEX"],
  ["Tekka Centre", "landmark", "ZHUJIAO CENTRE (TEKKA MARKET)", "Little India"],
  ["Sultan Mosque", "landmark", "MASJID SULTAN", "Kampong Glam"],
  ["Lau Pa Sat", "landmark", "LAU PA SAT"],
  ["Maxwell Food Centre", "landmark", "MAXWELL FOOD CENTRE"],
  ["Newton Food Centre", "landmark", "NEWTON FOOD CENTRE"],
  ["Old Airport Road Food Centre", "landmark", "51 OLD AIRPORT ROAD FOOD CENTRE AND SHOPPING MALL"],
  ["Chomp Chomp Food Centre", "landmark", "CHOMP CHOMP FOOD CENTRE"],
  // Landmarks — sport, Sentosa, attractions
  ["National Stadium", "landmark", "NATIONAL STADIUM", "Singapore Sports Hub"],
  ["Singapore Indoor Stadium", "landmark", "SINGAPORE INDOOR STADIUM"],
  ["Singapore Expo", "landmark", "SINGAPORE EXPO"],
  ["Resorts World Sentosa", "landmark", "RESORTS WORLD SENTOSA", "Sentosa"],
  ["Universal Studios Singapore", "landmark", "UNIVERSAL STUDIOS SINGAPORE", "Sentosa"],
  ["Siloso Beach", "park", "SILOSO BEACH", "Sentosa"],
  ["Singapore Zoo", "landmark", "SINGAPORE ZOO", "Mandai"],
  ["Night Safari", "landmark", "NIGHT SAFARI", "Mandai"],
  ["River Wonders", "landmark", "RIVER WONDERS", "Mandai"],
  ["Bird Paradise", "landmark", "BIRD PARADISE", "Mandai"],
  ["Science Centre Singapore", "landmark", "SCIENCE CENTRE SINGAPORE"],
  ["Haw Par Villa", "landmark", "HAW PAR VILLA"],
  // Parks
  ["Jurong Lake Gardens", "park", "JLG: LAKESIDE GARDEN", "Lakeside Garden"],
  ["Mount Faber Park", "park", "MOUNT FABER PARK"],
  ["Labrador Nature Reserve", "park", "LABRADOR NATURE RESERVE"],
  ["West Coast Park", "park", "WEST COAST PARK"],
  ["Pasir Ris Park", "park", "PASIR RIS PARK"],
  ["Changi Beach Park", "park", "CHANGI BEACH PARK"],
  ["MacRitchie Reservoir Park", "park", "MACRITCHIE RESERVOIR PARK"],
  ["Bishan-Ang Mo Kio Park", "park", "BISHAN-ANG MO KIO PARK"],
  ["Bukit Timah Nature Reserve", "park", "BUKIT TIMAH NATURE RESERVE"],
  ["Sungei Buloh Wetland Reserve", "park", "SUNGEI BULOH WETLAND RESERVE"],
  ["Coney Island Park", "park", "CONEY ISLAND PARK"],
  ["Sembawang Park", "park", "SEMBAWANG PARK"],
  // Getting in and out
  ["Changi Airport Terminal 1", "airport", "CHANGI AIRPORT TERMINAL 1"],
  ["Changi Airport Terminal 2", "airport", "CHANGI AIRPORT TERMINAL 2"],
  ["Changi Airport Terminal 4", "airport", "CHANGI AIRPORT TERMINAL 4"],
  ["Changi Village", "landmark", "CHANGI VILLAGE", "Hawker centre & ferry point"],
  ["Singapore Cruise Centre", "landmark", "SINGAPORE CRUISE CENTRE", "HarbourFront"],
  ["Marina Bay Cruise Centre", "landmark", "MARINA BAY CRUISE CENTRE SINGAPORE"],
  ["Tanah Merah Ferry Terminal", "landmark", "TANAH MERAH FERRY TERMINAL"],
  ["Tuas Checkpoint", "landmark", "TUAS CHECKPOINT", "Second Link"],
  // Campuses
  ["SMU", "campus", "SINGAPORE MANAGEMENT UNIVERSITY", "Singapore Management University"],
  ["SUTD", "campus", "SINGAPORE UNIVERSITY OF TECHNOLOGY AND DESIGN", "Upper Changi"],
  ["SIT Punggol Campus", "campus", "SINGAPORE INSTITUTE OF TECHNOLOGY", "Punggol Digital District"],
  ["SUSS", "campus", "SINGAPORE UNIVERSITY OF SOCIAL SCIENCES", "Clementi Road"],
  ["Singapore Polytechnic", "campus", "SINGAPORE POLYTECHNIC"],
  ["Ngee Ann Polytechnic", "campus", "NGEE ANN POLYTECHNIC"],
  ["Temasek Polytechnic", "campus", "TEMASEK POLYTECHNIC"],
  ["Nanyang Polytechnic", "campus", "NANYANG POLYTECHNIC"],
  ["Republic Polytechnic", "campus", "REPUBLIC POLYTECHNIC"],
  ["ITE College Central", "campus", "ITE COLLEGE CENTRAL"],
  ["ITE College East", "campus", "ITE COLLEGE EAST"],
  ["ITE College West", "campus", "ITE COLLEGE WEST"],
  // Hospitals
  ["Singapore General Hospital", "landmark", "SINGAPORE GENERAL HOSPITAL", "SGH"],
  ["Tan Tock Seng Hospital", "landmark", "TAN TOCK SENG HOSPITAL", "TTSH"],
  ["National University Hospital", "landmark", "NATIONAL UNIVERSITY HOSPITAL", "NUH"],
  ["KK Women's and Children's Hospital", "landmark", "KK WOMEN'S AND CHILDREN'S HOSPITAL", "KKH"],
  ["Changi General Hospital", "landmark", "CHANGI GENERAL HOSPITAL", "CGH"],
  ["Khoo Teck Puat Hospital", "landmark", "KHOO TECK PUAT HOSPITAL", "KTPH"],
  ["Sengkang General Hospital", "landmark", "SENGKANG GENERAL HOSPITAL", "SKH"],
  ["Ng Teng Fong General Hospital", "landmark", "NG TENG FONG GENERAL HOSPITAL", "NTFGH"],
];

/** Lines by station-code prefix. Codes for lines that aren't running yet (and LRT loops) are ignored. */
const LINES = { NS: "North-South", EW: "East-West", CG: "East-West", NE: "North-East", CC: "Circle", CE: "Circle", DT: "Downtown", TE: "Thomson-East Coast" };
/**
 * On OneMap, but no trains stop there. Bukit Brown, Mount Pleasant and Marina South are shells for
 * later. Bedok South, Sungei Bedok and Xilin were due in the second half of 2026 with no date
 * announced when this was last run (October 2026) — take them off this list once they are open.
 */
const NOT_OPEN = new Set(["BUKIT BROWN", "MOUNT PLEASANT", "MARINA SOUTH", "BEDOK SOUTH", "SUNGEI BEDOK", "XILIN"]);
const SPELLING = { "One-North": "one-north", Harbourfront: "HarbourFront", Macpherson: "MacPherson", "Gardens By The Bay": "Gardens by the Bay" };

/** Between requests, to stay under OneMap's rate limit. */
const PAUSE = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s\-/])([a-z])/g, (_, a, b) => a + b.toUpperCase());
const round = (n) => Math.round(Number(n) * 1e4) / 1e4;
const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

async function search(q, page = 1) {
  const url = `${SEARCH}?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=${page}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OneMap answered ${res.status}`);
      return await res.json();
    } catch (err) {
      // OneMap turns callers away (429) for a few minutes after a couple of hundred quick requests.
      if (attempt >= 6) throw err;
      await sleep(30_000);
    }
  }
}

// What is already there, and the area centres to file new places under.
const taxonomy = readFileSync("src/lib/data/taxonomy.ts", "utf8");
const areas = [...taxonomy.matchAll(/\{ id: "([a-z-]+)", name: "[^"]+", region: "[^"]+", lat: ([\d.]+), lng: ([\d.]+) \}/g)].map((m) => ({ id: m[1], lat: +m[2], lng: +m[3] }));
const byHand = new Set([...taxonomy.slice(taxonomy.indexOf("export const locations")).matchAll(/\{ id: "([a-z0-9-]+)", name:/g)].map((m) => m[1]));
if (areas.length < 10 || byHand.size < 10) throw new Error("Couldn't read the areas or hand-written places from taxonomy.ts");

const km = (a, b) => Math.hypot((a.lat - b.lat) * 110.6, (a.lng - b.lng) * 111.3);
const areaOf = (p) => areas.reduce((best, a) => (km(a, p) < km(best, p) ? a : best)).id;

// What an earlier run already fetched. Reusing it keeps adding a place to a single request — OneMap
// stops answering for a while after a couple of hundred.
const known = new Map();
if (!process.argv.includes("--refresh") && existsSync(OUT)) {
  for (const m of readFileSync(OUT, "utf8").matchAll(/^  ({ id: .+ }),$/gm)) {
    const place = JSON.parse(m[1].replace(/([{,] )([a-z]+): /g, '$1"$2": '));
    known.set(place.id, place);
  }
}

const out = [];
const problems = [];

// ── MRT stations: every "… MRT STATION (codes)" OneMap knows, exits and the like left out ──
const stations = new Map();
const keptStations = [...known.values()].filter((p) => p.kind === "mrt" && !NOT_OPEN.has(p.id.replace(/-mrt$/, "").replace(/-/g, " ").toUpperCase()));
out.push(...keptStations);
const first = keptStations.length ? { totalNumPages: 0 } : await search("MRT STATION");
for (let page = 1; page <= first.totalNumPages; page++) {
  const { results } = page === 1 ? first : await search("MRT STATION", page);
  for (const r of results) {
    const m = r.SEARCHVAL.match(/^(.+) MRT STATION \(([A-Z0-9 /]+)\)$/);
    if (!m || NOT_OPEN.has(m[1])) continue;
    const s = stations.get(m[1]) ?? { codes: new Set(), points: [] };
    for (const c of m[2].split("/")) s.codes.add(c.trim());
    s.points.push({ lat: +r.LATITUDE, lng: +r.LONGITUDE });
    stations.set(m[1], s);
  }
  await sleep(PAUSE);
}
for (const [raw, s] of [...stations].sort(([a], [b]) => a.localeCompare(b))) {
  const lines = [...new Set([...s.codes].map((c) => LINES[c.replace(/\d+[A-Z]?$/, "")]).filter(Boolean))];
  if (!lines.length) continue; // only on a line that isn't open
  const title = titleCase(raw);
  const name = `${SPELLING[title] ?? title} MRT`;
  const at = { lat: s.points.reduce((n, p) => n + p.lat, 0) / s.points.length, lng: s.points.reduce((n, p) => n + p.lng, 0) / s.points.length };
  const detail = lines.length === 1 ? `${lines[0]} Line` : lines.length === 2 ? `${lines[0]} & ${lines[1]} Lines` : `${lines.length} lines`;
  out.push({ id: `${slug(raw)}-mrt`, name, area: areaOf(at), kind: "mrt", lat: round(at.lat), lng: round(at.lng), detail });
}
console.log(`${out.length} MRT stations`);

// ── Named places: the first OneMap result whose name matches ──
for (const [name, kind, q, detail] of PLACES) {
  const had = known.get(slug(name));
  if (had) {
    out.push({ ...had, name, kind, detail: detail ?? had.detail });
    continue;
  }
  const { results = [] } = await search(q);
  const hit = results.find((r) => norm(r.SEARCHVAL) === norm(q)) ?? results.find((r) => norm(r.SEARCHVAL).startsWith(norm(q)));
  if (!hit) {
    problems.push(`${name}: no match for "${q}" — OneMap offered ${results.slice(0, 3).map((r) => r.SEARCHVAL).join(" | ") || "nothing"}`);
  } else {
    const at = { lat: +hit.LATITUDE, lng: +hit.LONGITUDE };
    const road = hit.ROAD_NAME && hit.ROAD_NAME !== "NIL" ? titleCase(hit.ROAD_NAME) : undefined;
    out.push({ id: slug(name), name, area: areaOf(at), kind, lat: round(at.lat), lng: round(at.lng), detail: detail ?? road, matched: hit.SEARCHVAL });
  }
  await sleep(PAUSE);
}

const fresh = out.filter((p) => !byHand.has(p.id));
const dupes = fresh.map((p) => p.id).filter((id, i, all) => all.indexOf(id) !== i);
if (dupes.length) throw new Error(`Two places share an id: ${dupes.join(", ")}`);

const line = (p) => `  { id: ${JSON.stringify(p.id)}, name: ${JSON.stringify(p.name)}, area: ${JSON.stringify(p.area)}, kind: ${JSON.stringify(p.kind)}, lat: ${p.lat}, lng: ${p.lng}${p.detail ? `, detail: ${JSON.stringify(p.detail)}` : ""} },`;
writeFileSync(
  OUT,
  `import type { Location } from "../types";

/**
 * Every MRT station, and the larger malls, parks, campuses, hospitals and landmarks, beyond the
 * handful written by hand in taxonomy.ts. Coordinates are OneMap's (onemap.gov.sg); each place is
 * filed under the nearest of our areas.
 *
 * Written by \`node scripts/fetch-places.mjs\` — add places there and run it again, rather than editing this.
 */
export const places: Location[] = [
${fresh.map(line).join("\n")}
];
`,
);

console.log(`${fresh.length} places written to ${OUT} (${out.length - fresh.length} already in taxonomy.ts)`);
for (const p of out.filter((p) => p.matched)) console.log(`  ${p.name}  ←  ${p.matched}  [${p.area}]`);
if (problems.length) console.log(`\nLeft out (${problems.length}):\n  ${problems.join("\n  ")}`);
