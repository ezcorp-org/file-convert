---
phase: 02-validation-library-and-fixtures
plan: 04b
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/frontend/package.json
  - apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts
  - apps/frontend/tests/fixtures/factories/spreadsheet-factory.test.ts
  - apps/frontend/tests/fixtures/factories/index.ts
autonomous: true

must_haves:
  truths:
    - "Synthetic XLSX spreadsheets can be generated programmatically"
    - "Tabular data formats (CSV, TSV, JSON, YAML, XML) are generated as valid UTF-8"
    - "Generated XLSX files pass magic byte validation (ZIP signature)"
  artifacts:
    - path: "apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts"
      provides: "SpreadsheetFactory class for XLSX, CSV, TSV, JSON, YAML, XML generation"
      exports: ["SpreadsheetFactory", "SpreadsheetFixtureOptions"]
  key_links:
    - from: "apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts"
      to: "exceljs library"
      via: "ExcelJS import"
      pattern: "import.*exceljs"
---

<objective>
Create spreadsheet fixture factory for generating tabular data formats programmatically.

Purpose: Enable tests to create synthetic spreadsheets (XLSX, CSV, TSV, JSON, YAML, XML) without committing files to git. This factory focuses on tabular data formats - document formats are handled separately in plan 02-04.

Output: SpreadsheetFactory for tabular data with configurable rows/columns for testing conversions.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/02-validation-library-and-fixtures/02-RESEARCH.md

# Existing infrastructure
@apps/frontend/tests/fixtures/file-helpers.ts
@apps/frontend/src/lib/utils/conversion-registry.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install exceljs and create SpreadsheetFactory</name>
  <files>
    apps/frontend/package.json
    apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts
  </files>
  <action>
    Install exceljs (v4.5.0 - XLSX generation and parsing):
    ```bash
    cd apps/frontend && bun add -D exceljs
    ```

    Create `apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts`:

    1. Import ExcelJS:
       ```typescript
       import ExcelJS from 'exceljs';
       ```

    2. Define SpreadsheetFixtureOptions interface:
       ```typescript
       export interface SpreadsheetFixtureOptions {
         rows?: number;          // Number of data rows, default: 3
         columns?: number;       // Number of columns, default: 3
         headers?: string[];     // Column headers, default: ['A', 'B', 'C']
         data?: (string | number)[][];  // Custom data, overrides rows/columns
         sheetName?: string;     // Sheet name, default: 'Sheet1'
       }

       // Default test data for consistency
       const DEFAULT_DATA = [
         ['Name', 'Age', 'City'],
         ['Alice', 30, 'NYC'],
         ['Bob', 25, 'LA'],
         ['Charlie', 35, 'Chicago']
       ];
       ```

    3. Create SpreadsheetFactory class with static methods:

       a) `createXLSX(options?: SpreadsheetFixtureOptions): Promise<Buffer>`
          - Use ExcelJS to create XLSX:
            ```typescript
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(options.sheetName ?? 'Sheet1');

            const data = options.data ?? DEFAULT_DATA;
            data.forEach(row => sheet.addRow(row));

            return Buffer.from(await workbook.xlsx.writeBuffer());
            ```

       b) `createCSV(options?: SpreadsheetFixtureOptions): Buffer`
          - Generate CSV string:
            ```typescript
            const data = options.data ?? DEFAULT_DATA;
            const csv = data.map(row => row.join(',')).join('\n');
            return Buffer.from(csv, 'utf-8');
            ```

       c) `createTSV(options?: SpreadsheetFixtureOptions): Buffer`
          - Generate TSV (tab-separated):
            ```typescript
            const data = options.data ?? DEFAULT_DATA;
            const tsv = data.map(row => row.join('\t')).join('\n');
            return Buffer.from(tsv, 'utf-8');
            ```

       d) `createJSON(options?: SpreadsheetFixtureOptions): Buffer`
          - Generate JSON array of objects:
            ```typescript
            const data = options.data ?? DEFAULT_DATA;
            const [headers, ...rows] = data;
            const objects = rows.map(row =>
              Object.fromEntries(headers.map((h, i) => [h, row[i]]))
            );
            return Buffer.from(JSON.stringify(objects, null, 2), 'utf-8');
            ```

       e) `createYAML(options?: SpreadsheetFixtureOptions): Buffer`
          - Generate YAML:
            ```typescript
            const data = options.data ?? DEFAULT_DATA;
            const [headers, ...rows] = data;
            const objects = rows.map(row =>
              Object.fromEntries(headers.map((h, i) => [h, row[i]]))
            );
            // Simple YAML generation (no external dep needed for basic cases)
            const yaml = objects.map(obj =>
              '- ' + Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n  ')
            ).join('\n');
            return Buffer.from(yaml, 'utf-8');
            ```

       f) `createXML(options?: SpreadsheetFixtureOptions): Buffer`
          - Generate XML:
            ```typescript
            const data = options.data ?? DEFAULT_DATA;
            const [headers, ...rows] = data;
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
            rows.forEach(row => {
              xml += '  <row>\n';
              headers.forEach((h, i) => {
                xml += `    <${h}>${row[i]}</${h}>\n`;
              });
              xml += '  </row>\n';
            });
            xml += '</data>';
            return Buffer.from(xml, 'utf-8');
            ```

       g) `createVariations(): Promise<Record<string, Buffer>>`
          - Return edge cases:
            - emptyXLSX: XLSX with no data rows
            - singleRowCSV: Header only
            - largeCSV: 1000 rows
            - specialCharsJSON: Data with quotes, commas, newlines
            - nestedXML: XML with nested elements
  </action>
  <verify>
    Run: `cd apps/frontend && bunx tsc --noEmit`
    File exists: `test -f apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts`
    Dependency installed: `grep "exceljs" apps/frontend/package.json`
  </verify>
  <done>SpreadsheetFactory class exists with XLSX, CSV, TSV, JSON, YAML, XML generation methods. exceljs installed in package.json.</done>
