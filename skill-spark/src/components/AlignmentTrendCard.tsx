import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie,
} from "recharts";

interface Props {
  score: number;
  trendData?: Array<{ date: string; score: number }>;
}

const AlignmentTrendCard = ({ score, trendData = [] }: Props) => {
  // ✅ Handle NaN values
  const ats = isNaN(score) ? 0 : Math.round(score);

  // ✅ Format trend data
  const formattedData = trendData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: Math.round(item.score || 0),
  }));

  // ✅ Custom tooltip for trend line
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: { date: string; score: number };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs shadow-lg border border-gray-700">
          <p className="font-semibold">{data.payload.date}</p>
          <p className="text-blue-400 font-bold">{Math.round(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  // Determine color based on ATS score
  const getColor = (score: number) => {
    if (score >= 75) return "#10b981"; // Green
    if (score >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const color = getColor(ats);

  // Donut chart data
  const donutData = [
    { name: "Score", value: ats },
    { name: "Remaining", value: 100 - ats },
  ];

  // Status message
  const getStatus = () => {
    if (ats >= 75) return "Excellent";
    if (ats >= 50) return "Good";
    return "Below Threshold";
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
          📈 ATS Trend
        </h3>
      </div>

      {/* Top Section: Circular (Left) + Score Info (Right) */}
      <div className="flex gap-4 mb-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* Left: Larger Circular Progress Indicator (100×100) */}
        <div className="flex-shrink-0 w-[100px] h-[100px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                isAnimationActive={false}
              >
                <Cell fill={color} />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text - Larger Font */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-black" style={{ color }}>
              {ats}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">/100</p>
          </div>
        </div>

        {/* Right: ATS Score & Status */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {/* ATS Score */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              ATS Score
            </p>
            <p className="text-3xl font-black" style={{ color }}>
              {ats}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Status
            </p>
            <div
              className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                backgroundColor: color + "20",
                color: color,
              }}
            >
              {getStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 30-Day Trend Line Chart (Full Width) */}
      <div style={{ width: "100%", height: "120px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 8 }}
              stroke="#9ca3af"
              interval={Math.max(0, Math.floor(formattedData.length / 3) - 1)}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AlignmentTrendCard;
