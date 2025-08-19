#!/usr/bin/env node
// Previsualización CLI de LyricForge
// Uso: node preview.js [Genero] [Emocion] [Tema opcional]

const { generateLyric, lyricToText } = require('./app.js');

const genre = process.argv[2] || 'Pop';
const emotion = process.argv[3] || 'Feliz';
const theme = process.argv.slice(4).join(' ').trim();

const lyric = generateLyric({ genre, emotion, theme });
const out = lyricToText(lyric);
console.log(out);
