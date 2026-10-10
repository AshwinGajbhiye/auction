import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X, SlidersHorizontal } from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { categoriesApi, Category } from '../api/colleges';
import { ListingCard } from '../components/listing/ListingCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const listingType = (searchParams.get('listingType') as any) || '';
  const condition = searchParams.get('condition') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = (searchParams.get('sortBy') as any) || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch listings on filter change
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const res = await listingsApi.getListings({
          q: q || undefined,
          categoryId: categoryId || undefined,
          listingType: listingType || undefined,
          condition: condition || undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          sortBy: sortBy || undefined,
          page,
          pageSize: 16,
        });
        setListings(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('Failed to load listings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [q, categoryId, listingType, condition, minPrice, maxPrice, sortBy, page]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = !!(q || categoryId || listingType || condition || minPrice || maxPrice);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Campus Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {total} {total === 1 ? 'item' : 'items'} found on your campus
          </p>
        </div>

        {/* Sort & Mobile filter button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters {hasActiveFilters && '• Active'}
          </button>

          <select
            value={sortBy}
            onChange={(e) => updateParam('sortBy', e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500 shadow-xs"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="ending_soonest">Auctions: Ending Soonest</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs md:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-600" />
              Filter Results
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-rose-600 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Search keyword in sidebar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Keyword</label>
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => updateParam('q', e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Listing Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => updateParam('listingType', listingType === 'FIXED_PRICE' ? '' : 'FIXED_PRICE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  listingType === 'FIXED_PRICE'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Buy Now
              </button>
              <button
                onClick={() => updateParam('listingType', listingType === 'AUCTION' ? '' : 'AUCTION')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  listingType === 'AUCTION'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Auction
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => updateParam('categoryId', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Condition</label>
            <select
              value={condition}
              onChange={(e) => updateParam('condition', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            >
              <option value="">Any Condition</option>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="FOR_PARTS">For Parts</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Price (₹)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <section className="md:col-span-3 space-y-6">
          {loading ? (
            <LoadingSpinner message="Fetching campus listings..." />
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-500 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No items found"
              description="No campus listings matched your filter criteria. Try adjusting keywords or clearing filters."
              actionText="Reset Filters"
              onAction={clearAllFilters}
            />
          )}
        </section>
      </div>
    </div>
  );
};
