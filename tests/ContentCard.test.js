import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ContentCard from "@/components/ContentCard.vue";

const item = {
    id: "profile",
    title: "Video Profile ITS",
    image: "assets/img-profile-its.jpg",
    source: "assets/profile-its.mp4",
};

describe("ContentCard", () => {
    it("renders content metadata and emits the item on activation", async () => {
        const wrapper = mount(ContentCard, { props: { item } });

        expect(wrapper.text()).toContain(item.title);
        expect(wrapper.get("img").attributes("src")).toBe(item.image);

        await wrapper.get("button").trigger("click");
        expect(wrapper.emitted("open")?.[0]).toEqual([item]);
    });
});
