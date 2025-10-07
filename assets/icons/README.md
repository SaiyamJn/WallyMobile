# Icon Assets

This folder contains all the custom icon files used in the WallyMobile app.

## Required Icon Files

### Account Icons (24x24 recommended)
- plane.png - ✈️ Airplane/Travel
- card.png - 💳 Credit Card
- chart.png - 📊 Chart/Analytics
- popcorn.png - 🍿 Entertainment
- bank.png - 🏦 Bank
- diamond.png - 💎 Diamond/Premium
- target.png - 🎯 Target/Goal
- rocket.png - 🚀 Rocket/Growth
- star.png - ⭐ Star/Favorite
- lock.png - 🔒 Security/Lock
- briefcase.png - 💼 Business/Work
- home.png - 🏠 Home
- game.png - 🎮 Gaming
- book.png - 📚 Education
- palette.png - 🎨 Art/Creativity
- music.png - 🎵 Music

### Category Icons
- food.png - 🍴 Food & Dining
- car.png - 🚗 Transportation
- shopping.png - 🛒 Shopping
- movie.png - 🎬 Entertainment
- lightning.png - ⚡ Bills & Utilities
- hospital.png - 🏥 Healthcare
- laptop.png - 💻 Freelance/Tech
- pizza.png - 🍕 Food
- coffee.png - ☕ Beverages

### Navigation Icons
- dashboard.png - 🏠 Dashboard
- transactions.png - 📋 Transactions
- accounts.png - 💳 Accounts
- reports.png - 📊 Reports
- settings.png - ⚙️ Settings

### Dashboard Icons
- balance.png - 💳 Balance/Account
- total_balance.png - 🏦 Total Balance
- income_arrow.png - ↗️ Income Indicator
- expense_arrow.png - ↘️ Expense Indicator

### Action Icons
- delete.png - 🗑️ Delete/Remove
- add.png - ➕ Add/Create
- edit.png - ✏️ Edit/Modify
- save.png - 💾 Save/Store
- cancel.png - ❌ Cancel/Close
- back.png - ← Back/Previous
- forward.png - → Forward/Next
- up.png - ↑ Up/Increase
- down.png - ↓ Down/Decrease

### Status Icons
- success.png - ✅ Success/Complete
- error.png - ❌ Error/Failed
- warning.png - ⚠️ Warning/Caution
- info.png - ℹ️ Information
- loading.png - ⏳ Loading/Processing

### Default Icons
- default.png - ❓ Default/Unknown

## Icon Specifications
- **Format**: PNG with transparency
- **Size**: 24x24 pixels (recommended)
- **Style**: Consistent design language
- **Background**: Transparent
- **Color**: Single color or simple 2-color design
- **Tinting**: Icons support color tinting for active states
- **Fallback**: Emoji icons used when PNG assets are not available

## Creating Icons
You can create these icons using:
1. **Design tools**: Figma, Sketch, Adobe Illustrator
2. **Icon libraries**: Feather Icons, Heroicons, Material Icons
3. **Online generators**: Icon generators that export PNG
4. **AI tools**: Generate icons using AI and export as PNG

## Icon System Features

### **Smart Fallback System**
- **Primary**: Custom PNG assets for professional appearance
- **Fallback**: Emoji icons when PNG assets are not available
- **Automatic**: Seamless switching between asset types

### **Color Tinting Support**
- **Navigation Icons**: Support white tinting for active states
- **Action Icons**: Can be tinted for better visual feedback
- **Colored Icons**: Maintain original colors (no tinting applied)

### **Size Management**
- **Centralized Constants**: All icon sizes defined in `src/constants/iconSizes.ts`
- **Consistent Sizing**: Standardized sizes across the entire app
- **Responsive**: Icons scale appropriately for different screen sizes

### **Current Status**
✅ **Fully Implemented**: All icon assets are integrated and working
✅ **Fallback Ready**: Emoji icons available as backup
✅ **Tinting Active**: Navigation icons support color changes
✅ **Size Optimized**: Consistent sizing throughout the app
