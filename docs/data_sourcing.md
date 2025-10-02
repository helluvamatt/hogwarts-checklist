# Data Sourcing

This document describes how collectible data was sourced and processed for the Hogwarts Legacy Checklist application.

## Source Data

All collectible data was extracted from the Excel workbook located at:
```
references/Hogwarts Legacy Completion Checklist.xlsx
```

## Data Extraction Process

The parser script reads directly from the Excel workbook and generates the structured JSON data:

```bash
cd references/scripts
npm install
npm run parse-collectibles
```

This generates `src/lib/data/collectibles.json` containing all collectible types and items.

The parser reads worksheets directly from the Excel file using the `xlsx` library, eliminating the need for intermediate CSV conversion.

## Collectible Types

The parser currently processes **22 collectible types** with **1,336 total items**:

### Types Without Subtypes

- [X] **Ancient Magic Hotspots**: 20 items
- [X] **Astronomy Tables**: 14 items
- [X] **Balloons**: 32 items
- [X] **Butterflies**: 15 items
- [X] **Daedalian Keys**: 16 items
- [X] **Landing Platforms**: 20 items
- [X] **Demiguise Statues**: 30 items
- [X] **Collection Chests**: 168 items total (156 collectible + 12 Room of Requirement)
- [X] **Ingredients**: 16 items
- [X] **Beasts**: 13 items
- [X] **Tools**: 10 items

### Types With Subtypes
- [X] **Merlin Trials**: 95 items, 9 subtypes (Jumping, Lumos, Incendio, Confringo, Depulso, Reparo, Flipendo, Basic Cast, Accio)
- [X] **Field Guide Pages**: 239 items, 5 subtypes (Revelio, Lumos, Accio, Incendio/Confringo, Levioso)
  - 153 in Hogwarts (150 + 3 extras)
  - 55 in Hogsmeade
  - 31 in Highlands
- [X] **Additional Appearances**: 114 items, 4 subtypes (Handwear, Facewear, Headwear, Neckwear)
- [X] **Wand Handles**: 42 items, 2 subtypes (Exploration, Quests)
- [X] **Conjurations**: 140 items, 4 subtypes (Exploration, Quests, Vendor, Challenges)
- [X] **Quests**: 69 items, 2 subtypes (58 Side Quests, 11 Assignments)
- [X] **Traits**: 75 items, 3 subtypes (Exploration: 50, Challenges: 24, Quests: 1)
- [X] **Enemies**: 70 items, 10 subtypes (Dugbog, Ashwinder, Poacher, Loyalist, Infamous Foe, Spiders, Pensieve, Trolls, Mongrels, Other)
- [X] **Ancient Magic Enemies**: 34 items, 8 subtypes (Dugbog, Ashwinder, Poacher, Loyalist, Venomous Spider, Thornback Spider, Troll, Other)
- [X] **Brooms**: 13 items, 2 subtypes (Vendor, Challenges)
- [X] **Appearances**: 91 items, 4 subtypes (Challenges, Quests, Additional Content, Exploration)

## Data Schema

Each collectible type conforms to the `CollectibleType` schema defined in `src/lib/models/CollectibleType.ts`:

```typescript
type CollectibleType = {
  id: string              // kebab-case identifier
  name: string            // Display name
  subtypes?: [],          // Optional array of subtypes
  items: [
    {
      id: string          // kebab-case identifier (# format preserved for numbered items)
      name: string        // Display name
      subtypeId?: string  // Reference to subtype if applicable
      locationId?: string // Reference to location from locations.json
      sublocationId?: string // Reference to sublocation from locations.json
      description?: string // Markdown-formatted description
    }
  ]
}
```

## Location Resolution

Location and sublocation IDs are resolved from `src/lib/data/locations.json` which defines the hierarchical structure:
- **Hogwarts** (6 sublocations)
- **Hogsmeade** (3 sublocations)
- **The Highlands** (10 sublocations)

The parser automatically resolves location names from the worksheets to their corresponding IDs.

## Parser Features

The parser (`references/scripts/parse-collectibles.js`) handles:

1. **Direct Excel reading**: Reads worksheets directly from the Excel workbook using the `xlsx` library
2. **Cell comments extraction**: Reads Excel cell comments as descriptions (e.g., Merlin Trials)
3. **Merged cell detection**: Identifies and filters chapter headings/organizational rows (e.g., Quests)
4. **Line ending normalization**: Converts `\r\n` to `\n` in all description fields
5. **Variable worksheet structures**: Different worksheets have different layouts
6. **Location/sublocation resolution**: Maps location names to IDs from locations.json
7. **Markdown formatting**: Generates Markdown descriptions for complex data (e.g., Quest requirements/rewards)
8. **Checkbox state removal**: Strips "FALSE" prefixes from Excel checkbox columns
9. **Subtype detection**: Intelligently detects subtype headers across different worksheet formats
10. **Enemies**: Separate parsers for "Enemies" and "Ancient Magic Enemies"

## Special Cases

### Field Guide Pages
- Single worksheet with simple tabular structure
- Columns: Subtype, Location, Sublocation, Name, Description
- Each row represents one Field Guide Page item
- Subtype values: Revelio, Lumos, Accio, Incendio/Confringo, Levioso
- Location and sublocation names are resolved to IDs from locations.json
- Successfully parses all 239 items (153 Hogwarts + 55 Hogsmeade + 31 Highlands)

### Beasts, Ingredients, Tools
- Single worksheet split into 3 separate collectible types
- No subtypes in output (flat lists)

### Quests
- **Main Quests excluded**: Story is linear, so main quest completion is tracked by story progress, not a checklist
- **Side Quests**: Parsed from column F (column 5), rows 4-61
  - Simple list of quest names only
  - 58 total side quests
- **Assignments**: Parsed from columns I-K (columns 8-10), rows 4-14
  - Includes Requirements and Rewards
  - Formatted as Markdown: `**Requirements:** X\n\n**Rewards:** Y`
  - 11 total assignments (professor assignments for spell unlocks)

### Enemies
- Two separate types from single worksheet
- Different column layouts for "All Enemies" vs "Ancient Magic Enemies" sections
- Detects subtype headers in multiple formats:
  - Pattern 1: subtype name in column 0, no column 1 (e.g., "Dugbog", "Spiders")
  - Pattern 2: "0%" or "0" in column 0, subtype name in column 1, no column 2 (e.g., "Infamous Foe")
- 10 subtypes total including "Infamous Foe" (23 items)
- Loyalist subtype reduced from 29 to 5 items (24 moved to Infamous Foe)

### Demiguise Statues, Collection Chests, Daedalian Keys
- Multi-line descriptions in worksheets properly preserved
- Parser filters out header rows (e.g., "Location", "Name", "Instruction")

### Collection Chests
- Column-based structure with multiple sublocation groups per row
- Filters out Room of Requirement chests (identified by "Biome:" in description)
- Currently 162 items (target 156 - 6 over, needs investigation)

### Brooms
- Two subtypes split across columns (Vendor and Challenges)
- From and Cost information formatted as Markdown in description field
- Format: `**From:** X\n\n**Cost:** Y`

### Appearances
- Distinct from "Additional Appearances" type
- Four subtypes across column groups (Challenges, Quests, Additional Content, Exploration)
- Simple name-only items without additional metadata

## Updating Data

To regenerate collectibles.json from updated source data:

1. Update the Excel workbook at `references/Hogwarts Legacy Completion Checklist.xlsx`
2. Run the parser: `cd references/scripts && npm run parse-collectibles`
3. The updated `src/lib/data/collectibles.json` is ready to use

The parser is idempotent and can be run multiple times safely.
