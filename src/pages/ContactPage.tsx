import React, { useState } from 'react';
import { CheckCircle2, Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { buildGeneralWhatsAppUrl } from '../utils/whatsapp';

export function ContactPage() {
  const { siteSettings, submitContactInquiry } = useStore();
  const whatsappUrl = buildGeneralWhatsAppUrl(siteSettings);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry({ name, email, phone, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      setErrorMsg(
        'Unable to send your message at the moment. Please contact us directly via WhatsApp.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title="Contact Us | ANTIKER – Inquiries & Showroom"
        description="Reach the ANTIKER concierge via WhatsApp or contact form for product availability, pricing, and interior styling inquiries."
      />

      <section className="bg-[#22221F] border-b border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
            Concierge &amp; Showroom
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#F5F1E8]">
            Contact ANTIKER
          </h1>
          <p className="mt-3 text-base text-[#B9B3A8] max-w-xl">
            Reach us directly via WhatsApp for immediate piece inquiries, or send a detailed
            note using the form below.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#292823] border border-[#B9975B]/50 p-8 space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#B9975B]">
                Primary Concierge
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F5F1E8]">
                Direct WhatsApp Assistance
              </h2>
              <p className="text-sm text-[#B9B3A8] leading-relaxed">
                For dimensions, finish photos, pricing, or availability checks, start a
                conversation directly on WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] transition-colors"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>Message on WhatsApp</span>
              </a>
            </div>

            <div className="bg-[#22221F] border border-[#494335] p-8 space-y-6">
              <h3 className="font-serif text-2xl text-[#F5F1E8]">Showroom Information</h3>

              <div className="space-y-4 text-sm text-[#B9B3A8]">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.75} />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#B9B3A8]/70">
                      Telephone
                    </div>
                    <div className="mt-0.5 font-medium text-[#F5F1E8]">
                      {siteSettings.phoneDisplay}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.75} />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#B9B3A8]/70">
                      Email
                    </div>
                    <a
                      href={`mailto:${siteSettings.emailDisplay}`}
                      className="mt-0.5 font-medium text-[#F5F1E8] hover:text-[#B9975B] transition-colors break-all"
                    >
                      {siteSettings.emailDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.75} />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#B9B3A8]/70">
                      Business Location
                    </div>
                    <div className="mt-0.5 font-medium text-[#F5F1E8]">
                      {siteSettings.addressDisplay}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#494335] flex flex-wrap gap-5 text-xs uppercase tracking-wider">
                  {siteSettings.instagramHandle && (
                    <a
                      href={`https://instagram.com/${siteSettings.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#F5F1E8] hover:text-[#B9975B]"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#B9975B]" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {siteSettings.facebookUrl && (
                    <a
                      href={siteSettings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F1E8] hover:text-[#B9975B]"
                    >
                      Facebook
                    </a>
                  )}
                  {siteSettings.pinterestUrl && (
                    <a
                      href={siteSettings.pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F1E8] hover:text-[#B9975B]"
                    >
                      Pinterest
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-[#22221F] border border-[#494335] p-8 sm:p-10">
            <h2 className="font-serif text-3xl text-[#F5F1E8]">Send an Inquiry</h2>
            <p className="mt-2 text-sm text-[#B9B3A8]">
              Share the pieces you are exploring or your interior styling needs.
            </p>

            {submitted ? (
              <div className="mt-8 p-6 bg-[#292823] border border-[#B9975B] space-y-3">
                <div className="flex items-center gap-2.5 text-[#F5F1E8] font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#B9975B]" />
                  <span>Inquiry Received</span>
                </div>
                <p className="text-sm text-[#B9B3A8]">
                  Thank you for contacting ANTIKER. Your inquiry has been saved for our team to
                  review. For immediate assistance, you may also message us on WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-medium uppercase tracking-wider text-[#B9975B] underline underline-offset-4 hover:text-[#F5F1E8]"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {errorMsg && (
                  <div className="p-3.5 bg-red-950/60 border border-red-700 text-xs text-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#B9975B]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={150}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#B9975B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5"
                    >
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      maxLength={40}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#B9975B]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5"
                    >
                      Subject *
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      maxLength={150}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Piece inquiry, custom request..."
                      className="w-full h-11 px-3.5 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/50 focus:outline-none focus:border-[#B9975B]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs uppercase tracking-wider text-[#B9B3A8] mb-1.5"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3.5 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#B9975B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] disabled:opacity-60 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
