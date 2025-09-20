import { useState } from 'react';
import { ChevronDown, CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';

interface TypeOverrideControlProps {
  componentName: string;
  filePath: string;
  currentType: 'component' | 'hook' | 'page';
  onTypeChanged?: (newType: 'component' | 'hook' | 'page') => void;
}

const typeConfig = {
  component: { 
    icon: '⚛️', 
    label: 'Component',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    hoverColor: 'hover:bg-blue-100'
  },
  hook: { 
    icon: '🪝', 
    label: 'Hook',
    color: 'text-green-600 bg-green-50 border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  page: { 
    icon: '📄', 
    label: 'Page',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    hoverColor: 'hover:bg-purple-100'
  }
};

export function TypeOverrideControl({ 
  componentName, 
  filePath, 
  currentType, 
  onTypeChanged 
}: TypeOverrideControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTypeChange = async (newType: 'component' | 'hook' | 'page') => {
    if (newType === currentType) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/override-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          filePath,
          componentName,
          originalType: currentType,
          newType,
          reason: `User override: ${currentType} → ${newType}`
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Type updated successfully! Rebuild to see changes.' });
        onTypeChanged?.(newType);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update type' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleResetOverride = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/override-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          filePath,
          componentName
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Override removed! Rebuild to see automatic detection.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove override' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfig = typeConfig[currentType];

  return (
    <div className="relative">
      {/* Main dropdown button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium
            transition-colors duration-200 ${currentConfig.color} ${currentConfig.hoverColor}
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
          `}
          title="Change component type"
        >
          <span>{currentConfig.icon}</span>
          <span>{currentConfig.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={handleResetOverride}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
          title="Reset to automatic detection"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="p-1">
            <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700 mb-1">
              Change Type
            </div>
            {Object.entries(typeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type as 'component' | 'hook' | 'page')}
                disabled={isLoading}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                  ${type === currentType 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="flex-1 text-left">{config.label}</span>
                {type === currentType && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message display */}
      {message && (
        <div className={`
          mt-2 p-2 rounded-md text-sm flex items-center gap-2
          ${message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
          }
        `}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Click outside overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
