const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/create-video', upload.any(), async (req, res) => {
  try {
    const files = {};
    req.files.forEach(f => { files[f.fieldname] = f.path; });

    const image = files['image'];
    const audio = files['audio'];
    const finishing = files['finishing'];
    const music = files['music'];
    const day = req.body.day || 'output';
    const outputPath = `outputs/${day}_video.mp4`;

    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

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
          req.files.forEach(f => fs.unlinkSync(f.path));
          fs.unlinkSync(outputPath);
        });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).send('Error: ' + err.message);
      })
      .run();
  } catch(err) {
    console.error(err);
    res.status(500).send('Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
