import db from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(request, { params }) {
  try {
    const user = getCurrentUser(request);
    
    if (!user || user.userType !== 'student') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const applicationId = await params.id;

    // Fetch application details with all verification status
    const [applications] = await db.execute(
      `SELECT 
        a.*,
        o.title as opportunity_title,
        o.start_date as opportunity_start,
        o.end_date as opportunity_end,
        o.required_hours as opportunity_required_hours,
        sp.organization_name,
        u.first_name as student_first,
        u.last_name as student_last,
        u.email as student_email,
        uni.name as university_name,
        uni.code as university_code,
        uni.required_hours as university_required_hours,
        stp.student_id,
        stp.major,
        (SELECT SUM(hours) FROM hour_logs WHERE student_id = a.student_id AND opportunity_id = a.opportunity_id AND status = 'verified') as total_verified_hours
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN sites_profiles sp ON o.site_id = sp.user_id
      JOIN users u ON a.student_id = u.id
      JOIN student_profiles stp ON u.id = stp.user_id
      JOIN universities uni ON stp.university_id = uni.id
      WHERE a.id = ? AND a.student_id = ?`,
      [applicationId, user.id]
    );

    if (applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404 }
      );
    }

    const application = applications[0];

    // Check if certificate can be issued
    if (!application.site_manager_verified) {
      return new Response(
        JSON.stringify({ 
          error: 'Certificate not available. Site manager has not verified your hours.',
          requirements: {
            siteManagerVerified: false,
            universityAdminVerified: application.university_admin_verified,
            hoursMet: application.hours_completed >= application.university_required_hours
          }
        }),
        { status: 400 }
      );
    }

    if (!application.university_admin_verified) {
      return new Response(
        JSON.stringify({ 
          error: 'Certificate not available. University admin has not verified your hours.',
          requirements: {
            siteManagerVerified: true,
            universityAdminVerified: false,
            hoursMet: application.hours_completed >= application.university_required_hours
          }
        }),
        { status: 400 }
      );
    }

    if (application.hours_completed < application.university_required_hours) {
      return new Response(
        JSON.stringify({ 
          error: 'Certificate not available. You have not completed the required hours.',
          requirements: {
            siteManagerVerified: true,
            universityAdminVerified: true,
            hoursMet: false,
            completed: application.hours_completed,
            required: application.university_required_hours,
            difference: application.university_required_hours - application.hours_completed
          }
        }),
        { status: 400 }
      );
    }

    // Generate PDF certificate
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Create a buffer to store the PDF
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(
          new Response(pdfData, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="volunteer_certificate_${applicationId}.pdf"`,
            },
          })
        );
      });

      // Certificate design
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');
      
      // Header with decorative border
      doc.strokeColor('#3b82f6').lineWidth(2);
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();
      
      // Title
      doc.fillColor('#1e40af').fontSize(36).font('Helvetica-Bold')
         .text('VOLUNTEER SERVICE CERTIFICATE', { align: 'center' });
      
      doc.moveDown();
      doc.fillColor('#374151').fontSize(18).font('Helvetica')
         .text('This is to certify that', { align: 'center' });
      
      // Student name
      doc.moveDown();
      doc.fillColor('#1e3a8a').fontSize(32).font('Helvetica-Bold')
         .text(`${application.student_first} ${application.student_last}`, { align: 'center' });
      
      doc.moveDown();
      doc.fillColor('#374151').fontSize(18).font('Helvetica')
         .text(`Student ID: ${application.student_id || 'N/A'}`, { align: 'center' });
      
      // University
      doc.moveDown();
      doc.fillColor('#4b5563').fontSize(16).font('Helvetica')
         .text(`from ${application.university_name} (${application.university_code})`, { align: 'center' });
      
      if (application.major) {
        doc.moveDown();
        doc.text(`Major: ${application.major}`, { align: 'center' });
      }
      
      // Details
      doc.moveDown(2);
      doc.fillColor('#4b5563').fontSize(16).font('Helvetica')
         .text('has successfully completed', { align: 'center' });
      
      // Volunteer details
      doc.moveDown();
      doc.fillColor('#1e3a8a').fontSize(24).font('Helvetica-Bold')
         .text(application.opportunity_title, { align: 'center' });
      
      doc.moveDown();
      doc.fillColor('#4b5563').fontSize(16).font('Helvetica')
         .text(`at ${application.organization_name}`, { align: 'center' });
      
      // Duration and hours
      doc.moveDown(2);
      doc.fillColor('#374151').fontSize(14).font('Helvetica')
         .text(`Duration: ${new Date(application.opportunity_start).toLocaleDateString()} to ${new Date(application.opportunity_end).toLocaleDateString()}`, { align: 'center' });
      
      doc.moveDown();
      doc.fillColor('#374151').fontSize(14).font('Helvetica')
         .text(`Total Hours Completed: ${application.hours_completed} out of ${application.university_required_hours} required`, { align: 'center' });
      
      // Verification section
      doc.moveDown(3);
      doc.strokeColor('#6b7280').lineWidth(0.5);
      
      // Site manager verification
      doc.fillColor('#4b5563').fontSize(12).font('Helvetica')
         .text('Verified by Site Manager:', 100, doc.y);
      doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold')
         .text(`${application.organization_name}`, 100, doc.y + 20);
      
      // University verification
      doc.fillColor('#4b5563').fontSize(12).font('Helvetica')
         .text('Verified by University:', 400, doc.y - 20);
      doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold')
         .text(`${application.university_name}`, 400, doc.y);
      
      // Date of issue
      doc.moveDown(4);
      doc.fillColor('#6b7280').fontSize(12).font('Helvetica')
         .text(`Issued on: ${new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`, { align: 'center' });
      
      // Certificate ID
      doc.moveDown();
      doc.fillColor('#9ca3af').fontSize(10).font('Helvetica')
         .text(`Certificate ID: CERT-${applicationId}-${Date.now()}`, { align: 'center' });
      
      doc.end();
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate certificate' }),
      { status: 500 }
    );
  }
}