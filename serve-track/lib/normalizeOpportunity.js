
export default function normalizeOpportunity(record = {}) {
  if (!record) return null;

  const normalized = {
    id: record.id,
    siteId: record.site_id,
    title: record.title,
    description: record.description,
    location: record.location || null,
    startDate: safeDateString(record.start_date),
    endDate: safeDateString(record.end_date),
    estimatedHours: record.estimated_hours ?? null,
    volunteersNeeded: record.volunteers_needed ?? null,
    skillsRequired: record.skills_required || '',
    responsibilities: record.responsibilities || '',
    status: record.status || 'active',
    createdAt: formatDateTime(record.created_at),
    updatedAt: formatDateTime(record.updated_at),
    applicationCount: record.application_count ?? 0,
    pendingApplications: record.pending_applications ?? 0,
  };

  return normalized;
}

/**
 * Parses SQL DATE string (e.g., "2025-11-01") safely as local date
 * without applying UTC shift. Returns same string if valid.
 */
function safeDateString(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value; // already in YYYY-MM-DD format
  }

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    // construct date manually in local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}
