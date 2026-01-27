export const getUserDashboardPath = (userType) => {
    const pathMap = {
      student: 'student',
      admin: 'admin',
      nonprofit: 'site'
    };
    return pathMap[userType] || userType;
  };
  
  export const getUserDisplayName = (userType) => {
    const displayMap = {
      student: 'Student',
      admin: 'Administrator',
      nonprofit: 'Site'
    };
    return displayMap[userType] || userType;
  };