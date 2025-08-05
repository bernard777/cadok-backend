// Mock multer complet
const multer = jest.fn(() => ({
  single: jest.fn(() => (req, res, next) => {
    req.file = {
      filename: 'test-file.jpg',
      originalname: 'original-test.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      buffer: Buffer.from('fake image data')
    };
    next();
  }),
  array: jest.fn(() => (req, res, next) => {
    req.files = [{
      filename: 'test-file.jpg',
      originalname: 'original-test.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      buffer: Buffer.from('fake image data')
    }];
    next();
  }),
  fields: jest.fn(() => (req, res, next) => {
    req.files = {
      'field1': [{
        filename: 'test-file.jpg',
        originalname: 'original-test.jpg',
        mimetype: 'image/jpeg',
        size: 12345,
        buffer: Buffer.from('fake image data')
      }]
    };
    next();
  })
}));

// Mock diskStorage
multer.diskStorage = jest.fn(() => ({
  _handleFile: jest.fn(),
  _removeFile: jest.fn()
}));

// Mock memoryStorage
multer.memoryStorage = jest.fn(() => ({
  _handleFile: jest.fn(),
  _removeFile: jest.fn()
}));

module.exports = multer;