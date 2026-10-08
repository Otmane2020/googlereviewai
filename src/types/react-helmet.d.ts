// Minimal type declaration for react-helmet (no official @types compatible with React 19).
// The library manages document head tags client-side; SSR head defaults come from
// src/routes/__root.tsx head().
declare module "react-helmet" {
  import * as React from "react";

  interface HelmetProps {
    children?: React.ReactNode;
    title?: string;
    titleTemplate?: string;
    defaultTitle?: string;
    defer?: boolean;
    encodeSpecialCharacters?: boolean;
    htmlAttributes?: Record<string, string>;
    bodyAttributes?: Record<string, string>;
    onChangeClientState?: (...args: unknown[]) => void;
  }

  export class Helmet extends React.Component<HelmetProps> {
    static renderStatic(): unknown;
  }

  export default Helmet;
}
