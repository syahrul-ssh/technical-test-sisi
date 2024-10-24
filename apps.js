// server.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Function to generate output PDF
function generateOutputPDF(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const outputPath = path.join(__dirname, 'output.pdf');
        const writeStream = fs.createWriteStream(outputPath);

        doc.pipe(writeStream);
        doc.moveDown();

        doc.fontSize(12).text(data);

        doc.end();

        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
    });
}

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        
        const outputPath = await generateOutputPDF(pdfData.text);
        
        res.json({ 
            success: true, 
            message: 'PDF processed successfully',
            outputPath: outputPath
        });

        fs.unlinkSync(req.file.path);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing PDF' });
    }
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, req.params.filename);
    res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});