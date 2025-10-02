import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Excel workbook
const workbookPath = join(__dirname, '../Hogwarts Legacy Completion Checklist.xlsx');
const workbook = XLSX.readFile(workbookPath);

// Load locations for ID resolution
const locationsPath = join(__dirname, '../../src/lib/data/locations.json');
const locations = JSON.parse(readFileSync(locationsPath, 'utf8'));

// Helper: Convert name to kebab-case ID
function toId(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens (strips #)
    .replace(/\s+/g, '-')
    .trim();
}

// Helper: Remove null/undefined fields from an object
function cleanItem(item) {
  const cleaned = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== null && value !== undefined) {
      // Normalize line endings in description fields
      if (key === 'description' && typeof value === 'string') {
        cleaned[key] = normalizeLineEndings(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Helper: Parse worksheet to array of arrays
function parseWorksheet(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" not found in workbook`);
  }

  // Convert sheet to array of arrays, preserving all data types
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Convert all cells to strings for consistency with previous CSV parsing
  return rows.map(row =>
    row.map(cell => {
      if (cell === null || cell === undefined) return '';
      if (typeof cell === 'boolean') return cell ? 'TRUE' : 'FALSE';
      return String(cell);
    })
  );
}

// Helper: Get cell comment from worksheet
function getCellComment(sheetName, row, col) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return undefined;

  // Convert row/col to Excel cell reference (e.g., A1, B2)
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[cellRef];

  // Check if cell has a comment
  if (cell && cell.c && cell.c.length > 0) {
    // Return the text of the first comment
    return cell.c[0].t;
  }

  return undefined;
}

// Helper: Check if a cell is part of a merged region spanning specific columns
function isMergedAcrossColumns(sheetName, row, startCol, endCol) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!merges']) return false;

  // Check if there's a merge that starts at this row and spans the columns
  return sheet['!merges'].some(merge => {
    return merge.s.r === row &&
           merge.s.c === startCol &&
           merge.e.c === endCol;
  });
}

// Helper: Strip FALSE prefix from checkbox state
function stripFalse(value) {
  if (!value) return '';
  return value.replace(/^FALSE,?\s*/i, '').trim();
}

// Helper: Normalize line endings (replace \r\n with \n)
function normalizeLineEndings(value) {
  if (!value) return value;
  return value.replace(/\r\n/g, '\n');
}

// Helper: Resolve location ID
function resolveLocationId(locationName) {
  if (!locationName) return undefined;
  const normalized = locationName.toLowerCase().trim();

  for (const loc of locations) {
    if (loc.name.toLowerCase() === normalized || loc.id === normalized) {
      return loc.id;
    }
  }
  return undefined;
}

// Helper: Resolve sublocation ID
function resolveSublocationId(locationId, sublocationName) {
  if (!locationId || !sublocationName) return undefined;
  const normalized = sublocationName.toLowerCase().trim();

  const location = locations.find(l => l.id === locationId);
  if (!location || !location.sublocations) return undefined;

  for (const subloc of location.sublocations) {
    if (subloc.name.toLowerCase() === normalized || subloc.id === normalized) {
      return subloc.id;
    }
  }
  return undefined;
}

// Helper: Try to resolve a name as either location or sublocation
function resolveLocationAndSublocation(name) {
  if (!name) return { locationId: undefined, sublocationId: undefined };

  // First try as location
  const locationId = resolveLocationId(name);
  if (locationId) {
    return { locationId, sublocationId: undefined };
  }

  // Try as sublocation in each location
  for (const loc of locations) {
    if (loc.sublocations) {
      const sublocationId = resolveSublocationId(loc.id, name);
      if (sublocationId) {
        return { locationId: loc.id, sublocationId };
      }
    }
  }

  return { locationId: undefined, sublocationId: undefined };
}

// Parser for simple location-based types
function parseSimpleLocationType(sheetName, typeName, typeId) {
  const rows = parseWorksheet(sheetName);
  const items = [];
  let currentLocationId = null;
  let currentSublocationId = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] && !row[1]) continue; // Skip empty rows

    // Check if this is a location/sublocation header (no FALSE prefix)
    const firstCell = row[0].trim();
    if (firstCell && firstCell !== 'FALSE' && !firstCell.startsWith('FALSE')) {
      // Try to resolve as location or sublocation
      const resolved = resolveLocationAndSublocation(firstCell);
      if (resolved.locationId) {
        currentLocationId = resolved.locationId;
        currentSublocationId = resolved.sublocationId;
        continue;
      }
    }

    // Parse item row
    const cleanRow = row.map(stripFalse);
    if (!cleanRow[1]) continue; // Skip if no name

    const name = cleanRow[1];

    // Skip header rows
    if (name === 'Name' || name === 'Location' || name === 'Instruction') continue;

    const description = cleanRow[2] || undefined;

    // Handle numbered items: if name is just a number, id should be the number and name should be "#number"
    // If name is "#number", id should be just the number
    let id, displayName;
    if (/^\d+$/.test(name)) {
      // Name is just a number (e.g., "1") - Ancient Magic Hotspots
      id = name;
      displayName = `#${name}`;
    } else if (/^#\d+$/.test(name)) {
      // Name is "#number" (e.g., "#1") - Astronomy Tables
      id = name.substring(1);
      displayName = name;
    } else {
      // Regular name
      id = toId(name);
      displayName = name;
    }

    items.push(cleanItem({
      id,
      locationId: currentLocationId,
      sublocationId: currentSublocationId,
      name: displayName,
      description
    }));
  }

  return {
    id: typeId,
    name: typeName,
    items
  };
}

