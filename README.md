# Google Drive Content Website

Website quản lý và chia sẻ nội dung từ Google Drive với tính năng sync tự động.

## 📋 Yêu cầu

- Node.js 18+ 
- npm hoặc yarn
- Google Cloud Service Account
- Firebase project (cho authentication và database)

## 🚀 Cài đặt nhanh

### 1. Clone và cài dependencies

```bash
# Cài dependencies cho frontend
npm install

# Cài dependencies cho backend
cd backend-vps && npm install && cd ..
```

### 2. Cấu hình Backend

```bash
# Tạo file .env từ template
cp backend-vps/.env.example backend-vps/.env
```

Mở `backend-vps/.env` và cấu hình:

```env
# Server
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google Service Account (bắt buộc)
# Paste toàn bộ nội dung file JSON vào đây (trong 1 dòng)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Folder IDs (optional - cho endpoint /api/drive/list/:category)
DRIVE_FOLDER_MOVIES=
DRIVE_FOLDER_SOFTWARE=
DRIVE_FOLDER_COURSES=
DRIVE_FOLDER_WINDOWS=
DRIVE_FOLDER_DRIVER=
```

### 3. Cấu hình Frontend

Mở file `.env` và cập nhật Firebase config:

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
...
```

### 4. Chạy development

```bash
# Chạy cả frontend và backend cùng lúc
node dev.js
```

Kết quả:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- API: http://localhost:8080/api/drive (qua Vite proxy)

## 🔧 Tạo Google Service Account

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Google Drive API**:
   - Vào **APIs & Services > Library**
   - Tìm "Google Drive API" và enable
4. Tạo Service Account:
   - Vào **IAM & Admin > Service Accounts**
   - Click **Create Service Account**
   - Đặt tên và click **Create**
   - Skip permissions, click **Done**
5. Tạo key:
   - Click vào service account vừa tạo
   - Tab **Keys > Add Key > Create new key**
   - Chọn **JSON** và download
6. Copy nội dung file JSON vào `GOOGLE_SERVICE_ACCOUNT_KEY` trong `.env`

### ⚠️ Quan trọng: Chia sẻ folder

Bạn **PHẢI** share các folder Google Drive với email của Service Account:
- Tìm email trong file JSON (`client_email`): `your-service@project.iam.gserviceaccount.com`
- Right-click folder > Share > Add email với quyền **Viewer**

## 📁 Cấu trúc dự án

```
├── src/                      # Frontend React
│   ├── components/           # React components
│   ├── pages/               # Pages
│   ├── services/            # API services
│   │   ├── googleDriveService.ts  # Google Drive API client
│   │   ├── driveSyncService.ts    # Sync Drive to Firebase
│   │   └── contentService.ts      # Content CRUD
│   └── contexts/            # React contexts
├── backend-vps/             # Backend Express
│   ├── src/
│   │   ├── index.js         # Express server
│   │   ├── routes/
│   │   │   └── drive.js     # Drive API routes
│   │   ├── services/
│   │   │   └── googleDrive.js  # Google Drive service
│   │   └── middleware/
│   │       └── auth.js      # JWT authentication
│   └── .env.example         # Environment template
├── dev.js                   # Development runner
├── vite.config.ts           # Vite config với proxy
└── .env                     # Frontend environment
```

## 🔌 API Endpoints

### Public (không cần auth)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Health check |
| GET | `/api/drive/list-folder/:folderId` | Liệt kê files trong folder |
| GET | `/api/drive/list/:category` | Liệt kê files theo category |
| GET | `/api/drive/file/:fileId` | Lấy thông tin file |

### Protected (cần JWT token)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/drive/sync/:category` | Sync category từ folder đã cấu hình |
| POST | `/api/drive/sync-url` | Sync từ URL folder |
| GET | `/api/drive/download/:fileId` | Download file (có giới hạn) |

## 🚀 Deploy lên VPS

### Backend

```bash
cd backend-vps

# Cài dependencies
npm install

# Tạo .env file với config production
cp .env.example .env
nano .env  # Cấu hình

# Chạy với PM2
npm install -g pm2
pm2 start src/index.js --name gdrive-backend
pm2 save
```

### Frontend

```bash
# Build frontend
npm run build

# Copy thư mục dist lên VPS hoặc deploy lên Vercel/Netlify

# Cấu hình biến môi trường cho production
VITE_VPS_BACKEND_URL=https://api.your-domain.com
```

## 🛡️ Bảo mật

- JWT tokens có thời hạn 7 ngày
- VIP users và admins có unlimited downloads
- Regular users bị giới hạn WEEKLY_DOWNLOAD_LIMIT (mặc định 3)
- Service Account chỉ có quyền read-only

## 🐛 Debug

```bash
# Kiểm tra backend health
curl http://localhost:3001/health

# Kiểm tra list folder
curl http://localhost:3001/api/drive/list-folder/YOUR_FOLDER_ID

# Xem logs
# Backend logs sẽ hiện trong console khi chạy node dev.js
```

## 📝 License

MIT
