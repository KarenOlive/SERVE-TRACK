export default function ProgressBar({ value, max, label, color = 'blue' }) {
    const percentage = Math.min((value / max) * 100, 100);
    
    const colorClasses = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600'
    };
  
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{label}</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${colorClasses[color]}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  }