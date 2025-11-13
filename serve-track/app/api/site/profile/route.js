import db from '../../../../lib/database';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request) {
    try {
        const user = getCurrentUser(request);
        if (!user || user.userType !== 'nonprofit') {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
    
        //Join with users table
        const [rows] = await db.execute(
          `SELECT 
             sp.user_id,
             sp.organization_name,
             sp.organization_description,
             sp.location,
             sp.website,
             sp.contact_phone,
             sp.address,
             u.profile_complete,
             sp.verification_status
           FROM sites_profiles sp
           JOIN users u ON sp.user_id = u.id
           WHERE sp.user_id = ?`,
          [user.id]
        );
    
        if (rows.length === 0) {
          return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
        }
    
        return new Response(
          JSON.stringify({ profile: rows[0] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching profile:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}

//PUT
export async function PUT(request) {
    try {
      const user = getCurrentUser(request);
      if (!user || user.userType !== 'nonprofit') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
  
      const body = await request.json();
      const { organization_name, organization_description, location, website, contact_phone, address } = body;
  
      if (!organization_name || !organization_description || !location || !website || !contact_phone || !address) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }
  
      await db.execute(
        `UPDATE sites_profiles 
         SET organization_name = ?, organization_description = ?, location = ?, website = ?, contact_phone = ?, address = ?, updated_at = NOW() 
         WHERE user_id = ?`,
        [organization_name, organization_description, location, website, contact_phone, address, user.id]
      );
  
      const [updated] = await db.execute(
        `SELECT user_id, organization_name,  organization_description, location, website, contact_phone, address 
         FROM sites_profiles WHERE user_id = ?`,
        [user.id]
      );

      // After updating profile fields:
        if (organization_name && contact_phone && organization_description && location && website && address) {
            await db.execute(
            `UPDATE users SET profile_complete = 1 WHERE id = ?`,
            [user.id]
            );
        }
  
      return new Response(
        JSON.stringify({ profile: updated[0], message: 'Profile updated successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  }
  

