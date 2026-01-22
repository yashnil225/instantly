"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
}

const faqList: FAQItemProps[] = [
  {
    question: "How does Instantly track my emails?",
    answer: "We use an invisible tracking pixel (a tiny 1x1 transparent image) embedded in your sent emails. When the recipient opens the email, the pixel is loaded from our servers, notifying us of the open event with details like timestamp, device type, and approximate location.",
  },
  {
    question: "Can I track link clicks and attachment downloads?",
    answer: "Absolutely! Our Professional and Enterprise plans include full link click tracking and attachment monitoring. We wrap your links with a unique tracking URL that redirects instantly, allowing us to record every engagement.",
  },
  {
    question: "Which email providers are supported?",
    answer: "Instantly works seamlessly with all major email providers, including Gmail/Google Workspace, Microsoft Outlook/Office 365, Apple Mail, and standard IMAP/SMTP setups.",
  },
  {
    question: "Is email tracking legal and GDPR compliant?",
    answer: "Yes, email tracking is legal in most jurisdictions when used for legitimate business purposes. Instantly is fully GDPR and CAN-SPAM compliant. We provide tools to include opt-out links and respect 'Do Not Track' headers to ensure you stay compliant.",
  },
  {
    question: "Will my recipients see that I am tracking them?",
    answer: "By default, our tracking is completely invisible. The tracking pixel is 1x1 and transparent, so it doesn't affect your email's layout. However, some advanced email clients might block images by default, which can affect tracking accuracy.",
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    setHeight(isOpen ? accordion.current?.scrollHeight : 0);
  }, [isOpen]);

  return (
    <div className="border-b border-border last:border-none">
      <button
        className="flex justify-between items-center w-full py-6 text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={`text-lg font-semibold transition-colors duration-200 ${isOpen ? "text-indigo-600" : "text-foreground group-hover:text-indigo-500"}`}>
          {item.question}
        </span>
        <div className={`p-1 rounded-full transition-transform duration-300 bg-muted group-hover:bg-indigo-50 ${isOpen ? "rotate-180 bg-indigo-100" : ""}`}>
          <ChevronDown className={`h-5 w-5 transition-colors ${isOpen ? "text-indigo-600" : "text-muted-foreground"}`} />
        </div>
      </button>

      <div
        ref={accordion}
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: height }}
      >
        <div className="pb-6 text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

const FAQ = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about the most powerful email tracking platform.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Still have questions? <a href="/contact" className="text-indigo-600 font-bold hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
