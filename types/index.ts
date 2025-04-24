export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  interests: string[];
  subjects: string[];
  level: number;
  xp: number;
  followers: number;
  following: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  board?: string;
  topic: string;
  fileType: 'pdf' | 'image' | 'doc';
  fileUrl: string;
  thumbnailUrl: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar?: string;
  likes: number;
  downloads: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Earnings {
  total: number;
  withdrawable: number;
  history: EarningTransaction[];
}

export interface EarningTransaction {
  id: string;
  amount: number;
  type: 'ad_view' | 'download' | 'withdrawal';
  noteId?: string;
  noteName?: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface ExamType {
  id: string;
  name: string;
}

export * from './earnings';