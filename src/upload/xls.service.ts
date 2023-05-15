import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import {join} from "path";
import * as XLSX from 'xlsx-js-style'

@Injectable()
export class XlsService {

    async parseFile(data: Buffer) {
        const workbook = XLSX.read(data, {type: "buffer"});
        const sheetName = workbook.SheetNames[0];
        const users = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const filterUsersFields = users.map((obj: any) => {
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const unixTime = (obj['Work date'] - 25569) * millisecondsPerDay;
            obj['Work date'] = new Date(unixTime).toLocaleString().slice(0, -12)
                .replace(',', '').replace(/\//g, '.')
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

        return this.generateFile(dividedUsers)
    }

    async generateFile(data) {

        const workbook = XLSX.utils.book_new();

        for (let i = 0; i < data.length; i++) {
            const sum = data[i].reduce((acc, {Hours}) => acc + Hours, 0);
            const worksheet = XLSX.utils.json_to_sheet(data[i]);

            const styledWorkSheet = await this.addStyles(worksheet, sum);
            XLSX.utils.book_append_sheet(workbook, styledWorkSheet, `${data[i][0]['Full name'].replace(/[\[\] ]/g, '')}`);
        }
        const fileName = new Date().getTime();

        XLSX.writeFile(workbook, `files/${fileName}.xlsx`);
        return fs.createReadStream(join(process.cwd(),'files', `${fileName}.xlsx`));
    }

    async addStyles(worksheet, sum) {

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
            for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({r: rowIndex, c: colIndex});
                const cell = worksheet[cellAddress];
                cell.s = await this.customStyle(12,false)
            }
        }

        const header = ['A1', 'B1', 'C1', 'D1'];
        for (let j = 0; j < header.length; j++) {
            worksheet[header[j]].s = await this.customStyle(14,true)
        }

        worksheet['!cols'] = [{wch: 12}, {wch: 13}, {wch: 40}, {wch: 10}, {hidden: true}];
        const lastRow = XLSX.utils.decode_range(worksheet['!ref']).e.r;
        const sumCell = XLSX.utils.encode_cell({r: lastRow + 1, c: 3})
        return XLSX.utils.sheet_add_aoa(worksheet, [[sum]], {origin: sumCell});
    }

    async customStyle(size,bold) {
        return {
            font: {
                size,
                bold
            },
            alignment: {
                horizontal: 'center'
            },
            border: {
                top: {style: 'thin', color: {rgb: "000000"}},
                bottom: {style: 'thin', color: {rgb: "000000"}},
                left: {style: 'thin', color: {rgb: "000000"}},
                right: {style: 'thin', color: {rgb: "000000"}}
            }
        }
    }
}
