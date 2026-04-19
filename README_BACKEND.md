# WasteVision Production Backend ✅

## 🚀 Run Server
```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**API Live:** http://localhost:8000/docs

## 📋 Structure
```
backend/
├── app/
│   ├── main.py (entry)
│   ├── routes.py (/api/detect)
│   ├── service.py (model wrapper)
│   ├── schemas.py (Pydantic)
├── model/model1.py (WasteVision CNN-ViT)
└── requirements.txt
```

## 🧪 Test API
**Health:**
```bash
curl http://localhost:8000/api/health
```

**Detect (image):**
```bash
curl -X POST "http://localhost:8000/api/detect" -F "file=@image.jpg"
```

**Frontend Fetch:**
```js
const formData = new FormData();
formData.append('file', imageFile);

fetch('http://YOUR_IP:8000/api/detect', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(result => console.log(result));
```

## 🔗 CORS Enabled
`*` origins - **frontend any laptop works!**

**Ngrok:** Add token in model1.py for public URL.

✅ **Production Ready**
