import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import PlaceCard from './components/PlaceCard';
import SearchSort from './components/SearchSort';
import './App.css';
import './utils/leaflet-icons';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';

const API_BASE_URL = 'http://localhost:8001/v1';

function App() {
  const [places, setPlaces] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring`);
      const { data } = await response.json();
      setPlaces(data || []);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/summary`);
      const { summary } = await response.json();
      setSummary(summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  useEffect(() => {
    fetchPlaces();
    fetchSummary();

    const intervalId = setInterval(() => {
      fetchPlaces();
      fetchSummary();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const filteredAndSortedPlaces = React.useMemo(() => {
    let result = [...places];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(place => 
        (place.place_name || '').toLowerCase().includes(searchLower) ||
        String(place.place_id).includes(searchLower) ||
        (place.driver || []).some(driver => 
          driver.toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.place_name || '').localeCompare(b.place_name || '');
        case 'occupancy':
          const aRate = ((a.total || 0) / 10) * 100;
          const bRate = ((b.total || 0) / 10) * 100;
          return bRate - aRate;
        case 'drivers':
          return (b.driver?.length || 0) - (a.driver?.length || 0);
        case 'available':
          const aAvailable = 10 - (a.total || 0);
          const bAvailable = 10 - (b.total || 0);
          return bAvailable - aAvailable;
        default:
          return 0;
      }
    });
    
    return result;
  }, [places, searchTerm, sortBy]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          🚗 Parking Space Monitor
        </Typography>
        
        <SearchSort 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        {summary && (
          <Box className="summary-section" sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6">Summary</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography><LocalParkingIcon sx={{ mr: 1 }} />Total Places: {summary.total_places}</Typography>
                <Typography><PersonIcon sx={{ mr: 1 }} />Active Drivers: {summary.total_drivers}</Typography>
              </Box>
              <Box>
                <Typography><DirectionsCarIcon sx={{ mr: 1 }} />Occupied Spaces: {summary.occupied_spaces}</Typography>
                <Typography><DirectionsCarIcon sx={{ mr: 1 }} />Available Spaces: {summary.available_spaces}</Typography>
              </Box>
              <Box>
                <Typography>Utilization Rate: {summary.utilization_rate.toFixed(2)}%</Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 2,
          mt: 3 
        }}>
          {filteredAndSortedPlaces.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </Box>
      </Box>
    </Container>
  );
}

export default App;
