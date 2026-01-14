# Google Drive Sync Backend

Backend Node.js để sync và download files từ Google Drive private folders sử dụng Service Account.

## Cài đặt

### 1. Tạo Service Account trên Google Cloud

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Google Drive API**:
   - Vào APIs & Services → Library
   - Tìm "Google Drive API" → Enable
4. Tạo Service Account:
   - Vào APIs & Services → Credentials
   - Create Credentials → Service Account
   - Điền tên và tạo
5. Tạo Key cho Service Account:
   - Click vào Service Account vừa tạo
   - Tab Keys → Add Key → Create new key → JSON
   - Download file JSON

### 2. Share Google Drive Folder

1. Mở folder trên Google Drive
2. Click chuột phải → Share
3. Thêm email của Service Account (ví dụ: `my-service@my-project.iam.gserviceaccount.com`)
4. Chọn quyền **Viewer** (chỉ đọc)
5. Bỏ tick "Notify people"
6. Click Share

### 3. Cấu hình Backend

```bash
cd backend-vps
cp .env.example .env
```

Sửa file `.env`:

```env
PORT=3001
FRONTEND_URL=https://your-frontend.com
JWT_SECRET=generate-a-strong-secret-here

# Option A (recommended): base64(JSON)
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=base64_of_service_account_json

# Option B: JSON 1 dòng
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Folder IDs từ URL Google Drive
# https://drive.google.com/drive/folders/ABC123 → ID là ABC123
DRIVE_FOLDER_MOVIES=abc123
DRIVE_FOLDER_SOFTWARE=def456

WEEKLY_DOWNLOAD_LIMIT=3
```

### 4. Chạy Backend

```bash
# Cài dependencies
npm install

# Chạy development
npm run dev

# Chạy production
npm start
```

## API Endpoints

### Public
- `GET /health` - Health check
- `GET /api/drive/list/:category` - Liệt kê files theo category (map từ env)
- `GET /api/drive/list-folder/:folderId` - Liệt kê files theo folderId (Service Account)
- `GET /api/drive/file/:fileId` - Lấy thông tin file

### Protected (cần JWT token)
- `POST /api/drive/sync/:category` - Sync tất cả files từ folder
- `POST /api/drive/sync-url` - Sync từ URL cụ thể
- `GET /api/drive/download/:fileId` - Download file (kiểm tra giới hạn)

### Headers
```
Authorization: Bearer <jwt-token>
```

## Deploy trên VPS

### Sử dụng PM2

```bash
# Cài PM2
npm install -g pm2

# Chạy app
pm2 start src/index.js --name gdrive-backend

# Auto restart khi reboot
pm2 startup
pm2 save
```

### Sử dụng Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

```bash
docker build -t gdrive-backend .
docker run -d -p 3001:3001 --env-file .env gdrive-backend
```

## Tích hợp với Frontend

### 1) Cấu hình frontend gọi về VPS (khuyến nghị)

Thêm vào `.env` của frontend:

```env
VITE_VPS_BACKEND_URL=https://your-vps-domain.com
```

Khi có biến này, admin sync sẽ dùng VPS (Service Account) để đọc folder private thay vì dùng API key.

### 2) Ví dụ gọi API trực tiếp

```ts
const BACKEND_URL = 'https://your-vps-domain.com';

// List files by folderId
const response = await fetch(`${BACKEND_URL}/api/drive/list-folder/${folderId}`);
const data = await response.json();

// Download (cần token nếu bạn dùng endpoint /download)
const downloadResponse = await fetch(`${BACKEND_URL}/api/drive/download/${fileId}`, {
  headers: {
    Authorization: `Bearer ${userToken}`
  }
});
```
