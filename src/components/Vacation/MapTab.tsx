import React, { Suspense } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import { VacationLocation } from "../../hooks/useLocations";

const VacationMap = React.lazy(() => import("../../VacationMap"));

interface MapTabProps {
  locations: VacationLocation[];
  geoLocations: any[];
  agendas: any[];
  selectedLocation: VacationLocation | null;
  setSelectedLocation: (loc: VacationLocation | null) => void;
}

export const MapTab: React.FC<MapTabProps> = ({
  locations,
  geoLocations,
  agendas,
  selectedLocation,
  setSelectedLocation,
}) => {
  return (
    <Box>
      {locations.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All Locations"
            onClick={() => setSelectedLocation(null)}
            color={selectedLocation === null ? "secondary" : "default"}
            variant={selectedLocation === null ? "filled" : "outlined"}
            sx={{
              fontWeight: 800,
              px: 1,
              py: 2.5,
              borderRadius: 3,
              borderWidth: selectedLocation === null ? 2 : 1,
            }}
          />
          {locations.map((loc) => (
            <Chip
              key={loc.id}
              label={loc.name}
              onClick={() => setSelectedLocation(loc)}
              color={selectedLocation?.id === loc.id ? "secondary" : "default"}
              variant={selectedLocation?.id === loc.id ? "filled" : "outlined"}
              sx={{
                fontWeight: 800,
                px: 1,
                py: 2.5,
                borderRadius: 3,
                borderWidth: selectedLocation?.id === loc.id ? 2 : 1,
              }}
            />
          ))}
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
          }}
        >
          <MapIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Trip Map
          </Typography>
        </Box>
        <Box
          sx={{
            height: { xs: 400, md: 500, lg: 550, xl: 600 },
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "rgba(0,0,0,0.2)",
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ opacity: 0.5 }}>Loading map...</Typography>
              </Box>
            }
          >
            <VacationMap
              locations={geoLocations}
              agendas={agendas}
              selectedLocationId={selectedLocation?.id}
              onSelectLocation={(locId) => {
                const loc = locations.find((l) => l.id === locId);
                if (loc) setSelectedLocation(loc);
              }}
            />
          </Suspense>
        </Box>
      </Paper>
    </Box>
  );
};
