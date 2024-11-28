const API_BASE_URL = 'http://localhost:8001/v1';

// State management
let totalSpaces = 0;
let activeVehicles = 0;

// Update statistics
const updateStats = () => {
    document.getElementById('totalSpaces').textContent = totalSpaces;
    document.getElementById('activeVehicles').textContent = activeVehicles;
};

// Place name mapping helper function
const getPlaceName = (place) => {
    // Fixed: Now accepting the full place object instead of just placeId
    const placeNames = {
        1: 'Sudirman',
        2: 'Thamrin',
        3: 'Kuningan'
    };

    // First try to use place_name from the data
    if (place.place_name) {
        return place.place_name;
    }
    // Then try mapped names
    if (placeNames[place.place_id]) {
        return `Bluebird Pool ${placeNames[place.place_id]}`;
    }
    // Finally fallback to generic name
    return `Pool Area ${place.place_id || '?'}`;
};

// Create place card with more details and capacity
const createPlaceCard = (place) => {
    const maxCapacity = 10; // Set maximum capacity for each parking space
    const occupancyRate = ((place.total || 0) / maxCapacity) * 100;
    const occupancyClass = occupancyRate >= 80 ? 'high' : occupancyRate >= 50 ? 'medium' : 'low';

    const card = document.createElement('div');
    card.className = 'place-card';
    card.innerHTML = `
        <div class="header">
            <h3>${getPlaceName(place)}</h3>
            <span class="status ${place.total > 0 ? 'active' : ''} ${occupancyClass}">
                ${place.total || 0}/${maxCapacity} Spaces
            </span>
        </div>
        <div class="details">
            <div class="occupancy-bar">
                <div class="bar ${occupancyClass}" style="width: ${occupancyRate}%"></div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <i class="material-icons">local_parking</i>
                    <span>ID: ${place.id || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <i class="material-icons">place</i>
                    <span>Place ID: ${place.place_id || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <i class="material-icons">directions_car</i>
                    <span>Available: ${maxCapacity - (place.total || 0)}</span>
                </div>
            </div>
            ${place.driver && place.driver.length > 0 ? `
                <div class="driver-list">
                    <div class="driver-header">
                        <i class="material-icons">person</i>
                        <strong>Active Drivers (${place.driver.length}):</strong>
                    </div>
                    <div class="driver-tags">
                        ${place.driver.map(d => `
                            <span class="driver-tag">
                                <i class="material-icons">account_circle</i>
                                ${d}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="driver-list empty">
                    <span class="no-drivers">No active drivers</span>
                </div>
            `}
        </div>
    `;
    return card;
};

// Enhanced supply update logging with activity type
const addSupplyUpdate = (supply, type = 'update') => {
    const update = document.createElement('div');
    update.className = 'supply-update';
    const timestamp = new Date().toLocaleTimeString();
    
    let actionText = '';
    switch (type) {
        case 'new':
            actionText = '<span class="badge new">New Vehicle</span>';
            break;
        case 'update':
            actionText = '<span class="badge update">Location Update</span>';
            break;
        case 'exit':
            actionText = '<span class="badge exit">Vehicle Exit</span>';
            break;
    }
    
    update.innerHTML = `
        <div class="header">
            ${actionText}
            <div class="timestamp">${timestamp}</div>
        </div>
        <div class="content">
            <p class="fleet"><strong>${supply.fleetNumber}</strong></p>
            <div class="details">
                <span><i class="material-icons">person</i> ${supply.driverId}</span>
                <span><i class="material-icons">local_taxi</i> Type ${supply.placeTypeId}</span>
            </div>
            <p class="location">
                <i class="material-icons">location_on</i>
                ${supply.latitude.toFixed(6)}, ${supply.longitude.toFixed(6)}
            </p>
        </div>
    `;
    
    const suppliesLog = document.getElementById('suppliesLog');
    suppliesLog.insertBefore(update, suppliesLog.firstChild);
    
    // Keep only last 50 updates
    if (suppliesLog.children.length > 50) {
        suppliesLog.removeChild(suppliesLog.lastChild);
    }

    // Update timestamp and flash the log
    document.getElementById('lastUpdate').textContent = timestamp;
    update.classList.add('flash');
    setTimeout(() => update.classList.remove('flash'), 1000);
};

// Add activity to log with safe 10 entry limit
const addActivityLog = (activity) => {
    const logContainer = document.getElementById('activityLog');
    if (!logContainer) return;

    const item = document.createElement('div');
    item.className = `activity-item ${activity.type || ''}`;
    
    const timestamp = new Date(activity.timestamp).toLocaleTimeString();
    
    if (activity.type === 'summary') {
        // Special formatting for summary items
        item.innerHTML = `
            <div class="activity-time">${timestamp}</div>
            <div class="summary-content">
                <div class="summary-header">
                    <i class="material-icons">analytics</i>
                    <span>Parking Space Summary</span>
                </div>
                <div class="summary-stats">
                    <div class="stat-row">
                        <div class="stat-item">
                            <span class="stat-value">${activity.summary.total_places}</span>
                            <span class="stat-label">Total Places</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${activity.summary.total_drivers}</span>
                            <span class="stat-label">Active Drivers</span>
                        </div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-item">
                            <span class="stat-value">${activity.summary.occupied_spaces}</span>
                            <span class="stat-label">Occupied</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${activity.summary.available_spaces}</span>
                            <span class="stat-label">Available</span>
                        </div>
                    </div>
                </div>
                <div class="utilization-wrapper">
                    <div class="utilization-bar ${getUtilizationClass(activity.summary.utilization_rate)}">
                        <div class="bar" style="width: ${activity.summary.utilization_rate}%"></div>
                        <span class="rate">${activity.summary.utilization_rate.toFixed(1)}% Utilization</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Regular activity log content
        item.innerHTML = `
            <div class="activity-time">${timestamp}</div>
            <div class="activity-content">
                <div class="activity-icon">
                    <i class="material-icons">${activity.event_type === 'place_update' ? 'place' : 'directions_car'}</i>
                </div>
                <div class="activity-details">
                    <div class="activity-location">${activity.location}</div>
                    <div class="activity-message">${activity.details}</div>
                </div>
            </div>
        `;
    }

    // Add animation class
    item.classList.add('fade-in');
    logContainer.insertBefore(item, logContainer.firstChild);
    
    // Keep only last 50 items
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }

    document.getElementById('lastUpdate').textContent = timestamp;
};