// Parser for Merlin Trials
function parseMerlinTrials() {
  const rows = parseWorksheet('Merlin Trials');
  const items = [];
  const subtypes = new Set();

  // Parse sublocation headers from row 2 (column pairs)
  const sublocationMap = [];
  for (let col = 0; col < rows[1].length; col += 4) {
    if (rows[1][col]) {
      let sublocationId = resolveSublocationId('the-highlands', rows[1][col]);

      // Special case mappings for name variations
      if (!sublocationId && rows[1][col].toLowerCase() === 'north hogwarts') {
        sublocationId = 'north-hogwarts-region';
      }
      if (!sublocationId && rows[1][col].toLowerCase() === 'south hogwarts') {
        sublocationId = 'south-hogwarts-region';
      }

      // Skip non-sublocation columns (like explanation columns)
      if (sublocationId) {
        sublocationMap.push({
          col,
          sublocationId
        });
      }
    }
  }

  // Parse items starting from row 3
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(cell => cell)) continue; // Skip empty rows

    // Process each sublocation column group
    for (const { col, sublocationId } of sublocationMap) {
      const number = row[col + 1];
      const subtype = row[col + 2];

      if (number && subtype) {
        const subtypeId = toId(subtype);
        subtypes.add(JSON.stringify({ id: subtypeId, name: subtype }));

        // Get description from cell comment on the subtype column
        const description = getCellComment('Merlin Trials', i, col + 2);

        items.push(cleanItem({
          id: number,
          subtypeId,
          locationId: 'the-highlands',
          sublocationId,
          name: `#${number}`,
          description
        }));
      }
    }
  }

  return {
    id: 'merlin-trials',
    name: 'Merlin Trials',
    subtypes: Array.from(subtypes).map(s => JSON.parse(s)),
    items
  };
}

// Parser for Field Guide Pages
function parseFieldGuidePages() {
  const rows = parseWorksheet('Field Guide Pages');
  const items = [];
  const subtypes = [
    { id: 'revelio', name: 'Revelio' },
    { id: 'lumos', name: 'Lumos' },
    { id: 'accio', name: 'Accio' },
    { id: 'incendio-confringo', name: 'Incendio/Confringo' },
    { id: 'levioso', name: 'Levioso' }
  ];

  // Row 0 is header: Subtype, Location, Sublocation, Name, Description
  // Data starts from row 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // Skip rows without subtype

    const subtype = row[0];
    const location = row[1];
    const sublocation = row[2];
    const name = row[3];
    const description = row[4];

    if (!name || !name.trim()) continue;

    const subtypeId = subtypes.find(st => st.name === subtype)?.id;
    const locationId = resolveLocationId(location);
    const sublocationId = sublocation ? resolveSublocationId(locationId, sublocation) : undefined;

    if (!subtypeId) throw new Error(`Unknown subtype "${subtype}" in Field Guide Pages at row ${i + 1}`);
    if (!locationId) throw new Error(`Could not resolve location "${location}" in Field Guide Pages at row ${i + 1}`);
    if (sublocation && !sublocationId) throw new Error(`Could not resolve sublocation "${sublocation}" in Field Guide Pages at row ${i + 1}`);

    // Create ID with subtype prefix and optional sublocation suffix for uniqueness
    let itemId = `${subtypeId}-${toId(name)}-${sublocationId}`;

    items.push(cleanItem({
      id: itemId,
      subtypeId,
      locationId,
      sublocationId,
      name: name.trim(),
      description: description || undefined
    }));
  }

  return {
    id: 'field-guide-pages',
    name: 'Field Guide Pages',
    subtypes,
    items
  };
}

