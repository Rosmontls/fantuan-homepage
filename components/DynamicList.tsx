"use client";

import Image from "next/image";
import { DynamicItem } from "@/lib/types";
import { Play, ImageIcon, MessageSquare, FileText, ExternalLink } from "lucide-react";

export function DynamicList({ items, error }: { items: DynamicItem[]; error?: string }) {
  if (error) {
    return (
      <div className="rounded-2xl bg-pink-50 p-6 text-center text-sm text-pink-500">
        <p>动态加载失败：{error}</p>
        <a
          href="https://space.bilibili.com/545530293/dynamic"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-pink-600 hover:underline"
        >
          去B站查看 <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-pink-50 p-6 text-center text-sm text-gray-500">
        暂无动态
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-pink-100 transition hover:-translate-y-1 hover:shadow-md hover:shadow-pink-200/40"
        >
          <div className="flex items-center gap-3">
            {item.cover ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={item.cover}
                  alt={item.content || "cover"}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  unoptimized
                />
                {item.type === "DYNAMIC_TYPE_AV" && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    {item.duration}
                  </span>
                )}
              </div>
            ) : item.images && item.images.length > 0 ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={item.images[0]}
                  alt="动态图片"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">
                  <ImageIcon size={10} />
                </span>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-400">
                {item.type === "DYNAMIC_TYPE_AV" ? <Play size={24} /> : <FileText size={24} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-gray-800 group-hover:text-pink-500">
                {item.content || "动态"}
              </p>
              <p className="mt-1 text-xs text-gray-400">{item.pubTime}</p>
              {typeof item.play === "number" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Play size={12} />
                  {formatNumber(item.play)}
                  <MessageSquare size={12} className="ml-2" />
                  {formatNumber(item.danmaku || 0)}
                </p>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function formatNumber(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toLocaleString();
}
