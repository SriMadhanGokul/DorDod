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
  // ✅ Format trend data: round scores to whole numbers
  const formattedData = trendData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: Math.round(item.score), // ✅ Round to whole number
    fullDate: item.date,
  }));

  // ✅ Custom tooltip: show clean numbers
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
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700">
          <p className="text-xs font-semibold">{data.payload.date}</p>
          <p className="text-sm font-bold text-green-400">
            Score: {Math.round(data.value)} {/* ✅ Round in tooltip */}
          </p>
        </div>
      );
    }
    return null;
  };

  // Donut chart data
  const donutData = [
    { name: "Score", value: Math.round(score) },
    { name: "Remaining", value: 100 - Math.round(score) },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            Alignment Trend (30 Days)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Your consistency pattern
          </p>
        </div>
        <div className="text-xs text-gray-400">📈</div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-4">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute text-center">
          <p className="text-3xl font-black text-green-600 dark:text-green-400">
            {Math.round(score)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">/100</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mb-3">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={formattedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              style={{ marginTop: "10px" }}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        <p>
          <strong>Your average alignment score over the last 30 days</strong>
        </p>
      </div>
    </div>
  );
};

export default AlignmentTrendCard;
