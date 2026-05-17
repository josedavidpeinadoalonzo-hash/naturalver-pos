declare const themeConfig: {
  themeColors: Record<
    | "background"
    | "foreground"
    | "surface"
    | "muted"
    | "primary"
    | "secondary"
    | "accent"
    | "border"
    | "success"
    | "warning"
    | "error",
    { light: string; dark: string }
  >;
};

export = themeConfig;
