interface RiskIndicatorCardProps {
  riskScore?: number;
}

export default function RiskIndicatorCard({
  riskScore = 35,
}: RiskIndicatorCardProps) {
  const getRiskInfo = (score: number) => {
    if (score >= 26) {
      return {
        level: "High Risk",
        color: "#dc2626",
        badgeBg: "bg-red-50 dark:bg-red-900/20",
        badgeText: "text-red-700 dark:text-red-300",
      };
    }
    if (score >= 11) {
      return {
        level: "Medium Risk",
        color: "#f97316",
        badgeBg: "bg-orange-50 dark:bg-orange-900/20",
        badgeText: "text-orange-700 dark:text-orange-300",
      };
    }
    return {
      level: "Low Risk",
      color: "#16a34a",
      badgeBg: "bg-green-50 dark:bg-green-900/20",
      badgeText: "text-green-700 dark:text-green-300",
    };
  };

  const risk = getRiskInfo(riskScore);
  const percentage = (riskScore / 100) * 180; // 180 degrees for semicircle

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Risk Indicator
        </h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-base">
          ⓘ
        </button>
      </div>

      {/* Gauge + Score Horizontal Layout */}
      <div className="flex-1 flex items-center gap-4 mb-4">
        {/* Gauge Container - Compact */}
        <div className="relative w-24 h-12 flex-shrink-0">
          <svg
            className="absolute inset-0"
            viewBox="0 0 180 90"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            {/* Gray background arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 170 80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Risk colored arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 170 80"
              fill="none"
              stroke={risk.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 180) * 220} 220`}
            />
          </svg>

          {/* Needle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute w-0.5 h-10 bg-gray-800 dark:bg-gray-200 origin-bottom transition-transform duration-500"
              style={{
                transform: `rotate(${percentage - 90}deg)`,
                bottom: "50%",
              }}
            />
            <div className="absolute bottom-2 w-2.5 h-2.5 rounded-full bg-gray-800 dark:bg-gray-200" />
          </div>
        </div>

        {/* Score Display - Right Side */}
        <div className="flex-1 text-right">
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
            {riskScore}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">/100</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`text-center py-2 px-3 rounded-lg ${risk.badgeBg}`}>
        <p className={`text-xs font-semibold ${risk.badgeText}`}>
          ⚠️ {risk.level}
        </p>
      </div>
    </div>
  );
}
