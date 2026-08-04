import { Bot, Camera, Hand, MapPinned, MessageCircleMore, Presentation } from "lucide-vue-next";

export const primaryActions = [
  { id: "voice", title: "Voice Assistant", icon: MessageCircleMore, action: "voice" },
  { id: "navigation", title: "Navigation", icon: MapPinned, action: "navigation" },
  { id: "docking", title: "Charge Docking", icon: Bot, action: "docking" },
  { id: "camera", title: "Robot Camera", icon: Camera, action: "camera" },
  { id: "hand", title: "Hand Tracking", icon: Hand, action: "hand" },
  { id: "promo", title: "Promotional Video", icon: Presentation, action: "promo" },
  // { id: "face", title: "Face Interaction", icon: ScanFace, action: "face" },
];
