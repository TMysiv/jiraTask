import {Injectable} from "@nestjs/common";
import * as PDFDocument from 'pdfkit';
import * as fs from "fs";
import {join} from "path";

@Injectable()
export class PdfService {

    async generateFile(data) {
        const doc = new PDFDocument({autoFirstPage: false,bufferPages: true});
        const fileName = new Date().getTime();
        const outputPath = `files/${fileName}.pdf`;
        doc.pipe(fs.createWriteStream(outputPath));

        const headers = Object.keys(data[0][0]);
        const range = doc.bufferedPageRange()

        for (let i = 0; i < data.length; i++) {
            doc.addPage();

            doc.fontSize(15).font('Helvetica-Bold').text(`Developer -  ${data[i][0]['Full name']}`, 50,50);

            function addHeaders(headers) {
                headers.forEach((header, index) => {
                    if (header !== 'Full name') {
                        doc.font('Helvetica-Bold').fontSize(12).text(header, 50 + index * 110, 100, {underline: true});
                    }
                });
            }
            addHeaders(headers);
            const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);

            data[i].forEach((item, rowIndex) => {
                if (rowIndex === 56) {
                    doc.addPage();
                    addHeaders(headers);
                }

                if (rowIndex > 55) {
                    rowIndex = rowIndex - 56;
                }
                const values = Object.values(item);

                values.forEach((value, colIndex) => {
                    let truncatedValue = value;
                    if (typeof value === 'string') {
                        truncatedValue = value.replace(/-/g, '')
                            .replace(/\n/g, '').substring(0, 20);
                    }
                    if (colIndex !== headers.indexOf('Full name')) {
                        doc.font('Helvetica').fontSize(10).
                        text(String(truncatedValue), 50 + colIndex * 110, 120 + rowIndex * 10);
                    }
                });
            });
            doc.font('Helvetica-Bold').fontSize(12).text(`Total ${sum}`,{underline: true, lineGap: 20})

        }
        doc.end();
        return fs.createReadStream(join(process.cwd(), 'files', `${fileName}.pdf`));
    }

}
