"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Status, DynamicItem } from "@/lib/types";
import { LiveDuration } from "@/components/LiveDuration";
import { DynamicList } from "@/components/DynamicList";
import { Heart, Radio, Users, Crown, PlayCircle, ExternalLink } from "lucide-react";

export default function Dashboard({
  initialStatus,
  initialDynamics,
  initialDynamicError,
}: {
  initialStatus: Status;
  initialDynamics: DynamicItem[];
  initialDynamicError?: string;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [dynamics, setDynamics] = useState<DynamicItem[]>(initialDynamics);
  const [dynamicError, setDynamicError] = useState<string | undefined>(initialDynamicError);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    async function refreshStatus() {
      try {
        const res = await fetch(`${base}/data/status.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data);
      } catch {
        // ignore
      }
    }

    async function refreshDynamics() {
      try {
        const res = await fetch(`${base}/data/dynamics.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.code !== 0) {
          setDynamicError(data.message || "动态接口暂不可用");
        } else {
          setDynamics(data.items);
          setDynamicError(undefined);
        }
      } catch {
        // ignore
      }
    }

    refreshStatus();
    const statusInterval = setInterval(refreshStatus, 30000);
    const dynInterval = setInterval(refreshDynamics, 300000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(dynInterval);
    };
  }, [base]);

  return (
    <div className="flex-1 bg-gradient-to-br from-pink-50 via-white to-pink-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-xl shadow-pink-200/50 backdrop-blur-sm sm:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-300/30 blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-pink-200 shadow-lg sm:h-40 sm:w-40">
                <Image
                  src="/images/avatar.jpg"
                  alt={status.name}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              {status.live.status === "live" && (
                <span className="absolute -bottom-1 -right-1 flex h-8 items-center gap-1 rounded-full bg-pink-500 px-3 text-xs font-bold text-white shadow-md animate-pulse-soft">
                  <Radio size={14} />
                  直播中
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-pink-600 sm:text-4xl">
                {status.name}
              </h1>
              <p className="mt-2 text-sm text-pink-400">Lv.{status.level} UP主</p>
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-gray-600">
                {status.sign || "暂无签名"}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                <a
                  href={`https://space.bilibili.com/${status.mid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-pink-600"
                >
                  <ExternalLink size={16} />
                  B站空间
                </a>
                {status.live.status === "live" && status.live.url && (
                  <a
                    href={status.live.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-pink-500 shadow-md ring-1 ring-pink-200 transition hover:bg-pink-50"
                  >
                    <PlayCircle size={16} />
                    进入直播间
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Users size={22} />} label="粉丝数" value={formatNumber(status.fans)} />
          <StatCard icon={<Crown size={22} />} label="舰长数" value={status.guards ?? "-"} />
          <StatCard
            icon={<Radio size={22} />}
            label="直播状态"
            value={status.live.status === "live" ? "直播中" : "未开播"}
            highlight={status.live.status === "live"}
          />
          <StatCard
            icon={<Heart size={22} />}
            label="当前人气"
            value={status.live.status === "live" ? formatNumber(status.live.online) : "-"}
          />
        </section>

        {/* Live panel */}
        {status.live.status === "live" && (
          <section className="mt-8 rounded-3xl bg-white/80 p-6 shadow-lg shadow-pink-200/40 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-48 w-full overflow-hidden rounded-2xl sm:w-72">
                <Image
                  src={status.live.cover}
                  alt={status.live.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2.5 py-1 text-xs font-bold text-white">
                  LIVE
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{status.live.title}</h2>
                <p className="mt-1 text-sm text-gray-500">直播间：{status.live.roomId}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-100 px-4 py-2 text-pink-600">
                  <span className="text-sm font-medium">本场已播：</span>
                  <LiveDuration liveTime={status.live.liveTime} />
                </div>
                <div className="mt-4">
                  <a
                    href={status.live.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pink-600"
                  >
                    <PlayCircle size={16} />
                    进入直播间
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dynamics */}
        <section className="mt-8 rounded-3xl bg-white/80 p-6 shadow-lg shadow-pink-200/40 backdrop-blur-sm sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-pink-600">
            <Heart className="fill-pink-400 text-pink-400" size={22} />
            最新动态 / 投稿
          </h2>
          <DynamicList items={dynamics} error={dynamicError} />
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl p-5 text-center shadow-md transition hover:shadow-lg ${
        highlight
          ? "bg-pink-500 text-white shadow-pink-300/50"
          : "bg-white text-gray-700 shadow-pink-200/40"
      }`}
    >
      <div className={`mb-2 ${highlight ? "text-pink-100" : "text-pink-400"}`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`mt-1 text-xs ${highlight ? "text-pink-100" : "text-gray-400"}`}>{label}</div>
    </div>
  );
}

function formatNumber(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toLocaleString();
}
