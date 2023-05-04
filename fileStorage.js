const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require('uuid');
const {readFileSync} = require("fs");

/**
 * Class that has all file processing methods
 * constructor takes the process.env.FOLDER as rootFolder
 */
class FileStorage {
    constructor(rootFolder) {
        this.rootFolder = rootFolder;
    }

    /**
     * Saves the uploaded file in filesystem
     */
    async uploadFile(file) {
        const folderPath = path.join(this.rootFolder, '');

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        fs.writeFileSync(path.join(folderPath, file.originalname), file.buffer);
        let data = {
            publicKey: file.originalname,
            privateKey: uuidv4(),
        }
        this.updatePrivateKeyStore(data.privateKey, data.publicKey)

        return data;
    }

    /**
     * Stores all privateKeys in a json file; maps with publicKey
    */
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
        try {
            let jsonData = JSON.parse(privateKeys);
            jsonData[privateKey] = publicKey;
            fs.writeFileSync('privateKeys.json', JSON.stringify(jsonData), 'utf8')
        } catch (err) {
            throw err;
        }

        return true;
    }

    /**
     * reads file to download
     * publicKey : file's public identifier
     */
    async getFileStream(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        return fs.createReadStream(filePath);
    }

    /**
     * Gets all file list to show in browser
     */
    async getFileList() {
        return fs.readdirSync(this.rootFolder);
    }

    /**
     * Deletes file
     * privateKey : unique identifier of the file to be deleted
     * shouldThrow : decides whether to throw error or suppress them, should suppress when function is called for auto file cleanup
     */
    async deleteFile(privateKey, shouldThrow = true) {
        let privateKeys = fs.readFileSync('privateKeys.json', 'utf8');

        try {
            privateKeys = JSON.parse(privateKeys);
        } catch (e) {
            if (shouldThrow)
                throw new Error('No files in server!');
            else return 'No files in server!';
        }

        if (!privateKeys[privateKey]) {
            if (shouldThrow)
                throw new Error('Invalid Key!');
            else return 'Invalid Key!';
        }

        const folderPath = path.join(this.rootFolder, '');

        const filePath = path.join(folderPath, privateKeys[privateKey]);

        if (!fs.existsSync(filePath)) {
            if (shouldThrow)
                throw new Error('File not found');
            else return false;
        }

        fs.unlinkSync(filePath);
        delete privateKeys[privateKey];

        fs.writeFile('privateKeys.json', JSON.stringify(privateKeys), 'utf8', (err) => {
            if (err && shouldThrow) throw err;
            else return 'Something went wrong!';
        });

        return {
            message: 'File deleted successfully',
        };
    }
}

module.exports = FileStorage;
