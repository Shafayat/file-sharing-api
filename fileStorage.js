const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {v4: uuidv4} = require('uuid');
const {readFileSync} = require("fs");

class FileStorage {
    constructor(rootFolder) {
        this.rootFolder = rootFolder;
    }

    async uploadFile(file) {
        const folderPath = path.join(this.rootFolder, '');

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        const fileStream = fs.createWriteStream(path.join(folderPath, file.originalname));

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(fileStream);

        let data = {
            publicKey: file.originalname,
            privateKey: uuidv4(),
        }
        this.updatePrivateKeyStore(data.privateKey, data.publicKey)

        return data;
    }

    updatePrivateKeyStore(privateKey, publicKey) {
        const filePath = path.join(__dirname, 'privateKeys.json');
        let privateKeys = {};
        if (!fs.existsSync(filePath)) {
            const data = {};
            fs.writeFileSync(filePath, JSON.stringify(data));
        }

        try {
            privateKeys = fs.readFileSync('privateKeys.json', 'utf8')
        } catch (err) {
            throw err;
        }
        console.log(privateKeys)
        try {
            let jsonData = JSON.parse(privateKeys);
            jsonData[privateKey] = publicKey;
            fs.writeFileSync('privateKeys.json', JSON.stringify(jsonData), 'utf8')
        } catch (err) {
            throw err;
        }

        return true;
    }

    // updatePrivateKeyStore(privateKey, publicKey) {
    //     const filePath = path.join(__dirname, 'privateKeys.json');
    //
    //     if (!fs.existsSync(filePath)) {
    //         const data = {};
    //         fs.writeFileSync(filePath, JSON.stringify(data));
    //     }
    //
    //     fs.readFile('privateKeys.json', 'utf8', (err, data) => {
    //         if (err) throw err;
    //
    //         let jsonData = JSON.parse(data);
    //
    //         jsonData[privateKey] = publicKey;
    //         fs.writeFile('privateKeys.json', JSON.stringify(jsonData), 'utf8', (err) => {
    //             if (err) throw err;
    //         })
    //     });
    // }

    async getFileStream(publicKey) {
        const filePath = path.join(this.rootFolder, publicKey);

        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        return fs.createReadStream(filePath);
    }

    async getFileList() {
        return fs.readdirSync(this.rootFolder);
    }

    async deleteFile(privateKey) {
        let privateKeys = fs.readFileSync('privateKeys.json', 'utf8');

        try {
            privateKeys = JSON.parse(privateKeys);
        } catch (e) {
            throw new Error('No files in server!');
        }

        if (!privateKeys[privateKey]) {
            throw new Error('Invalid Key!');
        }

        const folderPath = path.join(this.rootFolder, '');

        const filePath = path.join(folderPath, privateKeys[privateKey]);

        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        fs.unlinkSync(filePath);
        delete privateKeys[privateKey];

        fs.writeFile('privateKeys.json', JSON.stringify(privateKeys), 'utf8', (err) => {
            if (err) throw err;
        });


        return {
            message: 'File deleted successfully',
        };
    }
}

module.exports = FileStorage;
