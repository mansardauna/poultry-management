'use client';

import { Plus } from 'lucide-react';
import { FormControl, InputLabel, Select, MenuItem, Button as MuiButton, Box } from '@mui/material';
import Link from 'next/link';

interface SelectWithAddProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string }[];
  addPath: string; // e.g., '/batches', '/feed', '/contacts'
  disabled?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode; // Allow custom MenuItem children
}

/**
 * Select component with an "Add" button that appears when the list is empty.
 * Clicking the button navigates to the management page for that resource.
 */
export function SelectWithAdd({
  label,
  value,
  onChange,
  items,
  addPath,
  disabled = false,
  style,
  children
}: SelectWithAddProps) {
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
        <FormControl fullWidth variant="outlined" disabled>
          <InputLabel>{label}</InputLabel>
          <Select
            value=""
            label={label}
            style={{ ...style, borderRadius: 2 }}
          />
        </FormControl>
        <Link href={addPath}>
          <MuiButton
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              borderRadius: 1,
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
            startIcon={<Plus size={16} />}
          >
            Add
          </MuiButton>
        </Link>
      </Box>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        style={{ ...style, borderRadius: 2 }}
      >
        {children}
        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
