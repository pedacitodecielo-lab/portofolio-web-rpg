# The Data Tavern — Interactive RPG Portfolio 

A 16-bit-styled tavern game built as an interactive portfolio. Walk into the bar, talk to Emelio the bartender, browse the job board, take the resume from the bookshelf, pick up the telephone to contact him.

## Controls

- **WASD** or **arrow keys** — walk
- **E** or **SPACE** — interact / advance dialog
- **I** — open / close inventory (your "journal")
- **ESC** — close any open panel
- **Tab** (in inventory) — switch between Character / Journal / Stats

## How to play

1. Click "Press to Enter" on the boot screen
2. You spawn in the middle of the tavern as a cyan-shirted character
3. Walk up to Emelio at the bar (the figure labeled "EMELIO")
4. Press **E** when you see the "Talk to Emelio" prompt
5. Use arrow keys + E to navigate dialog choices

## Interactable objects

- **Emelio (bartender)** — full conversation tree about work, toolkit, current status, hiring
- **Job board (left wall)** — opens inventory to browse all achievements
- **Bookshelf (right wall)** — downloads resume PDF
- **Telephone (on bar counter)** — email, LinkedIn, or phone number
- **Picture frames (bottom wall)** — flavor text describing photographs

## File structure

- `index.html` — game shell
- `style.css` — pixel art rendering and UI
- `script.js` — game engine (movement, dialog, inventory)
- `data.json` — all your content
- `assets/` — your photo and project images
- `Emelio_Exaudi_Resume.pdf` — linked from the bookshelf

## Editing content

All conversations, achievements, skills, and contact info live in `data.json`.

### Changing what Emelio says

The dialog tree is hardcoded in `script.js`. Look for the functions:
- `bartenderDialog()` — opening lines and main menu
- `workMenu()` — work history submenu
- `toolkitChat()` — tools and tech stack
- `nowChat()` — current status
- `hireChat()` — hiring info
- `backToMenu()` — the "anything else?" prompt that appears after each topic

Each block returns an array of dialog steps. To add a new topic, copy one of the existing chat functions and add a new choice in `backToMenu()` and `bartenderDialog()`.

### Adding a new achievement

Add a block to `achievements[]` in `data.json` exactly as before. It will appear automatically in the Journal tab of the inventory.

### Adding a new interactable object

In `script.js`, find the `MAP` array near the top. Each character is one tile. The legend is in a comment above the array. Add a new symbol to a free spot in the map, then handle it in the parser below.

## Deploying

Drag the folder onto Vercel, Netlify, or GitHub Pages. No build step.

## Mobile behavior

Mobile users get a clean conventional list view. The interactive tavern is desktop-only — game-like portfolios don't work well with touch + small screens.

## Known limitations

This is CSS-rendered pixel art, not real sprite art. Characters and objects are built from gradients and box-shadows. It reads as "retro" rather than as "Octopath Traveler quality." If you want polished sprite art later, hire a pixel artist to draw real sprite sheets and replace the CSS objects with `background-image` calls.

## Honest note

This is the most distinctive portfolio I can build in one session. Whether a PwC recruiter loves it or finds it unprofessional is outside anyone's control. The mobile fallback gives them an out if they want to skip the game. Either way, **the showcase tiles inside the achievement detail modal are still empty placeholders** — screenshot your real work and replace them in `data.json` before sending this to anyone.
