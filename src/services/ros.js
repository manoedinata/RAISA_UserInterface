import { reactive, readonly } from "vue";

import { getRosUrl } from "./robotConfig";

const state = reactive({
    connected: false,
    error: null,
    url: getRosUrl(),
});

const subscriptions = new Map();
let ros = null;
let reconnectTimer = null;
let reconnectDelay = 3000;

function requireRoslib() {
    if (!window.ROSLIB?.Ros || !window.ROSLIB?.Topic) {
        throw new Error("ROSLIB tidak tersedia");
    }
    return window.ROSLIB;
}

function clearReconnectTimer() {
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
}

function attachSubscriptions() {
    const ROSLIB = requireRoslib();
    for (const subscription of subscriptions.values()) {
        subscription.topic?.unsubscribe?.();
        subscription.topic = new ROSLIB.Topic({
            ros,
            name: subscription.name,
            messageType: subscription.type,
        });
        subscription.topic.subscribe(subscription.callback);
    }
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, reconnectDelay);
}

export function connect() {
    clearReconnectTimer();

    try {
        const ROSLIB = requireRoslib();
        ros?.close?.();
        ros = new ROSLIB.Ros({ url: state.url });

        ros.on("connection", () => {
            state.connected = true;
            state.error = null;
            reconnectDelay = 3000;
            attachSubscriptions();
        });

        ros.on("error", (error) => {
            state.error = error?.message || String(error);
        });

        ros.on("close", () => {
            state.connected = false;
            scheduleReconnect();
        });
    } catch (error) {
        state.connected = false;
        state.error = error.message;
        scheduleReconnect();
    }
}

export function setRosUrl(url) {
    state.url = url;
    connect();
}

export function publish(name, type, message) {
    if (!state.connected || !ros) return false;

    const ROSLIB = requireRoslib();
    new ROSLIB.Topic({ ros, name, messageType: type }).publish(message);
    return true;
}

export function subscribe(name, type, callback) {
    const id = Symbol(name);
    const subscription = { name, type, callback, topic: null };
    subscriptions.set(id, subscription);

    if (state.connected && ros) {
        const ROSLIB = requireRoslib();
        subscription.topic = new ROSLIB.Topic({ ros, name, messageType: type });
        subscription.topic.subscribe(callback);
    }

    return () => {
        const current = subscriptions.get(id);
        current?.topic?.unsubscribe?.();
        subscriptions.delete(id);
    };
}

export function disconnect() {
    clearReconnectTimer();
    for (const subscription of subscriptions.values()) subscription.topic?.unsubscribe?.();
    ros?.close?.();
    ros = null;
    state.connected = false;
}

export const rosState = readonly(state);

connect();
