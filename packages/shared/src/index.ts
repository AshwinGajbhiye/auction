// ─── Enums ──────────────────────────────────────────────────────────────────

export const UserRole = {
  STUDENT: 'STUDENT',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const CollegeStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  INACTIVE: 'INACTIVE',
} as const;
export type CollegeStatus = (typeof CollegeStatus)[keyof typeof CollegeStatus];

export const ItemCondition = {
  NEW: 'NEW',
  LIKE_NEW: 'LIKE_NEW',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  FOR_PARTS: 'FOR_PARTS',
} as const;
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];

export const ListingType = {
  FIXED_PRICE: 'FIXED_PRICE',
  AUCTION: 'AUCTION',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const ListingStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  DELETED: 'DELETED',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const AuctionStatus = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
} as const;
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];

export const PurchaseStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  EXCHANGE_PENDING: 'EXCHANGE_PENDING',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED',
} as const;
export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export const OfferStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COUNTERED: 'COUNTERED',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export const ReportCategory = {
  FRAUDULENT_LISTING: 'FRAUDULENT_LISTING',
  PROHIBITED_ITEM: 'PROHIBITED_ITEM',
  MISLEADING_DESCRIPTION: 'MISLEADING_DESCRIPTION',
  SUSPICIOUS_SELLER: 'SUSPICIOUS_SELLER',
  HARASSMENT: 'HARASSMENT',
  SPAM: 'SPAM',
  PAYMENT_DISPUTE: 'PAYMENT_DISPUTE',
  OTHER: 'OTHER',
} as const;
export type ReportCategory = (typeof ReportCategory)[keyof typeof ReportCategory];

export const ReportStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const NotificationType = {
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
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── API response wrapper ────────────────────────────────────────────────────

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

// ─── Domain DTOs ─────────────────────────────────────────────────────────────

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
  college: { id: string; name: string };
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
  college: { id: string; name: string };
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
  bidder: { id: string; name: string };
}

export interface OfferDto {
  id: string;
  listingId: string;
  amount: string;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
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

// ─── Socket.IO event payloads ─────────────────────────────────────────────────

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
