const express = require('express');
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}

// Set up multer middleware for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const originalname = file.originalname;
        const filePath = 'uploads/' + originalname;

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                // File exists, add a number to the filename
                let index = 1;
                let newFilename = originalname;
                while (true) {
                    const fileNameParts = originalname.split('.');
                    const extension = fileNameParts.pop();
                    const baseName = fileNameParts.join('.');
                    newFilename = baseName + '-' + index + '.' + extension;
                    if (!fs.existsSync('uploads/' + newFilename)) {
                        break;
                    }
                    index++;
                }
                cb(null, newFilename);
            } else {
                cb(null, originalname);
            }
        });
    }
});

const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/myFiles', express.static('uploads'));

// Route for listing and downloading files
app.get('/myFiles', (req, res) => {
    fs.readdir('uploads/', (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).send('Error reading directory');
        } else {
            const basePath = req.protocol + '://' + req.get('host'); // Get base path of the server
            const fileList = files.map(file => `<li><a href="${basePath}/myFiles/${file}" download="${file}">${file}</a></li>`).join('');
            const htmlResponse = `
                <html>
                    <head>
                        <title>Lista de Arquivos</title>
                        <link rel="stylesheet" type="text/css" href="/styles.css">
                    </head>
                    <body>
                        <h1>Lista de Arquivos</h1>
                        <ul>${fileList}</ul>
                    </body>
                </html>
            `;
            res.send(htmlResponse);
        }
    });
});

// Route for the root URL, respond with 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for handling file uploads
app.post('/upload', upload.single('fileInput'), (req, res) => {
    console.log(req.file);  // Log the uploaded file information to the console
    res.send('Arquivo recebido!');  // Send response indicating successful upload
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Servidor rodando em http://${getLocalIpAddress()}:${port}`);  // Log server address to the console
});
