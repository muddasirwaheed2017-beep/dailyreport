# CNC Electric — Electrical Load Calculator
## Run this in Claude Code: `claude "read load-calculator.md and build it"`

## What to build
An interactive Electrical Load Calculator as a single HTML file. Users enter their home appliances, and the tool calculates total load, recommended MCB rating, DB box size, and wire gauge — with clickable links to CNC Electric products.

## Design
- White background, Red (#DC2626) accent buttons and headers
- Black text, Grey (#F3F4F6) input cards
- Mobile responsive, clean, professional
- CNC Electric branding in footer

## Appliance Inputs (with +/- stepper buttons)
| Appliance | Default | Watts Each |
|-----------|---------|------------|
| Split AC 1.5 ton | 0 | 1,500W |
| Split AC 1 ton | 0 | 1,100W |
| Ceiling Fan | 4 | 75W |
| LED Light | 8 | 15W |
| Energy Saver | 0 | 25W |
| Refrigerator | 1 | 350W |
| Washing Machine | 0 | 500W |
| Iron | 1 | 1,000W |
| Geyser/Water Heater | 0 | 2,000W |
| Microwave | 0 | 1,000W |
| TV/Computer | 2 | 150W |
| Water Motor/Pump | 0 | 750W |
| Custom Load (manual watts) | 0 | user enters |

## Calculations
- Total Load (W) = sum of all appliances
- Total Current (A) = Total Load / 220
- Safety Factor Load = Total Load × 1.25
- Safety Factor Current = Safety Factor Load / 220

## Recommendations with Product Links
1. **Main MCB Rating**: Next standard size UP from safety factor current
   - Standard sizes: 6A, 10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, 100A
   - Link: "Shop CNC MCB Breakers → https://www.cncelectric.pk/collections/circuit-breakers"

2. **DB Box Size**: Based on number of circuits needed
   - Up to 4 circuits → 4-way DB box
   - 5-8 circuits → 8-way
   - 9-12 → 12-way
   - 13-16 → 16-way
   - Link: "Shop CNC DB Boxes → https://www.cncelectric.pk/collections/db-boxes"

3. **Wire Gauge** (for main feed):
   - Up to 15A → 2.5mm²
   - 16-25A → 4mm²
   - 26-32A → 6mm²
   - 33-45A → 10mm²
   - 46-63A → 16mm²
   - Link: reference only

4. **Always recommend**: "Add Surge Protection (SPD) for complete safety"
   - Link: "Shop CNC SPD → https://www.cncelectric.pk/collections/spd"

5. **If any AC selected**: "Protect your AC with a Voltage Protector"
   - Link: "Shop Voltage Protectors → https://www.cncelectric.pk/collections/voltage-protectors"

## Footer
"Free tool by CNC Electric Pakistan — Pakistan's authorized CNC brand distributor"
"www.cncelectric.pk"

## Technical Requirements
- Single HTML file (no external dependencies except maybe a font CDN)
- Works offline after loading
- Embeddable via iframe (add appropriate meta tags)
- SEO meta tags: title, description, keywords about electrical load calculation Pakistan
- Print-friendly results section
