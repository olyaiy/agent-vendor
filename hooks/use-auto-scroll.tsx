import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollState {
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
}

interface UseAutoScrollOptions {
  offset?: number;
  smooth?: boolean;
  content?: React.ReactNode;
  externalRef?: React.RefObject<HTMLDivElement>; // Added externalRef option
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  // Destructure externalRef from options
  const { offset = 20, smooth = false, content, externalRef } = options;
  // Rename internal ref
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const lastContentHeight = useRef(0);
  const userHasScrolled = useRef(false);

  // Determine the target ref to use for calculations and listeners
  const targetRef = externalRef ?? internalScrollRef;

  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtBottom: true,
    autoScrollEnabled: true,
  });

  const checkIsAtBottom = useCallback(
    (element: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceToBottom = Math.abs(
        scrollHeight - scrollTop - clientHeight
      );
      return distanceToBottom <= offset;
    },
    [offset]
  );

  const scrollToBottom = useCallback(
    (instant?: boolean) => {
      // Use targetRef
      if (!targetRef.current) return;

      const targetScrollTop =
        targetRef.current.scrollHeight - targetRef.current.clientHeight;

      if (instant) {
        targetRef.current.scrollTop = targetScrollTop;
      } else {
        targetRef.current.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? "smooth" : "auto",
        });
      }

      // console.log('[useAutoScroll] scrollToBottom called. Resetting state.', { instant, smooth });
      setScrollState({
        isAtBottom: true,
        autoScrollEnabled: true, // Explicitly re-enable on programmatic scroll to bottom
      });
      userHasScrolled.current = false; // Reset user scroll flag
    },
    [smooth, targetRef] // Add targetRef to dependency array
  );

  const handleScroll = useCallback(() => {
    // Use targetRef
    if (!targetRef.current) return;

    const atBottom = checkIsAtBottom(targetRef.current);

    // console.log('[useAutoScroll] handleScroll triggered.', { atBottom });
    setScrollState((prev) => {
      // If the user was previously not at the bottom and now is,
      // or if they were at the bottom and now aren't, update autoScrollEnabled.
      // This prevents disabling auto-scroll during programmatic scrolls that might temporarily leave the bottom.
      const shouldUpdateAutoScroll = prev.isAtBottom !== atBottom;

      const newState = {
        isAtBottom: atBottom,
        autoScrollEnabled: shouldUpdateAutoScroll ? atBottom : prev.autoScrollEnabled,
      };
      // console.log('[useAutoScroll] handleScroll state update:', { prev, newState });
      return newState;
    });
  }, [checkIsAtBottom, targetRef]); // Add targetRef to dependency array

  useEffect(() => {
    // Use targetRef
    const element = targetRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll, targetRef]); // Add targetRef to dependency array

  useEffect(() => {
    // Use targetRef
    const scrollElement = targetRef.current;
    if (!scrollElement) return;

    const currentHeight = scrollElement.scrollHeight;
    const hasNewContent = currentHeight !== lastContentHeight.current;

    if (hasNewContent) {
      // console.log('[useAutoScroll] Content changed.', { currentHeight, lastContentHeight: lastContentHeight.current, autoScrollEnabled: scrollState.autoScrollEnabled });
      if (scrollState.autoScrollEnabled) {
        // console.log('[useAutoScroll] Auto-scrolling due to new content.');
        requestAnimationFrame(() => {
          // Use instant scroll only for the very first load
          scrollToBottom(lastContentHeight.current === 0);
        });
      } else {
        // console.log('[useAutoScroll] New content, but auto-scroll is disabled.');
      }
      lastContentHeight.current = currentHeight;
    }
  }, [content, scrollState.autoScrollEnabled, scrollToBottom, targetRef]); // Add targetRef to dependency array

  useEffect(() => {
    // Use targetRef
    const element = targetRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((/* entries */) => {
      // const entry = entries[0];
      // console.log('[useAutoScroll] ResizeObserver triggered.', { newHeight: entry?.contentRect?.height, autoScrollEnabled: scrollState.autoScrollEnabled });
      if (scrollState.autoScrollEnabled) {
        // console.log('[useAutoScroll] Auto-scrolling due to resize.');
        scrollToBottom(true); // Instant scroll on resize
      } else {
        // console.log('[useAutoScroll] Resized, but auto-scroll is disabled.');
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [scrollState.autoScrollEnabled, scrollToBottom, targetRef]); // Add targetRef to dependency array

  const disableAutoScroll = useCallback(() => {
    // Use targetRef
    const atBottom = targetRef.current
      ? checkIsAtBottom(targetRef.current)
      : false;

    // Only disable if not at bottom
    if (!atBottom) {
      // console.log('[useAutoScroll] disableAutoScroll called while not at bottom.');
      userHasScrolled.current = true; // Mark that user initiated scroll
      setScrollState((prev) => {
        const newState = { ...prev, autoScrollEnabled: false };
        // console.log('[useAutoScroll] disableAutoScroll state update:', { prev, newState });
        return newState;
      });
    } else {
      // console.log('[useAutoScroll] disableAutoScroll called while at bottom - doing nothing.');
    }
  }, [checkIsAtBottom, targetRef]); // Add targetRef to dependency array

  return {
    // Return the internal ref as scrollRef for backward compatibility
    scrollRef: internalScrollRef,
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
  };
}
