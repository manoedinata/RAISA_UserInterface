import { afterEach } from "vitest";

const originalRoslib = window.ROSLIB;

afterEach(() => {
    localStorage.clear();
    window.ROSLIB = originalRoslib;
});
