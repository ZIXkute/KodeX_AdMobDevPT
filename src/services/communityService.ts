import database from '@react-native-firebase/database';

export interface CommunityPost {
  id: string;
  odId: string;
  odName: string;
  odAvatar?: string;
  pokemonId: number;
  pokemonName: string;
  message: string;
  imageUrl?: string;
  captureMethod: 'ar' | 'quick';
  likes: number;
  likedBy: string[];
  createdAt: number;
}

export interface NewPostData {
  odId: string;
  odName: string;
  odAvatar?: string;
  pokemonId: number;
  pokemonName: string;
  message: string;
  captureMethod: 'ar' | 'quick';
}

const POSTS_REF = 'community_posts';
const MAX_POSTS = 50; // Limit posts to keep feed manageable

export class CommunityService {
  /**
   * Create a new community post
   */
  static async createPost(postData: NewPostData): Promise<string> {
    try {
      const postsRef = database().ref(POSTS_REF);
      const newPostRef = postsRef.push();
      
      const post: Omit<CommunityPost, 'id'> = {
        odId: postData.odId,
        odName: postData.odName,
        odAvatar: postData.odAvatar,
        pokemonId: postData.pokemonId,
        pokemonName: postData.pokemonName,
        message: postData.message,
        captureMethod: postData.captureMethod,
        likes: 0,
        likedBy: [],
        createdAt: Date.now(),
      };

      await newPostRef.set(post);
      console.log('Community post created:', newPostRef.key);
      return newPostRef.key || '';
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  }

  /**
   * Get recent community posts
   */
  static async getPosts(limit: number = MAX_POSTS): Promise<CommunityPost[]> {
    try {
      const snapshot = await database()
        .ref(POSTS_REF)
        .orderByChild('createdAt')
        .limitToLast(limit)
        .once('value');

      const posts: CommunityPost[] = [];
      
      snapshot.forEach((child) => {
        const data = child.val();
        posts.push({
          id: child.key || '',
          ...data,
          likedBy: data.likedBy || [],
        });
        return undefined; // Continue iteration
      });

      // Sort by newest first
      return posts.reverse();
    } catch (error) {
      console.error('Error getting community posts:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time post updates
   */
  static subscribeToPosts(
    callback: (posts: CommunityPost[]) => void,
    limit: number = MAX_POSTS
  ): () => void {
    const postsRef = database()
      .ref(POSTS_REF)
      .orderByChild('createdAt')
      .limitToLast(limit);

    const onValue = postsRef.on('value', (snapshot) => {
      const posts: CommunityPost[] = [];
      
      snapshot.forEach((child) => {
        const data = child.val();
        posts.push({
          id: child.key || '',
          ...data,
          likedBy: data.likedBy || [],
        });
        return undefined;
      });

      // Sort by newest first
      callback(posts.reverse());
    });

    // Return unsubscribe function
    return () => postsRef.off('value', onValue);
  }

  /**
   * Like a post
   */
  static async likePost(postId: string, odId: string): Promise<void> {
    try {
      const postRef = database().ref(`${POSTS_REF}/${postId}`);
      
      await postRef.transaction((post) => {
        if (post) {
          const likedBy = post.likedBy || [];
          
          if (!likedBy.includes(odId)) {
            post.likes = (post.likes || 0) + 1;
            post.likedBy = [...likedBy, odId];
          }
        }
        return post;
      });
      
      console.log('Post liked:', postId);
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string, odId: string): Promise<void> {
    try {
      const postRef = database().ref(`${POSTS_REF}/${postId}`);
      
      await postRef.transaction((post) => {
        if (post) {
          const likedBy = post.likedBy || [];
          const index = likedBy.indexOf(odId);
          
          if (index > -1) {
            post.likes = Math.max((post.likes || 0) - 1, 0);
            post.likedBy = likedBy.filter((id: string) => id !== odId);
          }
        }
        return post;
      });
      
      console.log('Post unliked:', postId);
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  /**
   * Delete a post (only by owner)
   */
  static async deletePost(postId: string, odId: string): Promise<void> {
    try {
      const postRef = database().ref(`${POSTS_REF}/${postId}`);
      const snapshot = await postRef.once('value');
      const post = snapshot.val();

      if (post && post.odId === odId) {
        await postRef.remove();
        console.log('Post deleted:', postId);
      } else {
        throw new Error('Not authorized to delete this post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}
