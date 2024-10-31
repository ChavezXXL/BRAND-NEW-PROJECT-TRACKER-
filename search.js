import React, { useState } from 'react';

function AdvancedSearch({ onSearch, type = 'projects' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { from: '', to: '' },
    status: 'all',
    priority: 'all'
  });

  // Filter options
  const statusOptions = ['All', 'Not Started', 'In Progress', 'Completed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High'];

  const handleSearch = () => {
    onSearch({
      searchTerm,
      filters
    });
  };

  return (
    <div className="search-box bg-white p-4 rounded-lg shadow">
      {/* Main search bar */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded"
          placeholder={`Search ${type}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 border rounded hover:bg-gray-100"
        >
          <i className="fas fa-filter"></i>
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  value={filters.dateRange.from}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, from: e.target.value }
                  })}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  value={filters.dateRange.to}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, to: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full px-2 py-1 border rounded text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {statusOptions.map(status => (
                  <option key={status.toLowerCase()} value={status.toLowerCase()}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                className="w-full px-2 py-1 border rounded text-sm"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                {priorityOptions.map(priority => (
                  <option key={priority.toLowerCase()} value={priority.toLowerCase()}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 mt-4">
            <button
              className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setFilters({
                  ...filters,
                  dateRange: {
                    from: date.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0]
                  }
                });
              }}
            >
              Last 7 days
            </button>
            <button
              className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                setFilters({
                  ...filters,
                  dateRange: {
                    from: date.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0]
                  }
                });
              }}
            >
              Last 30 days
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedSearch;
