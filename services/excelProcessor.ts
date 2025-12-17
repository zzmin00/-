import { ExtractedData } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

// Fix for: Cannot find name 'require'
declare var require: any;

const getXLSX = () => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
  try {
    return require('xlsx');
  } catch (e) {
    throw new Error('XLSX library not found');
  }
};

/**
 * Step 1: Extract Data from Source File
 * Scans the file for multiple samples.
 * - Sample 1: Starts at Col A (0)
 * - Sample 2: Starts at Col G (6)
 * - Stride: 6 columns
 * 
 * For each sample:
 * - Date: Extracted from filename (split by '_')
 * - Name: StartCol + 0, Row 1 (Excel Row 2)
 * - Thickness: StartCol + 0, Row 2 (Excel Row 3)
 * - Strain: StartCol + 3
 * - Stress: StartCol + 4
 */
export const extractSourceData = async (file: File): Promise<ExtractedData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const XLSX = getXLSX();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Use header:1 to get array of arrays, defval: null to keep indices correct
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

        if (rows.length < 3) {
            console.warn(`File ${file.name} is too short.`);
        }

        const extractedSamples: ExtractedData[] = [];
        
        // Extract Date from Filename (e.g., "251217_면압.xlsx" -> "251217")
        const testDate = file.name.split('_')[0] || "";

        // Determine the maximum width to know when to stop scanning
        let maxRowWidth = 0;
        rows.forEach(r => { if (r && r.length > maxRowWidth) maxRowWidth = r.length; });

        // Iterate through columns with a stride of 6 (A->0, G->6, M->12...)
        const STRIDE = 6;
        
        for (let startCol = 0; startCol < maxRowWidth; startCol += STRIDE) {
            // Check if a valid Sample Name exists at [Row 1][StartCol] (Excel A2, G2...)
            // If cell is empty or undefined, we skip this block (or stop if strict, but skipping is safer for gaps)
            const rawName = (rows[1] && rows[1][startCol]);
            if (rawName === undefined || rawName === null || String(rawName).trim() === "") {
                continue;
            }

            const sampleName = String(rawName);
            const thickness = (rows[2] && rows[2][startCol] !== undefined) ? (rows[2][startCol]) : "";

            // Identify columns for this specific sample
            const strainColIdx = startCol + 3; // e.g., D, J...
            const stressColIdx = startCol + 4; // e.g., E, K...

            // 1. Scan for Maximum Strain for THIS sample
            let maxStrain = -Infinity;
            for(let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;
                const val = row[strainColIdx];
                if (typeof val === 'number') {
                    if (val > maxStrain) maxStrain = val;
                }
            }

            // 2. Extract Stress Values based on Strain Targets
            const targets = [5, 10, 20, 30, 40, 50, 60, 70, 80];
            const stressValues: (number | string)[] = [];

            targets.forEach(target => {
                // Check if data even reaches this target
                if (maxStrain < target) {
                    stressValues.push('-');
                    return;
                }

                // Find closest match
                let closestDiff = Number.MAX_VALUE;
                let closestRowIndex = -1;

                for(let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row) continue;
                    
                    const valRaw = row[strainColIdx];
                    if (typeof valRaw === 'number') {
                        const diff = Math.abs(valRaw - target);
                        if (diff < closestDiff) {
                            closestDiff = diff;
                            closestRowIndex = i;
                        }
                    }
                }

                if (closestRowIndex !== -1 && rows[closestRowIndex]) {
                    const stressVal = rows[closestRowIndex][stressColIdx];
                    stressValues.push(typeof stressVal === 'number' ? stressVal : 0);
                } else {
                    stressValues.push('-');
                }
            });

            extractedSamples.push({
                testDate,
                sampleName,
                thickness,
                stressValues
            });
        }

        resolve(extractedSamples);

      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

/**
 * Step 2: Merge Data into Target File
 * - Accepts multiple source extracted datasets.
 * - Finds first empty column in Row 1.
 * - Appends each dataset to the next available column.
 */
export const mergeDataIntoTarget = async (targetFile: File, sourceDataList: ExtractedData[]): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const XLSX = getXLSX();
    
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Convert to JSON (header:1) to manipulate arrays easily
            let rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

            // Ensure we have enough rows to write to (up to row 13 -> index 12)
            // Increased to accommodate the new Date row inserted at top
            while(rows.length <= 13) {
                rows.push([]);
            }

            // Find insertion column index based on Row 1 (index 0) - wait, Row 1 is now Date. 
            // We should probably still scan Row 2 (Name) or Row 1 (Date) for emptiness. 
            // Let's scan Row 2 (Index 1) just to be safe as Date might be missing in some legacy merged files?
            // Actually, scanning Row 1 (Index 0) is standard for finding "first empty column".
            
            let currentColIdx = 0;
            
            // Helper to ensure row exists
            const ensureRow = (rIdx: number) => {
                if (!rows[rIdx]) rows[rIdx] = [];
            };

            // Loop through each extracted dataset and place it in the next available column
            for (const sourceData of sourceDataList) {
                // Scan columns from current position until we find an empty cell in the first row.
                // We check Row 2 (Index 1 - Sample Name) for safety as it's the most reliable "Header"
                if (rows[1]) {
                    while (
                        rows[1][currentColIdx] !== undefined && 
                        rows[1][currentColIdx] !== null && 
                        String(rows[1][currentColIdx]).trim() !== ""
                    ) {
                        currentColIdx++;
                    }
                }

                // Insert Date @ Row 1 (Index 0)
                ensureRow(0);
                rows[0][currentColIdx] = sourceData.testDate;

                // Write Sample Name @ Row 2 (Index 1)
                ensureRow(1);
                rows[1][currentColIdx] = sourceData.sampleName;

                // Write Thickness @ Row 3 (Index 2)
                ensureRow(2);
                rows[2][currentColIdx] = sourceData.thickness;
                
                // Gap at Row 4 (Index 3) - Left intentionally as-is or empty

                // Write Stress Values @ Row 5-13 (Index 4-12)
                // Previously started at Row 4 (Index 3). Shifted down by 1.
                sourceData.stressValues.forEach((val, idx) => {
                    const targetRowIdx = 4 + idx; 
                    ensureRow(targetRowIdx);
                    rows[targetRowIdx][currentColIdx] = val;
                });
                
                // Increment column index for the next iteration (next file/sample)
                currentColIdx++; 
            }

            // Convert back to sheet
            const newSheet = XLSX.utils.aoa_to_sheet(rows);
            workbook.Sheets[sheetName] = newSheet;

            // Write to binary
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            resolve(blob);

          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(targetFile);
    });
};