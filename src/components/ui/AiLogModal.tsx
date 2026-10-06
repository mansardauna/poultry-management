'use strict';
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';

/**
 * Props for the AiLogModal component.
 * @property onSuccess - Optional callback invoked after the report is successfully processed.
 */
interface AiLogModalProps {
  onSuccess?: () => void;
}

interface ExtractedAiData {
  staffChanges?: {
    removeAll?: boolean;
    add?: Array<{ name: string; role: string; salary: number }>;
  };
  eggs?: Array<{ goodEggs?: number; date?: string; notes?: string }>;
  expenses?: Array<{ amount: number; description?: string; category?: string; date?: string }>;
  medications?: Array<{ name?: string; date?: string }>;
  feedUsedKg?: number;
  mortalityCount?: number;
  salesAmount?: number;
}

/**
 * Modal dialog that accepts a free-text daily farm report and uses
 * a pattern-matching parser to extract key metrics (eggs, feed, mortality,
 * sales, expenses) and writes them directly to the database.
 */
export function AiLogModal({ onSuccess }: AiLogModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAiData | null>(null);

  /** Opens the modal dialog. */
  const handleOpen = () => setOpen(true);

  /**
   * Closes the modal and resets all form state after the close animation completes.
   * Does nothing if a report is currently being processed.
   */
  const handleClose = () => {
    if (!isProcessing) {
      setOpen(false);
      // Reset after close animation
      setTimeout(() => {
        setReportText('');
        setSuccess(false);
        setExtractedData(null);
      }, 300);
    }
  };

  /**
   * Submits the free-text report to the AI parser API endpoint.
   * On success, stores the extracted data and triggers the onSuccess callback.
   */
  const handleProcessLog = async () => {
    if (!reportText.trim()) return;

    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportText })
      });

      if (res.ok) {
        const result = await res.json();
        setExtractedData(result.extracted || result.parsed);
        setIsProcessing(false);
        setSuccess(true);

        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setIsProcessing(false);
        toast.error(t('Failed to parse report. Please try again.', 'Failed to parse report. Please try again.'));
      }
    } catch {
      setIsProcessing(false);
      toast.error(t('Error contacting the parser service.', 'Error contacting the parser service.'));
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-white border-2 border-indigo-600 text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Sparkles size={18} /> {t('AI Auto-Log', 'AI Auto-Log')}
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { borderRadius: 2 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#0f172a' }}>
          {success ? t("Report processed", "Report processed") : t("Voice & text log parser", "Voice & text log parser")}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          {success ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Sparkles size={48} color="#4f46e5" className="mx-auto mb-4 block" />
              <Typography variant="h6" sx={{ fontFamily: "var(--font-cal-sans)", color: "#1e293b" }}>
                {t("Database Updated Successfully!", "Database Updated Successfully!")}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "var(--font-dm-sans)", mt: 1 }}>
                {t("The AI has extracted the following metrics:", "The AI has extracted the following metrics:")}
              </Typography>
              {!!extractedData && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "left", maxHeight: "300px", overflowY: "auto" }} className="font-mono text-xs text-slate-700 space-y-2">
                  {/* Staff Updates */}
                  {extractedData.staffChanges?.removeAll && <div className="text-red-600">{t("Removed all previous staff records.", "Removed all previous staff records.")}</div>}
                  {extractedData.staffChanges?.add?.map((s, i) => (
                    <div key={'s'+i}>{t("Added Staff:", "Added Staff:")} {s.name} ({s.role}) - ₦{s.salary.toLocaleString()}</div>
                  ))}
                  
                  {/* Eggs */}
                  {extractedData.eggs?.map((e, i) => (
                    <div key={'e'+i}>{t("Collected", "Collected")} {e.goodEggs} {t("eggs on", "eggs on")} {e.date} {e.notes ? `(${e.notes})` : ''}</div>
                  ))}

                  {/* Expenses */}
                  {extractedData.expenses?.map((ex, i) => (
                    <div key={'ex'+i}>{t("Logged Expense:", "Logged Expense:")} ₦{ex.amount.toLocaleString()} for {ex.description} ({ex.category}) on {ex.date}</div>
                  ))}

                  {/* Medications */}
                  {extractedData.medications?.map((m, i) => (
                    <div key={'m'+i}>{t("Scheduled:", "Scheduled:")} {m.name} on {m.date}</div>
                  ))}

                  {/* Basic Metrics */}
                  {Boolean(extractedData.feedUsedKg && extractedData.feedUsedKg > 0) && <div>{t("Feed Used:", "Feed Used:")} {extractedData.feedUsedKg} kg</div>}
                  {Boolean(extractedData.mortalityCount && extractedData.mortalityCount > 0) && <div>{t("Mortality:", "Mortality:")} {extractedData.mortalityCount} birds</div>}
                  {Boolean(extractedData.salesAmount && extractedData.salesAmount > 0) && <div>{t("Sales Recorded:", "Sales Recorded:")} ₦{(extractedData.salesAmount || 0).toLocaleString()}</div>}
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "var(--font-dm-sans)", mb: 3, mt: 1 }}>
                {t("Paste your daily report below. The AI will automatically extract egg collections, feed usage, and mortality figures to update your records.", "Paste your daily report below. The AI will automatically extract egg collections, feed usage, and mortality figures to update your records.")}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                id="report"
                label={t("Daily Farm Report", "Daily Farm Report")}
                type="text"
                fullWidth
                multiline
                rows={6}
                placeholder={t("Example: Today we collected 4500 good eggs, but 12 were cracked. Unfortunately, 3 birds died. We also spent 250000 on drugs and sold eggs for 600000.", "Example: Today we collected 4500 good eggs, but 12 were cracked. Unfortunately, 3 birds died. We also spent 250000 on drugs and sold eggs for 600000.")}
                variant="outlined"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                disabled={isProcessing}
                slotProps={{
                  input: { sx: { borderRadius: 2, fontFamily: 'var(--font-dm-sans)' } },
                  inputLabel: { sx: { fontFamily: 'var(--font-dm-sans)' } }
                }}
              />
            </>
          )}
        </DialogContent>
        {!success && (
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <MuiButton
              onClick={handleClose}
              disabled={isProcessing}
              sx={{ borderRadius: 2, fontFamily: 'var(--font-dm-sans)', color: '#64748b' }}
            >
              {t("Cancel", "Cancel")}
            </MuiButton>
            <MuiButton
              onClick={handleProcessLog}
              variant="contained"
              disabled={!reportText.trim() || isProcessing}
              sx={{
                borderRadius: 2,
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                fontFamily: 'var(--font-dm-sans)',
                boxShadow: 'none',
                minWidth: '120px'
              }}
            >
              {isProcessing ? <CircularProgress size={24} color="inherit" /> : t("Process Report", "Process Report")}
            </MuiButton>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
