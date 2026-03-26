type CountryGeocode = {
  latitude: number;
  longitude: number;
};

const knownCountryCoordinates: Record<string, CountryGeocode> = {
  US: { latitude: 40.7128, longitude: -74.006 },
  CA: { latitude: 43.6532, longitude: -79.3832 },
  IN: { latitude: 28.6139, longitude: 77.209 },
  BR: { latitude: -23.5505, longitude: -46.6333 },
  JP: { latitude: 35.6895, longitude: 139.6917 },
  GB: { latitude: 51.5072, longitude: -0.1276 },
  PK: { latitude: 31.5204, longitude: 74.3587 },
  FR: { latitude: 48.8566, longitude: 2.3522 },
  NG: { latitude: 6.5244, longitude: 3.3792 },
  DE: { latitude: 52.52, longitude: 13.405 },
  MX: { latitude: 19.4326, longitude: -99.1332 },
  EG: { latitude: 30.0444, longitude: 31.2357 },
  ES: { latitude: 40.4168, longitude: -3.7038 },
  ZA: { latitude: -33.9249, longitude: 18.4241 },
  PT: { latitude: 38.7223, longitude: -9.1393 },
  TR: { latitude: 39.9334, longitude: 32.8597 },
  BD: { latitude: 23.8103, longitude: 90.4125 },
  AU: { latitude: -33.8688, longitude: 151.2093 },
  PL: { latitude: 52.2297, longitude: 21.0122 },
  KR: { latitude: 37.5665, longitude: 126.978 },
  NZ: { latitude: -36.8485, longitude: 174.7633 },
  AR: { latitude: -34.6037, longitude: -58.3816 },
  RO: { latitude: 44.4268, longitude: 26.1025 },
  RS: { latitude: 44.7866, longitude: 20.4489 },
  GH: { latitude: 5.6037, longitude: -0.187 },
  IE: { latitude: 53.3498, longitude: -6.2603 },
  NL: { latitude: 52.3676, longitude: 4.9041 },
  SA: { latitude: 24.7136, longitude: 46.6753 },
  CL: { latitude: -33.4489, longitude: -70.6693 },
  SE: { latitude: 59.3293, longitude: 18.0686 },
  IT: { latitude: 41.9028, longitude: 12.4964 },
  KE: { latitude: -1.2921, longitude: 36.8219 },
  SG: { latitude: 1.3521, longitude: 103.8198 },
  AE: { latitude: 25.2048, longitude: 55.2708 },
  CO: { latitude: 4.711, longitude: -74.0721 },
};

export async function geocodeCountry(
  country: string,
  countryCode: string,
): Promise<CountryGeocode | null> {
  if (knownCountryCoordinates[countryCode]) {
    return knownCountryCoordinates[countryCode];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const query = encodeURIComponent(country);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent":
            process.env.GEOCODER_USER_AGENT ?? "world-map-of-developers/1.0 (local dev)",
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = payload[0];
    if (!first) {
      return null;
    }

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
