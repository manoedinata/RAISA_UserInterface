<script setup>
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
</script>

<template>
    <section class="view about-view">
        <div class="about-media">
            <img :src="assetUrl('assets/its-surabaya.jpg')" alt="Institut Teknologi Sepuluh Nopember campus" />
        </div>
        <div class="about-copy">
            <p class="eyebrow">Institut Teknologi Sepuluh Nopember</p>
            <h1>RAISA Humanoid</h1>
            <p>
                RAISA is a humanoid service robot developed at ITS. This interface connects visitors with
                RAISA's information, navigation, media, and interaction capabilities.
            </p>
        </div>
    </section>
</template>
