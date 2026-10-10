import React, { useState, useEffect } from 'react';
import { Gavel, Clock, Flame } from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { ListingCard } from '../components/listing/ListingCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const AuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'LIVE' | 'SCHEDULED' | 'ENDED'>('LIVE');

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const res = await listingsApi.getListings({
          listingType: 'AUCTION',
          sortBy: 'ending_soonest',
          pageSize: 24,
        });
        setAuctions(res.items || []);
      } catch (err) {
        console.error('Failed to load auctions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [statusFilter]);

  return (
    <div className="space-y-8">
      {/* Auctions Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-8 sm:p-12 shadow-xl shadow-amber-600/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100">
            <Flame className="h-4 w-4 text-amber-300" />
            Competitive Student Bidding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">
            Live Campus Auctions
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Bid directly on peer items before the clock expires. With built-in anti-sniping protection, fairness is guaranteed for every university student.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[200px]">
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-200 block">
            Anti-Sniping Rule
          </span>
          <p className="text-xs text-white mt-1 leading-snug">
            Bids placed in the final 30 seconds extend the auction by 30 seconds.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <LoadingSpinner message="Fetching live campus auctions..." />
      ) : auctions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Gavel}
          title="No Active Auctions Right Now"
          description="There are currently no live auctions running on campus. Be the first student to launch one!"
          actionText="+ Start an Auction"
          actionLink="/listings/create"
        />
      )}
    </div>
  );
};