// Parser for Demiguise Statues
function parseDemiguiseStatues() {
  const rows = parseWorksheet('Demiguise Statues');
  const items = [];
  let currentLocationId = null;
  let currentSublocationId = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Check for main location headers (no FALSE, just location name in row[0])
    if (row[0] && !row[0].startsWith('FALSE') && (row[0] === 'Hogwarts' || row[0] === 'Hogsmeade' || row[0] === 'Highlands')) {
      currentLocationId = resolveLocationId(row[0]);
      currentSublocationId = null;
      continue;
    }

    // Check for sublocation headers in Hogwarts (starts with "The ")
    if (row[0] && !row[0].startsWith('FALSE') && row[0].startsWith('The ') && !row[1]) {
      currentSublocationId = resolveSublocationId('hogwarts', row[0]);
      continue;
    }

    // Parse item row (has FALSE in row[0], name in row[1], description in row[2])
    const name = stripFalse(row[1]);
    const description = row[2];

    if (name && name.trim()) {
      items.push(cleanItem({
        id: toId(name),
        locationId: currentLocationId,
        sublocationId: currentSublocationId,
        name,
        description: description || undefined
      }));
    }
  }

  return {
    id: 'demiguise-statues',
    name: 'Demiguise Statues',
    items
  };
}

// Parser for Collection Chests
function parseCollectionChests() {
  const rows = parseWorksheet('Collection Chests');
  const items = [];
  const sublocationCounters = {}; // Track counters per sublocation

  // NOTE: Row indices in parsed CSV array (not line numbers in file)
  // Index 0: "Hogwarts - 35"
  // Index 1: Sublocation headers: "Astronomy Wing - 6,,,Bell Tower Wing 6,,,..."
  // Indices 2-14: Hogwarts data (multiline descriptions collapse to fewer rows)
  // Index 15: "Hogsmeade 5"
  // Indices 16-20: Hogsmeade data (no sublocation headers)
  // Index 21: Empty row
  // Index 22: "Highlands 117"
  // Index 23: Highlands sublocation headers
  // Indices 24+: Highlands data

  // Parse Hogwarts section
  const hogwartsLocationId = 'hogwarts';
  const hogwartsHeaderRow = rows[1];
  const hogwartsColumnMap = [];

  for (let col = 0; col < hogwartsHeaderRow.length; col++) {
    if (hogwartsHeaderRow[col]) {
      const header = hogwartsHeaderRow[col];
      const sublocationName = header.replace(/\s*-?\s*\d+\*?$/, '').trim();

      if (sublocationName) {
        let sublocationId = resolveSublocationId(hogwartsLocationId, sublocationName);

        // Special cases for mismatches
        if (!sublocationId && sublocationName.toLowerCase().includes('room of requirement')) {
          sublocationId = 'room-of-requirement';
        }
        if (!sublocationId && sublocationName.toLowerCase() === 'great hall') {
          sublocationId = 'the-great-hall';
        }

        hogwartsColumnMap.push({
          col,
          locationId: hogwartsLocationId,
          sublocationId,
          sublocationName
        });
      }
    }
  }

  // Parse Hogwarts data rows (indices 2-14)
  for (let i = 2; i < 15; i++) {
    const row = rows[i];
    if (!row) continue;

    for (let col = 0; col < row.length; col++) {
      if (row[col] === 'FALSE') {
        const description = row[col + 1];
        if (description && description.trim()) {
          // Find which sublocation this column belongs to
          let columnGroup = null;
          for (let g = 0; g < hogwartsColumnMap.length; g++) {
            const group = hogwartsColumnMap[g];
            const nextGroup = hogwartsColumnMap[g + 1];

            if (col >= group.col && (!nextGroup || col < nextGroup.col)) {
              columnGroup = group;
              break;
            }
          }

          if (columnGroup) {
            const sublocationKey = columnGroup.sublocationId || columnGroup.locationId;
            sublocationCounters[sublocationKey] = (sublocationCounters[sublocationKey] || 0) + 1;
            const counter = sublocationCounters[sublocationKey];

            const isRoR = columnGroup.sublocationName?.includes('Room of Requirement');
            let finalDescription = description;

            if (isRoR) {
              finalDescription = `**Note:** Does not count towards Hogwarts Collection Chests.\n\n${description}`;
            }

            items.push(cleanItem({
              id: `${sublocationKey}-${counter}`,
              locationId: columnGroup.locationId,
              sublocationId: columnGroup.sublocationId,
              name: `#${counter}`,
              description: finalDescription
            }));
          }
        }
      }
    }
  }

  // Parse Hogsmeade section (no sublocations)
  const hogsmeadeLocationId = 'hogsmeade';
  for (let i = 16; i < 21; i++) {
    const row = rows[i];
    if (!row) continue;

    for (let col = 0; col < row.length; col++) {
      if (row[col] === 'FALSE') {
        const description = row[col + 1];
        if (description && description.trim()) {
          sublocationCounters[hogsmeadeLocationId] = (sublocationCounters[hogsmeadeLocationId] || 0) + 1;
          const counter = sublocationCounters[hogsmeadeLocationId];

          items.push(cleanItem({
            id: `${hogsmeadeLocationId}-${counter}`,
            locationId: hogsmeadeLocationId,
            name: `#${counter}`,
            description
          }));
        }
      }
    }
  }

  // Parse Highlands section
  const highlandsLocationId = 'the-highlands';
  const highlandsHeaderRow = rows[23];
  const highlandsColumnMap = [];

  for (let col = 0; col < highlandsHeaderRow.length; col++) {
    if (highlandsHeaderRow[col]) {
      const header = highlandsHeaderRow[col];
      const sublocationName = header.replace(/\s*-?\s*\d+\*?$/, '').trim();

      if (sublocationName) {
        const sublocationId = resolveSublocationId(highlandsLocationId, sublocationName);

        if (sublocationId) {
          highlandsColumnMap.push({
            col,
            locationId: highlandsLocationId,
            sublocationId,
            sublocationName
          });
        }
      }
    }
  }

  // Parse Highlands data rows (indices 24+)
  for (let i = 24; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    for (let col = 0; col < row.length; col++) {
      if (row[col] === 'FALSE') {
        const description = row[col + 1];
        if (description && description.trim()) {
          // Find which sublocation this column belongs to
          let columnGroup = null;
          for (let g = 0; g < highlandsColumnMap.length; g++) {
            const group = highlandsColumnMap[g];
            const nextGroup = highlandsColumnMap[g + 1];

            if (col >= group.col && (!nextGroup || col < nextGroup.col)) {
              columnGroup = group;
              break;
            }
          }

          if (columnGroup) {
            const sublocationKey = columnGroup.sublocationId;
            sublocationCounters[sublocationKey] = (sublocationCounters[sublocationKey] || 0) + 1;
            const counter = sublocationCounters[sublocationKey];

            items.push(cleanItem({
              id: `${sublocationKey}-${counter}`,
              locationId: columnGroup.locationId,
              sublocationId: columnGroup.sublocationId,
              name: `#${counter}`,
              description
            }));
          }
        }
      }
    }
  }

  return {
    id: 'collection-chests',
    name: 'Collection Chests',
    items
  };
}

