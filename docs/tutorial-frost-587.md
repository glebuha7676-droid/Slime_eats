# Tutorial, portal and frost — 587

- Removed tutorial dim panels and lesson/dodge backdrops, including the laboratory backdrop while a tutorial cue is active. Kept input rules and lesson timing.
- Kept the outline yellow (#ffdc24) with a contrasting blue edge (#14618c); it pulses in opacity instead of changing hue. Cleaned the shared mint/cyan buttons and blue card edges without recolouring artwork.
- Re-measure the tutorial target after the laboratory tab's 220 ms entrance finishes and after parent modal entrance animations. The Choose outline has equal 6 px padding and coincident centre on mobile and desktop.
- Portal layers now derive their size and position from the frame PNG's transparent opening (600 × 499, opening x=121..477, y=70..408). They share one ellipse and adapt to both 232 px and 208 px frame sizes. Removed rotation of the rim highlight, which misaligned its ellipse.
- Render plasma veins after the snow reveal. Snow/snowflake transformation retains the original resource tier and value, including +5 on weak frozen blocks.
- Passed frost vein/reward, tutorial descent, Glitch rewrite/reward, runtime closure and release syntax checks. Built the Yandex release 587.
