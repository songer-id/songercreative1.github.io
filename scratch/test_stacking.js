// Let's test CSS stacking context rules
console.log('Testing CSS Stacking Context rules...');
// In standard CSS (CSS 2.1 / CSS Stacking Context spec):
// If Sibling A (header) has z-index: 40 (and establishes a stacking context)
// And Sibling B (main) has position: relative without a z-index (z-index: auto) or overflow: hidden:
// If B does NOT establish a stacking context, then its positioned descendants (with position: fixed, z-index: 90)
// are stacked in the stacking context of the common ancestor!
// BUT IF Sibling B or ANY ancestor establishes a stacking context:
// (for example, if main or its ancestor has:
// - opacity < 1
// - transform !== none
// - filter !== none
// - will-change
// - isolation: isolate
// - contain: paint/layout
// - OR if B itself is a flex item with z-index: 0 or non-auto)
// THEN Sibling B forms a stacking context with z-index <= 0, and NOTHING inside B can ever appear above Sibling A (z-index 40)!

