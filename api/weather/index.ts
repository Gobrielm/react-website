import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_PASSWORD as string)

const WEATHER_CLOSTNEST = 5000 // meters
const EXPIRES_BY = 600000 // milliseconds

export type WeatherData = {
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

// async function checkDBForData(
//     lat: number,
//     lon: number
// ): Promise<any | null> {
//     try {
//         const { data, error } = await supabase
//             .rpc('get_nearest_weather', { lon, lat, radius: WEATHER_CLOSTNEST });

//         if (error) throw error;

//         return data?.[0] ?? null;

//     } catch (err: any) {
//         console.log(`ERROR: ${err}`)
//     }
//     return null;
// }

// function normalizeWeatherData(data: WeatherData): WeatherDocument {
//     return {
//         coord: {
//             type: "Point",
//             coordinates: [data.coord.lon, data.coord.lat] // Longitude then Latitude for DB
//         },
//         date: new Date(data.dt * 1000),
//         weather: data
//     };
// }

function formatUtcAt16(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}T16:00Z`;
  }

async function fetchElecticityRates(lon: number, lat: number) {
    const now = new Date();

    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const start = formatUtcAt16(startDate);
    const end = formatUtcAt16(endDate);


    const response = await fetch(`https://api.electricitymaps.com/v3/price-day-ahead/forecast?lon=${lon}&lat=${lat} \
        &start=${start}&end=${end}`, 
        {headers: {
            "auth-token": process.env.ELECTRICITY_TOKEN as string,
        }
    });

    const data = await response.json()
    console.log(data);
}



async function storeDataInDB(weatherData: WeatherData) {
    try {
        const { error } = await supabase
            .from('weather_data')
            .insert([{

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
                clouds: weatherData.clouds ?? null,
                dt: weatherData.dt,
                expires_at: EXPIRES_BY,
            }]);
        
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

        // const dbDoc = await checkDBForData(lat, lon);

        // if (dbDoc != null) {
        //     console.log("Fetched from database");
        //     return res.status(200).json(
        //         dbDoc
        //     )
        // }

        await fetchElecticityRates(lon, lat);

        // console.log("Fetched from API to give to database");
        // let response = await fetch(
        //     `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        // );
        // const data = await response.json();

        // if (data.cod !== 200) {
        //     console.error("Location not found:", data.message);
        //     throw "Location not found"
        // }

        // await storeDataInDB(data);
        
        return res.status(200).json(
            {}
        )

    } catch (err: any) {
        console.error("Error creating data:", err);
        return res.status(500).json({ 
            error: "Internal Server Error",
            message: err instanceof Error ? err.message : String(err),
        });
    }
};