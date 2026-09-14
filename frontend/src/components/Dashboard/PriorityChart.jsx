import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  urgent: '#dc2626',
  high: '#ea580c',
  medium: '#facc15',
  low: '#3b82f6',
};

export const PriorityChart = ({ data }) => {
  if (!data) return null;

  const chartData = [
    { name: 'Urgent', value: data.urgent, key: 'urgent' },
    { name: 'High', value: data.high, key: 'high' },
    { name: 'Medium', value: data.medium, key: 'medium' },
    { name: 'Low', value: data.low, key: 'low' },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No tasks to display
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLORS[entry.key] }}
            />
            <span className="text-xs text-gray-700 flex-1">{entry.name}</span>
            <span className="text-xs font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};