// Enhanced updateDashboard function with search support
const updateDashboard = async (data) => {
    if (!Array.isArray(data)) {
        console.warn('Invalid data format received');
        return;
    }
    
    const monitoringGrid = document.getElementById('monitoringGrid');
    const monitoringSection = document.querySelector('.monitoring-section');
    if (!monitoringGrid || !monitoringSection) {
        console.error('Required elements not found');
        return;
    }

    // Apply search filter before sorting
    const searchTerm = document.getElementById('searchPlace')?.value.toLowerCase() || '';
    const filteredData = data.filter(place => {
        const placeName = getPlaceName(place).toLowerCase();
        const driverList = (place.driver || []).join(' ').toLowerCase();
        return placeName.includes(searchTerm) || driverList.includes(searchTerm);
    });

    // Store scroll position before updating
    const scrollPos = monitoringGrid.scrollTop;
    
    try {
        const sortedPlaces = sortPlaces(filteredData);
        
        // Update pagination based on filtered results
        pagination.totalPages = Math.ceil(sortedPlaces.length / pagination.itemsPerPage);
        if (pagination.currentPage > pagination.totalPages) {
            pagination.currentPage = Math.max(1, pagination.totalPages);
        }
        
        // Get current page items
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        const currentPageItems = sortedPlaces.slice(startIndex, endIndex);
        
        // Clear grid
        monitoringGrid.innerHTML = currentPageItems.length ? '' : '<div class="no-data">No places found</div>';
        
        // Update stats
        totalSpaces = sortedPlaces.reduce((acc, place) => acc + (place.total || 0), 0);
        activeVehicles = sortedPlaces.reduce((acc, place) => 
            acc + (Array.isArray(place.driver) ? place.driver.length : 0), 0);
        updateStats();
        updateActiveDrivers();
        
        // Render current page items
        currentPageItems.forEach(place => {
            const card = createPlaceCard(place);
            monitoringGrid.appendChild(card);
        });
        
        // Update or create pagination controls
        let paginationControls = monitoringSection.querySelector('.pagination-controls');
        if (paginationControls) {
            paginationControls.remove();
        }
        paginationControls = createPaginationControls();
        monitoringSection.appendChild(paginationControls);
        
        // Restore scroll position
        requestAnimationFrame(() => {
            monitoringGrid.scrollTop = scrollPos;
        });
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
};

// Modify setupSearch to trigger full data search
const setupSearch = () => {
    const searchInput = document.getElementById('searchPlace');
    let debounceTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            // Reset to first page when searching
            pagination.currentPage = 1;
            // Update dashboard with current data but new search term
            updateDashboard(lastMonitoringData);
        }, 300); // Debounce for 300ms
    });
};

