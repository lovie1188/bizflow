export const playVoiceAlert = (message) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    
    // Customize voice parameters
    utterance.rate = 0.95; // Slightly slower for better clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Optional: try to find a professional female voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Google UK English Female')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech Synthesis API not supported in this browser.");
  }
};
