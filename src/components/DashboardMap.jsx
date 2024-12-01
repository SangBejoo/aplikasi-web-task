import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import DriftMarker from 'react-leaflet-drift-marker';
import L from 'leaflet';
import { Typography, Box, Modal } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get polygon color based on occupancy rate
    const getPolygonColor = (place) => {
        const maxCapacity = 10;
        const occupancyRate = ((place.total || 0) / maxCapacity) * 100;
        
        if (occupancyRate >= 80) return { color: '#c62828', fillColor: '#ffebee' };
        if (occupancyRate >= 50) return { color: '#ef6c00', fillColor: '#fff3e0' };
        return { color: '#2e7d32', fillColor: '#e8f5e9' };
    };

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
        <>
            <MapContainer
                center={getMapCenter()}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                {places.map(place => {
                    const polygonColors = getPolygonColor(place);
                    const occupancyRate = ((place.total || 0) / 10) * 100;

                    return (
                        <Polygon
                            key={place.id}
                            positions={getPolygonCoordinates(place.polygon)}
                            pathOptions={{
                                color: polygonColors.color,
                                fillColor: polygonColors.fillColor,
                                fillOpacity: 0.4,
                                weight: 2
                            }}
                            eventHandlers={{
                                click: () => {
                                    setSelectedPlace(place);
                                    setIsModalOpen(true);
                                },
                                mouseover: (e) => {
                                    const layer = e.target;
                                    layer.setStyle({
                                        fillOpacity: 0.7,
                                        weight: 3
                                    });
                                },
                                mouseout: (e) => {
                                    const layer = e.target;
                                    layer.setStyle({
                                        fillOpacity: 0.4,
                                        weight: 2
                                    });
                                }
                            }}
                        >
                            <Popup>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {place.place_name || `Pool Area ${place.place_id}`}
                                    </Typography>
                                    <Typography variant="body2">
                                        Occupancy: {place.total || 0}/10 ({occupancyRate.toFixed(1)}%)
                                    </Typography>
                                    <Typography variant="body2">
                                        Active Drivers: {place.driver?.length || 0}
                                    </Typography>
                                </Box>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Render taxi supply markers with smooth drift animation */}
                {Array.isArray(supplies) && supplies.map(supply => (
                    <DriftMarker
                        key={supply.fleet_number}
                        position={[supply.latitude, supply.longitude]}
                        icon={taxiIcon}
                        duration={5000} // 5 seconds animation
                        keepAtCenter={false}
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
                    </DriftMarker>
                ))}
            </MapContainer>

            {/* Detail Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="place-detail-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 800,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    p: 4,
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}>
                    {selectedPlace && (
                        <>
                            <Typography variant="h5" component="h2" gutterBottom>
                                {selectedPlace.place_name || `Pool Area ${selectedPlace.place_id}`}
                            </Typography>
                            
                            <Box sx={{ height: 400, mt: 2 }}>
                                <MapContainer
                                    center={getPolygonCoordinates(selectedPlace.polygon)[0]}
                                    zoom={17}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Polygon
                                        positions={getPolygonCoordinates(selectedPlace.polygon)}
                                        pathOptions={{
                                            ...getPolygonColor(selectedPlace),
                                            fillOpacity: 0.3
                                        }}
                                    />
                                    {supplies
                                        ?.filter(s => s.place_id === selectedPlace.place_id)
                                        .map(supply => (
                                            <Marker
                                                key={supply.fleet_number}
                                                position={[supply.latitude, supply.longitude]}
                                                icon={taxiIcon}
                                            >
                                                <Popup>
                                                    <Box>
                                                        <Typography variant="subtitle2">
                                                            Fleet: {supply.fleet_number}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Driver: {supply.driver_id}
                                                        </Typography>
                                                    </Box>
                                                </Popup>
                                            </Marker>
                                        ))}
                                </MapContainer>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6">Details</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    <Typography>ID: {selectedPlace.id}</Typography>
                                    <Typography>Place ID: {selectedPlace.place_id}</Typography>
                                    <Typography>Total Vehicles: {selectedPlace.total || 0}</Typography>
                                    <Typography>Available Spaces: {10 - (selectedPlace.total || 0)}</Typography>
                                    <Typography>
                                        Occupancy Rate: {((selectedPlace.total || 0) / 10 * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                                
                                {selectedPlace.driver && selectedPlace.driver.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6">
                                            Active Drivers ({selectedPlace.driver.length})
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                            {selectedPlace.driver.map(driver => (
                                                <Box key={driver} className="driver-tag">
                                                    <PersonIcon sx={{ mr: 1 }} />
                                                    {driver}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </>
    );
};

export default DashboardMap;