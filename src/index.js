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
const https_1 = __importDefault(require("https"));
const app = (0, express_1.default)();
const PORT = 3030;
// Carregar os certificados SSL
const options = {
    key: fs_1.default.readFileSync('../../key.pem'), // Substitua pelo caminho correto do seu arquivo key.pem
    cert: fs_1.default.readFileSync('../../csr.pem') // Substitua pelo caminho correto do seu arquivo cert.pem
};
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
        // Define o caminho da pasta com base no ID
        const dir = path_1.default.join(__dirname, 'upload', id, dest);
        // Cria a pasta se não existir e remove arquivos anteriores de forma síncrona
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        else {
            // Remove todos os arquivos existentes no diretório
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
    }
    else {
        cb(new Error('Tipo de arquivo inválido. Apenas JPEG, PNG e JPG são permitidos.'));
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter });
//-------------------------------------//
//  CONFIGURAÇÃO DAS ROTAS DO SERVIDOR //
//-------------------------------------//
app.post('/upload/:id/:dest', upload.single('image'), (req, res, next) => {
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
    // Lista todos os arquivos no diretório e retorna os nomes dos arquivos
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
https_1.default.createServer(options, app).listen(PORT, () => {
    console.log(`Servidor HTTPS rodando em https://localhost:${PORT}`);
});
