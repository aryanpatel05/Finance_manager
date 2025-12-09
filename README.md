
# Cash Whisperer 💰

A smart personal finance management application built with **React**, **TypeScript**, and **Appwrite**.

## ✨ Features

- **💸 Expense Tracking**: Log expenses with categories, descriptions, and receipt attachments.
- **🤖 Receipt Scanning AI**: Automatically extract amount, date, and description from receipt images using **Google Gemini 2.0 Flash**.
- **📊 Interactive Dashboard**:
  - Monthly spending usage vs. salary limit.
  - Category-wise breakdown charts.
  - Recurring expenses tracking.
- **📅 Monthly Reports**: detailed tables with search and filters.
- **📄 Export to PDF**: Download professional monthly and annual reports.
- **💾 Savings History**: Track your savings journey month over month.
- **🔐 Secure Authentication**: Powered by Appwrite (Email/Password Login, Signup, Reset Password).
- **📱 Responsive Design**: Works seamlessly on desktop and mobile.

## 🛠️ Technologies

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend & Auth**: Appwrite Cloud
- **AI**: Google Gemini API
- **Visualization**: Recharts
- **PDF Generation**: jsPDF

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/aryanpatel05/Finance_manager.git
cd Finance_manager
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
VITE_APPWRITE_PROJECT_ID="your_project_id"
VITE_APPWRITE_DATABASE_ID="your_database_id"
VITE_APPWRITE_EXPENSES_COLLECTION_ID="your_expenses_collection_id"
VITE_APPWRITE_MONTHLY_SAVINGS_COLLECTION_ID="your_savings_collection_id"

# Google Gemini AI (For Receipt Scanning)
VITE_GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Run the development server
```bash
npm run dev
```

## 🌐 Deployment

The project is optimized for deployment on **Vercel**.
Ensure you add the Environment Variables in your Vercel Project Settings.

---
Made by Aryan Patel
