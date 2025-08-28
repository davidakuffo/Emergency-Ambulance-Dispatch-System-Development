"use client";
import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";
import { useTranslation } from "@/contexts/LanguageContext";
import { Coordinate } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Mock data for demonstration (fallbacks)
const FALLBACK_USER_LOCATION: Coordinate = { lat: 5.6037, lng: -0.1870 }; // Accra, Ghana
const AMBULANCE_START_LOCATION: Coordinate = { lat: 5.6100, lng: -0.1800 }; // Nearby starting point

// Road network factor makes ETA more realistic vs straight-line
const ROAD_FACTOR = 1.3;
// Mock ambulance speed in km/h with slight variance
const AMBULANCE_SPEED_KMH_BASE = 45;

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate ETA in minutes
function calculateETA(distanceKm: number, speedKmh: number): number {
    return Math.ceil((distanceKm / speedKmh) * 60);
}

// Interpolate position between two coordinates
function interpolatePosition(start: Coordinate, end: Coordinate, progress: number): Coordinate {
    return {
        lat: start.lat + (end.lat - start.lat) * progress,
        lng: start.lng + (end.lng - start.lng) * progress
    };
}

// Calculate bearing (degrees) from start to end
function calculateBearing(start: Coordinate, end: Coordinate): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const φ1 = toRad(start.lat);
    const φ2 = toRad(end.lat);
    const Δλ = toRad(end.lng - start.lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ) - Math.sin(φ1) * Math.sin(φ2);
    const θ = Math.atan2(y, x);
    const brng = (toDeg(θ) + 360) % 360;
    return brng;
}

// Helper to auto-fit map to two points when token changes
function FitBounds({ a, b, token }: { a: Coordinate; b: Coordinate; token: number }) {
    const map = useMap();
    useEffect(() => {
        const bounds = [
            [a.lat, a.lng] as [number, number],
            [b.lat, b.lng] as [number, number]
        ];
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [a, b, token, map]);
    return null;
}

export default function AmbulanceTracking() {
    const t = useTranslation();
    const [ambulancePosition, setAmbulancePosition] = useState<Coordinate>(AMBULANCE_START_LOCATION);
    const [userLocation, setUserLocation] = useState<Coordinate>(FALLBACK_USER_LOCATION);
    const [progress, setProgress] = useState(0);
    const [eta, setEta] = useState(0);
    const [isMoving, setIsMoving] = useState(true);
    const [bearing, setBearing] = useState(0);
    const [fitToken, setFitToken] = useState(0);

    // Track user's live location with graceful fallback
    useEffect(() => {
        let watchId: number | null = null;
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    // Ignore errors; stay with fallback location
                },
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
            );
        }
        return () => {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, []);

    // Calculate initial distance and ETA
    const speedVariance = useMemo(() => 0.9 + Math.random() * 0.2, []); // 0.9x - 1.1x
    const effectiveSpeed = useMemo(() => AMBULANCE_SPEED_KMH_BASE * speedVariance, [speedVariance]);
    const totalDistance = useMemo(() =>
        calculateDistance(AMBULANCE_START_LOCATION, userLocation) * ROAD_FACTOR,
        [userLocation]
    );

    const initialETA = useMemo(() =>
        calculateETA(totalDistance, effectiveSpeed),
        [totalDistance, effectiveSpeed]
    );

    // Animation effect
    useEffect(() => {
        if (!isMoving) return;

        const animationDuration = initialETA * 60 * 1000; // Convert minutes to milliseconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(elapsed / animationDuration, 1);

            const newPosition = interpolatePosition(AMBULANCE_START_LOCATION, userLocation, newProgress);
            setAmbulancePosition(newPosition);
            setProgress(newProgress);

            // Update ETA
            const remainingDistance = totalDistance * (1 - newProgress);
            const newETA = calculateETA(remainingDistance, effectiveSpeed);
            setEta(newETA);

            // Update bearing toward current target
            const br = calculateBearing(newPosition, userLocation);
            setBearing(br);

            if (newProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsMoving(false);
                setEta(0);
            }
        };

        requestAnimationFrame(animate);
    }, [isMoving, initialETA, totalDistance, userLocation, effectiveSpeed]);

    // Create custom icons
    const createAmbulanceIcon = () => {
        return divIcon({
            html: `
        <div style="
          background-color: #dc2626;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 16px;
          transform: rotate(${bearing}deg);
        ">
          🚑
        </div>
      `,
            className: 'custom-ambulance-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    };

    const createUserIcon = () => {
        return divIcon({
            html: `
        <div style="
          background-color: #2563eb;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 12px;
        ">
          📍
        </div>
      `,
            className: 'custom-user-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    };

    const mapCenter: LatLngExpression = [
        (userLocation.lat + ambulancePosition.lat) / 2,
        (userLocation.lng + ambulancePosition.lng) / 2
    ];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Status Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🚑</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t.ambulanceOnTheWay}</h2>
                            <p className="text-gray-600">
                                {eta > 0
                                    ? `${t.estimatedArrival} ${eta} ${eta === 1 ? t.minute : t.minutes}`
                                    : t.ambulanceArrived
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">{t.distance}</div>
                        <div className="text-lg font-bold text-gray-900">
                            {((1 - progress) * totalDistance).toFixed(1)} km
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${progress * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Ambulance dispatched</span>
                        <span>{eta > 0 ? `${eta} min remaining` : 'Arrived'}</span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{t.liveTracking}</h3>
                    <p className="text-sm text-gray-600">{t.followAmbulance}</p>
                </div>

                <div className="h-96 w-full">
                    <MapContainer
                        center={mapCenter}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={true}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> & OpenStreetMap contributors'
                        />

                        {/* Auto fit bounds between ambulance and user */}
                        <FitBounds a={ambulancePosition} b={userLocation} token={fitToken} />

                        {/* User Location Marker */}
                        <Marker position={[userLocation.lat, userLocation.lng] as LatLngExpression} icon={createUserIcon()}>
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-semibold text-blue-600">Your Location</div>
                                    <div>Emergency pickup point</div>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Route Polyline */}
                        <Polyline
                            pathOptions={{ color: '#f87171', weight: 4, opacity: 0.7 }}
                            positions={[
                                [ambulancePosition.lat, ambulancePosition.lng] as [number, number],
                                [userLocation.lat, userLocation.lng] as [number, number]
                            ]}
                        />

                        {/* Ambulance Marker */}
                        <Marker position={[ambulancePosition.lat, ambulancePosition.lng] as LatLngExpression} icon={createAmbulanceIcon()}>
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-semibold text-red-600">🚑 Ambulance AMB-001</div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        En route to emergency
                                    </div>
                                    <div>ETA: {eta > 0 ? `${eta} min` : 'Arrived'}</div>
                                    <div>Distance: {((1 - progress) * totalDistance).toFixed(1)} km</div>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>

                    {/* Recenter control */}
                    <button
                        type="button"
                        onClick={() => setFitToken((v) => v + 1)}
                        className="absolute right-4 bottom-4 bg-black/70 text-white text-sm px-3 py-2 rounded-lg shadow hover:bg-black/80"
                    >
                        Recenter
                    </button>
                </div>
            </div>

            {/* Emergency Information */}
            <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">{t.waitingInstructions}</h4>
                <ul className="text-sm text-blue-700 space-y-2">
                    <li>• {t.staySafeVisible}</li>
                    <li>• {t.keepPhoneCharged}</li>
                    <li>• {t.haveSomeoneWithYou}</li>
                    <li>• {t.followDispatcher}</li>
                    <li>• Stay calm - help is on the way!</li>
                </ul>
            </div>
        </div>
    );
}