// Add log filtering
const setupLogFilters = () => {
    const filterButtons = document.querySelectorAll('.log-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterType = button.dataset.type;
            const items = document.querySelectorAll('.activity-item');
            
            items.forEach(item => {
                switch (filterType) {
                    case 'all':
                        item.style.display = '';
                        break;
                    case 'summary':
                        item.style.display = item.classList.contains('summary') ? '' : 'none';
                        break;
                    case 'monitor':
                        item.style.display = 
                            !item.classList.contains('summary') && 
                            item.querySelector('.badge.monitor') ? '' : 'none';
                        break;
                    case 'driver':
                        item.style.display = 
                            !item.classList.contains('summary') && 
                            item.querySelector('.badge.driver') ? '' : 'none';
                        break;
                }
            });
        });
    });
};

// Enhanced sort places function with better error handling
const sortPlaces = (places) => {
    if (!Array.isArray(places) || places.length === 0) return [];
    
    try {
        return [...places].sort((a, b) => {
            const modifier = currentSort.ascending ? 1 : -1;
            
            switch (currentSort.by) {
                case 'name':
                    const nameA = getPlaceName(a) || '';
                    const nameB = getPlaceName(b) || '';
                    return nameA.localeCompare(nameB) * modifier;
                    
                case 'occupancy':
                    const aRate = ((a.total || 0) / 10) * 100;
                    const bRate = ((b.total || 0) / 10) * 100;
                    return (aRate - bRate) * modifier;
                    
                case 'drivers':
                    const aDrivers = Array.isArray(a.driver) ? a.driver.length : 0;
                    const bDrivers = Array.isArray(b.driver) ? b.driver.length : 0;
                    return (aDrivers - bDrivers) * modifier;
                    
                case 'available':
                    const aAvailable = 10 - (a.total || 0);
                    const bAvailable = 10 - (b.total || 0);
                    return (aAvailable - bAvailable) * modifier;
                    
                default:
                    return 0;
            }
        });
    } catch (error) {
        console.error('Sorting error:', error);
        return places;
    }
};

// Enhanced setup sort controls
const setupSortControls = () => {
    const sortSelect = document.getElementById('sortBy');
    const sortOrderBtn = document.getElementById('sortOrder');
    
    if (!sortSelect || !sortOrderBtn) return;
    
    const applySort = () => {
        if (lastMonitoringData.length === 0) return;
        
        // Add sorting animation
        document.querySelectorAll('.place-card').forEach(card => {
            card.classList.add('sorting');
        });
        
        // Update dashboard while preserving scroll
        updateDashboard(lastMonitoringData);
        
        // Remove animation after sort
        setTimeout(() => {
            document.querySelectorAll('.place-card').forEach(card => {
                card.classList.remove('sorting');
            });
        }, 300);
    };
    
    sortSelect.addEventListener('change', (e) => {
        currentSort.by = e.target.value;
        applySort();
    });
    
    sortOrderBtn.addEventListener('click', () => {
        currentSort.ascending = !currentSort.ascending;
        sortOrderBtn.classList.toggle('descending');
        applySort();
    });
};

