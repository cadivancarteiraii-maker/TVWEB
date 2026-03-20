import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress the common "The play() request was interrupted by a call to pause()" error
// which happens frequently with ReactPlayer and rapid state changes
const originalPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function() {
  const promise = originalPlay.call(this);
  if (promise !== undefined) {
    return promise.catch((error) => {
      if (error.name === 'AbortError' || error.message?.includes('The play() request was interrupted')) {
        // Ignore the error and resolve
        return;
      }
      throw error;
    });
  }
  return promise;
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('The play() request was interrupted')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
