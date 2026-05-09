import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

function createStationIcon(status, isSelected) {
  const cls = status === 'available' ? 'avail' : status === 'limited' ? 'limited' : 'full';
  const extra = isSelected ? ' selected-pin' : '';
  return L.divIcon({
    html: `<div class="custom-marker"><div class="m-pin ${cls}${extra}"><i class="fa-solid fa-bolt"></i></div></div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 38]
  });
}

function createUserIcon() {
  return L.divIcon({
    html: '<div class="custom-marker"><div class="m-pin user"></div></div>',
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function FlyToStation({ station, zoom }) {
  const map = useMap();
  const prevId = useRef(null);
  useEffect(() => {
    if (station && station.stationId !== prevId.current) {
      map.flyTo([station.lat, station.lng], zoom || 16, { duration: 1.2 });
      prevId.current = station.stationId;
    }
  }, [station, map, zoom]);
  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [bounds, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function WizardMapPanel({ stations, selectedStation, userPos, currentStep, bookingResult }) {
  const center = selectedStation
    ? [selectedStation.lat, selectedStation.lng]
    : userPos || [9.9250, 78.1150];

  // Haversine distance
  const distanceInfo = useMemo(() => {
    if (!selectedStation || !userPos) return null;
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(selectedStation.lat - userPos[0]);
    const dLon = toRad(selectedStation.lng - userPos[1]);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userPos[0])) * Math.cos(toRad(selectedStation.lat)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    const time = Math.round((dist / 30) * 60);
    return {
      distance: dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km',
      time: time < 60 ? time + ' min' : Math.floor(time / 60) + 'h ' + (time % 60) + 'm'
    };
  }, [selectedStation, userPos]);

  const showRoute = currentStep >= 3 && selectedStation && userPos;
  const routeBounds = showRoute ? [userPos, [selectedStation.lat, selectedStation.lng]] : null;

  const stationsToShow = currentStep === 1
    ? stations
    : selectedStation ? [selectedStation] : [];

  return (
    <div className="wz-map-panel">
      <div className="wz-map-header">
        <h3 className="wz-map-title">
          <span className="live-dot"></span>
          {currentStep === 1 ? 'All Stations' :
            currentStep === 2 ? 'Selected Station' :
              currentStep >= 3 ? 'Route & Station' : 'Station Map'}
        </h3>
        <div className="wz-map-legend">
          <span><span className="legend-dot avail"></span>Available</span>
          <span><span className="legend-dot limited"></span>Limited</span>
          <span><span className="legend-dot full"></span>Full</span>
        </div>
      </div>

      <MapContainer center={center} zoom={13} className="leaflet-map wz-map" scrollWheelZoom={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <InvalidateSize />

        {selectedStation && currentStep >= 2 && (
          <FlyToStation station={selectedStation} zoom={15} />
        )}
        {routeBounds && <FitBounds bounds={routeBounds} />}

        {/* Station markers */}
        {stationsToShow.map(s => (
          <Marker
            key={s.stationId || s._id}
            position={[s.lat, s.lng]}
            icon={createStationIcon(s.status, selectedStation?.stationId === s.stationId)}
          >
            <Popup maxWidth={240}>
              <div className="pop-inner">
                <h4>{s.name}</h4>
                <p><i className="fa-solid fa-location-dot" style={{ color: 'var(--accent)', marginRight: '4px' }}></i>{s.location}</p>
                <p><i className="fa-solid fa-bolt" style={{ color: 'var(--cyan)', marginRight: '4px' }}></i>{s.power}kW · {s.availableSlots}/{s.totalSlots} slots</p>
                <span className="pop-price">₹{s.pricePerKwh}/kWh</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User marker */}
        {userPos && <Marker position={userPos} icon={createUserIcon()} />}

        {/* Route line */}
        {showRoute && (
          <Polyline
            positions={[userPos, [selectedStation.lat, selectedStation.lng]]}
            pathOptions={{ color: '#00F582', weight: 3, opacity: 0.8, dashArray: '8,12' }}
          />
        )}
      </MapContainer>

      {/* Info overlay cards */}
      {selectedStation && currentStep >= 2 && (
        <div className="wz-map-info-card">
          <div className="wz-map-info-row">
            <i className="fa-solid fa-charging-station"></i>
            <div>
              <strong>{selectedStation.name}</strong>
              <span>{selectedStation.location}</span>
            </div>
          </div>
          <div className="wz-map-info-stats">
            <div className="wz-map-stat">
              <span className="wz-map-stat-val">{selectedStation.power}kW</span>
              <span className="wz-map-stat-label">Power</span>
            </div>
            <div className="wz-map-stat">
              <span className="wz-map-stat-val">{selectedStation.availableSlots}/{selectedStation.totalSlots}</span>
              <span className="wz-map-stat-label">Slots</span>
            </div>
            <div className="wz-map-stat">
              <span className="wz-map-stat-val">₹{selectedStation.pricePerKwh}</span>
              <span className="wz-map-stat-label">Per kWh</span>
            </div>
            {distanceInfo && (
              <>
                <div className="wz-map-stat">
                  <span className="wz-map-stat-val">{distanceInfo.distance}</span>
                  <span className="wz-map-stat-label">Distance</span>
                </div>
                <div className="wz-map-stat">
                  <span className="wz-map-stat-val">{distanceInfo.time}</span>
                  <span className="wz-map-stat-label">ETA</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking confirmation overlay on step 4 */}
      {currentStep >= 4 && bookingResult && (
        <div className="wz-map-confirm-overlay">
          <div className="wz-map-confirm-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <span>Booking Confirmed</span>
        </div>
      )}
    </div>
  );
}
