import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { ListingCard } from '../components/listing/ListingCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const MyFavouritesPage: React.FC = () => {
  const [favourites, setFavourites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingsApi
      .getMyFavourites(1, 50)
      .then((res) => {
        setFavourites(
          (res.items || []).map((item) => ({
            ...item,
            isFavourited: true,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Saved Items
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Items and auctions you're watching on campus
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your saved items..." />
      ) : favourites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favourites.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No Saved Items"
          description="Click the heart icon on any marketplace item or auction to save it here for quick access."
          actionText="Browse Marketplace"
          actionLink="/listings"
        />
      )}
    </div>
  );
};
