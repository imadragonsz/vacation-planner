import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { Responsive } from "react-grid-layout";
import { supabase } from "../../supabaseClient";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";

import { WidgetContainer } from "./WidgetContainer";
import SummaryWidget from "./Library/SummaryWidget";
import RecentExplorationsWidget from "./Library/RecentExplorationsWidget";
import UpcomingItineraryWidget from "./Library/UpcomingItineraryWidget";
import BudgetOverviewWidget from "./Library/BudgetOverviewWidget";
import WeatherWidget from "./Library/WeatherWidget";
import ActivityVotingWidget from "./Library/ActivityVotingWidget";
import NotificationWidget from "./Library/NotificationWidget";
import CountdownWidget from "./Library/CountdownWidget";
import TimerIcon from "@mui/icons-material/Timer";

import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";

const GlobalStyles = () => (
  <style>{`
    .react-resizable-handle {
      position: absolute;
      width: 24px;
      height: 24px;
      bottom: 2px;
      right: 2px;
      background: rgba(202, 29, 73, 0.1);
      border-radius: 4px;
      cursor: se-resize;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .react-resizable-handle::after {
      content: "";
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(255, 255, 255, 0.6);
      border-bottom: 2px solid rgba(255, 255, 255, 0.6);
      transform: translate(-1px, -1px);
    }
    .react-resizable-handle:hover {
      background: rgba(202, 29, 73, 0.3);
    }
    .react-resizable-handle:hover::after {
      border-color: #ca1d49;
    }
    .layout.locked .react-resizable-handle {
      display: none !important;
    }
    .layout .react-grid-item {
      cursor: default;
    }
    .layout:not(.locked) .react-grid-item {
      cursor: move;
    }
  `}</style>
);

interface DashboardWidgetsProps {
  user: any;
  vacations: any[];
  onSelectVacation: (vac: any) => void;
  onNavigate?: (path: string) => void;
}

const DEFAULT_WIDGETS = [
  {
    widget_id: "summary",
    type: "summary",
    title: "Trip Summary",
    layout: { x: 0, y: 0, w: 4, h: 3 },
  },
  {
    widget_id: "recent",
    type: "recent",
    title: "Recent Explorations",
    layout: { x: 4, y: 0, w: 8, h: 3 },
  },
];

const DEFAULT_LAYOUTS = {
  lg: DEFAULT_WIDGETS.map((widget) => ({
    i: widget.widget_id,
    ...widget.layout,
  })),
};

