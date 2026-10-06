import { useState, useEffect } from 'react';
import { Star, Send, Heart, CheckCircle2, MessageSquare } from 'lucide-react';
import { academicService } from '@/services/academicService';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RatingFeedback } from '@/types/academic';

const CATEGORIES = ['Overall Platform', 'Lecture Notes Quality', 'Timetable Accuracy', 'Mobile Experience', 'Other'];

export default function RateUs() {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRatings, setSubmittedRatings] = useState<RatingFeedback[]>([]);

  useEffect(() => {
    async function loadRatings() {
      const data = await academicService.getRatings();
      setSubmittedRatings(data);
    }
    loadRatings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating from 1 to 5.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await academicService.submitRating(rating, feedback.trim(), category);
      const updated = await academicService.getRatings();
      setSubmittedRatings(updated);
      setRating(0);
      setFeedback('');
      toast({
        title: 'Feedback Recorded',
        description: 'Thank you for your rating! It helps improve Study Companion.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to record rating.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVal = hoveredRating || rating;
  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Student Feedback & Rating"
        subtitle="Share genuine feedback to help us enhance the academic platform for everyone."
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="text-center py-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">How is your experience with Study Companion?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= currentVal
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-border hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {currentVal > 0 && (
              <p className="text-xs font-semibold text-primary">{ratingLabels[currentVal]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Feedback Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Comments & Suggestions</label>
            <textarea
              rows={3}
              placeholder="What do you like, or what features would you like to see added?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full rounded-xl text-xs gap-2 py-2.5"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Recording Feedback...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>

      {/* Recent Feedback List */}
      {submittedRatings.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Recorded Feedback</h3>
          <div className="divide-y divide-border/40 text-xs">
            {submittedRatings.map((r) => (
              <div key={r.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-border'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-semibold text-foreground ml-1.5">{r.category}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.feedback && <p className="text-muted-foreground text-[11px]">{r.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
