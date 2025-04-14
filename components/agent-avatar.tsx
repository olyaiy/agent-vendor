import { useState, useEffect } from "react";
import Image from "next/image";
import { SparklesIcon } from "@/components/utils/icons"; // Assuming SparklesIcon is appropriate, or maybe a different icon?

interface AgentAvatarProps {
  avatarUrl?: string | null;
  agentId: string;
  size?: number; // Optional size prop
}

// Function to generate gradient based on agentId (copied from AgentImage)
const generateGradient = (id: string) => {
  const hash = Array.from(id).reduce(
    (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
    0
  );
  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash * 13) % 360);
  return {
    background: `linear-gradient(135deg, hsl(${hue1}, 70%, 70%), hsl(${hue2}, 70%, 60%))`, // Slightly adjusted saturation/lightness for potentially smaller size
  };
};


export function AgentAvatar({ avatarUrl, agentId, size = 40 }: AgentAvatarProps) { // Default size 40px
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setGradientStyle(generateGradient(agentId));
  }, [agentId]);

  return (
    <div
      className="relative rounded-full overflow-hidden border border-muted/30 flex items-center justify-center group"
      style={{ width: size, height: size, ...(!avatarUrl ? gradientStyle : {}) }} // Apply gradient only if no avatarUrl
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Agent avatar"
          fill
          sizes={`${size}px`} // Provide sizes hint
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        // Display icon only if no avatarUrl
        <SparklesIcon size={size * 0.5} /> // Adjust icon size relative to container
      )}
    </div>
  );
}