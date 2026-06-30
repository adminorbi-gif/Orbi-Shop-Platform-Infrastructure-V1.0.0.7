import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Order } from '../../types';

interface OrderHeatmapProps {
  orders: Order[];
}

export const OrderHeatmap: React.FC<OrderHeatmapProps> = ({ orders }) => {
  const data = useMemo(() => {
    const heatmapData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize grid
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmapData.push({ day: d, hour: h, count: 0 });
      }
    }

    // Populate grid
    orders.forEach(order => {
      const date = new Date(order.created_at || new Date());
      const day = date.getDay();
      const hour = date.getHours();
      const entry = heatmapData.find(e => e.day === day && e.hour === hour);
      if (entry) entry.count += 1;
    });

    return heatmapData;
  }, [orders]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="hour" name="Hour" unit=":00" domain={[0, 23]} tickCount={24} />
          <YAxis type="number" dataKey="day" name="Day" tickFormatter={(d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]} />
          <ZAxis type="number" dataKey="count" range={[50, 400]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#8884d8" isAnimationActive={true} animationBegin={0} animationDuration={1000} animationEasing="ease-in-out">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.count === 0 ? '#f3f4f6' : `rgba(79, 70, 229, ${entry.count / maxCount})`} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
