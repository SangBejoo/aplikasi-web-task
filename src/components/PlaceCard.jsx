import React, { useState } from 'react';
import { Card, Typography, Box, Modal } from '@mui/material';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Create custom taxi icon for drivers
const driverIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/?size=100&id=61030&format=png&color=000000',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    // Fallback to taxi material icon
    className: 'driver-marker-fallback taxi-icon'
});

const PlaceCard = ({ place, supplies }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const maxCapacity = 10;
    const occupancyRate = ((place.total || 0) / maxCapacity) * 100;
    const occupancyClass = occupancyRate >= 80 ? 'high' : occupancyRate >= 50 ? 'medium' : 'low';

    // Convert polygon string to coordinates array
    const getPolygonCoordinates = () => {
        if (!place.polygon) return [];
        const coordsString = place.polygon.replace('POLYGON((', '').replace('))', '');
        return coordsString.split(',').map(coord => {
            const [lng, lat] = coord.trim().split(' ');
            return [parseFloat(lat), parseFloat(lng)];
        });
    };

    // Get center position for map from first driver or polygon
    const getMapCenter = () => {
        if (place.driver_locations && place.driver_locations.length > 0) {
            const firstDriver = place.driver_locations[0];
            return [firstDriver.latitude, firstDriver.longitude];
        }
        
        const polygonCoords = getPolygonCoordinates();
        return polygonCoords[0] || [-6.2145, 106.8334];
    };

    // Format date to Indonesian timezone and format
    const formatEntryTime = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    };

    return (
        <>
            <Card 
                onClick={() => setIsModalOpen(true)}
                sx={{ 
                    cursor: 'pointer', 
                    p: 2,
                    '&:hover': { transform: 'translateY(-2px)' },
                    transition: 'transform 0.2s'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        {place.place_name || `Pool Area ${place.place_id}`}
                    </Typography>
                    <Box className={`status ${place.total > 0 ? 'active' : ''} ${occupancyClass}`}>
                        {place.total || 0}/{maxCapacity} Spaces
                    </Box>
                </Box>
                
                <Box>
                    <Typography>Place ID: {place.place_id}</Typography>
                    <Typography>Active Drivers: {place.driver?.length || 0}</Typography>
                </Box>
            </Card>

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
                    <Typography variant="h5" component="h2" gutterBottom>
                        {place.place_name || `Pool Area ${place.place_id}`}
                    </Typography>
                    
                    <Box sx={{ height: 400, mt: 2 }}>
                        <MapContainer
                            center={getMapCenter()}
                            zoom={17}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            {place.polygon && (
                                <Polygon
                                    positions={getPolygonCoordinates()}
                                    pathOptions={{
                                        color: occupancyClass === 'high' ? 'red' :
                                               occupancyClass === 'medium' ? 'orange' : 'green',
                                        fillOpacity: 0.3
                                    }}
                                />
                            )}
                            {supplies?.map((supply) => (
                                <Marker
                                    key={supply.fleet_number}
                                    position={[supply.latitude, supply.longitude]}
                                    icon={driverIcon}
                                >
                                    <Popup>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {supply.fleet_number}
                                            </Typography>
                                            <Typography variant="body2">
                                                Driver: {supply.driver_id}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>
                            ))}
                            {place.driver_locations?.map((driver) => (
                                <Marker
                                    key={driver.driver_id}
                                    position={[driver.latitude, driver.longitude]}
                                    icon={driverIcon}
                                >
                                    <Popup>
                                        <Typography variant="body2">
                                            {driver.driver_id}
                                        </Typography>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6">Details</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            <Typography>ID: {place.id}</Typography>
                            <Typography>Place ID: {place.place_id}</Typography>
                            <Typography>Total Vehicles: {place.total || 0}</Typography>
                            <Typography>Available Spaces: {maxCapacity - (place.total || 0)}</Typography>
                            <Typography>Occupancy Rate: {occupancyRate.toFixed(1)}%</Typography>
                        </Box>
                        
                        {place.driver && place.driver.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6">
                                    Active Drivers ({place.driver.length})
                                </Typography>
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                                    gap: 2, 
                                    mt: 1 
                                }}>
                                    {place.driver.map(driver => (
                                        <Box 
                                            key={driver} 
                                            sx={{
                                                p: 1.5,
                                                bgcolor: 'background.default',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <PersonIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">
                                                    {driver}
                                                </Typography>
                                            </Box>
                                            {place.driver_entry_times?.[driver] && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: 'text.secondary',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                                    <Typography variant="body2">
                                                        Masuk: {formatEntryTime(place.driver_entry_times[driver])}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default PlaceCard;