import React, { useState, useEffect } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import GrainIcon from "@mui/icons-material/Grain";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import { addToGeocodeQueue } from "../../../utils/geocoder";

interface WeatherWidgetProps {
  destination: string;
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return <WbSunnyIcon sx={{ color: "#ffb300" }} />;
  if (code >= 1 && code <= 3) return <CloudIcon sx={{ color: "#90a4ae" }} />;
  if (code >= 45 && code <= 48) return <CloudIcon sx={{ color: "#78909c" }} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <GrainIcon sx={{ color: "#4fc3f7" }} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
    return <AcUnitIcon sx={{ color: "#e3f2fd" }} />;
  if (code >= 95) return <ThunderstormIcon sx={{ color: "#5c6bc0" }} />;
  return <WbSunnyIcon sx={{ color: "#ffb300" }} />;
};

const getWeatherDescription = (code: number) => {
  if (code === 0) return "Clear sky";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 75) return "Snow fall";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Clear";
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ destination }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!destination) return;
      setLoading(true);
      try {
        // 1. Geocode the destination name to coordinates
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          destination,
        )}&format=json&limit=1`;
        const geoResults = await addToGeocodeQueue(searchUrl);

        if (geoResults && geoResults.length > 0) {
          const { lat, lon } = geoResults[0];

          // 2. Fetch weather using coordinates from Open-Meteo
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max&timezone=auto`,
          );
          const result = await response.json();
          setWeather(result);
        } else {
          setWeather(null);
        }
      } catch (err) {
        console.error("Error fetching dashboard weather:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destination]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#ca1d49" }} />
      </Box>
    );
  }

  if (!weather || !weather.current_weather) {
    return (
      <Box sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>
        <Typography variant="body2">
          No weather data for {destination || "your trip"}.
        </Typography>
      </Box>
    );
  }

  const current = weather.current_weather;
  const humidity = weather.daily?.relative_humidity_2m_max?.[0];

  return (
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: "rgba(202, 29, 73, 0.1)",
              color: "#ca1d49",
              display: "flex",
            }}
          >
            {getWeatherIcon(current.weathercode)}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {Math.round(current.temperature)}°C
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, textTransform: "capitalize" }}
            >
              {getWeatherDescription(current.weathercode)} in {destination}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ opacity: 0.6 }}
            >
              <WaterDropIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">Humidity</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {humidity !== undefined ? `${humidity}%` : "--"}
            </Typography>
          </Box>
          <Box>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ opacity: 0.6 }}
            >
              <AirIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">Wind</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {Math.round(current.windspeed)} km/h
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default WeatherWidget;
