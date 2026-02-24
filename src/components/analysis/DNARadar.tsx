import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DNAAxis } from '@/lib/types';

interface DNARadarProps {
  axes: DNAAxis[];
  color?: string;
  size?: number;
  compareAxes?: DNAAxis[];
  compareColor?: string;
}

export default function DNARadar({
  axes,
  color = '#06d6a0',
  size = 300,
  compareAxes,
  compareColor = '#8b5cf6',
}: DNARadarProps) {
  const chartData = axes.map((axis, i) => ({
    axis: axis.label,
    value: axis.value,
    fullMark: 100,
    ...(compareAxes ? { compare: compareAxes[i]?.value ?? 0 } : {}),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
      style={{ width: size, height: size }}
      className="mx-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="DNA"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
          {compareAxes && (
            <Radar
              name="비교"
              dataKey="compare"
              stroke={compareColor}
              fill={compareColor}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 3, fill: compareColor, strokeWidth: 0 }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
