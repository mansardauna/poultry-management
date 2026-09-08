'use strict';
'use client';

import { Plus } from 'lucide-react';
import { FormControl, InputLabel, Select, MenuItem, Button as MuiButton, Box } from '@mui/material';
import Link from 'next/link';

/**
 * Props for the SelectWithAdd component.
 * @property label      - The label displayed above the Select field.
 * @property value      - The currently selected item's ID.
 * @property onChange   - Callback fired when the user selects a different item.
 * @property items      - The list of selectable options with `id` and `label`.
 * @property addPath    - The navigation path for the "Add" button shown when the list is empty.
 * @property disabled   - Whether the select is disabled. Defaults to false.
 * @property children   - Optional custom MenuItem children to render inside the Select.
 */
interface SelectWithAddProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string }[];
  addPath: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * A dropdown select that shows an "Add" navigation button when the items list is empty.
 * When items are available it renders a standard MUI Select with all provided items.
 */
export function SelectWithAdd({
  label,
  value,
  onChange,
  items,
  addPath,
  disabled = false,
  children
}: SelectWithAddProps) {
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
        <FormControl fullWidth variant="outlined" disabled>
          <InputLabel>{label}</InputLabel>
          <Select value="" label={label} className="rounded-sm" />
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
        className="rounded-sm"
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
