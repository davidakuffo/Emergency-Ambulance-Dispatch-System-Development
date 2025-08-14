"use client";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { Ambulance, Coordinate, EmergencyCall } from "@/lib/types";

type Props = {
  ambulances: Ambulance[];
  calls: EmergencyCall[];
  draftLocation?: Coordinate | null;
  onMapClick?: (loc: Coordinate) => void;
  className?: string;
};

function MapClickHandler({ onMapClick }: { onMapClick?: (location: Coordinate) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function MapView({ ambulances, calls, draftLocation, onMapClick, className }: Props) {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const defaultCenter = useMemo(() => ({ lat: 5.6037, lng: -0.1870 }), []); // Accra, Ghana

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  const currentCenter = userLocation || defaultCenter;
  const mapCenter: LatLngExpression = [currentCenter.lat, currentCenter.lng];

  return (
    <div className={`w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 ${className || ""}`}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng] as any}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-blue-600">Your Location</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ambulance markers */}
        {ambulances.map((a) => (
          <Marker key={a.id} position={[a.location.lat, a.location.lng] as any}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-green-600">{a.vehicleId}</div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(a.status)}`}></span>
                  Status: {a.status.replace("_", " ")}
                </div>
                <div>Equipment: {a.equipmentLevel}</div>
                <div>Crew: {a.crewSize}</div>
                <div className="text-xs text-gray-500">
                  Updated: {new Date(a.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency call markers */}
        {calls.map((c) => (
          <Marker key={c.id} position={[c.location.lat, c.location.lng] as any}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-red-600">Emergency Call #{c.id}</div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${getSeverityColor(c.severityLevel)}`}></span>
                  Priority {c.severityLevel}
                </div>
                <div>Status: {c.status.replace("_", " ")}</div>
                {c.address && <div>Location: {c.address}</div>}
                <div className="text-xs text-gray-500">
                  Called: {new Date(c.callTime).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draft location marker */}
        {draftLocation && (
          <Marker position={[draftLocation.lat, draftLocation.lng] as any}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-purple-600">New Call Location</div>
                <div>Lat: {draftLocation.lat.toFixed(5)}</div>
                <div>Lng: {draftLocation.lng.toFixed(5)}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "available": return "bg-green-500";
    case "en_route": return "bg-blue-500";
    case "at_scene": return "bg-yellow-500";
    case "transporting": return "bg-orange-500";
    case "out_of_service": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function getSeverityColor(level: number): string {
  switch (level) {
    case 1: return "bg-red-600";
    case 2: return "bg-orange-500";
    case 3: return "bg-yellow-500";
    case 4: return "bg-green-500";
    default: return "bg-gray-500";
  }
}

