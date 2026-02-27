import { db } from "./index.js";
import { users, apiKeys, apis, endpoints } from "./schema.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const [user] = await db
    .insert(users)
    .values({
      email: "admin@apinow.dev",
      name: "Admin",
      passwordHash,
    })
    .returning();

  // Create API key
  const rawKey = `apn_${nanoid(32)}`;
  const keyHash = await bcrypt.hash(rawKey, 10);
  await db.insert(apiKeys).values({
    userId: user.id,
    keyHash,
    keyPrefix: rawKey.slice(0, 12),
    name: "Default Key",
  });

  console.log(`\nAPI Key: ${rawKey}\nSave this — it won't be shown again.\n`);

  // Seed APIs
  const weatherApi = await db
    .insert(apis)
    .values({
      slug: "weather",
      name: "Weather API",
      description:
        "Get current weather and forecasts for any location worldwide. Returns temperature, humidity, wind speed, and conditions.",
      category: "data",
      baseUrl: "https://api.openweathermap.org/data/2.5",
      authType: "api_key",
      authConfig: { type: "query_param", param_name: "appid", key: "" },
      tags: ["weather", "forecast", "temperature", "climate"],
    })
    .returning();

  await db.insert(endpoints).values([
    {
      apiId: weatherApi[0].id,
      method: "GET",
      path: "/weather",
      summary: "Get current weather",
      description:
        "Returns current weather data for a given city name or coordinates",
      parameters: [
        { name: "q", in: "query", description: "City name", required: false, type: "string" },
        { name: "lat", in: "query", description: "Latitude", required: false, type: "number" },
        { name: "lon", in: "query", description: "Longitude", required: false, type: "number" },
        { name: "units", in: "query", description: "Units (standard, metric, imperial)", required: false, type: "string", default: "metric" },
      ],
    },
    {
      apiId: weatherApi[0].id,
      method: "GET",
      path: "/forecast",
      summary: "Get 5-day weather forecast",
      description: "Returns 5-day/3-hour forecast for a location",
      parameters: [
        { name: "q", in: "query", description: "City name", required: false, type: "string" },
        { name: "lat", in: "query", description: "Latitude", required: false, type: "number" },
        { name: "lon", in: "query", description: "Longitude", required: false, type: "number" },
        { name: "units", in: "query", description: "Units (standard, metric, imperial)", required: false, type: "string", default: "metric" },
      ],
    },
  ]);

  const exchangeApi = await db
    .insert(apis)
    .values({
      slug: "exchange-rates",
      name: "Exchange Rates API",
      description:
        "Real-time and historical currency exchange rates. Convert between 170+ world currencies.",
      category: "finance",
      baseUrl: "https://api.exchangerate.host",
      authType: "none",
      authConfig: null,
      tags: ["currency", "exchange", "finance", "conversion", "forex"],
    })
    .returning();

  await db.insert(endpoints).values([
    {
      apiId: exchangeApi[0].id,
      method: "GET",
      path: "/latest",
      summary: "Get latest exchange rates",
      description:
        "Returns latest exchange rates relative to a base currency",
      parameters: [
        { name: "base", in: "query", description: "Base currency code (e.g., USD)", required: false, type: "string", default: "USD" },
        { name: "symbols", in: "query", description: "Comma-separated target currencies", required: false, type: "string" },
      ],
    },
    {
      apiId: exchangeApi[0].id,
      method: "GET",
      path: "/convert",
      summary: "Convert between currencies",
      description: "Convert an amount from one currency to another",
      parameters: [
        { name: "from", in: "query", description: "Source currency", required: true, type: "string" },
        { name: "to", in: "query", description: "Target currency", required: true, type: "string" },
        { name: "amount", in: "query", description: "Amount to convert", required: true, type: "number" },
      ],
    },
  ]);

  const geocodingApi = await db
    .insert(apis)
    .values({
      slug: "geocoding",
      name: "Geocoding API",
      description:
        "Convert addresses to coordinates and coordinates to addresses. Worldwide coverage with high accuracy.",
      category: "geo",
      baseUrl: "https://nominatim.openstreetmap.org",
      authType: "none",
      authConfig: null,
      tags: ["geocoding", "address", "coordinates", "location", "maps"],
    })
    .returning();

  await db.insert(endpoints).values([
    {
      apiId: geocodingApi[0].id,
      method: "GET",
      path: "/search",
      summary: "Geocode an address",
      description: "Convert an address or place name to coordinates",
      parameters: [
        { name: "q", in: "query", description: "Search query (address or place name)", required: true, type: "string" },
        { name: "format", in: "query", description: "Response format", required: false, type: "string", default: "json" },
        { name: "limit", in: "query", description: "Max results", required: false, type: "number", default: "5" },
      ],
    },
    {
      apiId: geocodingApi[0].id,
      method: "GET",
      path: "/reverse",
      summary: "Reverse geocode coordinates",
      description: "Convert coordinates to an address",
      parameters: [
        { name: "lat", in: "query", description: "Latitude", required: true, type: "number" },
        { name: "lon", in: "query", description: "Longitude", required: true, type: "number" },
        { name: "format", in: "query", description: "Response format", required: false, type: "string", default: "json" },
      ],
    },
  ]);

  const searchApi = await db
    .insert(apis)
    .values({
      slug: "web-search",
      name: "Web Search API",
      description:
        "Search the web programmatically. Returns relevant results with titles, URLs, and descriptions.",
      category: "search",
      baseUrl: "https://api.search.brave.com/res/v1",
      authType: "bearer",
      authConfig: { header: "X-Subscription-Token", key: "" },
      tags: ["search", "web", "google", "bing", "results"],
    })
    .returning();

  await db.insert(endpoints).values({
    apiId: searchApi[0].id,
    method: "GET",
    path: "/web/search",
    summary: "Search the web",
    description: "Perform a web search and get results",
    parameters: [
      { name: "q", in: "query", description: "Search query", required: true, type: "string" },
      { name: "count", in: "query", description: "Number of results", required: false, type: "number", default: "10" },
    ],
  });

  const urlReaderApi = await db
    .insert(apis)
    .values({
      slug: "url-reader",
      name: "URL Reader API",
      description:
        "Extract clean, readable content from any URL. Returns markdown-formatted text, perfect for LLM consumption.",
      category: "utility",
      baseUrl: "https://r.jina.ai",
      authType: "none",
      authConfig: null,
      tags: ["url", "scraper", "reader", "content", "markdown", "extract"],
    })
    .returning();

  await db.insert(endpoints).values({
    apiId: urlReaderApi[0].id,
    method: "GET",
    path: "/",
    summary: "Read URL content",
    description:
      "Fetches and extracts clean, readable content from a URL. Prefix the target URL to the base path.",
    parameters: [
      { name: "url", in: "path", description: "The URL to read (appended to base path)", required: true, type: "string" },
    ],
  });

  console.log("Seeded 5 APIs with endpoints.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
