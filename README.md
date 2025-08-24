# GrooveWash - Ultrasonic Vinyl Record Cleaning & Digitization

A modern, interactive web application for GrooveWash, a premium ultrasonic vinyl record cleaning and digitization service based in Minnesota. This React application showcases professional vinyl restoration services with an immersive 3D experience.

## 🌟 Project Overview

GrooveWash is dedicated to preserving and restoring vinyl record collections through professional ultrasonic cleaning and high-quality digitization services. Our web application provides:

- **Interactive 3D Experience**: Built with Three.js and React Three Fiber for immersive record cleaning demonstrations
- **Professional Service Showcase**: Detailed information about ultrasonic cleaning and digitization services
- **Contact & Consultation**: Streamlined contact forms for service inquiries
- **Educational Content**: Comprehensive FAQs and guides about vinyl record care
- **SEO Optimized**: Built with React Helmet for optimal search engine visibility

## 🚀 Technology Stack

### Frontend Framework
- **React 19.0.0** - Modern React with latest features and improvements
- **React Router DOM 7.3.0** - Client-side routing for single-page application

### 3D Graphics & Animation
- **Three.js 0.174.0** - 3D graphics library for WebGL rendering
- **@react-three/fiber 9.1.0** - React renderer for Three.js
- **@react-three/drei 10.0.4** - Useful helpers for React Three Fiber
- **@react-spring/web 9.7.5** - Physics-based animations
- **@react-spring/three 9.7.5** - 3D-specific animations

### UI & Styling
- **Material-UI (MUI)** - React components implementing Google's Material Design
- **Emotion** - CSS-in-JS library for styled components
- **HTML2Canvas** - Screenshots and canvas manipulation

### Audio Processing
- **Web Audio API** - Audio visualization and beat detection
- **web-audio-beat-detector** - Real-time audio analysis
- **react-audio-visualize** - Audio waveform visualization

### Development & Build Tools
- **Create React App** - Zero-configuration React application setup
- **React Scripts 5.0.1** - Build scripts and development server
- **Babel** - JavaScript transpilation
- **ESLint** - Code linting and formatting

### Additional Libraries
- **React Helmet Async 2.0.5** - Document head management for SEO
- **React Signature Canvas 1.1.0** - Digital signature capture
- **React Social Icons 6.24.0** - Social media icon components
- **Screenfull 6.0.2** - Fullscreen API cross-browser support
- **Simplex Noise 4.0.3** - Noise generation for procedural effects
- **Leva 0.10.0** - GUI controls for development and debugging

## 🏗️ Architecture

### Component Structure
```
src/
├── components/          # React components
│   ├── AudioPlayer.js   # Main audio player with 3D visualization
│   ├── MainExperience.js # Primary 3D scene and routing
│   ├── ContactUsForm.js # Contact form with API integration
│   ├── WaiverForm.js    # Digital waiver signature capture
│   └── ...              # Additional page components
├── audio/              # Audio samples for demonstration
├── shaders/            # GLSL shaders for 3D effects
├── utils/              # Utility functions
└── secrets.js          # Configuration and sensitive data
```

### Key Features

#### 3D Record Visualization
- Real-time audio-reactive 3D vinyl record animations
- Ultrasonic cleaning process simulation
- Interactive particle systems and lighting effects
- WebGL-optimized performance

#### Audio Processing
- Real-time beat detection and visualization
- Audio waveform analysis
- Cross-browser audio compatibility
- Background audio playback with user controls

#### Business Integration
- Contact form with backend API integration
- Digital waiver system with signature capture
- Service information and pricing
- SEO-optimized content pages

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd groove-polish
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure secrets**
   ```bash
   cp src/secrets.js src/secrets.local.js
   # Edit src/secrets.local.js with your actual values
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This will create a production-ready build in the `build/` directory.

## 📝 Configuration

### Secrets Configuration

The application uses a `secrets.js` file to manage sensitive information:

```javascript
const secrets = {
  phoneNumber: "your-phone-number",
  businessName: "your-business-name",
  domain: "your-domain.com",
  baseUrl: "https://your-domain.com",
  contactApiEndpoint: "https://your-domain.com/api/contact",
  waiverApiEndpoint: "https://your-domain.com/api/waiver",
  // ... additional configuration
};

export default secrets;
```

### Environment Variables

Create environment-specific files as needed:
- `.env.local` - Local development
- `.env.production` - Production build
- `.env.test` - Testing environment

## 🚀 Deployment

### Build Commands

```bash
# Generate sitemap
npm run generate-sitemap

# Build for production
npm run build

# Preview production build
npm install -g serve
serve -s build
```

### Deployment Checklist

- [ ] Update `secrets.js` with production values
- [ ] Test all forms and API endpoints
- [ ] Verify 3D graphics performance
- [ ] Check SEO meta tags
- [ ] Test on multiple devices/browsers
- [ ] Validate sitemap generation

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (irreversible)

### Code Style

The project uses ESLint for code linting. To check code style:

```bash
npm run lint
```

### 3D Development

The 3D scenes are built using React Three Fiber. Key development files:

- `MainExperience.js` - Main 3D scene
- `AudioPlayer.js` - Audio visualization
- `shaders/` - Custom GLSL shaders

## 📊 Performance

### Optimization Features

- **Lazy Loading**: Components load on demand
- **WebGL Optimization**: Efficient 3D rendering
- **Audio Processing**: Optimized for real-time performance
- **Image Optimization**: Compressed assets for web delivery
- **Bundle Splitting**: Code splitting for better loading times

### Performance Monitoring

- React DevTools for component performance
- Three.js stats panel for 3D performance
- Lighthouse for overall performance metrics

## 📄 License

This project is private and proprietary to GrooveWash.

## 🆘 Support

For technical support or questions about the codebase:

1. Check existing issues on GitHub
2. Review documentation in this README
3. Contact the development team

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks

- Update dependencies regularly
- Test across different browsers
- Monitor 3D performance
- Update content and SEO tags
- Backup secrets configuration

### Version Control

This project uses Git for version control. The `.gitignore` file excludes:

- `node_modules/`
- `src/secrets.js` (use `src/secrets.local.js` for development)
- Audio files in `src/audio/`
- Build artifacts
- Environment files

## 📞 Business Contact

For business inquiries about GrooveWash services:

- **Phone**: (612) 418-9329
- **Website**: https://groovewash.com
- **Location**: Minneapolis, MN

---

**Built with ❤️ for vinyl enthusiasts and professional record cleaning services.**
