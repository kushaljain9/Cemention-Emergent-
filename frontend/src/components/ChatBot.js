import React, { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import { Button } from './ui/button';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const menuOptions = [
    { id: 1, text: 'Place a new order', response: 'To place a new order, please browse our products and add items to your cart. Minimum order quantity is 100 bags.' },
    { id: 2, text: 'Check price', response: 'Prices vary based on user type (Dealer, Retailer, or Customer). Please login to see exact pricing for your account.' },
    { id: 3, text: 'Talk to sales team', response: 'You can call our sales team directly at +91 1234567890. We are available Monday to Saturday, 9:00 AM - 6:00 PM.' },
    { id: 4, text: 'Request bulk order', response: 'For bulk orders or custom delivery requirements, please use the "Request Order" option available on product pages or contact our sales team.' }
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95 z-50"
          data-testid="chatbot-open-btn"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white border-2 border-slate-200 rounded-sm shadow-2xl z-50" data-testid="chatbot-widget">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-chivo font-bold uppercase">Cemention Support</span>
            </div>
            <button onClick={() => { setIsOpen(false); setSelectedOption(null); }} data-testid="chatbot-close-btn">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 h-96 overflow-y-auto bg-slate-50">
            <div className="bg-white border border-slate-200 p-4 rounded-sm mb-4">
              <p className="font-manrope text-slate-900 font-medium mb-2">Hello! Welcome to Cemention</p>
              <p className="font-manrope text-slate-600 text-sm mb-2">We help you place bulk cement orders easily.</p>
              <p className="font-manrope text-slate-600 text-sm mb-2">Minimum order quantity is 100 bags.</p>
              <p className="font-manrope text-slate-900 font-medium">How can we assist you today?</p>
            </div>

            {!selectedOption ? (
              <div className="space-y-2">
                {menuOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option)}
                    className="w-full text-left bg-white border-2 border-slate-200 hover:border-orange-500 p-3 rounded-sm font-manrope text-slate-900 transition-colors"
                    data-testid={`chatbot-option-${option.id}`}
                  >
                    {option.id}. {option.text}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="bg-orange-100 border border-orange-200 p-3 rounded-sm mb-4 text-right">
                  <p className="font-manrope text-slate-900">{selectedOption.text}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-sm mb-4">
                  <p className="font-manrope text-slate-900">{selectedOption.response}</p>
                </div>
                <Button
                  onClick={() => setSelectedOption(null)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-sm font-bold uppercase"
                  data-testid="chatbot-back-btn"
                >
                  Back to Menu
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 border-t-2 border-slate-200 bg-white">
            <a href="tel:+911234567890" className="block" data-testid="chatbot-call-btn">
              <Button className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Call to Order
              </Button>
            </a>
            <p className="text-xs text-slate-500 text-center mt-2 font-manrope">For bulk or urgent orders call directly</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;