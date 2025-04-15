import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollState {
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
}

interface UseAutoScrollOptions {
  offset?: number;
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { offset = 20, smooth = false, content } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContentHeight = useRef(0);
  const userHasScrolled = useRef(false);

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
      if (!scrollRef.current) return;

      const targetScrollTop =
        scrollRef.current.scrollHeight - scrollRef.current.clientHeight;

      if (instant) {
        scrollRef.current.scrollTop = targetScrollTop;
      } else {
        scrollRef.current.scrollTo({
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
    [smooth]
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const atBottom = checkIsAtBottom(scrollRef.current);

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
  }, [checkIsAtBottom]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
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
  }, [content, scrollState.autoScrollEnabled, scrollToBottom]);

  useEffect(() => {
    const element = scrollRef.current;
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
  }, [scrollState.autoScrollEnabled, scrollToBottom]);

  const disableAutoScroll = useCallback(() => {
    const atBottom = scrollRef.current
      ? checkIsAtBottom(scrollRef.current)
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
  }, [checkIsAtBottom]);

  return {
    scrollRef,
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
  };
}
