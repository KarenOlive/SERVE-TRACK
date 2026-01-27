# ServeTrack  
**A Verified Volunteer Management System for University Community Service**

ServeTrack is a centralized digital platform designed to streamline the management, tracking, and verification of university community service hours. It replaces inefficient paper-based workflows with a secure, transparent, and auditable digital system for students, nonprofit organizations, and university administrators.


---

##  Live Application (Production)

 **Production URL:**  
 
---

##  Project Overview

Many universities require students to complete mandatory community service hours as a graduation requirement. However, current systems rely heavily on manual processes such as physical logbooks, signatures, and paper submissions, leading to inefficiencies, data loss, and verification challenges.

**ServeTrack** addresses these issues by providing:
- Digital logging and verification of service hours
- Role-based access for different stakeholders
- Centralized records with audit trails
- Real-time progress tracking and reporting

The platform is specifically designed for the **Kenyan university context**, while remaining scalable for broader adoption across East Africa.

---

## 👥 Target Users

ServeTrack supports three main user roles:

###  Students
- Discover approved community service opportunities
- Apply for volunteer positions
- Log completed service hours digitally
- Track verification status and total approved hours
- Monitor progress toward graduation requirements

###  Nonprofit Organizations
- Create and manage volunteer opportunities
- Approve or reject student service hour submissions
- Maintain digital attendance and activity records
- Generate participation and impact reports

###  University Administrators
- Monitor student compliance with community service requirements
- Access verified and tamper-proof service records
- Generate institutional reports and analytics
- Reduce administrative overhead and paperwork

---

##  Key Features

- Multi-role authentication and authorization
- Digital service hour logging and approval workflow
- Tamper-proof verification with audit trails
- Volunteer opportunity management
- Real-time reporting and analytics
- Mobile-responsive and accessible UI
- Secure data storage and encrypted communication

---

## 🛠️ Technology Stack

### Frontend
- **React.js** – Responsive and accessible user interfaces

### Backend
- **Next.js** – RESTful API services
- **Node.js** 

### Database
- **MySQL** – Relational data storage with integrity constraints

### Authentication & Security
- **NextAuth.js**
- **JWT (JSON Web Tokens)**
- Role-based access control

### Infrastructure (Planned)
- **Vercel** – Frontend hosting
- **DigitalOcean / Railway** – Backend & database hosting

---

## 🚀 Getting Started (Local Development)

### Prerequisites
Ensure you have the following installed:
- Git
- Node.js (v18+ recommended)
- MySQL
- npm or yarn

---

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/KarenOlive/SERVE-TRACK.git
cd SERVE-TRACK
```
2. **Install dependencies**
```bash
npm install
```
3. **Configure environment variables**

4. **Run database migrations**
```bash
npm run migrate
```
---

## Usage Guide
**Student Workflow**
Register or log in as a Student
Browse available volunteer opportunities
Apply for a suitable opportunity
Log service hours after participation
Track approval status and accumulated hours

**Organization Workflow**
- Register as a Nonprofit Organization
- Create volunteer opportunities
- Review student applications
- Verify or reject submitted service hours
- View participation reports

**Administrator Workflow**
- Log in as University Administrator
- Monitor student service completion
- Review verified records
- Generate institutional reports

---
The system is modular and designed for scalability, maintainability, and future feature expansion.