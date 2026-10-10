export declare const UserRole: {
    readonly STUDENT: "STUDENT";
    readonly MODERATOR: "MODERATOR";
    readonly ADMIN: "ADMIN";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly BANNED: "BANNED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const CollegeStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly PENDING: "PENDING";
    readonly INACTIVE: "INACTIVE";
};
export type CollegeStatus = (typeof CollegeStatus)[keyof typeof CollegeStatus];
export declare const ItemCondition: {
    readonly NEW: "NEW";
    readonly LIKE_NEW: "LIKE_NEW";
    readonly GOOD: "GOOD";
    readonly FAIR: "FAIR";
    readonly FOR_PARTS: "FOR_PARTS";
};
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];
export declare const ListingType: {
    readonly FIXED_PRICE: "FIXED_PRICE";
    readonly AUCTION: "AUCTION";
};
export type ListingType = (typeof ListingType)[keyof typeof ListingType];
export declare const ListingStatus: {
    readonly DRAFT: "DRAFT";
    readonly ACTIVE: "ACTIVE";
    readonly PAUSED: "PAUSED";
    readonly RESERVED: "RESERVED";
    readonly SOLD: "SOLD";
    readonly DELETED: "DELETED";
};
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];
export declare const AuctionStatus: {
    readonly SCHEDULED: "SCHEDULED";
    readonly LIVE: "LIVE";
    readonly ENDED: "ENDED";
    readonly CANCELLED: "CANCELLED";
};
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];
export declare const PurchaseStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly CANCELLED: "CANCELLED";
    readonly EXPIRED: "EXPIRED";
    readonly EXCHANGE_PENDING: "EXCHANGE_PENDING";
    readonly COMPLETED: "COMPLETED";
    readonly DISPUTED: "DISPUTED";
};
export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];
export declare const OfferStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly COUNTERED: "COUNTERED";
    readonly EXPIRED: "EXPIRED";
    readonly WITHDRAWN: "WITHDRAWN";
};
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];
export declare const ReportCategory: {
    readonly FRAUDULENT_LISTING: "FRAUDULENT_LISTING";
    readonly PROHIBITED_ITEM: "PROHIBITED_ITEM";
    readonly MISLEADING_DESCRIPTION: "MISLEADING_DESCRIPTION";
    readonly SUSPICIOUS_SELLER: "SUSPICIOUS_SELLER";
    readonly HARASSMENT: "HARASSMENT";
    readonly SPAM: "SPAM";
    readonly PAYMENT_DISPUTE: "PAYMENT_DISPUTE";
    readonly OTHER: "OTHER";
};
export type ReportCategory = (typeof ReportCategory)[keyof typeof ReportCategory];
export declare const ReportStatus: {
    readonly OPEN: "OPEN";
    readonly UNDER_REVIEW: "UNDER_REVIEW";
    readonly RESOLVED: "RESOLVED";
    readonly DISMISSED: "DISMISSED";
};
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
export declare const NotificationType: {
    readonly NEW_MESSAGE: "NEW_MESSAGE";
    readonly PURCHASE_REQUEST: "PURCHASE_REQUEST";
    readonly PURCHASE_ACCEPTED: "PURCHASE_ACCEPTED";
    readonly PURCHASE_REJECTED: "PURCHASE_REJECTED";
    readonly OFFER_RECEIVED: "OFFER_RECEIVED";
    readonly OFFER_ACCEPTED: "OFFER_ACCEPTED";
    readonly OFFER_REJECTED: "OFFER_REJECTED";
    readonly COUNTER_OFFER: "COUNTER_OFFER";
    readonly OUTBID: "OUTBID";
    readonly AUCTION_ENDING_SOON: "AUCTION_ENDING_SOON";
    readonly AUCTION_WON: "AUCTION_WON";
    readonly AUCTION_LOST: "AUCTION_LOST";
    readonly LISTING_EXPIRED: "LISTING_EXPIRED";
    readonly EXCHANGE_CONFIRMED: "EXCHANGE_CONFIRMED";
    readonly NEW_REVIEW: "NEW_REVIEW";
    readonly MODERATION_ACTION: "MODERATION_ACTION";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export interface ApiSuccess<T> {
    success: true;
    data: T;
}
export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface CollegeDto {
    id: string;
    name: string;
    slug: string;
    approvedEmailDomains: string[];
    status: CollegeStatus;
    createdAt: string;
}
export interface UserPublicDto {
    id: string;
    name: string;
    profileImageUrl: string | null;
    college: {
        id: string;
        name: string;
    };
    course: string | null;
    graduationYear: number | null;
    emailVerified: boolean;
    memberSince: string;
    activeListingsCount: number;
    completedTransactionsCount: number;
    averageRating: number | null;
    reviewCount: number;
    role: UserRole;
}
export interface UserMeDto extends UserPublicDto {
    email: string;
    status: UserStatus;
    unreadNotificationsCount: number;
    unreadMessagesCount: number;
}
export interface CategoryDto {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    active: boolean;
    children?: CategoryDto[];
}
export interface ListingImageDto {
    id: string;
    imageUrl: string;
    displayOrder: number;
}
export interface ListingDto {
    id: string;
    title: string;
    description: string;
    condition: ItemCondition;
    listingType: ListingType;
    fixedPrice: string | null;
    negotiationEnabled: boolean;
    minimumAcceptablePrice: string | null;
    pickupLocation: string;
    status: ListingStatus;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    seller: UserPublicDto;
    college: {
        id: string;
        name: string;
    };
    category: CategoryDto;
    images: ListingImageDto[];
    auction?: AuctionDto | null;
    isFavourited?: boolean;
}
export interface AuctionDto {
    id: string;
    listingId: string;
    startsAt: string;
    endsAt: string;
    currentHighestBid: string | null;
    bidCount: number;
    reservePriceMet: boolean | null;
    status: AuctionStatus;
    closedAt: string | null;
}
export interface BidDto {
    id: string;
    auctionId: string;
    amount: string;
    createdAt: string;
    bidder: {
        id: string;
        name: string;
    };
}
export interface OfferDto {
    id: string;
    listingId: string;
    amount: string;
    status: OfferStatus;
    expiresAt: string;
    createdAt: string;
    buyer: {
        id: string;
        name: string;
    };
    seller: {
        id: string;
        name: string;
    };
    parentOfferId: string | null;
}
export interface PurchaseDto {
    id: string;
    listingId: string;
    agreedPrice: string;
    status: PurchaseStatus;
    reservedUntil: string | null;
    buyerConfirmedAt: string | null;
    sellerConfirmedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    listing: Pick<ListingDto, 'id' | 'title' | 'images'>;
    buyer: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
    seller: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
}
export interface ConversationDto {
    id: string;
    listingId: string;
    listing: Pick<ListingDto, 'id' | 'title' | 'images' | 'status'>;
    otherParticipant: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
    lastMessage: MessageDto | null;
    unreadCount: number;
    createdAt: string;
}
export interface MessageDto {
    id: string;
    conversationId: string;
    content: string;
    createdAt: string;
    readAt: string | null;
    sender: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
}
export interface NotificationDto {
    id: string;
    type: NotificationType;
    entityType: string | null;
    entityId: string | null;
    message: string;
    readAt: string | null;
    createdAt: string;
}
export interface ReviewDto {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
    reviewee: Pick<UserPublicDto, 'id' | 'name' | 'profileImageUrl'>;
}
export interface ReportDto {
    id: string;
    category: ReportCategory;
    description: string;
    status: ReportStatus;
    createdAt: string;
    resolvedAt: string | null;
    reporter: Pick<UserPublicDto, 'id' | 'name'>;
    reportedUser: Pick<UserPublicDto, 'id' | 'name'> | null;
    listing: Pick<ListingDto, 'id' | 'title'> | null;
}
export interface SocketNewMessageEvent {
    conversationId: string;
    message: MessageDto;
}
export interface SocketBidPlacedEvent {
    auctionId: string;
    currentHighestBid: string;
    bidCount: number;
    endsAt: string;
    reservePriceMet: boolean | null;
}
export interface SocketAuctionEndedEvent {
    auctionId: string;
    status: AuctionStatus;
    winnerId: string | null;
    finalPrice: string | null;
}
export interface SocketNotificationEvent {
    notification: NotificationDto;
}
