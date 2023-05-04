const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');
const {assert} = require('chai');
const mime = require('mime-types');

const FileStorage = require('../fileStorage');

describe('FileStorage', () => {
    const rootFolder = path.join(process.env.FOLDER, '');
    const fileStorage = new FileStorage(rootFolder);

    afterEach(() => {
        // Clean up test files
        fs.readdirSync(rootFolder).forEach(file => {
            const filePath = path.join(rootFolder, file);
            fs.unlinkSync(filePath);
        });
    });

    async function uploadFile() {
        let testFile = fs.readFileSync(path.join(__dirname, 'testfile.txt'));
        const mimeType = mime.lookup(path.join(__dirname, 'testfile.txt'));
        const encoding = 'utf8';
        const size = testFile.length;

        let file = {
            fieldname: 'file',
            originalname: 'testfile.txt',
            mimeType: mimeType,
            encoding: encoding,
            buffer: testFile,
            size: size
        };
        return await fileStorage.uploadFile(file);
    }

    describe('uploadFile', () => {
        it('should upload a file', async () => {
            let data = await uploadFile();
            assert.property(data, 'publicKey');
            assert.property(data, 'privateKey');
            const filePath = path.join(rootFolder, data.publicKey);
            assert.isTrue(fs.existsSync(filePath));
            const fileContent = fs.readFileSync(filePath);
            assert.equal(fileContent.toString(), 'This is a test file.');
        });
    });

    describe('getFileStream', () => {
        it('should get a file stream', async () => {
            let data = await uploadFile();
            assert.property(data, 'publicKey');
            assert.property(data, 'privateKey');
            const filePath = path.join(rootFolder, data.publicKey);

            let stream;

            try {
                stream = await fileStorage.getFileStream(filePath);
                const streamContent = await new Promise(resolve => {
                    const chunks = [];
                    stream.on('data', chunk => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
                });
                assert.equal(streamContent, 'This is a test file.');
            } catch (error) {
                assert.equal(error.message, 'File not found');
            }
        });

    });

    describe('deleteFile', () => {
        it('should delete the test file', async () => {
            let data = await uploadFile();
            const result = await fileStorage.deleteFile(data.privateKey);
            assert.equal(result.message, 'File deleted successfully');
        });
    });
});

