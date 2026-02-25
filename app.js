// Panama Consulate Interactive Map
// Developed by Asif Nawaz

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        email: 'asifnawaz1220@gmail.com',
        mapCenter: [37.5, -96],
        mapZoom: 4,
        minZoom: 2,
        maxZoom: 18
    };

    // Consulate data with colors from palette and website URLs
    const CONSULATES = [
        { id: 'new-orleans', name: 'New Orleans', color: '#61331C', url: 'https://www.embassyofpanama.org/consulado-en-new-orleans-louisiana' },
        { id: 'los-angeles', name: 'Los Angeles', color: '#F0544F', url: 'https://www.embassyofpanama.org/consulado-en-los-angeles-california' },
        { id: 'miami', name: 'Miami', color: '#F7B32B', url: 'https://www.embassyofpanama.org/consulado-miami-florida' },
        { id: 'washington-dc', name: 'Washington, DC', color: '#5FA275', url: 'https://www.embassyofpanama.org/consulado-en-washington-dc' },
        { id: 'new-york', name: 'New York City', color: '#457B9D', url: 'https://www.embassyofpanama.org/consulado-en-nueva-york-nueva-york' },
        { id: 'tampa', name: 'Tampa', color: '#A7DADC', url: 'https://www.embassyofpanama.org/consulado-en-tampa-florida' },
        { id: 'houston', name: 'Houston', color: '#E2B786', url: 'https://www.embassyofpanama.org/consulado-en-houston-texas' },
        { id: 'philadelphia', name: 'Philadelphia', color: '#1D3557', url: 'https://www.embassyofpanama.org/consulado-en-philadelphia-penssylvania' }
    ];

    // Basemap configurations
    const BASEMAPS = {
        light: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri'
        }
    };

    // Global variables
    let map;
    let statesLayer;
    let currentBasemap;
    let geojsonData;
    let activeTooltipLayer = null;

    // Initialize the application
    function init() {
        initMap();
        initLegend();
        initLayerControl();
        initCopyButton();
        loadGeoJSON();
    }

    // Initialize Leaflet map
    function initMap() {
        map = L.map('map', {
            center: CONFIG.mapCenter,
            zoom: CONFIG.mapZoom,
            minZoom: CONFIG.minZoom,
            maxZoom: CONFIG.maxZoom,
            zoomControl: true
        });

        // Position zoom control
        map.zoomControl.setPosition('bottomright');

        // Add default basemap (light)
        currentBasemap = L.tileLayer(BASEMAPS.light.url, {
            attribution: BASEMAPS.light.attribution
        }).addTo(map);
    }

    // Load and render GeoJSON data
    function loadGeoJSON() {
        fetch('data/us-states.geojson')
            .then(response => response.json())
            .then(data => {
                geojsonData = data;
                renderStates(data);
            })
            .catch(error => {
                console.error('Error loading GeoJSON:', error);
            });
    }

    // Render state polygons
    function renderStates(data) {
        statesLayer = L.geoJSON(data, {
            style: styleFeature,
            onEachFeature: onEachFeature
        }).addTo(map);
    }

    // Style function for each state
    function styleFeature(feature) {
        return {
            fillColor: feature.properties.color,
            weight: 1,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.75
        };
    }

    // Bind events to each feature
    function onEachFeature(feature, layer) {
        const props = feature.properties;

        layer.on({
            mouseover: function(e) {
                highlightFeature(e);
                showTooltip(e, props);
            },
            mouseout: function(e) {
                resetHighlight(e);
                hideTooltip();
            },
            mousemove: function(e) {
                updateTooltipPosition(e);
            }
        });
    }

    // Custom tooltip element (shows on hover)
    let tooltipEl = null;

    function createTooltipElement() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'custom-map-tooltip';
            tooltipEl.style.cssText = `
                position: fixed;
                background: white;
                border-radius: 6px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                padding: 8px 10px;
                font-family: 'Inter', sans-serif;
                max-width: 200px;
                pointer-events: none;
                z-index: 2000;
                display: none;
                transform: translate(10px, 10px);
            `;
            document.body.appendChild(tooltipEl);
        }
        return tooltipEl;
    }

    function showTooltip(e, properties) {
        const tooltip = createTooltipElement();
        tooltip.innerHTML = `
            <div style="text-align:left;">
                <span style="font-size:11px;font-weight:700;color:#1D3557;display:block;margin-bottom:3px;">${properties.name}</span>
                <span style="font-size:10px;color:#555;line-height:1.4;display:block;">Docs from <strong>${properties.name}</strong> can be authenticated by the Panama consulate in <span style="font-weight:600;color:#457B9D;">${properties.consulate}</span>.</span>
            </div>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = e.originalEvent.clientX + 'px';
        tooltip.style.top = e.originalEvent.clientY + 'px';
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.display = 'none';
        }
    }

    function updateTooltipPosition(e) {
        if (tooltipEl && tooltipEl.style.display !== 'none') {
            tooltipEl.style.left = e.originalEvent.clientX + 'px';
            tooltipEl.style.top = e.originalEvent.clientY + 'px';
        }
    }

    // Highlight state on hover
    function highlightFeature(e) {
        const layer = e.target;

        layer.setStyle({
            weight: 2,
            color: '#1D3557',
            fillOpacity: 0.9
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    // Reset state style
    function resetHighlight(e) {
        statesLayer.resetStyle(e.target);
    }

    // Initialize legend
    function initLegend() {
        const legendContent = document.getElementById('legend-content');
        const legendHeader = document.querySelector('.legend-header');
        const legend = document.getElementById('legend');

        // External link icon SVG
        const externalLinkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

        // Populate legend items
        CONSULATES.forEach(consulate => {
            const item = document.createElement('a');
            item.className = 'legend-item';
            item.href = consulate.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            item.innerHTML = `
                <div class="legend-color" style="background-color: ${consulate.color}"></div>
                <span class="legend-label">${consulate.name}</span>
                <span class="legend-link-icon">${externalLinkIcon}</span>
            `;

            // Hover effect to highlight states (commented out - may enable later)
            // item.addEventListener('mouseenter', () => highlightConsulateStates(consulate.name));
            // item.addEventListener('mouseleave', resetAllStates);

            legendContent.appendChild(item);
        });

        // Toggle legend collapse
        legendHeader.addEventListener('click', () => {
            legend.classList.toggle('collapsed');
        });
    }

    // Highlight all states belonging to a consulate
    function highlightConsulateStates(consulateName) {
        if (!statesLayer) return;

        statesLayer.eachLayer(layer => {
            if (layer.feature.properties.consulate === consulateName) {
                layer.setStyle({
                    weight: 2,
                    color: '#1D3557',
                    fillOpacity: 0.95
                });
                layer.bringToFront();
            } else {
                layer.setStyle({
                    fillOpacity: 0.25
                });
            }
        });
    }

    // Reset all states to default style
    function resetAllStates() {
        if (!statesLayer) return;
        statesLayer.eachLayer(layer => {
            statesLayer.resetStyle(layer);
        });
    }

    // Initialize layer control
    function initLayerControl() {
        const layerOptions = document.querySelectorAll('input[name="basemap"]');

        layerOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                changeBasemap(e.target.value);
            });
        });
    }

    // Change basemap
    function changeBasemap(type) {
        if (currentBasemap) {
            map.removeLayer(currentBasemap);
        }

        const basemapConfig = BASEMAPS[type];
        currentBasemap = L.tileLayer(basemapConfig.url, {
            attribution: basemapConfig.attribution
        }).addTo(map);

        // Ensure states layer is on top
        if (statesLayer) {
            statesLayer.bringToFront();
        }
    }

    // Initialize copy email button
    function initCopyButton() {
        const copyBtn = document.getElementById('copy-btn');
        const copyText = document.getElementById('copy-text');

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(CONFIG.email).then(() => {
                copyText.textContent = 'Email copied!';
                copyText.classList.add('show');

                setTimeout(() => {
                    copyText.classList.remove('show');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy email:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = CONFIG.email;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                copyText.textContent = 'Email copied!';
                copyText.classList.add('show');

                setTimeout(() => {
                    copyText.classList.remove('show');
                }, 2000);
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
