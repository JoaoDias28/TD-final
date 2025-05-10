module.exports = {
    plugins: [
      'preset-default',
      {
        name: 'removeDimensions',  // strips width/height
        active: true,
      },
      {
        name: 'removeViewBox',     // we DISABLE this so viewBox stays / shrinks
        active: false,
      },
    ],
  };
  