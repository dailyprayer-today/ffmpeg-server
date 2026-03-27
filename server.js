const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/create-video', upload.any(), (req, res) => {
  try {
    const files = {};
    req.files.forEach(f => { files[f.fieldname] = f.path; });

    const image = files['image'];
    const audio = files['audio'];
    const finishing = files['finishing'];
    const music = files['music'];
    const day = req.body.day || 'output';

    if (!image || !audio || !finishing || !music) {
      return res.status(400).send('Missing: ' + JSON.stringify(Object.keys(files)));
    }

    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

    // Step 1: Merge prayer + finishing prayer
    const mergedAudio = `outputs/${day}_merged.mp3`;
    const outputPath = `outputs/${day}_video.mp4`;

    ffmpeg()
      .input(audio)
      .input(finishing)
      .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[aout]')
      .outputOptions(['-map [aout]'])
      .output(mergedAudio)
      .on('end', () => {
        // Step 2: Add background music + image
        ffmpeg()
          .input(image)
          .inputOptions(['-loop 1'])
          .input(mergedAudio)
          .input(music)
          .complexFilter([
            '[1:a][2:a]amix=inputs=2:weights=1 0.3[aout]'
          ])
          .outputOptions([
            '-map 0:v',
            '-map [aout]',
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
              if (fs.existsSync(mergedAudio)) fs.unlinkSync(mergedAudio);
              if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });
          })
          .on('error', (err) => {
            res.status(500).send('FFmpeg Error step 2: ' + err.message);
          })
          .run();
      })
      .on('error', (err) => {
        res.status(500).send('FFmpeg Error step 1: ' + err.message);
      })
      .run();

  } catch (err) {
    res.status(500).send('Server Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
