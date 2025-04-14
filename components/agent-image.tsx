"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SparklesIcon } from "@/components/utils/icons";

interface AgentImageProps {
  thumbnailUrl?: string | null;
  agentId: string;
  className?: string;
}

export function AgentImage({ thumbnailUrl, agentId, className }: AgentImageProps) {
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const generateGradient = (id: string) => {
      const hash = Array.from(id).reduce(
        (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
        0
      );
      const hue1 = Math.abs(hash % 360);
      const hue2 = Math.abs((hash * 13) % 360);
      return {
        background: `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`,
      };
    };

    setGradientStyle(generateGradient(agentId));
  }, [agentId]);

  return thumbnailUrl ? (
    <Image
      src={thumbnailUrl}
      alt="Agent thumbnail"
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={`object-cover transition-transform duration-500 group-hover:scale-110 ${className} overflow-hidden rounded-lg`}
    />
  ) : (
    <div
      style={gradientStyle}
      className="w-full h-full flex items-center justify-center"
    >
      <SparklesIcon size={32} />
    </div>
  );
} 