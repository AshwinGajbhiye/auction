import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Gavel,
  ShoppingBag,
  Bell,
  MessageSquare,
  Heart,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isModerator, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro-bar showing verified college status */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Verified Student Network •{' '}
              <strong className="text-white font-medium">
                {user?.college?.name || 'All Universities'}
              </strong>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px]">
            <span>100% Student-to-Student Deals</span>
            <span>•</span>
            <span>Safe In-Campus Meetups</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-glow-brand transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
                Campus<span className="text-brand-600">Loop</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">
                College Marketplace
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, electronics, dorm decor, bikes..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/listings"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="h-4 w-4 text-slate-500" />
              Marketplace
            </Link>
            <Link
              to="/auctions"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50/50 transition-colors flex items-center gap-1.5"
            >
              <Gavel className="h-4 w-4 text-amber-500" />
              Live Auctions
            </Link>
          </nav>

          {/* Action buttons / Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/listings/create"
                  className="hidden sm:inline-flex items-center gap-1.5 gradient-brand text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  Sell Item
                </Link>

                <Link
                  to="/my-favourites"
                  aria-label="Favourites"
                  className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors relative"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                <Link
                  to="/messages"
                  aria-label="Messages"
                  className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors relative"
                >
                  <MessageSquare className="h-5 w-5" />
                  {Number(user?.unreadMessagesCount ?? 0) > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-600 text-[10px] font-bold text-white flex items-center justify-center">
                      {user?.unreadMessagesCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/notifications"
                  aria-label="Notifications"
                  className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {Number(user?.unreadNotificationsCount ?? 0) > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {user?.unreadNotificationsCount}
                    </span>
                  )}
                </Link>

                {/* Profile menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full border border-slate-200 hover:border-brand-500 focus:outline-none transition-colors"
                  >
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to={`/users/${user?.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        My Public Profile
                      </Link>
                      <Link
                        to="/my-listings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                        My Listings & Sales
                      </Link>
                      <Link
                        to="/my-deals"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Gavel className="h-4 w-4 text-slate-400" />
                        Offers & Purchases
                      </Link>

                      {isModerator && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-brand-700 font-medium hover:bg-brand-50 border-t border-slate-100"
                        >
                          <Shield className="h-4 w-4 text-brand-600" />
                          Mod & Admin Hub
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100 text-left"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="gradient-brand text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
                >
                  Join Campus
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-md"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/listings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 text-sm font-medium text-slate-700"
            >
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              Marketplace
            </Link>
            <Link
              to="/auctions"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 text-sm font-medium text-amber-800"
            >
              <Gavel className="h-4 w-4 text-amber-600" />
              Auctions
            </Link>
          </div>

          {isAuthenticated && (
            <Link
              to="/listings/create"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center gradient-brand text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs"
            >
              + Sell an Item Now
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
