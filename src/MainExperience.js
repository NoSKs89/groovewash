import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSpring, useTransition, animated, config, useSpringRef, useChain } from '@react-spring/web';
import screenfull from 'screenfull';
import './App.css';
import secrets from './secrets';
import AudioPlayer from './components/AudioPlayer';
import RecordAnimation from './components/RecordAnimation';
import FadeMessaging from './components/FadeMessaging';
import BrowserSupportCheck from './components/BrowserSupportCheck';
// --- New Component Imports ---
import AppHeader from './components/AppHeader';
import WaiverModalContainer from './components/WaiverModalContainer';
import FaqModalContainer from './components/FaqModalContainer';
import ServicesModalContainer from './components/ServicesModalContainer';
import CreditsModalContainer from './components/CreditsModalContainer';
import CleanDirtyToggleButton from './components/CleanDirtyToggleButton';
import ContactUsModalContainer from './components/ContactUsModalContainer';
import ToggleFullscreenButton from './components/ToggleFullscreenButton';
import DebugDisplay from './components/DebugDisplay';
// --- End New Component Imports ---

// --- Audio File Imports ---
// These are the actual audio files used for playback.
// App.js is the central point for managing which audio file is currently active.
import ahmadJamalClean from './audio/Ahmad_Jamal_Clean.wav';
import bandOfSkullsClean from './audio/Band_Of_Skulls_Clean.wav';
import beethovenBrunoClean from './audio/Beethoven_Bruno_Clean.wav';
// Import corresponding 'dirty' versions
import ahmadJamalDirty from './audio/Ahmad_Jamal_Dirty.wav';
import bandOfSkullsDirty from './audio/Band_Of_Skulls_Dirty.wav';
import beethovenBrunoDirty from './audio/Beethoven_Bruno_Dirty.wav';
// --- End Audio File Imports ---

// --- Replicate coverData for accessible list (simplified) ---
// This should ideally be sourced from a single place if possible, but for now, we replicate for clarity.
const accessibleAlbumListData = [
  { title: 'Ahmad Jamal', artist: 'Ahmad Jamal', album: 'Digital Works' },
  { title: 'Beethoven Bruno', artist: 'Ludwig van Beethoven (Cond: Bruno Walter)', album: 'Symphony No. 6 "Pastorale"' },
  { title: 'Band Of Skulls', artist: 'Band Of Skulls', album: 'Himalayan' }
  // Add more if your coverData in RecordAnimation.js grows
];

// --- Waiver Text Constant ---
const WAIVER_CONTENT = `Please read and sign the waiver below. By signing, the customer acknowledges and agrees to the following terms regarding the cleaning and digitization of their vinyl records. While every effort is made to handle your records with the utmost care and we do not anticipate any damage occurring during our cleaning and digitization process, GrooveWash shall not be held liable for any damage whatsoever to the customer's vinyl records. This includes, but is not limited to, any damage that may exist prior to the service being performed (such as scratches, warps, or wear from prior use) or any damage that may occur during or after the service, regardless of cause. The customer assumes all risk inherent in the handling and processing of their records and agrees not to hold GrooveWash responsible for any loss or damage.`;
// -----------------------------

// --- Centralized Audio Data Mapping ---
// These maps link album titles (received from RecordAnimation) to their corresponding
// audio file imports and BPM values. App.js uses these to update the audio state
// when the active album changes.

// Maps album titles to the imported CLEAN audio file variables
const albumAudioMap = {
  'Band Of Skulls': bandOfSkullsClean,
  'Ahmad Jamal': ahmadJamalClean,
  'Beethoven Bruno': beethovenBrunoClean
};

// Maps album titles to the imported DIRTY audio file variables
const albumDirtyAudioMap = {
    'Band Of Skulls': bandOfSkullsDirty,
    'Ahmad Jamal': ahmadJamalDirty,
    'Beethoven Bruno': beethovenBrunoDirty
};

