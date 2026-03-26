import { DeveloperPin } from "./types";

const now = Date.now();

const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

export const seedDevelopers: DeveloperPin[] = [
  { id: "d1", username: "@buildwithana", country: "United States", countryCode: "US", coordinates: [-74.006, 40.7128], joinedAt: minutesAgo(96) },
  { id: "d2", username: "@codewithleo", country: "Canada", countryCode: "CA", coordinates: [-79.3832, 43.6532], joinedAt: minutesAgo(93) },
  { id: "d3", username: "@dev_meera", country: "India", countryCode: "IN", coordinates: [77.209, 28.6139], joinedAt: minutesAgo(90) },
  { id: "d4", username: "@mariofrontend", country: "Brazil", countryCode: "BR", coordinates: [-46.6333, -23.5505], joinedAt: minutesAgo(87) },
  { id: "d5", username: "@suki_codes", country: "Japan", countryCode: "JP", coordinates: [139.6917, 35.6895], joinedAt: minutesAgo(83) },
  { id: "d6", username: "@saraops", country: "United Kingdom", countryCode: "GB", coordinates: [-0.1276, 51.5072], joinedAt: minutesAgo(79) },
  { id: "d7", username: "@ali_builds", country: "Pakistan", countryCode: "PK", coordinates: [74.3587, 31.5204], joinedAt: minutesAgo(76) },
  { id: "d8", username: "@julesdev", country: "France", countryCode: "FR", coordinates: [2.3522, 48.8566], joinedAt: minutesAgo(72) },
  { id: "d9", username: "@tomi_backend", country: "Nigeria", countryCode: "NG", coordinates: [3.3792, 6.5244], joinedAt: minutesAgo(69) },
  { id: "d10", username: "@nora_ui", country: "Germany", countryCode: "DE", coordinates: [13.405, 52.52], joinedAt: minutesAgo(64) },
  { id: "d11", username: "@cloudpedro", country: "Mexico", countryCode: "MX", coordinates: [-99.1332, 19.4326], joinedAt: minutesAgo(61) },
  { id: "d12", username: "@rami_tech", country: "Egypt", countryCode: "EG", coordinates: [31.2357, 30.0444], joinedAt: minutesAgo(57) },
  { id: "d13", username: "@kode_ella", country: "Spain", countryCode: "ES", coordinates: [-3.7038, 40.4168], joinedAt: minutesAgo(53) },
  { id: "d14", username: "@danielgo", country: "South Africa", countryCode: "ZA", coordinates: [18.4241, -33.9249], joinedAt: minutesAgo(49) },
  { id: "d15", username: "@fernandojs", country: "Portugal", countryCode: "PT", coordinates: [-9.1393, 38.7223], joinedAt: minutesAgo(45) },
  { id: "d16", username: "@mina_bytes", country: "Turkey", countryCode: "TR", coordinates: [32.8597, 39.9334], joinedAt: minutesAgo(41) },
  { id: "d17", username: "@samia_dev", country: "Bangladesh", countryCode: "BD", coordinates: [90.4125, 23.8103], joinedAt: minutesAgo(38) },
  { id: "d18", username: "@chrisx", country: "Australia", countryCode: "AU", coordinates: [151.2093, -33.8688], joinedAt: minutesAgo(34) },
  { id: "d19", username: "@lukeai", country: "Poland", countryCode: "PL", coordinates: [21.0122, 52.2297], joinedAt: minutesAgo(29) },
  { id: "d20", username: "@yukiops", country: "South Korea", countryCode: "KR", coordinates: [126.978, 37.5665], joinedAt: minutesAgo(24) },
  { id: "d21", username: "@kiwi_stack", country: "New Zealand", countryCode: "NZ", coordinates: [174.7633, -36.8485], joinedAt: minutesAgo(19) },
  { id: "d22", username: "@valerita", country: "Argentina", countryCode: "AR", coordinates: [-58.3816, -34.6037], joinedAt: minutesAgo(15) },
  { id: "d23", username: "@romcodes", country: "Romania", countryCode: "RO", coordinates: [26.1025, 44.4268], joinedAt: minutesAgo(12) },
  { id: "d24", username: "@kofi_builds", country: "Ghana", countryCode: "GH", coordinates: [-0.187, 5.6037], joinedAt: minutesAgo(9) },
];

export const incomingDevelopers: DeveloperPin[] = [
  { id: "q1", username: "@isla_ui", country: "Ireland", countryCode: "IE", coordinates: [-6.2603, 53.3498], joinedAt: minutesAgo(7) },
  { id: "q2", username: "@hugoapps", country: "Netherlands", countryCode: "NL", coordinates: [4.9041, 52.3676], joinedAt: minutesAgo(7) },
  { id: "q3", username: "@cairo_code", country: "Saudi Arabia", countryCode: "SA", coordinates: [46.6753, 24.7136], joinedAt: minutesAgo(7) },
  { id: "q4", username: "@devluna", country: "Chile", countryCode: "CL", coordinates: [-70.6693, -33.4489], joinedAt: minutesAgo(7) },
  { id: "q5", username: "@luxcoder", country: "Sweden", countryCode: "SE", coordinates: [18.0686, 59.3293], joinedAt: minutesAgo(7) },
  { id: "q6", username: "@bruno_stack", country: "Italy", countryCode: "IT", coordinates: [12.4964, 41.9028], joinedAt: minutesAgo(7) },
  { id: "q7", username: "@rahulships", country: "India", countryCode: "IN", coordinates: [72.8777, 19.076], joinedAt: minutesAgo(7) },
  { id: "q8", username: "@devnina", country: "United States", countryCode: "US", coordinates: [-118.2437, 34.0522], joinedAt: minutesAgo(7) },
  { id: "q9", username: "@mr_backend", country: "Kenya", countryCode: "KE", coordinates: [36.8219, -1.2921], joinedAt: minutesAgo(7) },
  { id: "q10", username: "@buildwithtom", country: "Singapore", countryCode: "SG", coordinates: [103.8198, 1.3521], joinedAt: minutesAgo(7) },
  { id: "q11", username: "@rehan_ux", country: "UAE", countryCode: "AE", coordinates: [55.2708, 25.2048], joinedAt: minutesAgo(7) },
  { id: "q12", username: "@janedev", country: "Colombia", countryCode: "CO", coordinates: [-74.0721, 4.711], joinedAt: minutesAgo(7) },
];

export const baseJoinedCount = 1284;
