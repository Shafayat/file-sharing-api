require("dotenv").config();
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const FileStorage = require('./fileStorage');
const path = require("path");
const mimeTypes = require("mime-types");
const fs = require("fs");
const app = express();
const upload = multer();
const fileStorage = new FileStorage(process.env.FOLDER);
let inactiveSince = Date.now();

// Configurable daily download and upload limits for the network traffic from the same IP address
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 create requests per `window` (here, per hour)
    message:
        'Too many accounts created from this IP, please try again after an hour',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


// GET /files - list existing files
app.get('/', async (req, res, next) => {
    inactiveSince = Date.now();
    const publicFolder = path.join(__dirname, 'templates');
    res.sendFile(path.join(publicFolder, './file-list.html'));
});
// GET /files - list existing files
app.get('/file_list', async (req, res, next) => {
    let list = await fileStorage.getFileList();
    inactiveSince = Date.now();
    res.send(list);
});

// POST /files - upload new files
app.post('/files', upload.single('file'), async (req, res, next) => {
    inactiveSince = Date.now();
    try {
        const file = req.file;
        const result = await fileStorage.uploadFile(file);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /files/:publicKey - download existing files
app.get('/files/:publicKey', apiLimiter, async (req, res, next) => {
    inactiveSince = Date.now();
    try {
        const publicKey = req.params.publicKey;
        const fileStream = await fileStorage.getFileStream(publicKey);
        const filePath = path.join(process.env.FOLDER, publicKey);
        const mimeType = mimeTypes.lookup(filePath);

        res.setHeader('Content-disposition', `attachment; filename=${publicKey}`);
        res.setHeader('Content-type', mimeType);
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
});
// GET /files - list existing files
app.get('/upload', async (req, res, next) => {
    const publicFolder = path.join(__dirname, 'templates');
    inactiveSince = Date.now();
    res.sendFile(path.join(publicFolder, './upload.html'));
});

// DELETE /files/:privateKey - remove existing files
app.delete('/files/:privateKey', async (req, res, next) => {
    inactiveSince = Date.now();
    try {
        const privateKey = req.params.privateKey;
        const result = await fileStorage.deleteFile(privateKey);
        res.json(result);
    } catch (error) {
        next(error);
    }
});
// GET /delete - the html page to input privateKey
app.get('/delete', async (req, res, next) => {
    const publicFolder = path.join(__dirname, 'templates');
    inactiveSince = Date.now();
    res.sendFile(path.join(publicFolder, './delete.html'));
});

// Internal job to cleanup uploaded files after configurable period of inactivity
setInterval(() => {
    let deleteInterval = 1 * 60 * 1000 //delete files if inactive for 5min
    if ((Date.now() - inactiveSince) > deleteInterval) {
        console.log('Cleaning up inactive files');

        fs.readFile('privateKeys.json', 'utf8', (err, data) => {
            if (err) throw err;
            let jsonData = {};
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                console.log(e);
            }
            Object.keys(jsonData).forEach(async privateKey => {
                await fileStorage.deleteFile(privateKey);
            });
        });
    }


}, 60 * 60 * 1000); // run every 1 hr.

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({
        message: err.message || 'Something went wrong',
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started listening on port ${port}`);
});
module.exports = app;