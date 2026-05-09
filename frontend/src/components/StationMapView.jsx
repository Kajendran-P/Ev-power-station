import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

/* ── Icon factories ── */
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

/* ── FlyTo controller ── */
function FlyToStation({ station }) {
  const map = useMap();
  const prevId = useRef(null);
  useEffect(() => {
    if (station && station.stationId !== prevId.current) {
      map.flyTo([station.lat, station.lng], 16, { duration: 1.2 });
      prevId.current = station.stationId;
    }
  }, [station, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

export default function StationMapView({ stations = [], selectedStation, userPos, onStationClick }) {
  const center = selectedStation
    ? [selectedStation.lat, selectedStation.lng]
    : userPos || [9.9250, 78.1150];

  return (
    <div className="map-view-wrap">
      <div className="map-view-header">
        <h3 className="map-view-title">
          <span className="live-dot"></span>
          Live Station Map
        </h3>
        <div className="map-view-legend">
          <span><span className="legend-dot avail"></span>Available</span>
          <span><span className="legend-dot limited"></span>Limited</span>
          <span><span className="legend-dot full"></span>Full</span>
        </div>
      </div>
      <MapContainer center={center} zoom={13} className="leaflet-map booking-map" scrollWheelZoom={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <InvalidateSize />
        <FlyToStation station={selectedStation} />

        {stations.map(s => (
          <Marker
            key={s.stationId || s._id}
            position={[s.lat, s.lng]}
            icon={createStationIcon(s.status, selectedStation?.stationId === s.stationId)}
            eventHandlers={{ click: () => onStationClick && onStationClick(s) }}
          >
            <Popup maxWidth={240}>
              <div className="pop-inner">
                <h4>{s.name}</h4>
                <p><i className="fa-solid fa-location-dot" style={{ color: 'var(--accent)', marginRight: '4px' }}></i>{s.location}</p>
                <p><i className="fa-solid fa-bolt" style={{ color: 'var(--cyan)', marginRight: '4px' }}></i>{s.power}kW · {s.availableSlots}/{s.totalSlots} slots</p>
                <p><i className="fa-solid fa-clock" style={{ color: 'var(--purple)', marginRight: '4px' }}></i>{s.workingHours || '06:00 AM - 11:00 PM'}</p>
                <span className="pop-price">₹{s.pricePerKwh}/kWh</span>
                <button className="pop-btn" onClick={() => onStationClick && onStationClick(s)}>Select Station</button>
              </div>
            </Popup>
          </Marker>
        ))}

        {userPos && <Marker position={userPos} icon={createUserIcon()} />}
      </MapContainer>

      {selectedStation && (
        <div className="map-selected-info">
          <i className="fa-solid fa-location-crosshairs"></i>
          <span>Viewing: <strong>{selectedStation.name}</strong></span>
          <span className="map-coords">{selectedStation.lat.toFixed(4)}, {selectedStation.lng.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}
