import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
});

describe("robot configuration", () => {
    it("normalizes bare hosts and rejects invalid values", async () => {
        const { normalizeRobotHost } = await import("@/services/robotConfig");

        expect(normalizeRobotHost("10.209.100.3")).toBe("http://10.209.100.3");
        expect(normalizeRobotHost("https://robot.local/path")).toBe("https://robot.local");
        expect(normalizeRobotHost("http://[invalid")).toBe("");
    });

    it("derives ROS, camera, and waypoint endpoints from one host", async () => {
        const config = await import("@/services/robotConfig");

        config.setRobotHost("https://robot.local");

        expect(config.getRosUrl()).toBe("wss://robot.local:9090");
        expect(config.getCameraUrl()).toBe(
            "https://robot.local:8080/stream?topic=/vision/image_display",
        );
        expect(config.getRobotHttpUrl("/reeman/position")).toBe("https://robot.local/reeman/position");
    });

    it("prefers the query string over persisted and default hosts", async () => {
        localStorage.setItem("raisa.robotHost", "http://stored.local");
        window.history.replaceState({}, "", "/?robot=robot-query.local");

        const { getRobotHost } = await import("@/services/robotConfig");

        expect(getRobotHost()).toBe("http://robot-query.local");
    });
});
