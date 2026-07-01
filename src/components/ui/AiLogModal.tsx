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

/**
 * Props for the AiLogModal component.
 * @property onSuccess - Optional callback invoked after the report is successfully processed.
 */
interface AiLogModalProps {
  onSuccess?: () => void;
}

/**
 * Modal dialog that accepts a free-text daily farm report and uses
 * a pattern-matching parser to extract key metrics (eggs, feed, mortality,
 * sales, expenses) and writes them directly to the database.
 */
export function AiLogModal({ onSuccess }: AiLogModalProps) {
  const [open, setOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<unknown>(null);

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
        setExtractedData(result.extracted);
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
        toast.error('Failed to parse report. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      toast.error('Error contacting the parser service.');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-white border-2 border-indigo-600 text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Sparkles size={18} /> AI Auto-Log
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
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>
          {success ? "Report Processed" : "AI Log Parser"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          {success ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Sparkles size={48} color="#4f46e5" className="mx-auto mb-4 block" />
              <Typography variant="h6" sx={{ fontFamily: "var(--font-cal-sans)", color: "#1e293b" }}>
                Database Updated Successfully!
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "var(--font-dm-sans)", mt: 1 }}>
                The AI has extracted the following metrics:
              </Typography>
              {!!extractedData && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "left", maxHeight: "300px", overflowY: "auto" }} className="font-mono text-xs text-slate-700 space-y-2">
                  {/* Staff Updates */}
                  {(extractedData as any).staffChanges?.removeAll && <div className="text-red-600">🧹 Removed all previous staff records.</div>}
                  {(extractedData as any).staffChanges?.add?.map((s: any, i: number) => (
                    <div key={'s'+i}>👥 Added Staff: {s.name} ({s.role}) - ₦{s.salary.toLocaleString()}</div>
                  ))}
                  
                  {/* Eggs */}
                  {(extractedData as any).eggs?.map((e: any, i: number) => (
                    <div key={'e'+i}>🥚 Collected {e.goodEggs} eggs on {e.date} {e.notes ? `(${e.notes})` : ''}</div>
                  ))}

                  {/* Expenses */}
                  {(extractedData as any).expenses?.map((ex: any, i: number) => (
                    <div key={'ex'+i}>💸 Logged Expense: ₦{ex.amount.toLocaleString()} for {ex.description} ({ex.category}) on {ex.date}</div>
                  ))}

                  {/* Medications */}
                  {(extractedData as any).medications?.map((m: any, i: number) => (
                    <div key={'m'+i}>💊 Scheduled: {m.name} on {m.date}</div>
                  ))}

                  {/* Basic Metrics */}
                  {(extractedData as any).feedUsedKg > 0 && <div>🌾 Feed Used: {(extractedData as any).feedUsedKg} kg</div>}
                  {(extractedData as any).mortalityCount > 0 && <div>💀 Mortality: {(extractedData as any).mortalityCount} birds</div>}
                  {(extractedData as any).salesAmount > 0 && <div>💰 Sales Recorded: ₦{(extractedData as any).salesAmount.toLocaleString()}</div>}
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "var(--font-dm-sans)", mb: 3, mt: 1 }}>
                Paste your daily report below. The AI will automatically extract egg collections, feed usage, and mortality figures to update your records.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                id="report"
                label="Daily Farm Report"
                type="text"
                fullWidth
                multiline
                rows={6}
                placeholder="Example: Today we collected 4500 good eggs, but 12 were cracked. Unfortunately, 3 birds died. We also spent 250000 on drugs and sold eggs for 600000."
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
              Cancel
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
              {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Process Report'}
            </MuiButton>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
