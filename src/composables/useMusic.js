import { computed, onBeforeUnmount, ref } from "vue";

import { musicTracks } from "@/data/music";
import { platform } from "@/services/platform";

export function useMusic() {
    const audio = new Audio();
    const selectedSource = ref(null);
    const playing = ref(false);
    const error = ref("");

    audio.addEventListener("ended", () => {
        playing.value = false;
    });

    function applySource(source) {
        selectedSource.value = source || null;
        audio.src = source || "";
    }

    async function restore() {
        try {
            applySource(await platform.getLastMusic());
        } catch (restoreError) {
            error.value = restoreError.message;
        }
    }

    async function select(source) {
        audio.pause();
        playing.value = false;
        applySource(source);
        await platform.saveLastMusic(source);

        if (source) {
            try {
                await audio.play();
                playing.value = true;
            } catch (playError) {
                error.value = playError.message;
            }
        }
    }

    async function toggle() {
        if (!selectedSource.value) return;
        if (audio.paused) {
            await audio.play();
            playing.value = true;
        } else {
            audio.pause();
            playing.value = false;
        }
    }

    onBeforeUnmount(() => {
        audio.pause();
        audio.src = "";
    });

    restore();

    return {
        tracks: musicTracks,
        selectedSource,
        selectedTitle: computed(
            () => musicTracks.find((track) => track.source === selectedSource.value)?.title || "Music",
        ),
        playing,
        error,
        select,
        toggle,
    };
}
