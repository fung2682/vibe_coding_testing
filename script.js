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
    
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    // Weather code to condition text mapping (WMO Weather interpretation codes)
    // ⚠️ UNCERTAIN: Open-Meteo provides weather_code but NOT text descriptions - this mapping is custom/estimated
    // The exact text strings like "Mostly Clear" vs "Mainly Clear" are not provided by the API
    const getWeatherConditionText = (code, isDay = true) => {
        const conditions = {
            0: isDay ? 'Clear' : 'Clear',
            1: isDay ? 'Mainly Clear' : 'Mostly Clear',
            2: 'Partly Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Light Drizzle',
            53: 'Moderate Drizzle',
            55: 'Dense Drizzle',
            56: 'Light Freezing Drizzle',
            57: 'Dense Freezing Drizzle',
            61: 'Slight Rain',
            63: 'Moderate Rain',
            65: 'Heavy Rain',
            66: 'Light Freezing Rain',
            67: 'Heavy Freezing Rain',
            71: 'Slight Snow',
            73: 'Moderate Snow',
            75: 'Heavy Snow',
            77: 'Snow Grains',
            80: 'Slight Rain Showers',
            81: 'Moderate Rain Showers',
            82: 'Violent Rain Showers',
            85: 'Slight Snow Showers',
            86: 'Heavy Snow Showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with Hail',
            99: 'Thunderstorm with Heavy Hail'
        };
        return conditions[code] || 'Unknown';
    };
    
    // Format time to "HH AM/PM" format
    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours} ${ampm}`;
    };
    
    // Get weather icon component based on weather code and is_day
    // ⚠️ UNCERTAIN: Open-Meteo does NOT provide icons - this is a custom mapping
    // The exact icon designs (moon with stars, cloud with moon, etc.) are not provided by the API
    // Icons are created as SVG components based on weather_code and is_day values
    const getWeatherIcon = (code, isDay = true) => {
        // Simple SVG icons based on weather code
        if (code === 0) {
            // Clear sky
            return isDay ? (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="25" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
                </svg>
            ) : (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 20 L52 35 L50 30 L48 35 Z" fill="white"/>
                    <circle cx="50" cy="50" r="20" fill="#FFD700" opacity="0.3"/>
                    <circle cx="30" cy="30" r="2" fill="white"/>
                    <circle cx="70" cy="30" r="2" fill="white"/>
                    <circle cx="40" cy="70" r="2" fill="white"/>
                    <circle cx="60" cy="70" r="2" fill="white"/>
                </svg>
            );
        } else if (code === 1) {
            // Mainly clear / Mostly clear
            return isDay ? (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="25" fill="#FFD700" opacity="0.7"/>
                    <ellipse cx="70" cy="40" rx="20" ry="15" fill="white" opacity="0.8"/>
                </svg>
            ) : (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 20 L52 35 L50 30 L48 35 Z" fill="white"/>
                    <ellipse cx="70" cy="40" rx="20" ry="15" fill="white" opacity="0.6"/>
                </svg>
            );
        } else if (code === 2) {
            // Partly cloudy
            return (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {!isDay && <path d="M50 20 L52 35 L50 30 L48 35 Z" fill="white" opacity="0.5"/>}
                    <ellipse cx="60" cy="45" rx="25" ry="18" fill="white" opacity="0.9"/>
                    <ellipse cx="40" cy="50" rx="20" ry="15" fill="white" opacity="0.7"/>
                </svg>
            );
        } else if (code === 3) {
            // Overcast
            return (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="50" cy="50" rx="40" ry="25" fill="white" opacity="0.9"/>
                    <ellipse cx="30" cy="45" rx="30" ry="20" fill="white" opacity="0.7"/>
                    <ellipse cx="70" cy="55" rx="30" ry="20" fill="white" opacity="0.7"/>
                </svg>
            );
        } else {
            // Default cloud icon
            return (
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="50" cy="50" rx="35" ry="22" fill="white" opacity="0.9"/>
                    <ellipse cx="30" cy="50" rx="25" ry="18" fill="white" opacity="0.7"/>
                    <ellipse cx="70" cy="50" rx="25" ry="18" fill="white" opacity="0.7"/>
                </svg>
            );
        }
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
            
            // Debug logging
            console.log('Weather API Response:', weatherJson);
            
            const current = weatherJson.current;
            const daily = weatherJson.daily;
            const hourly = weatherJson.hourly;
            
            console.log('Hourly data:', hourly);
            
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
                        
                        // Geocode Hong Kong city to get its coordinates
                        const hongKongCoords = await geocodeDistrict('Hong Kong', 'Hong Kong');
                        
                        // Store coordinates for both locations
                        setCoordinates({
                            hongKong: hongKongCoords || { latitude: 22.3194, longitude: 114.1714 }, // Fallback to HK center
                            district: districtCoords
                        });
                        
                        setIsLoadingLocation(false);
                        
                        // Fetch weather data for Hong Kong by default
                        const defaultCoords = hongKongCoords || { latitude: 22.3194, longitude: 114.1714 };
                        loadWeatherData('city', defaultCoords.latitude, defaultCoords.longitude);
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
                <div className="coordinates-display">
                    <span className="coordinates-text">
                        Coordinates: {selectedLocation === 'city' 
                            ? `${coordinates.hongKong.latitude.toFixed(4)}, ${coordinates.hongKong.longitude.toFixed(4)}`
                            : `${coordinates.district.latitude.toFixed(4)}, ${coordinates.district.longitude.toFixed(4)}`
                        }
                    </span>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <CurrentWeather />
);
