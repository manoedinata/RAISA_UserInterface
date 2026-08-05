const STOP_MUSIC_LABEL = "- - Stop Music - -";

const MUSIC_LIST = [
    STOP_MUSIC_LABEL,
    "assets/music/rek-ayo-rek.mp3",
    "assets/music/Foreplay-Fourplay-Cultura-Jazz.mp3",
    "assets/music/Hymne-ITS.mp3",
    "assets/music/IBU-PERTIWI.mp3",
    "assets/music/Jazz-Music.mp3",
    "assets/music/Liebesleid-(Love's-Sorrow)-Kreisler-Rousseau.mp3",
    "assets/music/Max-O-Man-Fourplay-Cultura-Jazz.mp3",
    "assets/music/Ampar Ampar pisang.mp3",
    "assets/music/Sinners-Finale.mp3",
    "assets/music/Yamko Rambe Yamko.mp3",
    "assets/music/Buruh-Tani.mp3",
    "assets/music/Nod Krai.mp3",
    "assets/music/mbg.mp3",
];

function getMusicName(filePath) {
    return filePath
        .split("/")
        .pop()
        .replace(/\.[^/.]+$/, "");
}

function findMusicByName(name) {
    return MUSIC_LIST.find((filePath) => getMusicName(filePath) === name);
}

module.exports = {
    MUSIC_LIST,
    STOP_MUSIC_LABEL,
    findMusicByName,
    getMusicName,
};