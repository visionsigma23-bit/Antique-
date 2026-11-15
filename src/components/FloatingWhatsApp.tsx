import React from 'react';
import { useStore } from '../context/StoreContext';
import { buildGeneralWhatsAppUrl } from '../utils/whatsapp';

export function FloatingWhatsApp() {
  const { siteSettings } = useStore();
  const url = buildGeneralWhatsAppUrl(siteSettings);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-[#FFFFFF] flex items-center justify-center shadow-lg shadow-black/45 transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-current"
        aria-hidden="true"
      >
        <path d="M16.002 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.352.616 4.647 1.787 6.671L2.56 29.333l6.829-1.79A13.28 13.28 0 0 0 16.002 29.333c7.36 0 13.331-5.972 13.331-13.333S23.362 2.667 16.002 2.667zm0 24.357a10.97 10.97 0 0 1-5.595-1.533l-.401-.238-4.053 1.063 1.082-3.95-.261-.416a10.95 10.95 0 0 1-1.68-5.85c0-6.077 4.945-11.022 11.024-11.022 6.076 0 11.02 4.945 11.02 11.022 0 6.077-4.944 11.024-11.02 11.024zm6.046-8.257c-.331-.166-1.959-.967-2.263-1.078-.304-.111-.525-.166-.746.166-.221.331-.856 1.078-1.049 1.298-.193.221-.387.249-.718.083-.331-.166-1.398-.515-2.663-1.644-.984-.878-1.649-1.961-1.842-2.293-.193-.331-.021-.51.145-.675.149-.149.331-.387.497-.58.166-.193.221-.331.331-.553.111-.221.055-.414-.028-.58-.083-.166-.746-1.798-1.022-2.461-.269-.646-.542-.559-.746-.569-.193-.01-.414-.012-.635-.012-.221 0-.58.083-.884.414-.304.331-1.16 1.133-1.16 2.763s1.188 3.205 1.353 3.426c.166.221 2.338 3.57 5.664 5.006.791.341 1.409.545 1.89.698.794.252 1.517.217 2.088.131.637-.095 1.959-.801 2.235-1.575.276-.774.276-1.437.193-1.575-.083-.138-.304-.221-.635-.387z" />
      </svg>
    </a>
  );
}
