import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EuroIcon from "@mui/icons-material/Euro";
import { supabase } from "../supabaseClient";

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
}

export default function TripExpenses({ vacationId, user }: TripExpensesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [rates, setRates] = useState<{ [key: string]: number }>({ EUR: 1 });

  const fetchRates = async () => {
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=EUR");
      const data = await res.json();
      if (data.rates) {
        setRates({ EUR: 1, ...data.rates });
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  };

  const fetchExpenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("trip_expenses")
        .select("*, profiles(display_name)")
        .eq("vacation_id", vacationId)
        .order("created_at", { ascending: false });

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
  }, [vacationId]);

  useEffect(() => {
    fetchExpenses();
    fetchRates();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`expenses-${vacationId}`)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExpenses, vacationId]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim() || !amount || isNaN(Number(amount)) || !user) return;

    const { error } = await supabase.from("trip_expenses").insert({
      vacation_id: vacationId,
      profile_id: user.id,
      description: desc.trim(),
      amount: parseFloat(amount),
      currency: currency,
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

  const convertToEur = (amt: number, cur: string) => {
    if (cur === "EUR") return amt;
    const rate = rates[cur];
    return rate ? amt / rate : amt;
  };

  const totalEur = expenses.reduce((sum, exp) => {
    return sum + convertToEur(Number(exp.amount), exp.currency || "EUR");
  }, 0);

  const currentSymbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol || "€";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(255,255,255,0.05)",
        minHeight: 450,
        maxHeight: 600,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: "#4caf50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, fontSize: { xs: "1rem", md: "1.25rem" } }}
          >
            Budgeting
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#90caf9",
              fontWeight: 800,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.8rem",
            }}
          >
            <EuroIcon sx={{ fontSize: 14 }} />
            Total:{" "}
            {totalEur.toLocaleString(undefined, {
              style: "currency",
              currency: "EUR",
            })}
          </Typography>
        </Box>
      </Box>

      <Box
        component="form"
        onSubmit={handleAddExpense}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="What for?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 2,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" },
                color: "#fff",
                fontWeight: 600,
                "& fieldset": { border: "none" },
              },
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
          }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 110 } }}>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              sx={{
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.08)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" },
                "& .MuiSelect-select": {
                  py: 1,
                  pl: 1.5,
                  pr: "28px !important",
                  fontWeight: 700,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "#90caf9" }}
                  >
                    {selected}
                  </Typography>
                </Box>
              )}
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c.code} value={c.code} sx={{ fontWeight: 600 }}>
                  {c.code}{" "}
                  <Typography variant="caption" sx={{ ml: 1, opacity: 0.5 }}>
                    ({c.symbol})
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 2,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" },
                fontWeight: 800,
                color: "#fff",
                "& fieldset": { border: "none" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 900, color: "#90caf9" }}
                  >
                    {currentSymbol}
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            type="submit"
            disabled={!desc.trim() || !amount}
            sx={{
              bgcolor: "#4caf50",
              color: "#fff",
              "&:hover": { bgcolor: "#388e3c" },
              borderRadius: 2,
              px: 2,
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 2, opacity: 0.05 }} />

      <List
        sx={{
          flex: 1,
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: 10,
          },
        }}
      >
        {expenses.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", opacity: 0.2 }}>
            <Typography variant="body2">No expenses logged</Typography>
          </Box>
        ) : (
          expenses.map((exp) => {
            const expCurrency = exp.currency || "EUR";
            const symbol =
              CURRENCIES.find((c) => c.code === expCurrency)?.symbol || "€";
            const eurValue = convertToEur(Number(exp.amount), expCurrency);

            return (
              <ListItem
                key={exp.id}
                disablePadding
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                }}
              >
                <ListItemText
                  primary={exp.description}
                  secondary={
                    <Box
                      component="span"
                      sx={{ display: "flex", flexDirection: "column" }}
                    >
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ opacity: 0.7, color: "rgba(255,255,255,0.7)" }}
                      >
                        Paid by {exp.profiles?.display_name || "Unknown"}
                      </Typography>
                      {expCurrency !== "EUR" && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "#90caf9", fontWeight: 600 }}
                        >
                          ≈{" "}
                          {eurValue.toLocaleString(undefined, {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    },
                    "& .MuiListItemText-secondary": {
                      fontSize: "0.75rem",
                    },
                  }}
                />
                <Box
                  sx={{ textAlign: "right", mr: 1, minWidth: "fit-content" }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 900,
                      color: "#81c784", // Brighter green for better visibility
                      fontSize: "1rem",
                    }}
                  >
                    {symbol}
                    {Number(exp.amount).toFixed(2)}
                  </Typography>
                </Box>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => deleteExpense(exp.id)}
                    sx={{
                      color: "rgba(255,255,255,0.2)",
                      "&::hover": { color: "error.main" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItem>
            );
          })
        )}
      </List>
    </Paper>
  );
}
