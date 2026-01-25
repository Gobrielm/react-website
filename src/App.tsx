import { ChangeEvent, KeyboardEvent, useState, useEffect } from 'react'
import { WeatherData } from '../api/weather/index'

type UnitSelectorFunc = {
    setUnit: React.Dispatch<React.SetStateAction<boolean>>;
};

function UnitSelector(setUnit: UnitSelectorFunc) {
    const [isFahrenheit, setValue] = useState(false);

    const handleChange = () => {
        const newValue = !isFahrenheit;
        setValue(newValue);
        setUnit.setUnit(newValue);
    }

    return (
        <>
            <label className="TempSwitch">
                Fahrenheit
                <input type="checkbox"
                    onChange={handleChange}
                />
            </label>
        </>
    )
}

type LonLatTextboxProps = {
    onCoordsSubmit: (coords: Coords) => Promise<void>;
};

function LonLatTextbox({onCoordsSubmit}: LonLatTextboxProps) {
    const [latText, setLatText] = useState('');
    const [lonText, setLonText] = useState('');

    const handleLatChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLatText(event.target.value);
    };


    const handleLonChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLonText(event.target.value);
    };

    const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            const lat = Number(latText);
            const lon = Number(lonText);

            if (isNaN(lon) || isNaN(lat)) return;

            await onCoordsSubmit({ lon, lat });
            
            setLatText("");
            setLonText("");
        }
    };

    return (
        <div>
            <label htmlFor="myInput">Enter Lat:</label>
            <input
                type="number"
                id="latInput"
                value={latText}
                onChange={handleLatChange}
                placeholder="Enter Lat..."
                onKeyDown={handleKeyDown}
            />
            
            <label htmlFor="myInput">Enter Lon:</label>
                <input
                type="number"
                id="lonInput"
                value={lonText}
                onChange={handleLonChange}
                placeholder="Enter Lat..."
                onKeyDown={handleKeyDown}
            />
        </div>
    );
}

type Coords = {
    lat: number;
    lon: number;
};

function App() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isFahrenheit, setValue] = useState(false);

    async function GetWeatherData({lat, lon}: Coords) {
        console.log("AAA");
        const res = await fetch(
            `/api/weather?lat=${lat}&lon=${lon}`
        );
    
        if (!res.ok) {
            throw new Error("Failed to fetch weather");
        }
    
        const data = await res.json();
        // setWeatherData(data)
    }

    function fetchDataForCurrentLocation(location: GeolocationPosition) {
        const lat = location.coords.latitude
        const lon = location.coords.longitude
        GetWeatherData({lat, lon})
    }

    useEffect(() => {
        if (!weatherData) {
            navigator.geolocation.getCurrentPosition(fetchDataForCurrentLocation);
        }
    }, [weatherData]);

    return (
        <div className = "WeatherHomePage">
            <UnitSelector setUnit={setValue}/>
            <LonLatTextbox onCoordsSubmit={GetWeatherData}/>
            <table id="WeatherDataMenu">
                <tbody>
                    <DisplayWeather data={weatherData} isFahrenheit={isFahrenheit}/>
                </tbody>
            </table>
        </div>
    );
}

function celsiusToFahrenheit(celsius: number) {
  return (celsius * 9/5) + 32;
}

type DisplayWeatherProps = {
    data: WeatherData | null;
    isFahrenheit: boolean;
};

function DisplayWeather({data, isFahrenheit}: DisplayWeatherProps): React.ReactElement | null {
    if (!data) {
        return null; // nothing until data exists
    }

    let temp = isFahrenheit ? celsiusToFahrenheit(data.main.temp): data.main.temp;
    let tempStr = temp.toFixed(1);
    tempStr += isFahrenheit ? "°F": "°C";

    return (
        <tr>
            <td>{tempStr}</td>
            <td>{data.weather[0].description}</td>
        </tr>
    );
}

export default App