import { useEffect, useRef } from 'react';
import { showInterstitialAd } from './ads/InterstitialAd';

type Props = {
  visible: boolean;
  onClose?: () => void;
};

/**
 * Triggers a Google AdMob interstitial when `visible` flips to true.
 * The AdMob SDK renders its own full-screen overlay — this component has no
 * visible UI of its own. Calls onClose() when the ad is dismissed or if it
 * fails to load (always fails silently so the app is never blocked).
 */
export default function LoadingAd({ visible, onClose }: Props) {
  const triggered = useRef(false);

  useEffect(() => {
    if (visible && !triggered.current) {
      triggered.current = true;
      showInterstitialAd(() => {
        onClose?.();
      });
    }
    if (!visible) {
      triggered.current = false;
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
