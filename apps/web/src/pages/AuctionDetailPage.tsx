import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Gavel,
  Clock,
  ShieldCheck,
  TrendingUp,
  User,
  Star,
  MapPin,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { auctionsApi, AuctionDetail, BidItem } from '../api/auctions';
import { AuctionCountdown } from '../components/listing/AuctionCountdown';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isVerified } = useAuth();
  const { socket, joinAuction, leaveAuction } = useSocket();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidFeedback, setBidFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAuctionData = async () => {
      try {
        const [detail, bidsRes] = await Promise.all([
          auctionsApi.getAuction(id),
          auctionsApi.getBids(id, 1, 50),
        ]);
        setAuction(detail);
        setBids(bidsRes.items || []);
      } catch (err) {
        console.error('Failed to load auction', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionData();
  }, [id]);

  // Real-time socket subscription
  useEffect(() => {
    if (!id || !socket) return;

    joinAuction(id);

    const handleNewBid = (event: any) => {
      if (event.auctionId === id) {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                currentHighestBid: event.currentHighestBid,
                bidsCount: event.bidCount,
                endsAt: event.endsAt,
              }
            : null,
        );

        // Fetch updated bids list to show in feed
        auctionsApi.getBids(id, 1, 50).then((res) => {
          setBids(res.items || []);
        });
      }
    };

    socket.on('bid:placed', handleNewBid);

    return () => {
      socket.off('bid:placed', handleNewBid);
      leaveAuction(id);
    };
  }, [id, socket]);

  if (loading) {
    return <LoadingSpinner message="Entering live auction floor..." />;
  }

  if (!auction) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800">Auction Not Found</h2>
        <Link to="/auctions" className="mt-4 inline-block text-brand-600 font-semibold text-sm hover:underline">
          Browse Live Auctions
        </Link>
      </div>
    );
  }

  const currentHighest = Number(auction.currentHighestBid || auction.startingBid);
  const increment = Number(auction.bidIncrement || 50);
  const minBid = auction.currentHighestBid ? currentHighest + increment : currentHighest;
  const isSeller = user?.id === auction.listing.seller.id;
  const isHighestBidder = auction.highestBidder?.id === user?.id;

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidFeedback(null);

    const amountNum = parseFloat(bidAmount);
    if (!amountNum || amountNum < minBid) {
      setBidFeedback({
        type: 'error',
        message: `Your bid must be at least ₹${minBid.toLocaleString()}.`,
      });
      return;
    }

    setBidSubmitting(true);
    try {
      await auctionsApi.placeBid(auction.id, amountNum);
      setBidFeedback({
        type: 'success',
        message: `Bid placed successfully at ₹${amountNum.toLocaleString()}! You are now the highest bidder.`,
      });
      setBidAmount('');
    } catch (err: any) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Failed to place bid. You may have been outbid just now.',
      });
    } finally {
      setBidSubmitting(false);
    }
  };

  const setQuickBid = (extra: number) => {
    setBidAmount(String(minBid + extra));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/auctions"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          ← Back to All Auctions
        </Link>

        <div className="flex items-center gap-2">
          {auction.status === 'LIVE' ? (
            <span className="badge-pill bg-amber-500 text-white shadow-sm shadow-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
              Live Bidding Active
            </span>
          ) : (
            <span className="badge-pill bg-slate-200 text-slate-700">
              Auction Ended
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Showcase & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-xs relative">
            <img
              src={auction.listing.images?.[0]?.imageUrl || '/placeholder-item.jpg'}
              alt={auction.listing.title}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4">
              <span className="badge-pill bg-white/95 text-slate-800 shadow-xs font-bold uppercase text-[10px]">
                {auction.listing.condition}
              </span>
            </div>
          </div>

          {/* Item details */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              {auction.listing.title}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {auction.listing.college?.name}
            </p>

            <div className="border-t border-slate-100 pt-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {auction.listing.description}
            </div>

            {/* Anti-Sniping Protection Box */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 mt-6">
              <Flame className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Anti-Sniping Guarantee Active</p>
                <p className="text-amber-800">
                  If a bid is placed in the final 30 seconds, 30 seconds are automatically added to the countdown so everyone gets a fair chance to respond.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Bid Board & Placement Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Bidding Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-amber-500/5 space-y-6">
            {/* Live Countdown Clock */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">
                Time Remaining
              </span>
              <AuctionCountdown endsAt={auction.endsAt} />
            </div>

            {/* Current Price Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-800 block">
                    Current Highest Bid
                  </span>
                  <span className="font-display font-extrabold text-3xl sm:text-4xl text-amber-600 mt-1 block">
                    ₹{currentHighest.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">
                    {auction.bidsCount} {auction.bidsCount === 1 ? 'Bid' : 'Bids'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Min Increment: ₹{increment}
                  </span>
                </div>
              </div>

              {isHighestBidder && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  You currently hold the winning bid!
                </div>
              )}
            </div>

            {/* Bid Placement Form */}
            {auction.status === 'LIVE' ? (
              !isSeller ? (
                isAuthenticated ? (
                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    {bidFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          bidFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {bidFeedback.message}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Your Bid Amount (Min: ₹{minBid.toLocaleString()})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                        <input
                          type="number"
                          step="1"
                          required
                          min={minBid}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={String(minBid)}
                          className="w-full pl-8 pr-4 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickBid(0)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                      >
                        ₹{minBid}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickBid(100)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                      >
                        +₹100
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickBid(250)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                      >
                        +₹250
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={bidSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Gavel className="h-4 w-4" />
                      {bidSubmitting ? 'Placing Bid...' : 'Place Bid Now'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      Join your college peers to bid on this auction.
                    </p>
                    <Link
                      to={`/login?redirect=/auctions/${auction.id}`}
                      className="inline-block gradient-brand text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs"
                    >
                      Sign In to Bid
                    </Link>
                  </div>
                )
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center font-medium">
                  This is your auction. You cannot bid on your own item.
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-center space-y-1">
                <span className="font-bold text-sm text-slate-800">This auction has concluded.</span>
                {auction.highestBidder && (
                  <p className="text-xs text-slate-600">
                    Won by <strong>{auction.highestBidder.name}</strong> for ₹{currentHighest.toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Live Bid History Board */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Live Bid History
              </span>
              <span className="text-xs text-slate-400 font-mono">{bids.length} entries</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {bids.length > 0 ? (
                bids.map((b, idx) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      idx === 0
                        ? 'bg-amber-50/80 border-amber-200 font-semibold text-amber-900'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {b.bidder.name?.slice(0, 1)}
                      </div>
                      <span className="truncate max-w-[120px]">{b.bidder.name}</span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-200 text-amber-800 font-extrabold uppercase">
                          Highest
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm">₹{Number(b.amount).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No bids placed yet. Starting bid is ₹{Number(auction.startingBid).toLocaleString()}.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
