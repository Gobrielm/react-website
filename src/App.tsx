import { ChangeEvent, KeyboardEvent, useState } from 'react'
import { WeatherData } from './api/weather/index'

function UnitSelector(setUnit: React.Dispatch<React.SetStateAction<boolean>>) {
    const [isCelsuis, setValue] = useState(true);

    const handleChange = () => {
        const newValue = !isCelsuis;
        setValue(newValue);
        setUnit(newValue);
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
    const [lonText, setLonText] = useState('');
    const [latText, setLatText] = useState('');

    const handleLonChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLonText(event.target.value);
    };

    const handleLatChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLatText(event.target.value);
    };

    const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            const lon = Number(lonText);
            const lat = Number(latText);

            if (isNaN(lon) || isNaN(lat)) return;

            await onCoordsSubmit({ lon, lat });
            
            setLonText("");
            setLatText("");
        }
    };

    return (
        <div>
            <label htmlFor="myInput">Enter Lon:</label>
            <input
                type="number"
                id="lonInput"
                value={lonText}
                onChange={handleLonChange}
                placeholder="Enter Lat..."
                onKeyDown={handleKeyDown}
            />

            <label htmlFor="myInput">Enter Lat:</label>
            <input
                type="number"
                id="latInput"
                value={latText}
                onChange={handleLatChange}
                placeholder="Enter Lat..."
                onKeyDown={handleKeyDown}
            />
        </div>
    );
}

const DATATIMEOUT = 3600000;

type Coords = {
    lon: number;
    lat: number;
};

function App() {
    const [weatherData, setWeatherData] = useState<WeatherData>();
    const [isCelsuis, setValue] = useState(true);


    async function GetWeatherData({lon, lat}: Coords) {
        const res = await fetch(`http://localhost:3000/api/weather?lat=${lat}&lon=${lon}`);
        // const res = await fetch(
        //     `/api/weather?lat=${lat}&lon=${lon}`
        // );
    
        if (!res.ok) {
            throw new Error("Failed to fetch weather");
        }
    
        const data = await res.json();
        setWeatherData(data)
    }

    return (
        <div className = "WeatherHomePage">
            <LonLatTextbox onCoordsSubmit={GetWeatherData}/>
            <table id="WeatherDataMenu">
                <tbody>
                    <DisplayWeather data={weatherData} isCelsuis={isCelsuis}/>
                </tbody>
            </table>
        </div>
    );
}

function celsiusToFahrenheit(celsius: number) {
  return (celsius * 9/5) + 32;
}

type DisplayWeatherProps = {
    data?: WeatherData;
    isCelsuis: boolean;
};

function DisplayWeather({data, isCelsuis}: DisplayWeatherProps): React.ReactElement | null {
  if (!data) {
    return null; // nothing until data exists
  }

  let temp = isCelsuis ? data.main.temp: celsiusToFahrenheit(data.main.temp);
  let tempStr = temp.toFixed(1);
  tempStr += isCelsuis ? "°C": "°F";

  return (
        <tr>
            <td>{tempStr}</td>
            <td>{data.weather[0].main}</td>
            <td>{data.weather[0].description}</td>
        </tr>
    );
}

export default App