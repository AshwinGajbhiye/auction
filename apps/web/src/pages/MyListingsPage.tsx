import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ShoppingBag, Trash2, Eye, Tag, Gavel } from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const res = await listingsApi.getMyListings(1, 50);
      setListings(res.items || []);
    } catch (err) {
      console.error('Failed to load my listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsApi.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err.message || 'Could not delete listing.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            My Listings & Sales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and manage your posted items on campus
          </p>
        </div>

        <Link
          to="/listings/create"
          className="inline-flex items-center gap-2 gradient-brand text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          + Post New Listing
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your listings..." />
      ) : listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={item.images?.[0]?.imageUrl || '/placeholder-item.jpg'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge-pill text-[10px] uppercase font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'RESERVED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="badge-pill bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {item.listingType === 'AUCTION' ? 'Auction' : 'Fixed Price'}
                    </span>
                  </div>

                  <Link
                    to={item.listingType === 'AUCTION' ? `/auctions/${item.auction?.id || item.id}` : `/listings/${item.id}`}
                    className="font-bold text-slate-900 text-sm hover:text-brand-600 block"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-slate-500">
                    {item.listingType === 'AUCTION' ? (
                      <>
                        Highest Bid:{' '}
                        <strong className="text-amber-600 font-mono">
                          ₹{Number(item.auction?.currentHighestBid || item.auction?.startingBid || 0).toLocaleString()}
                        </strong>
                      </>
                    ) : (
                      <>
                        Price:{' '}
                        <strong className="text-slate-900 font-display">
                          ₹{Number(item.fixedPrice || 0).toLocaleString()}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={item.listingType === 'AUCTION' ? `/auctions/${item.auction?.id || item.id}` : `/listings/${item.id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No Listings Yet"
          description="You haven't listed any items for sale. Declutter your dorm and earn extra cash today!"
          actionText="+ Post Your First Item"
          actionLink="/listings/create"
        />
      )}
    </div>
  );
};
