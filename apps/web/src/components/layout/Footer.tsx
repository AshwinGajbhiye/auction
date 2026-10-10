import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Trust Highlights Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Verified College Emails</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only students with authenticated `.edu` or university domains can post listings, make offers, and bid on auctions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Campus-Exclusive Deals</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Meet in the library, student union, or dining hall. Zero shipping fees, zero lost packages, inspect before paying.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Transparent Feedback</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Post-transaction peer reviews and ratings maintain community integrity, student safety, and fair pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white tracking-tight">
                Campus<span className="text-brand-400">Loop</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier student marketplace combining the ease of local classifieds, the excitement of timed auctions, and the safety of a closed campus network.
            </p>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} CampusLoop Inc. Built for university communities worldwide.
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Marketplace</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/listings" className="hover:text-white transition-colors">
                  All Listings
                </Link>
              </li>
              <li>
                <Link to="/auctions" className="hover:text-white transition-colors">
                  Live Auctions
                </Link>
              </li>
              <li>
                <Link to="/listings?listingType=FIXED_PRICE" className="hover:text-white transition-colors">
                  Buy Now Items
                </Link>
              </li>
              <li>
                <Link to="/listings/create" className="hover:text-white transition-colors">
                  Sell an Item
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Safety & Trust</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Safe Meetup Spots</span>
              </li>
              <li>
                <span className="text-slate-400">Student Verification Guide</span>
              </li>
              <li>
                <span className="text-slate-400">Community Standards</span>
              </li>
              <li>
                <span className="text-slate-400">Prohibited Items</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Support</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Report an Issue</span>
              </li>
              <li>
                <span className="text-slate-400">Campus Moderator FAQ</span>
              </li>
              <li>
                <span className="text-slate-400">Register Your College</span>
              </li>
              <li>
                <span className="text-slate-400">Privacy & Terms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
