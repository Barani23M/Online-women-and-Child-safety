# SafeGuard - Online Women and Child Safety Platform

**Your Safety. Our Priority.**

SafeGuard is a comprehensive full-stack platform designed to protect and support women and children by providing emergency response, counseling services, resource access, and community awareness features.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Safety Features
- **SOS Alert System**: One-tap emergency alerts to send location and distress signals to trusted contacts and authorities
- **Safe Places Locator**: Find nearby safe locations like police stations, hospitals, NGOs, and women's shelters
- **Incident Reporting**: Report and document safety incidents with photos and details
- **Real-time Notifications**: Receive instant updates on emergency responses and support

### Support Services
- **Counseling Sessions**: Connect with professional counselors for immediate support
- **Helpline Access**: Direct access to emergency helplines and support services
- **Resource Library**: Comprehensive information on safety tips, legal resources, and support options
- **Family Safety Network**: Create and manage a network of trusted family members and emergency contacts

### Admin & Management
- **Admin Dashboard**: Comprehensive control panel for managing incidents, users, and services
- **Analytics & Reporting**: Track incidents and service effectiveness

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy with SQL Database
- **Authentication**: JWT-based secure authentication
- **API Documentation**: Swagger/OpenAPI
- **Server**: Uvicorn

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS, PostCSS
- **Build Tool**: Webpack (via CRA)
- **State Management**: Context API
- **HTTP Client**: Axios

### Mobile
- **Framework**: React Native (Expo)
- **Platform**: Cross-platform (iOS & Android)
- **UI Components**: React Native / EAS Build

---

## 📁 Project Structure

```
SafeGuard/
├── backend/                      # FastAPI backend service
│   ├── main.py                  # Main application entry point
│   ├── auth.py                  # Authentication logic
│   ├── database.py              # Database configuration
│   ├── schemas.py               # Database models
│   ├── routers/                 # API route handlers
│   │   ├── auth_router.py
│   │   ├── admin_router.py
│   │   ├── sos_router.py
│   │   ├── incident_router.py
│   │   ├── counseling_session_router.py
│   │   ├── helpline_router.py
│   │   ├── notifications_router.py
│   │   ├── family_router.py
│   │   ├── safe_places_router.py
│   │   └── resources_router.py
│   ├── uploads/                 # User uploaded files
│   └── requirements.txt          # Python dependencies
│
├── frontend/                     # React web application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # Context API setup
│   │   ├── services/            # API service layer
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Utility functions
│   ├── android/                 # Android build files
│   ├── capacitor.config.json    # Capacitor configuration
│   └── package.json
│
└── mobile/                       # React Native Expo app
    ├── src/
    │   ├── screens/             # Mobile screens
    │   ├── components/          # Reusable components
    │   ├── context/             # State management
    │   ├── services/            # API integration
    │   ├── config.js            # Configuration
    │   └── theme.js             # Theme settings
    ├── app.json                 # Expo configuration
    ├── eas.json                 # EAS Build configuration
    └── package.json
```

---

## 🚀 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- Git
- npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/Barani23M/Online-women-and-Child-safety.git
cd Online-women-and-Child-safety/backend
```

2. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
Create a `.env` file in the backend directory:
```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

5. **Initialize database**
```bash
python seed.py
```

6. **Start the server**
```bash
python run_server.py
# or
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

### Mobile Setup

1. **Navigate to mobile directory**
```bash
cd ../mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Expo development server**
```bash
npm start
# Scan QR code with Expo Go app
```

---

## 📖 Usage

### Web Application
1. Open browser to `http://localhost:3000`
2. Register a new account or login
3. Navigate to different sections:
   - **Dashboard**: View your profile and quick actions
   - **SOS**: Send emergency alerts
   - **Safe Places**: Find nearby safe locations
   - **Report Incident**: Document safety incidents
   - **Counseling**: Book a counseling session
   - **Resources**: Access safety information

### Mobile Application
1. Download Expo Go app on your smartphone
2. Scan QR code from `npm start` output
3. Access all SafeGuard features on mobile

### API Endpoints

Key endpoints (all require authentication):

```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - User login
POST   /api/sos/alert            - Send SOS alert
GET    /api/sos/status           - Get SOS status
PUT    /api/user/profile         - Update profile
POST   /api/incidents            - Report incident
GET    /api/incidents            - Get user incidents
POST   /api/counseling/sessions  - Book counseling
GET    /api/counseling/sessions  - Get counseling history
GET    /api/safe-places          - Find safe places
GET    /api/resources            - Access resources
POST   /api/family/contacts      - Add family contact
```

API documentation available at: `http://localhost:8000/docs`

---

## 📊 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
```bash
git clone https://github.com/your-username/Online-women-and-Child-safety.git
cd Online-women-and-Child-safety
```

2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Commit your changes**
```bash
git commit -m "Add your feature description"
```

4. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

5. **Open a Pull Request**
   - Describe your changes clearly
   - Link any related issues

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React
- Write meaningful commit messages
- Add comments for complex logic

---

## 🔒 Security

SafeGuard implements multiple security measures:
- JWT-based authentication
- Password hashing and validation
- HTTPS/TLS encryption
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- Secure database practices

---

## 📱 Supported Platforms

- **Web**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS 12+ and Android 8+

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Contact

For issues, feature requests, or questions:
- **GitHub Issues**: [Create an issue](https://github.com/Barani23M/Online-women-and-Child-safety/issues)
- **Email**: support@safeguard.dev

---

## 🙏 Acknowledgments

- FastAPI community for the excellent web framework
- React community for building tools
- All contributors and supporters

---

## 📈 Roadmap

- [ ] Advanced AI-based threat detection
- [ ] Video consultation for counseling
- [ ] Multi-language support
- [ ] Offline mode functionality
- [ ] Community features and peer support
- [ ] Integration with government agencies

---

**SafeGuard - Empowering Safety, Building Trust**

*Last Updated: March 25, 2026*
