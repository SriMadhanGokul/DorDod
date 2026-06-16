import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AlignmentScoreCardProps {
  score?: number;
  goalProgress?: number;
  habitCompletion?: number;
  hasCheckedInToday?: boolean;
}

export default function AlignmentScoreCard({
  score = 73,
  goalProgress = 47,
  habitCompletion = 16,
  hasCheckedInToday = true,
}: AlignmentScoreCardProps) {
  const checkInScore = hasCheckedInToday ? 10 : 0;

  const chartData = [
    { name: "Progress", value: score, fill: "#3b82f6" },
    { name: "Remaining", value: 100 - score, fill: "#dbeafe" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Alignment Score (Today)
        </h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-base">
          ⓘ
        </button>
      </div>

      {/* Content Flex Container */}
      <div className="flex-1 flex items-center gap-6">
        {/* Circular Progress */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {score}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">/100</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400 truncate">
              Goal
            </span>
            <span className="font-bold text-gray-900 dark:text-white ml-auto flex-shrink-0">
              {goalProgress}/70
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400 truncate">
              Habit
            </span>
            <span className="font-bold text-gray-900 dark:text-white ml-auto flex-shrink-0">
              {habitCompletion}/20
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-600 flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400 truncate">
              Check
            </span>
            <span className="font-bold text-gray-900 dark:text-white ml-auto flex-shrink-0">
              {checkInScore}/10
            </span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center py-2.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            ⚡ Moderately Aligned
          </p>
        </div>
      </div>
    </div>
  );
}
