# Additional Performance Optimization Tips

## Image Optimization

Consider further optimizing your images:

1. **Resize and compress images** to appropriate dimensions
   - Use WebP format with progressive loading for better performance
   - Consider adding `srcset` for responsive images

2. **Lazy load background images**
   ```js
   // Example helper function to add to your codebase
   function lazyLoadBackgroundImage(element, imageSrc) {
     const img = new Image();
     img.onload = () => {
       element.style.backgroundImage = `url(${imageSrc})`;
       element.classList.add('bg-loaded');
     };
     img.src = imageSrc;
   }
   ```

## ScrollTrigger Best Practices

1. **Use markers in development**
   - Add `markers: true` to ScrollTrigger config during development
   - Helpful for debugging timing issues

2. **Leverage batch processing**
   ```js
   // Example: Process animations in batches
   ScrollTrigger.batch(".animate-item", {
     onEnter: batch => gsap.to(batch, {opacity: 1, stagger: 0.15}),
     once: true
   });
   ```

## Animation Performance

1. **Use simpler easings for scrolling animations**
   - `linear` or `power1` easings are more performant than `elastic` or `bounce`
   - Consider using `none` for parallax effects

2. **Transform instead of changing dimensions**
   - Use `scale` instead of changing `width`/`height`
   - Use `x`/`y` instead of `left`/`top`

3. **Reduce paint complexity**
   - Avoid `box-shadow` and `filter` during animations
   - Use solid colors with opacity changes instead of gradients

## Memory Management

1. **Clear unused resources**
   ```js
   // Example memory cleanup
   useEffect(() => {
     return () => {
       // Clear any pending animation frames
       if (rafId) cancelAnimationFrame(rafId);
       // Kill all ScrollTrigger instances
       ScrollTrigger.getAll().forEach(trigger => trigger.kill());
       // Clear any timelines
       if (timeline) timeline.kill();
     };
   }, []);
   ```

## Layout Thrashing Prevention

1. **Batch DOM reads and writes separately**
   ```js
   // Bad: Reading and writing interleaved (causes layout thrashing)
   element.style.height = element.clientHeight + 10 + 'px';
   
   // Good: Read all values first, then write
   const height = element.clientHeight + 10;
   element.style.height = height + 'px';
   ```

## Debugging Tools

Consider using these tools to identify performance bottlenecks:

1. **Browser DevTools Performance tab**
   - Record rendering performance during scrolling
   - Look for long frames (red bars) indicating jank

2. **Chrome Layer Panel**
   - Visualize composited layers
   - Check if elements with animations are on separate layers

3. **FPS meter**
   ```js
   // Add this helper for development
   function enableFPSMeter() {
     const meter = document.createElement('div');
     meter.style = 'position:fixed;top:10px;right:10px;z-index:9999;background:#333;color:#fff;padding:5px';
     document.body.appendChild(meter);
     
     let lastTime = performance.now();
     let frames = 0;
     
     function tick() {
       frames++;
       const now = performance.now();
       if (now - lastTime > 1000) {
         meter.textContent = `${frames} FPS`;
         frames = 0;
         lastTime = now;
       }
       requestAnimationFrame(tick);
     }
     
     tick();
     return () => meter.remove();
   }
   
   // In development: enableFPSMeter();
   ```
