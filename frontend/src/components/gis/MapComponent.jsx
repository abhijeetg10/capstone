import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Proper Circular Outbreak Buffer Zones around Ishwarpur City
const circularOutbreakZones = [
  {
    id: 'zone-north',
    name: 'Ishwarpur North Ward Outbreak Buffer Zone (Ururun)',
    center: [17.050, 74.260],
    radius: 1600, // meters
    cases: 420,
    riskScore: 88,
    riskLevel: 'Critical Surge',
    color: '#e11d48', // Rose Red
    fillColor: '#e11d48',
    pathogen: 'Leptospirosis & Dengue Type 2',
    predictedTrend: '+18% (Critical Surge)',
    notes: 'Primary rainwater drainage accumulation zone. High vector density & monsoon exposure.'
  },
  {
    id: 'zone-central',
    name: 'Ishwarpur Central Ward Vector Surge Zone (Gandhi Chowk)',
    center: [17.042, 74.265],
    radius: 1300, // meters
    cases: 310,
    riskScore: 82,
    riskLevel: 'High Surge',
    color: '#e11d48',
    fillColor: '#e11d48',
    pathogen: 'Dengue NS1 Antigen',
    predictedTrend: '+14% (Rising)',
    notes: 'Market area vector breeding hotspot. Elevated emergency ICU admissions.'
  },
  {
    id: 'zone-east',
    name: 'Ishwarpur East Ward Waterborne Cluster Zone (Bahe Road)',
    center: [17.038, 74.275],
    radius: 1100, // meters
    cases: 210,
    riskScore: 68,
    riskLevel: 'Elevated Risk',
    color: '#f59e0b', // Amber Orange
    fillColor: '#f59e0b',
    pathogen: 'Salmonella Gastroenteritis',
    predictedTrend: '+5% (Stable)',
    notes: 'Pipeline repair sector. Municipal water testing active.'
  },
  {
    id: 'zone-south',
    name: 'Ishwarpur South Ward Circular Surveillance Zone (Peth Road)',
    center: [17.030, 74.255],
    radius: 1800, // meters
    cases: 45,
    riskScore: 22,
    riskLevel: 'Low Risk',
    color: '#10b981', // Emerald Green
    fillColor: '#10b981',
    pathogen: 'Routine Checkups',
    predictedTrend: '-12% (Declining)',
    notes: 'Controlled baseline area with minimal reported cases.'
  }
];

// Aggregated Ward Outbreak Sector Nodes (No individual patient records, 100% privacy protected)
const aggregatedWardSectors = [
  {
    id: 'ward-sec-1',
    position: [17.051, 74.261],
    sectorName: 'Gandhi Chowk & Station Road Sector',
    wardName: 'Ishwarpur Central Ward',
    activePatients: 84,
    primaryPathogen: 'Leptospirosis & Dengue Type 2',
    riskLevel: 'Critical Surge',
    precautions: 'Boil all drinking water before consumption. Avoid walking barefoot in flooded market lanes. Use mosquito repellents.',
    municipalDirective: 'Municipal vector fogging & drainage chlorination active.'
  },
  {
    id: 'ward-sec-2',
    position: [17.043, 74.266],
    streetLocation: 'Bahe Road Civil Hospital Sector',
    sectorName: 'Bahe Road Sector 2',
    wardName: 'Ishwarpur East Ward',
    activePatients: 56,
    primaryPathogen: 'Dengue NS1 Antigen',
    riskLevel: 'High Risk',
    precautions: 'Empty standing water from flower pots & air coolers weekly. Wear long-sleeved clothing during daytime.',
    municipalDirective: 'Anti-larval chemical spraying team deployed across Sector 2.'
  },
  {
    id: 'ward-sec-3',
    position: [17.037, 74.274],
    sectorName: 'Walwa Road Market Yard Sector',
    wardName: 'Ishwarpur North Ward',
    activePatients: 42,
    primaryPathogen: 'Salmonella Gastroenteritis',
    riskLevel: 'Elevated Risk',
    precautions: 'Consume freshly cooked food. Drink boiled or filtered water. Avoid unhygienic street food vendors.',
    municipalDirective: 'Water pipeline chlorination & food stall sanitary inspection underway.'
  },
  {
    id: 'ward-sec-4',
    position: [17.048, 74.258],
    sectorName: 'Peth Road Bus Stand Sector',
    wardName: 'Ishwarpur West Ward',
    activePatients: 38,
    primaryPathogen: 'Malaria (Plasmodium falciparum)',
    riskLevel: 'Elevated Risk',
    precautions: 'Use insecticide-treated bed nets. Cover water storage drums tightly.',
    municipalDirective: 'Vector breeding trap monitoring active near transit hubs.'
  },
  {
    id: 'ward-sec-5',
    position: [17.041, 74.263],
    sectorName: 'Sangli Road Market Yard Sector',
    wardName: 'Ishwarpur Central Ward',
    activePatients: 29,
    primaryPathogen: 'Influenza A (H1N1)',
    riskLevel: 'Moderate Risk',
    precautions: 'Wear face masks in crowded public areas. Practice hand hygiene frequently.',
    municipalDirective: 'Mobile fever triage clinic operating at Market Yard.'
  },
  {
    id: 'ward-sec-6',
    position: [17.036, 74.278],
    sectorName: 'Ururun Industrial Area Sector',
    wardName: 'Ishwarpur East Ward',
    activePatients: 31,
    primaryPathogen: 'Typhoid Fever (Salmonella typhi)',
    riskLevel: 'Moderate Risk',
    precautions: 'Ensure industrial canteens use purified water supplies. Wash hands thoroughly before meals.',
    municipalDirective: 'Industrial water supply quality audit initiated.'
  },
  {
    id: 'ward-sec-7',
    position: [17.028, 74.253],
    sectorName: 'Peth Naka Residential Sector',
    wardName: 'Ishwarpur South Ward',
    activePatients: 12,
    primaryPathogen: 'Routine Baseline Checkups',
    riskLevel: 'Low Risk',
    precautions: 'Maintain standard household sanitation & personal hygiene.',
    municipalDirective: 'Routine epidemiological monitoring.'
  }
];