// Parser for types with subtypes but no locations (like Additional Appearances)
function parseSubtypeOnlyType(sheetName, typeName, typeId, filterSubtype = null) {
  const rows = parseWorksheet(sheetName);
  const items = [];
  const subtypes = [];

  // Find the header row - look for row that has subtype names
  let headerRowIndex = -1;
  let itemStartRow = -1;

  for (let i = 1; i < Math.min(4, rows.length); i++) {
    // Check if this row contains potential subtype headers
    const hasHeaders = rows[i].some(cell => {
      if (!cell || cell.startsWith('FALSE')) return false;
      // Check if it's a substantial text (likely a header)
      return cell.length > 2 && cell !== '0%';
    });

    if (hasHeaders) {
      headerRowIndex = i;
      itemStartRow = i + 1;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn(`Could not find header row in ${sheetName}`);
    return { id: typeId, name: typeName, items: [] };
  }

  // Parse subtype headers - they appear every 3 columns typically
  // Items are always in the column AFTER the header (unless no next column)
  for (let col = 0; col < rows[headerRowIndex].length; col++) {
    const cell = rows[headerRowIndex][col];
    if (cell && !cell.startsWith('FALSE') && cell !== '0%' && cell.trim().length > 0 && (!filterSubtype || cell === filterSubtype)) {
      // Items are in the next column, unless there's no next column
      const itemCol = col + 1 < rows[headerRowIndex].length ? col + 1 : col;

      subtypes.push({
        id: toId(cell),
        name: cell,
        col: itemCol
      });
    }
  }

  // If filtering to single subtype, return without subtypes array (flat list)
  const isSingleSubtype = filterSubtype !== null;

  // Parse items starting from identified start row
  for (let i = itemStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(c => c && c.trim())) continue; // Skip empty rows

    for (const subtype of subtypes) {
      const value = stripFalse(row[subtype.col]);
      if (value && value.trim()) {
        const item = {
          id: toId(value),
          name: value
        };

        // Only add subtypeId if not filtering to single subtype
        if (!isSingleSubtype) {
          item.subtypeId = subtype.id;
        }

        items.push(item);
      }
    }
  }

  const result = {
    id: typeId,
    name: typeName,
    items
  };

  // Only add subtypes if not filtering to single subtype
  if (!isSingleSubtype) {
    result.subtypes = subtypes.map(s => ({ id: s.id, name: s.name }));
  }

  return result;
}

