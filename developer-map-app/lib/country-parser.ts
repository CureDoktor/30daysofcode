type ParsedCountry = {
  country: string;
  countryCode: string;
};

const aliasMap: Record<string, ParsedCountry> = {
  usa: { country: "United States", countryCode: "US" },
  us: { country: "United States", countryCode: "US" },
  "united states": { country: "United States", countryCode: "US" },
  uk: { country: "United Kingdom", countryCode: "GB" },
  "united kingdom": { country: "United Kingdom", countryCode: "GB" },
  england: { country: "United Kingdom", countryCode: "GB" },
  scotland: { country: "United Kingdom", countryCode: "GB" },
  india: { country: "India", countryCode: "IN" },
  pakistan: { country: "Pakistan", countryCode: "PK" },
  bangladesh: { country: "Bangladesh", countryCode: "BD" },
  brazil: { country: "Brazil", countryCode: "BR" },
  argentina: { country: "Argentina", countryCode: "AR" },
  chile: { country: "Chile", countryCode: "CL" },
  colombia: { country: "Colombia", countryCode: "CO" },
  mexico: { country: "Mexico", countryCode: "MX" },
  canada: { country: "Canada", countryCode: "CA" },
  france: { country: "France", countryCode: "FR" },
  germany: { country: "Germany", countryCode: "DE" },
  spain: { country: "Spain", countryCode: "ES" },
  portugal: { country: "Portugal", countryCode: "PT" },
  italy: { country: "Italy", countryCode: "IT" },
  netherlands: { country: "Netherlands", countryCode: "NL" },
  poland: { country: "Poland", countryCode: "PL" },
  romania: { country: "Romania", countryCode: "RO" },
  serbia: { country: "Serbia", countryCode: "RS" },
  sweden: { country: "Sweden", countryCode: "SE" },
  ireland: { country: "Ireland", countryCode: "IE" },
  turkey: { country: "Turkey", countryCode: "TR" },
  egypt: { country: "Egypt", countryCode: "EG" },
  nigeria: { country: "Nigeria", countryCode: "NG" },
  ghana: { country: "Ghana", countryCode: "GH" },
  kenya: { country: "Kenya", countryCode: "KE" },
  "south africa": { country: "South Africa", countryCode: "ZA" },
  japan: { country: "Japan", countryCode: "JP" },
  korea: { country: "South Korea", countryCode: "KR" },
  "south korea": { country: "South Korea", countryCode: "KR" },
  australia: { country: "Australia", countryCode: "AU" },
  "new zealand": { country: "New Zealand", countryCode: "NZ" },
  singapore: { country: "Singapore", countryCode: "SG" },
  uae: { country: "UAE", countryCode: "AE" },
  "saudi arabia": { country: "Saudi Arabia", countryCode: "SA" },
};

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function parseCountryFromText(rawText: string): ParsedCountry | null {
  const text = sanitize(rawText);

  if (!text) {
    return null;
  }

  if (aliasMap[text]) {
    return aliasMap[text];
  }

  for (const [alias, parsed] of Object.entries(aliasMap)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i");
    if (pattern.test(text)) {
      return parsed;
    }
  }

  return null;
}
