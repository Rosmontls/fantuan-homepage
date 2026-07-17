const MID = "545530293";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function randomHex(len: number) {
  const chars = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function randomLSID() {
  return `${randomHex(8).toUpperCase()}_${randomHex(8).toUpperCase()}`;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
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
  // 1. 获取 buvid3 / buvid4
  const finger = await fetchJson("https://api.bilibili.com/x/frontend/finger/spi", {
    headers: {
      Referer: "https://www.bilibili.com",
      Origin: "https://www.bilibili.com",
    },
  });

  // 2. 访问主页拿 b_nut
  const home = await fetch("https://www.bilibili.com", {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.bilibili.com",
    },
  });
  const setCookie = home.headers.getSetCookie?.() || home.headers.get("set-cookie")?.split(", ") || [];
  const cookies: Record<string, string> = {};
  for (const c of setCookie) {
    const [kv] = c.split(";");
    const [k, v] = kv.trim().split("=");
    if (k && v) cookies[k] = v;
  }

  if (finger?.data?.b_3) cookies.buvid3 = finger.data.b_3;
  if (finger?.data?.b_4) cookies.buvid4 = finger.data.b_4;
  cookies.b_lsid = randomLSID();

  return cookies;
}

async function fetchDynamicsWithCookies(cookies: Record<string, string>) {
  const parts = [
    cookies.buvid3 && `buvid3=${cookies.buvid3}`,
    cookies.buvid4 && `buvid4=${cookies.buvid4}`,
    cookies.b_nut && `b_nut=${cookies.b_nut}`,
    cookies.b_lsid && `b_lsid=${cookies.b_lsid}`,
  ].filter(Boolean);

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
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Cookie: parts.join("; "),
      },
    }
  );
}

export async function getDynamics() {
  const cookies = await getBiliCookies();
  const data = await fetchDynamicsWithCookies(cookies);
  if (data?.code === -352 || data?.code === -412) {
    const fresh = await getBiliCookies();
    return fetchDynamicsWithCookies(fresh);
  }
  return data;
}