// Parser for Quests
function parseQuests() {
  const rows = parseWorksheet('Quests');
  const items = [];

  // Parse Side Quests (column 5, rows 3-60 which is F4:F61 in Excel)
  for (let i = 3; i <= 60; i++) {
    const row = rows[i];
    const name = stripFalse(row[5]);

    if (name && name.trim() && name !== 'Quest Name') {
      items.push(cleanItem({
        id: toId(name),
        subtypeId: 'side-quests',
        name
      }));
    }
  }

  // Parse Assignments (columns 8-10, rows 3-13 which is I4:K14 in Excel)
  for (let i = 3; i <= 13; i++) {
    const row = rows[i];
    const name = stripFalse(row[8]);
    const requirements = row[9];
    const rewards = row[10];

    if (name && name.trim() && name !== 'Quest Name') {
      let description = '';
      if (requirements && requirements.trim()) {
        description += `**Requirements:** ${requirements}\n\n`;
      }
      if (rewards && rewards.trim()) {
        description += `**Rewards:** ${rewards}`;
      }

      items.push(cleanItem({
        id: toId(name),
        subtypeId: 'assignments',
        name,
        description: description.trim() || undefined
      }));
    }
  }

  return {
    id: 'quests',
    name: 'Quests',
    subtypes: [
      { id: 'side-quests', name: 'Side Quests' },
      { id: 'assignments', name: 'Assignments' }
    ],
    items
  };
}

// Parser for Traits
function parseTraits() {
  const rows = parseWorksheet('Traits');
  const items = [];
  const subtypes = [
    { id: 'exploration', name: 'Exploration', col: 1, reqCol: null },
    { id: 'challenges', name: 'Challenges', col: 4, reqCol: 5 },
    { id: 'quests', name: 'Quests', col: 8, reqCol: null }
  ];

  // Parse items starting from row 3
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(c => c && c.trim())) continue;

    for (const subtype of subtypes) {
      const name = stripFalse(row[subtype.col]);

      if (name && name.trim() && name !== 'Trait' && name !== 'Challenge') {
        const item = {
          id: toId(name),
          subtypeId: subtype.id,
          name
        };

        // Add requirement as description if available
        if (subtype.reqCol !== null && row[subtype.reqCol]) {
          item.description = row[subtype.reqCol];
        }

        items.push(item);
      }
    }
  }

  return {
    id: 'traits',
    name: 'Traits',
    subtypes: subtypes.map(s => ({ id: s.id, name: s.name })),
    items
  };
}

