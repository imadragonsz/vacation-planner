/**
 * Global geocoding queue to ensure we prioritize Photon and use Nominatim
 * as a rate-limited backup.
 */

interface GeocodeRequest {
  url: string; // Original Nominatim-style URL for backward compatibility
  resolve: (data: any) => void;
  reject: (error: any) => void;
  retries: number;
}

const queue: GeocodeRequest[] = [];
let isProcessing = false;
let lastNominatimRequestTime = 0;
const NOMINATIM_DELAY = 1500; // Nominatim strict 1 req/sec + buffer

// Basic LocalStorage cache to prevent repeated lookups for the same query
const CACHE_KEY = "vp_geocoding_cache";
const cache: Record<string, any> = JSON.parse(
  localStorage.getItem(CACHE_KEY) || "{}"
);

function saveCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Normalizes a Nominatim-style URL into Photon parameters
 */
function getPhotonUrl(nominatimUrl: string): string | null {
  try {
    const urlObj = new URL(nominatimUrl);
    if (nominatimUrl.includes("/search")) {
      const q = urlObj.searchParams.get("q");
      return q
        ? `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`
        : null;
    }
    if (nominatimUrl.includes("/reverse")) {
      const lat = urlObj.searchParams.get("lat");
      const lon = urlObj.searchParams.get("lon");
      return lat && lon
        ? `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`
        : null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Normalizes Photon response to Nominatim structure
 */
function normalizePhotonResponse(data: any, originalUrl: string): any {
  if (originalUrl.includes("/search")) {
    return (data.features || []).map((f: any) => ({
      lat: f.geometry.coordinates[1].toString(),
      lon: f.geometry.coordinates[0].toString(),
      display_name: [
        f.properties.name,
        f.properties.city,
        f.properties.street,
        f.properties.country,
      ]
        .filter(Boolean)
        .join(", "),
      type: f.properties.type,
      importance: 0.5,
    }));
  }
  if (originalUrl.includes("/reverse") && data.features?.[0]) {
    const f = data.features[0];
    return {
      display_name: [
        f.properties.name,
        f.properties.city,
        f.properties.street,
        f.properties.country,
      ]
        .filter(Boolean)
        .join(", "),
      address: f.properties,
    };
  }
  return originalUrl.includes("/search") ? [] : null;
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const request = queue.shift();
    if (!request) continue;

    // 1. Check Cache
    if (cache[request.url]) {
      request.resolve(cache[request.url]);
      continue;
    }

    try {
      // 2. Try Photon First (Primary - No strict delay required)
      const photonUrl = getPhotonUrl(request.url);
      if (photonUrl) {
        try {
          console.info(`[Geocoder] Trying Photon: ${photonUrl}`);
          const res = await fetchWithTimeout(photonUrl, 8000);
          if (res.ok) {
            const data = await res.json();
            const normalized = normalizePhotonResponse(data, request.url);

            // If search returned results, use them. If empty, maybe Nominatim knows more?
            if (
              normalized &&
              (!Array.isArray(normalized) || normalized.length > 0)
            ) {
              cache[request.url] = normalized;
              saveCache();
              request.resolve(normalized);
              continue; // Move to next item in queue
            }
          }
        } catch (err) {
          console.warn(
            "[Geocoder] Photon failed, falling back to Nominatim",
            err
          );
        }
      }

      // 3. Try Nominatim (Backup - Strict 1 req/sec)
      const now = Date.now();
      const timeSinceLast = now - lastNominatimRequestTime;
      if (timeSinceLast < NOMINATIM_DELAY) {
        await new Promise((r) =>
          setTimeout(r, NOMINATIM_DELAY - timeSinceLast)
        );
      }

      console.info(`[Geocoder] Trying Nominatim (Backup): ${request.url}`);
      lastNominatimRequestTime = Date.now();
      const res = await fetchWithTimeout(request.url, 12000);

      if (res.status === 503 || res.status === 429) {
        if (request.retries < 3) {
          queue.push({ ...request, retries: request.retries + 1 });
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          request.reject(new Error("Service unavailable after retries"));
        }
      } else {
        const data = await res.json();
        cache[request.url] = data;
        saveCache();
        request.resolve(data);
      }
    } catch (err: any) {
      if (request.retries < 2) {
        queue.push({ ...request, retries: request.retries + 1 });
      } else {
        request.reject(err);
      }
    }
  }

  isProcessing = false;
}

export function addToGeocodeQueue(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    queue.push({ url, resolve, reject, retries: 0 });
    processQueue();
  });
}
