import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

const FadeMessaging = ({
  isVisible = false,
  messageLines: initialMessageLines = [],
  repeat = 3,
  intervalDelay = 15000,
  initialDelay = 5000,
  onClickHandler = null,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  minWidth = '65vw',
  minHeight = '40vh',
  textColor = 'white',
  fontSize = '2em',
  zIndex = 2001,
  springConfig = config.molasses, // Allow customizing spring config
  blinkConfig = config.stiff,    // Allow customizing blink config
}) => {
  // --- Animation State & Refs ---
  const messageLines = Array.isArray(initialMessageLines) ? initialMessageLines : [];

  const [runCount, setRunCount] = useState(0);
  const intervalRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const initialDelayTimeoutRef = useRef(null);

  // --- Springs (Dedicated for 2 lines, mirroring old App.js logic) ---
  const [bgStyles, bgApi] = useSpring(() => ({ opacity: 0, y: -50, config: config.molasses }));
  const [line1Styles, line1Api] = useSpring(() => ({ opacity: 0, y: -50, config: config.molasses }));
  const [line2Styles, line2Api] = useSpring(() => ({ opacity: 0, y: -50, config: config.molasses }));

  // --- Animation Sequence (Directly from App.js logic) ---
  const animateSequence = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Reset
    await Promise.all([
      bgApi.start({ opacity: 0, y: -50, immediate: true }),
      line1Api.start({ opacity: 0, y: -50, immediate: true }), // Use line1Api
      line2Api.start({ opacity: 0, y: -50, immediate: true })  // Use line2Api
    ]);
    await new Promise(res => setTimeout(res, 50));

    // Animate In
    await bgApi.start({ opacity: 1, y: 0, config: config.molasses, delay: 200 });
    await line1Api.start({ opacity: 1, y: 0, config: config.molasses, delay: 400 }); // Use line1Api
    await line2Api.start({ opacity: 1, y: 0, config: config.molasses, delay: 600 }); // Use line2Api

    // Pause
    await new Promise(res => setTimeout(res, 1200));

    // Blink Twice
    for (let i = 0; i < 2; i++) {
      await Promise.all([
        line1Api.start({ opacity: 0, config: config.stiff }), // Use line1Api
        line2Api.start({ opacity: 0, config: config.stiff })  // Use line2Api
      ]);
      await new Promise(res => setTimeout(res, 500));
      await Promise.all([
        line1Api.start({ opacity: 1, config: config.stiff }), // Use line1Api
        line2Api.start({ opacity: 1, config: config.stiff })  // Use line2Api
      ]);
      await new Promise(res => setTimeout(res, 650));
    }

    // Pause
    await new Promise(res => setTimeout(res, 650));

    // Disappear
    await Promise.all([
      bgApi.start({ opacity: 0, y: -50, config: config.molasses }),
      line1Api.start({ opacity: 0, y: -50, config: config.molasses }), // Use line1Api
      line2Api.start({ opacity: 0, y: -50, config: config.molasses })  // Use line2Api
    ]);

    isAnimatingRef.current = false;
    // Adjusted dependencies
  }, [bgApi, line1Api, line2Api]);

  // --- Control Logic (Mostly unchanged, but update spring APIs) ---
  useEffect(() => {
    clearTimeout(initialDelayTimeoutRef.current);
    clearInterval(intervalRef.current);

    if (isVisible) {
      initialDelayTimeoutRef.current = setTimeout(() => {
        const runAnimation = () => {
          setRunCount((currentCount) => {
            if (currentCount < repeat) {
              animateSequence();
              return currentCount + 1;
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return currentCount;
            }
          });
        };
        runAnimation();
        intervalRef.current = setInterval(runAnimation, intervalDelay);
      }, initialDelay);
    } else {
      setRunCount(0);
      bgApi.start({ opacity: 0, y: -50, immediate: true });
      line1Api.start({ opacity: 0, y: -50, immediate: true }); // Reset line1
      line2Api.start({ opacity: 0, y: -50, immediate: true }); // Reset line2
      isAnimatingRef.current = false;
    }

    // Cleanup
    return () => {
      clearTimeout(initialDelayTimeoutRef.current);
      clearInterval(intervalRef.current);
      bgApi.stop();
      line1Api.stop(); // Stop line1
      line2Api.stop(); // Stop line2
      isAnimatingRef.current = false;
    };
    // Adjusted dependencies
  }, [
    isVisible,
    animateSequence,
    bgApi,
    line1Api, // Add line1Api
    line2Api, // Add line2Api
    repeat,
    intervalDelay,
    initialDelay,
    // messageLines.length // No longer needed as dependency
  ]);

  return (
    <animated.div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: backgroundColor,
        minWidth: minWidth,
        minHeight: minHeight,
        borderRadius: '10px',
        zIndex: zIndex,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        opacity: bgStyles.opacity,
        translateY: bgStyles.y.to((y) => `${y}%`),
        pointerEvents: bgStyles.opacity.to((o) => (o > 0 && onClickHandler ? 'auto' : 'none')),
        cursor: onClickHandler ? 'pointer' : 'default',
      }}
      onClick={onClickHandler}
    >
      {/* Render first line if it exists */}
      {messageLines.length > 0 && (
        <animated.span
          style={{
            color: textColor,
            fontSize: fontSize,
            fontWeight: 'bold',
            opacity: line1Styles.opacity,
            translateY: line1Styles.y.to((y) => `${y}%`),
          }}
        >
          {messageLines[0]}
        </animated.span>
      )}
      {/* Render second line if it exists */}
      {messageLines.length > 1 && (
        <animated.span
          style={{
            color: textColor,
            fontSize: fontSize,
            fontWeight: 'bold',
            opacity: line2Styles.opacity,
            translateY: line2Styles.y.to((y) => `${y}%`),
          }}
        >
          {messageLines[1]}
        </animated.span>
      )}
    </animated.div>
  );
};

export default FadeMessaging; 