// Parser for Enemies
function parseEnemies() {
  const rows = parseWorksheet('Enemies');
  const items = [];
  const subtypes = [];
  let currentSubtype = null;

  // Column 1 has names, Column 2 has location, Column 3 has quest
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const col0 = row[0];
    const col1 = row[1];
    const col2 = row[2];

    // Check for subtype headers
    // Pattern 1: Subtype in column 0, no column 1 (e.g., "Dugbog")
    // Pattern 2: Column 0 is "0%" or "0", subtype in column 1, no column 2 (e.g., "Infamous Foe")
    let subtypeHeader = null;

    if (col0 && !col0.startsWith('FALSE') && col0 !== '0%' && col0 !== '0' && !col1) {
      // Pattern 1: Standard subtype header
      subtypeHeader = col0;
    } else if ((col0 === '0%' || col0 === '0') && col1 && !col1.startsWith('FALSE') && !col2) {
      // Pattern 2: 0% or 0 in col 0, subtype in col 1, no col 2
      subtypeHeader = col1.trim();
    }

    if (subtypeHeader) {
      // This is a subtype header
      currentSubtype = {
        id: toId(subtypeHeader),
        name: subtypeHeader
      };

      // Only add if not already in subtypes
      if (!subtypes.find(s => s.id === currentSubtype.id)) {
        subtypes.push(currentSubtype);
      }
      continue;
    }

    // Parse item
    const name = stripFalse(row[1]);
    const location = row[2];
    const quest = row[3];

    if (name && name.trim() && name !== 'Name' && currentSubtype) {
      let description = '';
      if (location) description += `**Location:** ${location}\n\n`;
      if (quest) description += `**Quest:** ${quest}`;

      items.push(cleanItem({
        id: toId(name),
        subtypeId: currentSubtype.id,
        name,
        description: description.trim() || undefined
      }));
    }
  }

  return {
    id: 'enemies',
    name: 'Enemies',
    subtypes,
    items
  };
}

// Parser for Ancient Magic Enemies
function parseAncientMagicEnemies() {
  const rows = parseWorksheet('Enemies');
  const items = [];
  const subtypes = [];
  let currentSubtype = null;

  // Ancient Magic Enemies section starts at column 5
  // Column 6 has names, Column 7 has location
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const firstCell = row[5];

    // Check for subtype headers
    if (firstCell && !firstCell.startsWith('FALSE') && firstCell !== '#NAME?' && !row[6]) {
      currentSubtype = {
        id: toId(firstCell),
        name: firstCell
      };

      if (!subtypes.find(s => s.id === currentSubtype.id)) {
        subtypes.push(currentSubtype);
      }
      continue;
    }

    // Parse item
    const name = stripFalse(row[6]);
    const location = row[7];

    if (name && name.trim() && name !== 'Name' && currentSubtype) {
      items.push(cleanItem({
        id: toId(name),
        subtypeId: currentSubtype.id,
        name,
        description: location || undefined
      }));
    }
  }

  return {
    id: 'ancient-magic-enemies',
    name: 'Ancient Magic Enemies',
    subtypes,
    items
  };
}

// Parser for Brooms
function parseBrooms() {
  const rows = parseWorksheet('Brooms');
  const items = [];
  const subtypes = [
    { id: 'vendor', name: 'Vendor' },
    { id: 'challenges', name: 'Challenges' }
  ];

  // Row 1 has "Vendor" in col 0, "Challenges" in col 5
  // Row 2 has column headers
  // Row 3 onwards has data

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(c => c && c.trim())) continue; // Skip empty rows

    // Vendor broom (columns 0-3)
    const vendorName = stripFalse(row[1]);
    if (vendorName && vendorName.trim()) {
      const from = row[2];
      const cost = row[3];
      let description = '';
      if (from) description += `**From:** ${from}`;
      if (cost) {
        if (description) description += '\n\n';
        description += `**Cost:** ${cost}`;
      }

      items.push(cleanItem({
        id: toId(vendorName),
        subtypeId: 'vendor',
        name: vendorName,
        description: description || undefined
      }));
    }

    // Challenge broom (columns 6-8)
    const challengeName = stripFalse(row[6]);
    if (challengeName && challengeName.trim()) {
      const from = row[7];
      const cost = row[8];
      let description = '';
      if (from) description += `**From:** ${from}`;
      if (cost) {
        if (description) description += '\n\n';
        description += `**Cost:** ${cost}`;
      }

      items.push(cleanItem({
        id: toId(challengeName),
        subtypeId: 'challenges',
        name: challengeName,
        description: description || undefined
      }));
    }
  }

  return {
    id: 'brooms',
    name: 'Brooms',
    subtypes,
    items
  };
}

