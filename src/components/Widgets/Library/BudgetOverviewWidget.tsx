import React from "react";
import { Box, Stack, Avatar, Typography } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface BudgetOverviewWidgetProps {
  totalBudget: number;
  onExplore?: () => void;
}

const BudgetOverviewWidget: React.FC<BudgetOverviewWidgetProps> = ({
  totalBudget,
  onExplore,
}) => {
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
              Overview of tracked spending
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
            Total Tracked
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 1000, mt: 0.5 }}>
            ${totalBudget.toLocaleString()}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, opacity: 0.8, color: "success.light" }}
          >
            +14% vs last month
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default BudgetOverviewWidget;
