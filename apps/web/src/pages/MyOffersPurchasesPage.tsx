import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  ShoppingBag,
  Gavel,
  Check,
  X,
  MessageSquare,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { offersApi, Offer } from '../api/offers';
import { purchasesApi, Purchase } from '../api/purchases';
import { auctionsApi } from '../api/auctions';
import { reviewsApi } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const MyOffersPurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'purchases' | 'offers' | 'bids'>('purchases');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Counter offer modal state
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, offersRes, bidsRes] = await Promise.all([
        purchasesApi.getMyPurchases(1, 50),
        offersApi.getMyOffers(1, 50),
        auctionsApi.getMyBids(1, 50),
      ]);
      setPurchases(purchasesRes.items || []);
      setOffers(offersRes.items || []);
      setBids(bidsRes.items || []);
    } catch (err) {
      console.error('Failed to load deals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Purchase Actions
  const handlePurchaseAction = async (purchaseId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      await purchasesApi.respondToPurchase(purchaseId, action);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update purchase request.');
    }
  };

  const handleConfirmExchange = async (purchaseId: string) => {
    try {
      await purchasesApi.confirmExchange(purchaseId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm exchange.');
    }
  };

  // Offer Actions
  const handleOfferAction = async (
    offerId: string,
    action: 'ACCEPT' | 'REJECT' | 'COUNTER',
    counter?: number,
  ) => {
    try {
      await offersApi.respondToOffer(offerId, action, counter);
      setCounterModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to respond to offer.');
    }
  };

  // Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseId) return;

    setReviewSubmitting(true);
    try {
      await reviewsApi.createReview(selectedPurchaseId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          My Deals & Transactions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your incoming purchase requests, offers, and live auction bids
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'purchases'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Purchases ({purchases.length})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'offers'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="h-4 w-4" />
          Price Offers ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab('bids')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bids'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gavel className="h-4 w-4" />
          Auction Bids ({bids.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSpinner message="Fetching your deals..." />
      ) : activeTab === 'purchases' ? (
        /* Purchases List */
        <div className="space-y-4">
          {purchases.length > 0 ? (
            purchases.map((p) => {
              const isBuyer = p.buyerId === user?.id;
              const otherParty = isBuyer ? p.seller : p.buyer;

              return (
                <div
                  key={p.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img
                        src={p.listing?.images?.[0]?.imageUrl || '/placeholder-item.jpg'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-pill bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                          {isBuyer ? 'You Bought' : 'You Sold'}
                        </span>
                        <span
                          className={`badge-pill text-[10px] uppercase font-bold ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'ACCEPTED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{p.listing?.title}</h3>

                      <p className="text-xs text-slate-500">
                        {isBuyer ? 'Seller' : 'Buyer'}: <strong>{otherParty?.name}</strong> • Agreed Price:{' '}
                        <strong className="text-slate-900 font-display">₹{Number(p.agreedPrice).toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isBuyer && p.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handlePurchaseAction(p.id, 'ACCEPT')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept Deal
                        </button>
                        <button
                          onClick={() => handlePurchaseAction(p.id, 'DECLINE')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </>
                    )}

                    {(p.status === 'ACCEPTED' || p.status === 'EXCHANGE_ARRANGED') && (
                      <button
                        onClick={() => handleConfirmExchange(p.id)}
                        className="px-4 py-2 rounded-xl gradient-brand text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Confirm Exchange Completed
                      </button>
                    )}

                    {p.status === 'COMPLETED' && !p.review && (
                      <button
                        onClick={() => {
                          setSelectedPurchaseId(p.id);
                          setReviewModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Leave Peer Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No purchase transactions found.
            </div>
          )}
        </div>
      ) : activeTab === 'offers' ? (
        /* Offers List */
        <div className="space-y-4">
          {offers.length > 0 ? (
            offers.map((o) => {
              const isBuyer = o.buyerId === user?.id;

              return (
                <div
                  key={o.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-pill bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                        {isBuyer ? 'Offer Sent' : 'Offer Received'}
                      </span>
                      <span
                        className={`badge-pill text-[10px] uppercase font-bold ${
                          o.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{o.listing?.title}</h3>

                    <p className="text-xs text-slate-500">
                      Offered: <strong className="text-brand-600 font-display">₹{Number(o.amount).toLocaleString()}</strong>{' '}
                      (Original: ₹{Number(o.listing?.fixedPrice || 0).toLocaleString()})
                    </p>
                  </div>

                  {/* Actions for Seller */}
                  {!isBuyer && o.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOfferAction(o.id, 'ACCEPT')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOfferId(o.id);
                          setCounterModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => handleOfferAction(o.id, 'REJECT')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No offers sent or received.
            </div>
          )}
        </div>
      ) : (
        /* Auction Bids List */
        <div className="space-y-4">
          {bids.length > 0 ? (
            bids.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {b.auction?.listing?.title || 'Campus Auction'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your Bid: <strong className="text-amber-600 font-mono">₹{Number(b.amount).toLocaleString()}</strong> • Status:{' '}
                    <span className="font-semibold">{b.auction?.status}</span>
                  </p>
                </div>
                <Link
                  to={`/auctions/${b.auction?.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                >
                  View Auction →
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              You haven't placed any bids on live auctions yet.
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-xl text-slate-900">Leave Peer Review</h3>
            <p className="text-xs text-slate-500">
              How did the transaction go? Honest reviews protect the student community.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Feedback Comment</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Fast meetup, great condition, smooth deal..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-xl text-slate-900">Make Counter Offer</h3>
            <p className="text-xs text-slate-500">Propose a revised price to the buyer.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Counter Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="e.g. 900"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedOfferId &&
                    counterAmount &&
                    handleOfferAction(selectedOfferId, 'COUNTER', parseFloat(counterAmount))
                  }
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md"
                >
                  Send Counter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