// Optimized streamMonitoringUpdates
const streamMonitoringUpdates = () => {
    let eventSource;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000;
    let updateQueue = [];
    let isProcessing = false;

    // Process updates in batches
    const processUpdateQueue = async () => {
        if (isProcessing || !updateQueue.length) return;
        
        isProcessing = true;
        const updates = [...updateQueue];
        updateQueue = [];

        // Group updates by type
        const grouped = updates.reduce((acc, update) => {
            if (!acc[update.EventType]) acc[update.EventType] = [];
            acc[update.EventType].push(update.Data);
            return acc;
        }, {});

        // Process each type
        for (const [type, items] of Object.entries(grouped)) {
            switch (type) {
                case 'new':
                    lastMonitoringData.push(...items);
                    break;
                case 'update':
                    items.forEach(item => {
                        const index = lastMonitoringData.findIndex(p => p.id === item.id);
                        if (index >= 0) lastMonitoringData[index] = item;
                        else lastMonitoringData.push(item);
                    });
                    break;
                case 'removed':
                    const ids = new Set(items.map(i => i.id));
                    lastMonitoringData = lastMonitoringData.filter(p => !ids.has(p.id));
                    break;
            }
        }

        await updateDashboard(lastMonitoringData);
        
        // Add to activity log (only the latest update per place)
        const latestUpdates = Object.values(
            updates.reduce((acc, update) => {
                acc[update.Data.id] = update;
                return acc;
            }, {})
        );

        latestUpdates.forEach(update => {
            addActivityLog({
                ...update.Data,
                type: 'monitoring',
                eventType: update.EventType,
                timestamp: new Date(update.Timestamp).toLocaleTimeString()
            });
        });

        isProcessing = false;
        if (updateQueue.length) processUpdateQueue();
    };

    // Debounced update processing
    let updateTimeout;
    const queueUpdate = (update) => {
        updateQueue.push(update);
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(processUpdateQueue, 100);
    };

    const connect = () => {
        if (eventSource) eventSource.close();
        
        eventSource = new EventSource(`${API_BASE_URL}/monitoring/updates/stream`);
        
        eventSource.addEventListener('open', () => {
            console.log('SSE Connection established');
            retryCount = 0;
        });

        eventSource.addEventListener('monitoring-update', (event) => {
            try {
                const update = JSON.parse(event.data);
                if (update && update.Data) {
                    queueUpdate(update);
                }
            } catch (error) {
                console.error('Failed to parse monitoring update:', error);
            }
        });

        eventSource.onerror = (error) => {
            console.error('SSE Connection error:', error);
            eventSource.close();
            
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(connect, retryDelay * retryCount);
            }
        };
    };

    connect();
    return () => {
        if (eventSource) eventSource.close();
        clearTimeout(updateTimeout);
    };
};

// Add styles for activity log
const style = document.createElement('style');
style.textContent = `
    .supply-update {
        animation: fadeIn 0.3s ease-in-out;
        transition: all 0.5s ease-out;
    }
    
    .supply-update.flash {
        animation: flash 1s ease-in-out;
    }
    
    .supply-update .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    
    .supply-update .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .badge.new { background: #e3f2fd; color: #1976d2; }
    .badge.update { background: #f5f5f5; color: #616161; }
    .badge.exit { background: #ffebee; color: #c62828; }
    
    .supply-update .content {
        background: white;
        padding: 10px;
        border-radius: 4px;
    }
    
    .supply-update .fleet {
        color: var(--primary);
        font-size: 16px;
        margin-bottom: 4px;
    }
    
    .supply-update .details {
        display: flex;
        gap: 16px;
        margin: 8px 0;
    }
    
    .supply-update .details span {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .supply-update .location {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666;
        font-size: 13px;
    }
    
    .supply-update .material-icons {
        font-size: 16px;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes flash {
        0% { background: var(--background); }
        50% { background: #e3f2fd; }
        100% { background: var(--background); }
    }

    .fade-out {
        animation: fadeOut 0.5s ease-out forwards;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }

    .place-card .status.high { background: #ffebee; color: #c62828; }
    .place-card .status.medium { background: #fff3e0; color: #ef6c00; }
    .place-card .status.low { background: #e8f5e9; color: #2e7d32; }

    .occupancy-bar {
        height: 4px;
        background: #eee;
        border-radius: 2px;
        margin: 8px 0;
    }

    .occupancy-bar .bar {
        height: 100%;
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .occupancy-bar .bar.high { background: #ef5350; }
    .occupancy-bar .bar.medium { background: #ffa726; }
    .occupancy-bar .bar.low { background: #66bb6a; }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin: 8px 0;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
    }

    .driver-header {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        color: var(--primary);
    }

    .driver-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .driver-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: var(--background);
        border-radius: 12px;
        font-size: 12px;
    }

    .driver-tag .material-icons {
        font-size: 14px;
    }

    .no-drivers {
        color: #666;
        font-style: italic;
        font-size: 13px;
    }

    .monitoring-update, .supply-update {
        padding: 12px;
        border-radius: 8px;
        background: white;
        margin-bottom: 8px;
    }

    .occupancy-info {
        display: flex;
        gap: 16px;
        margin: 8px 0;
    }

    .driver-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--background);
        padding: 4px 8px;
        border-radius: 12px;
        margin: 2px;
        font-size: 12px;
    }

    .vehicle-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .location-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 13px;
    }

    .fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
`;

