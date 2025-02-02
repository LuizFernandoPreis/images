"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = 3030;

app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

//--------------------------------------------------------------//
// CONFIGURANDO O MULTER PARA CRIAR AS PASTAS DE FORMA DINÂMICA //
//--------------------------------------------------------------//
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const { id, dest } = req.params;
        if (!id) {
            return cb(new Error("ID não fornecido"), "");
        }
        const dir = path_1.default.join(__dirname, 'upload', id, dest);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        } else {
            const files = fs_1.default.readdirSync(dir);
            for (const file of files) {
                fs_1.default.unlinkSync(path_1.default.join(dir, file));
            }
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const extension = path_1.default.extname(file.originalname);
        cb(null, req.params.id + extension);
    }
});

//--------------------------------//
//  FILTRO DE ARQUIVOS PERMITIDOS //
//--------------------------------//
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido. Apenas JPEG, PNG e JPG são permitidos.'));
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter });

//-------------------------------------//
//  CONFIGURAÇÃO DAS ROTAS DO SERVIDOR //
//-------------------------------------//
app.post('/upload/:id/:dest', upload.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Por favor, envie uma imagem.' });
        return;
    }
    const { id, dest } = req.params;
    res.status(200).json({
        message: 'Imagem enviada com sucesso!',
        filePath: `/upload/${id}/${dest}/${req.file.filename}`
    });
});

app.get('/images/:id/:dest', (req, res) => {
    const { id, dest } = req.params;
    const dir = path_1.default.join(__dirname, 'upload', id, dest);
    if (!fs_1.default.existsSync(dir)) {
        return res.status(404).json({ error: 'Pasta não encontrada.' });
    }
    const files = fs_1.default.readdirSync(dir).map(file => ({
        filename: file,
        url: `/upload/${id}/${dest}/${file}`
    }));
    res.status(200).json(files);
});

//--------------------------------//
// SERVIDOR RODANDO NA PORTA 3030 //
//--------------------------------//
app.use('/upload', express_1.default.static(path_1.default.join(__dirname, 'upload')));
app.use((0, cors_1.default)({ origin: true }));

app.listen(PORT, () => {
    console.log(`Servidor HTTP rodando em http://localhost:${PORT}`);
});
