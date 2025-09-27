# WallyMobile 💰

A beautiful, offline-first personal finance management app built with React Native and Expo. Track your income, expenses, and manage multiple accounts with a sleek dark theme interface.

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
- Beautiful dark theme interface
- Custom themed alerts and modals
- Smooth navigation with back button support
- Responsive design for all screen sizes
- Offline-first architecture

### 💾 **Data Management**
- Local data storage with AsyncStorage
- Data persistence across app sessions
- Export/import capabilities
- Complete data reset functionality
- No internet connection required

## 🚀 **Getting Started**

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for APK builds)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SaiyamJn/WallyMobile.git
   cd WallyMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

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
├── app.json               # Expo configuration
├── eas.json              # EAS build configuration
└── package.json          # Dependencies
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
