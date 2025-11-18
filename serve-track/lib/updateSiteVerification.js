import db from './database';

/**
 * updateVerification
 * - profileIdentifier: can be profileId (sites_profiles.id) OR userId (sites_profiles.user_id)
 * - opts: { by: 'profile'|'user', action: 'approve'|'reject'|'pending', rejectionReason }
 *
 * Returns the new status string.
 */
export default async function updateSiteVerification({ profileIdentifier, by = 'profile', action, rejectionReason = null }) {
  if (!['approve', 'reject', 'pending'].includes(action)) {
    throw new Error('Invalid action - must be approve, reject or pending');
  }

  const newStatus = action === 'approve' ? 'verified' : (action === 'reject' ? 'rejected' : 'pending');

  // find profile id when by === 'user'
  let profileId = profileIdentifier;

  if (by === 'user') {
    const [rows] = await db.execute(
      'SELECT user_id FROM sites_profiles WHERE user_id = ? LIMIT 1',
      [profileIdentifier]
    );
    if (!rows || rows.length === 0) {
      throw new Error('Profile not found for given user id');
    }
    profileId = rows[0].id;
  }

  // Update verification_status and rejection reason
  const rejectionVal = action === 'reject' ? (rejectionReason || null) : null;

  await db.execute(
    `UPDATE sites_profiles 
     SET verification_status = ?, rejection_reason = ?, updated_at = NOW()
     WHERE user_id = ?`,
    [newStatus, rejectionVal, profileId]
  );

  return newStatus;
}
