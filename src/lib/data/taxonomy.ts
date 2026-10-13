import type { Area, AreaId, Category, CategoryId, Location, PaymentMethod } from "../types";
import { places } from "./places";

export const categories: Category[] = [
  { id: "electronics", label: "Electronics", icon: "smartphone", tint: ["#dfe8ff", "#c3d3ff"] },
  { id: "wallets", label: "Wallets & cards", icon: "wallet", tint: ["#ffe9d6", "#ffd3b0"] },
  { id: "keys", label: "Keys", icon: "key", tint: ["#fff1c2", "#fde68a"] },
  { id: "bags", label: "Bags", icon: "backpack", tint: ["#e3f6ec", "#bdeccf"] },
  { id: "accessories", label: "Accessories", icon: "watch", tint: ["#f1e6ff", "#dac8ff"] },
  { id: "clothing", label: "Clothing", icon: "shirt", tint: ["#fde4ee", "#fbc7dc"] },
  { id: "documents", label: "Documents", icon: "file", tint: ["#e8edf5", "#d3dbea"] },
  { id: "pets", label: "Pets", icon: "paw", tint: ["#ffe3e8", "#ffc9d3"] },
  { id: "other", label: "Other", icon: "package", tint: ["#e9edf6", "#d6dcec"] },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>;

/** The only ways a reward changes hands — always directly between two members. */
export const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "paynow", label: "PayNow" },
  { id: "paylah", label: "PayLah!" },
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank transfer" },
];

export const paymentLabel = (id: PaymentMethod) => paymentMethods.find((m) => m.id === id)?.label ?? id;

/** "PayNow, PayLah!, cash or bank transfer" — for sentences. */
export const PAYMENT_OPTIONS = "PayNow, PayLah!, cash or bank transfer";

export const areas: Area[] = [
  { id: "orchard", name: "Orchard", region: "Central", lat: 1.3048, lng: 103.832 },
  { id: "city", name: "City", region: "Central", lat: 1.2896, lng: 103.8518 },
  { id: "bukit-merah", name: "Bukit Merah", region: "Central", lat: 1.2819, lng: 103.8239 },
  { id: "queenstown", name: "Queenstown", region: "Central", lat: 1.2942, lng: 103.7861 },
  { id: "toa-payoh", name: "Toa Payoh", region: "Central", lat: 1.3343, lng: 103.8563 },
  { id: "bukit-timah", name: "Bukit Timah", region: "Central", lat: 1.3294, lng: 103.8021 },
  { id: "marine-parade", name: "Marine Parade", region: "East", lat: 1.3021, lng: 103.9055 },
  { id: "bedok", name: "Bedok", region: "East", lat: 1.3236, lng: 103.9273 },
  { id: "tampines", name: "Tampines", region: "East", lat: 1.3496, lng: 103.9568 },
  { id: "changi", name: "Changi", region: "East", lat: 1.3644, lng: 103.9915 },
  { id: "hougang", name: "Hougang", region: "North-East", lat: 1.3612, lng: 103.8863 },
  { id: "sengkang", name: "Sengkang", region: "North-East", lat: 1.3868, lng: 103.8914 },
  { id: "punggol", name: "Punggol", region: "North-East", lat: 1.4043, lng: 103.9021 },
  { id: "ang-mo-kio", name: "Ang Mo Kio", region: "North-East", lat: 1.3691, lng: 103.8454 },
  { id: "yishun", name: "Yishun", region: "North", lat: 1.4304, lng: 103.8354 },
  { id: "woodlands", name: "Woodlands", region: "North", lat: 1.4382, lng: 103.789 },
  { id: "jurong", name: "Jurong", region: "West", lat: 1.3329, lng: 103.7436 },
];

export const areaById = Object.fromEntries(areas.map((a) => [a.id, a])) as Record<AreaId, Area>;