// Parser for Appearances
function parseAppearances() {
  const rows = parseWorksheet('Appearances');
  const items = [];
  const subtypes = [
    { id: 'challenges', name: 'Challenges' },
    { id: 'quests', name: 'Quests' },
    { id: 'additional-content', name: 'Additional Content' },
    { id: 'exploration', name: 'Exploration' }
  ];

  // Row 1 has subtype headers at specific columns
  // Row 2 onwards has items (FALSE prefix in col, name in col+1)
  const subtypeColumns = [
    { col: 1, subtypeId: 'challenges' },
    { col: 4, subtypeId: 'quests' },
    { col: 7, subtypeId: 'additional-content' },
    { col: 10, subtypeId: 'exploration' }
  ];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(c => c && c.trim())) continue; // Skip empty rows

    for (const { col, subtypeId } of subtypeColumns) {
      const name = stripFalse(row[col]);
      if (name && name.trim()) {
        items.push(cleanItem({
          id: toId(name),
          subtypeId,
          name
        }));
      }
    }
  }

  return {
    id: 'appearances',
    name: 'Appearances',
    subtypes,
    items
  };
}

// Main parser
console.log('Parsing collectibles from Excel workbook...\n');

const collectibles = [];

// Simple location-based types
console.log('Parsing Ancient Magic Hotspots...');
collectibles.push(parseSimpleLocationType('Ancient Magic Hotspots', 'Ancient Magic Hotspots', 'ancient-magic-hotspots'));

console.log('Parsing Astronomy Tables...');
collectibles.push(parseSimpleLocationType('Astronomy Tables', 'Astronomy Tables', 'astronomy-tables'));

console.log('Parsing Balloons...');
collectibles.push(parseSimpleLocationType('Balloons', 'Balloons', 'balloons'));

console.log('Parsing Butterflies...');
collectibles.push(parseSimpleLocationType('Butterflies', 'Butterflies', 'butterflies'));

console.log('Parsing Daedalian Keys...');
collectibles.push(parseSimpleLocationType('Daedalian Keys', 'Daedalian Keys', 'daedalian-keys'));

console.log('Parsing Landing Platforms...');
collectibles.push(parseSimpleLocationType('Landing Platforms', 'Landing Platforms', 'landing-platforms'));

// Complex types
console.log('Parsing Merlin Trials...');
collectibles.push(parseMerlinTrials());

console.log('Parsing Field Guide Pages...');
collectibles.push(parseFieldGuidePages());

console.log('Parsing Demiguise Statues...');
collectibles.push(parseDemiguiseStatues());

console.log('Parsing Collection Chests...');
collectibles.push(parseCollectionChests());

console.log('Parsing Additional Appearances...');
collectibles.push(parseSubtypeOnlyType('Sheet17', 'Additional Appearances', 'additional-appearances'));

// Beasts, Ingredients, Tools (split into 3 types)
console.log('Parsing Ingredients...');
collectibles.push(parseSubtypeOnlyType('Beasts, Ingredients, Tools', 'Ingredients', 'ingredients', 'Ingredients'));

console.log('Parsing Beasts...');
collectibles.push(parseSubtypeOnlyType('Beasts, Ingredients, Tools', 'Beasts', 'beasts', 'Beasts'));

console.log('Parsing Tools...');
collectibles.push(parseSubtypeOnlyType('Beasts, Ingredients, Tools', 'Tools', 'tools', 'Tools'));

console.log('Parsing Wand Handles...');
collectibles.push(parseSubtypeOnlyType('Wand Handles', 'Wand Handles', 'wand-handles'));

console.log('Parsing Conjurations...');
collectibles.push(parseSubtypeOnlyType('Conjurations', 'Conjurations', 'conjurations'));

console.log('Parsing Quests...');
collectibles.push(parseQuests());

console.log('Parsing Traits...');
collectibles.push(parseTraits());

console.log('Parsing Enemies...');
collectibles.push(parseEnemies());

console.log('Parsing Ancient Magic Enemies...');
collectibles.push(parseAncientMagicEnemies());

console.log('Parsing Brooms...');
collectibles.push(parseBrooms());

console.log('Parsing Appearances...');
collectibles.push(parseAppearances());

// Write output
const outputPath = join(__dirname, '../../src/lib/data/collectibles.json');
writeFileSync(outputPath, JSON.stringify(collectibles, null, 2), 'utf8');

console.log(`\n✓ Generated collectibles.json with ${collectibles.length} types`);
console.log(`✓ Total items: ${collectibles.reduce((sum, type) => sum + type.items.length, 0)}`);
