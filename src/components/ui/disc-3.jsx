"use client";;
import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const Disc3Icon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: () => controls.start({
        rotate: 360,
        transition: {
          duration: 1.2,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        },
      }),
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback((e) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        controls.start({
          rotate: 360,
          transition: {
            duration: 1.2,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          },
        });
      }
    }, [controls, onMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    if (isControlledRef.current) {
      onMouseLeave?.(e);
    } else {
      controls.start("normal");
    }
  }, [controls, onMouseLeave]);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <motion.svg
        animate={controls}
        fill="none"
        height={size}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        style={{ transformOrigin: "center" }}
        variants={{
          normal: { rotate: 0 },
        }}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="2" />

        <g>
          <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
          <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
        </g>
      </motion.svg>
    </div>
  );
});

Disc3Icon.displayName = "Disc3Icon";

export { Disc3Icon };
