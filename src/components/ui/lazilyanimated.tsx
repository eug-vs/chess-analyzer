import { useIntersectionObserver } from "@uidotdev/usehooks";
import { motion } from "motion/react";
import React from "react";

type Props = Omit<React.ComponentProps<typeof motion.div>, "layout">;

export default function LazilyAnimated(props: Props) {
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "500px",
  });

  return (
    <motion.div ref={ref} {...props} layout={!entry || entry?.isIntersecting} />
  );
}
