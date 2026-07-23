import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const dummyWards = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'North Ward',
        cases: 450,
        riskScore: 85, // High Risk (Red)
        predictedTrend: '+12% (Rising)',
        weather: '32°C, Humid',
        hospitalCount: 14
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.23, 17.05], [74.26, 17.05], [74.26, 17.07], [74.23, 17.07], [74.23, 17.05]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Central Ward',
        cases: 210,
        riskScore: 55, // Medium Risk (Orange)
        predictedTrend: '-2% (Stable)',
        weather: '31°C, Clear',
        hospitalCount: 8
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.23, 17.03], [74.26, 17.03], [74.26, 17.05], [74.23, 17.05], [74.23, 17.03]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'South Ward',
        cases: 50,
        riskScore: 20, // Low Risk (Green)
        predictedTrend: '-15% (Declining)',
        weather: '30°C, Clear',
        hospitalCount: 5
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.23, 17.01], [74.26, 17.01], [74.26, 17.03], [74.23, 17.03], [74.23, 17.01]
        ]]
      }
    }
  ]
};

// Generate random dummy hospital/case markers
const dummyMarkers = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  position: [
    17.01 + Math.random() * 0.06, 
    74.22 + Math.random() * 0.06   
  ],
  name: `Clinic ${i + 1}`,
  type: Math.random() > 0.5 ? 'Case Cluster' : 'Hospital'
}));

const MapComponent = ({ filters }) => {
  const getStyle = (feature) => {
    let color = '#22c55e'; // Green
    let fillColor = '#22c55e';
    
    if (feature.properties.riskScore > 75) {
      color = '#ef4444'; // Red
      fillColor = '#ef4444';
    } else if (feature.properties.riskScore > 40) {
      color = '#f97316'; // Orange
      fillColor = '#f97316';
    }

    return {
      color: color,
      weight: 2,
      opacity: 0.8,
      fillColor: fillColor,
      fillOpacity: 0.3,
      dashArray: '3',
    };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties;
    const riskColor = p.riskScore > 75 ? '#ef4444' : p.riskScore > 40 ? '#f97316' : '#22c55e';
    const popupContent = `
      <div style="font-family: 'Outfit', sans-serif; min-width: 220px; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            ${p.name}
          </h4>
          <span style="background-color: ${riskColor}20; color: ${riskColor}; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
            ${p.riskScore > 75 ? 'High Risk' : p.riskScore > 40 ? 'Med Risk' : 'Low Risk'}
          </span>
        </div>
        <div style="font-size: 13px; color: #475569; display: grid; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
            <strong style="color: #64748b; font-weight: 500;">Active Cases</strong>
            <span style="font-size: 15px; font-weight: 700; color: #0f172a;">${p.cases}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
            <strong style="color: #64748b; font-weight: 500;">Risk Score</strong> 
            <span style="color: ${riskColor}; font-weight: 800; font-size: 15px;">
              ${p.riskScore}<span style="font-size: 11px; color: #94a3b8;">/100</span>
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
            <strong style="color: #64748b; font-weight: 500;">Predicted Trend</strong>
            <span style="font-weight: 600; color: ${p.predictedTrend.includes('+') ? '#ef4444' : '#22c55e'}">${p.predictedTrend}</span>
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);
    
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.5,
          weight: 3
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.3,
          weight: 2
        });
      }
    });
  };

  return (
    <MapContainer 
      center={[17.0410, 74.2433]} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
    >
      {/* Light theme tile layer for white/clean feel */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />

      <GeoJSON 
        data={dummyWards} 
        style={getStyle} 
        onEachFeature={onEachFeature} 
      />

      {/* Cluster Markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={40}
        spiderfyOnMaxZoom={true}
      >
        {dummyMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="font-sans text-sm">
                <strong>{marker.name}</strong><br />
                Type: {marker.type}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
      
      {/* Simulated Heatmap Layer (Multi-layered for gradient effect) */}
      {dummyMarkers.map((marker, idx) => (
        <React.Fragment key={`heat-group-${idx}`}>
          <CircleMarker
            center={marker.position}
            radius={35}
            pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.05, className: 'animate-pulse' }}
          />
          <CircleMarker
            center={marker.position}
            radius={20}
            pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.15, className: 'animate-pulse' }}
          />
          <CircleMarker
            center={marker.position}
            radius={8}
            pathOptions={{ color: 'none', fillColor: '#ef4444', fillOpacity: 0.4 }}
          />
        </React.Fragment>
      ))}

    </MapContainer>
  );
};

export default MapComponent;
