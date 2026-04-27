import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  AvatarGroup,
  Tooltip,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EuroIcon from "@mui/icons-material/Euro";
import { TEXT_LIMITS } from "../utils/textLimits";
import { supabase } from "../supabaseClient";
import { resolveAvatar } from "../utils/avatars";

// Global cache to prevent redundant API calls across components/sessions
let cachedRates: { [key: string]: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  profile_id: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
  trip_expense_participants?: {
    profile_id: string;
    custom_amount: number | null;
  }[];
}

const CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "Fr." },
  { code: "HUF", symbol: "Ft" },
];

interface TripExpensesProps {
  vacationId: number;
  user: any;
  participants?: Participant[];
  locationId?: number | null;
  canEdit?: boolean;
}

export default function TripExpenses({
  vacationId,
  user,
  participants = [],
  locationId,
  canEdit = true,
}: TripExpensesProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [rates, setRates] = useState<{ [key: string]: number }>({ EUR: 1 });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>(
    {},
  );

  useEffect(() => {
    if (participants.length > 0) {
      setSelectedParticipants(participants.map((p) => p.user_id));
    }
  }, [participants]);

  const fetchRates = async () => {
    // Check global cache first
    const now = Date.now();
    if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
      setRates(cachedRates);
      return;
    }

    // List of reliable backup endpoints
    const endpoints = [
      "/api/currency", // Local Proxy
      "https://api.frankfurter.app/latest?from=EUR", // Direct Frankfurter
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        const ratesData = data.rates || (data.data && data.data.rates);

        if (ratesData) {
          const newRates = { EUR: 1, ...ratesData };
          if (process.env.NODE_ENV !== "production") {
            console.log(`[TripExpenses] Rates loaded from ${url}:`, newRates);
          }
          cachedRates = newRates;
          lastFetchTime = now;
          setRates(newRates);
          return; // Success!
        }
      } catch (err) {
        console.warn(`[TripExpenses] Failed to fetch from ${url}:`, err);
      }
    }

    // If all fail, use previous cache or fallback
    if (cachedRates) {
      setRates(cachedRates);
    }
  };

  const fetchExpenses = useCallback(async () => {
    try {
      let query = supabase
        .from("trip_expenses")
        .select(
          `
          *,
          profiles!profile_id(
            display_name,
            avatar_url
          ),
          trip_expense_participants(
            profile_id,
            custom_amount
          )
        `,
        )
        .eq("vacation_id", vacationId);

      if (locationId) {
        query = query.eq("location_id", locationId);
      } else {
        query = query.is("location_id", null);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching expenses:", error);
        const { data: fallback } = await supabase
          .from("trip_expenses")
          .select("*")
          .eq("vacation_id", vacationId);
        if (fallback) setExpenses(fallback as Expense[]);
      } else if (data) {
        setExpenses(data as Expense[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [vacationId, locationId]);

  useEffect(() => {
    fetchExpenses();
    fetchRates();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`expenses-${vacationId}-${locationId || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_expenses",
          filter: `vacation_id=eq.${vacationId}`,
        },
        () => {
          fetchExpenses();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExpenses, vacationId, locationId]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (
      !amount ||
      isNaN(Number(amount)) ||
      !user ||
      selectedParticipants.length === 0
    )
      return;

    if (desc.trim().length > TEXT_LIMITS.SHORT) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Description must be ${TEXT_LIMITS.SHORT} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    const { data: newExpense, error } = await supabase
      .from("trip_expenses")
      .insert({
        vacation_id: vacationId,
        profile_id: user.id,
        description: desc.trim() || "Trip Expense",
        amount: parseFloat(amount),
        currency: currency,
        location_id: locationId || null,
      })
      .select()
      .single();

    if (!error && newExpense) {
      // Add participants
      const participantInserts = selectedParticipants.map((pid) => ({
        expense_id: newExpense.id,
        profile_id: pid,
        custom_amount:
          splitMode === "custom" && customAmounts[pid]
            ? parseFloat(customAmounts[pid])
            : null,
      }));

      const { error: pError } = await supabase
        .from("trip_expense_participants")
        .insert(participantInserts);

      if (!pError) {
        setDesc("");
        setAmount("");
        setCustomAmounts({});
        // Reset to all participants
        setSelectedParticipants(participants.map((p) => p.user_id));
        fetchExpenses();
      }
    }
  }

  async function deleteExpense(id: number) {
    const { error } = await supabase
      .from("trip_expenses")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchExpenses();
    }
  }

  const convertToEur = useCallback(
    (amt: number, cur: string) => {
      if (cur === "EUR") return amt;
      const rate = rates[cur];
      return rate ? amt / rate : amt;
    },
    [rates],
  );

  const totalEur = React.useMemo(() => {
    return expenses.reduce((sum, exp) => {
      return sum + convertToEur(Number(exp.amount), exp.currency || "EUR");
    }, 0);
  }, [expenses, convertToEur]);

  const currentSymbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol || "€";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "flex-end" },
          px: 1,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              mb: 1,
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.5) 90%)"
                  : "linear-gradient(45deg, #1a1a1a 30%, rgba(26,26,26,0.6) 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Trip Finances
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontWeight: 500 }}
          >
            {expenses.length === 0
              ? "No expenses recorded yet."
              : `Tracking ${expenses.length} shared expenses.`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: "success.main",
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              gap: 0.5,
              fontSize: { md: "2rem", xs: "1.5rem" },
            }}
          >
            <EuroIcon sx={{ fontSize: "0.8em" }} />
            {totalEur.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Estimated Total (EUR)
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: { md: 4, xs: 2 },
          borderRadius: 6,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.02)",
          backdropFilter: "blur(20px)",
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)"
            }`,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: 0,
        }}
      >
        {/* Settlements / Balance Breakdown */}
        {expenses.length > 0 && participants.length > 1 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 4,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 900,
                mb: 1.5,
                display: "block",
                opacity: 0.6,
                letterSpacing: 1.5,
              }}
            >
              Settlement Status
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                },
              }}
            >
              {(() => {
                // Calculate balances based on custom splits
                const balances: Record<string, number> = {};
                participants.forEach((p) => (balances[p.user_id] = 0));

                expenses.forEach((exp) => {
                  const rate = rates[exp.currency] || 1;
                  const amtEur = exp.amount / rate;
                  const involved = exp.trip_expense_participants || [];

                  if (involved.length > 0) {
                    // Payer gets credit
                    balances[exp.profile_id] =
                      (balances[exp.profile_id] || 0) + amtEur;

                    // Involved get debt
                    const customSpecified = involved.filter(
                      (p) => p.custom_amount !== null,
                    );
                    const totalCustomEur = customSpecified.reduce(
                      (sum, p) => sum + (p.custom_amount || 0) / rate,
                      0,
                    );

                    const remainderEur = Math.max(0, amtEur - totalCustomEur);
                    const remainingCount =
                      involved.length - customSpecified.length;

                    involved.forEach((part) => {
                      let share: number;
                      if (part.custom_amount !== null) {
                        share = part.custom_amount / rate;
                      } else {
                        share =
                          remainingCount > 0
                            ? remainderEur / remainingCount
                            : 0;
                      }

                      balances[part.profile_id] =
                        (balances[part.profile_id] || 0) - share;
                    });
                  }
                });

                return participants.map((p) => {
                  const balance = balances[p.user_id] || 0;

                  return (
                    <Box
                      key={p.user_id}
                      sx={{
                        p: { xs: 1.25, sm: 1.5 },
                        minWidth: { xs: 140, sm: 180 },
                        borderRadius: 3,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(0,0,0,0.3)"
                            : "rgba(255,255,255,0.5)",
                        border: "1px solid",
                        borderColor:
                          Math.abs(balance) < 0.1
                            ? (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)"
                            : balance > 0
                              ? "success.main"
                              : "error.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <Avatar
                        src={resolveAvatar(p.avatar_url)}
                        sx={{
                          width: { xs: 28, sm: 32 },
                          height: { xs: 28, sm: 32 },
                        }}
                      >
                        {p.display_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 900,
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            opacity: 0.7,
                          }}
                        >
                          {p.display_name?.split(" ")[0]}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 950,
                            color:
                              Math.abs(balance) < 0.1
                                ? "text.primary"
                                : balance > 0
                                  ? "success.main"
                                  : "error.main",
                            fontSize: { xs: "0.85rem", sm: "1rem" },
                          }}
                        >
                          {balance > 0 ? "+" : ""}
                          {balance.toFixed(2)}€
                        </Typography>
                      </Box>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>
        )}

        <Box
          component="form"
          onSubmit={handleAddExpense}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2.5, sm: 1.5 },
            borderRadius: 4,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.2)"
                : "rgba(0,0,0,0.04)",
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)"
              }`,
            transition: "all 0.2s",
            "&:focus-within": {
              borderColor: "success.main",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(0,0,0,0.06)",
            },
          }}
        >
          <Box
            sx={{ flex: 2, display: "flex", flexDirection: "column", gap: 1 }}
          >
            <TextField
              placeholder={
                canEdit ? "What did we pay for?" : "Join trip to log expenses"
              }
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              variant="standard"
              autoComplete="off"
              disabled={!canEdit}
              fullWidth
              inputProps={{ maxLength: TEXT_LIMITS.SHORT }}
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 2,
                  color: "text.primary",
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", sm: "1rem" },
                  opacity: canEdit ? 1 : 0.5,
                },
              }}
            />
            {canEdit && participants.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  mb: 2,
                  gap: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                  p: isMobile ? 1 : 1.5,
                  borderRadius: 4,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: isMobile ? "space-between" : "flex-start",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, opacity: 0.5 }}
                  >
                    SPLIT:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      bgcolor: "rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      p: 0.5,
                    }}
                  >
                    <Button
                      size="small"
                      variant={splitMode === "equal" ? "contained" : "text"}
                      onClick={() => setSplitMode("equal")}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        py: 0.5,
                        minWidth: 80,
                        boxShadow: "none",
                      }}
                    >
                      Equal
                    </Button>
                    <Button
                      size="small"
                      variant={splitMode === "custom" ? "contained" : "text"}
                      onClick={() => setSplitMode("custom")}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        py: 0.5,
                        minWidth: 80,
                        boxShadow: "none",
                      }}
                    >
                      Custom
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    overflowX: "auto",
                    width: "100%",
                    pb: isMobile ? 1 : 0,
                    px: isMobile ? 1 : 0,
                    "&::-webkit-scrollbar": { height: 4 },
                  }}
                >
                  {participants.map((p) => {
                    const isSelected = selectedParticipants.includes(p.user_id);
                    return (
                      <Box
                        key={p.user_id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          minWidth:
                            isSelected && splitMode === "custom"
                              ? { xs: 80, sm: 60 }
                              : { xs: 44, sm: 32 },
                        }}
                      >
                        <Tooltip title={p.display_name || "User"}>
                          <Avatar
                            src={resolveAvatar(p.avatar_url)}
                            onClick={() => {
                              setSelectedParticipants((prev) =>
                                prev.includes(p.user_id)
                                  ? prev.filter((id) => id !== p.user_id)
                                  : [...prev, p.user_id],
                              );
                            }}
                            sx={{
                              width: { xs: 44, sm: 32 },
                              height: { xs: 44, sm: 32 },
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor: isSelected
                                ? "primary.main"
                                : "transparent",
                              opacity: isSelected ? 1 : 0.3,
                              transition: "all 0.2s",
                              "&:hover": { opacity: 1 },
                            }}
                          >
                            {p.display_name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                        {splitMode === "custom" && isSelected && (
                          <TextField
                            placeholder="0"
                            size="small"
                            variant="standard"
                            value={customAmounts[p.user_id] || ""}
                            onChange={(e) =>
                              setCustomAmounts({
                                ...customAmounts,
                                [p.user_id]: e.target.value,
                              })
                            }
                            InputProps={{
                              disableUnderline: true,
                              sx: {
                                fontSize: "0.85rem",
                                fontWeight: 900,
                                bgcolor: "rgba(0,0,0,0.2)",
                                borderRadius: 1.5,
                                px: 1,
                                width: "100%",
                                textAlign: "center",
                                "& input": { textAlign: "center", p: 1 },
                              },
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 1.5,
              width: "100%",
              alignItems: "stretch",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  variant="standard"
                  disableUnderline
                  disabled={!canEdit}
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    borderRadius: 3,
                    height: { xs: 52, sm: 44 },
                    opacity: canEdit ? 1 : 0.5,
                    "& .MuiSelect-select": {
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 800,
                      color: "primary.main",
                      fontSize: { xs: "1rem", sm: "0.875rem" },
                    },
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem
                      key={c.code}
                      value={c.code}
                      sx={{ fontWeight: 700 }}
                    >
                      {c.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                variant="standard"
                autoComplete="off"
                disabled={!canEdit}
                sx={{ flex: 1 }}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: "success.main",
                          opacity: canEdit ? 0.8 : 0.3,
                          fontSize: { xs: "1.2rem", sm: "1rem" },
                        }}
                      >
                        {currentSymbol}
                      </Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    px: 2,
                    color: "text.primary",
                    fontWeight: 900,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    borderRadius: 3,
                    height: { xs: 52, sm: 44 },
                    opacity: canEdit ? 1 : 0.5,
                    fontSize: { xs: "1.2rem", sm: "1rem" },
                  },
                }}
              />
            </Box>
            <IconButton
              type="submit"
              disabled={!amount || isNaN(Number(amount)) || !canEdit}
              sx={{
                bgcolor: "success.main",
                color: "#fff",
                borderRadius: 3,
                width: isMobile ? "100%" : 44,
                height: { xs: 52, sm: 44 },
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(76, 175, 80, 0.3)"
                    : "0 4px 12px rgba(76, 175, 80, 0.2)",
                "&:hover": {
                  bgcolor: "success.dark",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                  opacity: 0.5,
                },
              }}
            >
              {isMobile ? (
                <Typography sx={{ fontWeight: 900 }}>Add Expense</Typography>
              ) : (
                <AddIcon />
              )}
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            pr: 1,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              borderRadius: 10,
            },
          }}
        >
          {expenses.length === 0 ? (
            <Box
              sx={{
                py: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "text.secondary",
                opacity: 0.5,
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Wallet is Empty
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Log your first expense to see the breakdown.
              </Typography>
            </Box>
          ) : (
            <List
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xl: "1fr 1fr 1fr",
                  lg: "1fr 1fr",
                  xs: "1fr",
                },
                gap: 2,
              }}
            >
              {expenses.map((exp) => {
                const expCurrency = exp.currency || "EUR";
                const symbol =
                  CURRENCIES.find((c) => c.code === expCurrency)?.symbol || "€";
                const eurValue = convertToEur(Number(exp.amount), expCurrency);

                return (
                  <ListItem
                    key={exp.id}
                    disablePadding
                    sx={{
                      borderRadius: 4,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.015)",
                      border: (theme) =>
                        `1px solid ${
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)"
                        }`,
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        transform: "translateY(-2px)",
                        boxShadow: (theme) =>
                          theme.palette.mode === "dark"
                            ? "0 8px 24px rgba(0,0,0,0.2)"
                            : "0 8px 24px rgba(0,0,0,0.05)",
                        "& .exp-delete": { opacity: 1 },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}
                        >
                          {exp.description}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            src={resolveAvatar(exp.profiles?.avatar_url)}
                            sx={{
                              width: 18,
                              height: 18,
                              fontSize: "0.6rem",
                              bgcolor: "primary.main",
                              fontWeight: 900,
                            }}
                          >
                            {exp.profiles?.display_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", fontWeight: 700 }}
                          >
                            {exp.profiles?.display_name || "Unknown"}
                          </Typography>
                        </Box>
                        {exp.trip_expense_participants &&
                          exp.trip_expense_participants.length > 0 && (
                            <Box
                              sx={{
                                mt: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  opacity: 0.4,
                                  fontSize: "0.65rem",
                                }}
                              >
                                SPLIT:
                              </Typography>
                              <AvatarGroup max={5}>
                                {exp.trip_expense_participants.map((tp) => {
                                  const pData = participants.find(
                                    (p) => p.user_id === tp.profile_id,
                                  );

                                  // Calculate share for tooltip
                                  let displayShare: string;
                                  if (
                                    tp.custom_amount !== null &&
                                    tp.custom_amount !== undefined
                                  ) {
                                    displayShare = `${symbol}${Number(tp.custom_amount).toFixed(2)}`;
                                  } else {
                                    const customTotal =
                                      exp.trip_expense_participants
                                        ?.filter(
                                          (p) =>
                                            p.custom_amount !== null &&
                                            p.custom_amount !== undefined,
                                        )
                                        .reduce(
                                          (sum, p) =>
                                            sum +
                                            (Number(p.custom_amount) || 0),
                                          0,
                                        ) || 0;
                                    const remainingCount =
                                      exp.trip_expense_participants?.filter(
                                        (p) =>
                                          p.custom_amount === null ||
                                          p.custom_amount === undefined,
                                      ).length || 1;
                                    const share =
                                      Math.max(0, exp.amount - customTotal) /
                                      remainingCount;
                                    displayShare = `${symbol}${share.toFixed(2)}`;
                                  }

                                  return (
                                    <Tooltip
                                      key={tp.profile_id}
                                      title={`${pData?.display_name || "User"}: ${displayShare}`}
                                    >
                                      <Avatar
                                        src={resolveAvatar(pData?.avatar_url)}
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          border: (theme) =>
                                            `1px solid ${
                                              theme.palette.mode === "dark"
                                                ? "#000"
                                                : "rgba(0,0,0,0.1)"
                                            }`,
                                          fontSize: "0.5rem",
                                        }}
                                      >
                                        {pData?.display_name
                                          ?.charAt(0)
                                          .toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                  );
                                })}
                              </AvatarGroup>
                            </Box>
                          )}
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 900, lineHeight: 1 }}
                        >
                          {symbol}
                          {exp.amount}
                        </Typography>
                        {expCurrency !== "EUR" && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "success.main",
                              fontWeight: 800,
                              mt: 0.5,
                            }}
                          >
                            ≈ €{eurValue.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Divider
                      sx={{
                        mb: 1.5,
                        borderColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      {canEdit && (
                        <IconButton
                          className="exp-delete"
                          size="small"
                          onClick={() => deleteExpense(exp.id)}
                          sx={{
                            color: "error.main",
                            opacity: { xs: 1, sm: 0 },
                            transition: "opacity 0.2s",
                            "&:hover": {
                              opacity: "1 !important",
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(211, 47, 47, 0.1)"
                                  : "rgba(211, 47, 47, 0.08)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
