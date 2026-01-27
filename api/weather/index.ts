import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_PASSWORD as string)

const WEATHER_CLOSTNEST = 5000 // meters
const EXPIRES_BY = 1200000 // milliseconds

type APIWeatherData = {
    coord: {
        lon: number;
        lat: number;
    };
    weather: [
        {
            id: number;
            main: string;
            description: string;
            icon: string;
        }
    ],
    base: string;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
        sea_level: number;
        grnd_level: number;
    };
    visibility: number;
    wind: {
        speed: number;
        deg: number;
        gust: number;
    };
    rain?: {
        "1h": number;
    };
    snow?: {
        "1h": number;
    };
    clouds: {
        all: number;
    };
    dt: number;
    sys: {
        type: number;
        id: number;
        country: string;
        sunrise: number;
        sunset: number;
    };
    timezone: number;
    id: number;
    name: string;
    cod: number;
};

export type WeatherData = {
    weather_main: string;
    weather_description: string;
    temp: number;
    feels_like: number;
    visibility: number | null;
    wind_speed: number | null;
    deg: number | null;
    gust: number | null;
    rain_1h: number | null;
    snow_1h: number | null;
    clouds: number | null;
    dt: Date;
    expires_at: Date;
    lon: number;
    lat: number;
};

function formatWeatherData(weatherData: APIWeatherData): WeatherData {
    return {
        weather_main: weatherData.weather[0].main,
        weather_description: weatherData.weather[0].description,
        temp: weatherData.main.temp,
        feels_like: weatherData.main.feels_like,
        visibility: weatherData.visibility ?? null,
        wind_speed: weatherData.wind?.speed ?? null,
        deg: weatherData.wind?.deg ?? null,
        gust: weatherData.wind?.gust ?? null,
        rain_1h: weatherData.rain?.['1h'] ?? null,
        snow_1h: weatherData.snow?.['1h'] ?? null,
        clouds: weatherData.clouds.all ?? null,
        dt: new Date(weatherData.dt * 1000),
        expires_at: new Date(Date.now() + EXPIRES_BY),
        lon: weatherData.coord.lon,
        lat: weatherData.coord.lat
    }
}

async function checkDBForData(
    lat: number,
    lon: number
): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .rpc('weather_within_radius', { lon, lat, radius_meters: WEATHER_CLOSTNEST });

        if (error) throw error;
        
        return data?.[0] ?? null;

    } catch (err: any) {
        console.log(`ERROR: ${JSON.stringify(err, null, 2)}`)
    }
    return null;
}

async function storeDataInDB(weatherData: WeatherData) {
    try {
        const { error } = await supabase.rpc('insert_weather_data', 
            weatherData
        );
        
        if (error) throw error;

    } catch (err: any) {
        console.log('Full error object:', JSON.stringify(err, null, 2));
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET" && req.method !== "PUT" && req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        const dbDoc = await checkDBForData(lat, lon);

        if (dbDoc != null) {
            console.log("Fetched from database");
            return res.status(200).json(
                dbDoc
            )
        }

        console.log("Fetched from API to give to database");
        let response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();

        if (data.cod !== 200) {
            console.error("Location not found:", data.message);
            throw "Location not found"
        }

        const formatted_data = formatWeatherData(data);

        await storeDataInDB(formatted_data);
        
        return res.status(200).json(
            formatted_data
        )

    } catch (err: any) {
        console.error("Error creating data:", err);
        return res.status(500).json({ 
            error: "Internal Server Error",
            message: err instanceof Error ? err.message : String(err),
        });
    }
};