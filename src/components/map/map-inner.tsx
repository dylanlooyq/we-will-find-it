"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { pinHtml, youAreHereHtml, type PinKind } from "./pin-html";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  kind: PinKind;
  label: string;
}

const SG_CENTER: [number, number] = [1.3521, 103.8198];
const SG_BOUNDS: L.LatLngBoundsExpression = [
  [1.1, 103.5],
  [1.55, 104.2],
];

const iconCache = new Map<string, L.DivIcon>();
function pinIcon(kind: PinKind, selected: boolean): L.DivIcon {
  const key = `${kind}:${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({ html: pinHtml(kind, selected), className: "", iconSize: [40, 52], iconAnchor: [20, 50] });
    iconCache.set(key, icon);
  }
  return icon;
}

function clusterIcon(count: number, kinds: Set<PinKind>): L.DivIcon {
  const size = count < 5 ? 42 : count < 10 ? 50 : 58;
  const ring = kinds.has("bounty") ? "#f59e0b" : kinds.has("lost") && !kinds.has("found") ? "#e11d48" : kinds.has("found") && !kinds.has("lost") ? "#2b4fdb" : "#0e1a3a";
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0e1a3a;color:#fff;border:4px solid ${ring};box-shadow:0 0 0 4px rgba(255,255,255,.85),0 8px 18px rgba(14,26,58,.35);display:flex;align-items:center;justify-content:center;font:800 ${count < 10 ? 16 : 15}px 'Plus Jakarta Sans',system-ui,sans-serif">${count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const hereIcon = L.divIcon({ html: youAreHereHtml(), className: "", iconSize: [22, 22], iconAnchor: [11, 11] });

interface Cluster {
  key: string;
  lat: number;
  lng: number;
  points: MapPoint[];
}

/** Grid clustering in screen space: nearby pins merge into a count bubble until you zoom in. */
function cluster(points: MapPoint[], zoom: number, selectedId: string | null): Cluster[] {
  const CELL = 64;
  const cells = new Map<string, MapPoint[]>();
  for (const p of points) {
    const px = L.CRS.EPSG3857.latLngToPoint(L.latLng(p.lat, p.lng), zoom);
    const key = p.id === selectedId ? `sel:${p.id}` : `${Math.floor(px.x / CELL)}:${Math.floor(px.y / CELL)}`;
    const g = cells.get(key) ?? [];
    g.push(p);
    cells.set(key, g);
  }
  return [...cells.entries()].map(([key, pts]) => ({
    key,
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
    points: pts,
  }));
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

function FlyToSelected({ points, selectedId }: { points: MapPoint[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const p = points.find((x) => x.id === selectedId);
    if (p) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  return null;
}

function Recenter({ origin, nonce }: { origin?: { lat: number; lng: number }; nonce: number }) {
  const map = useMap();
  useEffect(() => {
    if (nonce > 0 && origin) map.flyTo([origin.lat, origin.lng], 14, { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  return null;
}

/** Leaflet is browser-only; this module is loaded through next/dynamic with ssr:false. */
export default function MapInner({
  points,
  selectedId,
  onSelect,
  origin,
  recenterNonce,
  initialZoom = 11,
}: {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  origin?: { lat: number; lng: number };
  recenterNonce: number;
  initialZoom?: number;
}) {
  const [zoom, setZoom] = useState(initialZoom);
  const clusters = useMemo(() => cluster(points, zoom, selectedId), [points, zoom, selectedId]);

  return (
    <MapContainer
      center={SG_CENTER}
      zoom={initialZoom}
      minZoom={10}
      maxBounds={SG_BOUNDS}
      maxBoundsViscosity={0.8}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
      aria-label="Map of lost and found listings in Singapore"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        className="wwf-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ZoomControl position="bottomright" />
      <ZoomWatcher onZoom={setZoom} />
      {origin && <Marker position={[origin.lat, origin.lng]} icon={hereIcon} interactive={false} keyboard={false} />}
      {clusters.map((c) =>
        c.points.length === 1 ? (
          <Marker
            key={c.key}
            position={[c.points[0].lat, c.points[0].lng]}
            icon={pinIcon(c.points[0].kind, c.points[0].id === selectedId)}
            zIndexOffset={c.points[0].id === selectedId ? 1000 : 0}
            title={c.points[0].label}
            eventHandlers={{ click: () => onSelect(c.points[0].id === selectedId ? null : c.points[0].id) }}
          />
        ) : (
          <ClusterMarker key={c.key} cluster={c} />
        ),
      )}
      <FlyToSelected points={points} selectedId={selectedId} />
      <Recenter origin={origin} nonce={recenterNonce} />
    </MapContainer>
  );
}

function ClusterMarker({ cluster: c }: { cluster: Cluster }) {
  const map = useMap();
  const kinds = useMemo(() => new Set(c.points.map((p) => p.kind)), [c.points]);
  return (
    <Marker
      position={[c.lat, c.lng]}
      icon={clusterIcon(c.points.length, kinds)}
      title={`${c.points.length} listings — zoom in`}
      eventHandlers={{
        click: () => {
          const b = L.latLngBounds(c.points.map((p) => [p.lat, p.lng] as [number, number]));
          map.flyToBounds(b.pad(0.4), { maxZoom: 16, duration: 0.6 });
        },
      }}
    />
  );
}
