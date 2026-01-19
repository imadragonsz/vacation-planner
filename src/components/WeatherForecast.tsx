import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Tooltip,
  Stack,
} from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import GrainIcon from "@mui/icons-material/Grain";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";

interface WeatherForecastProps {
  lat: number;
  lng: number;
}

interface WeatherData {
  currentTemp: number;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
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
  if (code >= 1 && code <= 3)
    return "Mainly clear, partly cloudy, and overcast";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 75) return "Snow fall";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Clear";
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({ lat, lng }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const result = await response.json();

        if (result.current_weather) {
          setData({
            currentTemp: result.current_weather.temperature,
            maxTemp: result.daily.temperature_2m_max[0],
            minTemp: result.daily.temperature_2m_min[0],
            weatherCode: result.current_weather.weathercode,
          });
          setError(false);
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [lat, lng]);

  if (loading) return <CircularProgress size={20} sx={{ ml: 2 }} />;
  if (error || !data) return null;

  return (
    <Tooltip title={getWeatherDescription(data.weatherCode)}>
      <Card
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 3,
          px: 2,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          cursor: "default",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {getWeatherIcon(data.weatherCode)}
        </Box>
        <Stack spacing={-0.5}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "#fff" }}>
            {data.currentTemp}°C
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700 }}>
            {data.minTemp}° / {data.maxTemp}°
          </Typography>
        </Stack>
      </Card>
    </Tooltip>
  );
};

export default WeatherForecast;
