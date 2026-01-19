import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient, ServerApiVersion } from "mongodb";
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.ojghum0.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

const DATATIMEOUT = 3600000; // milliseconds
const WEATHER_CLOSTNEST = 5000 // meters

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== "GET" && req.method !== "PUT" && req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        // Fetch from DB first
        // const db = client.db("admin");
        // const collection = db.collection("weather");

        // let existing = await collection.findOne({
        //     coord: {
        //         $near: {
        //             $geometry: { type: "Point", coordinates: [lon, lat] },
        //             $maxDistance: WEATHER_CLOSTNEST
        //         }
        //     }
        // });

        // if (existing != null && existing != undefined) {
        //     const dateA = new Date();
        //     const dateB = new Date(existing.date);
        //     const isDataNewEnough = (dateB != undefined && (dateB.getTime() - dateA.getTime()) < DATATIMEOUT);
        //     if (isDataNewEnough) {
        //         return NextResponse.json(existing);
        //     }
        // }

        console.log("Fetched from API to give to database");
        let response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();

        if (data.cod !== 200) {
            console.error("City not found:", data.message);
            throw "City not found"
        }
        
        return res.status(200).json({
            data: data
        })

    } catch (err: any) {
        console.error("Error creating data:", err);
        return res.status(500).json({ 
            error: "Internal Server Error",
            message: err instanceof Error ? err.message : String(err),
        });
    }
};