const additionalStyles = `
    .badge.removed { 
        background: #ffebee; 
        color: #c62828; 
    }
    
    .monitoring-update.removed {
        background: #fff5f5;
    }
    
    .place-card.removing {
        animation: slideOut 0.3s ease-out forwards;
    }
    
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

style.textContent += additionalStyles;

document.head.appendChild(style);

// Add sorting state
let currentSort = {
    by: 'name',
    ascending: true
};

// Store last monitoring data
let lastMonitoringData = [];

// Add pagination state
let pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
};

// Add pagination controls
const createPaginationControls = () => {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<span class="material-icons">chevron_left</span>';
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = pagination.currentPage === 1;
    prevBtn.onclick = () => changePage(pagination.currentPage - 1);
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<span class="material-icons">chevron_right</span>';
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = pagination.currentPage === pagination.totalPages;
    nextBtn.onclick = () => changePage(pagination.currentPage + 1);
    
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);
    
    return paginationDiv;
};

// Add change page function
const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    pagination.currentPage = newPage;
    updateDashboard(lastMonitoringData);
};

// Initialize dashboard with enhanced features
const init = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/monitoring`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { data } = await response.json();
        
        // Initialize lastMonitoringData
        lastMonitoringData = Array.isArray(data) ? [...data] : [];
        
        // Update dashboard with initial data
        await updateDashboard(lastMonitoringData);
        
        // Setup all controls
        setupSearch();
        setupLogFilters();
        setupSortControls();
        setupActivityLog(); // This now handles summary updates
        initializeNotifications();
        
        // Start streaming
        connectToMonitoringStream();
        
        // Update initial timestamp
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        // Show error message to user
        const monitoringGrid = document.getElementById('monitoringGrid');
        if (monitoringGrid) {
            monitoringGrid.innerHTML = '<div class="error-message">Failed to load dashboard. Retrying...</div>';
        }
        // Retry initialization after 5 seconds
        setTimeout(init, 5000);
    }
};

// Add updateActiveDrivers function
const updateActiveDrivers = () => {
    const totalDrivers = lastMonitoringData.reduce((acc, place) => 
        acc + (Array.isArray(place.driver) ? place.driver.length : 0), 0);
    const activeDriversElement = document.getElementById('activeDrivers'); // Changed from 'activeVehicles'
    if (activeDriversElement) {
        activeDriversElement.textContent = totalDrivers;
    }
};

// Start the application
init();

// Add styles for pagination
const paginationStyles = `
    .pagination-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
        padding: 10px;
    }

    .pagination-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .pagination-btn:not(:disabled):hover {
        background: var(--primary);
        color: white;
    }

    .page-info {
        font-size: 14px;
        color: var(--text);
    }
`;

// Add pagination styles to existing styles
style.textContent += paginationStyles;

// Add reconnection handling configuration
const SSE_CONFIG = {
    maxRetries: 5,
    retryInterval: 2000,
    backoffMultiplier: 1.5,
    maxBackoff: 10000
};

