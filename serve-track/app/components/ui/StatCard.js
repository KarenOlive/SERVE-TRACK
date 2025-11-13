export default function StatCard({ title, value, color, icon, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    gray: 'bg-gray-100'
  };
  
  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        {/* Render icon - handle both string (emoji) and Lucide component */}
        {typeof icon === 'string' ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <div className="text-2xl opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}