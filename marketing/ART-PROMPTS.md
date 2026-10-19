# Art prompts for Triangles – Cats vs Dogs

Prompts for Gemini (or any image model) to replace the placeholder art. Paste the **style block** at the start of every prompt so all images match each other and the Cash Paws cats.

Generate, pick the best, then send the images to Claude in chat. Claude crops, sizes and cuts them out, adds them to `www/games/triangles/img/` and switches them on (`art.js` for backgrounds, `levels.js` for characters).

## Style block (start every prompt with this)

> Flat vector kawaii mobile-game illustration. Thick dark-brown outlines (#3b2a1e), soft cel shading, rounded friendly shapes, rosy cheeks on characters, gentle warm light. Clean and uncluttered, like a cosy casual puzzle game for all ages. No text, no letters, no numbers, no logos, no watermark.

## 1. Zone backgrounds (5 images)

Portrait **9:16**, at least 1080 × 1920. The game draws its map path and the dot board over the **middle**, so the middle must stay calm and low-detail. Put the interesting things at the edges, top and bottom. Keep colours soft and slightly muted so white cards and dark dots stay readable on top. No animals or people in the scene.

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

## 2. The dogs (replaces the placeholder dogs)

One image per dog: **three heads in a row on a plain pure-white background**, the same size and spacing, each a face only (head and ears, no body). Left: happy, eyes closed in a smile, little pink tongue. Middle: thinking, eyes open and looking up to one side, small neutral mouth. Right: sad, droopy eyebrows, small frown, one tiny teardrop.

> [style block] Character sheet of [DOG] the dog, three head-only portraits side by side on a plain pure white background, same size and evenly spaced: left happy with eyes closed in a smile and a small pink tongue, middle thinking with eyes looking up to the side, right sad with droopy brows and a tiny teardrop. Chibi proportions, big round head, matching the style of cute kawaii cat mascots.

Use these for [DOG]:
- **Rex:** a tan-and-white beagle with long floppy brown ears and a white stripe down the middle of his face.
- **Bruno:** a chunky fawn-grey bulldog with small folded ears and a wrinkled brow.
- **Daisy:** a golden retriever with soft wavy golden ears.
- **Pip:** a grey-and-white husky with upright ears and a white face mask.
- **Dotty:** a white dalmatian with black spots and black floppy ears.
- **Pup:** a tiny cream-coloured puppy with soft ears (for the tutorial). Make its middle face sleepy, eyes closed in two straight lines, with "zzz" drawn as small shapes, not letters.

Then one more image with all five grown-up dogs cheering, arms up, for the win screen, matching the existing cats' cheer pose:

> [style block] Five cute chibi dogs side by side on a plain pure white background, each cheering with both front paws raised and a big happy smile, evenly spaced, same size: a beagle, a bulldog, a golden retriever, a husky, a dalmatian.

## 3. Store and lobby art (optional, for later)

**App icon** (1024 × 1024, square):
> [style block] App icon: a cute beagle face and a cute calico cat face peeking from either side of a big rounded orange-and-blue triangle, on a soft green background. Bold, simple, readable at small sizes.

**Feature graphic** (1024 × 500, wide):
> [style block] Wide banner: a backyard lawn with dots joined by lines into orange and blue triangles; a calico cat cheering on the left, a beagle cheering on the right, playful rivalry. Leave clear space in the middle-top for a title to be added later.
