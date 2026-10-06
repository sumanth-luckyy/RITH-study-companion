import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PDFDocument {
  id: string;
  title: string;
  description: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  category: string;
}

interface PDFCardProps {
  pdf: PDFDocument;
  index: number;
  onView: (pdf: PDFDocument) => void;
  onDownload: (pdf: PDFDocument) => void;
}

const categoryColors: Record<string, string> = {
  'Mathematics': 'bg-primary/10 text-primary',
  'Physics': 'bg-success/10 text-success',
  'Chemistry': 'bg-accent/10 text-accent-foreground',
  'Computer Science': 'bg-destructive/10 text-destructive',
  'Notes': 'bg-secondary text-secondary-foreground',
};

export function PDFCard({ pdf, index, onView, onDownload }: PDFCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="group bg-card rounded-2xl border border-border p-5 card-hover"
    >
      <div className="flex items-start gap-4">
        {/* PDF Icon */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <FileText className="w-7 h-7 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {pdf.title}
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${categoryColors[pdf.category] || 'bg-secondary text-secondary-foreground'}`}>
              {pdf.category}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {pdf.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {pdf.uploadedBy}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {pdf.uploadDate}
            </span>
            <span className="text-muted-foreground/60">{pdf.fileSize}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onView(pdf)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              View
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onDownload(pdf)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
