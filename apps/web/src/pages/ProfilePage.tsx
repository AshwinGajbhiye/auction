import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Star,
  ShoppingBag,
  MessageSquare,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import { reviewsApi, ReviewItem } from '../api/reviews';
import { Listing, listingsApi } from '../api/listings';
import { ListingCard } from '../components/listing/ListingCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const [userData, listingsData, reviewsData] = await Promise.all([
          api.get<any>(`/users/${id}`),
          api.get<any>(`/users/${id}/listings`),
          reviewsApi.getUserReviews(id, 1, 20),
        ]);
        setProfile(userData);
        setListings(listingsData.items || []);
        setReviews(reviewsData.items || []);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading student profile..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800">Student Not Found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Profile Header Box */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-brand-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {profile.name?.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {profile.name}
              </h1>
              {profile.emailVerified && (
                <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Verified Student
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {profile.college?.name}
              {profile.course && ` • ${profile.course}`}
              {profile.graduationYear && ` '${String(profile.graduationYear).slice(-2)}`}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <strong className="text-slate-800">
                  {profile.averageRating ? profile.averageRating.toFixed(1) : 'No reviews'}
                </strong>
                {profile.reviewCount ? ` (${profile.reviewCount})` : ''}
              </span>

              <span>•</span>

              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Member since {new Date(profile.memberSince).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'listings'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Active Listings ({listings.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className="h-4 w-4" />
          Peer Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'listings' ? (
        listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            No active listings from this student right now.
          </div>
        )
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                    {r.reviewer.name?.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{r.reviewer.name}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {r.comment && <p className="text-xs text-slate-700 leading-relaxed pt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
          No peer reviews recorded yet.
        </div>
      )}
    </div>
  );
};
