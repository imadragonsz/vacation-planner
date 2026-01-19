import React from "react";
import { addToGeocodeQueue } from "./utils/geocoder";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { agendaIcon, locationIcon } from "./markerIcons";
import "leaflet/dist/leaflet.css";

export type Location = {
  id: number;
  name: string;
  address: string | null;
  lat?: number;
  lng?: number;
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
};

const LocationPopup: React.FC<LocationPopupProps> = ({
  name,
  address,
  lat,
  lng,
}) => {
  const [englishAddress, setEnglishAddress] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!address) return;
    // Using global geocode queue to prevent rate limiting
    addToGeocodeQueue(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
    )
      .then((data) => {
        if (data && data.display_name) setEnglishAddress(data.display_name);
        else setEnglishAddress(address);
      })
      .catch(() => setEnglishAddress(address));
  }, [address, lat, lng]);

  return (
    <div
      style={{
        maxWidth: 220,
        maxHeight: 120,
        overflowY: "auto",
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <b>{name}</b>
      {address && <div>{englishAddress || address}</div>}
    </div>
  );
};

type AgendaMarkerProps = { agenda: Agenda };

const AgendaMarker: React.FC<AgendaMarkerProps> = ({ agenda }) => {
  const [coords, setCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);

  React.useEffect(() => {
    if (!agenda.address) return;

    let cancelled = false;

    const performGeocode = async () => {
      // Small random startup jitter to spread out initial queueing
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
      if (cancelled) return;

      try {
        const data = await addToGeocodeQueue(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            agenda.address || ""
          )}`
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
  }, [agenda.address]);

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
          <div style={{ maxWidth: 220, color: "red" }}>
            <b>Could not geocode address:</b>
            <br />
            {agenda.address}
            <br />
            <b>Agenda:</b> {agenda.description}
            <br />
            <b>Date:</b> {agenda.agenda_date}
            {agenda.Time && (
              <>
                <br />
                <b>Time:</b> {agenda.Time.slice(0, 5)}
              </>
            )}
          </div>
        </Popup>
      </Marker>
    );
  }
  return (
    <Marker position={[coords.lat, coords.lng]} icon={agendaIcon}>
      <Popup>
        <div
          style={{
            maxWidth: 220,
            maxHeight: 120,
            overflowY: "auto",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          <b>Agenda:</b> {agenda.description}
          <br />
          <b>Date:</b> {agenda.agenda_date}
          {agenda.Time && ` | Time: ${agenda.Time.slice(0, 5)}`}
          <br />
          <b>Address:</b> {agenda.address}
          <br />
          <button onClick={handleGetRoute} style={{ marginTop: 8 }}>
            Get Route
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

const VacationMap = ({
  locations,
  agendas,
  onLocationChange,
}: {
  locations: Location[];
  agendas: Agenda[];
  onLocationChange?: (id: number, lat: number, lng: number) => void;
}) => {
  // Default center (can be improved to fit all markers)
  const center =
    locations.length > 0 && locations[0].lat && locations[0].lng
      ? [locations[0].lat, locations[0].lng]
      : [35, 135]; // Japan as fallback

  return (
    <div style={{ height: 400, width: "100%", marginBottom: 24 }}>
      <MapContainer
        center={center as [number, number]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((loc) => {
          if (loc.lat && loc.lng) {
            return (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={locationIcon}
                draggable={!!onLocationChange}
                eventHandlers={
                  onLocationChange
                    ? {
                        dragend: (e: any) => {
                          const marker = e.target;
                          const { lat, lng } = marker.getLatLng();
                          onLocationChange(loc.id, lat, lng);
                        },
                      }
                    : undefined
                }
              >
                <Popup>
                  <LocationPopup
                    name={loc.name}
                    address={loc.address}
                    lat={loc.lat}
                    lng={loc.lng}
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
