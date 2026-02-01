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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EuroIcon from "@mui/icons-material/Euro";
import { supabase } from "../supabaseClient";

// Global cache to prevent redundant API calls across components/sessions
let cachedRates: { [key: string]: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  profile_id: string;
  profiles?: {
    display_name: string;
  };
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
  locationId?: number | null;
  canEdit?: boolean;
}

export default function TripExpenses({
  vacationId,
  user,
  locationId,
  canEdit = true,
}: TripExpensesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [rates, setRates] = useState<{ [key: string]: number }>({ EUR: 1 });

  const fetchRates = async () => {
    // Check global cache first
    const now = Date.now();
    if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
      setRates(cachedRates);
      return;
    }

    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=EUR");
      const data = await res.json();
      if (data.rates) {
        const newRates = { EUR: 1, ...data.rates };
        cachedRates = newRates;
        lastFetchTime = now;
        setRates(newRates);
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
      // Fallback to cache even if expired if we have nothing else
      if (cachedRates) setRates(cachedRates);
    }
  };

  const fetchExpenses = useCallback(async () => {
    try {
      let query = supabase
        .from("trip_expenses")
        .select("*, profiles!profile_id(display_name)")
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
    if (!desc.trim() || !amount || isNaN(Number(amount)) || !user) return;

    const { error } = await supabase.from("trip_expenses").insert({
      vacation_id: vacationId,
      profile_id: user.id,
      description: desc.trim(),
      amount: parseFloat(amount),
      currency: currency,
      location_id: locationId || null,
    });

    if (!error) {
      setDesc("");
      setAmount("");
      fetchExpenses();
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
          justifyContent: "space-between",
          alignItems: "flex-end",
          px: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              mb: 1,
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
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: "success.main",
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
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
        <Box
          component="form"
          onSubmit={handleAddExpense}
          sx={{
            display: "flex",
            flexDirection: { md: "row", xs: "column" },
            gap: 2,
            p: 1.5,
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
          <TextField
            placeholder={
              canEdit ? "What did we pay for?" : "Join trip to log expenses"
            }
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            variant="standard"
            autoComplete="off"
            disabled={!canEdit}
            sx={{ flex: 2 }}
            InputProps={{
              disableUnderline: true,
              sx: {
                px: 2,
                color: "text.primary",
                fontWeight: 700,
                fontSize: "1rem",
                opacity: canEdit ? 1 : 0.5,
              },
            }}
          />
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
                  height: 44,
                  opacity: canEdit ? 1 : 0.5,
                  "& .MuiSelect-select": {
                    px: 2,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 800,
                    color: "primary.main",
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
                  height: 44,
                  opacity: canEdit ? 1 : 0.5,
                },
              }}
            />
          </Box>
          <IconButton
            type="submit"
            disabled={!desc.trim() || !amount || !canEdit}
            sx={{
              bgcolor: "success.main",
              color: "#fff",
              borderRadius: 3,
              width: 44,
              height: 44,
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
            <AddIcon />
          </IconButton>
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
