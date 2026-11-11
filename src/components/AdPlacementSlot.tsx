import React from 'react';

export interface AdPlacementProps {
  position: 'homepage-banner' | 'sidebar' | 'tool-page';
  slotId?: string;
  /**
   * Remains false by default until an advertising provider (e.g. Google AdSense)
   * is configured and approved in production. Never displays fake advertisements.
   */
  enabled?: boolean;
}

export const AdPlacementSlot: React.FC<AdPlacementProps> = ({
  position,
  slotId,
  enabled = false,
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const isReady = Boolean(enabled && clientId && slotId);

  // Do not load or show fake advertisements before a real ad provider is configured and approved.
  if (!isReady) {
    return null;
  }

  return (
    <aside
      aria-label="Sponsorlu Bağlantı Alanı"
      data-ad-position={position}
      className="my-6 w-full overflow-hidden flex justify-center"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
