import multer  from "multer";
import path from "path";

const storage =multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/temp");
    },
    filename: function(req,file,cb){
        cb(null, file.originalname);
    },
});

const upload =multer({
    storage,
    limits:{fileSize: 20*1024*1024}, // 20 MB

});
export default upload;