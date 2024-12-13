import multer from "multer";
import path from "path";

const pathToAvatarUploads = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public/avatars"
);
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pathToAvatarUploads);
    },
    filename: (req, file, cb) => {
        const filename = `${new Date().toUTCString()}-${file.originalname}`;
        console.log("filename", filename);

        cb(null, filename);
    },
});

const uploadAvatar = multer({ storage: avatarStorage });

export { uploadAvatar };
