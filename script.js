// Current Weather Component
const CurrentWeather = () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    return (
        <div className="current-weather-card">
            <div className="weather-header">
                <h2>CURRENT WEATHER</h2>
                <span className="weather-time">{currentTime}</span>
            </div>
            <div className="weather-content">
                <div className="weather-main">
                    <div className="weather-icon-temp">
                        <div className="weather-icon">
                            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M70 35C72.7614 35 75 32.7614 75 30C75 27.2386 72.7614 25 70 25C69.2 25 68.4 25.2 67.7 25.5C66.3 19.2 60.8 14.5 54.5 14.5C50.2 14.5 46.3 16.5 43.8 19.5C41.3 15.2 36.8 12 32 12C24.3 12 18 18.3 18 26C18 26.4 18 26.8 18.1 27.2C15.2 28.3 13 31.1 13 34.5C13 38.6 16.4 42 20.5 42H70C72.4853 42 74.5 39.9853 74.5 37.5C74.5 35.0147 72.4853 33 70 33V35Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M25 40C27.7614 40 30 37.7614 30 35C30 32.2386 27.7614 30 25 30C24.2 30 23.4 30.2 22.7 30.5C21.3 24.2 15.8 19.5 9.5 19.5C5.2 19.5 1.3 21.5 -1.2 24.5C-3.7 20.2 -8.2 17 -13 17C-20.7 17 -27 23.3 -27 31C-27 31.4 -27 31.8 -26.9 32.2C-29.8 33.3 -32 36.1 -32 39.5C-32 43.6 -28.6 47 -24.5 47H25C27.4853 47 29.5 44.9853 29.5 42.5C29.5 40.0147 27.4853 38 25 38V40Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="temperature-section">
                            <div className="temperature-main">
                                <span className="temperature-value">17</span>
                                <span className="temperature-unit">°</span>
                            </div>
                            <div className="temperature-unit" style={{fontSize: '16px', marginBottom: '0'}}>C</div>
                            <div className="realfeel">RealFeel® 16°</div>
                            <div className="weather-condition">Cloudy</div>
                            <a href="#" className="more-details">MORE DETAILS &gt;</a>
                        </div>
                    </div>
                </div>
                <div className="weather-details">
                    <div className="detail-item">
                        <span className="detail-label">Wind</span>
                        <span className="detail-value">E 16 km/h</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Wind Gusts</span>
                        <span className="detail-value">31 km/h</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Air Quality</span>
                        <span className="detail-value air-quality-poor">Poor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <CurrentWeather />
);
