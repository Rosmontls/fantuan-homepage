const MID = "545530293";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      ...init?.headers,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { code: -1, message: text.slice(0, 200) };
  }
}

export async function getCard() {
  return fetchJson(`https://api.bilibili.com/x/web-interface/card?mid=${MID}`, {
    headers: { Referer: `https://space.bilibili.com/${MID}` },
  });
}

export async function getLiveRoom() {
  const old = await fetchJson(`https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=${MID}`, {
    headers: { Referer: `https://live.bilibili.com` },
  });

  const roomId = old?.data?.roomid;
  let liveTimeSec: number | null = null;

  if (roomId && old?.data?.liveStatus === 1) {
    const info = await fetchJson(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`, {
      headers: { Referer: `https://live.bilibili.com/${roomId}` },
    });
    const liveTimeStr = info?.data?.live_time;
    if (liveTimeStr) {
      // B站 live_time 是北京时间（+08:00），需要按 +8 解析
      const iso = liveTimeStr.replace(" ", "T") + "+08:00";
      const ts = new Date(iso).getTime();
      if (!isNaN(ts)) liveTimeSec = Math.floor(ts / 1000);
    }
  }

  return {
    code: old?.code ?? 0,
    message: old?.message ?? "OK",
    data: {
      ...old?.data,
      liveTime: liveTimeSec,
    },
  };
}

export async function getGuardCount(roomId: string | number) {
  const data = await fetchJson(
    `https://api.live.bilibili.com/xlive/app-room/v2/guardTab/topList?roomid=${roomId}&ruid=${MID}&page=1&page_size=1`,
    {
      headers: { Referer: `https://live.bilibili.com/${roomId}` },
    }
  );
  return data?.data?.info?.num ?? null;
}

async function getBiliCookies() {
  const res = await fetch(`https://space.bilibili.com/${MID}`, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.bilibili.com",
    },
  });
  const setCookie = res.headers.getSetCookie?.() || res.headers.get("set-cookie")?.split(", ") || [];
  const cookies: Record<string, string> = {};
  for (const c of setCookie) {
    const [kv] = c.split(";");
    const [k, v] = kv.trim().split("=");
    if (k && v) cookies[k] = v;
  }
  return cookies;
}

async function fetchDynamicsWithCookies(cookies: Record<string, string>) {
  const parts = [
    cookies.buvid3 && `buvid3=${cookies.buvid3}`,
    cookies.b_nut && `b_nut=${cookies.b_nut}`,
    cookies.__at_once && `__at_once=${cookies.__at_once}`,
  ].filter(Boolean);

  // 必须带上 dm_img 系列参数，否则会被风控 -352 / request banned
  const params = new URLSearchParams({
    host_mid: MID,
    offset: "",
    page: "1",
    timezone_offset: "-480",
    platform: "web",
    features: "itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote",
    dm_img_list: "[]",
    dm_img_str: "V2ViR0wgMS",
    dm_cover_img_str:
      "QU5HTEUgKEludGVsLCBJbnRlbChSKSBIRCBHcmFwaGljcyBEaXJlY3QzRDExIHZzXzVfMCBwc181XzApR29vZ2xlIEluYy4gKEludGVsKQ",
  });

  return fetchJson(
    `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?${params.toString()}`,
    {
      headers: {
        Referer: `https://space.bilibili.com/${MID}`,
        Origin: "https://space.bilibili.com",
        Cookie: parts.join("; "),
      },
    }
  );
}

export async function getDynamics() {
  const cookies = await getBiliCookies();
  const data = await fetchDynamicsWithCookies(cookies);
  if (data?.code === -352) {
    const fresh = await getBiliCookies();
    return fetchDynamicsWithCookies(fresh);
  }
  return data;
}
