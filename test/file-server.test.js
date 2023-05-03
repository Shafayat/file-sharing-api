const request = require('supertest');
const app = require('../index'); // the Express app to test
const fs = require('fs');
describe('API endpoints', () => {
    let publicKey, privateKey; // to store generated keys for testing

    describe('POST /files', () => {
        it('should upload a file and return a public and private key', (done) => {
            request(app)
                .post('/files')
                .attach('file', 'test/testfile.txt')
                .end(function (err, res) {
                    console.log(res.body.privateKey)
                    if (res.body.privateKey && res.body.publicKey) {
                        privateKey = res.body.privateKey;
                        publicKey = res.body.publicKey;
                        return done();
                    }
                    if (err) return done(err);
                });
        });
    });

    describe('GET /file_list', () => {
        it('should return an array', (done) => {
            request(app)
                .get('/file_list')
                .end(function (err, res) {
                    if (Array.isArray(res.body)) return done();
                    if (err) return done(err);
                });
        });
    });

    describe('GET /upload', () => {
        it('should return 200 code', (done) => {
            request(app)
                .get('/upload')
                .end(function (err, res) {
                    if (res.statusCode === 200) return done();
                    if (err) return done(err);
                });
        });
    });

    describe('GET /', () => {
        it('should return 200 code', (done) => {
            request(app)
                .get('/')
                .end(function (err, res) {
                    if (res.statusCode === 200) return done();
                    if (err) return done(err);
                });
        });
    });

    describe('GET /delete', () => {
        it('should return 200 code', (done) => {
            request(app)
                .get('/delete')
                .end(function (err, res) {
                    if (res.statusCode === 200) return done();
                    if (err) return done(err);
                });
        });
    });

    describe('GET /files/:publicKey', () => {
        it('should return the uploaded file', (done) => {
            request(app)
                .get(`/files/${publicKey}`)
                .end(function (err, res) {
                    if (res.text.indexOf('This is a test file.') > -1) return done();
                    if (err) return done(err);
                });
        });
    });

    describe('DELETE /files/:privateKey', () => {

        it('should delete the uploaded file', (done) => {
            request(app)
                .delete(`/files/${privateKey}`)
                .end(function (err, res) {
                    if (res.body.message === "File deleted successfully") return done();
                    if (err) return done(err);
                });
        });
    });
});
