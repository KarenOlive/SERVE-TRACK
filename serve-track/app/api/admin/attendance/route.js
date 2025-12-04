// ===== File: app/api/admin/attendance/route.js =====
import db from '../../../../lib/database';
import { getCurrentUser, userHasRole, getUniversityAdminDetails } from '../../../../lib/auth';
import { stringify } from 'csv-stringify/sync'; // optional; if not installed we will build csv manually

// Helper to safely uppercase param for SQL ordering
const VALID_SORT_FIELDS = {
  date_of_site_visit: 'sar.date_of_site_visit',
  student_name: 'u.first_name',
  university_name: 'un.name',
  site: 'sp.organization_name',
  created_at: 'sar.created_at'
};

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const isSystemAdmin = await userHasRole(user.id, 'admin');
    const isUniversityAdmin = await userHasRole(user.id, 'university_admin');

    if (!isSystemAdmin && !isUniversityAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status'); // present|absent
    const university = searchParams.get('university'); // university id or 'all'
    const site = searchParams.get('site'); // site_profile_id or 'all'
    const search = searchParams.get('search'); // free text
    const sortByParam = searchParams.get('sortBy') || 'date_of_site_visit';
    const sortOrderParam = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
    const exportCsv = searchParams.get('export') === 'csv';
    const groupBySite = searchParams.get('groupBySite') === '1';
    const forForm = searchParams.get('form') === '1';

    // If frontend needs data to populate modal (recent applications/students)
    if (forForm) {
      // For a site admin (nonprofit), we need site id(s) - here we assume current user is nonprofit (site owner)
      // For this admin attendance API, callers are admin side (site admins or system admins)
      // We'll return recent applications for opportunities under the CURRENT site(s).
      // Here we assume getCurrentUser returns user.userType and if nonprofit, user.id is site owner id
      // If system admin, return recent applications across all sites.
      const params = [];
      let sql = `
        SELECT a.id as application_id, a.opportunity_id, o.title as opportunity_title,
               u.id as student_user_id, u.first_name, u.last_name, sp.university_id
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE 1=1
      `;

      if (!isSystemAdmin) {
        // if the user is a university_admin we can restrict by university? For form use-case, university_admin likely records attendance at a site. We still return applications for that university.
        const uniDetails = await getUniversityAdminDetails(user.id);
        if (uniDetails) {
          sql += ' AND sp.university_id = ?';
          params.push(uniDetails.university_id);
        }
      }

      sql += ' ORDER BY a.applied_at DESC LIMIT 200';

      const [rows] = await db.execute(sql, params);
      return new Response(JSON.stringify({ applications: rows }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Build main query
    const whereClauses = ['1=1'];
    const params = [];

    // If university_admin, restrict students to that university
    if (isUniversityAdmin) {
      const uniDetails = await getUniversityAdminDetails(user.id);
      if (!uniDetails) {
        return new Response(JSON.stringify({ applications: [], attendance: [], universities: [] }), { status: 200 });
      }
      whereClauses.push('sp.university_id = ?');
      params.push(uniDetails.university_id);
    } else {
      // If front-end passed a university filter, apply it (expects university id)
      if (university && university !== 'all') {
        whereClauses.push('un.id = ?');
        params.push(university);
      }
    }

    if (status) {
      whereClauses.push('sar.status = ?');
      params.push(status);
    }

    if (site && site !== 'all') {
      whereClauses.push('sar.site_profile_id = ?');
      params.push(site);
    }

    if (search) {
      whereClauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR o.title LIKE ? OR sp.student_id LIKE ? )');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    // base query
    let selectCols = `
      sar.id,
      sar.student_user_id,
      u.first_name,
      u.last_name,
      u.email,
      sp.student_id,
      sar.university_id,
      un.name AS university_name,
      sar.date_of_site_visit,
      sar.site_profile_id,
      sp2.organization_name AS site_organization,
      sar.application_id,
      o.title AS opportunity_title,
      sar.status,
      sar.notes,
      sar.created_by,
      sar.created_at,
      sar.updated_at
    `;

    let baseSql = `
      FROM student_attendance_records sar
      JOIN users u ON sar.student_user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN universities un ON sar.university_id = un.id
      LEFT JOIN sites_profiles sp2 ON sar.site_profile_id = sp2.user_id
      LEFT JOIN applications a ON sar.application_id = a.id
      LEFT JOIN opportunities o ON a.opportunity_id = o.id
      WHERE ${whereClauses.join(' AND ')}
    `;

    // get total count
    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const [countRows] = await db.execute(countSql, params);
    const total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
    const totalPages = Math.ceil(total / limit);

    // Validate sort field
    const sortCol = VALID_SORT_FIELDS[sortByParam] || 'sar.date_of_site_visit';
    const order = sortOrderParam === 'ASC' ? 'ASC' : 'DESC';

    let rowsSql = `SELECT ${selectCols} ${baseSql} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`;
    const rowsParams = params.concat([limit, offset]);

    const [attendanceRows] = await db.execute(rowsSql, rowsParams);

    // Get unique sites for filter drop-down (site_profile_id & organization_name)
    const [sites] = await db.execute(
      `SELECT DISTINCT sp2.user_id AS site_profile_id, sp2.organization_name
       FROM student_attendance_records sar
       LEFT JOIN sites_profiles sp2 ON sar.site_profile_id = sp2.user_id
       LEFT JOIN universities un ON sar.university_id = un.id
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY sp2.organization_name`,
      params
    );

    // Prepare counts by status (not filtered by status param, return overall for tabs)
    const [statusCounts] = await db.execute(
      `SELECT sar.status, COUNT(*) AS cnt
       FROM student_attendance_records sar
       LEFT JOIN sites_profiles sp2 ON sar.site_profile_id = sp2.user_id
       WHERE 1=1
       GROUP BY sar.status`
    );

    const counts = (statusCounts || []).reduce((acc, r) => {
      acc[r.status] = r.cnt;
      return acc;
    }, {});

    // If export CSV requested, stream a CSV response
    if (exportCsv) {
      // Build CSV rows from attendanceRows
      // Use csv-stringify if available; else manual
      const headers = [
        'id','student_user_id','student_first_name','student_last_name','student_email','student_id',
        'university_id','university_name','date_of_site_visit','site_profile_id','site_organization',
        'application_id','opportunity_title','status','notes','created_by','created_at','updated_at'
      ];

      // Attempt to use csv-stringify/sync; if not available fallback
      let csv;
      try {
        csv = stringify(attendanceRows.map(r => [
          r.id, r.student_user_id, r.first_name, r.last_name, r.email, r.student_id,
          r.university_id, r.university_name, (r.date_of_site_visit ? r.date_of_site_visit.toISOString().slice(0,10) : ''),
          r.site_profile_id, r.site_organization, r.application_id, r.opportunity_title, r.status, r.notes,
          r.created_by, r.created_at ? r.created_at.toISOString() : '', r.updated_at ? r.updated_at.toISOString() : ''
        ]), { header: true, columns: headers });
      } catch (e) {
        // manual build
        const esc = (v) => {
          if (v == null) return '';
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        };
        csv = headers.map(esc).join(',') + '\n' +
          attendanceRows.map(r => [
            r.id, r.student_user_id, r.first_name, r.last_name, r.email, r.student_id,
            r.university_id, r.university_name, (r.date_of_site_visit ? r.date_of_site_visit.toISOString().slice(0,10) : ''),
            r.site_profile_id, r.site_organization, r.application_id, r.opportunity_title, r.status, r.notes,
            r.created_by, r.created_at ? r.created_at.toISOString() : '', r.updated_at ? r.updated_at.toISOString() : ''
          ].map(esc).join(',')).join('\n');
      }

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance_export_${new Date().toISOString().slice(0,10)}.csv"`
        }
      });
    }

    // Group by site if requested (frontend grouping)
    const grouped = groupBySite ? attendanceRows.reduce((acc, r) => {
      const key = r.site_profile_id || 'ungrouped';
      (acc[key] = acc[key] || { site_profile_id: r.site_profile_id, site_organization: r.site_organization, rows: [] }).rows.push(r);
      return acc;
    }, {}) : null;

    return new Response(JSON.stringify({
      attendance: attendanceRows,
      pagination: { page, limit, total, totalPages },
      sites: sites,
      counts,
      grouped: groupBySite ? grouped : null
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Attendance GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const isSystemAdmin = await userHasRole(user.id, 'admin');
    const isUniversityAdmin = await userHasRole(user.id, 'university_admin');

    if (!isSystemAdmin && !isUniversityAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const {
      student_user_id,
      university_id,
      date_of_site_visit,
      site_profile_id,
      application_id,
      status,
      notes
    } = body;

    if (!student_user_id || !university_id || !site_profile_id || !application_id || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // university_admin must only add for their own university
    if (isUniversityAdmin) {
      const uniDetails = await getUniversityAdminDetails(user.id);
      if (!uniDetails || uniDetails.university_id !== university_id) {
        return new Response(JSON.stringify({ error: 'Cannot create attendance for other universities' }), { status: 403 });
      }
    }

    const [result] = await db.execute(
      `INSERT INTO student_attendance_records
         (id, student_user_id, user_id, university_id, date_of_site_visit, site_profile_id, application_id, status, notes, created_by, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [student_user_id, user.id || null, university_id, date_of_site_visit || new Date().toISOString().slice(0,10), site_profile_id, application_id, status, notes || null, user.id || null]
    );

    // fetch created row
    const [rows] = await db.execute(`SELECT * FROM student_attendance_records WHERE id = ? LIMIT 1`, [result.insertId || null]);
    // Note: if insertId isn't char(36) PK retrieval by insertId won't work; instead fetch last row by unique combination — safer: re-query by student + application + date (recent).
    // We'll fetch the most recent matching created_by, student and application
    const [newRows] = await db.execute(
      `SELECT sar.*, u.first_name, u.last_name, sp.student_id, un.name AS university_name, sp2.organization_name AS site_organization
       FROM student_attendance_records sar
       JOIN users u ON sar.student_user_id = u.id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN universities un ON sar.university_id = un.id
       LEFT JOIN sites_profiles sp2 ON sar.site_profile_id = sp2.user_id
       WHERE sar.student_user_id = ? AND sar.application_id = ? AND sar.created_by = ? 
       ORDER BY sar.created_at DESC LIMIT 1`,
      [student_user_id, application_id, user.id]
    );

    return new Response(JSON.stringify({ attendance: newRows[0] || null, message: 'Attendance created' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
