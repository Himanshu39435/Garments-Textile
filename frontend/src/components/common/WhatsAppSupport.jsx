import { MessageCircle } from 'lucide-react';
import { CONTACT } from '@/utils/constants';

const SUPPORT_MESSAGE = encodeURIComponent('Hello Narang Textile, I need help with a wholesale enquiry.');

export default function WhatsAppSupport() {
  return (
    <a
      href={`${CONTACT.whatsappHref}?text=${SUPPORT_MESSAGE}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Narang Textile on WhatsApp"
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white no-underline shadow-lg transition-transform hover:scale-105 hover:text-white"
    >
      <MessageCircle size={21} fill="currentColor" aria-hidden="true" />
      <span className="hidden sm:inline">WhatsApp support</span>
    </a>
  );
}
