import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export const TrendChart = ({ data, range = 30, onRangeChange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No trend data available
      </div>
    );
  }

  // Format data for recharts
  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), 'MMM d'),
    created: d.created,
    completed: d.completed,
  }));

  return (
    <div>
      {/* Range Selector */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {[7, 14, 30, 60, 90].map((days) => (
          <button
            key={days}
            onClick={() => onRangeChange(days)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              range === days
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="Created"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};