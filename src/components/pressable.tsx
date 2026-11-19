import type { ComponentPropsWithoutRef, ElementType } from "react";

type PressableProps<T extends ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

/** Basıldığı anda scale(0.97) ile küçülen sarmalayıcı (apple-design: anında tepki). */
export function Pressable<T extends ElementType = "button">({
  as,
  className = "",
  ...rest
}: PressableProps<T>) {
  const Tag = (as ?? "button") as ElementType;
  return <Tag className={`pressable ${className}`.trim()} {...rest} />;
}
