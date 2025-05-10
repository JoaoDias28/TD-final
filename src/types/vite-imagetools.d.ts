/* vite-imagetools.d.ts  (put it anywhere inside src/) */
declare module '*?format=*&as=picture*' {
    import type { Picture } from 'vite-imagetools';
    const content: Picture;
    export default content;
  }
  declare module '*?format=*&as=picture*&sizes=*' {
    import type { Picture } from 'vite-imagetools';
    const content: Picture;
    export default content;
  }
  
  declare module '*?as=picture*' {
    import type { Picture } from 'vite-imagetools';
    const content: Picture;
    export default content;
  }
  declare module '*?format=webp;png&as=picture&sizes=auto' {
    import type { Picture } from 'vite-imagetools';
    const content: Picture;
    export default content;
  }
  declare module '*?format=webp;svg&as=picture&sizes=auto' {
    import type { Picture } from 'vite-imagetools';
    const content: Picture;
    export default content;
  }