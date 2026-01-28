import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Tag as TagIcon, Check } from 'lucide-react';
import type { Tag } from '../../storage';

export interface SearchFilterBarProps {
  readonly tags: readonly Tag[];
  readonly totalSessions: number;
  readonly filteredCount: number;
  readonly onSearchChange: (searchTerm: string) => void;
  readonly onTagsChange: (selectedTags: string[]) => void;
  readonly selectedTags: readonly string[];
  readonly searchTerm: string;
}

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SearchFilterBar({
  tags,
  totalSessions,
  filteredCount,
  onSearchChange,
  onTagsChange,
  selectedTags,
  searchTerm,
}: SearchFilterBarProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search term (300ms as per spec)
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  // Sync local search term with prop when it changes externally
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Emit debounced search term to parent
  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleTagToggle = useCallback((tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
    onTagsChange(newTags);
  }, [selectedTags, onTagsChange]);

  // Keyboard navigation for tag dropdown
  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsTagDropdownOpen(false);
    }
  }, []);

  const handleClearAll = () => {
    setLocalSearchTerm('');
    onSearchChange('');
    onTagsChange([]);
    inputRef.current?.focus();
  };

  const hasActiveFilters = localSearchTerm.length > 0 || selectedTags.length > 0;
  const isFiltered = filteredCount !== totalSessions;

  // Results counter text
  const getResultsText = () => {
    if (totalSessions === 0) {
      return '0 sessions';
    }
    if (isFiltered) {
      return `${filteredCount} of ${totalSessions} sessions`;
    }
    return `${totalSessions} ${totalSessions === 1 ? 'session' : 'sessions'}`;
  };

  return (
    <div className="search-filter-bar">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="input search-input"
          placeholder="Search sessions..."
          value={localSearchTerm}
          onChange={handleSearchInput}
          aria-label="Search sessions"
        />
        {hasActiveFilters && (
          <button
            className="btn btn-icon btn-sm search-clear-btn"
            onClick={handleClearAll}
            aria-label="Clear search and filters"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="tag-filter-wrapper" ref={dropdownRef} onKeyDown={handleDropdownKeyDown}>
          <button
            className={`btn btn-secondary tag-filter-btn ${selectedTags.length > 0 ? 'has-selection' : ''}`}
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            aria-expanded={isTagDropdownOpen}
            aria-haspopup="listbox"
          >
            <TagIcon size={14} /> Tags
            {selectedTags.length > 0 && (
              <span className="tag-filter-count">{selectedTags.length}</span>
            )}
          </button>

          {isTagDropdownOpen && (
            <div className="tag-filter-dropdown" role="listbox" aria-label="Filter by tags">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    className={`tag-filter-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag.name)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      className="tag-filter-color"
                      style={{ backgroundColor: tag.color || '#9E9E9E' }}
                    />
                    <span className="tag-filter-name">{tag.name}</span>
                    {isSelected && <span className="tag-filter-check"><Check size={14} /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Tags Chips */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map((tagName) => {
            const tag = tags.find(t => t.name === tagName);
            return (
              <button
                key={tagName}
                className="selected-tag-chip"
                onClick={() => handleTagToggle(tagName)}
                aria-label={`Remove filter ${tagName}`}
                style={{
                  borderColor: tag?.color || '#9E9E9E',
                  backgroundColor: `${tag?.color || '#9E9E9E'}20`,
                }}
              >
                <span
                  className="selected-tag-dot"
                  style={{ backgroundColor: tag?.color || '#9E9E9E' }}
                />
                {tagName}
                <span className="selected-tag-remove"><X size={12} /></span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results Counter */}
      <div className="search-results-counter">
        <span className="text-caption text-muted">{getResultsText()}</span>
      </div>
    </div>
  );
}

/**
 * Empty search state component
 */
export function SearchEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="search-empty-state">
      <div className="empty-illustration"><Search size={48} /></div>
      <h3 className="text-body" style={{ fontWeight: 500 }}>
        No sessions found
      </h3>
      <p className="text-body-sm text-muted">
        Try adjusting your search terms or filters
      </p>
      <button className="btn btn-secondary" onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}
