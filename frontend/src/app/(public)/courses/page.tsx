'use client';

import * as React from 'react';
import { 
  Search, SlidersHorizontal, BookOpen, X, Filter, 
  ChevronDown, Grid3x3, List, TrendingUp, Clock,
  Star, Users, Sparkles, Layers, SortAsc, SortDesc,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourseCard, CourseCardSkeleton } from '@/components/public/Cards';
import type { Course, ApiListResponse } from '@/types';

const PAGE_SIZE = 9;

type StatusFilter = 'all' | 'published';
type SortOption = 'newest' | 'popular' | 'rating' | 'alphabetical';
type ViewMode = 'grid' | 'list';

// ── Filter Dropdown Component ──────────────────────────────────────────────
function FilterDropdown({ 
  label, 
  options, 
  value, 
  onChange,
  icon,
}: { 
  label: string; 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-md"
      >
        {icon}
        {selected?.label || label}
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-200/20 dark:shadow-neutral-800/20 py-1.5 z-50 animate-slide-up">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-sm text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                option.value === value 
                  ? 'text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-950/30'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pagination Component ───────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }: { 
  page: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (page > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="transition-all duration-200 hover:scale-105"
      >
        Previous
      </Button>
      
      {getPageNumbers().map((p, i) => (
        <React.Fragment key={i}>
          {p === '...' ? (
            <span className="px-2 text-sm text-neutral-400">…</span>
          ) : (
            <button
              onClick={() => onPageChange(p as number)}
              className={`min-w-[2.5rem] h-10 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                p === page
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md'
              }`}
            >
              {p}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <Button
        variant="secondary"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="transition-all duration-200 hover:scale-105"
      >
        Next
      </Button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [status] = React.useState<StatusFilter>('published');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = React.useState(false);

  const debouncedSearch = useDebounce(search, 350);

  // Reset page when search or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortBy]);

  // Fetch courses
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      'populate[instructor]': 'true',
      'populate[lessons]': 'true',
      'populate[thumbnail]': 'true',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(PAGE_SIZE),
      'filters[status]': 'published',
    });

    // Search filter
    if (debouncedSearch.trim()) {
      params.set('filters[title][$containsi]', debouncedSearch.trim());
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        params.set('sort', 'createdAt:desc');
        break;
      case 'popular':
        params.set('sort', 'enrollments:desc');
        break;
      case 'rating':
        params.set('sort', 'rating:desc');
        break;
      case 'alphabetical':
        params.set('sort', 'title:asc');
        break;
    }

    api.get<ApiListResponse<Course>>(`/courses?${params}`, { token: null })
      .then((res) => {
        if (cancelled) return;
        setCourses(res.data ?? []);
        setTotal(res.meta?.pagination?.total ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load courses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedSearch, page, sortBy]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  // Get sort icon
  const getSortIcon = () => {
    switch (sortBy) {
      case 'newest': return <Clock size={16} />;
      case 'popular': return <TrendingUp size={16} />;
      case 'rating': return <Star size={16} />;
      case 'alphabetical': return <SortAsc size={16} />;
      default: return <SortDesc size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50/50 to-white dark:from-neutral-950 dark:via-neutral-900/50 dark:to-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-3">
                <BookOpen size={14} className="text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  Course Library
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Explore Courses
              </h1>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" />
                {loading ? (
                  'Loading courses...'
                ) : (
                  <>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{total}</span>
                    course{total !== 1 ? 's' : ''} available
                    {debouncedSearch && ` matching "${debouncedSearch}"`}
                  </>
                )}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 self-start">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-violet-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search courses by title, instructor, or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`
                    w-full rounded-xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm
                    pl-10 pr-12 py-3 text-sm text-neutral-900 dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                    focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)]
                    hover:border-neutral-300 dark:hover:border-neutral-600
                    border-neutral-200 dark:border-neutral-700
                  `}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <FilterDropdown
              label="Sort"
              options={sortOptions}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              icon={getSortIcon()}
            />

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-md"
            >
              <Filter size={16} />
              Filters
              {showFilters ? <ChevronDown size={16} className="rotate-180" /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                    Category
                  </label>
                  <select className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all">
                    <option value="">All Categories</option>
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                    Level
                  </label>
                  <select className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all">
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                    Duration
                  </label>
                  <select className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all">
                    <option value="">Any Duration</option>
                    <option value="0-2">0-2 hours</option>
                    <option value="2-5">2-5 hours</option>
                    <option value="5-10">5-10 hours</option>
                    <option value="10+">10+ hours</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" className="w-full" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Error State ────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-950/30 backdrop-blur-sm px-5 py-4 mb-8 animate-slide-up">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
              </div>
              <button 
                onClick={() => setPage(p => p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/70 transition-colors"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Course Grid ────────────────────────────────────────────────── */}
        {loading ? (
          <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="animate-fade-up">
            <EmptyState
              icon={<BookOpen size={32} />}
              title={debouncedSearch ? 'No courses match your search' : 'No courses yet'}
              description={
                debouncedSearch 
                  ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                  : 'Check back soon — new courses are added regularly.'
              }
              action={
                debouncedSearch ? (
                  <Button variant="secondary" onClick={() => setSearch('')} className="gap-2">
                    <X size={16} />
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
            {courses.map((course, index) => (
              <div 
                key={course.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing <span className="font-medium text-neutral-700 dark:text-neutral-300">{((page - 1) * PAGE_SIZE) + 1}</span> 
                {' - '}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {Math.min(page * PAGE_SIZE, total)}
                </span>
                {' of '}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{total}</span> courses
              </p>
              <Pagination 
                page={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}