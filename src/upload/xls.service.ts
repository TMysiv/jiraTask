import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import {join} from "path";
import * as XLSX from 'xlsx-js-style'
import {PdfService} from "./pdf.service";

@Injectable()
export class XlsService {

    constructor(private pdfService: PdfService) {
    }

    async parseFile(data: Buffer, extension: string) {
        const workbook = XLSX.read(data, {type: "buffer"});
        const sheetName = workbook.SheetNames[0];
        const users = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const filterUsersFields = users.map((obj: any) => {
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const unixTime = (obj['Work date'] - 25569) * millisecondsPerDay;
            obj['Work date'] = new Date(unixTime).toLocaleString().slice(0, -12)
                .replace(',', '').replace(/\//g, '.');
            const {
                'Work date': workDate,
                'Work Description': workDescription,
                'Hours': hours,
                'Full name': fullName,
                'Activity Name': customer
            } = obj;
            return {
                'Work date': workDate,
                'Work Description': workDescription, 'Hours': hours, 'Full name': fullName, 'Activity Name': customer
            };
        });

        const dividedUsers = Object.values(filterUsersFields.reduce((acc, obj) => {
            if (!acc[obj['Full name']]) {
                acc[obj['Full name']] = [];
            }
            acc[obj['Full name']].push(obj);
            return acc;
        }, {}));

        if (extension === 'xls') {
            return this.generateFile(dividedUsers)
        } else {
            return this.pdfService.generateFile(dividedUsers)
        }
    }

    async generateFile(data) {
        const workbook = XLSX.utils.book_new();

        for (let i = 0; i < data.length; i++) {
            const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);
            const modifyHours = data[i].map(row => {
                return {
                    ['Work date'] : row['Work date'],
                    ['Work Description'] : row['Work Description'],
                    ['Hours'] : String(row['Hours']).substring(0,3),
                };
            });
            // @ts-ignore
            const worksheet = XLSX.utils.json_to_sheet(modifyHours, {origin: 'B3'});

            const fullName = data[i][0]['Full name'].replace(/\[X\]/g, '');
            const project = data[i][0]['Activity Name'];
            const styledWorkSheet = await this.addStyles(worksheet, sum, fullName, project);

            XLSX.utils.book_append_sheet(workbook, styledWorkSheet, fullName);
        }
        const fileName = new Date().getTime();
        XLSX.writeFile(workbook, `files/${fileName}.xlsx`);
        return fs.createReadStream(join(process.cwd(), 'files', `${fileName}.xlsx`));
    }

    async addStyles(worksheet, sum, fullName, project) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let rowIndex = range.s.r + 3; rowIndex <= range.e.r; rowIndex++) {
            for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({r: rowIndex, c: colIndex});
                const cell = worksheet[cellAddress];
                if (cell) {
                    cell.s = {
                        alignment: {horizontal: 'center', vertical: 'center', wrapText: true},
                        font: {cz: 12}
                    }
                }
            }
        }

        const header = ['B3', 'C3', 'D3'];
        for (let j = 0; j < header.length; j++) {
            worksheet[header[j]].s = {
                alignment: {horizontal: 'center', vertical: 'center',},
                font: {cz: 12, bold: true}, border: {top: true}
            }
        }

        worksheet['!cols'] = [{wch: 8}, {wch: 12}, {wch: 40}, {wch: 8}, {hidden: true}, {hidden: true}];

        const lastRow = XLSX.utils.decode_range(worksheet['!ref']).e.r;
        const sumCell = XLSX.utils.encode_cell({r: lastRow + 1, c: 3});
        XLSX.utils.sheet_add_aoa(worksheet, [[sum]], {origin: sumCell});
        worksheet[sumCell].s = {
            font: {bold: true, sz:13},
            alignment: {horizontal: 'center'},
            border: {top: true, bottom: true}
        }

        const total = XLSX.utils.encode_cell({r: lastRow + 1, c: 2})
        XLSX.utils.sheet_add_aoa(worksheet, [['Total']], {origin: total});
        worksheet[total].s = {font: {bold: true,sz:13}, alignment: {horizontal: 'right'}}

        XLSX.utils.sheet_add_aoa(worksheet, [['Project']], {origin: 'B1'});
        XLSX.utils.sheet_add_aoa(worksheet, [[project]], {origin: 'C1'});
        XLSX.utils.sheet_add_aoa(worksheet, [['Developer']], {origin: 'B2'});
        XLSX.utils.sheet_add_aoa(worksheet, [[fullName]], {origin: 'C2'});


        const title = ['B1', 'C1'];
        for (let j = 0; j < title.length; j++) {
            worksheet[title[j]].s = {font: {bold: true, sz: 14}, alignment: {horizontal: 'left'}}
        }

        const title2 = ['B2','C2'];
        for (let j = 0; j < title2.length; j++) {
            worksheet[title2[j]].s = {
                font: {bold: true, sz: 14},
                alignment: {horizontal: 'left'},
            }
        }
        return worksheet;
    }
}
