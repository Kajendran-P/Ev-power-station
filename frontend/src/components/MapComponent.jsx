import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

function createIcon(cls, icon) {
  return L.divIcon({
    html: `<div class="custom-marker"><div class="m-pin ${cls}"><i class="fa-solid ${icon}"></i></div></div>`,
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

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
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

export function StationMarker({ station, onClick }) {
  const cls = station.status === 'available' ? 'avail' : station.status === 'limited' ? 'limited' : 'full';
  return (
    <Marker position={[station.lat, station.lng]} icon={createIcon(cls, 'fa-bolt')}>
      <Popup maxWidth={220}>
        <div className="pop-inner">
          <h4>{station.name}</h4>
          <p><i className="fa-solid fa-location-dot" style={{color:'var(--accent)',marginRight:'4px'}}></i>{station.location}</p>
          <p><i className="fa-solid fa-bolt" style={{color:'var(--cyan)',marginRight:'4px'}}></i>{station.power}kW · {station.availableSlots}/{station.totalSlots} slots</p>
          <span className="pop-price">₹{station.pricePerKwh}/kWh</span>
          {onClick && <button className="pop-btn" onClick={() => onClick(station)}>View & Book</button>}
        </div>
      </Popup>
    </Marker>
  );
}

export function UserMarker({ position }) {
  return <Marker position={position} icon={createUserIcon()} />;
}

export function TechMarker({ position, name }) {
  return (
    <Marker position={position} icon={createIcon('worker', 'fa-screwdriver-wrench')}>
      <Popup maxWidth={220}>
        <div className="pop-inner"><h4>{name || 'Technician'}</h4></div>
      </Popup>
    </Marker>
  );
}

export function WorkerMarker({ worker }) {
  return (
    <Marker position={[worker.location?.lat || worker.lat, worker.location?.lng || worker.lng]} icon={createIcon('worker', 'fa-screwdriver-wrench')}>
      <Popup maxWidth={220}>
        <div className="pop-inner">
          <h4>{worker.name}</h4>
          <p>⭐ {worker.rating || '4.5'}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent({ center, zoom = 13, stations = [], workers = [], userPos, techPos, techName, showRoute, className = '', style = {} }) {
  const bounds = showRoute && userPos && techPos ? [userPos, techPos] : null;

  return (
    <MapContainer center={center} zoom={zoom} className={`leaflet-map ${className}`} style={{ height: '480px', ...style }} scrollWheelZoom={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      <InvalidateSize />
      {bounds && <FitBounds bounds={bounds} />}
      {stations.map(s => <StationMarker key={s.stationId || s._id} station={s} />)}
      {workers.map(w => <WorkerMarker key={w._id || w.id} worker={w} />)}
      {userPos && <UserMarker position={userPos} />}
      {techPos && <TechMarker position={techPos} name={techName} />}
      {showRoute && userPos && techPos && (
        <Polyline positions={[userPos, techPos]} pathOptions={{ color: '#00F582', weight: 3, opacity: 0.8, dashArray: '8,12' }} />
      )}
    </MapContainer>
  );
}
