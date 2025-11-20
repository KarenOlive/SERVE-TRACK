export const profileSchemas = {
    nonprofit: {
    table: 'sites_profiles',
    fields: [
    { name: 'first_name', label: 'First Name', type: 'text' },
    { name: 'last_name', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'organization_name', label: 'Organization Name', type: 'text', required: true },
    { name: 'organization_description', label: 'Description', type: 'textarea' },
    { name: 'contact_phone', label: 'Contact Phone', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'location', label: 'Location', type: 'text', required: true },
    { name: 'website', label: 'Website', type: 'url' }
    ]
    },
    
    student: {
    table: 'student_profiles',
    fields: [
    { name: 'first_name', label: 'First Name', type: 'text' },
    { name: 'last_name', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'student_id', label: 'Student ID', type: 'text', required: true },
    { name: 'university_id', label: 'University', type: 'select', required: true },
    { name: 'major', label: 'Major', type: 'text' },
    { name: 'total_verified_hours', label: 'Total Verified Hours', type: 'number', readonly: true }
    ]
    },
    
    university_admin: {
    table: 'university_admins',
    fields: [
    { name: 'first_name', label: 'First Name', type: 'text' },
    { name: 'last_name', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'university_id', label: 'University', type: 'select', required: true },
    { name: 'can_manage_nonprofits', label: 'Manage Nonprofits', type: 'checkbox' },
    { name: 'can_manage_students', label: 'Manage Students', type: 'checkbox' },
    { name: 'can_manage_admins', label: 'Manage Admins', type: 'checkbox' }
    ]
    },
    
    admin: {
    table: 'users',
    fields: [
    { name: 'first_name', label: 'First Name', type: 'text' },
    { name: 'last_name', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email', required: true }
    ]
    }
    };
    