const MapComponent = ({ filters, onSelectWard }) => {
  return (
    <MapContainer 
      center={[17.0450, 74.2620]} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
    >
      {/* Basemap Layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />

      {/* CIRCULAR OUTBREAK BUFFER ZONES IN ISHWARPUR CITY */}
      {filters.showBoundaries !== false && circularOutbreakZones.map((zone) => (
        <Circle
          key={zone.id}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.fillColor,
            fillOpacity: 0.28,
            weight: 2.5,
            dashArray: '6, 6'
          }}
          eventHandlers={{
            click: () => {
              if (onSelectWard) onSelectWard(zone.name);
            }
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: '260px', padding: '4px' }}>
              <div style={{ display: 'flex', itemsCenter: 'center', justifyBetween: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                  {zone.name}
                </h4>
              </div>

              <div style={{ display: 'inline-block', backgroundColor: `${zone.color}20`, color: zone.color, border: `1px solid ${zone.color}50`, padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800', marginBottom: '10px' }}>
                ⭕ Ishwarpur Outbreak Radius: {(zone.radius / 1000).toFixed(1)} km
              </div>

              <div style={{ fontSize: '12px', color: '#475569', display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <strong style={{ color: '#64748b' }}>Total Ward Patients</strong>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{zone.cases}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <strong style={{ color: '#64748b' }}>Primary Disease / Pathogen</strong>
                  <span style={{ fontWeight: '700', color: zone.color }}>{zone.pathogen}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <strong style={{ color: '#64748b' }}>Epidemic Risk Score</strong>
                  <span style={{ color: zone.color, fontWeight: '900', fontSize: '14px' }}>{zone.riskScore}/100</span>
                </div>
              </div>

              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                {zone.notes}
              </p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* AGGREGATED WARD SECTOR NODES (NO PERSONAL PATIENT DATA) */}
      {filters.showHospitals !== false && (
        <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
          {aggregatedWardSectors.map((sec) => (
            <Marker key={sec.id} position={sec.position}>
              <Popup>
                <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: '280px', padding: '4px' }}>
                  {/* Public Health Badge Header */}
                  <div style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', marginBottom: '8px', display: 'flex', itemsCenter: 'center', gap: '4px' }}>
                    🛡️ AGGREGATED PUBLIC HEALTH SURVEILLANCE NODE
                  </div>

                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                    📍 {sec.sectorName}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
                    Ward: <strong style={{ color: '#0f172a' }}>{sec.wardName}</strong>
                  </div>

                  {/* Aggregated Patient Count & Pathogen */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Active Patients</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{sec.activePatients} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>cases</span></div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Surge Status</div>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: sec.riskLevel.includes('Critical') ? '#e11d48' : '#d97706', marginTop: '2px' }}>{sec.riskLevel}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#e11d48', marginBottom: '8px' }}>
                    Pathogen Identified: <span style={{ color: '#0f172a', fontWeight: '700' }}>{sec.primaryPathogen}</span>
                  </div>

                  {/* Public Health Precautions Box */}
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 10px', borderRadius: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', itemsCenter: 'center', gap: '4px' }}>
                      ⚠️ Recommended Public Health Precautions:
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', fontWeight: '600', leading: '1.4' }}>
                      {sec.precautions}
                    </div>
                  </div>

                  {/* Municipal Directive */}
                  <div style={{ fontSize: '10px', color: '#475569', backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: '8px', fontStyle: 'italic' }}>
                    📋 Municipal Action: {sec.municipalDirective}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      )}

      {/* PULSING HEATMAP CENTROIDS */}
      {filters.showHeatmap !== false && aggregatedWardSectors.map((sec, idx) => (
        <React.Fragment key={`pulsing-sec-${idx}`}>
          <CircleMarker
            center={sec.position}
            radius={30}
            pathOptions={{ color: 'none', fillColor: sec.riskLevel.includes('Critical') || sec.riskLevel.includes('High') ? '#e11d48' : '#f59e0b', fillOpacity: 0.14, className: 'animate-pulse' }}
          />
          <CircleMarker
            center={sec.position}
            radius={12}
            pathOptions={{ color: 'none', fillColor: sec.riskLevel.includes('Critical') || sec.riskLevel.includes('High') ? '#e11d48' : '#f59e0b', fillOpacity: 0.5 }}
          />
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
