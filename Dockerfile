FROM node:18

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY . .

# Create required folders
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

5. Scroll down
6. Click **Commit new file** ✅

---

**After this your repository will have:**
```
📁 ffmpeg-server/
├── 📄 server.js
├── 📄 package.json
├── 📄 Dockerfile
└── 📄 README.md
