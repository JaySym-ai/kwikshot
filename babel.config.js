module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { electron: '28' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
