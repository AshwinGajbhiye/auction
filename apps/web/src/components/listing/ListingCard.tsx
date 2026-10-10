import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Gavel, Tag, Star, MapPin } from 'lucide-react';
import { Listing, listingsApi } from '../../api/listings';
import { AuctionCountdown } from './AuctionCountdown';
import { useAuth } from '../../context/AuthContext';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { isAuthenticated } = useAuth();
  const [favourited, setFavourited] = useState(listing.isFavourited ?? false);
  const [favCount, setFavCount] = useState(listing.favouriteCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || isLiking) return;

    setIsLiking(true);
    try {
      const res = await listingsApi.toggleFavourite(listing.id, favourited);
      setFavourited(res.favourited);
      setFavCount((prev) => (res.favourited ? prev + 1 : Math.max(0, prev - 1)));
    } catch {
      // ignore
    } finally {
      setIsLiking(false);
    }
  };

  const primaryImage = listing.images?.[0]?.imageUrl || '/placeholder-item.jpg';
  const isAuction = listing.listingType === 'AUCTION';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-card-hover transition-all duration-300 flex flex-col relative">
      {/* Top Media Container */}
      <Link
        to={isAuction ? `/auctions/${listing.auction?.id || listing.id}` : `/listings/${listing.id}`}
        className="block relative aspect-4/3 overflow-hidden bg-slate-100"
      >
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges on top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {isAuction ? (
            <span className="badge-pill bg-amber-500 text-white shadow-sm shadow-amber-500/30">
              <Gavel className="h-3 w-3" />
              Live Auction
            </span>
          ) : (
            <span className="badge-pill bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <Tag className="h-3 w-3" />
              Buy Now
            </span>
          )}

          <span className="badge-pill bg-white/90 text-slate-800 backdrop-blur-xs text-[10px] uppercase font-bold tracking-wider">
            {listing.condition?.replace('_', ' ')}
          </span>
        </div>

        {/* Favourite Button on top right */}
        {isAuthenticated && (
          <button
            onClick={handleToggleFavourite}
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
              favourited
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:text-rose-500 hover:bg-white shadow-xs'
            }`}
            aria-label="Save item"
          >
            <Heart className={`h-4 w-4 ${favourited ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Live auction timer overlay on bottom of image */}
        {isAuction && listing.auction?.endsAt && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <AuctionCountdown endsAt={listing.auction.endsAt} compact />
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* College and Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1 text-slate-600 truncate max-w-[140px]">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              {listing.college?.name || 'Campus'}
            </span>
            <span className="text-brand-600 font-semibold">{listing.category?.name}</span>
          </div>

          {/* Title */}
          <Link
            to={isAuction ? `/auctions/${listing.auction?.id || listing.id}` : `/listings/${listing.id}`}
            className="block"
          >
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-brand-600 transition-colors">
              {listing.title}
            </h3>
          </Link>
        </div>

        {/* Price & Bid Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            {isAuction ? (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Current Bid
                </span>
                <span className="font-display font-extrabold text-lg text-amber-600">
                  ₹{Number(listing.auction?.currentHighestBid || listing.auction?.startingBid || 0).toLocaleString()}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Price
                </span>
                <span className="font-display font-extrabold text-lg text-slate-900">
                  ₹{Number(listing.fixedPrice || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Seller micro rating */}
          {listing.seller && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-700">
                {listing.seller.averageRating ? listing.seller.averageRating.toFixed(1) : 'New'}
              </span>
              {listing.seller.reviewCount ? (
                <span className="text-[10px] text-slate-400">({listing.seller.reviewCount})</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
