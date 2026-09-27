import React from 'react';
import { Search, X, ArrowUpDown, Trash2 } from 'lucide-react';
import type { FilterOptions, TaskStatus, TaskPriority } from '../types/todo';

interface FilterSortBarProps {
  filter: FilterOptions;
  onFilterChange: (updates: Partial<FilterOptions>) => void;
  availableTags: string[];
  onClearCompleted: () => void;
  hasCompletedTasks: boolean;
}

export const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filter,
  onFilterChange,
  availableTags,
  onClearCompleted,
  hasCompletedTasks
}) => {
  const statusOptions: { value: 'all' | TaskStatus; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'todo', label: 'Cần làm' },
    { value: 'in_progress', label: 'Đang làm' },
    { value: 'completed', label: 'Hoàn thành' },
  ];

  return (
    <div className="filter-bar glass-panel">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm công việc, mô tả, hashtag..."
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        {filter.search && (
          <button
            type="button"
            className="action-btn-sm"
            onClick={() => onFilterChange({ search: '' })}
            style={{ position: 'absolute', right: '8px' }}
            title="Xóa tìm kiếm"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div className="filter-group">
        {statusOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={`filter-badge ${filter.status === option.value ? 'active' : ''}`}
            onClick={() => onFilterChange({ status: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Priority & Tag Filters + Sort Controls */}
      <div className="filter-group" style={{ marginLeft: 'auto' }}>
        {/* Priority Filter */}
        <select
          className="option-select"
          value={filter.priority}
          onChange={(e) => onFilterChange({ priority: e.target.value as 'all' | TaskPriority })}
          aria-label="Lọc theo mức độ ưu tiên"
        >
          <option value="all">Mọi mức độ</option>
          <option value="urgent">Khẩn cấp</option>
          <option value="high">Ưu tiên cao</option>
          <option value="medium">Bình thường</option>
          <option value="low">Ưu tiên thấp</option>
        </select>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <select
            className="option-select"
            value={filter.tag}
            onChange={(e) => onFilterChange({ tag: e.target.value })}
            aria-label="Lọc theo hashtag"
          >
            <option value="all">Mọi Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        )}

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <select
            className="option-select"
            value={filter.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterOptions['sortBy'] })}
            aria-label="Sắp xếp theo"
          >
            <option value="order">Thứ tự tùy chỉnh</option>
            <option value="dueDate">Ngày hết hạn</option>
            <option value="priority">Mức độ ưu tiên</option>
            <option value="createdAt">Mới tạo nhất</option>
            <option value="title">Tên việc (A-Z)</option>
          </select>

          <button
            type="button"
            className="action-btn-sm"
            onClick={() => onFilterChange({ sortDirection: filter.sortDirection === 'asc' ? 'desc' : 'asc' })}
            title={`Hướng sắp xếp: ${filter.sortDirection === 'asc' ? 'Tăng dần' : 'Giảm dần'}`}
          >
            <ArrowUpDown size={15} />
          </button>
        </div>

        {/* Clear Completed Action */}
        {hasCompletedTasks && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClearCompleted}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            title="Dọn dẹp các việc đã hoàn thành"
          >
            <Trash2 size={14} />
            <span>Dọn việc xong</span>
          </button>
        )}
      </div>
    </div>
  );
};
