import Image from "next/image";
import { Camera } from "lucide-react";
import { getCategory } from "@/lib/data/taxonomy";
import { cn } from "@/lib/cn";
import type { CategoryId, ItemImage as ItemImageData } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

/** The photo's URL, if there is a photo: an uploaded one (/api/img/…) or one just picked in this browser. */
export function resolveImageSrc(image: ItemImageData): string | undefined {
  return image.src;
}

type Props = {
  image: ItemImageData;
  category: CategoryId;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Tiny thumbnails: show only the icon, no caption */
  compact?: boolean;
  /** Leave room on the right of the caption for overlaid controls */
  captionRightSpace?: boolean;
};

/**
 * Renders the photo when there is one, otherwise a tinted placeholder with the category's icon.
 * The parent controls size via `className` (e.g. "aspect-[4/3]").
 */
export function ItemImage({ image, category, className, sizes, priority, compact, captionRightSpace }: Props) {
  const src = resolveImageSrc(image);
  const cat = getCategory(category);

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-navy-100", className)}>
        <Image
          src={src}
          alt={image.label}
          fill
          sizes={sizes ?? "(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"}
          priority={priority}
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Image placeholder: ${image.label}`}
      className={cn("theme-light relative overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${cat.tint[0]}, ${cat.tint[1]})` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgb(255 255 255 / 0.9), transparent 45%), radial-gradient(circle at 85% 90%, rgb(255 255 255 / 0.55), transparent 40%)",
        }}
      />
      <CategoryIcon
        icon={cat.icon}
        strokeWidth={1.4}
        className={cn(
          "absolute left-1/2 text-navy-900/[0.12]",
          compact ? "top-1/2 size-[55%] -translate-x-1/2 -translate-y-1/2" : "top-[42%] size-[34%] -translate-x-1/2 -translate-y-1/2",
        )}
      />
      {!compact && (
        <div className={cn("absolute bottom-2.5 left-2.5 flex items-start gap-1.5 rounded-xl bg-white/85 px-2.5 py-1.5 text-navy-700 backdrop-blur-sm", captionRightSpace ? "right-[6.5rem]" : "right-2.5")}>
          <Camera className="mt-px size-3 shrink-0 text-navy-500" aria-hidden />
          <span className="line-clamp-2 text-[0.68rem] font-semibold leading-snug">
            Image of {image.label}
          </span>
        </div>
      )}
    </div>
  );
}
