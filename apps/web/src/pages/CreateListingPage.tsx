import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Tag, Gavel, AlertCircle, Sparkles } from 'lucide-react';
import { listingsApi } from '../api/listings';
import { categoriesApi, Category } from '../api/colleges';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [listingType, setListingType] = useState<'FIXED_PRICE' | 'AUCTION'>('FIXED_PRICE');
  const [fixedPrice, setFixedPrice] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [bidIncrement, setBidIncrement] = useState('50');
  const [durationHours, setDurationHours] = useState('72'); // 3 days default
  const [description, setDescription] = useState('');

  // Image uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    if (selectedFiles.length + filesArray.length > 8) {
      alert('Maximum 8 photos allowed per listing.');
      return;
    }

    const newFiles = [...selectedFiles, ...filesArray];
    setSelectedFiles(newFiles);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError('Please upload at least 1 image of your item.');
      return;
    }

    if (listingType === 'FIXED_PRICE' && (!fixedPrice || parseFloat(fixedPrice) <= 0)) {
      setError('Please provide a valid price.');
      return;
    }

    if (listingType === 'AUCTION' && (!startingBid || parseFloat(startingBid) <= 0)) {
      setError('Please provide a valid starting bid.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('categoryId', categoryId);
      formData.append('condition', condition);
      formData.append('listingType', listingType);
      formData.append('description', description.trim());

      if (listingType === 'FIXED_PRICE') {
        formData.append('fixedPrice', fixedPrice);
      } else {
        formData.append('startingBid', startingBid);
        if (reservePrice) formData.append('reservePrice', reservePrice);
        formData.append('bidIncrement', bidIncrement);
        const startsAt = new Date();
        const endsAt = new Date(Date.now() + parseInt(durationHours) * 60 * 60 * 1000);
        formData.append('startsAt', startsAt.toISOString());
        formData.append('endsAt', endsAt.toISOString());
      }

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const created = await listingsApi.createListing(formData);
      navigate(`/listings/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
        <div>
          <span className="badge-pill bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            Campus Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Sell an Item on Campus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reach students at your university. Takes less than a minute.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Format selector: Buy Now vs Timed Auction */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Selling Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setListingType('FIXED_PRICE')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  listingType === 'FIXED_PRICE'
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-brand-100 text-brand-700 shrink-0">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Buy Now</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set a fixed price. Buyers can purchase or negotiate offers.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setListingType('AUCTION')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  listingType === 'AUCTION'
                    ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Timed Auction</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Students place bids until the clock ends. High energy & competitive.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TI-84 Plus Graphing Calculator (Like New)"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Category & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              >
                <option value="NEW">Brand New (Unopened)</option>
                <option value="LIKE_NEW">Like New (Mint)</option>
                <option value="GOOD">Good (Light use)</option>
                <option value="FAIR">Fair (Visible wear)</option>
                <option value="FOR_PARTS">For Parts / Needs Repair</option>
              </select>
            </div>
          </div>

          {/* Pricing inputs depending on format */}
          {listingType === 'FIXED_PRICE' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Fixed Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="1"
                  required
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Starting Bid (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Reserve Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Duration
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="24">1 Day (24 hrs)</option>
                    <option value="48">2 Days (48 hrs)</option>
                    <option value="72">3 Days (72 hrs)</option>
                    <option value="120">5 Days</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include details about item condition, edition, accessories included, and preferred on-campus meetup spots..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Image Upload Area */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Photos (Up to 8) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-900/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {selectedFiles.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/20 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center">
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-600">+ Add Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl gradient-brand text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Publishing Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
