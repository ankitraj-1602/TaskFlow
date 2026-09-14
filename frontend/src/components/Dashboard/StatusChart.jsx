import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = {
  todo: '#6b7280',
  inProgress: '#3b82f6',
  review: '#facc15',
  done: '#10b981',
  blocked: '#dc2626',
};

export const StatusChart = ({ data }) => {
  if (!data) return null;

  const chartData = [
    { name: 'To Do', value: data.todo, key: 'todo' },
    { name: 'In Progress', value: data.inProgress, key: 'inProgress' },
    { name: 'Review', value: data.review, key: 'review' },
    { name: 'Done', value: data.done, key: 'done' },
    { name: 'Blocked', value: data.blocked, key: 'blocked' },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          allowDecimals={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          cursor={{ fill: '#f9fafb' }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};