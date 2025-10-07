**⚠️ IMPORTANT: Always use the latest development branch for the most up-to-date features and bug fixes!**

# WallyMobile 💰

A beautiful, offline-first personal finance management app built with React Native and Expo. Track your income, expenses, and manage multiple accounts with a sleek dark theme interface.

## 🚀 Getting the Latest Version

To get the latest version of the app with all recent improvements and bug fixes:

```bash
# Switch to the latest development branch
git checkout feature/ui-improvements-and-cleanup

# Install dependencies
npm install

# Start the development server
npm start
```

**Note**: The main branch may not have the latest features. Always use the latest development branch for the most up-to-date experience.

## ✨ Features

### 💳 **Transaction Management**
- Add income and expense transactions
- Categorize transactions with custom categories
- Track transaction history with detailed views
- Support for multiple currencies (INR default)
- Optional transaction descriptions

### 🏦 **Account Management**
- Create and manage multiple accounts
- Track account balances in real-time
- Add/remove money from accounts
- Support for different account types (Trip, Savings, Investment, Other)
- Visual account representation with icons and colors

### 📊 **Reports & Analytics**
- Comprehensive financial reports
- Visual charts and statistics
- Income vs expense analysis
- Category-wise spending breakdown
- Monthly and yearly summaries

### 🎨 **User Experience**
- Beautiful dark theme interface with custom PNG icons
- Smooth transitions and animations throughout the app
- Custom themed alerts and modals
- Smooth navigation with back button support
- Responsive design for all screen sizes
- Offline-first architecture
- Consistent icon system with emoji fallbacks
- Professional spacing and alignment

### 💾 **Data Management**
- Local data storage with AsyncStorage
- Data persistence across app sessions
- Export/import capabilities
- Complete data reset functionality
- No internet connection required

## 🚀 **Getting Started**

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Android Studio** (for APK builds) - [Download here](https://developer.android.com/studio)
- **Expo Go app** (for testing on physical devices) - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SaiyamJn/WallyMobile.git
   cd WallyMobile
   ```

2. **Install dependencies**
   ```bash
   # Install all required packages
   npm install
   
   # Or install from requirements.txt (see Dependencies section)
   npm install $(cat requirements.txt | grep -v '^#' | grep -v '^$' | tr '\n' ' ')
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on device/simulator**
   - **Physical Device**: Scan QR code with Expo Go app
   - **Android Emulator**: Press `a` in terminal
   - **iOS Simulator**: Press `i` in terminal (macOS only)
   - **Web Browser**: Press `w` in terminal

### 📦 **Dependencies**

All required dependencies are listed in `requirements.txt` and `package.json`:

#### Core Dependencies
- **React Native** (0.81.4) - Mobile framework
- **Expo** (~54.0.0) - Development platform
- **TypeScript** (~5.9.2) - Type safety
- **React** (19.1.0) - UI library

#### UI & Navigation
- **react-native-safe-area-context** - Safe area handling
- **react-native-screens** - Native screen optimization
- **react-native-svg** - SVG support
- **lucide-react-native** - Icon library

#### Data & Storage
- **@react-native-async-storage/async-storage** - Local storage
- **@react-native-community/datetimepicker** - Date picker
- **react-datepicker** - Web date picker

#### Development Tools
- **@types/react** - TypeScript definitions
- **Expo CLI** - Development tools

### 🔧 **Quick Setup Commands**

```bash
# 1. Install Expo CLI globally
npm install -g @expo/cli

# 2. Install project dependencies
npm install

# 3. Start development server
npm start

# 4. Open on specific platform
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## 📱 **Building APK**

### Using EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure build**
   ```bash
   eas build:configure
   ```

4. **Build APK**
   ```bash
   eas build -p android
   ```

### Manual Build
```bash
npx expo build:android
```

## 🛠️ **Tech Stack**

- **Framework**: React Native
- **Development Platform**: Expo
- **Language**: TypeScript
- **State Management**: React Context API + useReducer
- **Storage**: AsyncStorage
- **Styling**: StyleSheet + Custom Components
- **Icons**: Custom PNG assets with emoji fallbacks
- **Animations**: React Native transform properties
- **Build Tool**: EAS CLI
- **Package Manager**: npm

## 📁 **Project Structure**

```
WallyMobile/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Accounts.tsx    # Account management
│   │   ├── Reports.tsx     # Analytics & reports
│   │   └── ...
│   ├── contexts/           # React Context providers
│   │   └── AppContext.tsx  # Main app state
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── assets/                 # Images and icons
│   └── icons/             # Custom PNG icon assets
├── app.json               # Expo configuration
├── eas.json              # EAS build configuration
├── package.json          # Dependencies
├── requirements.txt       # All required libraries
└── README.md             # This file
```

## 🎯 **Key Components**

### **Dashboard**
- Overview of financial status
- Quick access to add transactions
- Account balance summaries
- Recent transaction list

### **Transactions**
- Complete transaction history
- Filter by income/expense
- Search and sort functionality
- Delete/edit capabilities

### **Accounts**
- Create and manage accounts
- Balance tracking
- Account type categorization
- Visual account representation

### **Reports**
- Financial analytics
- Spending patterns
- Income vs expense charts
- Category-wise breakdowns

### **Settings**
- Currency selection
- Data management
- App information
- Clear all data option

## 🔧 **Configuration**

### **App Configuration** (`app.json`)
- App name: WallyMobile
- Package: com.saiyamjn.WallyMobile
- Version: 1.0.0
- Orientation: Portrait
- Theme: Dark

### **Build Configuration** (`eas.json`)
- Development build
- Preview build
- Production build
- Android APK generation

## 📊 **Screenshots**

| Dashboard | Transactions | Accounts | Reports |
|-----------|-------------|----------|---------|
| ![Dashboard](screenshots/dashboard.png) | ![Transactions](screenshots/transactions.png) | ![Accounts](screenshots/accounts.png) | ![Reports](screenshots/reports.png) |

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Saiyam Jn**
- GitHub: [@SaiyamJn](https://github.com/SaiyamJn)
- Project: [WallyMobile](https://github.com/SaiyamJn/WallyMobile)

## 🙏 **Acknowledgments**

- React Native team for the amazing framework
- Expo team for the development platform
- All open-source contributors
- UI/UX inspiration from modern finance apps

## 📞 **Support**

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

## ✨ **Recent Updates**

### **v2.1.1 - Icon System & UI Improvements**
- ✅ **Custom Icon System**: Replaced emoji icons with professional PNG assets
- ✅ **Smooth Transitions**: Added scale animations and smooth transitions throughout the app
- ✅ **Consistent Spacing**: Standardized icon-text spacing and button alignment
- ✅ **Navigation Polish**: Enhanced bottom navigation with proper color tinting
- ✅ **Selection Boxes**: Fixed spacing between filter buttons and selection elements
- ✅ **Icon Size Management**: Centralized icon sizing with predefined constants
- ✅ **Visual Feedback**: Added hover effects and active states for better UX

## 🔮 **Future Roadmap**

- [ ] Cloud sync capabilities
- [ ] Data export to CSV/PDF
- [ ] Budget planning features
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Widget support

---

**Made with ❤️ using React Native and Expo**
