
import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import PlaceCard from './components/PlaceCard';
import StatsBar from './components/StatsBar';
import SearchSort from './components/SearchSort';
import '../utils/leaflet-icons';
import './App.css';

const API_BASE_URL = 'http://localhost:8001/v1';

function App() {
  const [places, setPlaces] = useState([]);
  const [stats, setStats] = useState({
    totalSpaces: 0,
    activeVehicles: 0,
    activeDrivers: 0
  });

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/monitoring`);
        const { data } = await response.json();
        setPlaces(data);
        updateStats(data);
      } catch (error) {
        console.error('Failed to fetch places:', error);
      }
    };

    fetchPlaces();
  }, []);

  const updateStats = (data) => {
    const totalSpaces = data.reduce((acc, place) => acc + (place.total || 0), 0);
    const activeDrivers = data.reduce((acc, place) => 
      acc + (Array.isArray(place.driver) ? place.driver.length : 0), 0);
    
    setStats({
      totalSpaces,
      activeVehicles: totalSpaces,
      activeDrivers
    });
  };

  return (
    <Container maxWidth="xl">
      <StatsBar stats={stats} />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
        <Box className="monitoring-section">
          <Typography variant="h5" gutterBottom>Live Monitoring</Typography>
          <SearchSort />
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 2,
            mt: 3 
          }}>
            {places.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </Box>
        </Box>

        <Box className="activity-section">
          <Typography variant="h5" gutterBottom>Activity Log</Typography>
          {/* Activity log component will go here */}
        </Box>
      </Box>
    </Container>
  );
}

export default App;