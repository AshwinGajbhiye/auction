import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  AlertTriangle,
  Flag,
  Share2,
  Trash2,
  Edit,
} from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { purchasesApi } from '../api/purchases';
import { offersApi } from '../api/offers';
import { conversationsApi } from '../api/conversations';
import { reportsApi } from '../api/reports';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isVerified } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals & Action states
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [reportCategory, setReportCategory] = useState('MISLEADING_DESCRIPTION');
  const [reportDescription, setReportDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    listingsApi
      .getListing(id)
      .then(setListing)
      .catch((err) => {
        console.error('Failed to load listing', err);
        setErrorMessage('Listing not found or has been deleted.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading listing details..." />;
  }

  if (!listing) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800">Listing Not Found</h2>
        <p className="text-slate-500 text-sm mt-1">{errorMessage || 'This item is no longer available.'}</p>
        <Link to="/listings" className="mt-4 inline-block text-brand-600 font-semibold text-sm hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isSeller = user?.id === listing.sellerId;
  const images = listing.images?.length > 0 ? listing.images : [{ id: '0', imageUrl: '/placeholder-item.jpg', displayOrder: 0 }];

  // Handler: Purchase Request
  const handlePurchaseRequest = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await purchasesApi.createPurchaseRequest(listing.id);
      setPurchaseModalOpen(false);
      setSuccessMessage('Purchase request sent to seller! Check your Deals page.');
      navigate('/my-deals');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit purchase request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Make an Offer
  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(offerAmount);
    if (!amountNum || amountNum <= 0) {
      setErrorMessage('Please enter a valid offer amount.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await offersApi.createOffer(listing.id, amountNum);
      setOfferModalOpen(false);
      setSuccessMessage(`Offer of ₹${amountNum.toLocaleString()} submitted!`);
      navigate('/my-deals');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit offer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Start Chat
  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/listings/${listing.id}`);
      return;
    }
    try {
      const conv = await conversationsApi.getOrCreateConversation(listing.id);
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not start conversation.');
    }
  };

  // Handler: Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setActionLoading(true);
    try {
      await reportsApi.submitReport({
        category: reportCategory,
        description: reportDescription.trim(),
        listingId: listing.id,
      });
      setReportModalOpen(false);
      setSuccessMessage('Report submitted. Campus moderators will review it.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Delete Listing
  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsApi.deleteListing(listing.id);
      navigate('/listings');
    } catch (err: any) {
      alert(err.message || 'Could not delete listing.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Success alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main product showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Media Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-xs">
            <img
              src={images[selectedImageIndex]?.imageUrl}
              alt={listing.title}
              className="w-full h-full object-contain bg-white"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="badge-pill bg-brand-600 text-white shadow-sm">
                <Tag className="h-3 w-3" />
                {listing.listingType === 'AUCTION' ? 'Auction' : 'Buy Now'}
              </span>
              <span className="badge-pill bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs font-bold uppercase text-[10px]">
                {listing.condition?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-20 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-600 shadow-md ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 mt-6">
            <h2 className="text-lg font-bold text-slate-900 font-display">Item Description</h2>
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </div>

            {/* Campus Safety Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 mt-6">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">CampusLoop Student Protection</p>
                <p>
                  Always arrange transaction exchange in well-lit public campus hubs (e.g. university library, dining hall, or student center). Never wire money outside the campus meetup.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Purchase & Seller Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Purchase Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-2">
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {listing.college?.name}
                </span>
                <span className="text-brand-600 font-bold">{listing.category?.name}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display leading-snug">
                {listing.title}
              </h1>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Price
                </span>
                <span className="font-display font-extrabold text-3xl text-slate-900">
                  ₹{Number(listing.fixedPrice || 0).toLocaleString()}
                </span>
              </div>
              <span className="badge-pill bg-emerald-100 text-emerald-800 text-xs">
                In Stock • 1 Available
              </span>
            </div>

            {/* Action Buttons */}
            {!isSeller ? (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setPurchaseModalOpen(true)}
                  disabled={listing.status !== 'ACTIVE'}
                  className="w-full py-3.5 rounded-2xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Request Purchase / Buy Now
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOfferModalOpen(true)}
                    disabled={listing.status !== 'ACTIVE'}
                    className="py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Tag className="h-4 w-4 text-brand-600" />
                    Make an Offer
                  </button>

                  <button
                    onClick={handleStartChat}
                    className="py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4 text-brand-600" />
                    Chat with Peer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-800 font-medium text-center">
                  This is your listing.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-500" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteListing}
                    className="py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Quick trust metrics */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Listed {new Date(listing.createdAt).toLocaleDateString()}
              </span>

              <button
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-[11px] transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          </div>

          {/* Seller Profile Card */}
          {listing.seller && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Seller Information
              </span>

              <div className="flex items-center gap-4">
                {listing.seller.profileImageUrl ? (
                  <img
                    src={listing.seller.profileImageUrl}
                    alt={listing.seller.name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 font-extrabold text-lg flex items-center justify-center">
                    {listing.seller.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <Link
                    to={`/users/${listing.seller.id}`}
                    className="font-bold text-slate-900 text-base hover:text-brand-600 transition-colors"
                  >
                    {listing.seller.name}
                  </Link>
                  <p className="text-xs text-slate-500">{listing.seller.college?.name || 'Verified Student'}</p>

                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-700">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold">
                      {listing.seller.averageRating ? listing.seller.averageRating.toFixed(1) : 'New Seller'}
                    </span>
                    {listing.seller.reviewCount ? (
                      <span className="text-slate-400 text-[11px]">({listing.seller.reviewCount} reviews)</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Link
                to={`/users/${listing.seller.id}`}
                className="block text-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                View Full Student Profile & Other Listings
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Request Purchase */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-xl text-slate-900">Confirm Purchase Request</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              By sending this request, you offer to purchase <strong>"{listing.title}"</strong> for{' '}
              <strong className="text-slate-900">₹{Number(listing.fixedPrice).toLocaleString()}</strong>.
            </p>
            <p className="text-xs text-slate-500">
              The seller will receive your request and agree on an in-person exchange time on campus.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPurchaseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseRequest}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Make an Offer */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-xl text-slate-900">Make an Offer</h3>
            <p className="text-xs text-slate-500">
              Listed Price: ₹{Number(listing.fixedPrice).toLocaleString()}. Propose a fair student price.
            </p>

            <form onSubmit={handleMakeOffer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Offer Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Listing */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-xl text-slate-900">Report Listing</h3>
            <p className="text-xs text-slate-500">
              Campus safety is priority #1. Help campus moderators keep the marketplace trusted.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                >
                  <option value="MISLEADING_DESCRIPTION">Misleading Description</option>
                  <option value="PROHIBITED_ITEM">Prohibited Item</option>
                  <option value="FRAUDULENT_LISTING">Suspected Fraud / Scam</option>
                  <option value="SPAM">Spam</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Details</label>
                <textarea
                  required
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
