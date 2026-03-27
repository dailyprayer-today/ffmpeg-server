const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/create-video', upload.any(), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files received');
    }

    const files = {};
    req.files.forEach(f => {
      files[f.fieldname] = f.path;
    });

    console.log('Received fields:', Object.keys(files));
    console.log('Received body:', req.body);

    const image = files['image'];
    const audio = files['audio'];
    const finishing = files['finishing'];
    const music = files['music'];
    const day = req.body.day || 'output';

    if (!image || !audio || !finishing || !music) {
      return res.status(400).send(
        'Missing files. Received: ' + JSON.stringify(Object.keys(files))
      );
    }

    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');
    const outputPath = `outputs/${day}_video.mp4`;

    ffmpeg()
      .input(image).inputOptions(['-loop 1'])
      .input(audio)
      .input(finishing)
      .input(music)
      .complexFilter([
        '[1][2]concat=n=2:v=0:a=1[prayer]',
        '[prayer][3]amix=inputs=2:weights=1 0.3[audio]',
        '[0][audio]'
      ])
      .outputOptions([
        '-c:v libx264',
        '-tune stillimage',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
        '-pix_fmt yuv420p'
      ])
      .output(outputPath)
      .on('end', () => {
        res.download(outputPath, () => {
          req.files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          });
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        res.status(500).send('FFmpeg Error: ' + err.message);
      })
      .run();

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
