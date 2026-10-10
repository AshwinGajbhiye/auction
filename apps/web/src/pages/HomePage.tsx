import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Gavel,
  ShieldCheck,
  MapPin,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Laptop,
  Home,
  Bike,
  Sparkles,
} from 'lucide-react';
import { listingsApi, Listing } from '../api/listings';
import { ListingCard } from '../components/listing/ListingCard';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [liveAuctions, setLiveAuctions] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, auctionRes] = await Promise.all([
          listingsApi.getListings({ pageSize: 8, sortBy: 'newest' }),
          listingsApi.getListings({ listingType: 'AUCTION', pageSize: 4, sortBy: 'ending_soonest' }),
        ]);
        setFeaturedListings(recentRes.items || []);
        setLiveAuctions(auctionRes.items || []);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  const categories = [
    { name: 'Textbooks & Notes', icon: BookOpen, slug: 'textbooks', color: 'from-blue-500 to-indigo-600' },
    { name: 'Electronics & Tech', icon: Laptop, slug: 'electronics', color: 'from-violet-500 to-purple-600' },
    { name: 'Dorm & Living', icon: Home, slug: 'dorm-essentials', color: 'from-emerald-500 to-teal-600' },
    { name: 'Bikes & Mobility', icon: Bike, slug: 'bikes-mobility', color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 md:p-16 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-brand-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Verified University Network</span>
            {user?.college?.name && (
              <>
                <span>•</span>
                <span className="text-white">{user.college.name}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Buy, Sell & Bid with Students on Your{' '}
            <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
              Campus.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            CampusLoop connects verified college peers to buy textbooks, dorm decor, gadgets, and join timed auctions. No shipping fees, no strangers, 100% campus trust.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl pt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you need today? (e.g. Calculus 8th Ed, iPad, Desk Lamp)"
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-brand-500/30 shadow-xl"
              />
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Highlights */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>.edu Verified Accounts Only</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-400" />
              <span>Campus Library & Dorm Meetups</span>
            </div>
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-amber-400" />
              <span>Competitive Timed Auctions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Discovery */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Browse Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find exactly what you need for this semester
            </p>
          </div>
          <Link
            to="/listings"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/listings?q=${encodeURIComponent(cat.name)}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Explore campus deals</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Live Auctions Spotlight */}
      {liveAuctions.length > 0 && (
        <section className="space-y-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-500/10 border border-amber-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    Live Campus Auctions
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                    HOT
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Bid against peers before the timer runs out. Anti-sniping protection active.
                </p>
              </div>
            </div>

            <Link
              to="/auctions"
              className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
            >
              <span>See All Auctions</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {liveAuctions.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Marketplace Listings */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                Trending on Campus
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Fresh listings from students across dorms and departments
              </p>
            </div>
          </div>

          <Link
            to="/listings"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>Explore All</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500">No listings yet on campus.</p>
            <Link
              to="/listings/create"
              className="mt-3 inline-block gradient-brand text-white text-xs font-semibold px-4 py-2 rounded-full"
            >
              Be the first to list!
            </Link>
          </div>
        )}
      </section>

      {/* Campus Seller Callout */}
      <section className="rounded-3xl gradient-brand text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-600/10">
        <div className="space-y-3 max-w-xl">
          <span className="text-xs uppercase tracking-wider font-extrabold text-brand-200">
            Student Clearinghouse
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            Moving dorms or done with classes? Turn your gear into cash.
          </h2>
          <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
            List in under 60 seconds with photos from your phone. Set a fixed price or let campus bid on it in a timed auction.
          </p>
        </div>

        <Link
          to="/listings/create"
          className="shrink-0 bg-white text-brand-700 hover:bg-brand-50 px-6 py-3.5 rounded-full font-bold text-sm shadow-lg transition-transform hover:scale-105"
        >
          Post a Free Listing Now
        </Link>
      </section>
    </div>
  );
};
