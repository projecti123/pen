export interface Uploader {
  id: string;
  name: string;
  avatar?: string;
}

export interface Note {
  uploaderIsVerified?: boolean;
  uploaderVerificationReason?: string;
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  board: string;
  topic: string;
  fileType: 'image' | 'pdf' | 'doc';
  fileUrl: string;
  thumbnailUrl: string;
  uploaderId: string;
  uploader?: Uploader;
  uploaderName: string;
  uploaderAvatar?: string;
  likes: number;
  downloads: number;
  comments: number;
  views: number;
  adClicks: number;
  earnings: number;
  isLiked: boolean;
  isDisliked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  interests?: string[];
  subjects?: string[];
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  github_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  is_admin?: boolean;
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  subjects: string[];
  interests: string[];
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  github_url?: string;
  website_url?: string;
  is_verified?: boolean;
  verification_reason?: string | null;
  total_earnings?: number;
  support_upi?: string;
  support_count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorProfile {
  id: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  isVerified: boolean;
  verificationReason?: string;
  totalEarnings: number;
  supportUpi?: string;
  supportCount: number;
}

export interface CreatorEarning {
  id: string;
  creatorId: string;
  amount: number;
  type: 'ad_revenue' | 'support_tip';
  createdAt: string;
}