export const locations: Location[] = [
  { id: "orchard-mrt", name: "Orchard MRT", area: "orchard", kind: "mrt", lat: 1.304, lng: 103.8319, detail: "North-South Line" },
  { id: "somerset-mrt", name: "Somerset MRT", area: "orchard", kind: "mrt", lat: 1.3004, lng: 103.839, detail: "North-South Line" },
  { id: "ion-orchard", name: "ION Orchard", area: "orchard", kind: "mall", lat: 1.3041, lng: 103.8318, detail: "Orchard Road" },
  { id: "bugis-mrt", name: "Bugis MRT", area: "city", kind: "mrt", lat: 1.3009, lng: 103.856, detail: "East-West & Downtown Lines" },
  { id: "dhoby-ghaut-mrt", name: "Dhoby Ghaut MRT", area: "city", kind: "mrt", lat: 1.2993, lng: 103.8455, detail: "3 lines" },
  { id: "city-hall-mrt", name: "City Hall MRT", area: "city", kind: "mrt", lat: 1.2931, lng: 103.852, detail: "North-South & East-West Lines" },
  { id: "raffles-place-mrt", name: "Raffles Place MRT", area: "city", kind: "mrt", lat: 1.284, lng: 103.8514, detail: "North-South & East-West Lines" },
  { id: "marina-bay", name: "Marina Bay", area: "city", kind: "landmark", lat: 1.2834, lng: 103.8607, detail: "Marina Bay Sands & Gardens" },
  { id: "tiong-bahru-mrt", name: "Tiong Bahru MRT", area: "bukit-merah", kind: "mrt", lat: 1.2862, lng: 103.8271, detail: "East-West Line" },
  { id: "vivocity", name: "VivoCity", area: "bukit-merah", kind: "mall", lat: 1.2644, lng: 103.8222, detail: "HarbourFront" },
  { id: "nus", name: "NUS", area: "queenstown", kind: "campus", lat: 1.2966, lng: 103.7764, detail: "Kent Ridge Campus" },
  { id: "toa-payoh-hub", name: "Toa Payoh Hub", area: "toa-payoh", kind: "mall", lat: 1.3326, lng: 103.8474, detail: "Toa Payoh Central" },
  { id: "bishan-mrt", name: "Bishan MRT", area: "toa-payoh", kind: "mrt", lat: 1.3513, lng: 103.8485, detail: "North-South & Circle Lines" },
  { id: "botanic-gardens", name: "Botanic Gardens", area: "bukit-timah", kind: "park", lat: 1.3138, lng: 103.8159, detail: "Tanglin Gate" },
  { id: "east-coast-park", name: "East Coast Park", area: "marine-parade", kind: "park", lat: 1.3004, lng: 103.9122, detail: "Area D" },
  { id: "bedok-mrt", name: "Bedok MRT", area: "bedok", kind: "mrt", lat: 1.324, lng: 103.93, detail: "East-West Line" },
  { id: "bedok-reservoir", name: "Bedok Reservoir", area: "bedok", kind: "park", lat: 1.3366, lng: 103.9248, detail: "Reservoir Park" },
  { id: "tampines-mrt", name: "Tampines MRT", area: "tampines", kind: "mrt", lat: 1.3545, lng: 103.9453, detail: "East-West & Downtown Lines" },
  { id: "tampines-mall", name: "Tampines Mall", area: "tampines", kind: "mall", lat: 1.3525, lng: 103.9447, detail: "Tampines Central" },
  { id: "changi-airport", name: "Changi Airport", area: "changi", kind: "airport", lat: 1.3554, lng: 103.9864, detail: "Terminal 3" },
  { id: "jewel-changi", name: "Jewel Changi Airport", area: "changi", kind: "mall", lat: 1.3603, lng: 103.9893, detail: "Canopy Park" },
  { id: "hougang-mall", name: "Hougang Mall", area: "hougang", kind: "mall", lat: 1.3724, lng: 103.8932, detail: "Hougang Central" },
  { id: "sengkang-mrt", name: "Sengkang MRT", area: "sengkang", kind: "mrt", lat: 1.3917, lng: 103.8954, detail: "North-East Line" },
  { id: "punggol-mrt", name: "Punggol MRT", area: "punggol", kind: "mrt", lat: 1.4052, lng: 103.9024, detail: "North-East Line" },
  { id: "punggol-waterway-park", name: "Punggol Waterway Park", area: "punggol", kind: "park", lat: 1.409, lng: 103.9065, detail: "Waterway Point side" },
  { id: "ang-mo-kio-mrt", name: "Ang Mo Kio MRT", area: "ang-mo-kio", kind: "mrt", lat: 1.37, lng: 103.8495, detail: "North-South Line" },
  { id: "amk-hub", name: "AMK Hub", area: "ang-mo-kio", kind: "mall", lat: 1.3699, lng: 103.8478, detail: "Ang Mo Kio Ave 8" },
  { id: "yishun-mrt", name: "Yishun MRT", area: "yishun", kind: "mrt", lat: 1.4294, lng: 103.835, detail: "North-South Line" },
  { id: "northpoint-city", name: "Northpoint City", area: "yishun", kind: "mall", lat: 1.4296, lng: 103.8358, detail: "Yishun Central" },
  { id: "woodlands-mrt", name: "Woodlands MRT", area: "woodlands", kind: "mrt", lat: 1.437, lng: 103.7865, detail: "North-South & Thomson-East Coast Lines" },
  { id: "woodlands-checkpoint", name: "Woodlands Checkpoint", area: "woodlands", kind: "landmark", lat: 1.445, lng: 103.769, detail: "Causeway" },
  { id: "jurong-east-mrt", name: "Jurong East MRT", area: "jurong", kind: "mrt", lat: 1.3331, lng: 103.7422, detail: "North-South & East-West Lines" },
  { id: "jem", name: "JEM", area: "jurong", kind: "mall", lat: 1.3331, lng: 103.7435, detail: "Jurong Gateway" },
  { id: "ntu", name: "NTU", area: "jurong", kind: "campus", lat: 1.3483, lng: 103.6831, detail: "Nanyang Avenue" },
  // Every other MRT and LRT station and the larger malls, parks, campuses, hospitals and landmarks (see places.ts).
  ...places,
];

export const locationById = Object.fromEntries(locations.map((l) => [l.id, l])) as Record<string, Location>;

export function getLocation(id: string): Location {
  return locationById[id] ?? locations[0];
}

/** A well-known place to stand in for an area — its first listed location. */
export function areaLocation(id: AreaId): Location {
  return locations.find((l) => l.area === id) ?? locations[0];
}

export function getCategory(id: CategoryId): Category {
  return categoryById[id] ?? categoryById.other;
}
