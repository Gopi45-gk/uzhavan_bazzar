import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CommunityPost {
  id: string;
  author: string;
  authorId?: string;
  village: string;
  avatarBg: string;
  cropTag: string;
  timeAgo: string;
  text: string;
  likes: number;
  comments: number;
  createdAt?: any;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Shanmugam P.',
    village: 'Oddanchatram',
    avatarBg: 'bg-emerald-600',
    cropTag: 'Tomato Blight',
    timeAgo: '2h ago',
    text: 'Whitefly infestation seen on early tomato crop. Anyone tried neem oil + soap spray? What ratio worked best?',
    likes: 14,
    comments: 8,
  },
  {
    id: 'post-2',
    author: 'Kandasamy M.',
    village: 'Paramathi Velur',
    avatarBg: 'bg-amber-600',
    cropTag: 'Mandi Rates',
    timeAgo: '5h ago',
    text: 'Shallots rates crossed ₹48 in Madurai wholesale market today morning. Demand expected to stay high for Pongal sowing season.',
    likes: 29,
    comments: 15,
  },
  {
    id: 'post-3',
    author: 'Rathinam K.',
    village: 'Tiruppur Rural',
    avatarBg: 'bg-blue-600',
    cropTag: 'Solar Drier Subsidy',
    timeAgo: '1d ago',
    text: 'Agricultural engineering department has opened online portal for 70% polyhouse solar drier subsidy. Last date is next Friday.',
    likes: 42,
    comments: 23,
  },
];

const LOCAL_STORAGE_KEY = 'uzhavan_cached_community';

export const communityService = {
  /**
   * Subscribe to community posts from Firestore /community_posts.
   */
  subscribeCommunity(callback: (posts: CommunityPost[]) => void): () => void {
    const colRef = collection(db, 'community_posts');
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          this.seedInitialCommunity();
          callback(INITIAL_POSTS);
          return;
        }

        const items: CommunityPost[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            author: d.author || 'Farmer',
            village: d.village || 'Tamil Nadu',
            avatarBg: d.avatarBg || 'bg-emerald-600',
            cropTag: d.cropTag || 'General',
            timeAgo: d.timeAgo || 'Recently',
            text: d.text || '',
            likes: d.likes ?? 0,
            comments: d.comments ?? 0,
            createdAt: d.createdAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // ignore
        }

        callback(items);
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.warn('Firestore community sync:', err?.message || err);
        }
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {
          // ignore
        }
        callback(INITIAL_POSTS);
      }
    );

    return unsubscribe;
  },

  /**
   * Creates a new community post in Firestore.
   */
  async createPost(post: {
    author: string;
    village: string;
    cropTag: string;
    text: string;
    avatarBg?: string;
  }): Promise<string> {
    try {
      const colRef = collection(db, 'community_posts');
      const docRef = await addDoc(colRef, {
        author: post.author,
        village: post.village,
        cropTag: post.cropTag,
        text: post.text,
        avatarBg: post.avatarBg || 'bg-emerald-600',
        timeAgo: 'Just now',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.warn('Failed to add post to Firestore:', err);
      return `post-${Date.now()}`;
    }
  },

  /**
   * Increments like count on a post in Firestore.
   */
  async likePost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'community_posts', postId);
      await updateDoc(docRef, {
        likes: increment(1),
      });
    } catch (err) {
      console.warn('Failed to like post in Firestore:', err);
    }
  },

  /**
   * Seeds sample community discussions.
   */
  async seedInitialCommunity(): Promise<void> {
    try {
      const colRef = collection(db, 'community_posts');
      for (const post of INITIAL_POSTS) {
        const docRef = doc(colRef, post.id);
        await setDoc(docRef, {
          ...post,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Auto-seed community failed:', err);
    }
  },
};
