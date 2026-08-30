export type Post = {
  id: string;
  author: string;
  createdAt: string;
  text: string;
  images: string[];
  tags: string[];
  animation: string;
  likes: number;
  comments: number;
  discussion?: number;
};

export type PostComment = {
  login: string;
  avatar: string;
  body: string;
  createdAt: string;
  likes: number;
};

export type Work = {
  slug: string;
  title: string;
  year: string;
  tags: string[];
  image: string;
  description: string;
};
