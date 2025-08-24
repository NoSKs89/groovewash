import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { animated, useSpring, to } from '@react-spring/web';
// Remove default imports as they'll now come from props
// import yuraYuraAudio from '../audio/YuraYuraTeikoku.mp3';
// import Workinonit from '../audio/Workinonit.wav';
// Import the beat detector
// import { analyze } from 'web-audio-beat-detector';

// Helper function to format time
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
};

// Add forwardRef, new props: onReady, onBpmChange (if BPM detection is re-enabled)
// This component is responsible for:
// - Receiving the audio source URL (`audioUrl`) and the ref to the HTML <audio> element (`audioRef`) from App.js.
// - Loading the audio source into the <audio> element.
// - Handling user interactions (play/pause button, seek bar).
// - Implementing smooth playback rate transitions (ramp up/down).
// - Reporting its state (playing/paused, ready, current time) back to App.js via callbacks (`onPlayStateChange`, `onReady`).
// - Exposing imperative `play()` and `pause()` methods to App.js.
const AudioPlayer = forwardRef(({ 
  onPlayStateChange, // Callback to report intended play state (true/false)
  audioRef, // Ref to the CLEAN <audio> element created in App.js
  audioUrl, // The source URL/import for the CLEAN track
  dirtyAudioRef, // Ref to the DIRTY <audio> element created in App.js
  dirtyAudioUrl, // The source URL/import for the DIRTY track
  isClean, // Boolean indicating whether the 'Clean' or 'Dirty' track should be audible
  onReady, // Callback to report when the current audio source is loaded and ready
  onBpmChange, // Callback for BPM changes (currently unused)
  // --- ADDED PROPS ---
  isMobile,
  isLandscape
 }, ref) => {
  // Internal state reflects the *actual* state reported back
  const [componentCurrentTime, setComponentCurrentTime] = useState(0);
  const [componentDuration, setComponentDuration] = useState(0);
  const [componentIsReady, setComponentIsReady] = useState(false); // Track readiness of current src
  const [componentIsLoading, setComponentIsLoading] = useState(false); // Track loading state

  // Playback rate refs
  const targetRateRef = useRef(0); // Target rate (0 or 1)
  const currentRateRef = useRef(0); // Actual current rate during transition
  const animationFrameIdRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const isRateTransitioningRef = useRef(false); // Flag if ramp-up/down animation is active

  // Previous URL tracking
  const prevAudioUrlRef = useRef(null);
  const prevDirtyAudioUrlRef = useRef(null); // Track previous dirty URL

  // Constants
  const PLAYBACK_RATE_INERTIA = 0.5; // Controls speed of ramp-up/down (lower = slower)
  const SAFE_MIN_RATE = 0.1;        // Increased from 0.05 to 0.1 to ensure browser compatibility

  // --- Animation Springs (unchanged) ---
  const waveformSpring = useSpring({ from: { opacity: 0, y: 60 }, to: { opacity: 1, y: 0 }, config: { tension: 280, friction: 60 }, delay: 400 });
  const [buttonsSpringProps, buttonsSpringApi] = useSpring(() => ({ 
    from: { opacity: 1, y: 60 }, 
    to: { opacity: 1, y: 0 }, 
    config: { tension: 280, friction: 60 }, 
    delay: 500 
  }));

  // Separate spring for button flip animation
  const [flipSpringProps, flipSpringApi] = useSpring(() => ({
    rotateY: 0,
    config: { tension: 200, friction: 15 }
  }));

  // Add hover spring for button scaling
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const hoverSpringProps = useSpring({
    scale: isButtonHovered ? 1.1 : 1,
    config: { tension: 300, friction: 20 }
  });

  // --- Callback to Parent ---
  // Reports the *intended* playing state (based on targetRate)
  // Called when play/pause is initiated or completes.
  const reportPlayState = useCallback(() => {
    const isTargetingPlay = targetRateRef.current === 1;
    if (onPlayStateChange) {
      // console.log(`AudioPlayer: Reporting play state -> ${isTargetingPlay}`);
      onPlayStateChange(isTargetingPlay);
    }
  }, [onPlayStateChange, isClean]);

  // Reports readiness state
  // Called when the audio element signals it can play (`canplay`) or an error occurs.
   const reportReadyState = useCallback((isReady) => {
     if (onReady) {
        // console.log(`AudioPlayer: Reporting ready state -> ${isReady}`);
        onReady(isReady);
     }
     setComponentIsReady(isReady);
     if (!isReady) {
        setComponentCurrentTime(0); // Reset time display if not ready
        setComponentDuration(0);
     }
   }, [onReady]);


  // --- Time Update Handling ---
  // Reads the current time and duration from the audio element and updates internal state.
  const updateTimeDisplays = useCallback(() => {
    const audio = audioRef.current;
    const dirtyAudio = dirtyAudioRef.current;
    if (audio) {
      const currentTime = audio.currentTime || 0;
      const duration = audio.duration || 0;
      // Sync dirty audio time if it exists
      if (dirtyAudio && Math.abs(dirtyAudio.currentTime - currentTime) > 0.1) {
          // Only sync if significantly different to avoid micro-adjustments causing issues
          // dirtyAudio.currentTime = currentTime; 
          // Let's sync only during seek/play/pause actions for now.
      }
      // Only update if duration is valid
      if (isFinite(duration) && duration > 0) {
          setComponentCurrentTime(currentTime);
          setComponentDuration(duration);
      } else {
          setComponentCurrentTime(0);
          setComponentDuration(0);
      }
    }
  }, [audioRef, dirtyAudioRef]);

  // --- Playback Rate Animation Loop ---
  // Handles the gradual transition of audio.playbackRate and audio.volume
  // between 0 (paused/muted) and 1 (playing/full volume).
  const updatePlaybackRate = useCallback((currentTime) => {
    console.log(`AudioPlayer: updatePlaybackRate executing. isRateTransitioningRef=${isRateTransitioningRef.current}`);
    const audio = audioRef.current;
    const dirtyAudio = dirtyAudioRef.current;
    
    // Ensure loop stops if audio element is gone, or transition is no longer active
    if (!audio || !isRateTransitioningRef.current) {
      isRateTransitioningRef.current = false;
      animationFrameIdRef.current = null;
      console.log("AudioPlayer: Rate transition loop stopping (audio gone or transition flag false)");
      return;
    }

    const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = currentTime;

    const targetRate = targetRateRef.current;
    const currentRate = currentRateRef.current;
    const rateDifference = targetRate - currentRate;

    console.log(`Rate transition: current=${currentRate.toFixed(3)}, target=${targetRate}, diff=${rateDifference.toFixed(3)}`);

    // --- Check if Target Reached ---
    // Snap to target if very close OR if ramping down and near zero
    const isNearTarget = Math.abs(rateDifference) < 0.01;
    const isRampingDownNearZero = targetRate === 0 && currentRate <= SAFE_MIN_RATE;

    if (isNearTarget || isRampingDownNearZero) {
      console.log(`AudioPlayer: Reached target rate (nearTarget: ${isNearTarget}, nearZero: ${isRampingDownNearZero})`);
      const finalRate = targetRate === 1 ? 1 : 0;
      // Ensure internal ref matches the final rate exactly
      currentRateRef.current = finalRate; 
      audio.playbackRate = finalRate;
      audio.volume = finalRate === 1 ? 1 : 0; // Mute instantly when rate hits 0

      // Also apply final state to dirty audio if it exists
      if (dirtyAudio) {
          dirtyAudio.playbackRate = finalRate;
          dirtyAudio.volume = finalRate === 1 ? 1 : 0; // Mute instantly when rate hits 0
          if (finalRate === 0 && !dirtyAudio.paused) {
              console.log("AudioPlayer: Paused dirty audio as rate reached 0");
              dirtyAudio.pause();
          } else if (finalRate === 1 && dirtyAudio.paused && componentIsReady) {
              console.warn("AudioPlayer: Dirty audio was paused when rate snapped to 1, attempting play again.");
              dirtyAudio.play().catch(e => console.error("Error playing dirty on final snap to 1 safeguard:", e));
          }
      }

      // Apply mute based on isClean state *after* setting base volume/rate
      if (audio && dirtyAudio) {
          audio.muted = !isClean;
          dirtyAudio.muted = isClean;
          console.log(`Final state applied: Clean muted=${!isClean}, Dirty muted=${isClean}`);
      }

      // Pause only if rate is exactly 0 and audio isn't already paused
      if (finalRate === 0 && !audio.paused) {
        console.log("AudioPlayer: Paused as rate reached 0");
        audio.pause();
      }
      // Ensure playing if rate snaps to 1 (play() should have been called earlier)
      else if (finalRate === 1 && audio.paused && componentIsReady) {
         // This case shouldn't ideally happen if play() was called correctly before,
         // but as a safeguard:
         console.warn("AudioPlayer: Audio was paused when rate snapped to 1, attempting play again.");
         audio.play().catch(e => console.error("Error playing on final snap to 1 safeguard:", e));
      }

      isRateTransitioningRef.current = false; // Stop the transition loop
      animationFrameIdRef.current = null;
      
      // Log completion of transition
      console.log(`AudioPlayer: TRANSITION COMPLETE - final rate: ${finalRate}, is paused: ${audio.paused}`);
      
      reportPlayState(); // Report final state
      updateTimeDisplays(); // Ensure time display is accurate at end
      return; // Exit the loop
    }

    // --- Calculate Next Rate ---
    const direction = Math.sign(rateDifference);
    // Adjust rate change based on time elapsed for smoother animation
    const rateChange = deltaTime * PLAYBACK_RATE_INERTIA * direction;
    let newRate = currentRate + rateChange;

    // --- Apply New Rate ---
    if (targetRate === 1) { // Ramping Up
      newRate = Math.max(SAFE_MIN_RATE, Math.min(1, newRate)); // Clamp between min and 1
      currentRateRef.current = newRate;
      audio.playbackRate = newRate;
      audio.volume = 1; // Ensure volume is max during ramp-up
      if (dirtyAudio) {
          dirtyAudio.playbackRate = newRate;
          dirtyAudio.volume = 1;
      }
    } else { // Ramping Down
      // Calculate the next rate, clamped between 0 and 1 initially
      newRate = Math.max(0, Math.min(1, currentRate + rateChange)); 
      // Explicitly clamp the rate to be no lower than SAFE_MIN_RATE
      newRate = Math.max(SAFE_MIN_RATE, newRate); 
      
      // If the target is 0, allow the rate to actually reach 0 ONLY IF the near zero condition is met
      // This prevents setting rates between 0 and SAFE_MIN_RATE, unless snapping to 0
      const isNearZeroTarget = targetRate === 0 && (Math.abs(currentRate - 0) < 0.01 || currentRate <= SAFE_MIN_RATE);
      if (targetRate === 0 && !isNearZeroTarget) {
          newRate = Math.max(SAFE_MIN_RATE, newRate);
      } else if (targetRate === 0 && isNearZeroTarget) {
          newRate = 0; // Allow snapping to 0 when condition met
      }

      currentRateRef.current = newRate;
      // Set playbackRate, ensuring it's never below SAFE_MIN_RATE unless it's exactly 0
      audio.playbackRate = newRate === 0 ? 0 : Math.max(SAFE_MIN_RATE, newRate);

      // Apply to dirty audio as well
      if (dirtyAudio) {
          dirtyAudio.playbackRate = newRate === 0 ? 0 : Math.max(SAFE_MIN_RATE, newRate);
      }

      // Fade volume out as rate decreases (more noticeable fade)
      const volumeFadeThreshold = 0.5; // Start fading volume below this rate
      if (newRate < volumeFadeThreshold) {
          const fadedVolume = Math.max(0, newRate / volumeFadeThreshold);
          audio.volume = fadedVolume;
          if(dirtyAudio) dirtyAudio.volume = fadedVolume;
      } else {
          audio.volume = 1;
          if(dirtyAudio) dirtyAudio.volume = 1;
      }
      
      console.log(`Ramping DOWN: newRate=${newRate.toFixed(3)}`);
    }

    // Apply mute based on isClean state *during* transition
    if (audio && dirtyAudio) {
        audio.muted = !isClean;
        dirtyAudio.muted = isClean;
    }

    // Request next frame
    animationFrameIdRef.current = requestAnimationFrame(updatePlaybackRate);

  }, [audioRef, dirtyAudioRef, isClean, reportPlayState, updateTimeDisplays, componentIsReady]);


  // --- Function to Start/Stop the Rate Transition ---
  // Initiates the ramp-up (play) or ramp-down (pause) process.
  // Sets the target rate and starts the animation loop (`updatePlaybackRate`).
  const startRateTransition = useCallback((target) => {
    const audio = audioRef.current;
    if (!audio) {
        console.error("AudioPlayer: Cannot start transition, audioRef is null");
        return;
    }

    // Also get dirty audio ref
    const dirtyAudio = dirtyAudioRef.current; 

    // Don't start transition if not ready (unless target is 0)
    if (!componentIsReady && target === 1) {
        console.warn("AudioPlayer: Cannot start play transition, audio not ready.");
        targetRateRef.current = 0; // Ensure target reflects reality
        if (isRateTransitioningRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current); // Cancel if transitioning
            isRateTransitioningRef.current = false;
            animationFrameIdRef.current = null;
        }
        reportPlayState();
        return;
    }
    
    // --- Cancel existing animation FIRST ---
    if (animationFrameIdRef.current) {
      console.log("AudioPlayer: Cancelling previous animation frame before starting new transition");
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      // We might have been transitioning, but the new target overrides it.
      // Set the flag definitively below.
    }

    // Set the target rate
    targetRateRef.current = target;
    console.log(`AudioPlayer: Set targetRateRef to ${target}. isClean=${isClean}`);
    
    // If the target rate is the same as the current *actual* rate (and not transitioning), do nothing.
    // Note: Use a threshold for floating point comparison
    if (Math.abs(currentRateRef.current - target) < 0.01 && !isRateTransitioningRef.current) {
        console.log(`AudioPlayer: Target (${target}) already matches current rate (${currentRateRef.current.toFixed(2)}), and not transitioning. Doing nothing.`);
        reportPlayState(); // Ensure state is reported correctly
        return;
    }

    // --- Start the new transition ---
    console.log("AudioPlayer: Setting isRateTransitioningRef=true and starting transition process.");
    isRateTransitioningRef.current = true; // Set the flag indicating we are now transitioning
    lastFrameTimeRef.current = performance.now();
    reportPlayState(); // Report the *intended* state immediately

    // --- Initiate Playback if Ramping Up ---
    if (target === 1) {
      // Mute based on isClean state BEFORE playing
      if(audio && dirtyAudio) {
          audio.muted = !isClean;
          dirtyAudio.muted = isClean;
          console.log(`Pre-play Mute: Clean muted=${!isClean}, Dirty muted=${isClean}`);
      }

      if (audio.paused) {
        // Set initial rate BEFORE playing to avoid abrupt start
        // Only set if currentRate is actually 0, otherwise continue from current
        audio.volume = 1; // Ensure volume is up
        if (dirtyAudio) dirtyAudio.volume = 1;

        const playPromise = audio.play();
        // Also play dirty audio if it exists and is paused
        let dirtyPlayPromise = dirtyAudio?.paused ? dirtyAudio.play() : Promise.resolve();

        if (playPromise !== undefined) {
          Promise.all([playPromise, dirtyPlayPromise])
            .then(() => {
                console.log("AudioPlayer: Play initiated successfully for both, requesting animation frame.");
                // Request animation frame only AFTER play() resolves
                animationFrameIdRef.current = requestAnimationFrame(updatePlaybackRate);
            }).catch(error => {
                console.error("AudioPlayer: audio.play() failed for one or both tracks:", error);
                targetRateRef.current = 0;
                currentRateRef.current = 0;
                isRateTransitioningRef.current = false;
                reportPlayState();
                audio.volume = 0; // Mute both on error
                if(dirtyAudio) dirtyAudio.volume = 0;
            });
        } else {
            console.warn("AudioPlayer: audio.play() did not return a promise, requesting animation frame immediately.");
            animationFrameIdRef.current = requestAnimationFrame(updatePlaybackRate);
        }
      } else {
         // Already playing, just ensure animation loop starts/continues
         console.log("AudioPlayer: Already playing, ensuring ramp-up animation frame is requested.");
         animationFrameIdRef.current = requestAnimationFrame(updatePlaybackRate);
      }
    }
    // --- Initiate Ramp Down ---
    else if (target === 0) {
      console.log("AudioPlayer: Starting ramp DOWN transition");
      console.log(`AudioPlayer: Current state - audio.paused: ${audio.paused}, playbackRate: ${audio.playbackRate.toFixed(2)}`);
      
      // Request the animation frame directly
      console.log("AudioPlayer: Requesting animation frame for updatePlaybackRate (ramp down) - DIRECTLY"); 
      animationFrameIdRef.current = requestAnimationFrame(updatePlaybackRate);
    }

  }, [audioRef, dirtyAudioRef, isClean, componentIsReady, reportPlayState, updatePlaybackRate]);


  // --- Effect for Handling Audio Source Changes ---
  // This effect runs when the `audioUrl` prop changes.
  // It stops any current playback/transition, sets the new `src` on the audio element,
  // triggers `audio.load()`, and resets loading/ready states. **Also handles dirty URL**
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const dirtyAudio = dirtyAudioRef.current;

    let sourceChanged = false;

    // Check if URL is valid and different from previous
    if (audioUrl && audioUrl !== prevAudioUrlRef.current) {
        console.log(`AudioPlayer: Clean audio source changed. New URL: ${audioUrl}`);
        prevAudioUrlRef.current = audioUrl; // Update tracker
        sourceChanged = true;

        // --- Stop existing playback/transition ---
        // Cancel any ongoing animation frame
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        isRateTransitioningRef.current = false; // Ensure transition stops

        // If it was playing or ramping up/down, force immediate stop state
        if (!audio.paused || targetRateRef.current === 1 || currentRateRef.current > 0) {
            console.log("AudioPlayer: Forcing immediate stop for source change.");
            targetRateRef.current = 0;
            currentRateRef.current = 0;
            audio.pause(); // Ensure paused
            audio.playbackRate = 0; // Use 0 or 1? 0 seems safer for stop.
            audio.volume = 0;
            reportPlayState(); // Report stopped state
        }

        // Reset readiness and loading state
        setComponentIsLoading(true);
        reportReadyState(false); // Report not ready
        setComponentDuration(0); // Reset duration display
        setComponentCurrentTime(0); // Reset time display

        // Set new source and load
        audio.src = audioUrl;
        // Ensure clean is initially unmuted, dirty muted (will be overridden by isClean later)
        audio.muted = false;
        if(dirtyAudio) dirtyAudio.muted = true;
        audio.preload = "auto";
        audio.load(); // Important: Trigger loading of the new source
        console.log("AudioPlayer: Loading new clean audio source...");

    } else if (!audioUrl) {
        // Handle case where audioUrl becomes null/undefined
        console.log("AudioPlayer: audioUrl is null/undefined. Stopping playback.");
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        isRateTransitioningRef.current = false;
        targetRateRef.current = 0;
        currentRateRef.current = 0;
        if (!audio.paused) audio.pause();
        audio.playbackRate = 0;
        audio.volume = 0;
        reportPlayState();
        reportReadyState(false);
        setComponentDuration(0);
        setComponentCurrentTime(0);
        audio.removeAttribute('src'); // Clear src attribute
        prevAudioUrlRef.current = null;
    }

    // --- Handle Dirty Audio URL Change ---
    if (dirtyAudio && dirtyAudioUrl && dirtyAudioUrl !== prevDirtyAudioUrlRef.current) {
        console.log(`AudioPlayer: Dirty audio source changed. New URL: ${dirtyAudioUrl}`);
        prevDirtyAudioUrlRef.current = dirtyAudioUrl;
        // No need to stop playback again if clean URL also changed
        if (!sourceChanged) {
             // Stop playback if only dirty URL changed
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            isRateTransitioningRef.current = false;
            if (!audio.paused || targetRateRef.current === 1 || currentRateRef.current > 0) {
                targetRateRef.current = 0;
                currentRateRef.current = 0;
                audio.pause();
                audio.playbackRate = 0;
                audio.volume = 0;
                if (dirtyAudio && !dirtyAudio.paused) dirtyAudio.pause();
                if (dirtyAudio) dirtyAudio.playbackRate = 0;
                if (dirtyAudio) dirtyAudio.volume = 0;
                reportPlayState();
            }
        }
        // Set new source and load for dirty audio
        dirtyAudio.src = dirtyAudioUrl;
        dirtyAudio.preload = "auto";
        dirtyAudio.muted = true; // Ensure muted initially
        dirtyAudio.load();
        console.log("AudioPlayer: Loading new dirty audio source...");
        // Don't reset component loading/ready state here, let clean audio drive that

    } else if (dirtyAudio && !dirtyAudioUrl) {
        // Handle case where dirtyAudioUrl becomes null/undefined
        console.log("AudioPlayer: dirtyAudioUrl is null/undefined.");
        if (!dirtyAudio.paused) dirtyAudio.pause();
        dirtyAudio.removeAttribute('src');
        prevDirtyAudioUrlRef.current = null;
    }

    // Apply mute state whenever URLs change
    if (audio && dirtyAudio) {
        audio.muted = !isClean;
        dirtyAudio.muted = isClean;
    }

  }, [audioUrl, dirtyAudioUrl, audioRef, dirtyAudioRef, isClean, reportPlayState, reportReadyState]);


  // --- Effect for Setting Up Audio Event Listeners ---
  // Attaches listeners to the HTML <audio> element to react to events like
  // 'canplay', 'error', 'timeupdate', 'ended', 'loadedmetadata', 'loadstart'.
  // These handlers update internal state and call the `reportReadyState` callback.
  useEffect(() => {
    const audio = audioRef.current;
    const dirtyAudio = dirtyAudioRef.current;
    if (audio && dirtyAudio) {
        console.log(`AudioPlayer: Applying mute state in useEffect [isClean]. Clean muted: ${!isClean}, Dirty muted: ${isClean}`);
        audio.muted = !isClean;
        dirtyAudio.muted = isClean;
    }
    if (!audio) return;

    // --- Event Handlers ---
    const handleCanPlay = () => {
      console.log("AudioPlayer: 'canplay' event FIRED.");
      setComponentIsLoading(false);
      reportReadyState(true); // Report ready
      updateTimeDisplays(); // Update duration now that metadata should be loaded
    };

    const handleError = (e) => {
      console.error('AudioPlayer: HTML Audio Error:', e);
      setComponentIsLoading(false);
      reportReadyState(false); // Report not ready on error
      // Potentially reset state further?
       targetRateRef.current = 0;
       currentRateRef.current = 0;
       isRateTransitioningRef.current = false;
       reportPlayState();
    };

    const handleTimeUpdate = () => {
      // Update display only if not transitioning (avoids slight visual jumpiness)
      // Or maybe always update? Let's always update for scrubbing feedback.
      // if (!isRateTransitioningRef.current) {
        updateTimeDisplays();
      // }
    };

    const handleEnded = () => {
      console.log("AudioPlayer: 'ended' event fired.");
      targetRateRef.current = 0;
      currentRateRef.current = 0;
      // Don't need to call pause, it's already ended
      audio.playbackRate = 0;
      audio.volume = 0;
      isRateTransitioningRef.current = false; // Ensure transition stops if somehow active
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      reportPlayState(); // Report stopped state
      // Set time to duration? Or 0? Let's reset to 0 for replayability.
      setComponentCurrentTime(0);
      // Keep duration display as is
    };

    // Handle loading/metadata related events (only for primary audio)
    const handleLoadedMetadata = () => {
        // console.log("AudioPlayer: 'loadedmetadata' event fired.");
        // Duration might be available here, update display
        updateTimeDisplays();
    }
     const handleLoadStart = () => {
        console.log("AudioPlayer: 'loadstart' event fired for CLEAN audio.");
        setComponentIsLoading(true);
        reportReadyState(false); // Not ready yet
    }


    // Add listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);


    // Initial check for readiness state
    if (audio.readyState >= 3 && audio.currentSrc) { // HAVE_FUTURE_DATA
        // console.log("AudioPlayer: Initial check - audio is ready.");
        handleCanPlay(); // Call handler directly if already ready
    } else if (audio.currentSrc){
        // console.log("AudioPlayer: Initial check - audio not ready, waiting for events.");
        setComponentIsLoading(true); // Assume loading if src is set but not ready
    } else {
        // console.log("AudioPlayer: Initial check - no src.");
        setComponentIsLoading(false);
        reportReadyState(false);
    }


    // Cleanup
    return () => {
      console.log("AudioPlayer: Cleaning up event listeners.");
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);

      // Cancel animation frame on unmount/cleanup
       if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            console.log("AudioPlayer: Animation frame cancelled on cleanup.");
       }
    };
  }, [audioUrl, dirtyAudioUrl, audioRef, dirtyAudioRef, isClean, reportPlayState, reportReadyState, updateTimeDisplays]);


  // --- Imperative Handle ---
  // Exposes `play` and `pause` methods that can be called directly by the parent (App.js)
  // using the `audioPlayerRef`.
  useImperativeHandle(ref, () => ({
    play: () => {
      console.log("AudioPlayer: Imperative play() called");
      startRateTransition(1); // Request ramp up to 1
    },
    pause: () => {
      console.log("AudioPlayer: Imperative pause() called");
      // Log current state before starting transition
      console.log(`AudioPlayer: Current state before pause - targetRate: ${targetRateRef.current}, currentRate: ${currentRateRef.current.toFixed(2)}, isTransitioning: ${isRateTransitioningRef.current}`);
      startRateTransition(0); // Request ramp down to 0
    }
    // Could add seek method here too if needed
    // seek: (time) => { ... }
  }));


  // --- UI Event Handlers ---
  // Handles clicks on the play/pause button, triggering the rate transition.
  const handlePlayPauseClick = () => {
    const currentTargetRate = targetRateRef.current;
    console.log(`AudioPlayer: Play/Pause button clicked. Current target rate: ${currentTargetRate}`);
    // Sync time before toggling play/pause
    const audio = audioRef.current;
    const dirtyAudio = dirtyAudioRef.current;
    if (audio && dirtyAudio) {
        const syncTime = audio.currentTime;
        if(Math.abs(dirtyAudio.currentTime - syncTime) > 0.1) {
            console.log(`Syncing dirty time (${dirtyAudio.currentTime.toFixed(2)}) to clean time (${syncTime.toFixed(2)}) on play/pause click.`);
            dirtyAudio.currentTime = syncTime;
        }
    }
    if (currentTargetRate === 0) {
      startRateTransition(1); // Tell internal logic to play
      // Trigger coin flip animation to 180 degrees
      flipSpringApi.start({
        rotateY: 180,
        config: { tension: 200, friction: 15 }
      });
    } else {
      startRateTransition(0); // Tell internal logic to pause
      // Trigger coin flip animation back to 0 degrees
      flipSpringApi.start({
        rotateY: 0,
        config: { tension: 200, friction: 15 }
      });
    }
  };

  // Handles changes to the seek bar, directly setting the `currentTime` of the audio element.
  const handleSeekChange = (e) => {
    const audio = audioRef.current;
    const seekTime = Number(e.target.value);
    const dirtyAudio = dirtyAudioRef.current;

    if (audio && isFinite(seekTime)) {
      // console.log(`AudioPlayer: Seek bar changed to ${seekTime}`);
      audio.currentTime = seekTime;
      // Update display immediately for responsiveness
      setComponentCurrentTime(seekTime);
      // Also seek the dirty audio
      if (dirtyAudio) {
          console.log(`AudioPlayer: Seeking dirty audio to ${seekTime.toFixed(2)}`);
          dirtyAudio.currentTime = seekTime;
      }
    }
  };


  // --- Render ---
  const isActuallyPlaying = targetRateRef.current === 1; // Button reflects target state
  const currentTimeDisplay = formatTime(componentCurrentTime);
  const durationDisplay = formatTime(componentDuration);

  // Condition to hide controls: if mobile and in portrait mode
  const hideControls = isMobile && !isLandscape;

  return (
    <>
      {!hideControls && (
        <div className="timestamp no-select" style={{ textAlign: 'center', fontSize: '1.2em' }}>
          {currentTimeDisplay} / {durationDisplay}
          {componentIsLoading && <span style={{ marginLeft: '10px', fontSize: '0.8em', opacity: 0.7 }}>(Loading...)</span>}
        </div>
      )}

      {!hideControls && (
        <animated.div className="player-controls" style={{
          ...buttonsSpringProps,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          gap: '15px'
        }}>
          {/* Button container with perspective */}
          <div style={{
            perspective: '800px',
            width: '65px',
            height: '60px'
          }}>
            {/* Flipping button */}
            <animated.button 
              className="play-button no-select"
              onClick={handlePlayPauseClick} 
              disabled={componentIsLoading || !componentIsReady}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              style={{ 
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                transform: to(
                  [flipSpringProps.rotateY, hoverSpringProps.scale],
                  (rotateY, scale) => `rotateY(${rotateY}deg) scale(${scale})`
                ),
                border: 'none',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {/* Play side - Gold */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isActuallyPlaying ? 'transparent' : '#CEAF00', // Gold
                color: 'white',
                borderRadius: '50%',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                Play
              </div>
              {/* Pause side - Teal */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#008080', // Teal
                color: 'white',
                borderRadius: '50%',
                transform: 'rotateY(180deg)',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                Pause
              </div>
            </animated.button>
          </div>
          <input
              type="range"
              min="0"
              max={componentDuration > 0 ? componentDuration : 1} // Prevent max=0
              value={componentCurrentTime}
              onChange={handleSeekChange}
              disabled={componentIsLoading || !componentIsReady || componentDuration <= 0}
              style={{ width: '70%', height: '10px', cursor: (componentIsLoading || !componentIsReady || componentDuration <= 0) ? 'not-allowed' : 'pointer', opacity: (componentIsLoading || !componentIsReady || componentDuration <= 0) ? 0.5 : 1 }}
             />
        </animated.div>
      )}
    </>
  );
});

export default AudioPlayer; 