const applyInteractivityFlagsToLayouts = (
  nextLayouts: any,
  isInteractive: boolean,
) => {
  const flaggedLayouts: any = {};

  for (const [breakpoint, items] of Object.entries(nextLayouts || {})) {
    flaggedLayouts[breakpoint] = Array.isArray(items)
      ? (items as any[]).map((item) => ({
          ...item,
          isDraggable: isInteractive,
          isResizable: isInteractive,
        }))
      : items;
  }

  return flaggedLayouts;
};

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  user,
  vacations,
  onSelectVacation,
  onNavigate,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [dbWidgets, setDbWidgets] = useState<any[]>(DEFAULT_WIDGETS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [layouts, setLayouts] = useState<any>(DEFAULT_LAYOUTS);
  const [originalLayouts, setOriginalLayouts] = useState<any>(null);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const renderedLayouts = useMemo(
    () => applyInteractivityFlagsToLayouts(layouts, isEditMode),
    [layouts, isEditMode],
  );

  useEffect(() => {
    let mounted = true;

    const loadDashboardWidgets = async () => {
      if (!user?.id) {
        if (mounted) {
          setDbWidgets(DEFAULT_WIDGETS);
          setLayouts(DEFAULT_LAYOUTS);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_widgets")
        .select("widget_id, type, title, layout")
        .eq("user_id", user.id)
        .order("widget_id", { ascending: true });

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Error loading dashboard widgets:", error);
        setDbWidgets(DEFAULT_WIDGETS);
        setLayouts(DEFAULT_LAYOUTS);
        return;
      }

      if (!data || data.length === 0) {
        setDbWidgets(DEFAULT_WIDGETS);
        setLayouts(DEFAULT_LAYOUTS);
        return;
      }

      const normalizedWidgets = data.map((widget: any) => {
        const config = widget.config || { vacationId: "none" };
        return {
          ...widget,
          config,
          layout: widget.layout ||
            DEFAULT_WIDGETS.find(
              (defaultWidget) => defaultWidget.widget_id === widget.widget_id,
            )?.layout || { x: 0, y: 0, w: 4, h: 3 },
        };
      });

      setDbWidgets(normalizedWidgets);
      setLayouts({
        lg: normalizedWidgets.map((widget: any) => ({
          i: widget.widget_id,
          ...widget.layout,
        })),
      });
    };

    loadDashboardWidgets();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Filter user's vacations
  const myVacations = useMemo(() => {
    if (!user) return [];
    return (vacations || []).filter(
      (v: any) =>
        v.user_id === user.id ||
        v.vacation_participants?.some((p: any) => p.user_id === user.id),
    );
  }, [vacations, user]);

  const nearestTrip = useMemo(() => {
    const sorted = [...myVacations]
      .filter((v) => !v.archived && v.destination)
      .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
    return sorted[0];
  }, [myVacations]);

  const activeTripsCount = myVacations.filter((v: any) => !v.archived).length;
  const destinationsCount = myVacations.reduce(
    (acc: number, v: any) => acc + (v.destination && !v.archived ? 1 : 0),
    0,
  );
  // Helper to get total budget for ALL trips
  const totalBudget = useMemo(() => {
    return myVacations.reduce((acc, v) => acc + (v.total_budget || 0), 0);
  }, [myVacations]);

  // Fetch personal upcoming events (where user is a participant)
  useEffect(() => {
    if (!user) return;

    const fetchUpcomingEvents = async () => {
      setLoadingEvents(true);
      try {
        // 1. Get IDs of agenda items where the user is a participant
        let query = supabase
          .from("agenda_participants")
          .select("agenda_id")
          .eq("profile_id", user.id);

        const { data: participations, error: partError } = await query;

        if (partError) throw partError;

        const joinedAgendaIds = participations?.map((p) => p.agenda_id) || [];

        if (joinedAgendaIds.length === 0) {
          setUpcomingEvents([]);
          return;
        }

        // 2. Fetch those agenda items if they are in the future
        const today = new Date().toISOString().split("T")[0];
        let agendaQuery = supabase
          .from("agendas")
          .select("*, locations(name, vacation_id)")
          .in("id", joinedAgendaIds)
          .gte("agenda_date", today)
          .order("agenda_date", { ascending: true })
          .limit(5);

        const { data: agendas, error: agendaError } = await agendaQuery;

        if (agendaError) throw agendaError;

        // Filter by vacation_id if config is present (handled in render if needed, but better here for data efficiency)
        setUpcomingEvents(agendas || []);
      } catch (err) {
        console.error("Error fetching personal itinerary:", err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchUpcomingEvents();
  }, [user]);

  // Fetch suggestions and notifications
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch top suggestions across user's trips
      const tripIds = myVacations.map((v) => v.id);
      if (tripIds.length > 0) {
        const { data: suggData } = await supabase
          .from("activity_suggestions")
          .select(
            "*, profiles:profile_id (display_name, avatar_url), votes:suggestion_votes (profile_id, profiles:profile_id (display_name, avatar_url))",
          )
          .in("vacation_id", tripIds)
          .order("created_at", { ascending: false });
        if (suggData) setSuggestions(suggData);
      }

      // Fetch latest notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*, profiles!sender_id (display_name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (notifData) setNotifications(notifData);
    };

    fetchData();
  }, [user, myVacations]);

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          px: 3,
        }}
      >
        <Box
          sx={{
            p: 6,
            borderRadius: 8,
            bgcolor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            maxWidth: 500,
            animation: "fadeIn 0.8s ease-out",
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "rgba(202, 29, 73, 0.1)",
              color: "#ca1d49",
              mx: "auto",
              mb: 3,
            }}
          >
            <BeachAccessIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
            Your Journey Starts Here
          </Typography>
          <Typography
            variant="body1"
            sx={{ opacity: 0.6, mb: 4, lineHeight: 1.6 }}
          >
            Join thousands of travelers planning their next big adventure. Sign
            in to unlock your personal dashboard, track expenses, and coordinate
            trips with friends.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => (window.location.href = "/auth?mode=login")}
              sx={{
                borderRadius: 4,
                px: 4,
                py: 1.5,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1.1rem",
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => (window.location.href = "/auth?mode=register")}
              sx={{
                borderRadius: 4,
                px: 4,
                py: 1.5,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1.1rem",
                borderColor: "rgba(255,255,255,0.2)",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.05)",
                },
              }}
            >
              Register
            </Button>
          </Stack>
        </Box>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </Box>
    );
  }

  const addWidget = (type: string) => {
    if (dbWidgets.some((w) => w.type === type)) return;

    const titles: Record<string, string> = {
      summary: "Trip Summary",
      recent: "Recent Explorations",
      itinerary: "Personal Itinerary",
      expenses: "Budget Overview",
      weather: "Weather Radar",
      voting: "Activity Voting",
      notifications: "Recent Activity",
      countdown: "Trip Countdown",
    };

    const minSpecs: Record<string, { minW: number; minH: number }> = {
      summary: { minW: 3, minH: 2 },
      recent: { minW: 6, minH: 2 },
      itinerary: { minW: 4, minH: 3 },
      expenses: { minW: 3, minH: 2 },
      weather: { minW: 3, minH: 2 },
      voting: { minW: 4, minH: 3 },
      notifications: { minW: 3, minH: 3 },
      countdown: { minW: 3, minH: 2 },
    };

    const id = type;
    const specs = minSpecs[type] || { minW: 2, minH: 2 };
    const newWidget = {
      widget_id: id,
      type,
      title: titles[type] || "New Widget",
      layout: { x: 0, y: 0, w: specs.minW, h: specs.minH },
      config: { vacationId: "none" },
    };

    setDbWidgets([...dbWidgets, newWidget]);
    setLayouts({
      ...layouts,
      lg: [...layouts.lg, { i: id, ...newWidget.layout, ...specs }],
      md: [
        ...(layouts.md || []),
        {
          i: id,
          ...newWidget.layout,
          w: Math.min(newWidget.layout.w, 10),
          ...specs,
        },
      ],
      sm: [
        ...(layouts.sm || []),
        {
          i: id,
          ...newWidget.layout,
          w: Math.min(newWidget.layout.w, 6),
          ...specs,
        },
      ],
      xs: [
        ...(layouts.xs || []),
        {
          i: id,
          ...newWidget.layout,
          w: Math.min(newWidget.layout.w, 4),
          ...specs,
        },
      ],
      xxs: [
        ...(layouts.xxs || []),
        { i: id, ...newWidget.layout, w: 2, ...specs },
      ],
    });
  };

  const removeWidget = async (id: string) => {
    setDbWidgets(dbWidgets.filter((w) => w.widget_id !== id));
    setLayouts({
      ...layouts,
      lg: layouts.lg.filter((l: any) => l.i !== id),
      md: (layouts.md || []).filter((l: any) => l.i !== id),
      sm: (layouts.sm || []).filter((l: any) => l.i !== id),
      xs: (layouts.xs || []).filter((l: any) => l.i !== id),
      xxs: (layouts.xxs || []).filter((l: any) => l.i !== id),
    });

    if (user) {
      await supabase
        .from("user_widgets")
        .delete()
        .eq("user_id", user.id)
        .eq("widget_id", id);
    }
  };

  const saveLayout = async () => {
    if (!user) return;

    // Use the LG (Large) layout as the source of truth for saving.
    // This ensures that layouts saved on smaller screens don't corrupt the master layout.
    const uniqueUpdates = new Map();
    const layoutToSave = layouts.lg || [];

    for (const item of layoutToSave) {
      if (!item?.i) {
        continue;
      }

      const widget = dbWidgets.find((w) => w.widget_id === item.i);

      uniqueUpdates.set(item.i, {
        user_id: user.id,
        widget_id: item.i,
        type: widget?.type || item.i,
        title: widget?.title || item.i,
        layout: { x: item.x, y: item.y, w: item.w, h: item.h },
        config: widget?.config || { vacationId: "none" },
      });
    }

    const updates = Array.from(uniqueUpdates.values());

    const { error } = await supabase.from("user_widgets").upsert(updates, {
      onConflict: "user_id,widget_id",
    });

    if (error) {
      console.error("Error saving dashboard:", error);
    } else {
      setOriginalLayouts(null);
      setIsEditMode(false);
    }
  };

  const cancelEdit = () => {
    if (originalLayouts) {
      setLayouts(originalLayouts);
    }
    setOriginalLayouts(null);
    setIsEditMode(false);
  };

  const startEditing = () => {
    setOriginalLayouts(JSON.parse(JSON.stringify(layouts)));
    setIsEditMode(true);
  };

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    // We only update state if we are actually editing
    if (isEditMode) {
      setLayouts(allLayouts);
    }
  };

  const onResizeStop = (layout: any) => {
    if (isEditMode) {
      setLayouts((currentLayouts: any) => ({
        ...currentLayouts,
        lg: layout,
      }));
    }
  };

  const updateWidgetConfig = (id: string, newConfig: any) => {
    setDbWidgets((prev) =>
      prev.map((w) => (w.widget_id === id ? { ...w, config: newConfig } : w)),
    );
  };

  const WidgetSettings = ({ id, config }: { id: string; config: any }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const safeConfig = config || {};

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleSelectVacation = (vacationId: any) => {
      updateWidgetConfig(id, { ...safeConfig, vacationId });
      handleClose();
    };

    return (
      <>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem
            onClick={() => handleSelectVacation("none")}
            selected={
              safeConfig.vacationId === "none" || !safeConfig.vacationId
            }
          >
            <em>Auto (Nearest/Total)</em>
          </MenuItem>
          {myVacations.map((v) => (
            <MenuItem
              key={v.id}
              onClick={() => handleSelectVacation(v.id)}
              selected={safeConfig.vacationId === v.id}
            >
              {v.name}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };

  const renderWidget = (type: string, widgetId: string, config: any = {}) => {
    const safeConfig = config || {};
    const selectedVacation =
      safeConfig.vacationId && safeConfig.vacationId !== "none"
        ? myVacations.find((v) => v.id === safeConfig.vacationId)
        : null;

    switch (type) {
      case "summary":
        return (
          <SummaryWidget
            activeTripsCount={activeTripsCount}
            destinationsCount={destinationsCount}
            onExplore={() => onNavigate?.("/explore")}
          />
        );
      case "recent":
        return (
          <RecentExplorationsWidget
            vacations={myVacations}
            onSelectVacation={onSelectVacation}
          />
        );
      case "itinerary":
        const filteredEvents =
          selectedVacation && upcomingEvents
            ? upcomingEvents.filter(
                (e) => e.locations?.vacation_id === selectedVacation.id,
              )
            : upcomingEvents;
        return (
          <UpcomingItineraryWidget
            events={filteredEvents}
            loading={loadingEvents}
            onNavigate={() => onNavigate?.("/my-itinerary")}
          />
        );
      case "expenses":
        return (
          <BudgetOverviewWidget
            totalBudget={
              selectedVacation ? selectedVacation.total_budget : totalBudget
            }
            onExplore={() =>
              (selectedVacation || nearestTrip) &&
              onSelectVacation(selectedVacation || nearestTrip)
            }
          />
        );
      case "weather":
        return (
          <WeatherWidget
            destination={
              selectedVacation?.destination || nearestTrip?.destination || ""
            }
          />
        );
      case "voting":
        return (
          <ActivityVotingWidget
            suggestions={suggestions}
            onNavigate={(id) => {
              onNavigate?.("/activity-suggestions");
            }}
          />
        );
      case "notifications":
        return <NotificationWidget notifications={notifications} />;
      case "countdown":
        return (
          <CountdownWidget
            startDate={
              selectedVacation?.start_date || nearestTrip?.start_date || ""
            }
            destination={
              selectedVacation?.destination || nearestTrip?.destination || ""
            }
            onClick={() =>
              (selectedVacation || nearestTrip) &&
              onSelectVacation(selectedVacation || nearestTrip)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box ref={containerRef} sx={{ width: "100%", position: "relative" }}>
      <GlobalStyles />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, px: 2 }}>
        <Stack direction="row" spacing={1}>
          {!isEditMode ? (
            <Button
              size="small"
              variant="outlined"
              onClick={startEditing}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Edit Dashboard
            </Button>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setIsDrawerOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Add widget
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={saveLayout}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Save
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<CloseIcon />}
                onClick={cancelEdit}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Cancel
              </Button>
            </>
          )}
        </Stack>
      </Box>

      <Responsive
        className={`layout ${!isEditMode ? "locked" : ""}`}
        width={containerWidth}
        layouts={renderedLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        margin={[20, 20]}
        containerPadding={[0, 0]}
        // @ts-ignore
        draggableHandle=".drag-handle"
        onLayoutChange={onLayoutChange}
        onResizeStop={onResizeStop}
        // Native RGL props for behavior
        // @ts-ignore
        isDraggable={isEditMode}
        // @ts-ignore
        isResizable={isEditMode}
        // @ts-ignore
        resizeHandles={["se"]}
        compactType="vertical"
        preventCollision={false}
      >
        {dbWidgets.map((w) => (
          <div key={w.widget_id}>
            <WidgetContainer
              id={w.widget_id}
              title={w.title}
              onRemove={
                isEditMode ? () => removeWidget(w.widget_id) : undefined
              }
              dragHandleProps={isEditMode ? { className: "drag-handle" } : {}}
              settings={
                ["expenses", "weather", "countdown", "itinerary"].includes(
                  w.type,
                ) ? (
                  <WidgetSettings id={w.widget_id} config={w.config} />
                ) : undefined
              }
            >
              {renderWidget(w.type, w.widget_id, w.config)}
            </WidgetContainer>
          </div>
        ))}
      </Responsive>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            bgcolor: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            p: 3,
            zIndex: 1300,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Library
          </Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.5, mb: 3 }}>
          Click widgets to add them to your dashboard.
        </Typography>

        <Stack spacing={2}>
          {[
            {
              type: "summary",
              title: "Trip Summary",
              icon: <BeachAccessIcon />,
              desc: "Quick overview of your stats",
            },
            {
              type: "recent",
              title: "Recent Explorations",
              icon: <LocationOnIcon />,
              desc: "Jump back into your trips",
            },
            {
              type: "itinerary",
              title: "Personal Itinerary",
              icon: <EventAvailableIcon />,
              desc: "Activities you've joined",
            },
            {
              type: "expenses",
              title: "Budget Overview",
              icon: <AttachMoneyIcon />,
              desc: "Total spending overview",
            },
            {
              type: "weather",
              title: "Weather Radar",
              icon: <WbSunnyIcon />,
              desc: "Live forecast for your next trip",
            },
            {
              type: "voting",
              title: "Activity Voting",
              icon: <ThumbUpIcon />,
              desc: "Current trip suggestions",
            },
            {
              type: "notifications",
              title: "Recent Activity",
              icon: <NotificationsIcon />,
              desc: "Latest group updates",
            },
            {
              type: "countdown",
              title: "Trip Countdown",
              icon: <TimerIcon />,
              desc: "Time until your next adventure",
            },
          ].map((item) => {
            const exists = dbWidgets.some((w) => w.type === item.type);
            return (
              <Box
                key={item.type}
                onClick={() => !exists && addWidget(item.type)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: exists
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.05)",
                  border: "1px solid",
                  borderColor: exists ? "transparent" : "rgba(255,255,255,0.1)",
                  cursor: exists ? "default" : "pointer",
                  opacity: exists ? 0.4 : 1,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  "&:hover": !exists
                    ? {
                        bgcolor: "rgba(255,255,255,0.08)",
                        borderColor: "#ca1d49",
                        transform: "translateX(-4px)",
                      }
                    : {},
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: exists ? "transparent" : "rgba(202, 29, 73, 0.1)",
                    color: exists ? "rgba(255,255,255,0.2)" : "#ca1d49",
                    width: 40,
                    height: 40,
                  }}
                >
                  {item.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, lineHeight: 1.2 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    {exists ? "Already added" : item.desc}
                  </Typography>
                </Box>
                {!exists && <AddIcon sx={{ opacity: 0.3, fontSize: 18 }} />}
              </Box>
            );
          })}
        </Stack>
      </Drawer>
    </Box>
  );
};
