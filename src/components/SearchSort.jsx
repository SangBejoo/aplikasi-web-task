import React from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';

const SearchSort = ({ searchTerm, onSearchChange, sortBy, onSortChange }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <TextField
        label="Search places"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flexGrow: 1 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1 }} />
        }}
      />
      
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Sort by</InputLabel>
        <Select
          value={sortBy}
          label="Sort by"
          onChange={(e) => onSortChange(e.target.value)}
          startAdornment={<SortIcon sx={{ mr: 1 }} />}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="occupancy">Occupancy Rate</MenuItem>
          <MenuItem value="drivers">Active Drivers</MenuItem>
          <MenuItem value="available">Available Spaces</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default SearchSort;