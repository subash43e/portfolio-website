# Portfolio Website

This is a modern, responsive portfolio website built with React, Vite, and Tailwind CSS, featuring Firebase authentication, database integration, and a comprehensive admin dashboard for content management.

## 📚 Documentation

For detailed documentation, see the [`docs/`](docs/) directory:

- **[Project Overview](./docs/PROJECT_DOCS.md)** - Complete project architecture and structure
- **[Firebase Setup](./docs/FIREBASE_SETUP.md)** - Detailed Firebase configuration guide
- **[API Documentation](./docs/API_DOCS.md)** - Firebase services integration and data models
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Hosting and deployment instructions

## Features

- **Responsive Design**: Modern UI with Tailwind CSS and Framer Motion animations
- **Admin Dashboard**: Protected admin area with Firebase authentication
- **Blog System**: Blog post management (framework ready)
- **Project Portfolio**: Showcase projects with Firebase storage
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **SEO Ready**: Optimized for search engines and social sharing

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project (see [Firebase Setup](./docs/FIREBASE_SETUP.md))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd portfolio-website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase** (see [Firebase Setup Guide](./docs/FIREBASE_SETUP.md)):
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Update `.env` with your Firebase configuration

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
portfolio-website/
├── docs/                    # 📚 Detailed documentation
├── src/
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/             # Custom hooks
│   └── firebase.js        # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── .env                   # Environment variables (create from template)
```

## Routes

### Public Routes
- `/` - Home page with portfolio sections
- `/blog` - Blog listing page
- `/#about` - About section (smooth scroll)
- `/#skills` - Skills section (smooth scroll)
- `/#projects` - Projects section (smooth scroll)
- `/#contact` - Contact section (smooth scroll)

### Admin Routes
- `/admin/login` - Admin login page
- `/admin` - Protected admin dashboard (requires authentication)

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Routing**: React Router DOM v7
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Build**: Vite with optimized production builds
- **Deployment**: Ready for Vercel, Netlify, Firebase Hosting, etc.

## Contributing

1. Follow the project structure and coding standards
2. Update documentation for any new features
3. Test authentication and database operations
4. Ensure responsive design works across devices

## License

This project is open source and available under the [MIT License](LICENSE).

---

For detailed setup instructions, API documentation, and deployment guides, see the [`docs/`](docs/) directory.
