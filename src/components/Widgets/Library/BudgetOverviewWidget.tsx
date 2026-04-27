import React from "react";
import { Box, Stack, Avatar, Typography } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { supabase } from "../../../supabaseClient";

interface BudgetOverviewWidgetProps {
  vacationId?: number;
  totalBudgetOverride?: number;
  onExplore?: () => void;
}

const BudgetOverviewWidget: React.FC<BudgetOverviewWidgetProps> = ({
  vacationId,
  totalBudgetOverride,
  onExplore,
}) => {
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [rates, setRates] = React.useState<{ [key: string]: number }>({
    EUR: 1,
  });

  React.useEffect(() => {
    if (!vacationId) return;

    const fetchData = async () => {
      // 1. Fetch expenses
      const { data: expData } = await supabase
        .from("trip_expenses")
        .select("*")
        .eq("vacation_id", vacationId);

      if (expData) setExpenses(expData);

      // 2. Fetch rates with failover
      const endpoints = ["/api/currency"];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.error(
              `[BudgetWidget] API failed with status: ${res.status}`,
            );
            continue;
          }

          const data = await res.json();
          const ratesData = data.rates || (data.data && data.data.rates);

          if (ratesData) {
            setRates({ EUR: 1, ...ratesData });
            return;
          }
        } catch (err) {
          console.error(`[BudgetWidget] Network error for ${url}:`, err);
        }
      }
    };

    fetchData();
  }, [vacationId]);

  const convertToEur = React.useCallback(
    (amt: number, cur: string) => {
      if (cur === "EUR") return amt;
      const rate = rates[cur];
      return rate ? amt / rate : amt;
    },
    [rates],
  );

  const totalCalculated = React.useMemo(() => {
    if (totalBudgetOverride !== undefined) return totalBudgetOverride;
    return expenses.reduce((sum, exp) => {
      return sum + convertToEur(Number(exp.amount), exp.currency || "EUR");
    }, 0);
  }, [expenses, convertToEur, totalBudgetOverride]);

  return (
    <Box sx={{ p: 0 }}>
      <Stack spacing={2.5}>
        <Box
          onClick={onExplore}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            cursor: onExplore ? "pointer" : "default",
          }}
        >
          <Avatar sx={{ bgcolor: "success.dark", width: 44, height: 44 }}>
            <AttachMoneyIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
              Budget Summary
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5 }}>
              {vacationId
                ? "Live trip finances"
                : "Overview of tracked spending"}
            </Typography>
          </Box>
        </Box>
        <Box
          onClick={onExplore}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            cursor: onExplore ? "pointer" : "default",
            transition: "all 0.2s",
            "&:hover": onExplore
              ? {
                  bgcolor: "rgba(255,255,255,0.06)",
                  borderColor: "success.main",
                  transform: "translateY(-2px)",
                }
              : {},
          }}
        >
          <Typography
            variant="caption"
            sx={{
              opacity: 0.6,
              textTransform: "uppercase",
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            {vacationId ? "Estimated Total (EUR)" : "Total Tracked"}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 1000, mt: 0.5 }}>
            €
            {totalCalculated.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default BudgetOverviewWidget;
