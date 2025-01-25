interface PermissionDescriptor {
  name: PermissionName | "clipboard-read" | "clipboard-write";
}

interface Window {
  TelegramLoginWidget: {
    onAuth: (user: string) => void;
  };
}
