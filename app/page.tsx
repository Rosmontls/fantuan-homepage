import fs from "fs";
import path from "path";
import { getCard, getLiveRoom, getGuardCount, getDynamics } from "@/lib/bilibili";
import { Status, DynamicItem } from "@/lib/types";
import Dashboard from "@/components/Dashboard";

function parseDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function fetchFromApi(): Promise<{ status: Status; dynamics: DynamicItem[]; dynamicError?: string }> {
  const [card, live] = await Promise.all([getCard(), getLiveRoom()]);
  const profile = card?.data?.card || {};
  const liveData = live?.data || {};
  let guards: number | null = null;
  if (liveData.roomid) {
    guards = await getGuardCount(liveData.roomid);
  }

  const status: Status = {
    mid: profile.mid || "545530293",
    name: profile.name || "饭团喵にゃん",
    avatar: profile.face || "",
    sign: profile.sign || "",
    fans: profile.fans || 0,
    level: profile.level_info?.current_level || 6,
    live: {
      roomId: liveData.roomid || null,
      status: liveData.liveStatus === 1 ? "live" : "offline",
      title: liveData.title || "",
      cover: liveData.cover || "",
      online: liveData.online || 0,
      url: liveData.url || `https://live.bilibili.com/${liveData.roomid || ""}`,
      liveTime: liveData.liveTime || null,
    },
    guards,
  };

  let dynamics: DynamicItem[] = [];
  let dynamicError: string | undefined;
  try {
    const dyn = await getDynamics();
    if (dyn?.code !== 0) {
      dynamicError = dyn?.message || "动态接口暂不可用";
    } else {
      dynamics = dyn?.data?.items?.slice(0, 10).map((it: any) => {
        const author = it.modules?.module_author || {};
        const dynamic = it.modules?.module_dynamic || {};
        const major = dynamic.major || {};
        const base = {
          id: it.id_str,
          type: it.type,
          author: author.name,
          avatar: author.avatar,
          pubTime: author.pub_time,
          pubTs: author.pub_ts,
          link: `https://t.bilibili.com/${it.id_str}`,
        };
        if (it.type === "DYNAMIC_TYPE_AV" && major.archive) {
          const arc = major.archive;
          return {
            ...base,
            content: arc.title,
            cover: arc.cover,
            bvid: arc.bvid,
            duration: parseDuration(arc.duration),
            play: arc.stat?.play,
            danmaku: arc.stat?.danmaku,
            link: `https://www.bilibili.com/video/${arc.bvid}`,
          };
        }
        if (it.type === "DYNAMIC_TYPE_DRAW" && major.draw) {
          return {
            ...base,
            content: dynamic.desc?.text || "",
            images: major.draw.items.map((img: any) => img.src),
          };
        }
        return {
          ...base,
          content: dynamic.desc?.text || "",
          cover: major.opus?.pics?.[0]?.url || null,
        };
      }) || [];
    }
  } catch (e: any) {
    dynamicError = e?.message || "动态加载失败";
  }

  return { status, dynamics, dynamicError };
}

async function fetchFromJson(): Promise<{ status: Status; dynamics: DynamicItem[]; dynamicError?: string } | null> {
  try {
    const statusPath = path.join(process.cwd(), "public", "data", "status.json");
    const dynamicsPath = path.join(process.cwd(), "public", "data", "dynamics.json");
    if (!fs.existsSync(statusPath) || !fs.existsSync(dynamicsPath)) return null;

    const status: Status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    const dynamicsRaw = JSON.parse(fs.readFileSync(dynamicsPath, "utf8"));
    const dynamics: DynamicItem[] = dynamicsRaw.items || [];
    const dynamicError = dynamicsRaw.code !== 0 ? dynamicsRaw.message || "动态接口暂不可用" : undefined;

    return { status, dynamics, dynamicError };
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = (await fetchFromJson()) || (await fetchFromApi());
  return (
    <Dashboard
      initialStatus={data.status}
      initialDynamics={data.dynamics}
      initialDynamicError={data.dynamicError}
    />
  );
}