// Maps album titles to their corresponding BPMs
// This BPM value is passed down to VinylRecord for visual effects (e.g., pulse rings).
const albumBpmMap = {
    'Band Of Skulls': 144,
    'Ahmad Jamal': 89,
    'Beethoven Bruno': 112
};
// --- End Centralized Audio Data Mapping ---

// Get the initial active album title. This should match the default
// active album setup within RecordAnimation.js's coverData.
const initialActiveAlbumTitle = 'Band Of Skulls'; // Defaulting to Fresh Cream

// --- Web Audio API Setup (for Frequency Analysis) ---
// This section sets up the Web Audio API nodes (Analyser, Source)
// connected to the HTML <audio> element (managed by AudioPlayer)
// to extract frequency data for visual effects.
let audioContext = null; // Deprecated global variable, use ref instead
let analyser = null; // Deprecated global variable, use ref instead
let sourceNode = null; // Deprecated global variable, use ref instead
let freqDataArray = null; // Uint8Array to store frequency data, tied to analyserRef
// ---------------------------

function MainExperience() {
  // --- Core State ---
  const [isAppLoaded, setIsAppLoaded] = useState(false); // For initial load animations
  // isPlaying reflects the *intended* state (play/pause button) reported by AudioPlayer callback.
  const [isPlaying, setIsPlaying] = useState(false); 
  // isAudioReady reflects whether the *current* audio source in AudioPlayer is loaded and ready.
  const [isAudioReady, setIsAudioReady] = useState(false); 
  // currentBpm holds the BPM for the *currently selected* album, used by VinylRecord.
  const [currentBpm, setCurrentBpm] = useState(albumBpmMap[initialActiveAlbumTitle]); 
  // activeAlbumTitle tracks the title of the album currently selected in RecordAnimation.
  const [activeAlbumTitle, setActiveAlbumTitle] = useState(initialActiveAlbumTitle);
  // currentAudioSrc holds the imported audio file variable for the active album, passed to AudioPlayer.
  const [currentAudioSrc, setCurrentAudioSrc] = useState(albumAudioMap[initialActiveAlbumTitle]);
  // Add state for the corresponding dirty audio source
  const [currentDirtyAudioSrc, setCurrentDirtyAudioSrc] = useState(albumDirtyAudioMap[initialActiveAlbumTitle]);
  // frequencyData stores the analysed [low, mid, high] frequency band levels from the Web Audio API.
  const [frequencyData, setFrequencyData] = useState([0, 0, 0]); 
  // Add state for mobile and landscape detection
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  // Add state for fullscreen status
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Refs ---
  // audioRef provides access to the underlying HTML <audio> element managed by AudioPlayer.
  // This is crucial for the Web Audio API setup and direct time access if needed.
  const audioRef = useRef(null); // Ref for the CLEAN audio element
  const dirtyAudioRef = useRef(null); // Ref for the DIRTY audio element
  // audioPlayerRef allows App.js to call imperative methods (play, pause) on the AudioPlayer component.
  const audioPlayerRef = useRef(null); 
  // wasPlayingBeforeChangeRef tracks if audio should resume after an album transition.
  const wasPlayingBeforeChangeRef = useRef(false); 
  // isTransitioningRef prevents overlapping album change transitions.
  const isTransitioningRef = useRef(false); 
  // animationFrameId Ref for the frequency analysis loop ID.
  const animationFrameId = useRef(null); 
  // isAudioSetup flag prevents multiple Web Audio API setups.
  const isAudioSetup = useRef(false); 
  // Refs to store the persistent Web Audio API nodes.
  const audioContextRef = useRef(null); 
  const analyserRef = useRef(null); 
  const sourceNodeRef = useRef(null); 

  // --- UI / Focus State ---
  const [appFocusTarget, setAppFocusTarget] = useState(null); // Focus state from RecordAnimation

  // --- Modal States (Replaced with activeModal) ---
  const [activeModal, setActiveModal] = useState(null); // 'waiver', 'faq', 'services', 'credits', or null
  const [isClean, setIsClean] = useState(true);
  const [isCleanHovered, setIsCleanHovered] = useState(false);
  const appRef = useRef(null);

  // --- Dynamic Document Title Effect (Existing - will be complemented by Helmet) ---
  useEffect(() => {
    const baseTitle = 'GrooveWash - Ultrasonic Vinyl Record Cleaning & Digitization'; // Base title for Helmet too
    if (isPlaying && activeAlbumTitle) {
      let songDisplayTitle = '';
      switch (activeAlbumTitle) {
        case 'Ahmad Jamal':
          songDisplayTitle = 'Now Playing: Poinciana - GrooveWash';
          break;
        case 'Band Of Skulls':
          songDisplayTitle = 'Now Playing: Asleep At The Wheel - GrooveWash';
          break;
        case 'Beethoven Bruno':
          songDisplayTitle = 'Now Playing: I. Allegro ma non troppo - GrooveWash';
          break;
        default:
          // document.title = baseTitle; // Helmet will handle this
          return;
      }
      // document.title = songDisplayTitle; // Helmet will handle this
    } else {
      // document.title = baseTitle; // Helmet will handle this
    }
  }, [isPlaying, activeAlbumTitle]);

  // --- Initial Load Animation ---
  useEffect(() => {
    setIsAppLoaded(true);
  }, []);

  // --- Mobile & Landscape Detection ---
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      const maxTouchPoints = navigator.maxTouchPoints || 0;

      const isPotentiallyMobile =
        /Mobi/i.test(ua) ||             // General mobile token
        /Android/i.test(ua) ||          // Android
        /iPhone|iPad|iPod/.test(ua) ||  // iOS devices by userAgent
        (platform === 'MacIntel' && maxTouchPoints > 1) || // Modern iPads reporting as Mac
        /Windows Phone/i.test(ua);      // Windows Phone

      setIsMobile(isPotentiallyMobile);
      // Landscape check
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkDevice();

    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // --- Web Audio Initialization and Analysis Loop --- 
  useEffect(() => {
    const setupAudioAnalysis = () => {
      if (isAudioSetup.current || !audioRef.current) return; // Only setup once

      try {
        // Ensure AudioContext is created/resumed after user interaction
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const context = audioContextRef.current;

        // Resume context if suspended (necessary for browsers)
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Only create analyser and source if they don't exist
        if (!analyserRef.current) {
            analyserRef.current = context.createAnalyser();
            analyserRef.current.fftSize = 256; // Adjust FFT size (power of 2)
            freqDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        }
        const analyserNode = analyserRef.current;
        
        if (!sourceNodeRef.current) {
            sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
            // Connect the graph: source -> analyser -> destination
            sourceNodeRef.current.connect(analyserNode);
            analyserNode.connect(context.destination);
        }
        
        isAudioSetup.current = true;
        console.log("Web Audio API setup complete.");

      } catch (error) {
          console.error("Error setting up Web Audio API:", error);
          isAudioSetup.current = false; // Allow retry maybe?
      }
    };

    const runAnalysis = () => {
        if (!analyserRef.current || !freqDataArray) {
            animationFrameId.current = requestAnimationFrame(runAnalysis);
            return; // Wait if analyser not ready
        }

        analyserRef.current.getByteFrequencyData(freqDataArray);

        // --- Pass the RAW frequency data array --- 
        // Create a copy to avoid potential mutation issues
        const rawDataCopy = new Uint8Array(freqDataArray); 
        setFrequencyData(rawDataCopy);
        // -------------------------------------------

        // Continue the loop
        animationFrameId.current = requestAnimationFrame(runAnalysis);
    };

    // --- Start/Stop Logic --- 
    if (audioRef.current) {
        setupAudioAnalysis(); // Try setup when ref is available
    }

    if (isPlaying && isAudioSetup.current) {
        // Ensure context is running when starting playback
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        cancelAnimationFrame(animationFrameId.current); // Clear previous loop if any
        runAnalysis(); // Start analysis loop
        console.log("Audio analysis started.");
    } else {
        cancelAnimationFrame(animationFrameId.current); // Stop loop if not playing
        // console.log("Audio analysis stopped.");
    }

    // --- Cleanup on unmount --- 
    return () => {
        cancelAnimationFrame(animationFrameId.current);
        // Optional: Disconnect nodes and close context if App unmounts entirely
        // This might be too aggressive if other components use the context
        /*
        if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        // Don't close context usually, let browser manage
        // if (audioContextRef.current) audioContextRef.current.close();
        */
        console.log("Audio analysis cleanup.");
    };

}, [isPlaying]); // Rerun effect when isPlaying changes

  const recordSpring = useSpring({
    from: { opacity: 0, translateY: -60, rotateX: 180 },
    to: { 
      opacity: isAppLoaded ? 1 : 0, 
      translateY: isAppLoaded ? 0 : -60,
      rotateX: isAppLoaded ? 0 : 180
    },
    delay: 750,
    config: config.wobbly,
  });

  // --- Audio Player Callbacks ---
  // handlePlayStateChange: Updates App's isPlaying state based on AudioPlayer's report.
  // It also handles resuming the AudioContext if necessary when playback starts.
  const handlePlayStateChange = useCallback((reportedPlayingState) => {
    // If starting play, ensure audio context is running
    if (reportedPlayingState && audioContextRef.current && audioContextRef.current.state === 'suspended') {
        console.log("Resuming AudioContext on play...");
        audioContextRef.current.resume();
    }
    // If starting play and setup hasn't happened, try again
    if (reportedPlayingState && !isAudioSetup.current && audioRef.current) {
        console.log("Attempting audio setup on play...");
        // Directly call setup here - it includes the isAudioSetup check
        // No, setup should happen in the useEffect based on audioRef
        // Let the useEffect handle it when isPlaying becomes true.
    }

    setIsPlaying(reportedPlayingState);
  }, []);

  // handleAudioReady: Updates App's isAudioReady state based on AudioPlayer's report.
  // It also manages the final steps of an album transition, resuming playback if needed.
  const handleAudioReady = useCallback((reportedReadyState) => {
    setIsAudioReady(reportedReadyState);
    
    // Comment out the entire transition logic
    /*
    // If audio is ready and we're in a transition that's currently shrinking,
    // initiate the expansion phase - but only if we haven't started expanding yet
    if (reportedReadyState && isTransitioningRef.current && 
        albumTransitionState === 'shrinking' && !isExpandingRef.current) {
        
        console.log("App: Audio is ready after source change, transitioning to expanding state");
        
        // Set the expanding flag to prevent multiple expansions
        isExpandingRef.current = true;
        
        // Ensure context is running if resuming play after transition
        if (wasPlayingBeforeChangeRef.current && audioContextRef.current && 
            audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        
        // Start the expansion animation
        setAlbumTransitionState('expanding');
        
        // Add a timeout to reset the transition state and flags once animation completes
        setTimeout(() => {
            setAlbumTransitionState('idle');
            isTransitioningRef.current = false;
            isExpandingRef.current = false;
            
            // Resume playback if it was playing before
            if (wasPlayingBeforeChangeRef.current) {
                console.log("App: Resuming playback after album transition");
                audioPlayerRef.current?.play();
            }
            wasPlayingBeforeChangeRef.current = false;
            console.log("App: Album transition complete, reset to idle state");
        }, 500); // Wait for animation to finish
    }
    */
    
    // Add simplified logic to resume playback if needed
    if (reportedReadyState && isTransitioningRef.current) {
        // Ensure context is running if resuming play after transition
        if (wasPlayingBeforeChangeRef.current && audioContextRef.current && 
            audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        
        // Reset transition flag
        setTimeout(() => {
            isTransitioningRef.current = false;
            
            // Resume playback if it was playing before
            if (wasPlayingBeforeChangeRef.current) {
                console.log("App: Resuming playback after album change");
                audioPlayerRef.current?.play();
            }
            wasPlayingBeforeChangeRef.current = false;
        }, 100);
    }
}, [/* albumTransitionState */]);

  // Update BPM directly when album changes if using hardcoded map
  // This effect ensures the currentBpm state stays in sync with the activeAlbumTitle.
  useEffect(() => {
      const newBpm = albumBpmMap[activeAlbumTitle] || null;
      // console.log(`App: Setting BPM based on active album -> ${newBpm}`);
      setCurrentBpm(newBpm);
  }, [activeAlbumTitle]);

  // --- Handle Album Change Request from RecordAnimation ---
  // This callback receives the title of the newly selected album from RecordAnimation.
  // It orchestrates the transition: pausing current audio, updating the active title,
  // setting the new audio source (currentAudioSrc), and managing state flags.
  const handleActiveAlbumChange = useCallback((newAlbumTitle) => {
    // Prevent starting a new transition if one is already in progress
    if (isTransitioningRef.current) {
      console.warn("App: Ignoring album change request, transition already in progress.");
      return;
    }
    // Ignore if the title hasn't actually changed
    if (newAlbumTitle === activeAlbumTitle) {
       return;
    }

    console.log(`App: Starting album change to -> ${newAlbumTitle}`);
    isTransitioningRef.current = true; // Set transition flag
    // isExpandingRef.current = false; // Reset expanding flag at the start of a new transition

    // 1. Store if currently playing (to resume later)
    wasPlayingBeforeChangeRef.current = isPlaying;

    // 2. Tell AudioPlayer to pause (smoothly ramp down)
    console.log("App: Telling AudioPlayer to pause for transition.");
    audioPlayerRef.current?.pause();
    // Note: We don't immediately set isPlaying=false here, wait for callback

    // 3. Start visual transition (shrinking) - comment out
    // setAlbumTransitionState('shrinking');

    // 4. Set internal readiness to false (will be updated by AudioPlayer)
    setIsAudioReady(false);

    // 5. Update the target album title (used by RecordAnimation for visuals)
    setActiveAlbumTitle(newAlbumTitle);

    // 6. Update the audio source *prop* for AudioPlayer
    // (AudioPlayer's useEffect will detect this change and load the new src)
    // Add a small delay to allow shrink animation to start visually? Optional.
    setTimeout(() => {
        const newCleanSrc = albumAudioMap[newAlbumTitle]; // Look up the new CLEAN audio source using the title
        const newDirtySrc = albumDirtyAudioMap[newAlbumTitle]; // Look up the new DIRTY audio source using the title
        console.log(`App: Updating AudioPlayer src prop to -> ${newCleanSrc} (Clean)`);
        console.log(`App: Updating AudioPlayer dirty src prop to -> ${newDirtySrc} (Dirty)`);
        setCurrentAudioSrc(newCleanSrc); // Update the state passed to AudioPlayer
        setCurrentDirtyAudioSrc(newDirtySrc); // Update the dirty source state
        // Now we wait for the handleAudioReady callback to continue the sequence
    }, 100); // Reduced delay since we don't need to wait for visual transition
  }, [activeAlbumTitle, isPlaying]); // Dependencies

  // --- Function to handle clicks outside the form/FAQ/Services ---
  const handleBackdropClick = (e) => {
    if (activeModal && e.target === e.currentTarget) { 
      setActiveModal(null);
    }
  };

  const isCoverFocused = typeof appFocusTarget === 'number';

  // --- Fullscreen State Listener using screenfull ---
  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
        console.log('Screenfull fullscreen state:', screenfull.isFullscreen ? 'Yes' : 'No');
      };
      screenfull.on('change', handleChange);

      // Setup error listener
      const handleError = (event) => {
        window.alert(`Screenfull error: ${event.type}`); // Simple alert for error
        console.error('Failed to enable fullscreen', event);
      };
      screenfull.on('error', handleError);
      handleChange();

      return () => {
        screenfull.off('change', handleChange);
        screenfull.off('error', handleError);
      };
    }
  }, []); // Run once on mount

  // --- Exit Fullscreen Effect using screenfull (only when isMobile and returning to portrait) ---
  useEffect(() => {
    if (isMobile && !isLandscape && isFullscreen) {
      if (screenfull.isEnabled) {
        console.log("Attempting exit fullscreen with screenfull (mobile portrait detected)");
        screenfull.exit().catch(err => window.alert(`Screenfull - Error exiting fullscreen: ${err.type || 'Unknown error'}`));
      }
    }
  }, [isMobile, isLandscape, isFullscreen]);

  // --- Callback to handle TOGGLING fullscreen ---
  const handleToggleFullscreenClick = useCallback(() => {
    if (!screenfull.isEnabled) {
      window.alert('Fullscreen API is not supported by this browser.');
      return;
    }

    const element = appRef.current;
    if (!element) {
      window.alert('App element not found for fullscreen toggle.');
      return;
    }

    if (screenfull.isFullscreen) {
      console.log("Attempting to exit fullscreen via toggle button");
      screenfull.exit().catch(err => window.alert(`Screenfull - Error exiting fullscreen: ${err.type || 'Unknown error'}`));
    } else {
      console.log("Attempting to enter fullscreen via toggle button");
      screenfull.request(element).catch(err => window.alert(`Screenfull - Error requesting fullscreen: ${err.type || 'Unknown error'}`));
    }
  }, [appRef]); // isFullscreen is implicitly handled by screenfull.isFullscreen check

  const organizationSchema = {
    "@context": "https.schema.org",
    "@type": "Organization",
    "name": "GrooveWash",
    "url": secrets.baseUrl,
    "logo": secrets.logoUrl,
    "description": secrets.businessDescription,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": secrets.phoneNumber,
      "contactType": "Customer Service"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": secrets.address.streetAddress,
      "addressLocality": secrets.address.addressLocality,
      "addressRegion": secrets.address.addressRegion,
      "addressCountry": secrets.address.addressCountry,
      "postalCode": secrets.address.postalCode
    },
    "sameAs": secrets.socialMedia
  };

  return (
    <>
      <Helmet>
        <title>{isPlaying && activeAlbumTitle ? 
                  (activeAlbumTitle === 'Ahmad Jamal' ? 'Now Playing: Poinciana - GrooveWash' :
                  activeAlbumTitle === 'Band Of Skulls' ? 'Now Playing: Asleep At The Wheel - GrooveWash' :
                  activeAlbumTitle === 'Beethoven Bruno' ? 'Now Playing: I. Allegro ma non troppo - GrooveWash' :
                  'GrooveWash - Ultrasonic Vinyl Record Cleaning & Digitization') :
                  'GrooveWash - Ultrasonic Vinyl Record Cleaning & Digitization | Minnesota'}</title>
        <meta name="description" content="Experience ultrasonic vinyl record cleaning and professional digitization services with GrooveWash. Bring your music collection back to life. Serving Minnesota." />
        <meta name="keywords" content="Vinyl, Record, Cleaning, Ultrasonic, Record Cleaning, Minnesota, Collection, Digitization, Music, GrooveWash" />
        <link rel="canonical" href={`${secrets.baseUrl}/`} />
        <meta property="og:title" content={`${secrets.businessName} - Ultrasonic Vinyl Cleaning & Digitization`} />
        <meta property="og:description" content="Premium ultrasonic cleaning and digitization for your beloved vinyl records. Restore clarity and preserve your music collection." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${secrets.baseUrl}/`} />
        <meta property="og:image" content={secrets.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${secrets.businessName} - Ultrasonic Vinyl Cleaning & Digitization`} />
        <meta name="twitter:description" content="Restore your vinyl collection with GrooveWash's ultrasonic cleaning and digitization services in Minnesota." />
        <meta name="twitter:image" content={secrets.twitterImage} />
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      </Helmet>
      {/* SEO Descriptive Text for WebGL Content */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
        <h2>About Our Interactive Vinyl Experience</h2>
        <p>
          Explore a unique 3D interactive showcase of vinyl records. Our WebGL experience allows you to 
          virtually handle and see details of album covers, simulating the joy of browsing a record collection.
          This demonstration highlights the types of records we meticulously clean and digitize at GrooveWash,
          your Minnesota-based experts for vinyl preservation.
        </p>
        <p>
          Services offered include ultrasonic record cleaning in Minnesota, ensuring your vinyl is free from dust and grime 
          for the best possible sound. We also provide high-fidelity record digitization, preserving your 
          favorite albums for years to come. Each record, like those interactively displayed, receives our full attention to detail.
        </p>
      </div>
      {/* Accessible List of Albums */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
        <h2>Albums Featured in Interactive Experience</h2>
        <p>The following albums are featured in our interactive 3D record viewer. Select an album in the experience to learn more or hear a sample. We offer cleaning and digitization for all types of vinyl records like these.</p>
        <ul>
          {accessibleAlbumListData.map((album, index) => (
            <li key={`accessible-album-${index}`}>
              {album.album} by {album.artist} (Selectable in our 3D experience)
            </li>
          ))}
        </ul>
      </div>
      <div className="App" ref={appRef}>
        <h1 className="visually-hidden">GrooveWash: Ultrasonic Vinyl Record Cleaning & Digitization Minnesota</h1>
        <header className="App-header no-select">
          <AppHeader
            isLandscape={isLandscape}
            isAppLoaded={isAppLoaded}
            isMobile={isMobile}
            audioRef={audioRef}
            isPlaying={isPlaying}
            audioContext={audioContextRef.current}
            sourceNode={sourceNodeRef.current}
          />
          
          <animated.div 
            style={{
              ...recordSpring, 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <RecordAnimation 
              isPlaying={isPlaying} 
              audioRef={audioRef} // Pass audioRef for VinylRecord interaction
              currentBpm={currentBpm} // Pass current BPM for VinylRecord visualization
              onFocusTargetChange={setAppFocusTarget} 
              onActiveAlbumChange={handleActiveAlbumChange} // Pass the callback to handle album changes
              albumTransitionState="idle" // Always pass 'idle' state
              frequencyData={frequencyData} // Pass analysed frequency data for visuals
              analyserRef={analyserRef} // Pass the analyser node ref
              isMobile={isMobile} // Pass down isMobile state
              isClean={isClean}
              isFullscreen={isFullscreen}
            /> 
          </animated.div>

          {/* Audio player needs positioning context and higher z-index */}
          <div style={{ position: 'relative', zIndex: 20 }}> 
            <div style={{ 
              opacity: isCoverFocused ? 0 : 1,
              visibility: isCoverFocused ? 'hidden' : 'visible',
              transition: 'opacity 0.3s ease, visibility 0.3s ease'
            }}>
              <AudioPlayer 
                ref={audioPlayerRef} // Provide ref for imperative control
                audioRef={audioRef} // Provide ref to manage the underlying <audio> element
                audioUrl={currentAudioSrc} // Pass the currently selected audio source URL/import
                onPlayStateChange={handlePlayStateChange} // Pass callback for play state changes
                onReady={handleAudioReady} // Pass callback for audio readiness changes
                // Pass down the clean/dirty state and the ref/URL for the dirty audio
                isClean={isClean} // Pass the current clean/dirty state
                dirtyAudioRef={dirtyAudioRef} // Pass the ref for the dirty audio element
                dirtyAudioUrl={currentDirtyAudioSrc} // Pass the URL for the dirty audio
                // --- ADDED PROPS ---
                isMobile={isMobile}
                isLandscape={isLandscape}
              />
            </div>
          </div>
        </header>

        {/* --- Backdrop for Modals --- */}
        {activeModal && ( 
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 100, // zIndex should be below modal content (e.g. 999 if modals are 1000)
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onClick={handleBackdropClick}
          />
        )}

        {/* --- Conditionally Render Modal Buttons --- */}
        {/* Render only if NOT (mobile AND portrait) */}
        {!(isMobile && !isLandscape) && (
          <>
            {/* --- Animated Waiver Container --- */}
            <WaiverModalContainer
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              isMobile={isMobile}
              isLandscape={isLandscape}
              WAIVER_CONTENT={WAIVER_CONTENT}
            />
            <FaqModalContainer
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              isMobile={isMobile}
              isLandscape={isLandscape}
            />
            <ServicesModalContainer
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              isMobile={isMobile}
              isLandscape={isLandscape}
            />
            <CreditsModalContainer
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              isMobile={isMobile}
              isLandscape={isLandscape}
            />
            {/* --- End Animated Services Container --- */}
          </>
        )}
        <CleanDirtyToggleButton
          isMobile={isMobile}
          isLandscape={isLandscape}
          isClean={isClean}
          setIsClean={setIsClean}
          style={{ right: '23%' }}
        />
        {/* --- End Clean/Dirty Button --- */}

        {/* Hidden HTML Audio Element controlled by audioRef (CLEAN) */}
        {/* This element is managed by AudioPlayer via the audioRef */}
        {/* Its src is set based on currentAudioSrc state */}
        <audio
          ref={audioRef}
          preload="auto"
          playsInline // Important for iOS devices
          crossOrigin="anonymous" // If loading from external sources
        />

        {/* Second Hidden HTML Audio Element for the DIRTY track */}
        <audio
          ref={dirtyAudioRef}
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          // We will mute this by default in AudioPlayer based on isClean state
        />

        {/* Conditionally hide DebugDisplay */}
        {false && <DebugDisplay
          isMobile={isMobile}
          currentBpm={currentBpm}
          activeAlbumTitle={activeAlbumTitle}
          isPlaying={isPlaying}
          isAudioReady={isAudioReady}
          isTransitioning={isTransitioningRef.current}
          wasPlayingBeforeChange={wasPlayingBeforeChangeRef.current}
          audioRef={audioRef}
          dirtyAudioRef={dirtyAudioRef}
          isLandscape={isLandscape}
          isFullscreen={isFullscreen}
        />}

        {/* --- Use FadeMessaging Component --- */}
        <FadeMessaging
          isVisible={isMobile && !isLandscape} // Show when mobile portrait
          messageLines={["Flip", "Device"]}
          onClickHandler={handleToggleFullscreenClick} // Corrected handler name
          repeat={3}
          intervalDelay={15000}
          initialDelay={4000}
          // Pass other props like zIndex, colors if needed
        />

        {/* Conditionally render the "Tap for Fullscreen" message */}
        <BrowserSupportCheck isMobile={isMobile}>
          <FadeMessaging
            isVisible={isMobile && isLandscape && !isFullscreen} // Show when mobile landscape BUT NOT fullscreen
            messageLines={["Tap for", "Fullscreen"]}
            onClickHandler={handleToggleFullscreenClick} // Corrected handler name
            repeat={2}
            intervalDelay={15000}
            initialDelay={4000}
            // Pass other props like zIndex, colors if needed
          />
        </BrowserSupportCheck>
    
        <ToggleFullscreenButton
          isFullscreen={isFullscreen}
          isLandscape={isLandscape}
          onToggleFullscreenClick={handleToggleFullscreenClick}
          isFullscreenApiEnabled={screenfull.isEnabled}
          isMobile={isMobile}
        />
        <ContactUsModalContainer isMobile={isMobile} />
      </div>
    </>
  );
}

export default MainExperience;
