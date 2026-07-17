export interface Status {
  mid: string;
  name: string;
  avatar: string;
  sign: string;
  fans: number;
  level: number;
  live: {
    roomId: number | null;
    status: "live" | "offline";
    title: string;
    cover: string;
    online: number;
    url: string;
    liveTime: number | null;
  };
  guards: number | null;
}

export interface DynamicItem {
  id: string;
  type: string;
  author: string;
  avatar?: string;
  pubTime: string;
  pubTs: number;
  link: string;
  content?: string;
  cover?: string;
  images?: string[];
  bvid?: string;
  duration?: string;
  play?: number;
  danmaku?: number;
}