// Modify streamMonitoring function
const streamMonitoring = () => {
    let retryCount = 0;
    let retryTimeout;

    const connect = () => {
        if (retryCount >= SSE_CONFIG.maxRetries) {
            console.error('Max retries reached for monitoring stream');
            return;
        }

        const eventSource = new EventSource(`${API_BASE_URL}/monitoring/stream/sse`);
        
        eventSource.onopen = () => {
            console.log('Monitoring stream connected');
            retryCount = 0; // Reset retry count on successful connection
        };

        eventSource.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && Array.isArray(data.data)) {
                    updateDashboard(data.data);
                }
            } catch (error) {
                console.error('Failed to parse monitoring data:', error);
            }
        });

        eventSource.onerror = (error) => {
            console.error('Monitoring stream error:', error);
            eventSource.close();
            
            // Calculate exponential backoff
            const backoff = Math.min(
                SSE_CONFIG.retryInterval * Math.pow(SSE_CONFIG.backoffMultiplier, retryCount),
                SSE_CONFIG.maxBackoff
            );
            
            console.log(`Reconnecting monitoring stream in ${backoff}ms (attempt ${retryCount + 1})`);
            
            clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
                retryCount++;
                connect();
            }, backoff);
        };

        return eventSource;
    };

    const eventSource = connect();

    // Cleanup function
    return () => {
        if (eventSource) {
            eventSource.close();
        }
        clearTimeout(retryTimeout);
    };
};

// Modify streamSupplies function with similar reconnection logic
const streamSupplies = () => {
    let retryCount = 0;
    let retryTimeout;
    const vehicleStates = new Map();

    const connect = () => {
        if (retryCount >= SSE_CONFIG.maxRetries) {
            console.error('Max retries reached for supplies stream');
            return;
        }

        const eventSource = new EventSource(`${API_BASE_URL}/supplies/stream/sse`);
        
        eventSource.onopen = () => {
            console.log('Supplies stream connected');
            retryCount = 0; // Reset retry count on successful connection
        };

        // ...existing handleSupplyUpdate code...

        eventSource.addEventListener('message', (event) => {
            try {
                const supply = JSON.parse(event.data);
                handleSupplyUpdate(supply);
            } catch (error) {
                console.error('Failed to parse supply data:', error);
            }
        });

        eventSource.onerror = (error) => {
            console.error('Supply stream error:', error);
            eventSource.close();
            
            // Calculate exponential backoff
            const backoff = Math.min(
                SSE_CONFIG.retryInterval * Math.pow(SSE_CONFIG.backoffMultiplier, retryCount),
                SSE_CONFIG.maxBackoff
            );
            
            console.log(`Reconnecting supplies stream in ${backoff}ms (attempt ${retryCount + 1})`);
            
            clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
                retryCount++;
                connect();
            }, backoff);
        };

        return eventSource;
    };

    const eventSource = connect();

    // Cleanup function
    return () => {
        if (eventSource) {
            eventSource.close();
        }
        clearTimeout(retryTimeout);
    };
};

// Add heartbeat check for stream health
const addHeartbeatCheck = (eventSource, streamName) => {
    let heartbeatTimeout;
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds

    const resetHeartbeat = () => {
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = setTimeout(() => {
            console.warn(`${streamName}: No heartbeat received, reconnecting...`);
            eventSource.close();
        }, HEARTBEAT_INTERVAL);
    };

    eventSource.addEventListener('message', resetHeartbeat);
    resetHeartbeat();

    return () => clearTimeout(heartbeatTimeout);
};

// Update the monitoring stream connection with error handling and reconnection logic
function connectToMonitoringStream() {
    const monitoringSource = new EventSource(`${API_BASE_URL}/monitoring/stream/sse`, {
        withCredentials: false,
        headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
        }
    });
    
    monitoringSource.onopen = () => {
        console.log('Monitoring stream connected');
    };

    monitoringSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data && Array.isArray(data.data)) {
                lastMonitoringData = data.data;
                updateDashboard(data.data);
            }
        } catch (error) {
            console.error('Failed to parse monitoring data:', error);
        }
    };

    monitoringSource.onerror = (error) => {
        console.error('Monitoring stream error:', error);
        monitoringSource.close();
        // Add exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(connectToMonitoringStream, backoffDelay);
    };

    return monitoringSource;
}

// Add activity log functionality
function setupActivityLog() {
    const fetchAndUpdateLog = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/monitoring/summary`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.status === 'success') {
                updateSummaryDisplay(data);
                addActivityLog({
                    type: 'summary',
                    timestamp: data.timestamp,
                    summary: data.summary
                });
            }
        } catch (error) {
            console.error('Failed to fetch activity summary:', error);
        }
    };

    // Initial fetch
    fetchAndUpdateLog();
    
    // Update every 30 seconds
    const intervalId = setInterval(fetchAndUpdateLog, 30000);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
}

// Initialize notifications
function initializeNotifications() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Add monitoring summary functionality
async function fetchMonitoringSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/monitoring/summary`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.status === 'success') {
            updateSummaryDisplay(data);
            addActivityLog({
                type: 'summary',
                event_type: 'monitoring_summary',
                timestamp: data.timestamp,
                details: `Utilization: ${data.summary.utilization_rate.toFixed(1)}%, Active Drivers: ${data.summary.total_drivers}`,
                location: 'System',
                summary: data.summary
            });
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}

