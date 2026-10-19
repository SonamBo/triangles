# Art prompts for Triangles – Cats vs Dogs

Prompts for Gemini (or any image model). Generate a few, pick the best, and send them to Claude in chat. Claude crops and sizes them, makes every Android icon size, cuts out characters and switches the art on in the game.

## How to get matching art

1. **Attach a reference** to every Gemini message: the Cash Paws cat `www/img/cat-hero.png` (and `www/games/triangles/img/hero-dog.png` once a real dog exists). Gemini then copies the style.
2. **Start every prompt with the style block** below.
3. **Never ask for text.** Image models spell badly. Claude adds the real "Triangles – Cats vs Dogs" lettering afterwards.

### Style block

> Flat vector kawaii mobile-game illustration in the same style as the attached cat. Thick dark-brown outlines (#3b2a1e), soft cel shading, rounded friendly shapes, rosy cheeks on characters, gentle warm light. Clean and uncluttered, like a cosy casual puzzle game for all ages. No text, no letters, no numbers, no logos, no watermark.

Team colours used everywhere: **cats orange `#f2a043`**, **dogs blue `#4a80c4`**, lawn greens `#deeaba` / `#c9d6a4`, cream `#fbf7f0`.

---

## 1. For the Play Store (do these first)

### App icon — square

> [style block] A square mobile game app icon, full bleed with no rounded corners and no border. Soft plain sage-green background (#deeaba). In the centre, a big chunky triangle with rounded corners and a dot at each corner, split into an orange half (#f2a043) and a blue half (#4a80c4). A cute grey-and-white cat face peeks over the left side of the triangle and a cute tan-and-white beagle face peeks over the right side, looking at each other with playful rivalry. Everything important sits inside the middle 65% of the square; the outer edge is only background. Bold, simple shapes that still read at a tiny size.

Ask for **1:1, as large as Gemini allows**. Tips: if the faces come out too small, say "bigger faces, filling more of the icon". Pick one that still reads when you shrink it to the size of a fingertip.

### Feature graphic — wide banner

> [style block] A wide landscape banner, 2:1. A sunny cartoon backyard lawn seen from slightly above. On the left, a cheerful grey-and-white cat stands with both paws raised; on the right, a cheerful tan-and-white beagle stands with both paws raised, as friendly rivals. On the grass between them, a few white dots joined by thin dark lines into small triangles, some filled orange (#f2a043) and some filled blue (#4a80c4). Keep the top-centre third of the image calm and empty sky or grass, for a title to be added later. Soft lawn greens, cream and warm light.

Ask for **wide 2:1 (or 16:9)**. Claude crops it to Play's 1024 × 500 and puts the game's title lettering in the empty space.

---

## 2. The dogs (replaces the placeholder dogs in the game)

One image per dog: **three heads in a row on a plain pure-white background**, the same size and spacing, each a face only (head and ears, no body). Left: happy. Middle: thinking. Right: sad.

> [style block] Character sheet of [DOG] the dog, three head-only portraits side by side on a plain pure white background, same size and evenly spaced: left happy with eyes closed in a smile and a small pink tongue, middle thinking with eyes looking up to the side, right sad with droopy brows and a tiny teardrop. Chibi proportions, big round head, matching the style of the attached cute kawaii cat.

Use these for [DOG]:
- **Rex:** a tan-and-white beagle with long floppy brown ears and a white stripe down the middle of his face.
- **Bruno:** a chunky fawn-grey bulldog with small folded ears and a wrinkled brow.
- **Daisy:** a golden retriever with soft wavy golden ears.
- **Pip:** a grey-and-white husky with upright ears and a white face mask.
- **Dotty:** a white dalmatian with black spots and black floppy ears.
- **Pup:** a tiny cream-coloured puppy with soft ears (for the tutorial). Make its middle face sleepy, eyes closed in two straight lines.

Then **Rex in full**, for the lobby and the win screen (Team Dog's hero, like the cat on the Cash Paws lobby):

> [style block] Rex, a cute chibi tan-and-white beagle with long floppy brown ears, full body, sitting happily with one front paw raised in a wave, on a plain pure white background. Same character as the attached sheet.

And all five grown-up dogs cheering, for the win screen:

> [style block] Five cute chibi dogs side by side on a plain pure white background, each cheering with both front paws raised and a big happy smile, evenly spaced, same size: a beagle, a bulldog, a golden retriever, a husky, a dalmatian.

---

## 3. Zone backgrounds (5 images)

Portrait **9:16**, as large as Gemini allows. The game draws the map path and the dot board over the **middle**, so the middle must stay calm and low-detail. Put the interesting things at the edges, top and bottom. Keep colours soft and slightly muted so white cards and dark dots stay readable on top. No animals or people.

**The Backyard** (levels 1–10)
> [style block] A cosy suburban backyard seen from slightly above, as a vertical phone wallpaper. Soft light-green lawn with faint mowing stripes filling the middle. Around the edges: a wooden fence along the top, a red-roofed doghouse in one corner, a small flower bed with pink and white flowers, a chewed ball, a garden gnome, scattered faint paw prints. The centre of the image is open, plain lawn with very little detail. Palette: sage and grass greens, cream, warm wood brown.

**The Park** (levels 11–20)
> [style block] A sunny city park seen from slightly above, as a vertical phone wallpaper. Gentle grassy slopes with a winding cream footpath. Around the edges: round leafy trees, a park bench, a lamp post, a small pond with lily pads at the bottom, a picnic blanket with a basket of round golden cookies. The centre is open grass with very little detail. Palette: fresh spring greens, cream path, golden cookie accents.

**Rainy Lane** (levels 21–30)
> [style block] A quiet residential lane after a light rain, seen from slightly above, as a vertical phone wallpaper. Damp pale-blue-grey cobbles and pavement with shallow round puddles reflecting the sky. Around the edges: houses with colourful front doors, an umbrella leaning on a wall, rain boots, a drain pipe, soft grey-blue clouds at the top with a hint of rainbow. The centre is open, plain wet pavement with very little detail. Palette: soft blue-greys, puddle blues, a few warm door colours.

**Fence Row** (levels 31–40)
> [style block] A sunny countryside lane lined with wooden picket fences, seen from slightly above, as a vertical phone wallpaper. Warm sandy-beige ground. Around the edges: sections of wooden fence, tall sunflowers, a wooden gate, hay bales, a mailbox. The centre is open sandy ground with very little detail. Palette: warm sand, honey wood, sunflower yellow, olive green.

**Night Garden** (levels 41–50)
> [style block] A magical garden at night, seen from slightly above, as a vertical phone wallpaper. Deep navy-blue lawn and sky. Around the edges: dark hedges, glowing paper lanterns, a crescent moon and soft stars at the top, a few glowing yellow fireflies, moonflowers. The centre is open, plain dark lawn with very little detail and no bright spots. Palette: deep navy and indigo, soft moonlight blue, warm firefly yellow.

---

## What happens to each image

| Image | Becomes |
|---|---|
| App icon | Every Android launcher size (`mipmap-*`), the adaptive icon, and `play-assets/play-icon-512.png` |
| Feature graphic | `play-assets/feature-graphic.png`, 1024 × 500 with the title lettering |
| Dog sheets | `www/games/triangles/img/dog-<name>-<mood>.png`, replacing the drawn placeholders |
| Rex in full, dogs cheering | Team Dog's lobby picture and win screen |
| Zone backgrounds | `www/games/triangles/img/bg-<zone>.jpg`, switched on in `art.js` |

After the art is in, Claude re-takes the store screenshots so they show it.
