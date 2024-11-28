import React, { useState } from 'react';
import { Card, Typography, Box, Modal } from '@mui/material';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';

const PlaceCard = ({ place }) => {
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
                            center={getPolygonCoordinates()[0] || [-6.2145, 106.8334]}
                            zoom={16}
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
                                               occupancyClass === 'medium' ? 'orange' : 'green'
                                    }}
                                />
                            )}
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
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {place.driver.map(driver => (
                                        <Box key={driver} className="driver-tag">
                                            <PersonIcon sx={{ mr: 1 }} />
                                            {driver}
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