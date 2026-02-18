// Map Display Component
const MapDisplay = ({ coordinates, mapRef, markerRef }) => {
    const mapContainerRef = React.useRef(null);
    
    React.useEffect(() => {
        if (!coordinates || !mapContainerRef.current) return;
        
        // Initialize map if it doesn't exist
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([coordinates.latitude, coordinates.longitude], 13);
            
            // Add CartoDB Voyager tiles (light basemap with bluish tones)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(mapRef.current);
        }
        
        // Update map view and marker
        if (mapRef.current) {
            mapRef.current.setView([coordinates.latitude, coordinates.longitude], 13);
            
            // Remove existing marker if it exists
            if (markerRef.current) {
                mapRef.current.removeLayer(markerRef.current);
            }
            
            // Add new marker
            markerRef.current = L.marker([coordinates.latitude, coordinates.longitude])
                .addTo(mapRef.current);
        }
        
        // Cleanup function
        return () => {
            // Don't remove map on cleanup, just remove marker
            if (markerRef.current && mapRef.current) {
                mapRef.current.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        };
    }, [coordinates, mapRef, markerRef]);
    
    return <div ref={mapContainerRef} className="map-container"></div>;
};

// Current Weather Component
const CurrentWeather = () => {
    const [location, setLocation] = React.useState({ city: null, district: null });
    const [locationError, setLocationError] = React.useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = React.useState(true);
    const [weatherData, setWeatherData] = React.useState(null);
    const [weatherError, setWeatherError] = React.useState(null);
    const [isLoadingWeather, setIsLoadingWeather] = React.useState(false);
    const [coordinates, setCoordinates] = React.useState({ hongKong: null, district: null });
    const [selectedLocation, setSelectedLocation] = React.useState('city'); // 'city' or 'district'
    const [weatherCache, setWeatherCache] = React.useState({ city: null, district: null }); // Cache for weather data
    const [weatherCodeMap, setWeatherCodeMap] = React.useState(null); // Weather code mapping from JSON
    const mapRef = React.useRef(null);
    const markerRef = React.useRef(null);
    
    // Load weather code mapping from JSON file
    React.useEffect(() => {
        fetch('weather_code.json')
            .then(response => response.json())
            .then(data => {
                setWeatherCodeMap(data);
            })
            .catch(error => {
                console.error('Error loading weather_code.json:', error);
            });
    }, []);
    
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    // Weather code to condition text mapping from weather_code.json
    const getWeatherConditionText = (code, isDay = true) => {
        if (!weatherCodeMap) {
            return 'Loading...';
        }
        
        const codeStr = String(code);
        const codeData = weatherCodeMap[codeStr];
        
        if (!codeData) {
            return 'Unknown';
        }
        
        const timeOfDay = isDay ? 'day' : 'night';
        return codeData[timeOfDay]?.description || 'Unknown';
    };
    
    // Format time to "HH AM/PM" format
    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours} ${ampm}`;
    };
    
    // Weather Icon Component with grey-to-white recoloring
    const WeatherIcon = ({ imageUrl, alt }) => {
        const canvasRef = React.useRef(null);
        const [processedImageUrl, setProcessedImageUrl] = React.useState(imageUrl);
        
        React.useEffect(() => {
            if (!imageUrl) return;
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Process each pixel
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Check if pixel is grey (similar R, G, B values)
                    // Grey threshold: pixels where R, G, B are similar
                    const greyThreshold = 30;
                    const isGrey = Math.abs(r - g) < greyThreshold && 
                                  Math.abs(g - b) < greyThreshold && 
                                  Math.abs(r - b) < greyThreshold;
                    
                    // If grey, convert to white (keep alpha)
                    if (isGrey) {
                        data[i] = 255;     // R -> white
                        data[i + 1] = 255; // G -> white
                        data[i + 2] = 255; // B -> white
                        // Keep alpha as is
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                setProcessedImageUrl(canvas.toDataURL());
            };
            img.onerror = () => {
                // Fallback to original image if processing fails
                setProcessedImageUrl(imageUrl);
            };
            img.src = imageUrl;
        }, [imageUrl]);
        
        return <img 
            src={processedImageUrl} 
            alt={alt || 'Weather icon'} 
            style={{width: '100%', height: '100%', objectFit: 'contain'}} 
        />;
    };
    
    // Get weather icon image from weather_code.json
    const getWeatherIcon = (code, isDay = true) => {
        if (!weatherCodeMap) {
            return <div style={{width: '100%', height: '100%', backgroundColor: '#ccc'}}></div>;
        }
        
        const codeStr = String(code);
        const codeData = weatherCodeMap[codeStr];
        
        if (!codeData) {
            return <div style={{width: '100%', height: '100%', backgroundColor: '#ccc'}}></div>;
        }
        
        const timeOfDay = isDay ? 'day' : 'night';
        const imageUrl = codeData[timeOfDay]?.image;
        const alt = codeData[timeOfDay]?.description || 'Weather icon';
        
        if (!imageUrl) {
            return <div style={{width: '100%', height: '100%', backgroundColor: '#ccc'}}></div>;
        }
        
        return <WeatherIcon imageUrl={imageUrl} alt={alt} />;
    };
    
    // Convert wind direction degrees to compass direction
    const getWindDirection = (degrees) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return directions[Math.round(degrees / 22.5) % 16];
    };
    
    // Geocode district name to get coordinates
    const geocodeDistrict = async (districtName, cityName) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(districtName + ', ' + cityName)}&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('Error geocoding district:', error);
            return null;
        }
    };
    
    // Fetch weather data from Open-Meteo API
    // ✅ FETCHED FROM API:
    //   - current.temperature_2m (current temperature)
    //   - current.weather_code (WMO weather code)
    //   - current.is_day (day/night indicator)
    //   - daily.temperature_2m_max (daily high temperature)
    //   - daily.temperature_2m_min (daily low temperature)
    //   - hourly.temperature_2m (hourly temperatures)
    //   - hourly.weather_code (hourly weather codes)
    //   - hourly.is_day (hourly day/night indicators)
    //   - hourly.time (hourly timestamps)
    // ⚠️ NOT PROVIDED BY API (custom implementation):
    //   - Weather condition text strings (mapped from weather_code)
    //   - Weather icons (created as SVG based on weather_code and is_day)
    const fetchWeatherData = async (latitude, longitude, locationType) => {
        setIsLoadingWeather(true);
        setWeatherError(null);
        try {
            // Fetch current weather, daily forecast, and hourly forecast
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=2`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherJson = await weatherResponse.json();
            
            // Log all weather data fetched from API
            console.log('=== WEATHER DATA FETCHED ===');
            console.log('Full API Response:', JSON.stringify(weatherJson, null, 2));
            console.log('Current Weather:', weatherJson.current);
            console.log('Daily Forecast:', weatherJson.daily);
            console.log('Hourly Forecast:', weatherJson.hourly);
            console.log('Latitude:', latitude);
            console.log('Longitude:', longitude);
            console.log('Location Type:', locationType);
            
            const current = weatherJson.current;
            const daily = weatherJson.daily;
            const hourly = weatherJson.hourly;
            
            // Current weather data
            const currentTemp = Math.round(current.temperature_2m);
            const weatherCode = current.weather_code;
            const isDay = current.is_day === 1;
            
            // Daily high/low temperatures
            const highTemp = daily && daily.temperature_2m_max && daily.temperature_2m_max.length > 0 
                ? Math.round(daily.temperature_2m_max[0]) 
                : null;
            const lowTemp = daily && daily.temperature_2m_min && daily.temperature_2m_min.length > 0 
                ? Math.round(daily.temperature_2m_min[0]) 
                : null;
            
            // Hourly forecast data (current hour + next 23 hours = 24 hours total)
            const hourlyForecast = [];
            if (hourly && hourly.time && Array.isArray(hourly.time) && 
                hourly.temperature_2m && Array.isArray(hourly.temperature_2m) &&
                hourly.weather_code && Array.isArray(hourly.weather_code) &&
                hourly.is_day && Array.isArray(hourly.is_day)) {
                
                const now = new Date();
                // Round down to the current hour (remove minutes/seconds)
                const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
                
                let currentHourIndex = -1;
                
                // Find the index of the current hour in the hourly data
                for (let i = 0; i < hourly.time.length; i++) {
                    const hourTime = new Date(hourly.time[i]);
                    // Compare hours (ignore minutes/seconds)
                    const hourTimeRounded = new Date(hourTime.getFullYear(), hourTime.getMonth(), hourTime.getDate(), hourTime.getHours(), 0, 0);
                    
                    if (hourTimeRounded.getTime() >= currentHour.getTime()) {
                        currentHourIndex = i;
                        break;
                    }
                }
                
                // If current hour not found, start from index 0
                if (currentHourIndex === -1) {
                    currentHourIndex = 0;
                }
                
                // Get current hour + next 23 hours (total 24 hours)
                const hoursToShow = Math.min(24, hourly.time.length - currentHourIndex);
                for (let i = currentHourIndex; i < currentHourIndex + hoursToShow; i++) {
                    hourlyForecast.push({
                        time: hourly.time[i],
                        temperature: Math.round(hourly.temperature_2m[i]),
                        weatherCode: hourly.weather_code[i],
                        isDay: hourly.is_day[i] === 1
                    });
                }
                
                console.log('Current hour:', currentHour);
                console.log('Current hour index:', currentHourIndex);
                console.log('Processed hourly forecast:', hourlyForecast);
            } else {
                console.warn('Hourly data missing or incomplete:', { 
                    hasHourly: !!hourly,
                    hasTime: hourly && !!hourly.time,
                    hasTemp: hourly && !!hourly.temperature_2m,
                    hasCode: hourly && !!hourly.weather_code,
                    hasIsDay: hourly && !!hourly.is_day,
                    hourly: hourly
                });
            }
            
            const weatherDataObj = {
                temperature: currentTemp,
                weatherCode: weatherCode,
                isDay: isDay,
                highTemp: highTemp,
                lowTemp: lowTemp,
                hourlyForecast: hourlyForecast
            };
            
            // Log processed weather data
            console.log('=== PROCESSED WEATHER DATA ===');
            console.log('Weather Data Object:', JSON.stringify(weatherDataObj, null, 2));
            console.log('Current Temperature:', currentTemp);
            console.log('Weather Code:', weatherCode);
            console.log('Is Day:', isDay);
            console.log('High Temp:', highTemp);
            console.log('Low Temp:', lowTemp);
            console.log('Hourly Forecast Count:', hourlyForecast.length);
            console.log('Hourly Forecast:', hourlyForecast);
            console.log('==============================');
            
            // Store in cache if locationType is provided
            if (locationType) {
                setWeatherCache(prev => ({
                    ...prev,
                    [locationType]: weatherDataObj
                }));
            }
            
            setWeatherData(weatherDataObj);
            setIsLoadingWeather(false);
        } catch (error) {
            console.error('Error fetching weather:', error);
            setWeatherError('Unable to fetch weather data');
            setIsLoadingWeather(false);
        }
    };
    
    // Load weather data from cache or fetch if not cached
    const loadWeatherData = (locationType, latitude, longitude) => {
        // Check if data is cached
        if (weatherCache[locationType]) {
            console.log(`Loading ${locationType} weather from cache`);
            setWeatherData(weatherCache[locationType]);
            setIsLoadingWeather(false);
            setWeatherError(null);
        } else {
            // Fetch if not cached
            console.log(`Fetching ${locationType} weather data`);
            fetchWeatherData(latitude, longitude, locationType);
        }
    };
    
    // Get user's current location
    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // Reverse geocode using OpenStreetMap Nominatim API
                        // Using zoom=18 for maximum detail to get district information
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                        );
                        const data = await response.json();
                        
                        // Extract city and district separately
                        let city = null;
                        let district = null;
                        
                        if (data.address) {
                            const addr = data.address;
                            
                            // Extract district/suburb/neighborhood (most specific)
                            district = addr.suburb || addr.district || addr.city_district || 
                                      addr.neighbourhood || addr.quarter || addr.borough || null;
                            
                            // Extract city/town/village
                            city = addr.city || addr.town || addr.village || addr.municipality || 
                                   addr.state || addr.county || addr.country || 'Unknown Location';
                            
                            // If city is Hong Kong or similar, use it; otherwise try to find Hong Kong in country/region
                            if (city && (city.toLowerCase().includes('hong kong') || addr.country === 'Hong Kong')) {
                                city = 'Hong Kong';
                            } else if (addr.country === 'Hong Kong') {
                                city = 'Hong Kong';
                            }
                        } else {
                            // Fallback: try to parse display_name
                            const displayName = data.display_name || 'Unknown Location';
                            city = displayName.includes('Hong Kong') ? 'Hong Kong' : displayName.split(',')[0];
                        }
                        
                        setLocation({ city, district });
                        
                        // Store district coordinates
                        const districtCoords = { latitude, longitude };
                        
                        // Use default Hong Kong coordinates
                        const hongKongCoords = { latitude: 22.3194, longitude: 114.1714 };
                        
                        // Store coordinates for both locations
                        setCoordinates({
                            hongKong: hongKongCoords,
                            district: districtCoords
                        });
                        
                        setIsLoadingLocation(false);
                        
                        // Fetch weather data for Hong Kong by default
                        loadWeatherData('city', hongKongCoords.latitude, hongKongCoords.longitude);
                    } catch (error) {
                        console.error('Error fetching location:', error);
                        setLocationError('Unable to determine location name');
                        setIsLoadingLocation(false);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let errorMessage = 'Unable to get your location';
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'Location permission denied';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'Location information unavailable';
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = 'Location request timed out';
                    }
                    setLocationError(errorMessage);
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser');
            setIsLoadingLocation(false);
        }
    }, []);
    
    return (
        <div>
            {isLoadingLocation && (
                <div className="location-display">
                    <span className="location-text">Getting your location...</span>
                </div>
            )}
            {(location.city || location.district) && (
                <div className="location-display">
                    <button 
                        className={`location-button ${selectedLocation === 'city' ? 'selected' : ''}`}
                        onClick={() => {
                            if (coordinates.hongKong && selectedLocation !== 'city') {
                                setSelectedLocation('city');
                                loadWeatherData('city', coordinates.hongKong.latitude, coordinates.hongKong.longitude);
                            }
                        }}
                    >
                        {location.city || 'Hong Kong'}
                    </button>
                    <button 
                        className={`location-button ${selectedLocation === 'district' ? 'selected' : ''}`}
                        onClick={() => {
                            if (coordinates.district && selectedLocation !== 'district') {
                                setSelectedLocation('district');
                                loadWeatherData('district', coordinates.district.latitude, coordinates.district.longitude);
                            }
                        }}
                    >
                        {location.district || 'Unknown District'}
                    </button>
                </div>
            )}
            {locationError && (
                <div className="location-display location-error">
                    <span className="location-text">{locationError}</span>
                </div>
            )}
            <div className="weather-widget">
                {isLoadingWeather ? (
                    <div className="weather-loading">Loading weather data...</div>
                ) : weatherError ? (
                    <div className="weather-error">Error: {weatherError}</div>
                ) : weatherData ? (
                    <>
                        <div className="weather-current">
                            <div className="weather-current-left">
                                <div className="location-name">
                                    {selectedLocation === 'city' ? (location.city || 'Hong Kong') : (location.district || 'Unknown District')}
                                </div>
                                <div className="current-temperature">{weatherData.temperature}°</div>
                            </div>
                            <div className="weather-current-right">
                                <div className="weather-icon-large">
                                    {getWeatherIcon(weatherData.weatherCode, weatherData.isDay)}
                                </div>
                                <div className="weather-condition-text">
                                    {getWeatherConditionText(weatherData.weatherCode, weatherData.isDay)}
                                </div>
                                <div className="high-low-temp">
                                    {weatherData.highTemp !== null && weatherData.lowTemp !== null 
                                        ? `H:${weatherData.highTemp}° L:${weatherData.lowTemp}°`
                                        : '--'
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="weather-separator"></div>
                        <div className="weather-hourly">
                            {weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0 ? (
                                weatherData.hourlyForecast.map((hour, index) => (
                                    <div key={index} className="hourly-item">
                                        <div className="hourly-time">{formatTime(hour.time)}</div>
                                        <div className="hourly-icon">
                                            {getWeatherIcon(hour.weatherCode, hour.isDay)}
                                        </div>
                                        <div className="hourly-temp">{hour.temperature}°</div>
                                    </div>
                                ))
                            ) : (
                                <div className="hourly-loading">Loading hourly forecast...</div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
            {coordinates.hongKong && coordinates.district && (
                <MapDisplay 
                    coordinates={selectedLocation === 'city' ? coordinates.hongKong : coordinates.district}
                    mapRef={mapRef}
                    markerRef={markerRef}
                />
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <CurrentWeather />
);
