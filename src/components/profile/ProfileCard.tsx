import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DNAProfile, ParticipantStats } from '@/lib/types';

interface ProfileCardProps {
  profile: DNAProfile;
  stats: ParticipantStats;
  dateRange: { start: Date; end: Date };
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) => {
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  };
  return fmt(start) + ' - ' + fmt(end);
}

export default function ProfileCard({ profile, stats, dateRange }: ProfileCardProps) {
  const totalMessages = stats.totalMessages;
  const radarData = profile.axes.map((axis) => ({
    axis: axis.label,
    value: axis.value,
    fullMark: 100,
  }));

  const mainColor = profile.color || '#06d6a0';
  const archetypeColor = profile.archetype.color || mainColor;

  return (
    <motion.div
      id="profile-card"
      className="relative w-[400px] mx-auto rounded-2xl overflow-hidden"
      style={{
        aspectRatio: '400/560',
        background: profile.archetype.gradient || 'linear-gradient(160deg, #0a0d14 0%, #111827 40%, #0a0d14 100%)',
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-20"
        style={{ backgroundColor: archetypeColor }}
      />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[60px] opacity-15 bg-dna-purple" />

      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-dna-green tracking-widest uppercase">ChatDNA</span>
          <span className="text-[10px] text-text-muted">{formatDateRange(dateRange.start, dateRange.end)}</span>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-dna-green/30 via-dna-purple/30 to-transparent mb-4" />

        <div className="text-center mb-2">
          <motion.span
            className="text-4xl block mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          >
            {profile.archetype.emoji}
          </motion.span>
          <h2 className="text-lg font-bold text-text">{profile.participantName}</h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: archetypeColor }}>
            {profile.archetype.name}
          </p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-[280px] mx-auto">
            {profile.archetype.description}
          </p>
        </div>

        <div className="w-[180px] h-[180px] mx-auto -my-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke={mainColor}
                fill={mainColor}
                fillOpacity={0.25}
                strokeWidth={1.5}
                dot={{ r: 2, fill: mainColor, strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1.5 mb-3">
          {profile.axes.map((axis, i) => (
            <div key={axis.id} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-14 text-right shrink-0">{axis.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: mainColor }}
                  initial={{ width: 0 }}
                  animate={{ width: axis.value + '%' }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] text-text-muted w-7">{axis.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 flex-1">
          {profile.highlights.slice(0, 3).map((text, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2 bg-surface/60 rounded-lg px-3 py-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <span className="text-sm shrink-0">💡</span>
              <span className="text-[11px] text-text-muted leading-snug">{text}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="w-full h-px bg-gradient-to-r from-dna-green via-dna-purple to-dna-cyan mb-2" />
          <p className="text-center text-[10px] text-text-muted/50">
            {totalMessages.toLocaleString()}개 메시지 분석 · chatdna.app
          </p>
        </div>
      </div>
    </motion.div>
  );
}
