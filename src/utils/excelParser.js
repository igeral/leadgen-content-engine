import * as XLSX from 'xlsx';

export const parseExcelIdeas = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const ideas = [];
    
    // We expect the Databricks Ideas.xlsx to have sheets like "FIFA World Cup sponsors", "growth industries", etc.
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      data.forEach(row => {
        if (row.Company || row.Brand || row.Name) {
          ideas.push({
            sheet: sheetName,
            brand: row.Company || row.Brand || row.Name,
            industry: row.Industry || sheetName,
            data_context: row.Data || row.Context || 'Enterprise Data'
          });
        }
      });
    });
    
    return ideas;
  } catch (error) {
    console.error("Failed to parse excel file", error);
    return [];
  }
};
