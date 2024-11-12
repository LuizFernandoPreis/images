import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3030;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

//--------------------------------------------------------------//
// CONFIGURANDO O MULTER PARA CRIAR AS PASTAS DE FORMA DINÂMICA //
//--------------------------------------------------------------//
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const { id, dest } = req.params;

    if (!id) {
      return cb(new Error("ID não fornecido"), "");
    }

    // Define o caminho da pasta com base no ID
    const dir = path.join(__dirname, 'upload', id, dest);

    // Cria a pasta se não existir e remove arquivos anteriores de forma síncrona
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    } else {
      // Remove todos os arquivos existentes no diretório
      const files = fs.readdirSync(dir);
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
    }

    cb(null, dir);
  },
  filename: (req: Request, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, req.params.id + extension);
  }
});

//--------------------------------//
//  FILTRO DE ARQUIVOS PERMITIDOS //
//--------------------------------//
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas JPEG, PNG e JPG são permitidos.'));
  }
};

const upload = multer({ storage, fileFilter });

//-------------------------------------//
//  CONFIGURAÇÃO DAS ROTAS DO SERVIDOR //
//-------------------------------------//
app.post('/upload/:id/:dest', upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
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

app.get('/images/:id/:dest', (req: Request, res: any ) => {
  const { id, dest } = req.params;
  const dir = path.join(__dirname, 'upload', id, dest);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: 'Pasta não encontrada.' });
  }

  // Lista todos os arquivos no diretório e retorna os nomes dos arquivos
  const files = fs.readdirSync(dir).map(file => ({
    filename: file,
    url: `/upload/${id}/${dest}/${file}`
  }));

  res.status(200).json(files);
});



//--------------------------------//
// SERVIDOR RODANDO NA PORTA 3000 //
//--------------------------------//
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(cors({ origin: true }))
cors({allowedHeaders: ['Content-Type', 'Authorization']})


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
