const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if(extname && mimetype) {
        cb(null, true);
    }else {
        cb(new Error('Chỉ cho phép tải lên các tệp hình ảnh (jpeg, jpg, png)'));
    }
}

const upload = multer({storage, fileFilter})
module.exports = upload;