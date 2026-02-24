import { motion } from 'framer-motion';
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

interface TimelineChartProps {
  hourlyData: number[];
  dailyData: number[];
  participantName: string;
}

const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text">{payload[0].value.toLocaleString()}개</p>
    </div>
  );
}

export default function TimelineChart({ hourlyData, dailyData, participantName }: TimelineChartProps) {
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  const maxHourly = Math.max(...hourlyData, 1);

  const hourlyChartData = hourlyData.map((count, i) => ({
    name: i + '시',
    count,
    isPeak: i === peakHour,
  }));

  const dailyChartData = dailyData.map((count, i) => ({
    name: dayLabels[i],
    count,
    isWeekend: i >= 5,
  }));

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text mb-1">
          {participantName}의 시간대별 메시지
        </h3>
        <p className="text-xs text-text-muted mb-4">
          피크 시간: <span className="text-dna-green font-medium">{peakHour}시</span>
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {hourlyChartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isPeak ? '#06d6a0' : 'rgba(6, 214, 160, ' + (0.2 + (entry.count / maxHourly) * 0.5) + ')'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text mb-1">요일별 메시지</h3>
        <p className="text-xs text-text-muted mb-4">
          주말은 <span className="text-dna-purple">보라색</span>으로 표시
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {dailyChartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isWeekend ? '#8b5cf6' : '#06d6a0'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
