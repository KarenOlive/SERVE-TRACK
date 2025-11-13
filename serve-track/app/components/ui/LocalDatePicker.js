'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A reusable date picker for use with React Hook Form.
 */
export default function LocalDatePicker({ label, value, onChange, error }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {value ? (
              <span>{format(new Date(value), 'PPP')}</span>
            ) : (
              <span className="text-gray-400">Select date</span>
            )}
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