</task>

<task type="auto">
  <name>Task 2: Create unit tests and update exports</name>
  <files>
    apps/frontend/tests/fixtures/factories/spreadsheet-factory.test.ts
    apps/frontend/tests/fixtures/factories/index.ts
  </files>
  <action>
    1. Update `apps/frontend/tests/fixtures/factories/index.ts`:
       ```typescript
       export * from './image-factory';
       export * from './audio-factory';
       export * from './document-factory';
       export * from './spreadsheet-factory';
       ```

    2. Create `apps/frontend/tests/fixtures/factories/spreadsheet-factory.test.ts`:
       ```typescript
       import { describe, it, expect } from 'vitest';
       import { SpreadsheetFactory } from './spreadsheet-factory';
       import { MagicByteValidator } from '../validators';
       ```

       Test cases:

       a) **XLSX generation with MagicByteValidator integration**:
          ```typescript
          it('generates valid XLSX that passes magic byte validation (ZIP signature)', async () => {
            const xlsx = await SpreadsheetFactory.createXLSX();
            // XLSX is a ZIP file internally
            const result = await MagicByteValidator.validate(xlsx, 'zip');
            expect(result.valid).toBe(true);
            expect(result.detectedFormat).toBe('zip');
          });
          ```

       b) **CSV generation**:
          ```typescript
          it('generates valid CSV with comma-separated values', () => {
            const csv = SpreadsheetFactory.createCSV();
            const text = csv.toString('utf-8');
            expect(text).toContain(',');
            expect(text.split('\n').length).toBeGreaterThan(1);
          });
          ```

       c) **TSV generation**:
          ```typescript
          it('generates valid TSV with tab-separated values', () => {
            const tsv = SpreadsheetFactory.createTSV();
            const text = tsv.toString('utf-8');
            expect(text).toContain('\t');
          });
          ```

       d) **JSON generation**:
          ```typescript
          it('generates valid JSON that parses correctly', () => {
            const json = SpreadsheetFactory.createJSON();
            const text = json.toString('utf-8');
            const parsed = JSON.parse(text);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBeGreaterThan(0);
          });
          ```

       e) **YAML generation**:
          ```typescript
          it('generates valid YAML structure', () => {
            const yaml = SpreadsheetFactory.createYAML();
            const text = yaml.toString('utf-8');
            expect(text).toContain('- ');
            expect(text).toContain(':');
          });
          ```

       f) **XML generation**:
          ```typescript
          it('generates valid XML with declaration and closing tag', () => {
            const xml = SpreadsheetFactory.createXML();
            const text = xml.toString('utf-8');
            expect(text).toContain('<?xml');
            expect(text).toContain('</data>');
          });
          ```

       g) **Custom data**:
          ```typescript
          it('accepts custom data array', () => {
            const customData = [
              ['Col1', 'Col2'],
              ['A', 'B']
            ];
            const csv = SpreadsheetFactory.createCSV({ data: customData });
            const text = csv.toString('utf-8');
            expect(text).toContain('Col1,Col2');
            expect(text).toContain('A,B');
          });
          ```

       h) **Variations**:
          ```typescript
          it('createVariations produces all edge cases', async () => {
            const variations = await SpreadsheetFactory.createVariations();
            expect(Object.keys(variations)).toContain('emptyXLSX');
            expect(Object.keys(variations)).toContain('largeCSV');
          });
          ```
  </action>
  <verify>
    Run: `cd apps/frontend && bun run test -- factories/spreadsheet-factory.test.ts`
    All tests pass
  </verify>
  <done>Unit tests verify XLSX passes ZIP magic byte validation, all text formats are valid and parseable</done>
</task>

</tasks>

<verification>
1. exceljs installed: `grep "exceljs" apps/frontend/package.json`
2. Factory exists: `test -f apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts`
3. Unit tests pass: `cd apps/frontend && bun run test -- factories/spreadsheet-factory`
4. TypeScript compiles: `cd apps/frontend && bunx tsc --noEmit`
5. XLSX passes validation: MagicByteValidator.validate(xlsxBuffer, 'zip') returns valid=true
6. JSON parses: JSON.parse(jsonBuffer.toString()) succeeds
</verification>

<success_criteria>
- SpreadsheetFactory generates valid XLSX, CSV, TSV, JSON, YAML, XML files
- XLSX files pass magic byte validation (ZIP signature)
- JSON output passes JSON.parse()
- All text formats are valid UTF-8
- Custom data can be provided to override defaults
- Unit tests cover all format types with MagicByteValidator integration
</success_criteria>

<output>
After completion, create `.planning/phases/02-validation-library-and-fixtures/02-04b-SUMMARY.md`
</output>
