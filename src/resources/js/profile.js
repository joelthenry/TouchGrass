document.addEventListener('DOMContentLoaded', function() {
    // Get all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // Show discoveries tab by default - make sure this is selected initially
    document.getElementById('discoveries-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="discoveries"]').classList.add('active');
    
    // Add click event listeners to each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the tab to show from the data attribute
            const tabToShow = button.getAttribute('data-tab');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Show the selected tab content
            document.getElementById(`${tabToShow}-tab`).classList.remove('hidden');
        });
    });

    // Map Modal Functionality
    const mapModal = document.getElementById('map-modal');
    const closeMapBtn = document.querySelector('.close-map-btn');
    let map = null;
    
    // More robust map initialization function
    function initMap(lat, lng, flowerName, date) {
        console.log('InitMap called with:', { lat, lng, flowerName, date });
        
        try {
            // Convert to number explicitly if needed
            const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
            const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
            
            console.log('Converted coordinates:', { latitude, longitude });
            
            // Check if values are valid numbers
            if (isNaN(latitude) || isNaN(longitude)) {
                throw new Error('Invalid coordinates');
            }
            
            // If map doesn't exist, create it
            if (!map) {
                console.log('Creating new map');
                map = L.map('discovery-map');
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            } else {
                console.log('Using existing map');
                // Clear any existing markers
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });
            }
            
            // Set map view to the flower's coordinates
            console.log('Setting map view to:', latitude, longitude);
            map.setView([latitude, longitude], 14);
            
            // Add marker for the flower location
            const marker = L.marker([latitude, longitude]).addTo(map);
            marker.bindPopup(`<strong>${flowerName}</strong><br>Found on ${date}`).openPopup();
            
            // Update map info
            document.getElementById('map-flower-name').textContent = `Flower: ${flowerName}`;
            document.getElementById('map-date').textContent = `Discovered: ${date}`;
            document.getElementById('map-coordinates').textContent = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            document.getElementById('map-title').textContent = `${flowerName} Location`;
            
            // Show the modal
            mapModal.classList.add('active');
            
            // Wait a moment and then update map size (needed when map is initially hidden)
            setTimeout(() => {
                console.log('Invalidating map size');
                map.invalidateSize();
            }, 300); // Increased timeout for better reliability
            
        } catch (error) {
            console.error('Map initialization error:', error);
            alert('Error initializing map: ' + error.message);
        }
    }
    
    // Debug discovery items with clearer logging
    const discoveryItems = document.querySelectorAll('.discovery-item');
    console.log('Found', discoveryItems.length, 'discovery items');
    
    // Add click event to discovery items
    discoveryItems.forEach((item, index) => {
        // Debug data attributes with more information
        const lat = item.getAttribute('data-lat');
        const lng = item.getAttribute('data-lng');
        const name = item.getAttribute('data-name');
        console.log(`Discovery Item ${index}:`, { 
            name, 
            lat: lat !== null ? lat : 'null',
            lng: lng !== null ? lng : 'null',
            latType: typeof lat,
            lngType: typeof lng,
            hasValidCoords: lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
        });
        
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            
            const lat = this.getAttribute('data-lat');
            const lng = this.getAttribute('data-lng');
            const name = this.getAttribute('data-name');
            const date = this.getAttribute('data-date');
            
            console.log('Clicked discovery with attributes:', { lat, lng, name, date });
            
            // More robust check for valid coordinates
            if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                console.log('Opening map with valid coordinates');
                initMap(parseFloat(lat), parseFloat(lng), name, date);
            } else {
                console.error('Invalid location data:', { lat, lng });
                alert('No valid location data available for this discovery');
            }
        });
    });
    
    // Close map modal when clicking the close button
    closeMapBtn.addEventListener('click', function() {
        mapModal.classList.remove('active');
    });
    
    // Close map modal when clicking outside the map container
    mapModal.addEventListener('click', function(e) {
        if (e.target === mapModal) {
            mapModal.classList.remove('active');
        }
    });
});