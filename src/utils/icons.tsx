import React from "react";
import FlightIcon from "@mui/icons-material/Flight";
import TrainIcon from "@mui/icons-material/Train";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import HotelIcon from "@mui/icons-material/Hotel";
import NoteIcon from "@mui/icons-material/Note";
import EventNoteIcon from "@mui/icons-material/EventNote";

export const getTravelIcon = (type: string) => {
  switch (type) {
    case "flight":
      return <FlightIcon fontSize="small" />;
    case "train":
      return <TrainIcon fontSize="small" />;
    case "bus":
      return <DirectionsBusIcon fontSize="small" />;
    case "hotel":
      return <HotelIcon fontSize="small" />;
    case "note":
      return <NoteIcon fontSize="small" />;
    default:
      return <EventNoteIcon fontSize="small" />;
  }
};
