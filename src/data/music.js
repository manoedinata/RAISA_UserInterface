export const musicTracks = [
    { id: "stop", title: "Stop Music", source: null },
    { id: "rek-ayo-rek", source: "assets/music/rek-ayo-rek.mp3" },
    { id: "foreplay", source: "assets/music/Foreplay-Fourplay-Cultura-Jazz.mp3" },
    { id: "hymne-its", source: "assets/music/Hymne-ITS.mp3" },
    { id: "ibu-pertiwi", source: "assets/music/IBU-PERTIWI.mp3" },
    { id: "jazz", source: "assets/music/Jazz-Music.mp3" },
    { id: "liebesleid", source: "assets/music/Liebesleid-(Love's-Sorrow)-Kreisler-Rousseau.mp3" },
    { id: "max-o-man", source: "assets/music/Max-O-Man-Fourplay-Cultura-Jazz.mp3" },
    { id: "ampar-ampar-pisang", source: "assets/music/Ampar Ampar pisang.mp3" },
    { id: "sinners-finale", source: "assets/music/Sinners-Finale.mp3" },
    { id: "yamko-rambe-yamko", source: "assets/music/Yamko Rambe Yamko.mp3" },
    { id: "buruh-tani", source: "assets/music/Buruh-Tani.mp3" },
    { id: "nod-krai", source: "assets/music/Nod Krai.mp3" },
    { id: "mbg", source: "assets/music/mbg.mp3" },
].map((track) => ({
    ...track,
    title:
        track.title ||
        track.source
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "")
            .replaceAll("-", " "),
}));
