import { useState } from 'react';
import { Tag, Check } from 'lucide-react';

/**
 * 标签输入组件
 * @param {Object} props
 * @param {Array<string>} props.suggestions - 建议的标签列表
 * @param {Function} props.onAdd - 添加标签回调
 */
export default function TagInput({ suggestions = [], onAdd, placeholder = '输入标签...' }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(tag =>
    tag.toLowerCase().includes(input.toLowerCase()) && input.length > 0
  );

  const handleAdd = (tag) => {
    if (tag.trim()) {
      onAdd(tag.trim());
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(input);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* 建议列表 */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => handleAdd(tag)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
            >
              <span className="text-sm text-gray-700">{tag}</span>
              <Check className="w-4 h-4 text-primary-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
