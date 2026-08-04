export const TOPICS = {
  battery: { name: "/communication/robot_battery_status", type: "std_msgs/Float32" },
  checkConnection: { name: "/ui/check_connection", type: "std_msgs/Empty" },
  dockingCommand: { name: "/ui/goto_docking", type: "std_msgs/Int8" },
  dockingStatus: { name: "/communication/docking_status", type: "std_msgs/Int8" },
  muteAudio: { name: "/ui/mute_audio", type: "std_msgs/Int8" },
  navigationCommand: { name: "/ui/goto_waypoint", type: "std_msgs/String" },
  navigationStatus: { name: "/communication/nav_status", type: "std_msgs/Int8" },
};

export const promoPlaylist = ["assets/profile_rs.mp4"];
export const handPlaylist = ["assets/profile_rs.mp4"];
