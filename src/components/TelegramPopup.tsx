import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export const TelegramPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds on first visit
    const hasShownPopup = localStorage.getItem('telegram-popup-shown');
    if (!hasShownPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('telegram-popup-shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoinTelegram = () => {
    window.open('https://t.me/CricketNewsSkull', '_blank');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-card to-muted border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Join Our Telegram Channel! 📱
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
              <Send className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Get Live Cricket Updates!
              </h3>
              <p className="text-muted-foreground text-sm">
                🏏 Live match notifications<br/>
                📺 Instant stream links<br/>
                🔥 Exclusive cricket content<br/>
                ⚡ Real-time updates
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleJoinTelegram}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Join Telegram Channel
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full border-muted-foreground/20 hover:bg-muted/50"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramPopup;