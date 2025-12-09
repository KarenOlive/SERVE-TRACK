'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LocalDatePicker from '../ui/LocalDatePicker';

//  Validation schema using Zod
const OpportunitySchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    volunteersNeeded: z
      .string()
      .min(1)
      .transform((v) => Number(v))
      .refine((v) => v > 0, { message: 'Must be at least 1' }),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export default function OpportunityForm({ onSubmit, onCancel, initialData = {}, loading = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(OpportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      volunteersNeeded: 1,
    },
  });

  // 🔄 When editing, populate form
  useEffect(() => {
    if (initialData) {
      const safeDate = (d) => {
        if (!d) return '';
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        startDate: safeDate(initialData.startDate || initialData.start_date),
        endDate: safeDate(initialData.endDate || initialData.end_date),
        volunteersNeeded: initialData.volunteersNeeded || initialData.volunteers_needed || 1,
      });
    }
  }, [initialData, reset]);

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opportunity Title *
        </label>
        <input
          type="text"
          {...register('title')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Community Garden Volunteer"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          rows={4}
          {...register('description')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Describe the volunteer opportunity, tasks, and impact..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalDatePicker
          label="Start Date"
          value={startDate}
          onChange={(val) => setValue('startDate', val)}
          error={errors.startDate?.message}
        />
        <LocalDatePicker
          label="End Date"
          value={endDate}
          onChange={(val) => setValue('endDate', val)}
          error={errors.endDate?.message}
        />
      </div>

      {/* Hours and Volunteers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volunteers Needed
          </label>
          <input
            type="number"
            min="1"
            {...register('volunteersNeeded')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.volunteersNeeded && (
            <p className="text-sm text-red-600 mt-1">{errors.volunteersNeeded.message}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : initialData.id ? 'Update Opportunity' : 'Create Opportunity'}
        </button>
      </div>
    </form>
  );
}
