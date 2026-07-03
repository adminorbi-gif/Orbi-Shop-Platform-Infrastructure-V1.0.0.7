import React, { useMemo } from "react";
import {
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Order } from "../../types";

interface OrderHeatmapProps {
  orders: Order[];
}

export const OrderHeatmap: React.FC<OrderHeatmapProps> = ({ orders }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const data = useMemo(() => {
    const heatmapData = [];

    // Initialize grid
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmapData.push({ day: d, dayLabel: days[d], hour: h, count: 0 });
      }
    }

    // Populate grid
    orders.forEach((order) => {
      const date = new Date(order.created_at || new Date());
      const day = date.getDay();
      const hour = date.getHours();
      const entry = heatmapData.find((e) => e.day === day && e.hour === hour);
      if (entry) entry.count += 1;
    });

    return heatmapData;
  }, [orders]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  return (
    <div className="h-56 sm:h-64 w-full min-w-[50px] min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
        <ScatterChart margin={{ top: 14, right: 12, bottom: 12, left: 8 }}>
          <XAxis
            type="number"
            dataKey="hour"
            name="Hour"
            unit=":00"
            domain={[0, 23]}
            tickCount={7}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="day"
            name="Day"
            ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(value) => days[Number(value)] || ""}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis type="number" dataKey="count" range={[50, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#94a3b8" }}
            formatter={(value) => [value, "Orders"]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;
              if (!item) return "";
              return `${item.dayLabel} ${String(item.hour).padStart(2, "0")}:00`;
            }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Scatter
            data={data}
            fill="#0f172a"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={900}
            animationEasing="ease-in-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.count === 0
                    ? "#eef2f7"
                    : `rgba(15, 23, 42, ${Math.max(0.28, entry.count / maxCount)})`
                }
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
