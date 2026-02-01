import React from "react";
import { addToGeocodeQueue, getCachedGeocode } from "./utils/geocoder";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { agendaIcon, locationIcon, hotelIcon } from "./markerIcons";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@mui/material";

// Helper to fix Leaflet map resize and programmatic panning
function MapController({
  center,
  bounds,
}: {
  center: [number, number];
  bounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;

    // Force recalculate size (important for tab switching)
    const timer = setTimeout(() => {
      try {
        // Leaflet-specific check to ensure map is still valid and has a container
        if ((map as any)._container) {
          map.invalidateSize();
        }
      } catch (e) {
        // Map might have been unmounted
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [map]);

  React.useEffect(() => {
    if (!map) return;

    try {
      if (!(map as any)._container) return;

      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } else {
        // Only set view if center has actually changed to avoid infinite cycles
        const currentCenter = map.getCenter();
        if (
          Math.abs(currentCenter.lat - center[0]) > 0.0001 ||
          Math.abs(currentCenter.lng - center[1]) > 0.0001
        ) {
          map.setView(center, map.getZoom());
        }
      }
    } catch (e) {
      // Ignore errors during view updates if map is being destroyed
    }
  }, [map, center, bounds]);

  return null;
}

export type Location = {
  id: number;
  name: string;
  address: string | null;
  lat?: number;
  lng?: number;
  hotel_url?: string | null;
};

export type Agenda = {
  id: number;
  location_id: number;
  agenda_date: string;
  description: string;
  address?: string;
  Time?: string;
};

type LocationPopupProps = {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  hotelUrl?: string | null;
};

const LocationPopup: React.FC<LocationPopupProps> = ({
  name,
  address,
  lat,
  lng,
  hotelUrl,
}) => {
  const [englishAddress, setEnglishAddress] = React.useState<string | null>(
    () => {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`;
      const cached = getCachedGeocode(url);
      return cached?.display_name || null;
    },
  );

  const displayAddress = React.useMemo(() => {
    if (!address) return null;
    if (
      address.startsWith("http") ||
      address.includes("google.com/maps") ||
      address.includes("maps.app.goo.gl")
    ) {
      // Try to extract a name from common Google Maps URL patterns
      try {
        const url = new URL(address);
        // Pattern: /maps/place/Name+Of+Place/...
        if (url.pathname.includes("/maps/place/")) {
          const parts = url.pathname.split("/");
          const nameIdx = parts.indexOf("place") + 1;
          if (parts[nameIdx]) {
            return decodeURIComponent(parts[nameIdx].replace(/\+/g, " "));
          }
        }
        // Pattern: search?q=Name
        const q = url.searchParams.get("q");
        if (q) return q;
      } catch (e) {
        // Not a standard URL or parsing failed
      }
      return "Google Maps";
    }
    return address;
  }, [address]);

  React.useEffect(() => {
    if (!address) return;
    // Using global geocode queue to prevent rate limiting
    addToGeocodeQueue(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`,
    )
      .then((data) => {
        if (data && data.display_name) setEnglishAddress(data.display_name);
      })
      .catch(() => {});
  }, [address, lat, lng]);

  return (
    <div className="vp-popup-container">
      <div className="vp-popup-header">
        <h3 className="vp-popup-title" style={{ fontSize: "1.1rem" }}>
          {name}
        </h3>
      </div>
      <div className="vp-popup-body">
        {hotelUrl && (
          <div className="vp-popup-item" style={{ marginBottom: 12 }}>
            <span
              className="vp-popup-icon"
              style={{ background: "rgba(255, 193, 7, 0.1)", color: "#ffc107" }}
            >
              🏨
            </span>
            <span className="vp-popup-value" style={{ fontWeight: 800 }}>
              <a
                href={hotelUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#ffc107", textDecoration: "none" }}
              >
                Booking.com Link
              </a>
            </span>
          </div>
        )}
        {address && (
          <div className="vp-popup-item">
            <span className="vp-popup-icon">📍</span>
            <span className="vp-popup-value" style={{ fontSize: "0.8rem" }}>
              {englishAddress || displayAddress}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

type AgendaMarkerProps = { agenda: Agenda };

const AgendaMarker: React.FC<AgendaMarkerProps> = ({ agenda }) => {
  const [coords, setCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (!agenda.address) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      agenda.address,
    )}`;
    const cached = getCachedGeocode(url);
    if (cached && cached.length > 0) {
      return { lat: parseFloat(cached[0].lat), lng: parseFloat(cached[0].lon) };
    }
    return null;
  });
  const [englishAddress, setEnglishAddress] = React.useState<string | null>(
    () => {
      if (!coords || !agenda.address) return null;
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=en`;
      const cached = getCachedGeocode(url);
      return cached?.display_name || null;
    },
  );

  const displayAddress = React.useMemo(() => {
    if (!agenda.address) return null;
    if (
      agenda.address.startsWith("http") ||
      agenda.address.includes("google.com/maps") ||
      agenda.address.includes("maps.app.goo.gl")
    ) {
      try {
        const url = new URL(agenda.address);
        if (url.pathname.includes("/maps/place/")) {
          const parts = url.pathname.split("/");
          const nameIdx = parts.indexOf("place") + 1;
          if (parts[nameIdx]) {
            return decodeURIComponent(parts[nameIdx].replace(/\+/g, " "));
          }
        }
        const q = url.searchParams.get("q");
        if (q) return q;
      } catch (e) {}
      return "Google Maps";
    }
    return agenda.address;
  }, [agenda.address]);

  // Reverse geocode to get a nice address even if the input was a link
  React.useEffect(() => {
    if (!coords || !agenda.address) return;

    if (
      agenda.address.startsWith("http") ||
      agenda.address.includes("google.com/maps") ||
      agenda.address.includes("maps.app.goo.gl")
    ) {
      addToGeocodeQueue(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=en`,
      )
        .then((data) => {
          if (data && data.display_name) setEnglishAddress(data.display_name);
        })
        .catch(() => {});
    }
  }, [coords, agenda.address]);

  React.useEffect(() => {
    if (!agenda.address) return;

    let cancelled = false;

    const performGeocode = async () => {
      // Small random startup jitter to spread out initial queueing
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
      if (cancelled) return;

      let query = agenda.address || "";

      // If address is a Google Maps URL, it can't be geocoded directly.
      if (
        query.startsWith("http") ||
        query.includes("google.com/maps") ||
        query.includes("maps.app.goo.gl")
      ) {
        // Try to extract coordinates from full URL
        const coordMatch = query.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch) {
          setCoords({
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2]),
          });
          return;
        }

        // Fall back to description if address is a link
        if (agenda.description && !agenda.description.startsWith("http")) {
          query = agenda.description;
        } else {
          // If no good query, give up
          return;
        }
      }

      try {
        const data = await addToGeocodeQueue(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            query,
          )}`,
        );
        if (!cancelled && data && data.length > 0) {
          setCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("AgendaMarker geocode error for", agenda.address, err);
        }
      }
    };

    performGeocode();
    return () => {
      cancelled = true;
    };
  }, [agenda.address, agenda.description]);

  const handleGetRoute = () => {
    if (coords) {
      const routeUrl = `https://www.openstreetmap.org/directions?route=;${coords.lat},${coords.lng}`;
      window.open(routeUrl, "_blank");
    }
  };

  if (!agenda.address) return null;
  if (!coords) {
    // Fallback: show marker at default location (Tokyo) with warning popup
    return (
      <Marker position={[35.6895, 139.6917]} icon={agendaIcon}>
        <Popup>
          <div className="vp-popup-container">
            <div className="vp-popup-header">
              <h3
                className="vp-popup-title"
                style={{
                  background: "#ff6b6b",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                Location Not Found
              </h3>
            </div>
            <div className="vp-popup-body">
              <div className="vp-popup-item">
                <span
                  className="vp-popup-icon"
                  style={{
                    background: "rgba(255,107,107,0.1)",
                    color: "#ff6b6b",
                  }}
                >
                  ⚠️
                </span>
                <span className="vp-popup-value" style={{ color: "#ff6b6b" }}>
                  {englishAddress || displayAddress}
                </span>
              </div>
              <div className="vp-popup-item">
                <span
                  className="vp-popup-icon"
                  style={{
                    background: "rgba(255,107,107,0.1)",
                    color: "#ff6b6b",
                  }}
                >
                  📝
                </span>
                <span className="vp-popup-value">{agenda.description}</span>
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }
  return (
    <Marker position={[coords.lat, coords.lng]} icon={agendaIcon}>
      <Popup>
        <div className="vp-popup-container">
          <div className="vp-popup-header">
            <h3 className="vp-popup-title">{agenda.description}</h3>
          </div>
          <div className="vp-popup-body">
            <div className="vp-popup-item">
              <span className="vp-popup-icon">📅</span>
              <span className="vp-popup-value">
                {agenda.agenda_date}
                {agenda.Time && ` | ${agenda.Time.slice(0, 5)}`}
              </span>
            </div>
            <div className="vp-popup-item">
              <span className="vp-popup-icon">📍</span>
              <span className="vp-popup-value" style={{ fontSize: "0.8rem" }}>
                {englishAddress || displayAddress}
              </span>
            </div>
            <button className="vp-popup-button" onClick={handleGetRoute}>
              Get Route
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const VacationMap = ({
  locations,
  agendas,
  onLocationChange,
  onSelectLocation,
  selectedLocationId,
}: {
  locations: Location[];
  agendas: Agenda[];
  onLocationChange?: (id: number, lat: number, lng: number) => void;
  onSelectLocation?: (locId: number) => void;
  selectedLocationId?: number | null;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Center on selected location if available
  const selected = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null;

  const bounds = React.useMemo(() => {
    // Only calculate bounds if no specific location is selected
    if (
      selectedLocationId !== null &&
      selectedLocationId !== undefined &&
      !isNaN(Number(selectedLocationId))
    ) {
      return null;
    }
    if (locations.length === 0) return null;
    const validLocs = locations.filter((l) => l.lat && l.lng);
    if (validLocs.length === 0) return null;
    const latLngs = validLocs.map((l) => [l.lat!, l.lng!] as [number, number]);
    return L.latLngBounds(latLngs);
  }, [selectedLocationId, locations]);

  const center =
    selected && selected.lat && selected.lng
      ? [selected.lat, selected.lng]
      : locations.length > 0 && locations[0].lat && locations[0].lng
        ? [locations[0].lat, locations[0].lng]
        : [35, 135]; // Japan as fallback

  return (
    <div style={{ height: "100%", width: "100%", minHeight: 400 }}>
      <MapContainer
        center={center as [number, number]}
        zoom={selectedLocationId ? 12 : 4}
        style={{ height: "100%", width: "100%" }}
      >
        <MapController
          center={center as [number, number]}
          bounds={bounds || undefined}
        />
        <TileLayer
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {locations.map((loc) => {
          if (loc.lat && loc.lng) {
            return (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={loc.hotel_url ? hotelIcon : locationIcon}
                draggable={!!onLocationChange}
                eventHandlers={{
                  ...(onLocationChange
                    ? {
                        dragend: (e: any) => {
                          const marker = e.target;
                          const { lat, lng } = marker.getLatLng();
                          onLocationChange(loc.id, lat, lng);
                        },
                      }
                    : {}),
                  click: () => {
                    if (onSelectLocation) onSelectLocation(loc.id);
                  },
                }}
              >
                <Popup>
                  <LocationPopup
                    name={loc.name}
                    address={loc.address}
                    lat={loc.lat}
                    lng={loc.lng}
                    hotelUrl={loc.hotel_url}
                  />
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
        {agendas.map((ag) => (
          <AgendaMarker key={"agenda-" + ag.id} agenda={ag} />
        ))}
      </MapContainer>
    </div>
  );
};

export default VacationMap;
