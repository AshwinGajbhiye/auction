"use strict";
// ─── Enums ──────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ReportStatus = exports.ReportCategory = exports.OfferStatus = exports.PurchaseStatus = exports.AuctionStatus = exports.ListingStatus = exports.ListingType = exports.ItemCondition = exports.CollegeStatus = exports.UserStatus = exports.UserRole = void 0;
exports.UserRole = {
    STUDENT: 'STUDENT',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
};
exports.UserStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    BANNED: 'BANNED',
};
exports.CollegeStatus = {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    INACTIVE: 'INACTIVE',
};
exports.ItemCondition = {
    NEW: 'NEW',
    LIKE_NEW: 'LIKE_NEW',
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    FOR_PARTS: 'FOR_PARTS',
};
exports.ListingType = {
    FIXED_PRICE: 'FIXED_PRICE',
    AUCTION: 'AUCTION',
};
exports.ListingStatus = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    RESERVED: 'RESERVED',
    SOLD: 'SOLD',
    DELETED: 'DELETED',
};
exports.AuctionStatus = {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    ENDED: 'ENDED',
    CANCELLED: 'CANCELLED',
};
exports.PurchaseStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    EXCHANGE_PENDING: 'EXCHANGE_PENDING',
    COMPLETED: 'COMPLETED',
    DISPUTED: 'DISPUTED',
};
exports.OfferStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    COUNTERED: 'COUNTERED',
    EXPIRED: 'EXPIRED',
    WITHDRAWN: 'WITHDRAWN',
};
exports.ReportCategory = {
    FRAUDULENT_LISTING: 'FRAUDULENT_LISTING',
    PROHIBITED_ITEM: 'PROHIBITED_ITEM',
    MISLEADING_DESCRIPTION: 'MISLEADING_DESCRIPTION',
    SUSPICIOUS_SELLER: 'SUSPICIOUS_SELLER',
    HARASSMENT: 'HARASSMENT',
    SPAM: 'SPAM',
    PAYMENT_DISPUTE: 'PAYMENT_DISPUTE',
    OTHER: 'OTHER',
};
exports.ReportStatus = {
    OPEN: 'OPEN',
    UNDER_REVIEW: 'UNDER_REVIEW',
    RESOLVED: 'RESOLVED',
    DISMISSED: 'DISMISSED',
};
exports.NotificationType = {
    NEW_MESSAGE: 'NEW_MESSAGE',
    PURCHASE_REQUEST: 'PURCHASE_REQUEST',
    PURCHASE_ACCEPTED: 'PURCHASE_ACCEPTED',
    PURCHASE_REJECTED: 'PURCHASE_REJECTED',
    OFFER_RECEIVED: 'OFFER_RECEIVED',
    OFFER_ACCEPTED: 'OFFER_ACCEPTED',
    OFFER_REJECTED: 'OFFER_REJECTED',
    COUNTER_OFFER: 'COUNTER_OFFER',
    OUTBID: 'OUTBID',
    AUCTION_ENDING_SOON: 'AUCTION_ENDING_SOON',
    AUCTION_WON: 'AUCTION_WON',
    AUCTION_LOST: 'AUCTION_LOST',
    LISTING_EXPIRED: 'LISTING_EXPIRED',
    EXCHANGE_CONFIRMED: 'EXCHANGE_CONFIRMED',
    NEW_REVIEW: 'NEW_REVIEW',
    MODERATION_ACTION: 'MODERATION_ACTION',
};
//# sourceMappingURL=index.js.map