// Add periodic summary fetch
function startPeriodicSummaryUpdates() {
    // Initial fetch
    fetchMonitoringSummary();
    
    // Update every 5 minutes
    setInterval(fetchMonitoringSummary, 5 * 60 * 1000);
}

// Update init function (remove duplicate)
init = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/monitoring`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { data } = await response.json();
        
        lastMonitoringData = Array.isArray(data) ? [...data] : [];
        await updateDashboard(lastMonitoringData);
        
        setupSearch();
        setupLogFilters();
        setupSortControls();
        setupActivityLog(); // This now handles summary updates
        initializeNotifications();
        
        connectToMonitoringStream();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Failed to initialize:', error);
        const monitoringGrid = document.getElementById('monitoringGrid');
        if (monitoringGrid) {
            monitoringGrid.innerHTML = '<div class="error-message">Failed to load dashboard. Retrying...</div>';
        }
        setTimeout(init, 5000);
    }
};

// Start the application
init();

// Add these styles at the end of your existing style definitions
const activityLogStyles = `
    #activityLog {
        max-height: 500px;
        overflow-y: auto;
        padding: 16px;
    }

    .activity-item {
        background: white;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(-20px);
    }

    .activity-time {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
    }

    .activity-content {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .activity-icon {
        padding: 8px;
        border-radius: 50%;
        background: #f5f5f5;
    }

    .activity-details {
        flex: 1;
    }

    .activity-location {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .activity-message {
        color: #666;
        font-size: 14px;
    }

    .driver_entered {
        border-left: 4px solid #4caf50;
    }

    .driver_left {
        border-left: 4px solid #f44336;
    }

    .place_update {
        border-left: 4px solid #2196f3;
    }
`;

// Add activity log styles to existing styles
style.textContent += activityLogStyles;

// Add updateSummaryDisplay function
function updateSummaryDisplay(data) {
    if (!data || !data.summary) return;

    const summaryContainer = document.getElementById('monitoringSummary');
    if (!summaryContainer) return;

    const summary = data.summary;
    const utilizationClass = summary.utilization_rate >= 80 ? 'high' : 
                           summary.utilization_rate >= 50 ? 'medium' : 'low';

    summaryContainer.innerHTML = `
        <div class="summary-header">
            <i class="material-icons">analytics</i>
            <h3>Current Status</h3>
            <span class="timestamp">${new Date(data.timestamp).toLocaleString()}</span>
        </div>
        <div class="summary-grid">
            <div class="stat-item">
                <span class="stat-value">${summary.total_places}</span>
                <span class="stat-label">Total Places</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${summary.total_drivers}</span>
                <span class="stat-label">Active Drivers</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${summary.occupied_spaces}</span>
                <span class="stat-label">Occupied</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${summary.available_spaces}</span>
                <span class="stat-label">Available</span>
            </div>
        </div>
        <div class="utilization-wrapper">
            <div class="utilization-bar ${utilizationClass}">
                <div class="bar" style="width: ${summary.utilization_rate}%"></div>
                <span class="rate">${summary.utilization_rate.toFixed(1)}% Utilization</span>
            </div>
        </div>
    `;

    summaryContainer.classList.add('fade-in');
}

// Add new styles for monitoring summary display
const summaryDisplayStyles = `
    #monitoringSummary {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }

    .summary-header h3 {
        margin: 0;
        flex: 1;
    }

    .summary-header .timestamp {
        font-size: 0.8em;
        color: #666;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;
    }

    .stat-item {
        text-align: center;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
    }

    .stat-value {
        font-size: 1.5em;
        font-weight: 600;
        color: var(--primary);
        display: block;
    }

    .stat-label {
        font-size: 0.9em;
        color: #666;
        margin-top: 4px;
        display: block;
    }
`;

// Add the new styles
style.textContent += summaryDisplayStyles;
