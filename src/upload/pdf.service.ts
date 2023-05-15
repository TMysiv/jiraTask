import {Injectable, Logger} from "@nestjs/common";
import * as XLSX from "xlsx-js-style";
import * as PDFDocument from 'pdfkit';
import * as fs from "fs";

@Injectable()
export class PdfService {

    async parseFile(data: Buffer) {
        const workbook = XLSX.read(data, {type: "buffer"});
        const sheetName = workbook.SheetNames[0];
        const users = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const filterUsersFields = users.map((obj: any) => {
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const unixTime = (obj['Work date'] - 25569) * millisecondsPerDay;
            obj['Work date'] = new Date(unixTime).toLocaleString().slice(0, -12)
                .replace(',', '').replace(/\//g, '.');
            obj['Hours'] = Math.floor(obj['Hours'] * 100) / 100;
            const {
                'Issue Key': issueKey,
                'Work date': workDate,
                'Work Description': workDescription,
                'Hours': hours,
                'Full name': fullName,
            } = obj;
            return {
                'Issue Key': issueKey, 'Work date': workDate,
                'Work Description': workDescription, 'Hours': hours, 'Full name': fullName
            };
        });

        const dividedUsers = Object.values(filterUsersFields.reduce((acc, obj) => {
            if (!acc[obj['Full name']]) {
                acc[obj['Full name']] = [];
            }
            acc[obj['Full name']].push(obj);
            return acc;
        }, {}));

        return this.generateFile(dividedUsers);

    }

    async generateFile(data) {
        const doc = new PDFDocument({autoFirstPage: false});
        const outputPath = 'files/output.pdf';

        const headers = Object.keys(data[0][0]);

        for (let i = 0; i < data.length; i++) {
            doc.addPage();
            doc.fontSize(15).font('Helvetica-Bold').text(`Developer ${data[i][0]['Full name']}`);
            // Add headers to page
            doc.font('Helvetica-Bold').fontSize(12);
            headers.forEach((header, index) => {
                if (header !== 'Full name') {
                    doc.text(header, 50 + index * 110, 100, {underline: true});
                }
            });
            const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);
            // Add data to page
            doc.font('Helvetica').fontSize(10);
            data[i].forEach((item, rowIndex) => {
                const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);
                const values = Object.values(item);
                values.forEach((value, colIndex) => {
                    let truncatedValue = value;
                    if (typeof value === 'string') {
                        truncatedValue = value.replace(/-/g, '').replace(/\n/g, '').substring(0, 20);
                    }
                    if (colIndex !== headers.indexOf('Full name')) {
                        doc.text(String(truncatedValue), 50 + colIndex * 110, 120 + rowIndex * 15);
                    }
                });
            });
            doc.font('Helvetica-Bold').fontSize(12).text(`Total ${sum}`,{underline: true})

        }
        doc.pipe(fs.createWriteStream(outputPath));
        doc.end();
    }
}
