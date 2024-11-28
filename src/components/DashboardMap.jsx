import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Typography, Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';

// Custom taxi icon for supplies
const taxiIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/?size=100&id=61030&format=png&color=000000',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'taxi-marker'
});

const DashboardMap = ({ places, supplies }) => {
    const [selectedPlace, setSelectedPlace] = useState(null);

    // Get center position from first place or supply
    const getMapCenter = () => {
        if (supplies.length > 0) {
            return [supplies[0].latitude, supplies[0].longitude];
        }
        if (places.length > 0 && places[0].driver_locations?.length > 0) {
            return [places[0].driver_locations[0].latitude, places[0].driver_locations[0].longitude];
        }
        return [-6.2145, 106.8334]; // Default center
    };

    // Convert polygon string to coordinates
    const getPolygonCoordinates = (polygonString) => {
        if (!polygonString) return [];
        const coordsString = polygonString.replace('POLYGON((', '').replace('))', '');
        return coordsString.split(',').map(coord => {
            const [lng, lat] = coord.trim().split(' ');
            return [parseFloat(lat), parseFloat(lng)];
        });
    };

    return (
        <MapContainer
            center={getMapCenter()}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            
            {/* Render monitoring polygons */}
            {places.map(place => (
                <Polygon
                    key={place.id}
                    positions={getPolygonCoordinates(place.polygon)}
                    pathOptions={{
                        color: 'blue',
                        fillOpacity: 0.2,
                        weight: 2
                    }}
                >
                    <Popup>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {place.place_name}
                        </Typography>
                        <Typography variant="body2">
                            Active Drivers: {place.driver?.length || 0}
                        </Typography>
                    </Popup>
                </Polygon>
            ))}

            {/* Render taxi supply markers */}
            {Array.isArray(supplies) && supplies.map(supply => (
                <Marker
                    key={supply.fleet_number}
                    position={[supply.latitude, supply.longitude]}
                    icon={taxiIcon}
                >
                    <Popup>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                Fleet: {supply.fleet_number}
                            </Typography>
                            <Typography variant="body2">
                                Driver: {supply.driver_id}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Pool ID: {supply.place_id}
                            </Typography>
                        </Box>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default DashboardMap;